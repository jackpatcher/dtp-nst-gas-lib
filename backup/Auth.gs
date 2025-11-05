/**
 * Authentication Module
 * Handles user authentication, token generation, and validation
 */

var Auth = (function() {
  
  // ============================
  // HELPER FUNCTIONS
  // ============================
  
  /**
   * Get sheet data with headers as object indices
   */
  function getSheetData(sheetName) {
    const sheet = SheetManager.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const indices = {};
    headers.forEach((header, index) => {
      indices[header] = index;
    });
    
    return { sheet, data, headers, indices };
  }
  
  /**
   * Build user/admin object from row
   */
  function buildUserObject(row, headers) {
    const user = {};
    headers.forEach((header, index) => {
      user[header] = row[index];
    });
    return user;
  }
  
  /**
   * Find and authenticate user by identifier
   */
  function findAndAuthenticateUser(sheetData, identifierField, identifier, password) {
    const { sheet, data, headers, indices } = sheetData;
    
    // Check if identifier and password are provided
    if (!identifier || !password) {
      return { 
        success: false, 
        message: identifierField + ' and password required' 
      };
    }
    
    // Find user by identifier
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[indices[identifierField]] === identifier) {
        // Check if active
        if (!row[indices.active]) {
          return { success: false, message: 'Account is inactive' };
        }
        
        // Verify password
        const hashedPassword = hashPassword(password);
        if (row[indices.password] !== hashedPassword) {
          return { success: false, message: 'Invalid credentials' };
        }
        
        // Build user object
        const user = buildUserObject(row, headers);
        
        // Update last_login if column exists
        if (indices.last_login !== undefined) {
          sheet.getRange(i + 1, indices.last_login + 1).setValue(getCurrentTimestamp());
        }
        
        return { 
          success: true, 
          user: user, 
          message: 'Authentication successful' 
        };
      }
    }
    
    return { success: false, message: 'User not found' };
  }
  
  // ============================
  // AUTHENTICATION FUNCTIONS
  // ============================
  
  /**
   * Authenticate user or admin
   * @param {Object} credentials - {username/id13: string, password: string}
   * @param {string} userType - 'admin' or 'user'
   * @returns {Object} {success: boolean, user: Object, message: string}
   */
  function authenticate(credentials, userType) {
    try {
      if (userType === 'admin') {
        return authenticateAdmin(credentials);
      } else if (userType === 'user') {
        return authenticateUser(credentials);
      }
      return { success: false, message: 'Invalid user type' };
    } catch (error) {
      Logger.log('Auth.authenticate error: ' + error.toString());
      return { success: false, message: 'Authentication error: ' + error.message };
    }
  }
  
  /**
   * Authenticate admin user
   */
  function authenticateAdmin(credentials) {
    const sheetData = getSheetData('admins');
    return findAndAuthenticateUser(
      sheetData, 
      'username', 
      credentials.username, 
      credentials.password
    );
  }
  
  /**
   * Authenticate regular user
   */
  function authenticateUser(credentials) {
    const id13 = credentials.id13 || credentials.username;
    
    // Validate ID13 format (13 digits)
    if (id13 && !/^\d{13}$/.test(id13)) {
      return { success: false, message: 'Invalid ID13 format' };
    }
    
    const sheetData = getSheetData('users');
    return findAndAuthenticateUser(
      sheetData, 
      'id13', 
      id13, 
      credentials.password
    );
  }
  
  /**
   * Generate authentication token
   * @param {Object} user - User or admin object
   * @param {string} userType - 'admin' or 'user'
   * @returns {Object} {token: string, expiresAt: string}
   */
  function generateToken(user, userType) {
    // Generate random token
    const randomBytes = Utilities.getUuid() + Utilities.getUuid();
    const token = Utilities.base64Encode(randomBytes).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
    
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Store token in sheet
    const tokenData = {
      uuid: generateUUID(),
      token: token,
      user_type: userType,
      user_id: user.uuid,
      user_identifier: userType === 'admin' ? user.username : user.id13,
      app_key: '', // Will be set on connect
      org_id: userType === 'user' ? user.org_id : null,
      expires_at: expiresAt.toISOString(),
      revoked: false,
      revoked_at: null,
      last_used: getCurrentTimestamp(),
      created_at: getCurrentTimestamp()
    };
    
    TokenManager.saveToken(tokenData);
    
    return {
      token: token,
      expiresAt: expiresAt.toISOString()
    };
  }
  
  /**
   * Validate app key
   * @param {string} appKey - Application key
   * @returns {Object} {success: boolean, app: Object, message: string}
   */
  function validateAppKey(appKey) {
    if (!appKey) {
      return { success: false, message: 'App key is required' };
    }
    
    const { data, headers, indices } = getSheetData('applications');
    
    // Find app
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[indices.app_key] === appKey) {
        // Check if active
        if (!row[indices.active]) {
          return { success: false, message: 'Application is inactive' };
        }
        
        // Build app object
        const app = buildUserObject(row, headers);
        return { success: true, app: app, message: 'Valid app key' };
      }
    }
    
    return { success: false, message: 'Invalid app key' };
  }
  
  /**
   * Validate authentication token
   * @param {string} token - Authentication token
   * @param {string} appKey - Application key
   * @returns {Object} {success: boolean, tokenData: Object, message: string}
   */
  function validateToken(token, appKey) {
    if (!token) {
      return { success: false, message: 'Token is required' };
    }
    
    const { sheet, data, headers, indices } = getSheetData('tokens');
    
    // Find token
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[indices.token] === token) {
        // Check if revoked
        if (row[indices.revoked]) {
          return { success: false, message: 'Token has been revoked' };
        }
        
        // Check expiration
        const expiresAt = new Date(row[indices.expires_at]);
        if (expiresAt < new Date()) {
          return { success: false, message: 'Token has expired' };
        }
        
        // Build token object
        const tokenData = buildUserObject(row, headers);
        
        // Update app_key if not set
        if (!tokenData.app_key && appKey) {
          sheet.getRange(i + 1, indices.app_key + 1).setValue(appKey);
          tokenData.app_key = appKey;
        }
        
        return { success: true, tokenData: tokenData, message: 'Valid token' };
      }
    }
    
    return { success: false, message: 'Invalid token' };
  }
  
  // Public interface
  return {
    authenticate: authenticate,
    generateToken: generateToken,
    validateAppKey: validateAppKey,
    validateToken: validateToken
  };
  
})();


/**
 * Token Manager
 * Handles token storage and management
 */
var TokenManager = (function() {
  
  /**
   * Get sheet data helper
   */
  function getTokenSheetData() {
    const sheet = SheetManager.getSheet('tokens');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const indices = {};
    headers.forEach((header, index) => {
      indices[header] = index;
    });
    
    return { sheet, data, headers, indices };
  }
  
  /**
   * Find token row index
   */
  function findTokenRow(data, indices, token) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][indices.token] === token) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Save token to sheet
   */
  function saveToken(tokenData) {
    const sheet = SheetManager.getSheet('tokens');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    const row = headers.map(function(header) {
      return tokenData[header] !== undefined ? tokenData[header] : '';
    });
    
    sheet.appendRow(row);
  }
  
  /**
   * Update token last used timestamp
   */
  function updateLastUsed(token) {
    const { sheet, data, indices } = getTokenSheetData();
    const rowIndex = findTokenRow(data, indices, token);
    
    if (rowIndex !== -1) {
      sheet.getRange(rowIndex + 1, indices.last_used + 1).setValue(getCurrentTimestamp());
    }
  }
  
  /**
   * Revoke token
   */
  function revokeToken(token) {
    const { sheet, data, indices } = getTokenSheetData();
    const rowIndex = findTokenRow(data, indices, token);
    
    if (rowIndex !== -1) {
      sheet.getRange(rowIndex + 1, indices.revoked + 1).setValue(true);
      sheet.getRange(rowIndex + 1, indices.revoked_at + 1).setValue(getCurrentTimestamp());
    }
  }
  
  /**
   * Clean up expired tokens (can be run as a scheduled function)
   */
  function cleanupExpiredTokens() {
    const { sheet, data, indices } = getTokenSheetData();
    const now = new Date();
    const rowsToDelete = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      const expiresAt = new Date(data[i][indices.expires_at]);
      if (expiresAt < now) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Delete expired tokens
    rowsToDelete.forEach(function(rowNum) {
      sheet.deleteRow(rowNum);
    });
    
    Logger.log('Cleaned up ' + rowsToDelete.length + ' expired tokens');
  }
  
  // Public interface
  return {
    saveToken: saveToken,
    updateLastUsed: updateLastUsed,
    revokeToken: revokeToken,
    cleanupExpiredTokens: cleanupExpiredTokens
  };
  
})();
