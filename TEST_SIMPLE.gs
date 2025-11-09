/**
 * TEST_SIMPLE.gs
 * ทดสอบแบบง่ายที่สุด - ตรงประเด็น
 */

/**
 * ทดสอบทุกอย่างในที่เดียว
 */
function testSimple() {
  Logger.log('=== ทดสอบระบบ ===\n');
  
  // 1. ลบข้อมูลเก่า
  Logger.log('1. ลบข้อมูลเก่า...');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('admins');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  Logger.log('   ✅ เคลียร์แล้ว\n');
  
  // 2. สร้าง admin ใหม่
  Logger.log('2. สร้าง admin...');
  const adminData = {
    uuid: Helpers.generateUUID(),
    username: 'admin',
    password: Helpers.hashPassword('admin123'),
    email: 'admin@example.com',
    first_name: 'System',
    last_name: 'Admin',
    status: 'active',
    created_at: Helpers.now(),
    updated_at: Helpers.now()
  };
  
  const appendResult = Sheet.append('admins', adminData);
  Logger.log('   Success:', appendResult.success);
  Logger.log('   Message:', appendResult.message);
  
  if (!appendResult.success) {
    Logger.log('   ❌ บันทึกไม่สำเร็จ!');
    return;
  }
  Logger.log('   ✅ บันทึกสำเร็จ\n');
  
  // 3. อ่านข้อมูล
  Logger.log('3. อ่านข้อมูล...');
  const allAdmins = Sheet.read('admins');
  Logger.log('   จำนวนแถว:', allAdmins.rows.length);
  
  if (allAdmins.rows.length === 0) {
    Logger.log('   ❌ อ่านไม่ได้ข้อมูล!');
    return;
  }
  
  Logger.log('   Username:', allAdmins.rows[0].username);
  Logger.log('   Email:', allAdmins.rows[0].email);
  Logger.log('   Status:', allAdmins.rows[0].status);
  Logger.log('   ✅ อ่านได้\n');
  
  // 4. ทดสอบ filter
  Logger.log('4. ทดสอบ filter...');
  const filtered = Sheet.read('admins', { username: 'admin' });
  Logger.log('   จำนวนแถว:', filtered.rows.length);
  
  if (filtered.rows.length === 0) {
    Logger.log('   ❌ Filter ไม่เจอข้อมูล!');
    return;
  }
  
  Logger.log('   Username:', filtered.rows[0].username);
  Logger.log('   ✅ Filter ทำงาน\n');
  
  // 5. ทดสอบ login
  Logger.log('5. ทดสอบ login...');
  const loginResult = Auth.login({ 
    username: 'admin', 
    password: 'admin123' 
  }, 'admin');
  
  Logger.log('   Success:', loginResult.success);
  Logger.log('   Message:', loginResult.message);
  
  if (!loginResult.success) {
    Logger.log('   ❌ Login ไม่สำเร็จ!');
    return;
  }
  
  Logger.log('   Username:', loginResult.data.username);
  Logger.log('   UUID:', loginResult.data.uuid);
  Logger.log('   ✅ Login สำเร็จ\n');
  
  // 6. ทดสอบ request_token
  Logger.log('6. ทดสอบ request_token...');
  const tokenResult = request_token({ 
    username: 'admin', 
    password: 'admin123' 
  }, 'admin');
  
  Logger.log('   Success:', tokenResult.success);
  Logger.log('   Message:', tokenResult.message);
  
  if (!tokenResult.success) {
    Logger.log('   ❌ ไม่ได้ token!');
    return;
  }
  
  Logger.log('   Token:', tokenResult.token.substring(0, 20) + '...');
  Logger.log('   ✅ ได้ token แล้ว\n');
  
  Logger.log('╔════════════════════════╗');
  Logger.log('║   ✅ ทดสอบผ่านหมด!   ║');
  Logger.log('╚════════════════════════╝');
}

/**
 * ทดสอบเฉพาะการอ่าน-เขียน
 */
function testReadWrite() {
  Logger.log('=== ทดสอบ Read/Write ===\n');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('admins');
  
  // 1. ข้อมูลดิบ
  Logger.log('1. ข้อมูลดิบ:');
  const rawData = sheet.getDataRange().getValues();
  Logger.log('   แถวทั้งหมด:', rawData.length);
  
  if (rawData.length > 1) {
    Logger.log('   Headers:', rawData[0]);
    Logger.log('   Data[1]:', rawData[1]);
  }
  
  // 2. Sheet.read()
  Logger.log('\n2. Sheet.read():');
  const result = Sheet.read('admins');
  Logger.log('   rows.length:', result.rows.length);
  
  if (result.rows.length > 0) {
    Logger.log('   First row:', JSON.stringify(result.rows[0], null, 2));
  }
  
  // 3. Sheet.read() with filter
  Logger.log('\n3. Sheet.read() with filter:');
  const filtered = Sheet.read('admins', { username: 'admin' });
  Logger.log('   rows.length:', filtered.rows.length);
  
  if (filtered.rows.length > 0) {
    Logger.log('   Username:', filtered.rows[0].username);
  }
}

/**
 * สร้าง admin ใหม่ (ถ้ายังไม่มี)
 */
function createAdmin() {
  Logger.log('=== สร้าง Admin ===\n');
  
  const result = createFirstAdmin('admin', 'admin123', 'System Admin', 'admin@example.com');
  
  Logger.log('Success:', result.success);
  Logger.log('Message:', result.message);
  
  if (result.success) {
    Logger.log('Username:', result.data.username);
    Logger.log('UUID:', result.data.uuid);
  }
}
