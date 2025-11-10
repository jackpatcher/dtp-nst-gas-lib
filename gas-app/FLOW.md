# 🔄 Flow การทำงานระบบขอเอกสารประวัติข้าราชการ

> Google Apps Script Application with gas-lib Integration

## 🏗️ สถาปัตยกรรม

```
┌─────────────────────────────────────────────────┐
│   Client (Browser)                              │
│   - index.html (User)                           │
│   - admin.html (Admin)                          │
└───────────────────┬─────────────────────────────┘
                    │
                    │ google.script.run
                    │
┌───────────────────▼─────────────────────────────┐
│   Apps Script Server (.gs files)                │
│   - Code.gs (Entry Point)                       │
│   - UserController.gs                           │
│   - AdminController.gs                          │
│   - FileManager.gs                              │
└───────────────────┬─────────────────────────────┘
                    │
                    │ Library Functions
                    │ (ไม่ใช้ HTTP)
                    │
┌───────────────────▼─────────────────────────────┐
│   dtp-nst-gas-lib (Library)                     │
│   Identifier: dtpnstlib                         │
│   - Auth.login()                                │
│   - Auth.validateToken()                        │
│   - Sheet.read()                                │
│   - Sheet.append()                              │
└───────────────────┬─────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────┐
│   Google Sheets (Database)                      │
│   - users (จาก gas-lib)                         │
│   - admins (จาก gas-lib)                        │
│   - tokens (จาก gas-lib)                        │
│   - logs (จาก gas-lib)                          │
│   - applications (app key ของ app นี้)          │
│   - document_requests (คำขอเอกสาร)              │
│   - admin_logs (log การทำงานของเจ้าหน้าที่)     │
└─────────────────────────────────────────────────┘
                    +
┌─────────────────────────────────────────────────┐
│   Google Drive (File Storage)                   │
│   - /ประวัติข้าราชการ/                          │
│     - 1234567890123_นายทดสอบ_ระบบ.pdf          │
│     - 9876543210987_นางสาวตัวอย่าง_ทดสอบ.pdf   │
└─────────────────────────────────────────────────┘
```

## 🔑 App Key Registration

### ขั้นตอนที่ 1: ลงทะเบียน App

```javascript
// Setup.gs
function registerApp() {
  const APP_KEY = 'gas-app-document-system-2025';
  const APP_NAME = 'ระบบขอเอกสารประวัติข้าราชการ';
  
  // บันทึกลง applications table ใน gas-lib
  const appData = {
    uuid: Utilities.getUuid(),
    app_key: APP_KEY,
    app_name: APP_NAME,
    description: 'ระบบขอเอกสาร กพ.7 และ กคศ.16',
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  // ใช้ lib เพื่อบันทึก
  dtpnstlib.Sheet.append('applications', appData);
  
  // เก็บ APP_KEY ใน Script Properties
  PropertiesService.getScriptProperties()
    .setProperty('APP_KEY', APP_KEY);
}
```

## 👤 User Flow (ข้าราชการ)

### 1. หน้า Login (index.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>ระบบขอเอกสารประวัติข้าราชการ</title>
  <base target="_top">
</head>
<body>
  <h1>เข้าสู่ระบบ</h1>
  <div id="login-form">
    <input type="text" id="id13" placeholder="เลขประจำตัว 13 หลัก">
    <input type="password" id="password" placeholder="รหัสผ่าน">
    <button onclick="login()">เข้าสู่ระบบ</button>
  </div>
  
  <div id="main-page" style="display:none;">
    <h2>ยินดีต้อนรับ <span id="user-name"></span></h2>
    <button onclick="showRequestForm()">ขอเอกสาร</button>
    <button onclick="showMyRequests()">คำขอของฉัน</button>
  </div>
  
  <script>
    function login() {
      const id13 = document.getElementById('id13').value;
      const password = document.getElementById('password').value;
      
      // เรียก server-side function ผ่าน google.script.run
      google.script.run
        .withSuccessHandler(onLoginSuccess)
        .withFailureHandler(onLoginFailure)
        .userLogin(id13, password);
    }
    
    function onLoginSuccess(result) {
      if (result.success) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('main-page').style.display = 'block';
        document.getElementById('user-name').textContent = result.userName;
      } else {
        alert('Login failed: ' + result.message);
      }
    }
    
    function onLoginFailure(error) {
      alert('Error: ' + error.message);
    }
    
    function showRequestForm() {
      google.script.run
        .withSuccessHandler(function(html) {
          document.getElementById('main-page').innerHTML += html;
        })
        .getRequestForm();
    }
    
    function submitRequest(documentType) {
      google.script.run
        .withSuccessHandler(function(result) {
          alert(result.message);
          showMyRequests();
        })
        .createDocumentRequest(documentType);
    }
    
    function showMyRequests() {
      google.script.run
        .withSuccessHandler(function(requests) {
          displayRequests(requests);
        })
        .getUserRequests();
    }
    
    function displayRequests(requests) {
      // แสดงรายการคำขอ
      let html = '<h3>คำขอของฉัน</h3><table>';
      requests.forEach(function(req) {
        html += '<tr>';
        html += '<td>' + req.document_type + '</td>';
        html += '<td>' + req.status + '</td>';
        html += '<td>' + req.request_date + '</td>';
        if (req.status === 'approved' && req.file_url) {
          html += '<td><button onclick="downloadFile(\'' + req.file_url + '\')">ดาวน์โหลด</button></td>';
        }
        html += '</tr>';
      });
      html += '</table>';
      
      document.getElementById('main-page').innerHTML = html;
    }
    
    function downloadFile(fileUrl) {
      window.open(fileUrl, '_blank');
    }
  </script>
</body>
</html>
```

### 2. Server-Side: UserController.gs

```javascript
// UserController.gs

/**
 * User Login
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
      document_type: documentType, // "กพ7" หรือ "กคศ16"
      request_date: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
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
    
    // 4. บันทึกลง local sheet (ในแอพนี้)
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
```

## 👨‍💼 Admin Flow (เจ้าหน้าที่)

### 1. หน้า Admin (admin.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>ระบบจัดการเอกสารประวัติข้าราชการ - Admin</title>
  <base target="_top">
</head>
<body>
  <h1>ระบบจัดการเอกสาร - เจ้าหน้าที่</h1>
  
  <div id="admin-login">
    <h2>เข้าสู่ระบบเจ้าหน้าที่</h2>
    <input type="text" id="username" placeholder="Username">
    <input type="password" id="password" placeholder="Password">
    <button onclick="adminLogin()">เข้าสู่ระบบ</button>
  </div>
  
  <div id="admin-dashboard" style="display:none;">
    <h2>ยินดีต้อนรับ Admin: <span id="admin-name"></span></h2>
    
    <nav>
      <button onclick="showPendingRequests()">คำขอรออนุมัติ</button>
      <button onclick="showAllRequests()">คำขอทั้งหมด</button>
      <button onclick="showUploadFiles()">อัพโหลดไฟล์</button>
      <button onclick="showStatistics()">สถิติ</button>
      <button onclick="showAdminLogs()">Log การทำงาน</button>
    </nav>
    
    <div id="content"></div>
  </div>
  
  <script>
    function adminLogin() {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      google.script.run
        .withSuccessHandler(onAdminLoginSuccess)
        .withFailureHandler(onAdminLoginFailure)
        .adminLogin(username, password);
    }
    
    function onAdminLoginSuccess(result) {
      if (result.success) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        document.getElementById('admin-name').textContent = result.adminName;
        showPendingRequests();
      } else {
        alert('Login failed: ' + result.message);
      }
    }
    
    function showPendingRequests() {
      google.script.run
        .withSuccessHandler(displayRequests)
        .getPendingRequests();
    }
    
    function displayRequests(requests) {
      let html = '<h3>คำขอรออนุมัติ (' + requests.length + ' รายการ)</h3>';
      html += '<table border="1" style="width:100%">';
      html += '<tr>';
      html += '<th>เลขประจำตัว</th>';
      html += '<th>ชื่อ-สกุล</th>';
      html += '<th>ประเภทเอกสาร</th>';
      html += '<th>วันที่ขอ</th>';
      html += '<th>ไฟล์</th>';
      html += '<th>การจัดการ</th>';
      html += '</tr>';
      
      requests.forEach(function(req) {
        html += '<tr>';
        html += '<td>' + req.user_id13 + '</td>';
        html += '<td>' + req.user_name + '</td>';
        html += '<td>' + req.document_type + '</td>';
        html += '<td>' + new Date(req.request_date).toLocaleString('th-TH') + '</td>';
        html += '<td>' + (req.file_url ? '✅ มีไฟล์' : '❌ ยังไม่มีไฟล์') + '</td>';
        html += '<td>';
        if (req.file_url) {
          html += '<button onclick="approveRequest(\'' + req.uuid + '\')">อนุมัติ</button> ';
        } else {
          html += '<button disabled>รอไฟล์</button> ';
        }
        html += '<button onclick="rejectRequest(\'' + req.uuid + '\')">ปฏิเสธ</button>';
        html += '</td>';
        html += '</tr>';
      });
      
      html += '</table>';
      document.getElementById('content').innerHTML = html;
    }
    
    function approveRequest(requestId) {
      if (confirm('ยืนยันการอนุมัติคำขอนี้?')) {
        google.script.run
          .withSuccessHandler(function(result) {
            alert(result.message);
            showPendingRequests();
          })
          .approveRequest(requestId);
      }
    }
    
    function rejectRequest(requestId) {
      const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
      if (reason) {
        google.script.run
          .withSuccessHandler(function(result) {
            alert(result.message);
            showPendingRequests();
          })
          .rejectRequest(requestId, reason);
      }
    }
    
    function showUploadFiles() {
      const html = `
        <h3>อัพโหลดไฟล์ประวัติข้าราชการ</h3>
        <p>อัพโหลดไฟล์หลายรายการพร้อมกัน</p>
        <input type="file" id="fileInput" multiple accept=".pdf">
        <button onclick="uploadFiles()">อัพโหลด</button>
        <div id="uploadStatus"></div>
      `;
      document.getElementById('content').innerHTML = html;
    }
    
    function uploadFiles() {
      const fileInput = document.getElementById('fileInput');
      const files = fileInput.files;
      
      if (files.length === 0) {
        alert('กรุณาเลือกไฟล์');
        return;
      }
      
      document.getElementById('uploadStatus').innerHTML = 'กำลังอัพโหลด...';
      
      // อัพโหลดทีละไฟล์
      uploadFile(files, 0);
    }
    
    function uploadFile(files, index) {
      if (index >= files.length) {
        document.getElementById('uploadStatus').innerHTML = 
          '<p style="color:green">อัพโหลดเสร็จสิ้น ' + files.length + ' ไฟล์</p>';
        return;
      }
      
      const file = files[index];
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const fileData = {
          name: file.name,
          mimeType: file.type,
          content: e.target.result.split(',')[1] // Base64
        };
        
        google.script.run
          .withSuccessHandler(function(result) {
            document.getElementById('uploadStatus').innerHTML = 
              'อัพโหลดแล้ว ' + (index + 1) + '/' + files.length;
            uploadFile(files, index + 1);
          })
          .uploadDocumentFile(fileData);
      };
      
      reader.readAsDataURL(file);
    }
    
    function showStatistics() {
      google.script.run
        .withSuccessHandler(displayStatistics)
        .getStatistics();
    }
    
    function displayStatistics(stats) {
      let html = '<h3>สถิติการขอเอกสาร</h3>';
      html += '<table border="1">';
      html += '<tr><td>คำขอทั้งหมด</td><td>' + stats.total + '</td></tr>';
      html += '<tr><td>รออนุมัติ</td><td>' + stats.pending + '</td></tr>';
      html += '<tr><td>อนุมัติแล้ว</td><td>' + stats.approved + '</td></tr>';
      html += '<tr><td>ปฏิเสธ</td><td>' + stats.rejected + '</td></tr>';
      html += '<tr><td>ดาวน์โหลดแล้ว</td><td>' + stats.downloaded + '</td></tr>';
      html += '</table>';
      
      html += '<h4>จำนวนคำขอแต่ละประเภท</h4>';
      html += '<table border="1">';
      for (const type in stats.byType) {
        html += '<tr><td>' + type + '</td><td>' + stats.byType[type] + '</td></tr>';
      }
      html += '</table>';
      
      document.getElementById('content').innerHTML = html;
    }
    
    function showAdminLogs() {
      google.script.run
        .withSuccessHandler(displayAdminLogs)
        .getAdminLogs();
    }
    
    function displayAdminLogs(logs) {
      let html = '<h3>Log การทำงานของเจ้าหน้าที่</h3>';
      html += '<table border="1" style="width:100%">';
      html += '<tr><th>เวลา</th><th>Admin</th><th>การกระทำ</th><th>รายละเอียด</th></tr>';
      
      logs.forEach(function(log) {
        html += '<tr>';
        html += '<td>' + new Date(log.timestamp).toLocaleString('th-TH') + '</td>';
        html += '<td>' + log.admin_name + '</td>';
        html += '<td>' + log.action + '</td>';
        html += '<td>' + log.details + '</td>';
        html += '</tr>';
      });
      
      html += '</table>';
      document.getElementById('content').innerHTML = html;
    }
  </script>
</body>
</html>
```

### 2. Server-Side: AdminController.gs

```javascript
// AdminController.gs

/**
 * Admin Login (ใช้ตาราง admins จาก gas-lib)
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
    
    // 3. เก็บ token ใน Script Properties
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
 */
function getPendingRequests() {
  try {
    // ตรวจสอบ admin token
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
    
    // บันทึก log
    logAdminAction('view_pending_requests', 'Viewed ' + pending.length + ' pending requests');
    
    return pending;
    
  } catch (error) {
    Logger.log('getPendingRequests error: ' + error.toString());
    return [];
  }
}

/**
 * อนุมัติคำขอ
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
    
    // หา row ที่ต้องการ
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf('uuid')] === requestId) {
        // อัปเดตสถานะ
        sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue('approved');
        sheet.getRange(i + 1, headers.indexOf('approved_by') + 1).setValue(adminId);
        sheet.getRange(i + 1, headers.indexOf('approved_date') + 1).setValue(new Date().toISOString());
        sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date().toISOString());
        
        // ดึงข้อมูล user
        const userName = data[i][headers.indexOf('user_name')];
        const documentType = data[i][headers.indexOf('document_type')];
        
        // บันทึก log
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
 */
function rejectRequest(requestId, reason) {
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
 * สถิติ
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
 * Helper: Validate Admin Token
 */
function validateAdminToken() {
  const token = PropertiesService.getUserProperties().getProperty('ADMIN_TOKEN');
  if (!token) return false;
  
  const validateResult = dtpnstlib.Auth.validateToken(token);
  return validateResult.success && validateResult.data.user_type === 'admin';
}

/**
 * Helper: Log Admin Actions
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

/**
 * ดู Admin Logs
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
```

### 3. File Management: FileManager.gs

```javascript
// FileManager.gs

/**
 * อัพโหลดไฟล์เอกสาร
 * รูปแบบชื่อไฟล์: {id13}_{ชื่อ-สกุล}.pdf
 */
function uploadDocumentFile(fileData) {
  try {
    if (!validateAdminToken()) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // สร้าง/หา folder
    const folder = getOrCreateFolder('ประวัติข้าราชการ');
    
    // ดึง ID13 และชื่อจากชื่อไฟล์
    // Format: 1234567890123_นายทดสอบ_ระบบ.pdf
    const fileName = fileData.name;
    const match = fileName.match(/^(\d{13})_(.+)\.pdf$/);
    
    if (!match) {
      return { 
        success: false, 
        message: 'รูปแบบชื่อไฟล์ไม่ถูกต้อง ต้องเป็น: ID13_ชื่อ-สกุล.pdf' 
      };
    }
    
    const id13 = match[1];
    const name = match[2];
    
    // Decode Base64 และสร้างไฟล์
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.content),
      fileData.mimeType,
      fileName
    );
    
    // Check if file exists
    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      // ลบไฟล์เก่า
      existingFiles.next().setTrashed(true);
    }
    
    // Upload file
    const file = folder.createFile(blob);
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    
    // อัปเดต document_requests ที่มี user_id13 ตรงกัน
    updateRequestsWithFile(id13, fileUrl, fileId);
    
    // บันทึก log
    logAdminAction('upload_file', 
      'Uploaded file: ' + fileName + ' (File ID: ' + fileId + ')');
    
    return {
      success: true,
      fileName: fileName,
      fileUrl: fileUrl,
      fileId: fileId,
      message: 'อัพโหลดไฟล์เรียบร้อย'
    };
    
  } catch (error) {
    Logger.log('uploadDocumentFile error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * อัปเดตคำขอด้วย file URL
 */
function updateRequestsWithFile(id13, fileUrl, fileId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('document_requests');
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const rowId13 = data[i][headers.indexOf('user_id13')];
    const status = data[i][headers.indexOf('status')];
    
    // อัปเดตเฉพาะที่ยังเป็น pending
    if (rowId13 === id13 && status === 'pending') {
      sheet.getRange(i + 1, headers.indexOf('file_url') + 1).setValue(fileUrl);
      sheet.getRange(i + 1, headers.indexOf('file_id') + 1).setValue(fileId);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date().toISOString());
    }
  }
}

/**
 * Get or Create Folder
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * อัพโหลดหลายไฟล์พร้อมกัน (สำหรับทั้งโรงเรียน)
 */
function uploadMultipleFiles(filesData) {
  try {
    if (!validateAdminToken()) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const results = [];
    
    filesData.forEach(function(fileData) {
      const result = uploadDocumentFile(fileData);
      results.push(result);
    });
    
    const successCount = results.filter(function(r) { return r.success; }).length;
    
    logAdminAction('upload_multiple_files',
      'Uploaded ' + successCount + '/' + filesData.length + ' files');
    
    return {
      success: true,
      results: results,
      message: 'อัพโหลดเรียบร้อย ' + successCount + '/' + filesData.length + ' ไฟล์'
    };
    
  } catch (error) {
    Logger.log('uploadMultipleFiles error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}
```

## 📁 โครงสร้าง Sheets

### ใน gas-lib Spreadsheet:
1. **users** - ข้อมูลข้าราชการ
2. **admins** - ข้อมูลเจ้าหน้าที่
3. **tokens** - Token authentication
4. **logs** - Log ทั่วไป
5. **applications** - App keys ของแอพต่างๆ

### ใน App Spreadsheet:
1. **document_requests** - คำขอเอกสาร
   ```
   uuid | user_id | user_id13 | user_name | document_type | request_date | 
   status | approved_by | approved_date | rejected_by | rejection_reason | 
   file_url | file_id | downloaded | download_date | created_at | updated_at
   ```

2. **admin_logs** - Log การทำงานของเจ้าหน้าที่
   ```
   uuid | admin_id | admin_name | action | details | timestamp
   ```

## 🔄 สรุป Flow

### User Flow:
1. Login ผ่าน `google.script.run.userLogin()` → เรียก `dtpnstlib.Auth.login()`
2. ขอเอกสาร → บันทึกใน local sheet `document_requests`
3. เช็คสถานะ → อ่านจาก local sheet
4. ดาวน์โหลด (ถ้าอนุมัติแล้ว) → เปิด file_url

### Admin Flow:
1. Login ผ่าน `google.script.run.adminLogin()` → เรียก `dtpnstlib.Auth.login()` (ใช้ตาราง admins จาก gas-lib)
2. ดูคำขอ → อ่านจาก local sheet + log ใน `admin_logs`
3. อัพโหลดไฟล์ → Drive API → อัปเดต `file_url` ใน requests
4. อนุมัติ/ปฏิเสธ → อัปเดต status + log ทั้ง `admin_logs` และ gas-lib logs
5. ดูสถิติ → วิเคราะห์จาก local sheet + log

### ไม่มี HTTP Request:
- ใช้ `google.script.run` เรียก function โดยตรง
- ใช้ `dtpnstlib.Function()` เรียก library functions
- ทุกอย่างทำงานใน Google Apps Script environment

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0
