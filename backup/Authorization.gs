/**
 * Authorization Module
 * Handles role-based access control (RBAC)
 */

var Authorization = (function() {
  
  // Define access rules for each table
  const ACCESS_RULES = {
    // Admin has full access to all tables
    'admin': {
      'users': { create: true, read: true, update: true, delete: true },
      'organizations': { create: true, read: true, update: true, delete: true },
      'positions': { create: true, read: true, update: true, delete: true },
      'ranks': { create: true, read: true, update: true, delete: true },
      'logs': { create: false, read: true, update: false, delete: false },
      'admins': { create: true, read: true, update: true, delete: true },
      'applications': { create: true, read: true, update: true, delete: true },
      'tokens': { create: false, read: true, update: false, delete: true }
    },
    // User has limited read access
    'user': {
      'users': { create: false, read: true, update: false, delete: false, orgFilter: true },
      'organizations': { create: false, read: true, update: false, delete: false, orgFilter: true },
      'positions': { create: false, read: true, update: false, delete: false },
      'ranks': { create: false, read: true, update: false, delete: false },
      'logs': { create: false, read: false, update: false, delete: false },
      'admins': { create: false, read: false, update: false, delete: false },
      'applications': { create: false, read: false, update: false, delete: false },
      'tokens': { create: false, read: false, update: false, delete: false }
    }
  };
  
  // Map user-friendly table names to sheet names
  const TABLE_SHEET_MAP = {
    'user': 'users',
    'users': 'users',
    'org': 'organizations',
    'organization': 'organizations',
    'organizations': 'organizations',
    'position': 'positions',
    'positions': 'positions',
    'rank': 'ranks',
    'ranks': 'ranks',
    'log': 'logs',
    'logs': 'logs',
    'admin': 'admins',
    'admins': 'admins',
    'app': 'applications',
    'application': 'applications',
    'applications': 'applications',
    'token': 'tokens',
    'tokens': 'tokens'
  };
  
  /**
   * Normalize table name
   */
  function normalizeTableName(tableName) {
    const normalized = TABLE_SHEET_MAP[tableName.toLowerCase()];
    if (!normalized) {
      throw new Error('Invalid table name: ' + tableName);
    }
    return normalized;
  }
  
  /**
   * Check if user can create in table
   */
  function canCreate(userType, tableName, orgId) {
    try {
      const normalizedTable = normalizeTableName(tableName);
      const rules = ACCESS_RULES[userType];
      
      if (!rules || !rules[normalizedTable]) {
        return {
          allowed: false,
          message: 'Access denied: Invalid table or user type'
        };
      }
      
      if (!rules[normalizedTable].create) {
        return {
          allowed: false,
          message: 'Access denied: You do not have permission to create records in ' + normalizedTable
        };
      }
      
      return {
        allowed: true,
        orgFilter: rules[normalizedTable].orgFilter || false
      };
    } catch (error) {
      return {
        allowed: false,
        message: 'Authorization error: ' + error.message
      };
    }
  }
  
  /**
   * Check if user can read from table
   */
  function canRead(userType, tableName, orgId) {
    try {
      const normalizedTable = normalizeTableName(tableName);
      const rules = ACCESS_RULES[userType];
      
      if (!rules || !rules[normalizedTable]) {
        return {
          allowed: false,
          message: 'Access denied: Invalid table or user type'
        };
      }
      
      if (!rules[normalizedTable].read) {
        return {
          allowed: false,
          message: 'Access denied: You do not have permission to read records from ' + normalizedTable
        };
      }
      
      return {
        allowed: true,
        orgFilter: rules[normalizedTable].orgFilter || false
      };
    } catch (error) {
      return {
        allowed: false,
        message: 'Authorization error: ' + error.message
      };
    }
  }
  
  /**
   * Check if user can update in table
   */
  function canUpdate(userType, tableName, orgId) {
    try {
      const normalizedTable = normalizeTableName(tableName);
      const rules = ACCESS_RULES[userType];
      
      if (!rules || !rules[normalizedTable]) {
        return {
          allowed: false,
          message: 'Access denied: Invalid table or user type'
        };
      }
      
      if (!rules[normalizedTable].update) {
        return {
          allowed: false,
          message: 'Access denied: You do not have permission to update records in ' + normalizedTable
        };
      }
      
      return {
        allowed: true,
        orgFilter: rules[normalizedTable].orgFilter || false
      };
    } catch (error) {
      return {
        allowed: false,
        message: 'Authorization error: ' + error.message
      };
    }
  }
  
  /**
   * Check if user can delete from table
   */
  function canDelete(userType, tableName, orgId) {
    try {
      const normalizedTable = normalizeTableName(tableName);
      const rules = ACCESS_RULES[userType];
      
      if (!rules || !rules[normalizedTable]) {
        return {
          allowed: false,
          message: 'Access denied: Invalid table or user type'
        };
      }
      
      if (!rules[normalizedTable].delete) {
        return {
          allowed: false,
          message: 'Access denied: You do not have permission to delete records from ' + normalizedTable
        };
      }
      
      return {
        allowed: true,
        orgFilter: rules[normalizedTable].orgFilter || false
      };
    } catch (error) {
      return {
        allowed: false,
        message: 'Authorization error: ' + error.message
      };
    }
  }
  
  /**
   * Get accessible tables for user type
   */
  function getAccessibleTables(userType) {
    const rules = ACCESS_RULES[userType];
    if (!rules) {
      return [];
    }
    
    const tables = [];
    for (const table in rules) {
      if (rules[table].read || rules[table].create || rules[table].update || rules[table].delete) {
        tables.push({
          name: table,
          permissions: rules[table]
        });
      }
    }
    
    return tables;
  }
  
  /**
   * Validate field-level permissions (optional enhancement)
   */
  function validateFieldAccess(userType, tableName, fieldName, operation) {
    // Protected fields that regular users cannot modify
    const protectedFields = {
      'users': ['uuid', 'created_at', 'updated_at'],
      'organizations': ['uuid', 'created_at', 'updated_at'],
      'positions': ['uuid', 'created_at', 'updated_at'],
      'ranks': ['uuid', 'created_at', 'updated_at']
    };
    
    if (userType === 'user' && operation === 'update') {
      const normalizedTable = normalizeTableName(tableName);
      if (protectedFields[normalizedTable] && 
          protectedFields[normalizedTable].includes(fieldName)) {
        return {
          allowed: false,
          message: 'Cannot modify protected field: ' + fieldName
        };
      }
    }
    
    return { allowed: true };
  }
  
  // Public interface
  return {
    canCreate: canCreate,
    canRead: canRead,
    canUpdate: canUpdate,
    canDelete: canDelete,
    getAccessibleTables: getAccessibleTables,
    validateFieldAccess: validateFieldAccess,
    normalizeTableName: normalizeTableName
  };
  
})();
