/**
 * DTP NST GAS Library - Main Entry Point
 * Google Apps Script Library for CRUD operations with authentication
 * 
 * Public API:
 * - request_token(credentials, userType)
 * - connect(appKey, token)
 */

// ============================
// PUBLIC API METHODS
// ============================

/**
 * Request authentication token
 * @param {Object} credentials - {username: string, password: string} or {id13: string, password: string}
 * @param {string} userType - 'admin' or 'user'
 * @returns {Object} {success: boolean, token: string, expiresAt: string, message: string}
 */
function request_token(credentials, userType) {
  try {
    // Validate input
    if (!credentials || typeof credentials !== 'object') {
      return createResponse(false, null, 'Invalid credentials format');
    }
    
    if (!userType || !['admin', 'user'].includes(userType.toLowerCase())) {
      return createResponse(false, null, 'Invalid user type. Must be "admin" or "user"');
    }
    
    userType = userType.toLowerCase();
    
    // Authenticate user
    const authResult = Auth.authenticate(credentials, userType);
    
    if (!authResult.success) {
      return createResponse(false, null, authResult.message);
    }
    
    // Generate token
    const tokenData = Auth.generateToken(authResult.user, userType);
    
    return {
      success: true,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      userType: userType,
      userId: authResult.user.uuid,
      message: 'Token generated successfully'
    };
    
  } catch (error) {
    Logger.log('Error in request_token: ' + error.toString());
    return createResponse(false, null, 'Internal error: ' + error.message);
  }
}

/**
 * Connect to library with app key and token
 * Returns a connection object with CRUD methods
 * @param {string} appKey - Application key
 * @param {string} token - Authentication token
 * @returns {Object} Connection object with CRUD methods or error
 */
function connect(appKey, token) {
  try {
    // Validate app key
    const appValidation = Auth.validateAppKey(appKey);
    if (!appValidation.success) {
      return createResponse(false, null, appValidation.message);
    }
    
    // Validate token
    const tokenValidation = Auth.validateToken(token, appKey);
    if (!tokenValidation.success) {
      return createResponse(false, null, tokenValidation.message);
    }
    
    // Update token last used
    TokenManager.updateLastUsed(token);
    
    // Return connection object with methods
    return new Connection(appKey, token, tokenValidation.tokenData);
    
  } catch (error) {
    Logger.log('Error in connect: ' + error.toString());
    return createResponse(false, null, 'Connection failed: ' + error.message);
  }
}

// ============================
// CONNECTION CLASS
// ============================

/**
 * Connection class providing CRUD operations
 */
function Connection(appKey, token, tokenData) {
  this.appKey = appKey;
  this.token = token;
  this.tokenData = tokenData;
  this.userType = tokenData.user_type;
  this.userId = tokenData.user_id;
  this.orgId = tokenData.org_id;
  
  // Store app info
  const appInfo = Auth.validateAppKey(appKey);
  this.appId = appInfo.app.uuid;
  
  /**
   * Create a new record
   */
  this.create = function(tableName, data) {
    try {
      // Check authorization
      const authCheck = Authorization.canCreate(this.userType, tableName, this.orgId);
      if (!authCheck.allowed) {
        return createResponse(false, null, authCheck.message);
      }
      
      // Perform create operation
      const result = CRUD.create(tableName, data, this.userId, this.userType);
      
      // Log action
      if (result.success) {
        AuditLog.log({
          user_id13: this.tokenData.user_identifier,
          action: 'CREATE',
          table_name: tableName,
          record_id: result.data.uuid,
          status: 'SUCCESS',
          app_id: this.appId
        });
      }
      
      return result;
      
    } catch (error) {
      Logger.log('Error in create: ' + error.toString());
      return createResponse(false, null, 'Create failed: ' + error.message);
    }
  };
  
  /**
   * Read records
   */
  this.read = function(tableName, filters) {
    try {
      // Check authorization and apply filters
      const authCheck = Authorization.canRead(this.userType, tableName, this.orgId);
      if (!authCheck.allowed) {
        return createResponse(false, null, authCheck.message);
      }
      
      // Apply org filter for regular users
      if (this.userType === 'user' && authCheck.orgFilter) {
        filters = filters || {};
        filters.org_id = this.orgId;
      }
      
      // Perform read operation
      const result = CRUD.read(tableName, filters);
      
      // Log action
      if (result.success) {
        AuditLog.log({
          user_id13: this.tokenData.user_identifier,
          action: 'READ',
          table_name: tableName,
          status: 'SUCCESS',
          app_id: this.appId
        });
      }
      
      return result;
      
    } catch (error) {
      Logger.log('Error in read: ' + error.toString());
      return createResponse(false, null, 'Read failed: ' + error.message);
    }
  };
  
  /**
   * Update a record
   */
  this.update = function(tableName, uuid, data) {
    try {
      // Check authorization
      const authCheck = Authorization.canUpdate(this.userType, tableName, this.orgId);
      if (!authCheck.allowed) {
        return createResponse(false, null, authCheck.message);
      }
      
      // Perform update operation
      const result = CRUD.update(tableName, uuid, data, this.userId, this.userType);
      
      // Log action
      if (result.success) {
        AuditLog.log({
          user_id13: this.tokenData.user_identifier,
          action: 'UPDATE',
          table_name: tableName,
          record_id: uuid,
          status: 'SUCCESS',
          app_id: this.appId
        });
      }
      
      return result;
      
    } catch (error) {
      Logger.log('Error in update: ' + error.toString());
      return createResponse(false, null, 'Update failed: ' + error.message);
    }
  };
  
  /**
   * Delete a record (soft delete by default)
   */
  this.delete = function(tableName, uuid, hardDelete) {
    try {
      hardDelete = hardDelete || false;
      
      // Check authorization
      const authCheck = Authorization.canDelete(this.userType, tableName, this.orgId);
      if (!authCheck.allowed) {
        return createResponse(false, null, authCheck.message);
      }
      
      // Perform delete operation
      const result = CRUD.delete(tableName, uuid, hardDelete);
      
      // Log action
      if (result.success) {
        AuditLog.log({
          user_id13: this.tokenData.user_identifier,
          action: hardDelete ? 'HARD_DELETE' : 'SOFT_DELETE',
          table_name: tableName,
          record_id: uuid,
          status: 'SUCCESS',
          app_id: this.appId
        });
      }
      
      return result;
      
    } catch (error) {
      Logger.log('Error in delete: ' + error.toString());
      return createResponse(false, null, 'Delete failed: ' + error.message);
    }
  };
  
  /**
   * Get connection info
   */
  this.info = function() {
    return {
      success: true,
      userType: this.userType,
      userId: this.userId,
      orgId: this.orgId,
      appId: this.appId,
      tokenExpiresAt: this.tokenData.expires_at
    };
  };
  
  /**
   * Revoke current token
   */
  this.disconnect = function() {
    try {
      TokenManager.revokeToken(this.token);
      return createResponse(true, null, 'Token revoked successfully');
    } catch (error) {
      Logger.log('Error in disconnect: ' + error.toString());
      return createResponse(false, null, 'Disconnect failed: ' + error.message);
    }
  };
}

// ============================
// UTILITY FUNCTIONS
// ============================

/**
 * Create standardized response
 */
function createResponse(success, data, message) {
  return {
    success: success,
    data: data,
    message: message || (success ? 'Operation completed successfully' : 'Operation failed')
  };
}

/**
 * Generate UUID v4
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Hash password with SHA-256
 */
function hashPassword(password, salt) {
  salt = salt || '';
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt
  );
  return rawHash.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Get current timestamp in ISO format
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
