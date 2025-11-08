/**
 * Auth.gs
 * ระบบ Authentication และ Token Management
 * 
 * ไม่ใช้ IIFE - เข้าใจง่าย อ่านง่าย
 * รวม Token Management เข้าด้วยกัน (    const tokenData = {
      uuid: Helpers.generateUUID(),
      token: token,
      user_type: userType,
      user_id: user.uuid,
      user_identifier: userType === 'admin' ? user.username : user.id13,
      app_key: '', // จะถูกตั้งค่าตอน connect
      hrms_id: user.hrms_id || null,
      expires_at: expiresAt.toISOString(),
      revoked: false,
      revoked_at: null,
      last_used: Helpers.now(),
      created_at: Helpers.now()
    };ule อีก)
 */

// ====================================
// LOGIN FUNCTIONS
// ====================================

/**
 * Login (รองรับทั้ง admin และ user)
 * @param {Object} credentials - {username, password} หรือ {id13, password}
 * @param {string} userType - 'admin' หรือ 'user'
 * @returns {Object} {success: boolean, user: Object, message: string}
 */
function Auth_login(credentials, userType) {
  try {
    if (!credentials || !credentials.password) {
      return Helpers.response(false, null, 'Credentials required');
    }
    
    if (userType === 'admin') {
      return _loginAdmin(credentials);
    } else if (userType === 'user') {
      return _loginUser(credentials);
    }
    
    return Helpers.response(false, null, 'Invalid user type');
    
  } catch (error) {
    Logger.log('Auth_login error: ' + error.toString());
    return Helpers.response(false, null, 'Login failed: ' + error.message);
  }
}

/**
 * Login สำหรับ admin
 * @private
 */
function _loginAdmin(credentials) {
  const username = credentials.username;
  const password = credentials.password;
  
  if (!username) {
    return Helpers.response(false, null, 'Username required');
  }
  
  // ตรวจสอบ rate limit
  const rateLimit = Security.checkRateLimit(username, 'LOGIN');
  if (!rateLimit.allowed) {
    return Helpers.response(false, null, rateLimit.message);
  }
  
  // ลอง cache ก่อน (เฉพาะข้อมูลพื้นฐาน ไม่รวม password)
  let admin = Cache.getAdmin(username);
  
  // ถ้าไม่มี cache หรือต้องการ verify password ต้อง query
  if (!admin) {
    const result = Sheet.read('admins', { username: username });
    
    if (result.rows.length === 0) {
      return Helpers.response(false, null, 'Admin not found');
    }
    
    admin = result.rows[0];
  } else {
    // ถ้ามี cache ต้อง query เพื่อเอา password มา verify
    const result = Sheet.read('admins', { username: username });
    if (result.rows.length > 0) {
      admin = result.rows[0];
    }
  }
  
  // ตรวจสอบสถานะ
  if (admin.status !== 'active') {
    return Helpers.response(false, null, 'Account is inactive');
  }
  
  // ตรวจสอบรหัสผ่าน
  const hashedPassword = Helpers.hashPassword(password);
  if (admin.password !== hashedPassword) {
    // Login ล้มเหลว - ไม่ reset rate limit
    return Helpers.response(false, null, 'Invalid credentials');
  }
  
  // Login สำเร็จ - reset rate limit
  Security.resetRateLimit(username, 'LOGIN');
  
  // อัปเดต updated_at (ไม่มี last_login field แล้ว)
  Sheet.updateField('admins', admin.uuid, 'updated_at', Helpers.now());
  
  // ลบ password ออกจาก response และ cache
  delete admin.password;
  
  // Cache admin data (ไม่รวม password)
  Cache.setAdmin(username, admin);
  
  return Helpers.response(true, admin, 'Login successful');
}

/**
 * Login สำหรับ user
 * @private
 */
function _loginUser(credentials) {
  const id13 = credentials.id13 || credentials.username;
  const password = credentials.password;
  
  if (!id13) {
    return Helpers.response(false, null, 'ID13 required');
  }
  
  // ตรวจสอบรูปแบบ ID13
  if (!Helpers.validateId13(id13)) {
    return Helpers.response(false, null, 'Invalid ID13 format');
  }
  
  // ตรวจสอบ rate limit
  const rateLimit = Security.checkRateLimit(id13, 'LOGIN');
  if (!rateLimit.allowed) {
    return Helpers.response(false, null, rateLimit.message);
  }
  
  // ลอง cache ก่อน
  let user = Cache.getUser(id13);
  
  // ถ้าไม่มี cache หรือต้องการ verify password ต้อง query
  if (!user) {
    const result = Sheet.read('users', { id13: id13 });
    
    if (result.rows.length === 0) {
      return Helpers.response(false, null, 'User not found');
    }
    
    user = result.rows[0];
  } else {
    // ถ้ามี cache ต้อง query เพื่อเอา password มา verify
    const result = Sheet.read('users', { id13: id13 });
    if (result.rows.length > 0) {
      user = result.rows[0];
    }
  }
  
  // ตรวจสอบสถานะ
  if (!user.active) {
    return Helpers.response(false, null, 'Account is inactive');
  }
  
  // ตรวจสอบรหัสผ่าน
  const hashedPassword = Helpers.hashPassword(password);
  if (user.password !== hashedPassword) {
    // Login ล้มเหลว - ไม่ reset rate limit
    return Helpers.response(false, null, 'Invalid credentials');
  }
  
  // Login สำเร็จ - reset rate limit
  Security.resetRateLimit(id13, 'LOGIN');
  
  // ลบ password ออกจาก response
  delete user.password;
  
  // Cache user data (ไม่รวม password)
  Cache.setUser(id13, user);
  
  return Helpers.response(true, user, 'Login successful');
}

// ====================================
// TOKEN MANAGEMENT
// ====================================

/**
 * สร้าง token สำหรับ user ที่ login สำเร็จ
 * @param {Object} user - ข้อมูล user/admin
 * @param {string} userType - 'admin' หรือ 'user'
 * @returns {Object} {token: string, expiresAt: string}
 */
function Auth_createToken(user, userType) {
  try {
    // ตรวจสอบ rate limit
    const identifier = userType === 'admin' ? user.username : user.id13;
    const rateLimit = Security.checkRateLimit(identifier, 'TOKEN_CREATE');
    
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.message);
    }
    
    const token = Helpers.generateToken();
    const expiresAt = Helpers.expiresIn24Hours();
    
    const tokenData = {
      uuid: Helpers.generateUUID(),
      token: token,
      user_type: userType,
      user_id: user.uuid,
      user_identifier: identifier,
      app_key: '', // จะถูกตั้งค่าตอน connect
      hrms_id: user.hrms_id || null,
      expires_at: expiresAt.toISOString(),
      revoked: false,
      revoked_at: null,
      last_used: Helpers.now(),
      created_at: Helpers.now()
    };
    
    Sheet.append('tokens', tokenData);
    
    // Cache token
    Cache.setToken(token, tokenData);
    
    return {
      token: token,
      expiresAt: expiresAt.toISOString()
    };
    
  } catch (error) {
    Logger.log('Auth_createToken error: ' + error.toString());
    throw error;
  }
}

/**
 * ตรวจสอบ token
 * @param {string} token - Token ที่ต้องการตรวจสอบ
 * @param {string} appKey - App key (optional)
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function Auth_validateToken(token, appKey) {
  try {
    if (!token) {
      return Helpers.response(false, null, 'Token required');
    }
    
    // ตรวจสอบ token format
    if (!Security.validateTokenFormat(token)) {
      return Helpers.response(false, null, 'Invalid token format');
    }
    
    // ลอง cache ก่อน
    let tokenData = Cache.getToken(token);
    
    // ถ้าไม่มี cache ต้อง query
    if (!tokenData) {
      const result = Sheet.read('tokens', { token: token });
      
      if (result.rows.length === 0) {
        return Helpers.response(false, null, 'Invalid token');
      }
      
      tokenData = result.rows[0];
    }
    
    // ตรวจสอบว่าถูก revoke หรือไม่
    if (tokenData.revoked) {
      Cache.remove(Cache.tokenKey(token)); // ลบ cache
      return Helpers.response(false, null, 'Token has been revoked');
    }
    
    // ตรวจสอบว่าหมดอายุหรือไม่
    if (Security.isTokenExpired(tokenData.expires_at)) {
      Cache.remove(Cache.tokenKey(token)); // ลบ cache
      return Helpers.response(false, null, 'Token has expired');
    }
    
    // อัปเดต app_key ถ้ายังไม่มี
    if (!tokenData.app_key && appKey) {
      Sheet.updateField('tokens', tokenData.uuid, 'app_key', appKey);
      tokenData.app_key = appKey;
      Cache.setToken(token, tokenData); // อัปเดต cache
    }
    
    // อัปเดต last_used (ไม่บ่อยเกินไป)
    const lastUsed = new Date(tokenData.last_used);
    const now = new Date();
    const diffMinutes = (now - lastUsed) / 1000 / 60;
    
    // อัปเดตทุก 5 นาที เพื่อลด write operations
    if (diffMinutes > 5) {
      Sheet.updateField('tokens', tokenData.uuid, 'last_used', Helpers.now());
      tokenData.last_used = Helpers.now();
      Cache.setToken(token, tokenData); // อัปเดต cache
    }
    
    return Helpers.response(true, tokenData, 'Valid token');
    
  } catch (error) {
    Logger.log('Auth_validateToken error: ' + error.toString());
    return Helpers.response(false, null, 'Token validation failed');
  }
}

/**
 * Revoke token
 * @param {string} token - Token ที่ต้องการ revoke
 * @returns {Object} {success: boolean, message: string}
 */
function Auth_revokeToken(token) {
  try {
    const result = Sheet.read('tokens', { token: token });
    
    if (result.rows.length === 0) {
      return Helpers.response(false, null, 'Token not found');
    }
    
    const tokenData = result.rows[0];
    
    Sheet.update('tokens', tokenData.uuid, {
      revoked: true,
      revoked_at: Helpers.now()
    });
    
    // ลบจาก cache
    Cache.remove(Cache.tokenKey(token));
    
    return Helpers.response(true, null, 'Token revoked successfully');
    
  } catch (error) {
    Logger.log('Auth_revokeToken error: ' + error.toString());
    return Helpers.response(false, null, 'Failed to revoke token');
  }
}

/**
 * ทำความสะอาด token ที่หมดอายุ (เรียกใช้ใน maintenance)
 * @returns {Object} {success: boolean, count: number, message: string}
 */
function Auth_cleanupExpiredTokens() {
  try {
    const sheet = Sheet.getSheet('tokens');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return Helpers.response(true, { count: 0 }, 'No tokens to clean');
    }
    
    const headers = data[0];
    const expiresIndex = headers.indexOf('expires_at');
    const now = new Date();
    const rowsToDelete = [];
    
    // หา token ที่หมดอายุ (iterate ย้อนกลับเพื่อลบได้ง่าย)
    for (let i = data.length - 1; i >= 1; i--) {
      const expiresAt = new Date(data[i][expiresIndex]);
      if (expiresAt < now) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // ลบ rows
    rowsToDelete.forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
    });
    
    Logger.log('Cleaned up ' + rowsToDelete.length + ' expired tokens');
    
    return Helpers.response(
      true,
      { count: rowsToDelete.length },
      'Cleaned up ' + rowsToDelete.length + ' expired tokens'
    );
    
  } catch (error) {
    Logger.log('Auth_cleanupExpiredTokens error: ' + error.toString());
    return Helpers.response(false, null, 'Cleanup failed');
  }
}

// ====================================
// APP KEY VALIDATION
// ====================================

/**
 * ตรวจสอบ App Key
 * @param {string} appKey - App key
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function Auth_validateAppKey(appKey) {
  try {
    if (!appKey) {
      return Helpers.response(false, null, 'App key required');
    }
    
    // ค้นหา application
    const result = Sheet.read('applications', { app_key: appKey });
    
    if (result.rows.length === 0) {
      return Helpers.response(false, null, 'Invalid app key');
    }
    
    const app = result.rows[0];
    
    // ตรวจสอบสถานะ
    if (app.status !== 'active') {
      return Helpers.response(false, null, 'Application is inactive');
    }
    
    return Helpers.response(true, app, 'Valid app key');
    
  } catch (error) {
    Logger.log('Auth_validateAppKey error: ' + error.toString());
    return Helpers.response(false, null, 'App key validation failed');
  }
}

// ====================================
// EXPORT
// ====================================

const Auth = {
  login: Auth_login,
  createToken: Auth_createToken,
  validateToken: Auth_validateToken,
  revokeToken: Auth_revokeToken,
  cleanupExpiredTokens: Auth_cleanupExpiredTokens,
  validateAppKey: Auth_validateAppKey
};
