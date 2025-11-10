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
function userLogin(id13, password) {
  try {
    // 1. Login ผ่าน gas-lib
    const loginResult = dtpnstlib.Auth.login({
      id13: id13,
      password: password
    }, 'user');
    
    if (!loginResult.success) {
      return { success: false, message: loginResult.message };
    }
    
    // 2. สร้าง token
    const user = loginResult.data;
    const tokenResult = dtpnstlib.Auth.createToken(user, 'user');
    
    // 3. เก็บ token ใน User Properties
    PropertiesService.getUserProperties()
      .setProperty('USER_TOKEN', tokenResult.token)
      .setProperty('USER_ID', user.uuid)
      .setProperty('USER_NAME', user.first_name + ' ' + user.last_name)
      .setProperty('USER_ID13', id13);
    
    return {
      success: true,
      userName: user.first_name + ' ' + user.last_name,
      message: 'Login successful'
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
      .getProperty('USER_TOKEN');
    
    const validateResult = dtpnstlib.Auth.validateToken(token);
    
    if (!validateResult.success) {
      return { success: false, message: 'Token expired, please login again' };
    }
    
    // 2. ดึงข้อมูล user
    const userId = PropertiesService.getUserProperties().getProperty('USER_ID');
    const userName = PropertiesService.getUserProperties().getProperty('USER_NAME');
    const userID13 = PropertiesService.getUserProperties().getProperty('USER_ID13');
    
    // 3. สร้างคำขอ
    const request = {
      uuid: Utilities.getUuid(),
      user_id: userId,
      user_id13: userID13,
      user_name: userName,
      document_type: documentType,
      request_date: new Date().toISOString(),
      status: 'pending',
      approved_by: null,
      approved_date: null,
      rejected_by: null,
      rejection_reason: null,
      file_url: null,
      file_id: null,
      downloaded: false,
      download_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // 4. บันทึกลง local sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('document_requests');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(function(header) {
      return request[header] || '';
    });
    
    sheet.appendRow(row);
    
    // 5. บันทึก log ใน gas-lib
    dtpnstlib.Sheet.log({
      action: 'document_request_created',
      user_type: 'user',
      user_id: userId,
      record_id: request.uuid,
      details: 'User requested ' + documentType + ': ' + userName
    });
    
    return {
      success: true,
      message: 'ส่งคำขอเรียบร้อย รอการอนุมัติจากเจ้าหน้าที่'
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
    const userId = PropertiesService.getUserProperties().getProperty('USER_ID');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('document_requests');
    
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
