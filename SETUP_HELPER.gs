/**
 * SETUP_HELPER.gs
 * ฟังก์ชันช่วยตั้งค่า Library
 */

/**
 * ตั้งค่า Spreadsheet ID
 * ⚠️ Run ครั้งเดียวหลัง deploy library
 */
function setupSpreadsheetId() {
  // เปลี่ยน ID นี้เป็นของคุณ
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
  
  // ถ้าใช้ spreadsheet เดียวกับที่ bound กับ script นี้
  // ใช้คำสั่งนี้แทน:
  // const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
  
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', SPREADSHEET_ID);
  
  Logger.log('✅ ตั้งค่า Spreadsheet ID เรียบร้อย');
  Logger.log('   ID: ' + SPREADSHEET_ID);
  Logger.log('\n💡 ขั้นตอนถัดไป: รัน checkSetup() เพื่อตรวจสอบ');
}

/**
 * ตั้งค่าอัตโนมัติ (ใช้ spreadsheet ปัจจุบัน)
 * ⚠️ ต้อง run ใน spreadsheet ที่จะเก็บข้อมูล
 */
function setupAuto() {
  Logger.log('=== ตั้งค่าอัตโนมัติ ===\n');
  
  // 1. ตั้งค่า Spreadsheet ID
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const spreadsheetId = ss.getId();
  
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheetId);
  Logger.log('1. ✅ ตั้งค่า SPREADSHEET_ID: ' + spreadsheetId);
  Logger.log('   Spreadsheet: ' + ss.getName());
  
  // 2. ตรวจสอบ sheets
  Logger.log('\n2. ตรวจสอบ sheets...');
  const requiredSheets = ['admins', 'users', 'organizations', 'tokens', 'applications', 'config', 'logs'];
  let allSheetsExist = true;
  
  requiredSheets.forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      Logger.log('   ✅ ' + sheetName + ' (แถว: ' + sheet.getLastRow() + ')');
    } else {
      Logger.log('   ❌ ' + sheetName + ' - ไม่พบ');
      allSheetsExist = false;
    }
  });
  
  if (!allSheetsExist) {
    Logger.log('\n⚠️ มี sheets ที่ขาด - รัน setupLibrary() เพื่อสร้าง');
  }
  
  // 3. ตรวจสอบ admin
  Logger.log('\n3. ตรวจสอบ admin...');
  try {
    const admins = Sheet.read('admins');
    if (admins.rows.length === 0) {
      Logger.log('   ⚠️ ยังไม่มี admin - รัน createFirstAdmin()');
    } else {
      Logger.log('   ✅ มี admin ' + admins.rows.length + ' คน');
      admins.rows.forEach(function(admin) {
        Logger.log('      - ' + admin.username + ' (' + admin.status + ')');
      });
    }
  } catch (error) {
    Logger.log('   ❌ Error: ' + error.toString());
  }
  
  Logger.log('\n╔═══════════════════════════════╗');
  Logger.log('║   ✅ Setup เสร็จสมบูรณ์!      ║');
  Logger.log('╚═══════════════════════════════╝');
  Logger.log('\n💡 ขั้นตอนถัดไป:');
  Logger.log('   1. Deploy เป็น Library');
  Logger.log('   2. Test จาก client script');
}

/**
 * ตรวจสอบการตั้งค่า
 */
function checkSetup() {
  Logger.log('=== ตรวจสอบการตั้งค่า ===\n');
  
  // 1. เช็ค SPREADSHEET_ID
  Logger.log('1. Script Properties:');
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  
  if (!spreadsheetId) {
    Logger.log('   ❌ ยังไม่ได้ตั้งค่า SPREADSHEET_ID');
    Logger.log('\n💡 แก้ไข: รัน setupSpreadsheetId() หรือ setupAuto()');
    return;
  }
  
  Logger.log('   ✅ SPREADSHEET_ID: ' + spreadsheetId);
  
  // 2. ลองเปิด spreadsheet
  Logger.log('\n2. เข้าถึง Spreadsheet:');
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    Logger.log('   ✅ เปิดได้: ' + ss.getName());
    Logger.log('   URL: ' + ss.getUrl());
    
    // 3. เช็ค admins sheet
    Logger.log('\n3. Admins Sheet:');
    const adminSheet = ss.getSheetByName('admins');
    
    if (!adminSheet) {
      Logger.log('   ❌ ไม่พบ admins sheet');
      Logger.log('\n💡 แก้ไข: รัน setupLibrary()');
      return;
    }
    
    Logger.log('   ✅ พบ admins sheet');
    Logger.log('   จำนวนแถว: ' + adminSheet.getLastRow());
    
    // 4. ทดสอบอ่านข้อมูล
    Logger.log('\n4. ทดสอบอ่านข้อมูล:');
    const admins = Sheet.read('admins');
    Logger.log('   ✅ อ่านได้ ' + admins.rows.length + ' แถว');
    
    if (admins.rows.length === 0) {
      Logger.log('   ⚠️ ยังไม่มี admin');
      Logger.log('\n💡 แก้ไข: รัน createFirstAdmin()');
    } else {
      Logger.log('\n   Admins:');
      admins.rows.forEach(function(admin) {
        Logger.log('   - ' + admin.username + ' (' + admin.email + ') - ' + admin.status);
      });
    }
    
    // 5. ทดสอบ login
    if (admins.rows.length > 0) {
      Logger.log('\n5. ทดสอบ Login:');
      const testResult = request_token({
        username: 'admin',
        password: 'admin123'
      }, 'admin');
      
      if (testResult.success) {
        Logger.log('   ✅ Login สำเร็จ!');
        Logger.log('   Token: ' + testResult.token.substring(0, 20) + '...');
      } else {
        Logger.log('   ❌ Login ไม่สำเร็จ: ' + testResult.message);
        Logger.log('\n💡 ตรวจสอบ password หรือ status ของ admin');
      }
    }
    
    Logger.log('\n╔═══════════════════════════════╗');
    Logger.log('║   ✅ ทุกอย่างพร้อมใช้งาน!     ║');
    Logger.log('╚═══════════════════════════════╝');
    
  } catch (error) {
    Logger.log('   ❌ Error: ' + error.toString());
    Logger.log('\n💡 เช็คว่า:');
    Logger.log('   1. Spreadsheet ID ถูกต้องหรือไม่');
    Logger.log('   2. Library มี permission เข้าถึง spreadsheet หรือไม่');
    Logger.log('   3. Spreadsheet ยังมีอยู่หรือไม่ (ไม่ถูกลบ)');
  }
}

/**
 * รีเซ็ต Script Properties (ลบการตั้งค่าทั้งหมด)
 */
function resetProperties() {
  PropertiesService.getScriptProperties().deleteAllProperties();
  Logger.log('✅ รีเซ็ต Script Properties เรียบร้อย');
  Logger.log('💡 รัน setupAuto() เพื่อตั้งค่าใหม่');
}

/**
 * แสดง Script Properties ทั้งหมด
 */
function showProperties() {
  Logger.log('=== Script Properties ===\n');
  
  const props = PropertiesService.getScriptProperties().getProperties();
  const keys = Object.keys(props);
  
  if (keys.length === 0) {
    Logger.log('(ไม่มี properties)');
    return;
  }
  
  keys.forEach(function(key) {
    Logger.log(key + ': ' + props[key]);
  });
}
