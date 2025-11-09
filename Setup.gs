/**
 * Setup.gs
 * ฟังก์ชันสำหรับติดตั้งและบำรุงรักษาระบบ
 * 
 * ใช้งานง่าย ไม่ซับซ้อน
 */

// ====================================
// SETUP FUNCTIONS
// ====================================

/**
 * ติดตั้ง library ครั้งแรก
 * สร้าง sheets ทั้งหมดตาม schema
 * 
 * @returns {Object} {success: boolean, message: string, details: Object}
 * 
 * @example
 * function runSetup() {
 *   const result = setupLibrary();
 *   Logger.log(result);
 * }
 */
function setupLibrary() {
  try {
    Logger.log('========================================');
    Logger.log('Starting library setup...');
    Logger.log('========================================');
    
    // 1. บันทึก Spreadsheet ID ลง Script Properties
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const spreadsheetId = ss.getId();
    Sheet.setSpreadsheetId(spreadsheetId);
    Logger.log('✅ Saved Spreadsheet ID: ' + spreadsheetId);
    
    // 2. สร้าง sheets ทั้งหมด
    const result = Sheet.initializeAll();
    
    if (!result.success) {
      return result;
    }
    
    // 3. สร้าง default config
    Logger.log('Setting up default configuration...');
    initializeDefaultConfig();
    
    Logger.log('✅ Setup completed successfully!');
    Logger.log('Spreadsheet: ' + ss.getName());
    Logger.log('Spreadsheet ID: ' + spreadsheetId);
    Logger.log('URL: ' + ss.getUrl());
    Logger.log('========================================');
    Logger.log('Next steps:');
    Logger.log('1. Run: createFirstAdmin("username", "password", "name")');
    Logger.log('2. Run: registerApp("appname", "description")');
    Logger.log('3. Deploy as Library and share with your team');
    Logger.log('========================================');
    
    return {
      success: true,
      data: {
        spreadsheet_id: spreadsheetId,
        spreadsheet_name: ss.getName(),
        spreadsheet_url: ss.getUrl()
      },
      message: 'Library setup completed',
      details: {
        spreadsheet: ss.getName(),
        url: ss.getUrl(),
        sheets: Object.keys(Sheet.SCHEMA)
      }
    };
    
  } catch (error) {
    Logger.log('❌ Setup failed: ' + error.toString());
    return Helpers.response(false, null, 'Setup failed: ' + error.message);
  }
}

/**
 * สร้าง config เริ่มต้น
 * @private
 */
function initializeDefaultConfig() {
  try {
    const defaultConfigs = [
      {
        key: 'library_version',
        value: '2.0.0',
        description: 'เวอร์ชันของ library'
      },
      {
        key: 'token_expiry_hours',
        value: '24',
        description: 'จำนวนชั่วโมงก่อน token หมดอายุ'
      },
      {
        key: 'log_retention_days',
        value: '90',
        description: 'จำนวนวันที่เก็บ log (เก่ากว่านี้จะถูกลบ)'
      },
      {
        key: 'password_min_length',
        value: '6',
        description: 'ความยาวขั้นต่ำของรหัสผ่าน'
      },
      {
        key: 'system_name',
        value: 'DTP NST Library',
        description: 'ชื่อระบบ'
      },
      {
        key: 'timezone',
        value: 'Asia/Bangkok',
        description: 'เขตเวลา'
      }
    ];
    
    defaultConfigs.forEach(function(config) {
      Helpers.setConfig(config.key, config.value, config.description);
    });
    
    Logger.log('✅ Default config initialized');
    
  } catch (error) {
    Logger.log('⚠️  Config initialization failed: ' + error.toString());
    // Don't throw - setup should continue even if config fails
  }
}

/**
 * สร้าง admin คนแรก
 * 
 * @param {string} username - ชื่อผู้ใช้
 * @param {string} password - รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
 * @param {string} name - ชื่อเต็ม
 * @returns {Object} {success: boolean, data: Object, message: string}
 * 
 * @example
 * function createAdmin() {
 *   const result = createFirstAdmin('admin', 'admin123', 'System Admin');
 *   Logger.log(result);
 * }
 */
function createFirstAdmin(username, password, fullName, email) {
  try {
    // ตรวจสอบ input
    if (!username || !password || !fullName) {
      return Helpers.response(false, null, 'Username, password, and name are required');
    }
    
    // ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    const existing = Sheet.read('admins', { username: username });
    if (existing.rows.length > 0) {
      return Helpers.response(false, null, 'Admin with this username already exists');
    }
    
    // แยกชื่อ-นามสกุล (ถ้าไม่มีช่องว่าง ใช้ชื่อเดียวทั้งหมด)
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || '-';
    
    // สร้าง admin
    const adminData = {
      uuid: Helpers.generateUUID(),
      username: username,
      password: Helpers.hashPassword(password),
      email: email || username + '@example.com',
      first_name: firstName,
      last_name: lastName,
      status: 'active',
      created_at: Helpers.now(),
      updated_at: Helpers.now()
    };
    
    const result = Sheet.append('admins', adminData);
    
    if (!result.success) {
      return result;
    }
    
    Logger.log('✅ Admin created successfully!');
    Logger.log('Username: ' + username);
    Logger.log('UUID: ' + adminData.uuid);
    
    return Helpers.response(
      true,
      { 
        uuid: adminData.uuid, 
        username: username, 
        first_name: firstName,
        last_name: lastName,
        email: adminData.email
      },
      'Admin created successfully'
    );
    
  } catch (error) {
    Logger.log('createFirstAdmin error: ' + error.toString());
    return Helpers.response(false, null, 'Failed to create admin: ' + error.message);
  }
}

/**
 * ลงทะเบียน application
 * 
 * @param {string} appname - ชื่อ application
 * @param {string} description - คำอธิบาย (optional)
 * @param {string} createdBy - ผู้สร้าง (optional)
 * @returns {Object} {success: boolean, data: Object, message: string}
 * 
 * @example
 * function registerMyApp() {
 *   const result = registerApp('My App', 'ระบบจัดการข้อมูล');
 *   Logger.log(result);
 *   Logger.log('App Key:', result.data.app_key);
 * }
 */
function registerApp(appName, description) {
  try {
    if (!appName) {
      return Helpers.response(false, null, 'App name is required');
    }
    
    // ตรวจสอบว่ามี app ชื่อนี้อยู่แล้วหรือไม่
    const existing = Sheet.read('applications', { app_name: appName });
    if (existing.rows.length > 0) {
      return Helpers.response(false, null, 'Application with this name already exists');
    }
    
    // สร้าง app key และ secret
    const appKey = Helpers.generateAppKey();
    const appSecret = Helpers.generateToken();
    
    const appData = {
      uuid: Helpers.generateUUID(),
      app_name: appName,
      app_key: appKey,
      app_secret: appSecret,
      status: 'active',
      created_at: Helpers.now(),
      updated_at: Helpers.now()
    };
    
    const result = Sheet.append('applications', appData);
    
    if (!result.success) {
      return result;
    }
    
    Logger.log('✅ Application registered successfully!');
    Logger.log('App Name: ' + appName);
    Logger.log('App Key: ' + appKey);
    Logger.log('App Secret: ' + appSecret);
    Logger.log('UUID: ' + appData.uuid);
    Logger.log('⚠️  IMPORTANT: Save these credentials securely!');
    
    return Helpers.response(
      true,
      {
        uuid: appData.uuid,
        app_name: appName,
        app_key: appKey,
        app_secret: appSecret
      },
      'Application registered successfully'
    );
    
  } catch (error) {
    Logger.log('registerApp error: ' + error.toString());
    return Helpers.response(false, null, 'Failed to register app: ' + error.message);
  }
}

// ====================================
// MAINTENANCE FUNCTIONS
// ====================================

/**
 * ทำความสะอาดระบบ (ควรรันเป็นประจำ)
 * - ลบ token ที่หมดอายุ
 * - ลบ log เก่า (เก็บไว้ 90 วัน)
 * 
 * @returns {Object} {success: boolean, message: string, details: Object}
 * 
 * @example
 * function runMaintenance() {
 *   const result = dailyMaintenance();
 *   Logger.log(result);
 * }
 */
function dailyMaintenance() {
  try {
    Logger.log('========================================');
    Logger.log('Starting daily maintenance...');
    Logger.log('========================================');
    
    const results = {
      tokens_cleaned: 0,
      logs_cleaned: 0
    };
    
    // 1. ลบ token ที่หมดอายุ
    const tokenResult = Auth.cleanupExpiredTokens();
    if (tokenResult.success && tokenResult.data) {
      results.tokens_cleaned = tokenResult.data.count;
      Logger.log('✅ Cleaned ' + results.tokens_cleaned + ' expired tokens');
    }
    
    // 2. ลบ log เก่า (เก็บไว้ 90 วัน)
    const logResult = _cleanOldLogs(90);
    if (logResult.success && logResult.data) {
      results.logs_cleaned = logResult.data.count;
      Logger.log('✅ Cleaned ' + results.logs_cleaned + ' old logs');
    }
    
    Logger.log('========================================');
    Logger.log('Maintenance completed!');
    Logger.log('========================================');
    
    return Helpers.response(
      true,
      results,
      'Maintenance completed successfully'
    );
    
  } catch (error) {
    Logger.log('❌ Maintenance failed: ' + error.toString());
    return Helpers.response(false, null, 'Maintenance failed: ' + error.message);
  }
}

/**
 * ลบ log เก่า
 * @private
 */
function _cleanOldLogs(daysToKeep) {
  try {
    daysToKeep = daysToKeep || 90;
    
    const sheet = Sheet.getSheet('logs');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return Helpers.response(true, { count: 0 }, 'No logs to clean');
    }
    
    const headers = data[0];
    const createdIndex = headers.indexOf('created_at');
    
    if (createdIndex === -1) {
      return Helpers.response(false, null, 'created_at column not found');
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const rowsToDelete = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const createdAt = new Date(data[i][createdIndex]);
      if (createdAt < cutoffDate) {
        rowsToDelete.push(i + 1);
      }
    }
    
    rowsToDelete.forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
    });
    
    return Helpers.response(
      true,
      { count: rowsToDelete.length },
      'Cleaned ' + rowsToDelete.length + ' old logs'
    );
    
  } catch (error) {
    Logger.log('_cleanOldLogs error: ' + error.toString());
    return Helpers.response(false, null, 'Failed to clean logs');
  }
}

// ====================================
// DIAGNOSTIC FUNCTIONS
// ====================================

/**
 * ตรวจสอบสถานะของระบบ
 * 
 * @returns {Object} {success: boolean, data: Object, message: string}
 * 
 * @example
 * function checkSystem() {
 *   const result = checkSetup();
 *   Logger.log(result);
 * }
 */
function checkSetup() {
  try {
    const results = {
      spreadsheet: 'Not found',
      sheets: [],
      admins: 0,
      applications: 0,
      users: 0,
      organizations: 0,
      active_tokens: 0,
      issues: []
    };
    
    // 1. ตรวจสอบ spreadsheet
    try {
      const ss = Sheet.getSpreadsheet();
      results.spreadsheet = ss.getName();
    } catch (e) {
      results.issues.push('Spreadsheet not found or not accessible');
      return Helpers.response(false, results, 'Setup incomplete');
    }
    
    // 2. ตรวจสอบ sheets
    const requiredSheets = Object.keys(Sheet.SCHEMA);
    requiredSheets.forEach(function(sheetName) {
      if (Sheet.exists(sheetName)) {
        results.sheets.push(sheetName);
      } else {
        results.issues.push('Sheet missing: ' + sheetName);
      }
    });
    
    // 3. นับข้อมูล
    try {
      results.admins = Sheet.read('admins', { active: true }).rows.length;
      results.applications = Sheet.read('applications', { active: true }).rows.length;
      results.users = Sheet.read('users', { active: true }).rows.length;
      results.organizations = Sheet.read('organizations', { active: true }).rows.length;
      
      // นับ token ที่ยังไม่หมดอายุ
      const tokens = Sheet.read('tokens').rows;
      const now = new Date();
      results.active_tokens = tokens.filter(function(t) {
        return !t.revoked && new Date(t.expires_at) > now;
      }).length;
      
    } catch (e) {
      results.issues.push('Error reading data: ' + e.message);
    }
    
    // 4. ตรวจสอบปัญหา
    if (results.admins === 0) {
      results.issues.push('No admin users found. Run createFirstAdmin()');
    }
    
    if (results.applications === 0) {
      results.issues.push('No applications registered. Run registerApp()');
    }
    
    // 5. สรุปผล
    Logger.log('========================================');
    Logger.log('SYSTEM STATUS');
    Logger.log('========================================');
    Logger.log('Spreadsheet: ' + results.spreadsheet);
    Logger.log('Sheets: ' + results.sheets.length + '/' + requiredSheets.length);
    Logger.log('Admins: ' + results.admins);
    Logger.log('Applications: ' + results.applications);
    Logger.log('Users: ' + results.users);
    Logger.log('Organizations: ' + results.organizations);
    Logger.log('Active Tokens: ' + results.active_tokens);
    
    if (results.issues.length > 0) {
      Logger.log('========================================');
      Logger.log('ISSUES FOUND:');
      results.issues.forEach(function(issue, index) {
        Logger.log((index + 1) + '. ' + issue);
      });
    } else {
      Logger.log('========================================');
      Logger.log('✅ All checks passed!');
    }
    Logger.log('========================================');
    
    const success = results.issues.length === 0;
    const message = success ? 'Setup is complete' : 'Setup has issues';
    
    return Helpers.response(success, results, message);
    
  } catch (error) {
    Logger.log('checkSetup error: ' + error.toString());
    return Helpers.response(false, null, 'Check failed: ' + error.message);
  }
}

/**
 * ดูสถิติการใช้งาน
 * 
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function getStatistics() {
  try {
    const stats = {
      users: { total: 0, active: 0, inactive: 0 },
      admins: { total: 0, active: 0, inactive: 0 },
      applications: { total: 0, active: 0, inactive: 0 },
      tokens: { total: 0, active: 0, expired: 0, revoked: 0 },
      logs: { total: 0, today: 0 },
      organizations: { total: 0 },
      positions: { total: 0 },
      ranks: { total: 0 }
    };
    
    // Users (มี active field)
    const users = Sheet.read('users').rows;
    stats.users.total = users.length;
    stats.users.active = users.filter(function(row) { return row.active === true; }).length;
    stats.users.inactive = stats.users.total - stats.users.active;
    
    // Admins (ใช้ status)
    const admins = Sheet.read('admins').rows;
    stats.admins.total = admins.length;
    stats.admins.active = admins.filter(function(row) { return row.status === 'active'; }).length;
    stats.admins.inactive = stats.admins.total - stats.admins.active;
    
    // Applications (ใช้ status)
    const apps = Sheet.read('applications').rows;
    stats.applications.total = apps.length;
    stats.applications.active = apps.filter(function(row) { return row.status === 'active'; }).length;
    stats.applications.inactive = stats.applications.total - stats.applications.active;
    
    // Organizations, Positions, Ranks (ไม่มี active/status field)
    stats.organizations.total = Sheet.read('organizations').rows.length;
    stats.positions.total = Sheet.read('positions').rows.length;
    stats.ranks.total = Sheet.read('ranks').rows.length;
    
    // Token stats
    const tokens = Sheet.read('tokens').rows;
    const now = new Date();
    stats.tokens.total = tokens.length;
    stats.tokens.active = tokens.filter(function(t) {
      return !t.revoked && new Date(t.expires_at) > now;
    }).length;
    stats.tokens.expired = tokens.filter(function(t) {
      return !t.revoked && new Date(t.expires_at) <= now;
    }).length;
    stats.tokens.revoked = tokens.filter(function(t) { return t.revoked; }).length;
    
    // Log stats (ใช้ timestamp แทน created_at)
    const logs = Sheet.read('logs').rows;
    stats.logs.total = logs.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    stats.logs.today = logs.filter(function(log) {
      const logDate = new Date(log.timestamp);
      return logDate >= today;
    }).length;
    
    return Helpers.response(true, stats, 'Statistics retrieved');
    
  } catch (error) {
    Logger.log('getStatistics error: ' + error.toString());
    return Helpers.response(false, null, 'Failed to get statistics');
  }
}

// ====================================
// CONFIG MANAGEMENT
// ====================================

/**
 * ดู config ทั้งหมด
 * 
 * @returns {Object} {success: boolean, data: Object, message: string}
 * 
 * @example
 * function viewConfig() {
 *   const result = viewAllConfig();
 *   Logger.log(result.data.object);
 * }
 */
function viewAllConfig() {
  return Helpers.getAllConfig();
}

/**
 * แก้ไข config
 * 
 * @param {string} key - Config key
 * @param {*} value - ค่าใหม่
 * @param {string} description - คำอธิบาย (optional)
 * @returns {Object} {success: boolean, message: string}
 * 
 * @example
 * function updateTokenExpiry() {
 *   const result = updateConfig('token_expiry_hours', '48', 'เพิ่มเป็น 48 ชม.');
 *   Logger.log(result);
 * }
 */
function updateConfig(key, value, description) {
  return Helpers.setConfig(key, value, description);
}

/**
 * เพิ่ม config ใหม่
 * 
 * @param {string} key - Config key
 * @param {*} value - ค่า
 * @param {string} description - คำอธิบาย
 * @returns {Object} {success: boolean, message: string}
 * 
 * @example
 * function addNewConfig() {
 *   const result = addConfig('max_login_attempts', '5', 'จำนวนครั้งที่พยายาม login สูงสุด');
 *   Logger.log(result);
 * }
 */
function addConfig(key, value, description) {
  return Helpers.setConfig(key, value, description);
}

/**
 * ลบ config
 * 
 * @param {string} key - Config key
 * @returns {Object} {success: boolean, message: string}
 */
function removeConfig(key) {
  return Helpers.deleteConfig(key);
}
