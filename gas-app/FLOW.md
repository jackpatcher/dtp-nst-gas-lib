# 🔄 Flow การทำงานระบบขอเอกสารประวัติข้าราชการ

> Data Flow & Schema Documentation

## 🏗️ สถาปัตยกรรมระบบ

```
┌──────────────────────────────────────────────────────────┐
│                  Client (Browser)                         │
│  - เข้าผ่าน Web App URL                                  │
│  - รับ index.html หรือ admin.html                        │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ google.script.run (ไม่ใช้ HTTP)
                         │
┌────────────────────────▼─────────────────────────────────┐
│           Apps Script Server (.gs files)                  │
│  - Code.gs: doGet(), routing                             │
│  - UserController.gs: User functions                     │
│  - AdminController.gs: Admin functions                   │
│  - FileManager.gs: File upload/management                │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ dtpnstlib.Function()
                         │
┌────────────────────────▼─────────────────────────────────┐
│              dtp-nst-gas-lib (Library)                    │
│  - Auth.login(credentials, userType)                     │
│  - Auth.createToken(user, userType)                      │
│  - Auth.validateToken(token)                             │
│  - Sheet.read(tableName, filters)                        │
│  - Sheet.append(tableName, data)                         │
│  - Sheet.update(tableName, uuid, data)                   │
│  - Sheet.log(logData)                                    │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ↓
┌──────────────────────────────────────────────────────────┐
│              Google Sheets (Database)                     │
│                                                           │
│  gas-lib Spreadsheet:                                    │
│  ├─ users (ข้อมูลข้าราชการ)                             │
│  ├─ admins (เจ้าหน้าที่)                                 │
│  ├─ tokens (authentication tokens)                       │
│  ├─ logs (system logs)                                   │
│  └─ applications (app keys)                              │
│                                                           │
│  App Spreadsheet:                                        │
│  ├─ document_requests (คำขอเอกสาร)                      │
│  └─ admin_logs (log เจ้าหน้าที่)                         │
└──────────────────────────────────────────────────────────┘
                         +
┌──────────────────────────────────────────────────────────┐
│              Google Drive (File Storage)                  │
│  Folder: "ประวัติข้าราชการ"                             │
│  ├─ 1234567890123_นายทดสอบ_ระบบ.pdf                     │
│  ├─ 9876543210987_นางสาวตัวอย่าง_ทดสอบ.pdf              │
│  └─ ...                                                   │
└──────────────────────────────────────────────────────────┘
```

## 🔑 App Key Registration

ก่อนใช้งานต้องลงทะเบียน App Key ใน gas-lib:

```javascript
// ใน Setup.gs
function registerApp() {
  const appData = {
    uuid: Utilities.getUuid(),
    app_key: 'gas-app-document-system-2025',
    app_name: 'ระบบขอเอกสารประวัติข้าราชการ',
    description: 'ระบบขอเอกสาร กพ.7 และ กคศ.16',
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  dtpnstlib.Sheet.append('applications', appData);
}
```

## 📊 Database Schema

### 1. gas-lib Spreadsheet (จัดการโดย library)

#### Table: users
```
uuid          | id13          | first_name | last_name | email         | password (hashed) | 
organization  | position      | rank       | hrms_id   | active        | created_at        | 
updated_at
```

#### Table: admins
```
uuid       | username | email       | password (hashed) | first_name | last_name | 
status     | created_at | updated_at
```

#### Table: tokens
```
uuid       | token        | user_type | user_id  | user_identifier | app_key        |
hrms_id    | expires_at   | revoked   | revoked_at | last_used     | created_at
```

#### Table: logs
```
uuid       | action          | table_name | record_id | user_id    | user_type |
timestamp  | details
```

#### Table: applications
```
uuid       | app_key                           | app_name                     | description |
status     | created_at
```

### 2. App Spreadsheet (จัดการโดย app นี้)

#### Table: document_requests
```
uuid              | user_id   | user_id13     | user_name        | document_type |
request_date      | status    | approved_by   | approved_date    | rejected_by   |
rejection_reason  | file_url  | file_id       | downloaded       | download_date |
created_at        | updated_at
```

**Status Values:**
- `pending` - รออนุมัติ
- `approved` - อนุมัติแล้ว
- `rejected` - ปฏิเสธ

**Document Types:**
- `กพ7` - ประวัติการรับราชการ
- `กคศ16` - ใบสำคัญการศึกษา

#### Table: admin_logs
```
uuid       | admin_id    | admin_name  | action               | details            |
timestamp
```

**Admin Actions:**
- `admin_login` - เข้าสู่ระบบ
- `view_pending_requests` - ดูคำขอรออนุมัติ
- `approve_request` - อนุมัติคำขอ
- `reject_request` - ปฏิเสธคำขอ
- `upload_file` - อัพโหลดไฟล์
- `upload_multiple_files` - อัพโหลดหลายไฟล์
- `view_statistics` - ดูสถิติ

## 🔄 Data Flow

### Flow 1: User Login & Request Document

```
1. User เข้า Web App
   ↓
2. doGet() → return index.html
   ↓
3. User กรอก ID13 + Password
   ↓
4. google.script.run.userLogin(id13, password)
   ↓
5. UserController.userLogin()
   ├─ dtpnstlib.Auth.login({id13, password}, 'user')
   │  └─ ตรวจสอบใน users table
   ├─ dtpnstlib.Auth.createToken(user, 'user')
   │  └─ บันทึกใน tokens table
   └─ เก็บ token ใน UserProperties
   ↓
6. User เลือก "ขอเอกสาร"
   ↓
7. google.script.run.createDocumentRequest('กพ7')
   ↓
8. UserController.createDocumentRequest()
   ├─ dtpnstlib.Auth.validateToken(token)
   ├─ บันทึกใน document_requests (status: pending)
   └─ dtpnstlib.Sheet.log() → บันทึกใน logs table
   ↓
9. รอ Admin อนุมัติ
```

### Flow 2: Admin Approve & Upload File

```
1. Admin เข้า Web App + เพิ่ม ?page=admin
   ↓
2. doGet(e) → return admin.html
   ↓
3. Admin กรอก username + password
   ↓
4. google.script.run.adminLogin(username, password)
   ↓
5. AdminController.adminLogin()
   ├─ dtpnstlib.Auth.login({username, password}, 'admin')
   │  └─ ตรวจสอบใน admins table (จาก gas-lib)
   ├─ dtpnstlib.Auth.createToken(admin, 'admin')
   └─ logAdminAction('admin_login') → บันทึกใน admin_logs
   ↓
6. Admin ดูคำขอรออนุมัติ
   ↓
7. google.script.run.getPendingRequests()
   ↓
8. AdminController.getPendingRequests()
   ├─ อ่านจาก document_requests (status: pending)
   └─ logAdminAction('view_pending_requests')
   ↓
9. Admin อัพโหลดไฟล์
   ↓
10. google.script.run.uploadDocumentFile(fileData)
    ↓
11. FileManager.uploadDocumentFile()
    ├─ สร้าง/หา folder "ประวัติข้าราชการ" ใน Drive
    ├─ ตรวจสอบรูปแบบชื่อ: ID13_ชื่อ-สกุล.pdf
    ├─ Upload ไฟล์ → ได้ fileUrl, fileId
    ├─ อัปเดต document_requests (file_url, file_id)
    └─ logAdminAction('upload_file')
    ↓
12. Admin อนุมัติคำขอ
    ↓
13. google.script.run.approveRequest(requestId)
    ↓
14. AdminController.approveRequest()
    ├─ อัปเดต document_requests (status: approved)
    ├─ logAdminAction('approve_request') → admin_logs
    └─ dtpnstlib.Sheet.log() → logs table
```

### Flow 3: User Download Document

```
1. User เข้าระบบและดู "คำขอของฉัน"
   ↓
2. google.script.run.getUserRequests()
   ↓
3. UserController.getUserRequests()
   └─ อ่านจาก document_requests (ของ user นี้)
   ↓
4. แสดงรายการคำขอ
   ├─ status: pending → "รออนุมัติ"
   ├─ status: approved + file_url → แสดงปุ่ม "ดาวน์โหลด"
   └─ status: rejected → แสดงเหตุผล
   ↓
5. User คลิก "ดาวน์โหลด"
   ↓
6. เปิด file_url ใน tab ใหม่
   ↓
7. (Optional) บันทึก download_date, downloaded: true
```

## 📁 File Structure

```
gas-app/
├── Code.gs                    # Entry point, doGet(), routing
├── UserController.gs          # User functions
├── AdminController.gs         # Admin functions
├── FileManager.gs             # File upload/management
├── Setup.gs                   # App initialization, registerApp()
├── index.html                 # User interface
├── admin.html                 # Admin dashboard
├── FLOW.md                    # This file
└── readme.md                  # Project overview
```

## 🔐 Authentication Flow

### User Authentication
```
1. User input: id13, password
2. dtpnstlib.Auth.login({id13, password}, 'user')
3. Library ตรวจสอบใน users table
4. ถ้าถูกต้อง → สร้าง token
5. เก็บ token ใน UserProperties
6. ใช้ token ในการเรียก API ครั้งต่อไป
```

### Admin Authentication
```
1. Admin input: username, password
2. dtpnstlib.Auth.login({username, password}, 'admin')
3. Library ตรวจสอบใน admins table (จาก gas-lib)
4. ถ้าถูกต้อง → สร้าง token
5. เก็บ token ใน UserProperties
6. บันทึก log ใน admin_logs (ของ app)
7. ใช้ token ในการเรียก API ครั้งต่อไป
```

## 🔒 Security & Authorization

### Token Validation
```javascript
// ทุก function ที่ต้องการ authentication
const token = PropertiesService.getUserProperties().getProperty('USER_TOKEN');
const validateResult = dtpnstlib.Auth.validateToken(token);

if (!validateResult.success) {
  return { success: false, message: 'Token expired' };
}
```

### Admin Authorization
```javascript
function validateAdminToken() {
  const token = PropertiesService.getUserProperties().getProperty('ADMIN_TOKEN');
  const validateResult = dtpnstlib.Auth.validateToken(token);
  return validateResult.success && validateResult.data.user_type === 'admin';
}
```

## � Logging Strategy

### 1. System Logs (gas-lib logs table)
บันทึกเหตุการณ์สำคัญที่เกี่ยวข้องกับระบบ:
- User login
- Token creation
- Document request created
- Request approved/rejected

### 2. Admin Logs (app admin_logs table)
บันทึกการกระทำของเจ้าหน้าที่:
- Admin login
- View requests
- Approve/reject
- Upload files
- View statistics

## 🚀 Deployment

### 1. Setup Library
```
1. เปิด gas-lib project
2. Deploy → New deployment → Library
3. คัดลอก Script ID
```

### 2. Setup App
```
1. สร้าง Apps Script project ใหม่
2. เพิ่ม Library (Script ID, Identifier: dtpnstlib)
3. สร้าง Spreadsheet สำหรับ app
4. รัน Setup.registerApp()
5. Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
6. คัดลอก Web App URL
```

### 3. Web App URL Format
```
User:  https://script.google.com/macros/s/xxx/exec
Admin: https://script.google.com/macros/s/xxx/exec?page=admin
```

---

**Last Updated**: November 10, 2025  
**Version**: 2.0.0 - Data Flow & Schema Focus

---
