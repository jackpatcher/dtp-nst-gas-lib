/**
 * Sheet Manager
 * Handles sheet access and management
 */

var SheetManager = (function() {
  
  // Cache for spreadsheet
  let spreadsheet = null;
  
  /**
   * Get the active spreadsheet
   * Always uses the spreadsheet where the library is installed
   */
  function getSpreadsheet() {
    if (spreadsheet) {
      return spreadsheet;
    }
    
    // Use active spreadsheet directly
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (!spreadsheet) {
      throw new Error('No active spreadsheet found. Please ensure the library is bound to a spreadsheet.');
    }
    
    return spreadsheet;
  }
  
  /**
   * Clear the spreadsheet cache
   * Use this if you need to refresh the spreadsheet reference
   */
  function clearCache() {
    spreadsheet = null;
  }
  
  /**
   * Get sheet by name
   */
  function getSheet(sheetName) {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      // Try to create the sheet with headers
      sheet = createSheet(sheetName);
    }
    
    return sheet;
  }
  
  /**
   * Create a new sheet with headers
   */
  function createSheet(sheetName) {
    const ss = getSpreadsheet();
    const sheet = ss.insertSheet(sheetName);
    
    // Set headers based on schema
    const headers = getHeadersForSheet(sheetName);
    if (headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    
    return sheet;
  }
  
  /**
   * Get headers for a sheet based on schema
   */
  function getHeadersForSheet(sheetName) {
    const schemas = {
      'users': [
        'uuid', 'name', 'id13', 'password', 'position_id', 'rank_id', 
        'org_id', 'active', 'created_at', 'updated_at'
      ],
      'organizations': [
        'uuid', 'hrms_id', 'dmz_id', 'org_name', 'subdistrict', 
        'district', 'province', 'active', 'created_at', 'updated_at'
      ],
      'positions': [
        'uuid', 'name', 'description', 'level', 'active', 
        'created_at', 'updated_at'
      ],
      'ranks': [
        'uuid', 'name', 'abbreviation', 'level', 'active', 
        'created_at', 'updated_at'
      ],
      'logs': [
        'uuid', 'user_id13', 'action', 'table_name', 'record_id', 
        'status', 'app_id', 'ip_address', 'details', 'created_at'
      ],
      'admins': [
        'uuid', 'username', 'password', 'name', 'role', 'active', 
        'last_login', 'created_at', 'updated_at'
      ],
      'applications': [
        'uuid', 'appname', 'app_key', 'description', 'callback_url', 
        'active', 'created_by', 'created_at', 'updated_at'
      ],
      'tokens': [
        'uuid', 'token', 'user_type', 'user_id', 'user_identifier', 
        'app_key', 'org_id', 'expires_at', 'revoked', 'revoked_at', 
        'last_used', 'created_at'
      ]
    };
    
    return schemas[sheetName] || [];
  }
  
  /**
   * Initialize all sheets with proper structure
   */
  function initializeAllSheets() {
    const sheetNames = [
      'users', 'organizations', 'positions', 'ranks', 
      'logs', 'admins', 'applications', 'tokens'
    ];
    
    sheetNames.forEach(function(sheetName) {
      getSheet(sheetName);
    });
    
    return { success: true, message: 'All sheets initialized' };
  }
  
  /**
   * Check if sheet exists
   */
  function sheetExists(sheetName) {
    const ss = getSpreadsheet();
    return ss.getSheetByName(sheetName) !== null;
  }
  
  // Public interface
  return {
    getSpreadsheet: getSpreadsheet,
    clearCache: clearCache,
    getSheet: getSheet,
    createSheet: createSheet,
    initializeAllSheets: initializeAllSheets,
    sheetExists: sheetExists
  };
  
})();


/**
 * Audit Log Manager
 * Handles logging of all operations
 */
var AuditLog = (function() {
  
  /**
   * Create log entry with defaults
   */
  function createLogEntry(logData) {
    return {
      uuid: generateUUID(),
      user_id13: logData.user_id13 || '',
      action: logData.action || '',
      table_name: logData.table_name || '',
      record_id: logData.record_id || '',
      status: logData.status || 'SUCCESS',
      app_id: logData.app_id || '',
      ip_address: logData.ip_address || '',
      details: logData.details || '',
      created_at: getCurrentTimestamp()
    };
  }
  
  /**
   * Log an operation
   * @param {Object} logData - {user_id13, action, table_name, record_id, status, app_id, details}
   */
  function log(logData) {
    try {
      const sheet = SheetManager.getSheet('logs');
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      const logEntry = createLogEntry(logData);
      
      const row = headers.map(function(header) {
        return logEntry[header] !== undefined ? logEntry[header] : '';
      });
      
      sheet.appendRow(row);
      
    } catch (error) {
      Logger.log('AuditLog.log error: ' + error.toString());
      // Don't throw error - logging should not break operations
    }
  }
  
  /**
   * Get logs with filters
   */
  function getLogs(filters) {
    try {
      return CRUD.read('logs', filters);
    } catch (error) {
      Logger.log('AuditLog.getLogs error: ' + error.toString());
      return createResponse(false, null, 'Failed to retrieve logs: ' + error.message);
    }
  }
  
  /**
   * Clean old logs (older than specified days)
   */
  function cleanOldLogs(daysToKeep) {
    try {
      daysToKeep = daysToKeep || 90; // Default 90 days
      
      const sheet = SheetManager.getSheet('logs');
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const indices = {};
      headers.forEach((header, index) => {
        indices[header] = index;
      });
      
      if (indices.created_at === undefined) {
        return { success: false, message: 'created_at column not found' };
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const rowsToDelete = [];
      
      // Find old logs (iterate backwards to handle deletion)
      for (let i = data.length - 1; i >= 1; i--) {
        const createdAt = new Date(data[i][indices.created_at]);
        if (createdAt < cutoffDate) {
          rowsToDelete.push(i + 1);
        }
      }
      
      // Delete rows
      rowsToDelete.forEach(function(rowNum) {
        sheet.deleteRow(rowNum);
      });
      
      Logger.log('Cleaned up ' + rowsToDelete.length + ' old log entries');
      return { 
        success: true, 
        message: 'Cleaned up ' + rowsToDelete.length + ' log entries',
        count: rowsToDelete.length
      };
      
    } catch (error) {
      Logger.log('AuditLog.cleanOldLogs error: ' + error.toString());
      return { success: false, message: 'Cleanup failed: ' + error.message };
    }
  }
  
  // Public interface
  return {
    log: log,
    getLogs: getLogs,
    cleanOldLogs: cleanOldLogs
  };
  
})();


/**
 * Data Validator
 * Validates data formats and constraints
 */
var Validator = (function() {
  
  /**
   * Validate Thai national ID (13 digits)
   */
  function validateId13(id13) {
    if (!/^\d{13}$/.test(id13)) {
      return { valid: false, message: 'ID13 must be exactly 13 digits' };
    }
    
    // Validate checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(id13.charAt(i)) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    
    if (checkDigit !== parseInt(id13.charAt(12))) {
      return { valid: false, message: 'Invalid ID13 checksum' };
    }
    
    return { valid: true };
  }
  
  /**
   * Validate email format
   */
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Invalid email format' };
    }
    return { valid: true };
  }
  
  /**
   * Validate password strength
   */
  function validatePassword(password) {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    return { valid: true };
  }
  
  /**
   * Validate date format
   */
  function validateDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { valid: false, message: 'Invalid date format' };
    }
    return { valid: true, date: date };
  }
  
  /**
   * Sanitize input (prevent injection)
   */
  function sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    // Remove potentially dangerous characters
    return input.replace(/[<>]/g, '');
  }
  
  // Public interface
  return {
    validateId13: validateId13,
    validateEmail: validateEmail,
    validatePassword: validatePassword,
    validateDate: validateDate,
    sanitizeInput: sanitizeInput
  };
  
})();
