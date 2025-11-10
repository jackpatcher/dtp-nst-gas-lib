# 📋 Config.gs - คู่มือการใช้งาน

## 📌 ภาพรวม

`Config.gs` เป็นไฟล์การตั้งค่าหลักของ gas-app ที่รวมค่า configuration ทั้งหมดไว้ในที่เดียว เพื่อความสะดวกในการจัดการและแก้ไข

## 🎯 วัตถุประสงค์

- **Centralized Configuration**: รวมการตั้งค่าทั้งหมดไว้ที่เดียว
- **Easy Maintenance**: แก้ไขค่าได้ง่าย ไม่ต้องไล่หาในหลายไฟล์
- **Type Safety**: มี validation functions สำหรับตรวจสอบค่า
- **Helper Functions**: มีฟังก์ชันช่วยในการจัดการ Config

## 📂 โครงสร้างของ Config Object

```javascript
const Config = {
  // Application Info
  APP_KEY: 'gas-app-document-system-2025',
  APP_NAME: 'ระบบขอเอกสารประวัติข้าราชการ',
  APP_DESCRIPTION: 'ระบบขอเอกสาร กพ.7 และ กคศ.16',
  APP_VERSION: '1.0.0',
  
  // Document Settings
  DOCUMENT_TYPES: {...},
  DRIVE_FOLDER_NAME: 'ประวัติข้าราชการ',
  FILE_NAME_PATTERN: /^(\d{13})_(.+)\.pdf$/,
  
  // Sheet Settings
  SHEETS: {...},
  DOCUMENT_REQUESTS_SCHEMA: [...],
  REQUEST_STATUS: {...},
  
  // Properties Keys
  PROPERTIES: {...},
  
  // UI Messages
  MESSAGES: {...},
  
  // Admin Actions
  ADMIN_ACTIONS: {...}
}
```

## 🔧 การใช้งาน

### 1. เข้าถึงค่า Config แบบง่าย

```javascript
// ดึงค่าโดยตรง
const appName = Config.APP_NAME;
const folderName = Config.DRIVE_FOLDER_NAME;
```

### 2. เข้าถึงค่า Config แบบ Nested

```javascript
// ใช้ Config.get() สำหรับ nested properties
const sheetName = Config.get('SHEETS.DOCUMENT_REQUESTS');
const statusPending = Config.get('REQUEST_STATUS.PENDING');
const loginMessage = Config.get('MESSAGES.LOGIN_SUCCESS');
```

### 3. ใช้ Document Types

```javascript
// รองรับ 2 ประเภทเอกสาร
Config.DOCUMENT_TYPES.GP7;      // "กพ.7"
Config.DOCUMENT_TYPES.KKSH16;   // "กคศ.16"

// ตรวจสอบประเภทเอกสาร
if (isValidDocumentType(documentType)) {
  // ทำอะไรต่อ
}
```

### 4. ใช้ Sheet Names

```javascript
// ชื่อ Sheet สำหรับดึงข้อมูล
const requestsSheet = ss.getSheetByName(Config.SHEETS.DOCUMENT_REQUESTS);
const logsSheet = ss.getSheetByName(Config.SHEETS.ADMIN_LOGS);
```

### 5. ใช้ Status Values

```javascript
// สถานะคำขอ
request.status = Config.REQUEST_STATUS.PENDING;   // "pending"
request.status = Config.REQUEST_STATUS.APPROVED;  // "approved"
request.status = Config.REQUEST_STATUS.REJECTED;  // "rejected"
```

### 6. ใช้ Properties Keys

```javascript
// เก็บและดึงค่าจาก Properties Service
PropertiesService.getUserProperties()
  .setProperty(Config.PROPERTIES.USER_TOKEN, token);

const userId = PropertiesService.getUserProperties()
  .getProperty(Config.PROPERTIES.USER_ID);
```

### 7. ใช้ Messages

```javascript
// แสดงข้อความ
return { 
  success: true, 
  message: Config.MESSAGES.LOGIN_SUCCESS 
};

return { 
  success: false, 
  message: Config.MESSAGES.INVALID_TOKEN 
};
```

### 8. ใช้ Admin Actions (สำหรับ Logging)

```javascript
// บันทึก log
logAdminAction(
  Config.ADMIN_ACTIONS.APPROVE_REQUEST,
  'Approved request #' + requestId
);

logAdminAction(
  Config.ADMIN_ACTIONS.UPLOAD_FILE,
  'Uploaded file: ' + fileName
);
```

## 🛠️ Helper Functions

### 1. Config.parseFileName()

ตรวจสอบและแยกชื่อไฟล์ตามรูปแบบ

```javascript
const parsed = Config.parseFileName('1234567890123_นายทดสอบ_ระบบ.pdf');
// Returns: { id13: '1234567890123', name: 'นายทดสอบ_ระบบ' }

const invalid = Config.parseFileName('wrongformat.pdf');
// Returns: null
```

### 2. Config.generateFileName()

สร้างชื่อไฟล์ตามรูปแบบ

```javascript
const fileName = Config.generateFileName('1234567890123', 'นายทดสอบ_ระบบ');
// Returns: "1234567890123_นายทดสอบ_ระบบ.pdf"
```

### 3. Config.isValidFileType()

ตรวจสอบประเภทไฟล์

```javascript
const isValid = Config.isValidFileType('test.pdf', 'application/pdf');
// Returns: true

const isInvalid = Config.isValidFileType('test.doc', 'application/msword');
// Returns: false
```

### 4. Config.setAppKey() / getAppKey()

จัดการ APP_KEY ใน Script Properties

```javascript
// ตั้งค่า APP_KEY
Config.setAppKey();

// ดึงค่า APP_KEY
const appKey = Config.getAppKey();
```

### 5. Config.setSpreadsheetId() / getSpreadsheetId()

จัดการ Spreadsheet ID

```javascript
// ตั้งค่า Spreadsheet ID
Config.setSpreadsheetId('abc123xyz');

// ดึงค่า Spreadsheet ID
const ssId = Config.getSpreadsheetId();
```

## ✅ Validation Functions

### 1. isValidId13()

ตรวจสอบเลขประจำตัว 13 หลัก

```javascript
isValidId13('1234567890123');  // true
isValidId13('12345');           // false
isValidId13('abc1234567890');   // false
```

### 2. isValidRequestStatus()

ตรวจสอบสถานะคำขอ

```javascript
isValidRequestStatus('pending');   // true
isValidRequestStatus('approved');  // true
isValidRequestStatus('invalid');   // false
```

### 3. isValidDocumentType()

ตรวจสอบประเภทเอกสาร

```javascript
isValidDocumentType('กพ.7');     // true
isValidDocumentType('กคศ.16');   // true
isValidDocumentType('invalid');  // false
```

## 📚 ตัวอย่างการใช้งานในไฟล์ต่างๆ

### UserController.gs

```javascript
function createDocumentRequest(documentType) {
  // ตรวจสอบประเภทเอกสาร
  if (!isValidDocumentType(documentType)) {
    return { success: false, message: 'ประเภทเอกสารไม่ถูกต้อง' };
  }
  
  // ดึง token
  const token = PropertiesService.getUserProperties()
    .getProperty(Config.PROPERTIES.USER_TOKEN);
  
  // ตั้งสถานะ
  request.status = Config.REQUEST_STATUS.PENDING;
  
  // บันทึกลง Sheet
  const sheet = ss.getSheetByName(Config.SHEETS.DOCUMENT_REQUESTS);
  
  // ส่งข้อความกลับ
  return { 
    success: true, 
    message: Config.MESSAGES.REQUEST_CREATED 
  };
}
```

### FileManager.gs

```javascript
function uploadDocumentFile(fileData) {
  // สร้าง folder
  const folder = getOrCreateFolder(Config.DRIVE_FOLDER_NAME);
  
  // แยกชื่อไฟล์
  const parsed = Config.parseFileName(fileData.name);
  if (!parsed) {
    return { 
      success: false, 
      message: Config.MESSAGES.FILE_FORMAT_ERROR 
    };
  }
  
  // ตรวจสอบประเภทไฟล์
  if (!Config.isValidFileType(fileData.name, fileData.mimeType)) {
    return { success: false, message: 'รองรับเฉพาะไฟล์ PDF' };
  }
  
  // บันทึก log
  logAdminAction(
    Config.ADMIN_ACTIONS.UPLOAD_FILE,
    'Uploaded: ' + fileData.name
  );
}
```

### Setup.gs

```javascript
function registerApp() {
  const appData = {
    app_key: Config.APP_KEY,
    app_name: Config.APP_NAME,
    description: Config.APP_DESCRIPTION
  };
  
  // เก็บ APP_KEY
  Config.setAppKey();
}

function createAppSheets() {
  // สร้าง Sheet ตาม Schema
  const requestsSheet = ss.insertSheet(Config.SHEETS.DOCUMENT_REQUESTS);
  requestsSheet.getRange(1, 1, 1, Config.DOCUMENT_REQUESTS_SCHEMA.length)
    .setValues([Config.DOCUMENT_REQUESTS_SCHEMA]);
}
```

## 🧪 การทดสอบ Config

### ทดสอบค่า Config

```javascript
function testConfig() {
  Logger.log('Testing Config...');
  
  // ทดสอบ get()
  Logger.log(Config.get('APP_NAME'));
  Logger.log(Config.get('SHEETS.DOCUMENT_REQUESTS'));
  
  // ทดสอบ parseFileName()
  const parsed = Config.parseFileName('1234567890123_นายทดสอบ.pdf');
  Logger.log(parsed);
  
  // ทดสอบ validation
  Logger.log(isValidId13('1234567890123'));
  Logger.log(isValidDocumentType('กพ.7'));
}
```

### แสดงค่า Config ทั้งหมด

```javascript
function showConfig() {
  Logger.log('=== GAS-APP CONFIGURATION ===');
  Logger.log('APP_KEY: ' + Config.APP_KEY);
  Logger.log('APP_NAME: ' + Config.APP_NAME);
  Logger.log('Document Types: ' + JSON.stringify(Config.DOCUMENT_TYPES));
  Logger.log('Drive Folder: ' + Config.DRIVE_FOLDER_NAME);
}
```

## 🎨 การปรับแต่ง Config

### เปลี่ยนชื่อ Folder

```javascript
// ใน Config.gs
DRIVE_FOLDER_NAME: 'ประวัติข้าราชการ_ใหม่',
```

### เพิ่มประเภทเอกสารใหม่

```javascript
// ใน Config.gs
DOCUMENT_TYPES: {
  GP7: 'กพ.7',
  KKSH16: 'กคศ.16',
  NEW_TYPE: 'เอกสารใหม่'  // เพิ่มประเภทใหม่
}
```

### เปลี่ยนข้อความแสดงผล

```javascript
// ใน Config.gs
MESSAGES: {
  LOGIN_SUCCESS: 'ยินดีต้อนรับเข้าสู่ระบบ',
  REQUEST_CREATED: 'บันทึกคำขอเรียบร้อย',
  // ... เพิ่มข้อความอื่นๆ
}
```

## 📝 Best Practices

1. **อย่า Hardcode ค่า**: ใช้ Config แทนการเขียนค่าตรงๆ
   ```javascript
   // ❌ ไม่ดี
   const sheet = ss.getSheetByName('document_requests');
   
   // ✅ ดี
   const sheet = ss.getSheetByName(Config.SHEETS.DOCUMENT_REQUESTS);
   ```

2. **ใช้ Validation Functions**: ตรวจสอบค่าก่อนใช้งาน
   ```javascript
   if (isValidDocumentType(documentType)) {
     // ทำงานต่อ
   }
   ```

3. **ใช้ Helper Functions**: ใช้ฟังก์ชันที่มีให้แทนการเขียนเอง
   ```javascript
   // ❌ ไม่ดี
   const fileName = id13 + '_' + name + '.pdf';
   
   // ✅ ดี
   const fileName = Config.generateFileName(id13, name);
   ```

4. **ใช้ Config.get() สำหรับ Nested Values**
   ```javascript
   const value = Config.get('SHEETS.DOCUMENT_REQUESTS');
   ```

## 🔗 ไฟล์ที่เกี่ยวข้อง

- **Code.gs**: Entry point
- **Setup.gs**: ใช้ Config สำหรับ setup
- **UserController.gs**: ใช้ Config สำหรับ user operations
- **AdminController.gs**: ใช้ Config สำหรับ admin operations
- **FileManager.gs**: ใช้ Config สำหรับ file management

## 📊 สรุป

`Config.gs` ช่วยให้:
- ✅ จัดการการตั้งค่าได้ง่าย
- ✅ แก้ไขค่าได้ในที่เดียว
- ✅ ลดข้อผิดพลาดจาก typo
- ✅ มี validation ที่ชัดเจน
- ✅ โค้ดอ่านง่ายและบำรุงรักษาง่าย

---

**อัปเดตล่าสุด**: 10 พฤศจิกายน 2568  
**เวอร์ชัน**: 1.0.0
