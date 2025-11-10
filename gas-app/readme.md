# 📋 ระบบขอเอกสารประวัติข้าราชการ

> ระบบขอเอกสาร กพ.7 และ กคศ.16 ผ่าน Google Apps Script

## 🎯 คอนเซปต์

ระบบนี้เป็นแอปพลิเคชันสำหรับ**ข้าราชการขอเอกสารประวัติของตัวเอง** โดยผ่านกระบวนการอนุมัติจากเจ้าหน้าที่ มีการบันทึก audit trail ทุกขั้นตอน

### 📄 เอกสารที่รองรับ
- **กพ.7** - ประวัติการรับราชการ
- **กคศ.16** - ใบสำคัญการศึกษา

## 🔄 Flow การทำงาน

```
1. ข้าราชการ Login ผ่าน gas-lib
   ↓
2. ระบบดึงข้อมูลข้าราชการจาก gas-lib
   ↓
3. ข้าราชการเลือกและขอเอกสารที่ต้องการ
   ↓
4. บันทึกคำขอเอกสาร + สถานะ "รออนุมัติ"
   ↓
5. เจ้าหน้าที่รับแจ้งและตรวจสอบ
   ↓
6. เจ้าหน้าที่อนุมัติ/ปฏิเสธ
   ↓
7. [ถ้าอนุมัติ] ข้าราชการดาวน์โหลดและพิมพ์เอกสาร
   ↓
8. บันทึก log การดาวน์โหลด
```

## 🏗️ สถาปัตยกรรม

```
┌─────────────────────────────────────────┐
│   Google Apps Script (Frontend)         │
│   - แบบฟอร์มขอเอกสาร                    │
│   - หน้าจอสำหรับเจ้าหน้าที่             │
│   - ระบบดาวน์โหลด PDF                    │
└─────────────────┬───────────────────────┘
                  │
                  │ Authentication
                  │ ผ่าน Token
                  ↓
┌─────────────────────────────────────────┐
│   dtp-nst-gas-lib (Backend)             │
│   - ระบบ Authentication                 │
│   - ดึงข้อมูลข้าราชการ                  │
│   - จัดการ Token                         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   Google Sheets (Database)              │
│   - ข้อมูลข้าราชการ                     │
│   - คำขอเอกสาร                           │
│   - Log การอนุมัติ/ดาวน์โหลด            │
└─────────────────────────────────────────┘
```

## 🔐 Authentication ผ่าน gas-lib

### 1. ติดตั้ง Library
```
Script ID: YOUR_LIBRARY_SCRIPT_ID
Identifier: dtpnstlib
```

### 2. Request Token (สำหรับ Admin)
```javascript
function requestAdminToken() {
  const adminToken = dtpnstlib.request_token({
    username: 'admin',
    password: 'admin123'
  }, 'admin');
  
  console.log(adminToken);
  // {
  //   success: true,
  //   token: 'xxx',
  //   expiresAt: '2025-11-10T...',
  //   message: 'Authentication successful'
  // }
}
```

### 3. Request Token (สำหรับ User/ข้าราชการ)
```javascript
function requestUserToken() {
  const userToken = dtpnstlib.request_token({
    id13: '1234567890123',
    password: 'userpassword'
  }, 'user');
  
  console.log(userToken);
}
```

### 4. ใช้ Token ดึงข้อมูล
```javascript
function getUserData(token) {
  const userData = dtpnstlib.validate_token(token);
  
  if (userData.success) {
    console.log('User ID:', userData.data.user_id);
    console.log('User Type:', userData.data.user_type);
    console.log('Identifier:', userData.data.user_identifier);
  }
}
```

## 📊 โครงสร้างข้อมูล

### ตาราง: document_requests
```javascript
{
  uuid: "xxx-xxx-xxx",
  user_id: "user-uuid",
  user_id13: "1234567890123",
  user_name: "นายทดสอบ ระบบ",
  document_type: "กพ7", // หรือ "กคศ16"
  request_date: "2025-11-10T...",
  status: "pending", // pending, approved, rejected, downloaded
  approved_by: "admin-uuid",
  approved_date: "2025-11-10T...",
  rejection_reason: "",
  download_date: "2025-11-10T...",
  download_count: 1,
  notes: "",
  created_at: "2025-11-10T...",
  updated_at: "2025-11-10T..."
}
```

### ตาราง: document_logs
```javascript
{
  uuid: "xxx-xxx-xxx",
  request_id: "document-request-uuid",
  action: "request", // request, approve, reject, download
  action_by: "user-uuid",
  action_by_type: "user", // user, admin
  details: "ขอเอกสาร กพ.7",
  timestamp: "2025-11-10T...",
  ip_address: "", // optional
  user_agent: "" // optional
}
```

## 🚀 การใช้งาน

### สำหรับข้าราชการ

1. **Login**
   ```javascript
   function userLogin() {
     const token = dtpnstlib.request_token({
       id13: '1234567890123',
       password: 'password'
     }, 'user');
     
     if (token.success) {
       // เก็บ token ไว้ใน Properties
       PropertiesService.getUserProperties()
         .setProperty('USER_TOKEN', token.token);
     }
   }
   ```

2. **ขอเอกสาร**
   ```javascript
   function requestDocument(documentType) {
     const token = PropertiesService.getUserProperties()
       .getProperty('USER_TOKEN');
     
     const userData = dtpnstlib.validate_token(token);
     
     if (!userData.success) {
       return { success: false, message: 'Token expired' };
     }
     
     // บันทึกคำขอ
     const request = {
       uuid: Utilities.getUuid(),
       user_id: userData.data.user_id,
       user_id13: userData.data.user_identifier,
       document_type: documentType, // "กพ7" หรือ "กคศ16"
       request_date: new Date().toISOString(),
       status: 'pending'
     };
     
     // บันทึกลง Sheet (ใช้ gas-lib)
     // ... code to save ...
     
     return { success: true, message: 'ส่งคำขอเรียบร้อย' };
   }
   ```

3. **เช็คสถานะคำขอ**
   ```javascript
   function checkRequestStatus(requestId) {
     // อ่านข้อมูลจาก Sheet
     // ... code to read ...
     
     return {
       status: 'approved',
       approved_date: '2025-11-10T...',
       can_download: true
     };
   }
   ```

4. **ดาวน์โหลดเอกสาร**
   ```javascript
   function downloadDocument(requestId) {
     // ตรวจสอบว่าอนุมัติแล้ว
     // สร้าง PDF
     // บันทึก log การดาวน์โหลด
     // return PDF blob
   }
   ```

### สำหรับเจ้าหน้าที่ (Admin)

1. **Login Admin**
   ```javascript
   function adminLogin() {
     const token = dtpnstlib.request_token({
       username: 'admin',
       password: 'admin123'
     }, 'admin');
     
     if (token.success) {
       PropertiesService.getScriptProperties()
         .setProperty('ADMIN_TOKEN', token.token);
     }
   }
   ```

2. **ดูรายการคำขอทั้งหมด**
   ```javascript
   function getPendingRequests() {
     const token = PropertiesService.getScriptProperties()
       .getProperty('ADMIN_TOKEN');
     
     // Validate admin token
     const adminData = dtpnstlib.validate_token(token);
     
     if (!adminData.success || adminData.data.user_type !== 'admin') {
       return { success: false, message: 'Unauthorized' };
     }
     
     // อ่านคำขอที่รออนุมัติ
     // ... code to read pending requests ...
   }
   ```

3. **อนุมัติคำขอ**
   ```javascript
   function approveRequest(requestId, adminId) {
     // อัปเดตสถานะเป็น "approved"
     // บันทึก admin ที่อนุมัติ
     // บันทึก log
     
     return { success: true, message: 'อนุมัติเรียบร้อย' };
   }
   ```

4. **ปฏิเสธคำขอ**
   ```javascript
   function rejectRequest(requestId, adminId, reason) {
     // อัปเดตสถานะเป็น "rejected"
     // บันทึกเหตุผล
     // บันทึก log
     
     return { success: true, message: 'ปฏิเสธเรียบร้อย' };
   }
   ```

## 📈 Features

- ✅ Login ผ่าน gas-lib (Token-based Authentication)
- ✅ ขอเอกสาร กพ.7 และ กคศ.16
- ✅ ระบบอนุมัติ/ปฏิเสธ
- ✅ ดาวน์โหลดเอกสาร PDF
- ✅ บันทึก Audit Trail ทุกขั้นตอน
- ✅ ตรวจสอบสถานะคำขอแบบ Real-time
- ✅ นับจำนวนครั้งการดาวน์โหลด
- ✅ Log IP และ User Agent (ถ้าเป็นไปได้)

## 🔒 Security

1. **Token Expiration**: Token หมดอายุใน 24 ชั่วโมง
2. **Authorization**: ตรวจสอบสิทธิ์ทุกครั้งก่อนทำงาน
3. **Audit Trail**: บันทึกทุก action ใน logs
4. **Data Privacy**: ข้าราชการเห็นเฉพาะข้อมูลของตัวเอง
5. **Admin Only**: เฉพาะ admin ถึงจะอนุมัติ/ปฏิเสธได้

## 📝 การพัฒนาต่อ

### Phase 1: MVP ✅
- [ ] สร้างหน้า Login
- [ ] สร้างฟอร์มขอเอกสาร
- [ ] ระบบอนุมัติพื้นฐาน
- [ ] ดาวน์โหลด PDF

### Phase 2: Enhanced
- [ ] Email notification เมื่อคำขออนุมัติ
- [ ] ประวัติการขอเอกสารของตัวเอง
- [ ] Dashboard สำหรับ admin
- [ ] Search & Filter คำขอ

### Phase 3: Advanced
- [ ] ลายเซ็นดิจิทัล
- [ ] Watermark บนเอกสาร
- [ ] Export รายงานสถิติ
- [ ] Mobile responsive

## 🛠️ Tech Stack

- **Frontend**: Google Apps Script (HTML Service)
- **Backend**: dtp-nst-gas-lib (Google Apps Script Library)
- **Database**: Google Sheets
- **Authentication**: Token-based via gas-lib
- **PDF Generation**: Google Apps Script PDF Service

## 📞 Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อ:
- Email: admin@example.com
- Issue Tracker: GitHub Issues

---

**Last Updated**: November 10, 2025  
**Version**: 1.0.0  
**License**: MIT

