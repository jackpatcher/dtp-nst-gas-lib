# 🔐 วิธีอนุญาตให้ Library เข้าถึง Spreadsheet

> แก้ปัญหา: "Unexpected error while getting the method or property openById"

---

## 🎯 ปัญหา

เมื่อเรียกใช้ library จาก script อื่น จะเกิด error:
```
Exception: Unexpected error while getting the method or property openById on object SpreadsheetApp.
```

**สาเหตุ:** Google Apps Script ไม่อนุญาตให้ Library เข้าถึง Spreadsheet ด้วย ID โดยตรง (ด้านความปลอดภัย)

---

## ✅ วิธีแก้ (Properties Service)

Library จะบันทึก Spreadsheet ID ลงใน **Script Properties** แทนการ hardcode

### ขั้นตอนการติดตั้ง:

#### 1. รัน setupLibrary() ในไฟล์ Library

```javascript
// วิธีที่ 1: รันใน spreadsheet-bound script (แนะนำ)
function install() {
  const result = setupLibrary();
  Logger.log(result);
}

// วิธีที่ 2: ระบุ Spreadsheet ID (ถ้ารันจาก standalone script)
function installWithId() {
  const spreadsheetId = '1abc...xyz'; // ใส่ ID ของคุณ
  const result = setupLibrary(spreadsheetId);
  Logger.log(result);
}
```

**⚠️ สำคัญ:**
- ถ้ารันจาก **Extensions > Apps Script** ใน spreadsheet: ใช้ `setupLibrary()` (ไม่ต้องส่ง ID)
- ถ้ารันจาก **standalone script**: ใช้ `setupLibrary('spreadsheet_id')` (ต้องส่ง ID)

**ฟังก์ชันนี้จะ:**
- ✅ บันทึก Spreadsheet ID ลง Script Properties อัตโนมัติ
- ✅ สร้าง sheets ทั้งหมด
- ✅ ตั้งค่า default config

**Output:**
```
✅ Saved Spreadsheet ID: 1abc...xyz
✅ Setup completed successfully!
Spreadsheet: My Database
Spreadsheet ID: 1abc...xyz
URL: https://docs.google.com/spreadsheets/d/...
```

#### 2. สร้าง Admin และ App

```javascript
function setup() {
  // สร้าง admin
  createFirstAdmin('admin', 'admin123', 'Admin Name', 'admin@example.com');
  
  // สร้าง app
  const app = registerApp('My App', 'Description');
  Logger.log('App Key:', app.data.app_key);
}
```

#### 3. Deploy Library

1. ไปที่ **Deploy > New deployment**
2. เลือก **Library**
3. ตั้งชื่อ version เช่น "v1.0"
4. คัดลอก **Script ID**

#### 4. Share Spreadsheet

**⚠️ สำคัญ:** ต้อง share spreadsheet ให้คนที่จะใช้ library

```
1. เปิด spreadsheet
2. กด Share
3. เพิ่ม email ของคนที่จะใช้ (หรือ "Anyone with the link")
4. ตั้งสิทธิ์เป็น "Viewer" หรือ "Editor"
```

---

## 🧪 ทดสอบจาก Client Script

สร้าง Google Apps Script ใหม่:

```javascript
// 1. เพิ่ม Library
// Resources > Libraries > ใส่ Script ID

// 2. ทดสอบ
function testLibrary() {
  const lib = dptnstlib; // ชื่อ identifier ของ library
  
  // Login
  const result = lib.request_token({
    username: 'admin',
    password: 'admin123'
  }, 'admin');
  
  Logger.log(result);
  
  if (result.success) {
    Logger.log('✅ Login สำเร็จ!');
    Logger.log('Token:', result.token);
  } else {
    Logger.log('❌ Login ไม่สำเร็จ:', result.message);
  }
}
```

---

## 🔍 ตรวจสอบการตั้งค่า

### ดู Spreadsheet ID ที่บันทึกไว้:

```javascript
function checkSpreadsheetId() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  Logger.log('Saved Spreadsheet ID:', id);
}
```

### ตั้งค่า Spreadsheet ID ด้วยตัวเอง (ถ้าต้องการ):

```javascript
function setSpreadsheetId() {
  const id = '1abc...xyz'; // ใส่ ID ของ spreadsheet
  const result = Sheet.setSpreadsheetId(id);
  Logger.log(result);
}
```

---

## 🚨 Troubleshooting

### ❌ "Cannot read properties of null (reading 'getId')"

**สาเหตุ:** รัน `setupLibrary()` จาก standalone script โดยไม่ส่ง Spreadsheet ID  
**แก้ไข:** 
```javascript
// ส่ง Spreadsheet ID เข้าไป
setupLibrary('1abc...xyz');
```

### ❌ ยังเกิด error "openById" อยู่

**สาเหตุ:** ยังไม่ได้รัน `setupLibrary()`  
**แก้ไข:** รัน `setupLibrary()` หรือ `setupLibrary('id')` ในไฟล์ Library ก่อน

### ❌ "You do not have permission to call SpreadsheetApp.openById"

**สาเหตุ:** ไม่ได้ share spreadsheet ให้ user  
**แก้ไข:** Share spreadsheet ให้คนที่จะใช้ library

### ❌ "Spreadsheet not found"

**สาเหตุ:** Spreadsheet ID ผิด หรือถูกลบ  
**แก้ไข:** 
1. ตรวจสอบ ID: `checkSpreadsheetId()`
2. ตั้งค่าใหม่: `Sheet.setSpreadsheetId('correct-id')`

### ❌ ต้องการเปลี่ยน Spreadsheet

**วิธี:** ตั้งค่า ID ใหม่

```javascript
function changeSpreadsheet() {
  const newId = '1new...xyz';
  Sheet.setSpreadsheetId(newId);
  Logger.log('✅ เปลี่ยน Spreadsheet สำเร็จ');
}
```

---

## 🔐 ความปลอดภัย

### Script Properties vs Config.gs

| วิธี | ข้อดี | ข้อเสีย |
|------|-------|---------|
| **Script Properties** | ✅ ปลอดภัย<br>✅ ซ่อนจาก user<br>✅ เปลี่ยนได้โดยไม่แก้โค้ด | ❌ ต้องตั้งค่าทุก deployment |
| **Config.gs (hardcode)** | ✅ ง่าย<br>✅ เห็น ID ได้ชัด | ❌ ไม่ปลอดภัย<br>❌ แก้โค้ดต้อง deploy ใหม่ |

**แนะนำ:** ใช้ Script Properties (วิธีปัจจุบัน) ✅

---

## 📝 สรุป Workflow

```
1. รัน setupLibrary() ในไฟล์ Library
   → บันทึก Spreadsheet ID อัตโนมัติ
   
2. สร้าง Admin และ App
   → createFirstAdmin(), registerApp()
   
3. Deploy as Library
   → รับ Script ID
   
4. Share Spreadsheet
   → ให้สิทธิ์คนที่จะใช้
   
5. เพิ่ม Library ใน Client Script
   → ใส่ Script ID
   
6. ใช้งาน
   → request_token(), connect()
```

---

## 💡 เคล็ดลับ

### Deploy แบบ Head (Development)

ใช้สำหรับทดสอบ:
```
Deploy > Test deployments > Library
```
- ✅ อัปเดตอัตโนมัติเมื่อแก้โค้ด
- ✅ ไม่ต้อง deploy version ใหม่
- ❌ ใช้สำหรับทดสอบอย่างเดียว

### Deploy แบบ Version (Production)

ใช้สำหรับ production:
```
Deploy > New deployment > Library
```
- ✅ มี version number
- ✅ มั่นคง ไม่เปลี่ยน
- ✅ สามารถ rollback ได้

---

## 🔗 เอกสารเพิ่มเติม

- [README.md](./README.md) - คู่มือหลัก
- [CONFIG_GUIDE.md](./CONFIG_GUIDE.md) - การตั้งค่า Config
- [Sheet.gs](./Sheet.gs) - Database Layer

---

**💡 Tip:** รัน `setupLibrary()` ครั้งเดียวพอ ครั้งต่อไปจะใช้ Spreadsheet ID ที่บันทึกไว้อัตโนมัติ!
