/**
 * UserController.gs
 * User Functions - Login, Request Document, View Requests
 */

/**
 * User Login
 * @param {string} id13 - เลขประจำตัว 13 หลัก
 * @param {string} password - รหัสผ่าน
 * @returns {Object} {success, userName, message}
 */
function userLogin(username, password) {
  try {
    // เรียกใช้ dtpnstlib.Auth.login
    const loginResult = dtpnstlib.Auth.login({
      username: username,
      password: password,
      role: 'user'
    });
    
    if (!loginResult.success) {
      return { success: false, message: Config.MESSAGES.LOGIN_FAILED };
    }
    
    // สร้าง token สำหรับ user
    const user = loginResult.data;
    const tokenResult = dtpnstlib.Auth.createToken(user, 'user');
    
    if (!tokenResult.success) {
      return { success: false, message: Config.MESSAGES.LOGIN_FAILED };
    }
    
    // เก็บ token ใน UserProperties
    PropertiesService.getUserProperties()
      .setProperty(Config.PROPERTIES.USER_TOKEN, tokenResult.token);
    PropertiesService.getUserProperties()
      .setProperty(Config.PROPERTIES.USER_ID, user.id);
    PropertiesService.getUserProperties()
      .setProperty(Config.PROPERTIES.USER_NAME, user.name);
    
    return {
      success: true,
      userId: user.id,
      userName: user.name,
      message: Config.MESSAGES.LOGIN_SUCCESS
    };
    
  } catch (error) {
    Logger.log('userLogin error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ขอเอกสาร
 * @param {string} documentType - "กพ7" หรือ "กคศ16"
 * @returns {Object} {success, message}
 */
function createDocumentRequest(documentType) {
  try {
    // 1. ตรวจสอบ token
    const token = PropertiesService.getUserProperties()
      .getProperty(Config.PROPERTIES.USER_TOKEN);
    
    const validateResult = dtpnstlib.Auth.validateToken(token);
    
    if (!validateResult.success) {
      return { success: false, message: Config.MESSAGES.INVALID_TOKEN };
    }
    
    // 2. ดึงข้อมูล user
    const userId = PropertiesService.getUserProperties().getProperty(Config.PROPERTIES.USER_ID);
    const userName = PropertiesService.getUserProperties().getProperty(Config.PROPERTIES.USER_NAME);
    const userID13 = validateResult.data.id13;
    
    // 3. ตรวจสอบประเภทเอกสาร
    if (!isValidDocumentType(documentType)) {
      return { success: false, message: 'ประเภทเอกสารไม่ถูกต้อง' };
    }
    
    // 4. สร้างคำขอ
    const request = {
      uuid: Utilities.getUuid(),
      user_id: userId,
      user_id13: userID13,
      user_name: userName,
      document_type: documentType,
      request_date: new Date().toISOString(),
      status: Config.REQUEST_STATUS.PENDING,
      file_url: null,
      file_id: null,
      approved_by: null,
      approved_date: null,
      rejection_reason: null,
      downloaded_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 5. บันทึกลง local sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(Config.SHEETS.DOCUMENT_REQUESTS);
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(function(header) {
      return request[header] || '';
    });
    
    sheet.appendRow(row);
    
    // 6. บันทึก log ใน gas-lib
    dtpnstlib.Sheet.log({
      action: 'document_request_created',
      user_type: 'user',
      user_id: userId,
      record_id: request.uuid,
      details: 'User requested ' + documentType + ': ' + userName
    });
    
    return {
      success: true,
      message: Config.MESSAGES.REQUEST_CREATED + ' รอการอนุมัติจากเจ้าหน้าที่'
    };
    
  } catch (error) {
    Logger.log('createDocumentRequest error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดูคำขอของตัวเอง
 * @returns {Array} รายการคำขอ
 */
function getUserRequests() {
  try {
    const userId = PropertiesService.getUserProperties().getProperty(Config.PROPERTIES.USER_ID);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(Config.SHEETS.DOCUMENT_REQUESTS);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const userRequests = rows.filter(function(row) {
      const rowUserId = row[headers.indexOf('user_id')];
      return rowUserId === userId;
    }).map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    
    return userRequests;
    
  } catch (error) {
    Logger.log('getUserRequests error: ' + error.toString());
    return [];
  }
}
