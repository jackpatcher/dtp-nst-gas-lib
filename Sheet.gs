/**
 * Sheet.gs
 * จัดการ Google Sheets (Database Layer)
 * 
 * ไม่ใช้ IIFE - เข้าใจง่าย อ่านง่าย
 */

// Cache
let _spreadsheetCache = null;

// ⚠️ เปลี่ยน SPREADSHEET_ID นี้เป็นของคุณ
// หา ID จาก URL: https://docs.google.com/spreadsheets/d/YOUR_ID_HERE/edit
const SPREADSHEET_ID = '';  // ใส่ ID ของ spreadsheet ที่เก็บข้อมูล

// ====================================
// SCHEMA DEFINITION
// ====================================

const SHEET_SCHEMA = {
  config: ['key', 'value', 'description', 'updated_at'],
  users: ['uuid', 'name', 'id13', 'password', 'position_id', 'rank_id', 'hrms_id', 'active', 'created_at', 'updated_at'],
  organizations: ['uuid', 'hrms_id', 'dmz_id', 'org_name', 'subdistrict', 'district', 'province', 'created_at', 'updated_at'],
  positions: ['uuid', 'position_id', 'name', 'created_at', 'updated_at'],
  ranks: ['uuid', 'rank_id', 'name', 'created_at', 'updated_at'],
  logs: ['uuid', 'action', 'table_name', 'record_id', 'user_id', 'user_type', 'timestamp', 'details'],
  admins: ['uuid', 'username', 'password', 'email', 'first_name', 'last_name', 'status', 'created_at', 'updated_at'],
  applications: ['uuid', 'app_name', 'app_key', 'app_secret', 'status', 'created_at', 'updated_at'],
  tokens: ['uuid', 'token', 'user_type', 'user_id', 'user_identifier', 'app_key', 'hrms_id', 'expires_at', 'revoked', 'revoked_at', 'last_used', 'created_at']
};

// ====================================
// SPREADSHEET ACCESS
// ====================================

/**
 * รับ Spreadsheet ที่ active
 * @returns {Spreadsheet} Google Spreadsheet object
 */
function Sheet_getSpreadsheet() {
  if (_spreadsheetCache) {
    return _spreadsheetCache;
  }
  
  // ถ้ามี SPREADSHEET_ID ใช้ openById
  // ถ้าไม่มี (ว่างเปล่า) ใช้ active spreadsheet สำหรับทดสอบ local
  if (SPREADSHEET_ID) {
    _spreadsheetCache = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    _spreadsheetCache = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  if (!_spreadsheetCache) {
    throw new Error('No spreadsheet found. Please set SPREADSHEET_ID.');
  }
  
  return _spreadsheetCache;
}

/**
 * Clear cache (ใช้เมื่อต้องการ refresh)
 */
function Sheet_clearCache() {
  _spreadsheetCache = null;
}

/**
 * รับ Sheet ตามชื่อ (ถ้าไม่มีจะสร้างใหม่)
 * @param {string} sheetName - ชื่อ sheet
 * @returns {Sheet} Google Sheet object
 */
function Sheet_getSheet(sheetName) {
  const ss = Sheet_getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = _createSheet(sheetName);
  }
  
  return sheet;
}

/**
 * สร้าง sheet ใหม่พร้อม headers
 * @private
 */
function _createSheet(sheetName) {
  const ss = Sheet_getSpreadsheet();
  const sheet = ss.insertSheet(sheetName);
  
  // ตั้งค่า headers
  const headers = SHEET_SCHEMA[sheetName];
  if (headers && headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// ====================================
// READ OPERATIONS
// ====================================

/**
 * อ่านข้อมูลจาก sheet
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} filters - เงื่อนไขการกรอง (optional)
 * @returns {Object} {headers: [], rows: []}
 */
function Sheet_read(tableName, filters) {
  const sheet = Sheet_getSheet(tableName);
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers = data[0];
  const rows = [];
  
  // แปลง array เป็น object - ง่ายที่สุด ไม่มีเงื่อนไขซับซ้อน
  for (let i = 1; i < data.length; i++) {
    const row = {};
    
    // แปลงทุก column เป็น object properties
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    
    // เช็ค filter แบบง่ายๆ - เปรียบเทียบตรงๆ ไม่มี trick
    if (filters) {
      let match = true;
      
      for (let key in filters) {
        // แปลงทั้งสองเป็น string แล้วเปรียบเทียบ (แก้ปัญหา type mismatch)
        const rowValueStr = String(row[key] || '');
        const filterValueStr = String(filters[key] || '');
        
        if (rowValueStr !== filterValueStr) {
          match = false;
          break;
        }
      }
      
      if (!match) continue;
    }
    
    // เก็บ row number สำหรับ update ภายหลัง
    row._rowNumber = i + 1;
    rows.push(row);
  }
  
  return { headers: headers, rows: rows };
}

/**
 * หาข้อมูลด้วย UUID
 * @param {string} tableName - ชื่อตาราง
 * @param {string} uuid - UUID ที่ต้องการหา
 * @returns {Object|null} ข้อมูลที่พบหรือ null
 */
function Sheet_findByUUID(tableName, uuid) {
  const result = Sheet_read(tableName, { uuid: uuid });
  return result.rows.length > 0 ? result.rows[0] : null;
}

// ====================================
// WRITE OPERATIONS
// ====================================

/**
 * เพิ่มข้อมูลใหม่
 * @param {string} tableName - ชื่อตาราง
 * @param {Object} data - ข้อมูลที่จะเพิ่ม
 * @returns {Object} {success: boolean, message: string}
 */
function Sheet_append(tableName, data) {
  try {
    const sheet = Sheet_getSheet(tableName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // สร้าง row array ตาม headers - ง่ายที่สุด ไม่มี trick
    const row = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = data[header];
      
      // แปลงค่า
      if (value === undefined || value === null) {
        row.push('');
      } else if (value instanceof Date) {
        row.push(value.toISOString());
      } else {
        row.push(value);
      }
    }
    
    // เขียนลง sheet แบบตรงไปตรงมา
    sheet.appendRow(row);
    
    return { success: true, message: 'Data appended successfully' };
    
  } catch (error) {
    Logger.log('Sheet_append error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * อัปเดตข้อมูล
 * @param {string} tableName - ชื่อตาราง
 * @param {string} uuid - UUID ของข้อมูลที่จะอัปเดต
 * @param {Object} updates - ข้อมูลที่จะอัปเดต
 * @returns {Object} {success: boolean, data: Object, message: string}
 */
function Sheet_update(tableName, uuid, updates) {
  try {
    const sheet = Sheet_getSheet(tableName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const uuidIndex = headers.indexOf('uuid');
    if (uuidIndex === -1) {
      return { success: false, message: 'UUID column not found' };
    }
    
    // หา row ที่ตรงกับ UUID
    for (let i = 1; i < data.length; i++) {
      if (data[i][uuidIndex] === uuid) {
        // อัปเดตแต่ละ field
        for (let key in updates) {
          if (updates.hasOwnProperty(key)) {
            const colIndex = headers.indexOf(key);
            
            if (colIndex !== -1) {
              let value = updates[key];
              
              // แปลง Date object
              if (value instanceof Date) {
                value = value.toISOString();
              }
              
              sheet.getRange(i + 1, colIndex + 1).setValue(value);
            }
          }
        }
        
        // สร้าง updated record
        const updatedRecord = {};
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          updatedRecord[header] = updates[header] !== undefined ? updates[header] : data[i][j];
        }
        
        return { 
          success: true, 
          data: updatedRecord,
          message: 'Updated successfully' 
        };
      }
    }
    
    return { success: false, message: 'Record not found' };
    
  } catch (error) {
    Logger.log('Sheet_update error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * อัปเดต field เดียว (สะดวกกว่าเมื่อต้องการแก้ field เดียว)
 * @param {string} tableName - ชื่อตาราง
 * @param {string} uuid - UUID
 * @param {string} fieldName - ชื่อ field
 * @param {*} value - ค่าใหม่
 * @returns {Object} {success: boolean, message: string}
 */
function Sheet_updateField(tableName, uuid, fieldName, value) {
  const updates = {};
  updates[fieldName] = value;
  return Sheet_update(tableName, uuid, updates);
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * ตรวจสอบว่า sheet มีอยู่หรือไม่
 * @param {string} sheetName - ชื่อ sheet
 * @returns {boolean}
 */
function Sheet_exists(sheetName) {
  const ss = Sheet_getSpreadsheet();
  return ss.getSheetByName(sheetName) !== null;
}

/**
 * สร้าง sheets ทั้งหมดตาม schema
 * @returns {Object} {success: boolean, message: string}
 */
function Sheet_initializeAll() {
  try {
    const tableNames = Object.keys(SHEET_SCHEMA);
    
    tableNames.forEach(function(tableName) {
      Sheet_getSheet(tableName);
    });
    
    return { 
      success: true, 
      message: 'Initialized ' + tableNames.length + ' sheets' 
    };
    
  } catch (error) {
    Logger.log('Sheet_initializeAll error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * บันทึก log
 * @param {Object} logData - ข้อมูล log
 */
function Sheet_log(logData) {
  try {
    const logEntry = {
      uuid: Helpers.generateUUID(),
      action: logData.action || '',
      table_name: logData.table_name || '',
      record_id: logData.record_id || '',
      user_id: logData.user_id || '',
      user_type: logData.user_type || '',
      timestamp: Helpers.now(),
      details: logData.details || ''
    };
    
    Sheet_append('logs', logEntry);
    
  } catch (error) {
    Logger.log('Sheet_log error: ' + error.toString());
    // Don't throw - logging should not break operations
  }
}

// ====================================
// EXPORT
// ====================================

const Sheet = {
  getSpreadsheet: Sheet_getSpreadsheet,
  clearCache: Sheet_clearCache,
  getSheet: Sheet_getSheet,
  read: Sheet_read,
  findByUUID: Sheet_findByUUID,
  append: Sheet_append,
  update: Sheet_update,
  updateField: Sheet_updateField,
  exists: Sheet_exists,
  initializeAll: Sheet_initializeAll,
  log: Sheet_log,
  SCHEMA: SHEET_SCHEMA
};
