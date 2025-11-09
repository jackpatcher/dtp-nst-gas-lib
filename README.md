# 📚 DTP NST Library v2.0

> Google Apps Script Library สำหรับจัดการข้อมูล Account ด้วย CRUD + Authentication & Authorization

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/jackpatcher/dtp-nst-gas-lib)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-V8-green.svg)](https://developers.google.com/apps-script)

---

## ✨ จุดเด่น

- ✅ **เข้าใจง่าย** - ไม่ใช้ IIFE Pattern ซับซ้อน, อ่านโค้ดได้จากบนลงล่าง
- ✅ **แยกหน้าที่ชัดเจน** - แต่ละไฟล์ทำงานเฉพาะเรื่อง
- ✅ **ปลอดภัย** - SHA-256 password hashing, Token-based auth (24hr)
- ✅ **จัดการสิทธิ์** - Admin เต็มสิทธิ์, User อ่านเฉพาะองค์กรตัวเอง
- ✅ **ติดตั้งง่าย** - 3 คำสั่งเสร็จ
- ✅ **Audit Log** - บันทึกการกระทำทั้งหมด

---

## 🗂️ โครงสร้างไฟล์

```
📁 dtp-nst-gas-lib/
├── 📄 Helpers.gs          ← ฟังก์ชันช่วยเหลือ (UUID, Hash, Validation)
├── 📄 Sheet.gs             ← จัดการ Google Sheets (Database Layer)
├── 📄 Access.gs            ← ระบบสิทธิ์ (Authorization)
├── 📄 Auth.gs              ← ระบบ Login + Token Management
├── 📄 Database.gs          ← CRUD Operations
├── 📄 Library.gs           ← Public API (request_token, connect)
├── 📄 Setup.gs             ← ฟังก์ชันติดตั้งและบำรุงรักษา
└── 📄 appsscript.json      ← Config
```

**ไฟล์ทั้งหมด: 8 ไฟล์** (ลดจาก 15+ ไฟล์)

---

## 🚀 Quick Start (3 ขั้นตอน)

### ขั้นที่ 1: สร้าง Spreadsheet และ Script

```
1. สร้าง Google Spreadsheet ใหม่
2. เมนู: Extensions > Apps Script
3. คัดลอกไฟล์ทั้งหมด (.gs) จาก repo นี้ไปวางใน Apps Script Editor
```

### ขั้นที่ 2: ติดตั้งระบบ

```javascript
// ใน Apps Script Editor
function install() {
  // 1. สร้าง sheets ทั้งหมด
  setupLibrary();
  
  // 2. สร้าง admin คนแรก
  createFirstAdmin('admin', 'admin123', 'System Admin');
  
  // 3. ลงทะเบียน application
  registerApp('My App', 'ระบบจัดการข้อมูล');
}
```

**เมื่อรันเสร็จ จะได้:**
- ✅ Spreadsheet พร้อม 8 sheets
- ✅ Admin account (username: admin, password: admin123)
- ✅ App Key สำหรับเชื่อมต่อ (เก็บไว้ให้ดี!)

### ขั้นที่ 3: ทดสอบการใช้งาน

```javascript
function testLibrary() {
  // 1. ขอ token
  const tokenResult = request_token({
    username: 'admin',
    password: 'admin123'
  }, 'admin');
  
  Logger.log('Token:', tokenResult.token);
  
  // 2. เชื่อมต่อ
  const conn = connect('YOUR_APP_KEY', tokenResult.token);
  
  // 3. สร้างข้อมูล
  const result = conn.create('organizations', {
    org_name: 'กรมทดสอบ',
    province: 'กรุงเทพมหานคร'
  });
  
  Logger.log('Result:', result);
  
  // 4. อ่านข้อมูล
  const orgs = conn.read('organizations');
  Logger.log('Organizations:', orgs.data.length);
}
```

---

## 📖 การใช้งาน

### 🔐 1. Authentication

```javascript
// Admin Login
const tokenResult = request_token({
  username: 'admin',
  password: 'password123'
}, 'admin');

// User Login
const tokenResult = request_token({
  id13: '1234567890123',  // เลขบัตรประชาชน 13 หลัก
  password: 'password123'
}, 'user');

// ได้ token มาใช้เชื่อมต่อ
if (tokenResult.success) {
  const token = tokenResult.token;
  const expiresAt = tokenResult.expiresAt; // Token หมดอายุใน 24 ชม.
}
```

### 🔌 2. Connection

```javascript
// เชื่อมต่อกับ library
const conn = connect(APP_KEY, token);

// ตรวจสอบว่าเชื่อมต่อสำเร็จหรือไม่
if (conn.success === false) {
  Logger.log('Error:', conn.message);
  return;
}

// ดูข้อมูล session
const info = conn.info();
Logger.log('User Type:', info.data.user_type);
Logger.log('HRMS ID:', info.data.hrms_id);
```

### ✏️ 3. CREATE (สร้างข้อมูล)

```javascript
// สร้าง Organization
const org = conn.create('organizations', {
  hrms_id: 'E6900000',
  dmz_id: 'DMZ001',
  org_name: 'กรมสมเด็จพระเจ้าตากสินมหาราช',
  subdistrict: 'คลองตัน',
  district: 'คลองเตย',
  province: 'กรุงเทพมหานคร'
});

// สร้าง User
const user = conn.create('users', {
  name: 'สมชาย ใจดี',
  id13: '1234567890123',
  password: 'user123456',
  hrms_id: org.data.hrms_id,
  position_id: 'position-uuid',
  rank_id: 'rank-uuid'
});

Logger.log('Created User:', user.data.uuid);
```

### 📖 4. READ (อ่านข้อมูล)

```javascript
// อ่านทั้งหมด
const allOrgs = conn.read('organizations');
Logger.log('Total:', allOrgs.data.length);

// อ่านด้วยเงื่อนไข
const activeOrgs = conn.read('organizations', { 
  active: true,
  province: 'กรุงเทพมหานคร'
});

// อ่านจาก user account (จะได้เฉพาะองค์กรตัวเอง)
const myOrgs = conn.read('organizations');
```

### 🔄 5. UPDATE (แก้ไขข้อมูล)

```javascript
// อัปเดตข้อมูล
const result = conn.update('users', 'user-uuid-123', {
  name: 'Jane Doe (แก้ไขแล้ว)',
  active: true
});

if (result.success) {
  Logger.log('Updated:', result.data);
}
```

### 🗑️ 6. DELETE (ลบข้อมูล)

```javascript
// Soft Delete (ตั้ง active = false)
const result = conn.delete('users', 'user-uuid-123');

if (result.success) {
  Logger.log('Deleted successfully');
}
```

### 🚪 7. Disconnect

```javascript
// ยกเลิกการเชื่อมต่อ (revoke token)
conn.disconnect();
```

---

## 🗃️ ตารางข้อมูล (Database Tables)

| ตาราง | คำอธิบาย | สิทธิ์ Admin | สิทธิ์ User |
|-------|---------|--------------|-------------|
| **config** | ⭐ ตั้งค่าระบบ (key-value) | CRUD | ไม่มีสิทธิ์ |
| **users** | บัญชีผู้ใช้ | CRUD | อ่านเฉพาะองค์กรตัวเอง |
| **organizations** | หน่วยงาน/องค์กร | CRUD | อ่านเฉพาะองค์กรตัวเอง |
| **positions** | ตำแหน่งงาน | CRUD | อ่านอย่างเดียว |
| **ranks** | ยศ/ระดับ | CRUD | อ่านอย่างเดียว |
| **admins** | ผู้ดูแลระบบ | CRUD | ไม่มีสิทธิ์ |
| **applications** | แอพพลิเคชั่น | CRUD | ไม่มีสิทธิ์ |
| **tokens** | Token Authentication | อ่าน, ลบ | ไม่มีสิทธิ์ |
| **logs** | บันทึกการกระทำ | อ่านอย่างเดียว | ไม่มีสิทธิ์ |

---

## ⚙️ ฟังก์ชันสำหรับผู้ดูแลระบบ

### ตรวจสอบสถานะระบบ

```javascript
function checkSystem() {
  const result = checkSetup();
  Logger.log(result);
}
```

### ดูสถิติการใช้งาน

```javascript
function viewStats() {
  const stats = getStatistics();
  Logger.log('Users:', stats.data.users);
  Logger.log('Organizations:', stats.data.organizations);
  Logger.log('Active Tokens:', stats.data.tokens.active);
}
```

### บำรุงรักษาระบบ (รันทุกวัน)

```javascript
function maintenance() {
  const result = dailyMaintenance();
  Logger.log(result);
  // ลบ token หมดอายุ + log เก่า (เก็บไว้ 90 วัน)
}
```

### สร้าง Admin เพิ่ม

```javascript
function addAdmin() {
  createFirstAdmin('newadmin', 'password', 'New Admin');
}
```

### ลงทะเบียน App ใหม่

```javascript
function addApp() {
  const result = registerApp('New App', 'คำอธิบาย');
  Logger.log('App Key:', result.data.app_key);
}
```

### จัดการ Config

```javascript
// ดู config ทั้งหมด
function viewConfig() {
  const config = viewAllConfig();
  Logger.log('All Config:', config.data.object);
}

// แก้ไข config
function changeTokenExpiry() {
  updateConfig('token_expiry_hours', '48', 'เปลี่ยนเป็น 48 ชม.');
}

// เพิ่ม config ใหม่
function addNewConfig() {
  addConfig('max_login_attempts', '5', 'จำนวนครั้ง login สูงสุด');
}

// ใช้งาน config ในโค้ด
function useConfig() {
  const tokenHours = Helpers.getConfig('token_expiry_hours', '24');
  Logger.log('Token expires in:', tokenHours, 'hours');
}
```

---

## 🔒 ความปลอดภัย

- ✅ **Password Hashing**: SHA-256 + Salt
- ✅ **Token Expiry**: 24 ชั่วโมง
- ✅ **ID13 Validation**: ตรวจสอบ checksum เลขบัตรประชาชน
- ✅ **Access Control**: Admin/User roles แยกสิทธิ์ชัดเจน
- ✅ **Audit Log**: บันทึกทุกการกระทำ
- ✅ **Soft Delete**: ไม่ลบข้อมูลจริง (ตั้ง active = false)

---

## 🆚 เปรียบเทียบ v1 vs v2

| ด้าน | v1 (เดิม) | v2 (ใหม่) |
|------|-----------|-----------|
| **Pattern** | IIFE (ซับซ้อน) | Simple Functions |
| **จำนวนไฟล์** | 15+ ไฟล์ | 8 ไฟล์ |
| **บรรทัดโค้ด** | ~2000 บรรทัด | ~1200 บรรทัด |
| **เข้าใจง่าย** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Maintenance** | ยาก | ง่าย |
| **Module ซ้อนกัน** | มี (Auth + TokenManager แยก) | ไม่มี (รวมกัน) |
| **Documentation** | 11 ไฟล์ .md | 2 ไฟล์ .md |

---

## 🤝 การพัฒนาต่อ

### โครงสร้างโค้ด

แต่ละไฟล์มีโครงสร้างดังนี้:

```javascript
/**
 * ชื่อไฟล์
 * คำอธิบายสั้นๆ
 */

// ====================================
// SECTION NAME
// ====================================

function ModuleName_functionName(params) {
  // Implementation
}

// ====================================
// EXPORT
// ====================================

const ModuleName = {
  functionName: ModuleName_functionName,
  // ...
};
```

**ไม่มี IIFE** = อ่านง่าย, debug ง่าย, เข้าใจง่าย

### การเพิ่มฟีเจอร์

1. เพิ่มฟังก์ชันใน module ที่เหมาะสม
2. Export ผ่าน object ท้ายไฟล์
3. เรียกใช้ผ่าน `ModuleName.functionName()`

### ตัวอย่าง: เพิ่มฟังก์ชัน sendEmail ใน Helpers.gs

```javascript
// ใน Helpers.gs
function Helpers_sendEmail(to, subject, body) {
  MailApp.sendEmail(to, subject, body);
}

// Export
const Helpers = {
  // ... existing functions
  sendEmail: Helpers_sendEmail
};

// การใช้งาน
Helpers.sendEmail('test@example.com', 'Hello', 'Test');
```

---

## 🐛 Troubleshooting

### ปัญหา: "No active spreadsheet found"

**แก้ไข:** ตรวจสอบว่า script ถูก bound กับ spreadsheet

```javascript
// ใน Apps Script Editor
Sheet.clearCache();
const ss = Sheet.getSpreadsheet();
Logger.log(ss.getName());
```

### ปัญหา: "Permission denied"

**แก้ไข:** ตรวจสอบสิทธิ์ใน Access.gs

```javascript
// ดู rules
Logger.log(Access.RULES);
```

### ปัญหา: "Token expired"

**แก้ไข:** Token หมดอายุใน 24 ชม. ขอ token ใหม่

```javascript
const newToken = request_token(credentials, userType);
```

---

## 📞 ติดต่อ & สนับสนุน

- **Repository**: [github.com/jackpatcher/dtp-nst-gas-lib](https://github.com/jackpatcher/dtp-nst-gas-lib)
- **Issues**: [GitHub Issues](https://github.com/jackpatcher/dtp-nst-gas-lib/issues)
- **Version**: 2.0.0 (Simplified Architecture)

---

## 📄 License

MIT License - ใช้งานได้ฟรี

---

## 🎉 เริ่มต้นใช้งาน!

```javascript
// 1. ติดตั้ง
setupLibrary();
createFirstAdmin('admin', 'password', 'Admin Name');
const app = registerApp('My App', 'Description');

// 2. ใช้งาน
const token = request_token({ username: 'admin', password: 'password' }, 'admin');
const conn = connect(app.data.app_key, token.token);

// 3. CRUD
conn.create('organizations', { org_name: 'Test Org', province: 'Bangkok' });
const orgs = conn.read('organizations');
Logger.log(orgs);
```

**สนุกกับการ coding! 🚀**
