# คู่มือการติดตั้งและใช้งาน DTP NST GAS Library

## 📦 สิ่งที่จะได้รับ

Library นี้ประกอบด้วย:
- ✅ ระบบ Authentication และ Authorization แบบ Token-based
- ✅ CRUD Operations สำหรับทุกตาราง (users, organizations, positions, ranks, ฯลฯ)
- ✅ ระบบ Audit Logging บันทึกทุก operation
- ✅ Security: Password hashing, Token expiration, Validation
- ✅ Access Control: Admin มีสิทธิ์เต็ม, User อ่านได้เฉพาะ org ของตัวเอง

## 🚀 ขั้นตอนการติดตั้ง (Setup)

### ขั้นตอนที่ 1: สร้าง Google Spreadsheet

1. เปิด Google Drive
2. สร้าง Spreadsheet ใหม่ ตั้งชื่อ เช่น "DTP NST Database"
3. คัดลอก Spreadsheet ID จาก URL
   ```
   URL: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
   เช่น: 1ABC...XYZ
   ```

### ขั้นตอนที่ 2: สร้าง Apps Script Project

1. จาก Spreadsheet: **Extensions > Apps Script**
2. ลบโค้ด `function myFunction()` ที่มีอยู่
3. สร้างไฟล์ใหม่โดยคลิกที่ **+ > Script file** และตั้งชื่อดังนี้:
   - `Auth` (แล้วคัดลอกโค้ดจาก Auth.gs)
   - `Authorization` (แล้วคัดลอกโค้ดจาก Authorization.gs)
   - `CRUD` (แล้วคัดลอกโค้ดจาก CRUD.gs)
   - `Utils` (แล้วคัดลอกโค้ดจาก Utils.gs)
   - `Admin` (แล้วคัดลอกโค้ดจาก Admin.gs)
4. แก้ไข `Code.gs` (ไฟล์แรก) โดยลบโค้ดเดิมและคัดลอกจาก Code.gs

### ขั้นตอนที่ 3: ตั้งค่า Project Settings

1. คลิก **⚙️ Project Settings** ทางซ้าย
2. เลือก **Show "appsscript.json" manifest file in editor**
3. กลับไปที่ **Editor**
4. เปิดไฟล์ **appsscript.json**
5. คัดลอกโค้ดจาก appsscript.json แทนที่ของเดิม

### ขั้นตอนที่ 4: Initialize Database

รันฟังก์ชันต่อไปนี้ทีละขั้นตอน:

#### 4.1 ตั้งค่า Library
```javascript
function runSetup() {
  const spreadsheetId = 'ใส่ SPREADSHEET_ID ของคุณที่นี่';
  const result = setupLibrary(spreadsheetId);
  Logger.log(result);
}
```

**วิธีรัน:**
1. เลือกฟังก์ชัน `runSetup` จาก dropdown
2. คลิก **Run**
3. อนุญาตสิทธิ์เมื่อถูกถาม
4. รอจนเสร็จ และดูผลใน **Execution log**

#### 4.2 สร้าง Admin แรก
```javascript
function runCreateAdmin() {
  const result = createInitialAdmin('admin', 'P@ssw0rd123', 'ผู้ดูแลระบบ');
  Logger.log(result);
}
```

**รันฟังก์ชัน `runCreateAdmin`** 

บันทึก username และ password ไว้ใช้งาน

#### 4.3 ลงทะเบียน Application แรก
```javascript
function runRegisterApp() {
  const result = registerApplication(
    'ระบบจัดการข้อมูลบุคลากร', 
    'แอปพลิเคชันสำหรับจัดการข้อมูลบุคลากร',
    ''
  );
  Logger.log(result);
}
```

**รันฟังก์ชัน `runRegisterApp`**

**สำคัญ:** บันทึก `app_key` ที่ได้จาก log ไว้ใช้เชื่อมต่อ Library

#### 4.4 ทดสอบการติดตั้ง
```javascript
function runTest() {
  const result = testLibrarySetup();
  Logger.log(result);
}
```

**รันฟังก์ชัน `runTest`**

ตรวจสอบว่าทุกอย่างเรียบร้อย (ทุก test ควรเป็น PASS)

### ขั้นตอนที่ 5: Deploy เป็น Library

1. คลิก **Deploy > New deployment**
2. **Type:** เลือก **Library**
3. **Description:** ใส่ `DTP NST GAS Library v1.0`
4. **Access:** เลือก `Anyone` (หรือจำกัดตามต้องการ)
5. คลิก **Deploy**
6. **สำคัญ:** คัดลอก **Script ID** ที่ได้ เช่น `1AbC...xYz`

### ขั้นตอนที่ 6: ตั้งค่า Maintenance (ไม่บังคับ)

สร้าง Trigger สำหรับทำความสะอาดระบบอัตโนมัติ:

1. คลิก **⏰ Triggers** ทางซ้าย
2. คลิก **Add Trigger** (ล่างขวา)
3. ตั้งค่า:
   - **Function:** `dailyMaintenance`
   - **Event source:** `Time-driven`
   - **Type:** `Day timer`
   - **Time:** เลือก `2am to 3am` (หรือเวลาที่เหมาะสม)
4. คลิก **Save**

---

## 📱 วิธีใช้งาน Library ในแอปของคุณ

### ขั้นตอนที่ 1: เพิ่ม Library

1. สร้าง Apps Script Project ใหม่ หรือเปิด project ที่มีอยู่
2. ไปที่ **Libraries** (ด้านซ้าย) คลิก **+**
3. **Script ID:** วาง Script ID จากขั้นตอนที่ 5
4. **Identifier:** ใส่ `DTPNSTLib`
5. **Version:** เลือก version ล่าสุด
6. คลิก **Add**

### ขั้นตอนที่ 2: ทดสอบการใช้งาน

สร้างฟังก์ชันทดสอบ:

```javascript
function testLibraryConnection() {
  // ข้อมูลการเชื่อมต่อ
  const APP_KEY = 'app_key_ที่ได้จากขั้นตอนที่_4.3';
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'P@ssw0rd123';
  
  // 1. ขอ token
  Logger.log('กำลังขอ token...');
  const tokenResult = DTPNSTLib.request_token({
    username: ADMIN_USER,
    password: ADMIN_PASS
  }, 'admin');
  
  if (!tokenResult.success) {
    Logger.log('❌ ไม่สามารถขอ token ได้: ' + tokenResult.message);
    return;
  }
  
  Logger.log('✅ ได้ token แล้ว');
  Logger.log('Token: ' + tokenResult.token);
  Logger.log('หมดอายุ: ' + tokenResult.expiresAt);
  
  // 2. เชื่อมต่อ Library
  Logger.log('กำลังเชื่อมต่อ...');
  const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);
  
  if (!conn.success) {
    Logger.log('❌ ไม่สามารถเชื่อมต่อได้: ' + conn.message);
    return;
  }
  
  Logger.log('✅ เชื่อมต่อสำเร็จ');
  
  // 3. ทดสอบอ่านข้อมูล
  Logger.log('กำลังอ่านข้อมูล positions...');
  const positions = conn.read('positions', {});
  
  if (positions.success) {
    Logger.log('✅ อ่านข้อมูลสำเร็จ: ' + positions.data.length + ' รายการ');
  } else {
    Logger.log('❌ อ่านข้อมูลไม่สำเร็จ: ' + positions.message);
  }
  
  // 4. ดูข้อมูลการเชื่อมต่อ
  const info = conn.info();
  Logger.log('ข้อมูลการเชื่อมต่อ:', info);
  
  Logger.log('===================');
  Logger.log('✅ การทดสอบเสร็จสมบูรณ์!');
}
```

รันฟังก์ชัน `testLibraryConnection`

---

## 💡 ตัวอย่างการใช้งานจริง

### สร้างข้อมูลองค์กร, ตำแหน่ง, และผู้ใช้

```javascript
function createSampleData() {
  const APP_KEY = 'your_app_key';
  
  // ขอ token
  const tokenResult = DTPNSTLib.request_token({
    username: 'admin',
    password: 'P@ssw0rd123'
  }, 'admin');
  
  const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);
  
  // 1. สร้างองค์กร
  const org = conn.create('organizations', {
    hrms_id: 'HRMS001',
    dmz_id: 'DMZ001',
    org_name: 'กรมสมเด็จพระเจ้าตากสินมหาราช',
    subdistrict: 'แขวงคลองตัน',
    district: 'เขตคลองเตย',
    province: 'กรุงเทพมหานคร'
  });
  
  Logger.log('สร้างองค์กร:', org);
  
  // 2. สร้างตำแหน่ง
  const position = conn.create('positions', {
    name: 'นักวิชาการคอมพิวเตอร์',
    description: 'ตำแหน่งนักวิชาการคอมพิวเตอร์',
    level: 7
  });
  
  Logger.log('สร้างตำแหน่ง:', position);
  
  // 3. สร้างยศ
  const rank = conn.create('ranks', {
    name: 'ชำนาญการพิเศษ',
    abbreviation: 'ชกพ.',
    level: 8
  });
  
  Logger.log('สร้างยศ:', rank);
  
  // 4. สร้างผู้ใช้
  const user = conn.create('users', {
    name: 'สมชาย ใจดี',
    id13: '1234567890123',
    password: 'User@123456',
    position_id: position.data.uuid,
    rank_id: rank.data.uuid,
    org_id: org.data.uuid
  });
  
  Logger.log('สร้างผู้ใช้:', user);
  
  Logger.log('✅ สร้างข้อมูลตัวอย่างเสร็จสิ้น');
}
```

### อ่านข้อมูลผู้ใช้ในองค์กร

```javascript
function readOrgUsers() {
  const APP_KEY = 'your_app_key';
  
  // Login เป็น User
  const tokenResult = DTPNSTLib.request_token({
    id13: '1234567890123',
    password: 'User@123456'
  }, 'user');
  
  if (!tokenResult.success) {
    Logger.log('Login ไม่สำเร็จ');
    return;
  }
  
  const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);
  
  // อ่านผู้ใช้ในองค์กรเดียวกัน (ระบบจะ filter ให้อัตโนมัติ)
  const users = conn.read('users', { active: true });
  
  if (users.success) {
    Logger.log('พบผู้ใช้ในองค์กร:', users.data.length, 'คน');
    
    users.data.forEach(function(user) {
      Logger.log('- ' + user.name + ' (' + user.id13 + ')');
    });
  }
}
```

### แก้ไขข้อมูลผู้ใช้

```javascript
function updateUserData() {
  const APP_KEY = 'your_app_key';
  
  // Login เป็น Admin
  const tokenResult = DTPNSTLib.request_token({
    username: 'admin',
    password: 'P@ssw0rd123'
  }, 'admin');
  
  const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);
  
  // อ่านข้อมูลผู้ใช้ก่อน
  const users = conn.read('users', { id13: '1234567890123' });
  
  if (users.data.length > 0) {
    const userId = users.data[0].uuid;
    
    // แก้ไขข้อมูล
    const result = conn.update('users', userId, {
      name: 'สมชาย ใจดี (แก้ไข)',
      // สามารถแก้ไขฟิลด์อื่นๆ ได้
    });
    
    Logger.log('แก้ไขข้อมูล:', result);
  }
}
```

---

## 🔐 ความปลอดภัย

### เก็บข้อมูลสำคัญใน Script Properties

แทนที่จะเขียน app_key และ password ใน code:

```javascript
// ตั้งค่า (รันครั้งเดียว)
function setupSecureConfig() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('DTP_APP_KEY', 'your-real-app-key-here');
  props.setProperty('DTP_ADMIN_USER', 'admin');
  props.setProperty('DTP_ADMIN_PASS', 'P@ssw0rd123');
  
  Logger.log('✅ ตั้งค่าเรียบร้อย');
}

// ใช้งาน
function secureLogin() {
  const props = PropertiesService.getScriptProperties();
  
  const tokenResult = DTPNSTLib.request_token({
    username: props.getProperty('DTP_ADMIN_USER'),
    password: props.getProperty('DTP_ADMIN_PASS')
  }, 'admin');
  
  if (tokenResult.success) {
    const conn = DTPNSTLib.connect(
      props.getProperty('DTP_APP_KEY'), 
      tokenResult.token
    );
    
    // ใช้งาน conn ต่อไป...
  }
}
```

---

## 📊 การดูข้อมูลสถิติและ Logs

### ดูสถิติระบบ

```javascript
function viewStats() {
  // รันจาก Library Project
  const stats = getLibraryStats();
  Logger.log('สถิติระบบ:', stats);
}
```

### ดู Audit Logs

```javascript
function viewLogs() {
  const APP_KEY = 'your_app_key';
  
  const tokenResult = DTPNSTLib.request_token({
    username: 'admin',
    password: 'P@ssw0rd123'
  }, 'admin');
  
  const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);
  
  // ดู logs ทั้งหมด
  const logs = conn.read('logs', {});
  Logger.log('พบ logs:', logs.data.length, 'รายการ');
  
  // Filter logs ตาม action
  const createLogs = conn.read('logs', { action: 'CREATE' });
  Logger.log('CREATE operations:', createLogs.data.length);
}
```

---

## ❓ แก้ปัญหาเบื้องต้น

### ปัญหา: "Spreadsheet not configured"
```javascript
// รัน setup อีกครั้ง
setupLibrary('your-spreadsheet-id');
```

### ปัญหา: "Invalid token"
```javascript
// ขอ token ใหม่
const tokenResult = DTPNSTLib.request_token(credentials, userType);
```

### ปัญหา: "Access denied"
- ตรวจสอบว่าใช้ user type ที่ถูกต้อง (admin/user)
- Admin มีสิทธิ์ CRUD ทุกตาราง
- User มีสิทธิ์แค่อ่านข้อมูลใน org ของตัวเอง

### ปัญหา: "Invalid app key"
- ตรวจสอบว่า app_key ถูกต้อง
- ดู app_key จาก sheet "applications"
- หรือสร้าง app ใหม่ด้วย `registerApplication()`

---

## 📞 การติดต่อและสนับสนุน

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ Execution log
2. รัน `testLibrarySetup()` เพื่อตรวจสอบการติดตั้ง
3. ดู logs ใน spreadsheet

---

## ✨ คำแนะนำเพิ่มเติม

1. **Token Management**: Token หมดอายุใน 24 ชม. ควร request ใหม่เป็นประจำ
2. **Password Security**: ใช้รหัสผ่านที่ปลอดภัย อย่างน้อย 8 ตัวอักษร
3. **Backup**: สำรองข้อมูล spreadsheet เป็นประจำ
4. **Monitoring**: ตรวจสอบ logs เป็นประจำเพื่อความปลอดภัย

---

**เวอร์ชัน:** 1.0.0  
**อัปเดตล่าสุด:** พฤศจิกายน 2568  
**ทีมพัฒนา:** DTP NST Team
