/**
 * Admin Functions
 * Helper functions for library setup and administration
 */

// ============================
// HELPER FUNCTIONS
// ============================

/**
 * Build row array from data object and headers
 */
function buildRowFromData(data, headers) {
  return headers.map(function(header) {
    return data[header] !== undefined ? data[header] : '';
  });
}

/**
 * Append data row to sheet
 */
function appendDataToSheet(sheetName, data) {
  const sheet = SheetManager.getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = buildRowFromData(data, headers);
  sheet.appendRow(row);
}

// ============================
// SETUP FUNCTIONS
// ============================

/**
 * Initialize the library
 * This should be run once when setting up the library
 * Uses the active spreadsheet automatically
 */
function setupLibrary() {
  try {
    // Clear any cached spreadsheet
    SheetManager.clearCache();
    
    // Initialize all sheets in the active spreadsheet
    const result = SheetManager.initializeAllSheets();
    
    Logger.log('Library setup completed successfully');
    Logger.log('Using spreadsheet: ' + SheetManager.getSpreadsheet().getName());
    return result;
    
  } catch (error) {
    Logger.log('Setup error: ' + error.toString());
    return { success: false, message: 'Setup failed: ' + error.message };
  }
}

/**
 * Create initial admin user
 * Should be run after setupLibrary
 */
function createInitialAdmin(username, password, name) {
  try {
    const adminData = {
      uuid: generateUUID(),
      username: username,
      password: hashPassword(password),
      name: name,
      role: 'SUPER_ADMIN',
      active: true,
      last_login: null,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    
    appendDataToSheet('admins', adminData);
    
    Logger.log('Initial admin created: ' + username);
    return { success: true, message: 'Admin created successfully', uuid: adminData.uuid };
    
  } catch (error) {
    Logger.log('Create admin error: ' + error.toString());
    return { success: false, message: 'Failed to create admin: ' + error.message };
  }
}

/**
 * Register a new application
 * Returns the app key that should be used by the application
 */
function registerApplication(appname, description, createdBy) {
  try {
    // Generate unique app key
    const appKey = 'app_' + Utilities.getUuid().replace(/-/g, '').substring(0, 32);
    
    const appData = {
      uuid: generateUUID(),
      appname: appname,
      app_key: appKey,
      description: description || '',
      callback_url: '',
      active: true,
      created_by: createdBy || '',
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp()
    };
    
    appendDataToSheet('applications', appData);
    
    Logger.log('Application registered: ' + appname);
    return { 
      success: true, 
      message: 'Application registered successfully',
      appKey: appKey,
      uuid: appData.uuid
    };
    
  } catch (error) {
    Logger.log('Register app error: ' + error.toString());
    return { success: false, message: 'Failed to register application: ' + error.message };
  }
}

/**
 * Clean up expired tokens
 * Should be run periodically (e.g., daily trigger)
 */
function dailyMaintenance() {
  try {
    Logger.log('Starting daily maintenance...');
    
    // Clean expired tokens
    TokenManager.cleanupExpiredTokens();
    
    // Clean old logs (keep 90 days)
    AuditLog.cleanOldLogs(90);
    
    Logger.log('Daily maintenance completed');
    return { success: true, message: 'Maintenance completed' };
    
  } catch (error) {
    Logger.log('Maintenance error: ' + error.toString());
    return { success: false, message: 'Maintenance failed: ' + error.message };
  }
}

/**
 * Get library statistics
 */
function getLibraryStats() {
  try {
    const stats = {
      users: 0,
      organizations: 0,
      positions: 0,
      ranks: 0,
      admins: 0,
      applications: 0,
      activeTokens: 0,
      logs: 0
    };
    
    const tables = ['users', 'organizations', 'positions', 'ranks', 'admins', 'applications', 'tokens', 'logs'];
    
    tables.forEach(function(tableName) {
      try {
        const sheet = SheetManager.getSheet(tableName);
        const rowCount = sheet.getLastRow() - 1; // Exclude header
        
        if (tableName === 'tokens') {
          // Count only active tokens
          const data = sheet.getDataRange().getValues();
          const headers = data[0];
          const revokedIndex = headers.indexOf('revoked');
          const expiresIndex = headers.indexOf('expires_at');
          let activeCount = 0;
          
          for (let i = 1; i < data.length; i++) {
            if (!data[i][revokedIndex]) {
              const expiresAt = new Date(data[i][expiresIndex]);
              if (expiresAt > new Date()) {
                activeCount++;
              }
            }
          }
          stats.activeTokens = activeCount;
        } else {
          stats[tableName] = rowCount;
        }
      } catch (e) {
        // Sheet might not exist
        stats[tableName] = 0;
      }
    });
    
    return { success: true, data: stats };
    
  } catch (error) {
    Logger.log('Get stats error: ' + error.toString());
    return { success: false, message: 'Failed to get statistics: ' + error.message };
  }
}

/**
 * Test the library configuration
 */
function testLibrarySetup() {
  const tests = [];
  
  // Test 1: Check spreadsheet access
  try {
    const ss = SheetManager.getSpreadsheet();
    tests.push({ test: 'Spreadsheet Access', status: 'PASS', message: 'ID: ' + ss.getId() });
  } catch (error) {
    tests.push({ test: 'Spreadsheet Access', status: 'FAIL', message: error.message });
  }
  
  // Test 2: Check all sheets exist
  const requiredSheets = ['users', 'organizations', 'positions', 'ranks', 'logs', 'admins', 'applications', 'tokens'];
  requiredSheets.forEach(function(sheetName) {
    try {
      const sheet = SheetManager.getSheet(sheetName);
      tests.push({ test: 'Sheet: ' + sheetName, status: 'PASS', message: 'Exists with ' + (sheet.getLastRow() - 1) + ' records' });
    } catch (error) {
      tests.push({ test: 'Sheet: ' + sheetName, status: 'FAIL', message: error.message });
    }
  });
  
  // Test 3: Check if admin exists
  try {
    const adminSheet = SheetManager.getSheet('admins');
    const adminCount = adminSheet.getLastRow() - 1;
    if (adminCount > 0) {
      tests.push({ test: 'Admin Users', status: 'PASS', message: adminCount + ' admin(s) found' });
    } else {
      tests.push({ test: 'Admin Users', status: 'WARN', message: 'No admin users found. Run createInitialAdmin()' });
    }
  } catch (error) {
    tests.push({ test: 'Admin Users', status: 'FAIL', message: error.message });
  }
  
  // Test 4: Check if applications registered
  try {
    const appSheet = SheetManager.getSheet('applications');
    const appCount = appSheet.getLastRow() - 1;
    if (appCount > 0) {
      tests.push({ test: 'Applications', status: 'PASS', message: appCount + ' application(s) registered' });
    } else {
      tests.push({ test: 'Applications', status: 'WARN', message: 'No applications registered. Run registerApplication()' });
    }
  } catch (error) {
    tests.push({ test: 'Applications', status: 'FAIL', message: error.message });
  }
  
  Logger.log('=== Library Setup Test Results ===');
  tests.forEach(function(test) {
    Logger.log(test.status + ': ' + test.test + ' - ' + test.message);
  });
  
  return { success: true, tests: tests };
}
