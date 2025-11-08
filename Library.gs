/**
 * Library.gs
 * Public API - Entry Point ของ Library
 * 
 * ฟังก์ชันหลัก 2 ตัว:
 * - request_token() - ขอ token เพื่อ authentication
 * - connect() - เชื่อมต่อกับ library และรับ Connection object
 */

// ====================================
// PUBLIC API FUNCTIONS
// ====================================

/**
 * ขอ token สำหรับ authentication
 * 
 * @param {Object} credentials - ข้อมูลการเข้าสู่ระบบ
 *   - สำหรับ admin: {username: string, password: string}
 *   - สำหรับ user: {id13: string, password: string}
 * @param {string} userType - ประเภทผู้ใช้ ('admin' หรือ 'user')
 * 
 * @returns {Object} Response object
 *   - success: boolean
 *   - token: string (ถ้าสำเร็จ)
 *   - expiresAt: string (ถ้าสำเร็จ)
 *   - message: string
 * 
 * @example
 * // Admin login
 * const result = request_token({
 *   username: 'admin',
 *   password: 'password123'
 * }, 'admin');
 * 
 * // User login
 * const result = request_token({
 *   id13: '1234567890123',
 *   password: 'password123'
 * }, 'user');
 */
function request_token(credentials, userType) {
  try {
    // 1. Login
    const loginResult = Auth.login(credentials, userType);
    
    if (!loginResult.success) {
      return loginResult;
    }
    
    // 2. สร้าง token
    const tokenInfo = Auth.createToken(loginResult.data, userType);
    
    // 3. Return response
    return {
      success: true,
      token: tokenInfo.token,
      expiresAt: tokenInfo.expiresAt,
      message: 'Authentication successful'
    };
    
  } catch (error) {
    Logger.log('request_token error: ' + error.toString());
    return Helpers.response(false, null, 'Authentication failed: ' + error.message);
  }
}

/**
 * เชื่อมต่อกับ library ด้วย app key และ token
 * 
 * @param {string} appKey - App key ของ application
 * @param {string} token - Token ที่ได้จาก request_token()
 * 
 * @returns {Object} Connection object หรือ error
 *   - ถ้าสำเร็จ: Connection object พร้อม methods (create, read, update, delete, info, disconnect)
 *   - ถ้าล้มเหลว: {success: false, message: string}
 * 
 * @example
 * const conn = connect('app_abc123', 'token_xyz789');
 * 
 * if (conn.success === false) {
 *   console.log('Connection failed:', conn.message);
 * } else {
 *   const result = conn.create('users', {
 *     name: 'John Doe',
 *     id13: '1234567890123',
 *     password: 'password123'
 *   });
 * }
 */
function connect(appKey, token) {
  try {
    // 1. ตรวจสอบ app key
    const appResult = Auth.validateAppKey(appKey);
    
    if (!appResult.success) {
      return appResult;
    }
    
    // 2. ตรวจสอบ token
    const tokenResult = Auth.validateToken(token, appKey);
    
    if (!tokenResult.success) {
      return tokenResult;
    }
    
    // 3. สร้าง connection object
    return new Connection(tokenResult.data, appResult.data);
    
  } catch (error) {
    Logger.log('connect error: ' + error.toString());
    return Helpers.response(false, null, 'Connection failed: ' + error.message);
  }
}

// ====================================
// CONNECTION CLASS
// ====================================

/**
 * Connection Object
 * ให้บริการ CRUD operations และข้อมูล session
 * 
 * @constructor
 * @param {Object} tokenData - ข้อมูล token
 * @param {Object} appData - ข้อมูล application
 */
function Connection(tokenData, appData) {
  // Session information
  this.session = {
    user_type: tokenData.user_type,
    user_id: tokenData.user_id,
    user_identifier: tokenData.user_identifier,
    hrms_id: tokenData.hrms_id,
    app_key: appData.app_key,
    app_name: appData.app_name
  };
  
  // Success flag
  this.success = true;
  
  /**
   * สร้างข้อมูลใหม่
   * 
   * @param {string} tableName - ชื่อตาราง
   * @param {Object} data - ข้อมูลที่จะสร้าง
   * @returns {Object} {success: boolean, data: Object, message: string}
   * 
   * @example
   * const result = conn.create('users', {
   *   name: 'John Doe',
   *   id13: '1234567890123',
   *   password: 'password123',
   *   hrms_id: 'org-uuid-123'
   * });
   */
  this.create = function(tableName, data) {
    return Database.create(tableName, data, this.session);
  };
  
  /**
   * อ่านข้อมูล
   * 
   * @param {string} tableName - ชื่อตาราง
   * @param {Object} filters - เงื่อนไขการกรอง (optional)
   * @returns {Object} {success: boolean, data: Array, message: string}
   * 
   * @example
   * // อ่านข้อมูลทั้งหมด
   * const all = conn.read('users');
   * 
   * // อ่านด้วยเงื่อนไข
   * const active = conn.read('users', { active: true });
   */
  this.read = function(tableName, filters) {
    return Database.read(tableName, filters, this.session);
  };
  
  /**
   * อัปเดตข้อมูล
   * 
   * @param {string} tableName - ชื่อตาราง
   * @param {string} uuid - UUID ของข้อมูลที่จะอัปเดต
   * @param {Object} updates - ข้อมูลที่จะอัปเดต
   * @returns {Object} {success: boolean, data: Object, message: string}
   * 
   * @example
   * const result = conn.update('users', 'user-uuid-123', {
   *   name: 'Jane Doe',
   *   active: true
   * });
   */
  this.update = function(tableName, uuid, updates) {
    return Database.update(tableName, uuid, updates, this.session);
  };
  
  /**
   * ลบข้อมูล (Soft Delete)
   * 
   * @param {string} tableName - ชื่อตาราง
   * @param {string} uuid - UUID ของข้อมูลที่จะลบ
   * @returns {Object} {success: boolean, message: string}
   * 
   * @example
   * const result = conn.delete('users', 'user-uuid-123');
   */
  this.delete = function(tableName, uuid) {
    return Database.delete(tableName, uuid, this.session);
  };
  
  /**
   * ดูข้อมูล session ปัจจุบัน
   * 
   * @returns {Object} Session information
   * 
   * @example
   * const info = conn.info();
   * console.log('User type:', info.user_type);
   * console.log('App name:', info.app_name);
   */
  this.info = function() {
    return {
      success: true,
      data: this.session,
      message: 'Connection info'
    };
  };
  
  /**
   * ยกเลิกการเชื่อมต่อ (revoke token)
   * 
   * @returns {Object} {success: boolean, message: string}
   * 
   * @example
   * const result = conn.disconnect();
   */
  this.disconnect = function() {
    // หา token จาก session
    const tokenResult = Sheet.read('tokens', {
      user_id: this.session.user_id,
      app_key: this.session.app_key
    });
    
    if (tokenResult.rows.length > 0) {
      const token = tokenResult.rows[0].token;
      return Auth.revokeToken(token);
    }
    
    return Helpers.response(false, null, 'Token not found');
  };
}

// ====================================
// HELPER FUNCTIONS (ใช้ภายใน Library)
// ====================================

/**
 * ตรวจสอบว่า library พร้อมใช้งานหรือไม่
 * @returns {Object} {success: boolean, message: string, details: Object}
 */
function checkLibraryHealth() {
  try {
    const results = {
      spreadsheet: false,
      sheets: [],
      admins: 0,
      applications: 0
    };
    
    // ตรวจสอบ spreadsheet
    try {
      const ss = Sheet.getSpreadsheet();
      results.spreadsheet = true;
      results.spreadsheetName = ss.getName();
    } catch (e) {
      return Helpers.response(false, results, 'Spreadsheet not found');
    }
    
    // ตรวจสอบ sheets
    const requiredSheets = ['users', 'organizations', 'positions', 'ranks', 'admins', 'applications', 'tokens', 'logs'];
    requiredSheets.forEach(function(sheetName) {
      if (Sheet.exists(sheetName)) {
        results.sheets.push(sheetName);
      }
    });
    
    // นับ admins และ applications
    try {
      const adminsResult = Sheet.read('admins', { active: true });
      results.admins = adminsResult.rows.length;
      
      const appsResult = Sheet.read('applications', { active: true });
      results.applications = appsResult.rows.length;
    } catch (e) {
      // Ignore errors
    }
    
    return Helpers.response(true, results, 'Library is healthy');
    
  } catch (error) {
    Logger.log('checkLibraryHealth error: ' + error.toString());
    return Helpers.response(false, null, 'Health check failed: ' + error.message);
  }
}

/**
 * รับเวอร์ชันของ library
 * @returns {string} เวอร์ชัน
 */
function getLibraryVersion() {
  return '2.0.0-simplified';
}
