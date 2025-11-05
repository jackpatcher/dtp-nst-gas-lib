/**
 * Database.gs
 * CRUD Operations (Create, Read, Update, Delete)
 * 
 * ไม่ใช้ IIFE - เข้าใจง่าย อ่านง่าย
 */

// ====================================
// REQUIRED FIELDS CONFIGURATION
// ====================================

const REQUIRED_FIELDS = {
  users: ['name', 'id13', 'password'],
  organizations: ['org_name', 'province'],
  positions: ['name'],
  ranks: ['name'],
  admins: ['username', 'password', 'name', 'role'],
  applications: ['appname', 'app_key'],
  tokens: ['token', 'user_type', 'user_id', 'expires_at']
};

const UNIQUE_FIELDS = {
  users: ['id13'],
  organizations: ['hrms_id'],
  positions: ['name'],
  ranks: ['name'],
  admins: ['username'],
  applications: ['appname', 'app_key'],
  tokens: ['token']
};

// ====================================
// CREATE
// ====================================

/**
 * สร้างข้อมูลใหม่
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} data - ข้อมูล
 * @param {Object} session - Session ของ user
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function Database_create(tableName, data, session) {
  try {
    // 1. ตรวจสอบ table
    if (!Access.isValidTable(tableName)) {
      return Helpers.response(false, null, 'Invalid table name');
    }
    
    // 2. ตรวจสอบสิทธิ์
    if (!Access.canCreate(tableName, session)) {
      return Access.permissionDenied('create', tableName);
    }
    
    // 3. ตั้งค่า auto fields
    data.uuid = data.uuid || Helpers.uuid();
    data.created_at = Helpers.now();
    data.updated_at = Helpers.now();
    
    if (data.active === undefined) {
      data.active = true;
    }
    
    // 4. Hash password ถ้ามี
    if (data.password) {
      data.password = Helpers.hashPassword(data.password);
    }
    
    // 5. ตรวจสอบ required fields
    const validation = _validateRequiredFields(tableName, data);
    if (!validation.valid) {
      return Helpers.response(false, null, validation.message);
    }
    
    // 6. ตรวจสอบ unique fields
    const uniqueCheck = _validateUniqueFields(tableName, data);
    if (!uniqueCheck.valid) {
      return Helpers.response(false, null, uniqueCheck.message);
    }
    
    // 7. บันทึกข้อมูล
    const result = Sheet.append(tableName, data);
    
    if (!result.success) {
      return Helpers.response(false, null, 'Failed to save data');
    }
    
    // 8. Log การกระทำ
    _logAction(session, 'CREATE', tableName, data.uuid, 'SUCCESS');
    
    // 9. ลบ password ออกจาก response
    const responseData = Object.assign({}, data);
    delete responseData.password;
    
    return Helpers.response(true, responseData, 'Created successfully');
    
  } catch (error) {
    Logger.log('Database_create error: ' + error.toString());
    _logAction(session, 'CREATE', tableName, '', 'ERROR: ' + error.message);
    return Helpers.response(false, null, 'Create failed: ' + error.message);
  }
}

// ====================================
// READ
// ====================================

/**
 * อ่านข้อมูล
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} filters - เงื่อนไขการกรอง (optional)
 * @param {Object} session - Session ของ user
 * @returns {Object} {success: boolean, data: Array, message: string}
 */
function Database_read(tableName, filters, session) {
  try {
    // 1. ตรวจสอบ table
    if (!Access.isValidTable(tableName)) {
      return Helpers.response(false, null, 'Invalid table name');
    }
    
    // 2. ตรวจสอบสิทธิ์
    const readPermission = Access.canRead(tableName, session);
    if (!readPermission) {
      return Access.permissionDenied('read', tableName);
    }
    
    // 3. อ่านข้อมูล
    const result = Sheet.read(tableName, filters);
    
    // 4. กรองข้อมูลตามสิทธิ์
    let filteredRows = Access.filterData(tableName, session, result.rows);
    
    // 5. ลบข้อมูล sensitive
    filteredRows = Access.sanitizeData(filteredRows);
    
    // 6. Log การกระทำ
    _logAction(session, 'READ', tableName, '', 'SUCCESS');
    
    return Helpers.response(true, filteredRows, 'Read successfully');
    
  } catch (error) {
    Logger.log('Database_read error: ' + error.toString());
    return Helpers.response(false, null, 'Read failed: ' + error.message);
  }
}

/**
 * อ่านข้อมูลด้วย UUID
 * @param {string} tableName - ชื่อตาราง
 * @param {string} uuid - UUID
 * @param {Object} session - Session ของ user
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function Database_readByUUID(tableName, uuid, session) {
  try {
    const result = Database_read(tableName, { uuid: uuid }, session);
    
    if (!result.success) {
      return result;
    }
    
    if (result.data.length === 0) {
      return Helpers.response(false, null, 'Record not found');
    }
    
    return Helpers.response(true, result.data[0], 'Read successfully');
    
  } catch (error) {
    Logger.log('Database_readByUUID error: ' + error.toString());
    return Helpers.response(false, null, 'Read failed: ' + error.message);
  }
}

// ====================================
// UPDATE
// ====================================

/**
 * อัปเดตข้อมูล
 * @param {string} tableName - ชื่อตาราง
 * @param {string} uuid - UUID ของข้อมูลที่จะอัปเดต
 * @param {Object} updates - ข้อมูลที่จะอัปเดต
 * @param {Object} session - Session ของ user
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function Database_update(tableName, uuid, updates, session) {
  try {
    // 1. ตรวจสอบ table
    if (!Access.isValidTable(tableName)) {
      return Helpers.response(false, null, 'Invalid table name');
    }
    
    // 2. ตรวจสอบสิทธิ์
    if (!Access.canUpdate(tableName, session)) {
      return Access.permissionDenied('update', tableName);
    }
    
    // 3. ตรวจสอบว่ามีข้อมูลอยู่จริง
    const existing = Sheet.findByUUID(tableName, uuid);
    if (!existing) {
      return Helpers.response(false, null, 'Record not found');
    }
    
    // 4. ห้ามแก้ UUID
    delete updates.uuid;
    delete updates.created_at;
    
    // 5. ตั้งค่า updated_at
    updates.updated_at = Helpers.now();
    
    // 6. Hash password ถ้ามี
    if (updates.password) {
      updates.password = Helpers.hashPassword(updates.password);
    }
    
    // 7. อัปเดตข้อมูล
    const result = Sheet.update(tableName, uuid, updates);
    
    if (!result.success) {
      return Helpers.response(false, null, 'Update failed');
    }
    
    // 8. Log การกระทำ
    _logAction(session, 'UPDATE', tableName, uuid, 'SUCCESS');
    
    // 9. ลบ password ออกจาก response
    const responseData = Object.assign({}, result.data);
    delete responseData.password;
    
    return Helpers.response(true, responseData, 'Updated successfully');
    
  } catch (error) {
    Logger.log('Database_update error: ' + error.toString());
    _logAction(session, 'UPDATE', tableName, uuid, 'ERROR: ' + error.message);
    return Helpers.response(false, null, 'Update failed: ' + error.message);
  }
}

// ====================================
// DELETE
// ====================================

/**
 * ลบข้อมูล (Soft Delete - ตั้ง active = false)
 * @param {string} tableName - ชื่อตาราง
 * @param {string} uuid - UUID ของข้อมูลที่จะลบ
 * @param {Object} session - Session ของ user
 * @returns {Object} {success: boolean, message: string}
 */
function Database_delete(tableName, uuid, session) {
  try {
    // 1. ตรวจสอบ table
    if (!Access.isValidTable(tableName)) {
      return Helpers.response(false, null, 'Invalid table name');
    }
    
    // 2. ตรวจสอบสิทธิ์
    if (!Access.canDelete(tableName, session)) {
      return Access.permissionDenied('delete', tableName);
    }
    
    // 3. ตรวจสอบว่ามีข้อมูลอยู่จริง
    const existing = Sheet.findByUUID(tableName, uuid);
    if (!existing) {
      return Helpers.response(false, null, 'Record not found');
    }
    
    // 4. Soft delete (ตั้ง active = false)
    const result = Sheet.update(tableName, uuid, {
      active: false,
      updated_at: Helpers.now()
    });
    
    if (!result.success) {
      return Helpers.response(false, null, 'Delete failed');
    }
    
    // 5. Log การกระทำ
    _logAction(session, 'DELETE', tableName, uuid, 'SUCCESS');
    
    return Helpers.response(true, null, 'Deleted successfully');
    
  } catch (error) {
    Logger.log('Database_delete error: ' + error.toString());
    _logAction(session, 'DELETE', tableName, uuid, 'ERROR: ' + error.message);
    return Helpers.response(false, null, 'Delete failed: ' + error.message);
  }
}

// ====================================
// VALIDATION HELPERS
// ====================================

/**
 * ตรวจสอบ required fields
 * @private
 */
function _validateRequiredFields(tableName, data) {
  const required = REQUIRED_FIELDS[tableName] || [];
  
  for (let i = 0; i < required.length; i++) {
    const field = required[i];
    if (!data[field]) {
      return { valid: false, message: 'Required field missing: ' + field };
    }
  }
  
  // ตรวจสอบ ID13 format สำหรับ users
  if (tableName === 'users' && data.id13) {
    if (!Helpers.validateId13(data.id13)) {
      return { valid: false, message: 'Invalid ID13 format' };
    }
  }
  
  // ตรวจสอบ password strength
  if (data.password && tableName !== 'tokens') {
    const passwordCheck = Helpers.validatePassword(data.password);
    if (!passwordCheck.valid) {
      return passwordCheck;
    }
  }
  
  return { valid: true };
}

/**
 * ตรวจสอบ unique fields
 * @private
 */
function _validateUniqueFields(tableName, data) {
  const unique = UNIQUE_FIELDS[tableName] || [];
  
  for (let i = 0; i < unique.length; i++) {
    const field = unique[i];
    
    if (!data[field]) continue;
    
    // ค้นหาว่ามีข้อมูลซ้ำหรือไม่
    const filters = {};
    filters[field] = data[field];
    
    const existing = Sheet.read(tableName, filters);
    
    if (existing.rows.length > 0) {
      return { valid: false, message: 'Duplicate value for field: ' + field };
    }
  }
  
  return { valid: true };
}

/**
 * บันทึก log
 * @private
 */
function _logAction(session, action, tableName, recordId, status) {
  try {
    Sheet.log({
      user_id13: session ? session.user_identifier : '',
      action: action,
      table_name: tableName,
      record_id: recordId,
      status: status,
      app_id: session ? session.app_key : ''
    });
  } catch (error) {
    Logger.log('_logAction error: ' + error.toString());
    // Don't throw - logging should not break operations
  }
}

// ====================================
// EXPORT
// ====================================

const Database = {
  create: Database_create,
  read: Database_read,
  readByUUID: Database_readByUUID,
  update: Database_update,
  delete: Database_delete
};
