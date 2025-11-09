# Setup Guide - DTP NST Gas Library

## ⚠️ สำคัญ! ตั้งค่าก่อนใช้งาน

เมื่อ deploy library แล้ว **ต้องตั้งค่า Spreadsheet ID** เพื่อให้ library รู้จักว่าจะเก็บข้อมูลที่ไหน

---

## 🔧 ขั้นตอนการตั้งค่า

### 1. เปิด Script Editor ของ Library

ไปที่ Google Apps Script ของ library นี้

### 2. ตั้งค่า Script Properties

**วิธีที่ 1: ใช้ UI**

1. คลิก **⚙️ Project Settings** (ด้านซ้าย)
2. เลื่อนลงไปที่ **Script Properties**
3. คลิก **Add script property**
4. ใส่:
   - **Property:** `SPREADSHEET_ID`
   - **Value:** `<ใส่ Spreadsheet ID ของคุณ>`
5. คลิก **Save script properties**

**วิธีที่ 2: ใช้โค้ด (run ครั้งเดียว)**

สร้าง function ใหม่และ run:

```javascript
function setupSpreadsheetId() {
  // ⚠️ เปลี่ยน ID นี้เป็นของคุณ
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
  
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', SPREADSHEET_ID);
  
  Logger.log('✅ Spreadsheet ID ตั้งค่าเรียบร้อย: ' + SPREADSHEET_ID);
}
```

### 3. หา Spreadsheet ID

Spreadsheet ID อยู่ใน URL:

```
https://docs.google.com/spreadsheets/d/1abc...xyz/edit
                                      ^^^^^^^^^^^
                                      ส่วนนี้คือ ID
```

**ตัวอย่าง:**
```
URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit

ID = 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### 4. ตรวจสอบว่าตั้งค่าสำเร็จ

Run function นี้:

```javascript
function checkSetup() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  
  if (!spreadsheetId) {
    Logger.log('❌ ยังไม่ได้ตั้งค่า SPREADSHEET_ID');
    return;
  }
  
  Logger.log('✅ SPREADSHEET_ID: ' + spreadsheetId);
  
  // ลองเปิด spreadsheet
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    Logger.log('✅ เปิด Spreadsheet ได้: ' + ss.getName());
    
    // ตรวจสอบ admins sheet
    const adminSheet = ss.getSheetByName('admins');
    if (adminSheet) {
      Logger.log('✅ พบ admins sheet');
      Logger.log('   จำนวนแถว: ' + adminSheet.getLastRow());
    } else {
      Logger.log('⚠️ ไม่พบ admins sheet - รัน setupLibrary() ก่อน');
    }
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    Logger.log('💡 เช็คว่า:');
    Logger.log('   1. Spreadsheet ID ถูกต้องหรือไม่');
    Logger.log('   2. Library script มี permission เข้าถึง spreadsheet หรือไม่');
  }
}
```

---

## 📝 Permission สำหรับ Spreadsheet

Library ต้องมีสิทธิ์เข้าถึง Spreadsheet:

### วิธีที่ 1: ใช้ Spreadsheet เดียวกับ Library

- สร้าง sheet ใน spreadsheet เดียวกับที่ bound กับ Apps Script
- ไม่ต้องตั้งค่าอะไรเพิ่ม

### วิธีที่ 2: ใช้ Spreadsheet แยก

1. Spreadsheet ต้อง **share กับ email ของ library**
2. หา email: Project Settings → Google Cloud Platform Project → Service Account Email
3. Share spreadsheet ให้ service account นั้น (Editor permission)

**หรือ** ให้ library ใช้ OAuth scope:

ใน `appsscript.json` เพิ่ม:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}
```

---

## 🧪 ทดสอบหลังตั้งค่า

### Test 1: ทดสอบใน Library (Local)

```javascript
function testLocal() {
  // ทดสอบ Sheet.read
  const admins = Sheet.read('admins');
  Logger.log('Admins count: ' + admins.rows.length);
  
  // ทดสอบ login
  const token = request_token({
    username: 'admin',
    password: 'admin123'
  }, 'admin');
  
  Logger.log('Token result:', token);
}
```

### Test 2: ทดสอบจาก Client Script

```javascript
function testFromClient() {
  const lib = dptnstlib; // หรือชื่อ library ที่คุณตั้ง
  
  const token = lib.request_token({
    username: 'admin',
    password: 'admin123'
  }, 'admin');
  
  console.log('Token result:', token);
}
```

ถ้าได้ `{ success: true, token: "...", ... }` = **สำเร็จ! ✅**

ถ้าได้ `{ success: false, message: "Admin not found" }` = **ยังไม่ได้ตั้งค่า SPREADSHEET_ID ❌**

---

## 🚨 Troubleshooting

### ❌ "Admin not found" เมื่อเรียกจาก client

**สาเหตุ:** Library ไม่รู้ว่า spreadsheet อยู่ที่ไหน

**แก้ไข:**
1. ตั้งค่า `SPREADSHEET_ID` ใน Script Properties
2. Run `checkSetup()` เพื่อตรวจสอบ

### ❌ "No spreadsheet found"

**สาเหตุ:** SPREADSHEET_ID ไม่ถูกต้อง หรือไม่มี permission

**แก้ไข:**
1. เช็ค SPREADSHEET_ID ว่าถูกต้อง
2. เช็คว่า spreadsheet share ให้ library แล้ว
3. ลอง run `setupLibrary()` ใหม่

### ❌ "Permission denied"

**สาเหตุ:** Library ไม่มีสิทธิ์เข้าถึง spreadsheet

**แก้ไข:**
1. Share spreadsheet ให้ service account email
2. หรือเพิ่ม OAuth scope ใน appsscript.json

---

## ✅ Checklist

ก่อน deploy library เช็คให้แน่ใจว่า:

- [ ] ตั้งค่า `SPREADSHEET_ID` ใน Script Properties แล้ว
- [ ] Run `setupLibrary()` สร้างข้อมูลเบื้องต้น
- [ ] Run `checkSetup()` ตรวจสอบว่าทำงานได้
- [ ] Test `request_token()` จาก local script (ใน library)
- [ ] Test `request_token()` จาก client script (นอก library)
- [ ] ทั้ง 2 test ต้องได้ `success: true`

---

## 📚 อ่านเพิ่มเติม

- [QUICK_START.md](./QUICK_START.md) - เริ่มต้นใช้งาน
- [README.md](./README.md) - คู่มือหลัก
- [FIX_SUMMARY.md](./FIX_SUMMARY.md) - การแก้ไขล่าสุด
