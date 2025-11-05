# 🔄 Change Log - Active Spreadsheet Update

## การเปลี่ยนแปลงสำคัญ

### ✨ สิ่งที่เปลี่ยนแปลง

เปลี่ยนจากการใช้ **SPREADSHEET_ID** เป็นการใช้ **Active Spreadsheet** โดยอัตโนมัติ

---

## 📝 ไฟล์ที่มีการเปลี่ยนแปลง

### 1. `Utils.gs` - SheetManager Module

#### เดิม (ต้องตั้งค่า SPREADSHEET_ID):
```javascript
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('SPREADSHEET_ID');
  
  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }
  return spreadsheet;
}

function setSpreadsheetId(spreadsheetId) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('SPREADSHEET_ID', spreadsheetId);
  spreadsheet = null;
}
```

#### ใหม่ (ใช้ Active Spreadsheet):
```javascript
function getSpreadsheet() {
  if (spreadsheet) {
    return spreadsheet;
  }
  
  // ใช้ active spreadsheet โดยตรง
  spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!spreadsheet) {
    throw new Error('No active spreadsheet found.');
  }
  
  return spreadsheet;
}

function clearCache() {
  spreadsheet = null;
}
```

**Changes:**
- ✅ ลบ `setSpreadsheetId()` ออก
- ✅ เพิ่ม `clearCache()` แทน
- ✅ ใช้ `getActiveSpreadsheet()` โดยตรง

---

### 2. `Admin.gs` - Setup Function

#### เดิม:
```javascript
function setupLibrary(spreadsheetId) {
  SheetManager.setSpreadsheetId(spreadsheetId);
  const result = SheetManager.initializeAllSheets();
  return result;
}
```

#### ใหม่:
```javascript
function setupLibrary() {
  // ไม่ต้องส่ง spreadsheetId
  SheetManager.clearCache();
  const result = SheetManager.initializeAllSheets();
  Logger.log('Using spreadsheet: ' + SheetManager.getSpreadsheet().getName());
  return result;
}
```

**Changes:**
- ✅ ไม่ต้องส่งพารามิเตอร์ `spreadsheetId`
- ✅ แสดงชื่อ spreadsheet ที่ใช้งาน

---

## 📖 วิธีใช้งานแบบใหม่

### Setup (ง่ายขึ้น!)

#### เดิม:
```javascript
function runSetup() {
  const spreadsheetId = '1ABC...XYZ'; // ต้องคัดลอก ID มาใส่
  const result = setupLibrary(spreadsheetId);
  Logger.log(result);
}
```

#### ใหม่:
```javascript
function runSetup() {
  const result = setupLibrary(); // ไม่ต้องใส่ ID!
  Logger.log(result);
}
```

---

## ✅ ข้อดีของการเปลี่ยนแปลง

### 1. **ง่ายต่อการติดตั้ง**
- ❌ เดิม: ต้องคัดลอก Spreadsheet ID
- ✅ ใหม่: ไม่ต้องคัดลอก ID

### 2. **ลดโอกาสผิดพลาด**
- ❌ เดิม: อาจใส่ ID ผิด
- ✅ ใหม่: ใช้ spreadsheet ที่เปิดอยู่อัตโนมัติ

### 3. **เหมาะกับ Bound Script**
- ✅ Library ผูกกับ spreadsheet ตั้งแต่แรก
- ✅ ไม่ต้องจัดการ ID แยก

### 4. **แยก Environment ง่าย**
- ✅ Development: ใช้ spreadsheet A
- ✅ Production: ใช้ spreadsheet B
- แค่คัดลอก script ไปยัง spreadsheet ที่ต้องการ

---

## 🔄 Migration Guide (อัปเดตจากเวอร์ชันเก่า)

### ถ้าคุณใช้งานเวอร์ชันเก่าอยู่

#### ขั้นที่ 1: อัปเดตไฟล์
1. แทนที่ `Utils.gs` ด้วยเวอร์ชันใหม่
2. แทนที่ `Admin.gs` ด้วยเวอร์ชันใหม่

#### ขั้นที่ 2: อัปเดต Setup Functions
ลบ spreadsheetId parameter ออก:

```javascript
// เก่า
function runSetup() {
  setupLibrary('1ABC...XYZ');
}

// ใหม่
function runSetup() {
  setupLibrary(); // ไม่ต้องใส่พารามิเตอร์
}
```

#### ขั้นที่ 3: ทดสอบ
```javascript
function testSetup() {
  const result = testLibrarySetup();
  Logger.log(result);
}
```

---

## 📋 Checklist การอัปเดต

- [ ] สำรองข้อมูล spreadsheet เดิม
- [ ] อัปเดต `Utils.gs`
- [ ] อัปเดต `Admin.gs`
- [ ] แก้ไข `runSetup()` function (ถ้ามี)
- [ ] รัน `testLibrarySetup()` เพื่อทดสอบ
- [ ] ทดสอบการใช้งานปกติ
- [ ] อัปเดต library version (ถ้า deploy แล้ว)

---

## 🆕 เอกสารใหม่

สร้างเอกสารใหม่สำหรับวิธีใช้งาน Active Spreadsheet:

- **QUICKSTART_TH.md** - คู่มือเริ่มต้นใช้งานแบบใหม่ (แนะนำ!)

---

## 🐛 การแก้ปัญหา

### ❌ Error: "No active spreadsheet found"

**สาเหตุ:**
- รันฟังก์ชันจาก standalone script (ไม่ผูกกับ spreadsheet)
- รันจาก context ที่ไม่มี active spreadsheet

**วิธีแก้:**
1. ตรวจสอบว่า script ผูกกับ spreadsheet
2. เปิด spreadsheet แล้วไปที่ Extensions > Apps Script
3. รันฟังก์ชันจากที่นั่น

---

### ⚠️ การใช้งานแบบเก่ายังใช้ได้หรือไม่?

**ไม่ได้แล้ว** - ฟังก์ชัน `setSpreadsheetId()` ถูกลบออก

**ถ้าคุณต้องการใช้ spreadsheet เฉพาะเจาะจง:**
- แก้ไข `Utils.gs` เพื่อเพิ่มฟังก์ชัน `setSpreadsheetId()` กลับมา
- หรือใช้วิธีใหม่: คัดลอก script ไปยัง spreadsheet ที่ต้องการ

---

## 📊 สรุปการเปลี่ยนแปลง

| ด้าน | เดิม | ใหม่ |
|------|------|------|
| Setup | ต้องใส่ spreadsheet ID | ไม่ต้องใส่ |
| Complexity | สูง | ต่ำ |
| Error-prone | มาก | น้อย |
| Flexibility | Medium | สูง |
| Best for | Shared library | Bound script |

---

## 🎯 Use Cases

### Case 1: Single Spreadsheet App
✅ **แนะนำแบบใหม่**
- script และ data อยู่ใน spreadsheet เดียวกัน
- ติดตั้งง่าย ใช้งานง่าย

### Case 2: Multiple Spreadsheets (Same Structure)
✅ **แนะนำแบบใหม่**
- คัดลอก script ไปยังแต่ละ spreadsheet
- แต่ละ instance ทำงานอิสระ

### Case 3: Central Library with Shared Database
⚠️ **ต้องปรับแต่ง**
- อาจต้องเพิ่ม configuration
- พิจารณาใช้ spreadsheet ID แบบเก่า

---

## 📅 Version History

### Version 1.1.0 (Active Spreadsheet)
**Date:** November 2025

**Changes:**
- ✅ ใช้ Active Spreadsheet แทน SPREADSHEET_ID
- ✅ ลด complexity ในการ setup
- ✅ เพิ่ม `clearCache()` function
- ✅ ปรับปรุงเอกสาร

### Version 1.0.0 (Original)
**Date:** November 2025

**Features:**
- ✅ ระบบ Authentication & Authorization
- ✅ CRUD Operations
- ✅ Audit Logging
- ✅ ใช้ SPREADSHEET_ID configuration

---

## 🎓 คำแนะนำสำหรับผู้ใช้ใหม่

### เลือกแบบไหนดี?

**ใช้ Active Spreadsheet (แนะนำ):**
- ✅ ถ้าคุณเพิ่งเริ่มต้น
- ✅ ถ้า script และ data อยู่ใน spreadsheet เดียวกัน
- ✅ ถ้าต้องการติดตั้งง่ายๆ

**ใช้ SPREADSHEET_ID (Advanced):**
- ✅ ถ้าต้องการ library กลางเชื่อมหลาย spreadsheets
- ✅ ถ้ามีความต้องการพิเศษ

---

## 📞 สนับสนุน

**เอกสารที่เกี่ยวข้อง:**
- [QUICKSTART_TH.md](./QUICKSTART_TH.md) - Setup guide แบบใหม่
- [README_TH.md](./README_TH.md) - คู่มือหลัก
- [Example.gs](./Example.gs) - ตัวอย่างการใช้งาน

**ปัญหา/คำถาม:**
- ดู Troubleshooting ใน QUICKSTART_TH.md
- ตรวจสอบ Execution logs
- รัน testLibrarySetup() เพื่อ diagnose

---

**Updated:** November 2025  
**Version:** 1.1.0 (Active Spreadsheet)  
**Team:** DTP NST
