/**
 * AdminController.gs
 * Admin Functions - Login, Approve/Reject, Statistics, Logs
 */

/**
 * Admin Login (ใช้ตาราง admins จาก gas-lib)
 * @param {string} username
 * @param {string} password
 * @returns {Object} {success, adminName, message}
 */
function adminLogin(username, password) {
  try {
    // 1. Login ผ่าน gas-lib
    const loginResult = dtpnstlib.Auth.login({
      username: username,
      password: password
    }, 'admin');
    
    if (!loginResult.success) {
      return { success: false, message: loginResult.message };
    }
    
    // 2. สร้าง token
    const admin = loginResult.data;
    const tokenResult = dtpnstlib.Auth.createToken(admin, 'admin');
    
    // 3. เก็บ token ใน User Properties
    PropertiesService.getUserProperties()
      .setProperty('ADMIN_TOKEN', tokenResult.token)
      .setProperty('ADMIN_ID', admin.uuid)
      .setProperty('ADMIN_NAME', username);
    
    // 4. บันทึก log การ login
    logAdminAction('admin_login', 'Admin logged in: ' + username);
    
    return {
      success: true,
      adminName: username,
      message: 'Login successful'
    };
    
  } catch (error) {
    Logger.log('adminLogin error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดูคำขอที่รออนุมัติ
 * @returns {Array} รายการคำขอที่ status=pending
 */
function getPendingRequests() {
  try {
    if (!validateAdminToken()) {
      throw new Error('Unauthorized');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('document_requests');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const pending = rows.filter(function(row) {
      return row[headers.indexOf('status')] === 'pending';
    }).map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    });
    
    logAdminAction('view_pending_requests', 'Viewed ' + pending.length + ' pending requests');
    
    return pending;
    
  } catch (error) {
    Logger.log('getPendingRequests error: ' + error.toString());
    return [];
  }
}

/**
 * อนุมัติคำขอ
 * @param {string} requestId - UUID ของคำขอ
 * @returns {Object} {success, message}
 */
function approveRequest(requestId) {
  try {
    if (!validateAdminToken()) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const adminId = PropertiesService.getUserProperties().getProperty('ADMIN_ID');
    const adminName = PropertiesService.getUserProperties().getProperty('ADMIN_NAME');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('document_requests');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('uuid')] === requestId) {
        // อัปเดตสถานะ
        sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue('approved');
        sheet.getRange(i + 1, headers.indexOf('approved_by') + 1).setValue(adminId);
        sheet.getRange(i + 1, headers.indexOf('approved_date') + 1).setValue(new Date().toISOString());
        sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date().toISOString());
        
        const userName = data[i][headers.indexOf('user_name')];
        const documentType = data[i][headers.indexOf('document_type')];
        
        logAdminAction('approve_request', 
          'Approved ' + documentType + ' for ' + userName + ' (Request ID: ' + requestId + ')');
        
        // บันทึก log ใน gas-lib
        dtpnstlib.Sheet.log({
          action: 'document_request_approved',
          user_type: 'admin',
          user_id: adminId,
          record_id: requestId,
          details: 'Admin ' + adminName + ' approved request for ' + userName
        });
        
        return { success: true, message: 'อนุมัติคำขอเรียบร้อย' };
      }
    }
    
    return { success: false, message: 'Request not found' };
    
  } catch (error) {
    Logger.log('approveRequest error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ปฏิเสธคำขอ
 * @param {string} requestId - UUID ของคำขอ
 * @param {string} reason - เหตุผลที่ปฏิเสธ
 * @returns {Object} {success, message}
 */
function rejectRequest(requestId, reason) {
  try {
    if (!validateAdminToken()) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const adminId = PropertiesService.getUserProperties().getProperty('ADMIN_ID');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('document_requests');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('uuid')] === requestId) {
        sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue('rejected');
        sheet.getRange(i + 1, headers.indexOf('rejected_by') + 1).setValue(adminId);
        sheet.getRange(i + 1, headers.indexOf('rejection_reason') + 1).setValue(reason);
        sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date().toISOString());
        
        const userName = data[i][headers.indexOf('user_name')];
        const documentType = data[i][headers.indexOf('document_type')];
        
        logAdminAction('reject_request',
          'Rejected ' + documentType + ' for ' + userName + ', Reason: ' + reason);
        
        return { success: true, message: 'ปฏิเสธคำขอเรียบร้อย' };
      }
    }
    
    return { success: false, message: 'Request not found' };
    
  } catch (error) {
    Logger.log('rejectRequest error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * ดูสถิติการขอเอกสาร
 * @returns {Object} สถิติ
 */
function getStatistics() {
  try {
    if (!validateAdminToken()) {
      throw new Error('Unauthorized');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('document_requests');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const stats = {
      total: rows.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      downloaded: 0,
      byType: {}
    };
    
    rows.forEach(function(row) {
      const status = row[headers.indexOf('status')];
      const documentType = row[headers.indexOf('document_type')];
      const downloaded = row[headers.indexOf('downloaded')];
      
      if (status === 'pending') stats.pending++;
      if (status === 'approved') stats.approved++;
      if (status === 'rejected') stats.rejected++;
      if (downloaded) stats.downloaded++;
      
      if (!stats.byType[documentType]) {
        stats.byType[documentType] = 0;
      }
      stats.byType[documentType]++;
    });
    
    logAdminAction('view_statistics', 'Viewed statistics dashboard');
    
    return stats;
    
  } catch (error) {
    Logger.log('getStatistics error: ' + error.toString());
    return null;
  }
}

/**
 * ดู Admin Logs
 * @returns {Array} รายการ log (100 รายการล่าสุด)
 */
function getAdminLogs() {
  try {
    if (!validateAdminToken()) {
      throw new Error('Unauthorized');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('admin_logs');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const logs = rows.map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    }).reverse(); // ล่าสุดก่อน
    
    return logs.slice(0, 100); // เอา 100 รายการล่าสุด
    
  } catch (error) {
    Logger.log('getAdminLogs error: ' + error.toString());
    return [];
  }
}

/**
 * Helper: Validate Admin Token
 * @returns {boolean}
 */
function validateAdminToken() {
  const token = PropertiesService.getUserProperties().getProperty('ADMIN_TOKEN');
  if (!token) return false;
  
  const validateResult = dtpnstlib.Auth.validateToken(token);
  return validateResult.success && validateResult.data.user_type === 'admin';
}

/**
 * Helper: Log Admin Actions
 * @param {string} action
 * @param {string} details
 */
function logAdminAction(action, details) {
  try {
    const adminId = PropertiesService.getUserProperties().getProperty('ADMIN_ID');
    const adminName = PropertiesService.getUserProperties().getProperty('ADMIN_NAME');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('admin_logs');
    
    const logEntry = {
      uuid: Utilities.getUuid(),
      admin_id: adminId,
      admin_name: adminName,
      action: action,
      details: details,
      timestamp: new Date().toISOString()
    };
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(function(header) {
      return logEntry[header] || '';
    });
    
    sheet.appendRow(row);
    
  } catch (error) {
    Logger.log('logAdminAction error: ' + error.toString());
  }
}
