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
    
    // 1. Clear cache
    Sheet.clearCache();
    
    // 2. สร้าง sheets ทั้งหมด
    const result = Sheet.initializeAll();
    
    if (!result.success) {
      return result;
    }
    
    // 3. ดึงข้อมูล spreadsheet
    const ss = Sheet.getSpreadsheet();
    
    Logger.log('✅ Setup completed successfully!');
    Logger.log('Spreadsheet: ' + ss.getName());
    Logger.log('URL: ' + ss.getUrl());
    Logger.log('========================================');
    Logger.log('Next steps:');
    Logger.log('1. Run: createFirstAdmin("username", "password", "name")');
    Logger.log('2. Run: registerApp("appname", "description")');
    Logger.log('========================================');
    
    return {
      success: true,
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
function createFirstAdmin(username, password, name) {
  try {
    // ตรวจสอบ input
    if (!username || !password || !name) {
      return Helpers.response(false, null, 'Username, password, and name are required');
    }
    
    // ตรวจสอบว่ามี admin อยู่แล้วหรือไม่
    const existing = Sheet.read('admins', { username: username });
    if (existing.rows.length > 0) {
      return Helpers.response(false, null, 'Admin with this username already exists');
    }
    
    // สร้าง admin
    const adminData = {
      uuid: Helpers.uuid(),
      username: username,
      password: Helpers.hashPassword(password),
      name: name,
      role: 'SUPER_ADMIN',
      active: true,
      last_login: null,
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
      { uuid: adminData.uuid, username: username, name: name },
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
function registerApp(appname, description, createdBy) {
  try {
    if (!appname) {
      return Helpers.response(false, null, 'App name is required');
    }
    
    // ตรวจสอบว่ามี app ชื่อนี้อยู่แล้วหรือไม่
    const existing = Sheet.read('applications', { appname: appname });
    if (existing.rows.length > 0) {
      return Helpers.response(false, null, 'Application with this name already exists');
    }
    
    // สร้าง app key
    const appKey = Helpers.generateAppKey();
    
    const appData = {
      uuid: Helpers.uuid(),
      appname: appname,
      app_key: appKey,
      description: description || '',
      callback_url: '',
      active: true,
      created_by: createdBy || '',
      created_at: Helpers.now(),
      updated_at: Helpers.now()
    };
    
    const result = Sheet.append('applications', appData);
    
    if (!result.success) {
      return result;
    }
    
    Logger.log('✅ Application registered successfully!');
    Logger.log('App Name: ' + appname);
    Logger.log('App Key: ' + appKey);
    Logger.log('UUID: ' + appData.uuid);
    Logger.log('⚠️  IMPORTANT: Save this App Key securely!');
    
    return Helpers.response(
      true,
      {
        uuid: appData.uuid,
        appname: appname,
        app_key: appKey
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
      organizations: { total: 0, active: 0 },
      positions: { total: 0, active: 0 },
      ranks: { total: 0, active: 0 }
    };
    
    const tables = ['users', 'admins', 'applications', 'organizations', 'positions', 'ranks'];
    
    tables.forEach(function(table) {
      const allData = Sheet.read(table).rows;
      stats[table].total = allData.length;
      stats[table].active = allData.filter(function(row) { return row.active; }).length;
      stats[table].inactive = stats[table].total - stats[table].active;
    });
    
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
    
    // Log stats
    const logs = Sheet.read('logs').rows;
    stats.logs.total = logs.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    stats.logs.today = logs.filter(function(log) {
      const logDate = new Date(log.created_at);
      return logDate >= today;
    }).length;
    
    return Helpers.response(true, stats, 'Statistics retrieved');
    
  } catch (error) {
    Logger.log('getStatistics error: ' + error.toString());
    return Helpers.response(false, null, 'Failed to get statistics');
  }
}
