/**
 * Config.gs
 * การตั้งค่าทั้งหมดของ gas-app
 * ไฟล์นี้รวมการตั้งค่าทั้งหมดไว้ที่เดียว เพื่อง่ายต่อการจัดการและแก้ไข
 */

/**
 * ========================================
 * APPLICATION SETTINGS
 * ========================================
 */

// ข้อมูลแอปพลิเคชัน
const Config = {
  
  // Application Info
  APP_KEY: 'gas-app-document-system-2025',
  APP_NAME: 'ระบบขอเอกสารประวัติข้าราชการ',
  APP_DESCRIPTION: 'ระบบขอเอกสาร กพ.7 และ กคศ.16',
  APP_VERSION: '1.0.0',
  
  /**
   * ========================================
   * DOCUMENT SETTINGS
   * ========================================
   */
  
  // ประเภทเอกสารที่รองรับ
  DOCUMENT_TYPES: {
    GP7: 'กพ.7',
    KKSH16: 'กคศ.16'
  },
  
  // ชื่อ Folder สำหรับเก็บไฟล์ (ใน Google Drive)
  DRIVE_FOLDER_NAME: 'ประวัติข้าราชการ',
  
  // รูปแบบชื่อไฟล์: {id13}_{ชื่อ-สกุล}.pdf
  FILE_NAME_PATTERN: /^(\d{13})_(.+)\.pdf$/,
  FILE_NAME_FORMAT: 'ID13_ชื่อ-สกุล.pdf',
  FILE_NAME_EXAMPLE: '1234567890123_นายทดสอบ_ระบบ.pdf',
  
  // รองรับไฟล์ประเภทใด
  ALLOWED_FILE_TYPES: ['application/pdf'],
  ALLOWED_FILE_EXTENSIONS: ['.pdf'],
  
  /**
   * ========================================
   * SHEET SETTINGS
   * ========================================
   */
  
  // ชื่อ Sheet ต่างๆ ในระบบ
  SHEETS: {
    DOCUMENT_REQUESTS: 'document_requests',  // Sheet สำหรับเก็บคำขอเอกสาร
    ADMIN_LOGS: 'admin_logs'                  // Sheet สำหรับเก็บ Log ของ Admin
  },
  
  // Schema สำหรับ document_requests
  DOCUMENT_REQUESTS_SCHEMA: [
    'uuid',
    'user_id',
    'user_id13',
    'user_name',
    'document_type',
    'request_date',
    'status',
    'file_url',
    'file_id',
    'approved_by',
    'approved_date',
    'rejection_reason',
    'downloaded_date',
    'created_at',
    'updated_at'
  ],
  
  // Schema สำหรับ admin_logs
  ADMIN_LOGS_SCHEMA: [
    'uuid',
    'admin_id',
    'admin_name',
    'action',
    'details',
    'timestamp',
    'created_at'
  ],
  
  // สถานะของคำขอ
  REQUEST_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },
  
  /**
   * ========================================
   * AUTHENTICATION SETTINGS
   * ========================================
   */
  
  // Properties Service Keys
  PROPERTIES: {
    // Script Properties
    APP_KEY: 'APP_KEY',
    SPREADSHEET_ID: 'SPREADSHEET_ID',
    
    // User Properties (Session)
    USER_TOKEN: 'USER_TOKEN',
    USER_ID: 'USER_ID',
    USER_NAME: 'USER_NAME',
    ADMIN_TOKEN: 'ADMIN_TOKEN',
    ADMIN_ID: 'ADMIN_ID',
    ADMIN_NAME: 'ADMIN_NAME'
  },
  
  /**
   * ========================================
   * UI SETTINGS
   * ========================================
   */
  
  // ข้อความแสดงผล
  MESSAGES: {
    // Success Messages
    LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ',
    REQUEST_CREATED: 'ส่งคำขอเรียบร้อย',
    FILE_UPLOADED: 'อัพโหลดไฟล์เรียบร้อย',
    REQUEST_APPROVED: 'อนุมัติคำขอเรียบร้อย',
    REQUEST_REJECTED: 'ปฏิเสธคำขอเรียบร้อย',
    
    // Error Messages
    LOGIN_FAILED: 'Login ไม่สำเร็จ',
    INVALID_CREDENTIALS: 'Username หรือ Password ไม่ถูกต้อง',
    UNAUTHORIZED: 'Unauthorized',
    INVALID_TOKEN: 'Token ไม่ถูกต้องหรือหมดอายุ',
    FILE_FORMAT_ERROR: 'รูปแบบชื่อไฟล์ไม่ถูกต้อง',
    NO_FILE_SELECTED: 'กรุณาเลือกไฟล์',
    
    // Warning Messages
    DUPLICATE_REQUEST: 'คุณเคยขอเอกสารประเภทนี้แล้ว',
    NO_DATA: 'ไม่มีข้อมูล',
    PENDING_APPROVAL: 'รอการอนุมัติ'
  },
  
  // Page Routing
  PAGES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  
  /**
   * ========================================
   * ADMIN LOG ACTIONS
   * ========================================
   */
  
  // ประเภทการกระทำของ Admin (สำหรับบันทึก Log)
  ADMIN_ACTIONS: {
    LOGIN: 'admin_login',
    APPROVE_REQUEST: 'approve_request',
    REJECT_REQUEST: 'reject_request',
    UPLOAD_FILE: 'upload_file',
    UPLOAD_MULTIPLE: 'upload_multiple_files',
    VIEW_REQUESTS: 'view_requests',
    VIEW_STATISTICS: 'view_statistics',
    VIEW_LOGS: 'view_logs'
  },
  
  /**
   * ========================================
   * LIBRARY SETTINGS
   * ========================================
   */
  
  // gas-lib Configuration
  LIBRARY: {
    ID: 'dtpnstlib',  // Library identifier
    // เพิ่ม Library ID ตรงนี้หากต้องการ reference
  },
  
  /**
   * ========================================
   * HELPER FUNCTIONS
   * ========================================
   */
  
  /**
   * ดึงค่า Config
   * @param {string} key - Key ของ Config (รองรับ nested key เช่น 'SHEETS.DOCUMENT_REQUESTS')
   * @returns {*} ค่าที่ตั้งไว้
   */
  get: function(key) {
    const keys = key.split('.');
    let value = this;
    
    for (let i = 0; i < keys.length; i++) {
      if (value && typeof value === 'object' && keys[i] in value) {
        value = value[keys[i]];
      } else {
        return undefined;
      }
    }
    
    return value;
  },
  
  /**
   * ตรวจสอบว่าไฟล์เป็นประเภทที่รองรับหรือไม่
   * @param {string} fileName - ชื่อไฟล์
   * @param {string} mimeType - MIME Type
   * @returns {boolean}
   */
  isValidFileType: function(fileName, mimeType) {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return this.ALLOWED_FILE_TYPES.includes(mimeType) && 
           this.ALLOWED_FILE_EXTENSIONS.includes(extension);
  },
  
  /**
   * ตรวจสอบรูปแบบชื่อไฟล์
   * @param {string} fileName - ชื่อไฟล์
   * @returns {Object|null} - {id13, name} หรือ null ถ้าไม่ตรง
   */
  parseFileName: function(fileName) {
    const match = fileName.match(this.FILE_NAME_PATTERN);
    if (!match) {
      return null;
    }
    
    return {
      id13: match[1],
      name: match[2]
    };
  },
  
  /**
   * สร้างชื่อไฟล์ตามรูปแบบ
   * @param {string} id13 - เลขประจำตัว 13 หลัก
   * @param {string} name - ชื่อ-สกุล
   * @returns {string} - ชื่อไฟล์
   */
  generateFileName: function(id13, name) {
    return id13 + '_' + name + '.pdf';
  },
  
  /**
   * ดึง Spreadsheet ID จาก Script Properties
   * @returns {string|null}
   */
  getSpreadsheetId: function() {
    return PropertiesService.getScriptProperties()
      .getProperty(this.PROPERTIES.SPREADSHEET_ID);
  },
  
  /**
   * ตั้งค่า Spreadsheet ID
   * @param {string} spreadsheetId
   */
  setSpreadsheetId: function(spreadsheetId) {
    PropertiesService.getScriptProperties()
      .setProperty(this.PROPERTIES.SPREADSHEET_ID, spreadsheetId);
  },
  
  /**
   * ดึง APP_KEY จาก Script Properties
   * @returns {string}
   */
  getAppKey: function() {
    const storedKey = PropertiesService.getScriptProperties()
      .getProperty(this.PROPERTIES.APP_KEY);
    return storedKey || this.APP_KEY;
  },
  
  /**
   * ตั้งค่า APP_KEY
   */
  setAppKey: function() {
    PropertiesService.getScriptProperties()
      .setProperty(this.PROPERTIES.APP_KEY, this.APP_KEY);
  }
};

/**
 * ========================================
 * VALIDATION FUNCTIONS
 * ========================================
 */

/**
 * ตรวจสอบ ID 13 หลัก
 * @param {string} id13
 * @returns {boolean}
 */
function isValidId13(id13) {
  return /^\d{13}$/.test(id13);
}

/**
 * ตรวจสอบสถานะคำขอ
 * @param {string} status
 * @returns {boolean}
 */
function isValidRequestStatus(status) {
  return Object.values(Config.REQUEST_STATUS).includes(status);
}

/**
 * ตรวจสอบประเภทเอกสาร
 * @param {string} documentType
 * @returns {boolean}
 */
function isValidDocumentType(documentType) {
  return Object.values(Config.DOCUMENT_TYPES).includes(documentType);
}

/**
 * ========================================
 * EXPORT CONFIG (สำหรับการทดสอบ)
 * ========================================
 */

/**
 * แสดงค่า Config ทั้งหมด (สำหรับ Debug)
 */
function showConfig() {
  Logger.log('=== GAS-APP CONFIGURATION ===');
  Logger.log('APP_KEY: ' + Config.APP_KEY);
  Logger.log('APP_NAME: ' + Config.APP_NAME);
  Logger.log('Document Types: ' + JSON.stringify(Config.DOCUMENT_TYPES));
  Logger.log('Drive Folder: ' + Config.DRIVE_FOLDER_NAME);
  Logger.log('Sheets: ' + JSON.stringify(Config.SHEETS));
  Logger.log('=============================');
  
  return Config;
}

/**
 * ทดสอบ Config Functions
 */
function testConfig() {
  Logger.log('Testing Config.get()...');
  Logger.log('APP_NAME: ' + Config.get('APP_NAME'));
  Logger.log('SHEETS.DOCUMENT_REQUESTS: ' + Config.get('SHEETS.DOCUMENT_REQUESTS'));
  
  Logger.log('\nTesting parseFileName()...');
  const parsed = Config.parseFileName('1234567890123_นายทดสอบ_ระบบ.pdf');
  Logger.log('Parsed: ' + JSON.stringify(parsed));
  
  Logger.log('\nTesting generateFileName()...');
  const fileName = Config.generateFileName('1234567890123', 'นายทดสอบ_ระบบ');
  Logger.log('Generated: ' + fileName);
  
  Logger.log('\nTesting isValidFileType()...');
  const isValid = Config.isValidFileType('test.pdf', 'application/pdf');
  Logger.log('Valid PDF: ' + isValid);
  
  Logger.log('\nTesting validation functions...');
  Logger.log('isValidId13("1234567890123"): ' + isValidId13('1234567890123'));
  Logger.log('isValidDocumentType("กพ.7"): ' + isValidDocumentType('กพ.7'));
  Logger.log('isValidRequestStatus("pending"): ' + isValidRequestStatus('pending'));
}
