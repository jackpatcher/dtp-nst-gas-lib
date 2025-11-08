/**
 * Access.gs
 * ระบบจัดการสิทธิ์การเข้าถึง (Authorization)
 * 
 * ไม่ใช้ IIFE - เข้าใจง่าย อ่านง่าย
 */

// ====================================
// ACCESS RULES
// ====================================

const ACCESS_RULES = {
  // Admin: สิทธิ์เต็ม
  admin: {
    users: { create: true, read: true, update: true, delete: true },
    organizations: { create: true, read: true, update: true, delete: true },
    positions: { create: true, read: true, update: true, delete: true },
    ranks: { create: true, read: true, update: true, delete: true },
    logs: { create: false, read: true, update: false, delete: false },
    admins: { create: true, read: true, update: true, delete: true },
    applications: { create: true, read: true, update: true, delete: true },
    tokens: { create: false, read: true, update: false, delete: true }
  },
  
  // User: อ่านได้เฉพาะองค์กรตัวเอง
  user: {
    users: { create: false, read: 'own_org', update: false, delete: false },
    organizations: { create: false, read: 'own_org', update: false, delete: false },
    positions: { create: false, read: true, update: false, delete: false },
    ranks: { create: false, read: true, update: false, delete: false },
    logs: { create: false, read: false, update: false, delete: false },
    admins: { create: false, read: false, update: false, delete: false },
    applications: { create: false, read: false, update: false, delete: false },
    tokens: { create: false, read: false, update: false, delete: false }
  }
};

// ====================================
// PERMISSION CHECK FUNCTIONS
// ====================================

/**
 * ตรวจสอบว่าสามารถสร้างข้อมูลได้หรือไม่
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} session - ข้อมูล session (user_type, hrms_id)
 * @returns {boolean}
 */
function Access_canCreate(tableName, session) {
  if (!session || !session.user_type) return false;
  
  const userType = session.user_type;
  const rules = ACCESS_RULES[userType];
  
  if (!rules || !rules[tableName]) return false;
  
  return rules[tableName].create === true;
}

/**
 * ตรวจสอบว่าสามารถอ่านข้อมูลได้หรือไม่
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} session - ข้อมูล session
 * @returns {boolean|string} true, false, หรือ 'own_org'
 */
function Access_canRead(tableName, session) {
  if (!session || !session.user_type) return false;
  
  const userType = session.user_type;
  const rules = ACCESS_RULES[userType];
  
  if (!rules || !rules[tableName]) return false;
  
  return rules[tableName].read; // อาจเป็น true, false, หรือ 'own_org'
}

/**
 * ตรวจสอบว่าสามารถอัปเดตข้อมูลได้หรือไม่
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} session - ข้อมูล session
 * @returns {boolean}
 */
function Access_canUpdate(tableName, session) {
  if (!session || !session.user_type) return false;
  
  const userType = session.user_type;
  const rules = ACCESS_RULES[userType];
  
  if (!rules || !rules[tableName]) return false;
  
  return rules[tableName].update === true;
}

/**
 * ตรวจสอบว่าสามารถลบข้อมูลได้หรือไม่
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} session - ข้อมูล session
 * @returns {boolean}
 */
function Access_canDelete(tableName, session) {
  if (!session || !session.user_type) return false;
  
  const userType = session.user_type;
  const rules = ACCESS_RULES[userType];
  
  if (!rules || !rules[tableName]) return false;
  
  return rules[tableName].delete === true;
}

// ====================================
// DATA FILTERING
// ====================================

/**
 * กรองข้อมูลตามสิทธิ์
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} session - ข้อมูล session
 * @param {Array} rows - ข้อมูลทั้งหมด
 * @returns {Array} ข้อมูลที่กรองแล้ว
 */
function Access_filterData(tableName, session, rows) {
  if (!session || !rows) return [];
  
  const readPermission = Access_canRead(tableName, session);
  
  // ถ้าไม่มีสิทธิ์อ่านเลย
  if (readPermission === false) {
    return [];
  }
  
  // ถ้ามีสิทธิ์อ่านทั้งหมด
  if (readPermission === true) {
    return rows;
  }
  
  // ถ้าอ่านได้เฉพาะองค์กรตัวเอง
  if (readPermission === 'own_org' && session.hrms_id) {
    return rows.filter(function(row) {
      return row.hrms_id === session.hrms_id;
    });
  }
  
  return [];
}

/**
 * ลบข้อมูลที่ sensitive ออก (เช่น password)
 * @param {Array} rows - ข้อมูล
 * @returns {Array} ข้อมูลที่ปลอดภัย
 */
function Access_sanitizeData(rows) {
  if (!rows || rows.length === 0) return [];
  
  return rows.map(function(row) {
    const clean = Object.assign({}, row);
    
    // ลบ password
    delete clean.password;
    
    // ลบ _rowNumber (internal use)
    delete clean._rowNumber;
    
    return clean;
  });
}

// ====================================
// VALIDATION
// ====================================

/**
 * ตรวจสอบว่าตารางมีอยู่ในระบบหรือไม่
 * @param {string} tableName - ชื่อตาราง
 * @returns {boolean}
 */
function Access_isValidTable(tableName) {
  const validTables = ['users', 'organizations', 'positions', 'ranks', 'logs', 'admins', 'applications', 'tokens'];
  return validTables.indexOf(tableName) !== -1;
}

/**
 * สร้าง error response สำหรับ permission denied
 * @param {string} action - การกระทำที่ถูกปฏิเสธ
 * @param {string} tableName - ชื่อตาราง
 * @returns {Object}
 */
function Access_permissionDenied(action, tableName) {
  return Helpers.response(
    false,
    null,
    'Permission denied: Cannot ' + action + ' ' + tableName
  );
}

// ====================================
// EXPORT
// ====================================

const Access = {
  canCreate: Access_canCreate,
  canRead: Access_canRead,
  canUpdate: Access_canUpdate,
  canDelete: Access_canDelete,
  filterData: Access_filterData,
  sanitizeData: Access_sanitizeData,
  isValidTable: Access_isValidTable,
  permissionDenied: Access_permissionDenied,
  RULES: ACCESS_RULES
};
