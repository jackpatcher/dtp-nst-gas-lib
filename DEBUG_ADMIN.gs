/**
 * DEBUG_ADMIN.gs
 * ฟังก์ชันช่วย debug ปัญหา admin login
 */

/**
 * ตรวจสอบข้อมูล admin ใน spreadsheet
 */
function debugCheckAdmin() {
  Logger.log('========================================');
  Logger.log('=== ตรวจสอบข้อมูล Admin ===');
  Logger.log('========================================');
  
  try {
    // 1. อ่านข้อมูล admin ทั้งหมด
    const result = Sheet.read('admins');
    
    Logger.log('\n1. จำนวน Admin ทั้งหมด: ' + result.rows.length);
    
    if (result.rows.length === 0) {
      Logger.log('\n❌ ไม่มี Admin ในระบบ!');
      Logger.log('กรุณารัน: createFirstAdmin("admin", "admin123", "Admin Name")');
      return;
    }
    
    // 2. แสดงข้อมูล admin แต่ละคน
    Logger.log('\n2. รายชื่อ Admin:');
    result.rows.forEach(function(admin, index) {
      Logger.log('\n--- Admin #' + (index + 1) + ' ---');
      Logger.log('   UUID: ' + admin.uuid);
      Logger.log('   Username: ' + admin.username);
      Logger.log('   Email: ' + admin.email);
      Logger.log('   Status: ' + admin.status);
      Logger.log('   First Name: ' + admin.first_name);
      Logger.log('   Last Name: ' + admin.last_name);
      Logger.log('   Password (hashed): ' + (admin.password ? admin.password.substring(0, 20) + '...' : 'null'));
      Logger.log('   Created: ' + admin.created_at);
    });
    
    Logger.log('\n========================================');
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
  }
}

/**
 * ทดสอบ hash password
 */
function debugTestPassword() {
  Logger.log('========================================');
  Logger.log('=== ทดสอบ Password Hash ===');
  Logger.log('========================================');
  
  const testPassword = 'admin123';
  
  Logger.log('\n1. Password ทดสอบ: ' + testPassword);
  
  // Hash password
  const hashed = Helpers.hashPassword(testPassword);
  Logger.log('\n2. Hash result: ' + hashed);
  
  // Hash อีกครั้งเพื่อเทียบ
  const hashed2 = Helpers.hashPassword(testPassword);
  Logger.log('\n3. Hash ครั้งที่ 2: ' + hashed2);
  
  Logger.log('\n4. เหมือนกันหรือไม่: ' + (hashed === hashed2 ? '✅ เหมือนกัน' : '❌ ไม่เหมือนกัน'));
  
  Logger.log('\n========================================');
}

/**
 * เปรียบเทียบ password ที่ hash แล้วกับที่เก็บใน DB
 */
function debugComparePassword() {
  Logger.log('========================================');
  Logger.log('=== เปรียบเทียบ Password ===');
  Logger.log('========================================');
  
  const username = 'admin';
  const password = 'admin123';
  
  Logger.log('\n1. ทดสอบ Login:');
  Logger.log('   Username: ' + username);
  Logger.log('   Password: ' + password);
  
  // อ่านข้อมูล admin
  const result = Sheet.read('admins', { username: username });
  
  if (result.rows.length === 0) {
    Logger.log('\n❌ ไม่พบ admin username: ' + username);
    return;
  }
  
  const admin = result.rows[0];
  
  Logger.log('\n2. ข้อมูลจาก Database:');
  Logger.log('   Username: ' + admin.username);
  Logger.log('   Status: ' + admin.status);
  Logger.log('   Password (DB): ' + admin.password);
  
  // Hash password ที่ใส่เข้ามา
  const hashedInput = Helpers.hashPassword(password);
  Logger.log('\n3. Password ที่ hash:');
  Logger.log('   Input Hash: ' + hashedInput);
  
  // เปรียบเทียบ
  Logger.log('\n4. การเปรียบเทียบ:');
  Logger.log('   DB Password:    ' + admin.password);
  Logger.log('   Input Password: ' + hashedInput);
  Logger.log('   ตรงกันหรือไม่:   ' + (admin.password === hashedInput ? '✅ ตรงกัน' : '❌ ไม่ตรงกัน'));
  
  // แสดงความยาว
  Logger.log('\n5. ความยาว:');
  Logger.log('   DB Length:    ' + admin.password.length + ' ตัวอักษร');
  Logger.log('   Input Length: ' + hashedInput.length + ' ตัวอักษร');
  
  Logger.log('\n========================================');
}

/**
 * ทดสอบ login แบบเต็ม
 */
function debugFullLogin() {
  Logger.log('========================================');
  Logger.log('=== ทดสอบ Login เต็มรูปแบบ ===');
  Logger.log('========================================');
  
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };
  
  Logger.log('\n1. Credentials:');
  Logger.log('   Username: ' + credentials.username);
  Logger.log('   Password: ' + credentials.password);
  
  // เรียก Auth_login
  Logger.log('\n2. เรียก Auth_login...');
  const result = Auth.login(credentials, 'admin');
  
  Logger.log('\n3. ผลลัพธ์:');
  Logger.log('   Success: ' + result.success);
  Logger.log('   Message: ' + result.message);
  
  if (result.success) {
    Logger.log('   User Data: ' + JSON.stringify(result.data, null, 2));
    Logger.log('\n✅ Login สำเร็จ!');
  } else {
    Logger.log('\n❌ Login ล้มเหลว!');
  }
  
  Logger.log('\n========================================');
}

/**
 * รีเซ็ต password admin
 */
function debugResetAdminPassword() {
  Logger.log('========================================');
  Logger.log('=== รีเซ็ต Admin Password ===');
  Logger.log('========================================');
  
  const username = 'admin';
  const newPassword = 'admin123';
  
  Logger.log('\n1. ค้นหา admin: ' + username);
  
  const result = Sheet.read('admins', { username: username });
  
  if (result.rows.length === 0) {
    Logger.log('\n❌ ไม่พบ admin username: ' + username);
    return;
  }
  
  const admin = result.rows[0];
  Logger.log('   พบแล้ว! UUID: ' + admin.uuid);
  
  // Hash password ใหม่
  Logger.log('\n2. Hash password ใหม่: ' + newPassword);
  const hashedPassword = Helpers.hashPassword(newPassword);
  Logger.log('   Hash result: ' + hashedPassword);
  
  // อัปเดต
  Logger.log('\n3. อัปเดต password...');
  const updateResult = Sheet.update('admins', admin.uuid, {
    password: hashedPassword,
    updated_at: Helpers.now()
  });
  
  if (updateResult.success) {
    Logger.log('   ✅ อัปเดตสำเร็จ!');
    
    // ทดสอบ login
    Logger.log('\n4. ทดสอบ login ด้วย password ใหม่...');
    const loginResult = Auth.login({ username: username, password: newPassword }, 'admin');
    
    if (loginResult.success) {
      Logger.log('   ✅ Login สำเร็จ!');
    } else {
      Logger.log('   ❌ Login ล้มเหลว: ' + loginResult.message);
    }
  } else {
    Logger.log('   ❌ อัปเดตล้มเหลว: ' + updateResult.message);
  }
  
  Logger.log('\n========================================');
}

/**
 * รัน debug ทั้งหมด
 */
function debugAll() {
  debugCheckAdmin();
  Logger.log('\n\n');
  debugTestPassword();
  Logger.log('\n\n');
  debugComparePassword();
  Logger.log('\n\n');
  debugFullLogin();
}
