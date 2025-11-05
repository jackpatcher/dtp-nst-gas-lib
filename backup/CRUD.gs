/**
 * CRUD Operations Module
 * Handles Create, Read, Update, Delete operations for all tables
 */

var CRUD = (function() {
  
  // ============================
  // HELPER FUNCTIONS
  // ============================
  
  /**
   * Get sheet headers with indices
   * @param {Sheet} sheet - Google Sheets object
   * @returns {Object} {headers: Array, indices: Object}
   */
  function getSheetHeaders(sheet) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const indices = {};
    
    headers.forEach(function(header, index) {
      indices[header] = index;
    });
    
    return { headers: headers, indices: indices };
  }
  
  /**
   * Build record object from row data
   * @param {Array} row - Row data array
   * @param {Array} headers - Headers array
   * @param {boolean} excludePassword - Whether to exclude password field
   * @returns {Object} Record object
   */
  function buildRecordObject(row, headers, excludePassword) {
    const record = {};
    
    headers.forEach(function(header, index) {
      record[header] = row[index];
    });
    
    if (excludePassword) {
      delete record.password;
    }
    
    return record;
  }
  
  /**
   * Find record by UUID
   * @param {Array} sheetData - All sheet data including headers
   * @param {number} uuidIndex - Index of UUID column
   * @param {string} uuid - UUID to find
   * @returns {number} Row index (0-based, excluding header) or -1 if not found
   */
  function findRecordByUUID(sheetData, uuidIndex, uuid) {
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][uuidIndex] === uuid) {
        return i;
      }
    }
    return -1;
  }
  
  /**
   * Set auto-generated fields
   * @param {Object} data - Data object to modify
   * @param {boolean} isUpdate - Whether this is an update operation
   */
  function setAutoFields(data, isUpdate) {
    if (!isUpdate) {
      // For create operations
      if (!data.uuid) {
        data.uuid = generateUUID();
      }
      
      const now = getCurrentTimestamp();
      data.created_at = now;
      data.updated_at = now;
      
      if (data.active === undefined) {
        data.active = true;
      }
    } else {
      // For update operations
      data.updated_at = getCurrentTimestamp();
      delete data.uuid;
      delete data.created_at;
    }
    
    // Hash password if present
    if (data.password) {
      data.password = hashPassword(data.password);
    }
  }
  
  // ============================
  // CRUD OPERATIONS
  // ============================
  
  /**
   * Create a new record
   * @param {string} tableName - Name of the table
   * @param {Object} data - Data to insert
   * @param {string} userId - ID of user performing action
   * @param {string} userType - Type of user (admin/user)
   * @returns {Object} {success: boolean, data: Object, message: string}
   */
  function create(tableName, data, userId, userType) {
    try {
      const normalizedTable = Authorization.normalizeTableName(tableName);
      const sheet = SheetManager.getSheet(normalizedTable);
      const { headers, indices } = getSheetHeaders(sheet);
      
      // Set auto-generated fields (UUID, timestamps, active status, hash password)
      setAutoFields(data, false);
      
      // Validate required fields
      const validation = validateRequiredFields(normalizedTable, data);
      if (!validation.valid) {
        return createResponse(false, null, validation.message);
      }
      
      // Validate unique fields
      const uniqueCheck = validateUniqueFields(normalizedTable, data, sheet, headers);
      if (!uniqueCheck.valid) {
        return createResponse(false, null, uniqueCheck.message);
      }
      
      // Build row data
      const row = headers.map(function(header) {
        return data[header] !== undefined ? data[header] : '';
      });
      
      // Append to sheet
      sheet.appendRow(row);
      
      // Build response object (exclude password)
      const responseData = buildRecordObject(row, headers, true);
      
      return createResponse(true, responseData, 'Record created successfully');
      
    } catch (error) {
      Logger.log('CRUD.create error: ' + error.toString());
      return createResponse(false, null, 'Create failed: ' + error.message);
    }
  }
  
  /**
   * Read records with optional filters
   * @param {string} tableName - Name of the table
   * @param {Object} filters - Filter criteria {field: value}
   * @returns {Object} {success: boolean, data: Array, message: string}
   */
  function read(tableName, filters) {
    try {
      const normalizedTable = Authorization.normalizeTableName(tableName);
      const sheet = SheetManager.getSheet(normalizedTable);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      const results = [];
      
      // Process each row (skip header)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Build record object (exclude password)
        const record = buildRecordObject(row, headers, true);
        
        // Apply filters
        if (filters && !matchesFilters(record, filters)) {
          continue;
        }
        
        results.push(record);
      }
      
      return createResponse(true, results, 'Records retrieved successfully');
      
    } catch (error) {
      Logger.log('CRUD.read error: ' + error.toString());
      return createResponse(false, null, 'Read failed: ' + error.message);
    }
  }
  
  /**
   * Update a record by UUID
   * @param {string} tableName - Name of the table
   * @param {string} uuid - UUID of record to update
   * @param {Object} data - Data to update
   * @param {string} userId - ID of user performing action
   * @param {string} userType - Type of user (admin/user)
   * @returns {Object} {success: boolean, data: Object, message: string}
   */
  function update(tableName, uuid, data, userId, userType) {
    try {
      if (!isValidUUID(uuid)) {
        return createResponse(false, null, 'Invalid UUID format');
      }
      
      const normalizedTable = Authorization.normalizeTableName(tableName);
      const sheet = SheetManager.getSheet(normalizedTable);
      const sheetData = sheet.getDataRange().getValues();
      const { headers, indices } = getSheetHeaders(sheet);
      
      if (indices.uuid === undefined) {
        return createResponse(false, null, 'Table does not have UUID column');
      }
      
      // Find record
      const rowIndex = findRecordByUUID(sheetData, indices.uuid, uuid);
      
      if (rowIndex === -1) {
        return createResponse(false, null, 'Record not found');
      }
      
      // Set auto fields and protect fields (remove uuid, created_at, hash password, set updated_at)
      setAutoFields(data, true);
      
      // Update fields
      const updatedRecord = {};
      headers.forEach(function(header, colIndex) {
        if (data[header] !== undefined) {
          sheet.getRange(rowIndex + 1, colIndex + 1).setValue(data[header]);
          updatedRecord[header] = data[header];
        } else {
          updatedRecord[header] = sheetData[rowIndex][colIndex];
        }
      });
      
      // Exclude password from response
      delete updatedRecord.password;
      
      return createResponse(true, updatedRecord, 'Record updated successfully');
      
    } catch (error) {
      Logger.log('CRUD.update error: ' + error.toString());
      return createResponse(false, null, 'Update failed: ' + error.message);
    }
  }
  
  /**
   * Delete a record by UUID
   * @param {string} tableName - Name of the table
   * @param {string} uuid - UUID of record to delete
   * @param {boolean} hardDelete - If true, permanently delete; otherwise soft delete
   * @returns {Object} {success: boolean, message: string}
   */
  function deleteRecord(tableName, uuid, hardDelete) {
    try {
      if (!isValidUUID(uuid)) {
        return createResponse(false, null, 'Invalid UUID format');
      }
      
      const normalizedTable = Authorization.normalizeTableName(tableName);
      const sheet = SheetManager.getSheet(normalizedTable);
      const data = sheet.getDataRange().getValues();
      const { headers, indices } = getSheetHeaders(sheet);
      
      if (indices.uuid === undefined) {
        return createResponse(false, null, 'Table does not have UUID column');
      }
      
      // Find record
      const rowIndex = findRecordByUUID(data, indices.uuid, uuid);
      
      if (rowIndex === -1) {
        return createResponse(false, null, 'Record not found');
      }
      
      if (hardDelete) {
        // Permanently delete row
        sheet.deleteRow(rowIndex + 1);
        return createResponse(true, null, 'Record permanently deleted');
      } else {
        // Soft delete - set active to false
        if (indices.active !== undefined) {
          sheet.getRange(rowIndex + 1, indices.active + 1).setValue(false);
          
          // Update timestamp
          if (indices.updated_at !== undefined) {
            sheet.getRange(rowIndex + 1, indices.updated_at + 1).setValue(getCurrentTimestamp());
          }
          
          return createResponse(true, null, 'Record deactivated successfully');
        } else {
          return createResponse(false, null, 'Soft delete not supported for this table');
        }
      }
      
    } catch (error) {
      Logger.log('CRUD.delete error: ' + error.toString());
      return createResponse(false, null, 'Delete failed: ' + error.message);
    }
  }
  
  // ============================
  // VALIDATION FUNCTIONS
  // ============================
  
  /**
   * Check if record matches filters
   */
  function matchesFilters(record, filters) {
    for (const key in filters) {
      if (filters.hasOwnProperty(key)) {
        if (record[key] != filters[key]) {
          return false;
        }
      }
    }
    return true;
  }
  
  /**
   * Get required fields configuration
   */
  function getRequiredFields(tableName) {
    const requiredFieldsMap = {
      'users': ['uuid', 'name', 'id13', 'password'],
      'organizations': ['uuid', 'org_name', 'province'],
      'positions': ['uuid', 'name'],
      'ranks': ['uuid', 'name'],
      'admins': ['uuid', 'username', 'password', 'name', 'role'],
      'applications': ['uuid', 'appname', 'app_key'],
      'tokens': ['uuid', 'token', 'user_type', 'user_id', 'expires_at']
    };
    return requiredFieldsMap[tableName] || [];
  }
  
  /**
   * Get unique fields configuration
   */
  function getUniqueFields(tableName) {
    const uniqueFieldsMap = {
      'users': ['id13'],
      'organizations': ['hrms_id'],
      'positions': ['name'],
      'ranks': ['name'],
      'admins': ['username'],
      'applications': ['appname', 'app_key'],
      'tokens': ['token']
    };
    return uniqueFieldsMap[tableName] || [];
  }
  
  /**
   * Validate required fields
   */
  function validateRequiredFields(tableName, data) {
    const required = getRequiredFields(tableName);
    
    for (let i = 0; i < required.length; i++) {
      const field = required[i];
      if (!data[field]) {
        return {
          valid: false,
          message: 'Required field missing: ' + field
        };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Validate unique fields
   */
  function validateUniqueFields(tableName, data, sheet, headers) {
    const unique = getUniqueFields(tableName);
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 0; i < unique.length; i++) {
      const field = unique[i];
      if (!data[field]) continue;
      
      const fieldIndex = headers.indexOf(field);
      if (fieldIndex === -1) continue;
      
      // Check for duplicates (skip header row)
      for (let row = 1; row < sheetData.length; row++) {
        if (sheetData[row][fieldIndex] === data[field]) {
          return {
            valid: false,
            message: 'Duplicate value for unique field: ' + field
          };
        }
      }
    }
    
    return { valid: true };
  }
  
  // Public interface
  return {
    create: create,
    read: read,
    update: update,
    delete: deleteRecord
  };
  
})();
