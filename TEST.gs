/**
 * TEST.gs
 * ไฟล์สำหรับทดสอบระบบ DTP NST Library
 * 
 * วิธีใช้:
 * 1. รัน testSetupLibrary() เพื่อสร้างตารางทั้งหมด
 * 2. รัน testConfigSystem() เพื่อทดสอบ Config
 * 3. รัน testAuthentication() เพื่อทดสอบ Auth
 * 4. รัน testCRUD() เพื่อทดสอบ Database operations
 * 5. รัน testAll() เพื่อรันทดสอบทั้งหมด
 */

/**
 * ทดสอบ Setup Library - สร้างตารางทั้งหมด
 */
function testSetupLibrary() {
  Logger.log('=== 🧪 Test 1: Setup Library ===\n');
  
  try {
    // รัน setupLibrary
    const result = setupLibrary();
    
    Logger.log('Setup Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      Logger.log('\n✅ PASS: Setup completed successfully');
      Logger.log('Tables created:', result.data.tables.length);
      Logger.log('- ' + result.data.tables.join('\n- '));
      
      // ตรวจสอบว่ามีตาราง config หรือไม่
      const hasConfig = result.data.tables.includes('config');
      Logger.log('\nConfig table created:', hasConfig ? '✅' : '❌');
      
      return true;
    } else {
      Logger.log('\n❌ FAIL:', result.message);
      return false;
    }
  } catch (error) {
    Logger.log('\n❌ ERROR:', error.toString());
    return false;
  }
}

/**
 * ทดสอบ Config System
 */
function testConfigSystem() {
  Logger.log('\n=== 🧪 Test 2: Config System ===\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 2.1: View All Config
    Logger.log('Test 2.1: View All Config');
    const allConfig = viewAllConfig();
    
    if (allConfig.success && allConfig.data.list.length > 0) {
      Logger.log('✅ PASS: Got', allConfig.data.list.length, 'configs');
      Logger.log('Configs:', Object.keys(allConfig.data.object).join(', '));
      passed++;
    } else {
      Logger.log('❌ FAIL: No configs found');
      failed++;
    }
    
    // Test 2.2: Get Single Config
    Logger.log('\nTest 2.2: Get Single Config');
    const tokenHours = Helpers.getConfig('token_expiry_hours');
    
    if (tokenHours === '24') {
      Logger.log('✅ PASS: token_expiry_hours =', tokenHours);
      passed++;
    } else {
      Logger.log('❌ FAIL: Expected 24, got', tokenHours);
      failed++;
    }
    
    // Test 2.3: Get Config with Default
    Logger.log('\nTest 2.3: Get Non-Existent Config with Default');
    const maxAttempts = Helpers.getConfig('max_login_attempts', '5');
    
    if (maxAttempts === '5') {
      Logger.log('✅ PASS: Got default value:', maxAttempts);
      passed++;
    } else {
      Logger.log('❌ FAIL: Default value not returned');
      failed++;
    }
    
    // Test 2.4: Add New Config
    Logger.log('\nTest 2.4: Add New Config');
    const addResult = addConfig(
      'test_config_key',
      'test_value',
      'This is a test config'
    );
    
    if (addResult.success) {
      Logger.log('✅ PASS: Config added');
      passed++;
      
      // ตรวจสอบว่าเพิ่มจริง
      const testValue = Helpers.getConfig('test_config_key');
      if (testValue === 'test_value') {
        Logger.log('✅ PASS: Config value verified');
        passed++;
      } else {
        Logger.log('❌ FAIL: Config value mismatch');
        failed++;
      }
    } else {
      Logger.log('❌ FAIL:', addResult.message);
      failed += 2;
    }
    
    // Test 2.5: Update Config
    Logger.log('\nTest 2.5: Update Existing Config');
    const updateResult = updateConfig(
      'test_config_key',
      'updated_value',
      'Updated test config'
    );
    
    if (updateResult.success) {
      Logger.log('✅ PASS: Config updated');
      passed++;
      
      // ตรวจสอบว่าอัปเดตจริง
      const updatedValue = Helpers.getConfig('test_config_key');
      if (updatedValue === 'updated_value') {
        Logger.log('✅ PASS: Updated value verified');
        passed++;
      } else {
        Logger.log('❌ FAIL: Updated value mismatch');
        failed++;
      }
    } else {
      Logger.log('❌ FAIL:', updateResult.message);
      failed += 2;
    }
    
    // Test 2.6: Delete Config
    Logger.log('\nTest 2.6: Delete Config');
    const deleteResult = removeConfig('test_config_key');
    
    if (deleteResult.success) {
      Logger.log('✅ PASS: Config deleted');
      passed++;
      
      // ตรวจสอบว่าลบจริง
      const deletedValue = Helpers.getConfig('test_config_key', 'NOT_FOUND');
      if (deletedValue === 'NOT_FOUND') {
        Logger.log('✅ PASS: Config deletion verified');
        passed++;
      } else {
        Logger.log('❌ FAIL: Config still exists');
        failed++;
      }
    } else {
      Logger.log('❌ FAIL:', deleteResult.message);
      failed += 2;
    }
    
    // Summary
    Logger.log('\n' + '='.repeat(50));
    Logger.log('Config System Test Summary:');
    Logger.log('✅ Passed:', passed);
    Logger.log('❌ Failed:', failed);
    Logger.log('Total:', passed + failed);
    Logger.log('Success Rate:', Math.round(passed / (passed + failed) * 100) + '%');
    
    return failed === 0;
    
  } catch (error) {
    Logger.log('\n❌ ERROR:', error.toString());
    return false;
  }
}

/**
 * ทดสอบ Authentication
 */
function testAuthentication() {
  Logger.log('\n=== 🧪 Test 3: Authentication ===\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 3.1: Request Token
    Logger.log('Test 3.1: Request Token for Admin');
    const tokenResult = request_token('admin', 'admin123');
    
    if (tokenResult.success && tokenResult.token) {
      Logger.log('✅ PASS: Token generated');
      Logger.log('Token:', tokenResult.token.substring(0, 20) + '...');
      passed++;
      
      // เก็บ token ไว้ใช้ต่อ
      const testToken = tokenResult.token;
      
      // Test 3.2: Connect with Token
      Logger.log('\nTest 3.2: Connect with Token');
      const connectResult = connect(testToken);
      
      if (connectResult.success && connectResult.user) {
        Logger.log('✅ PASS: Connected successfully');
        Logger.log('User:', connectResult.user.username);
        Logger.log('Type:', connectResult.user.type);
        passed++;
      } else {
        Logger.log('❌ FAIL:', connectResult.message);
        failed++;
      }
      
      // Test 3.3: Connect with Invalid Token
      Logger.log('\nTest 3.3: Connect with Invalid Token');
      const invalidConnect = connect('invalid-token-12345');
      
      if (!invalidConnect.success) {
        Logger.log('✅ PASS: Invalid token rejected');
        passed++;
      } else {
        Logger.log('❌ FAIL: Invalid token accepted');
        failed++;
      }
      
    } else {
      Logger.log('❌ FAIL:', tokenResult.message);
      Logger.log('Note: Make sure setupLibrary() is run first and admin account exists');
      failed += 3;
    }
    
    // Summary
    Logger.log('\n' + '='.repeat(50));
    Logger.log('Authentication Test Summary:');
    Logger.log('✅ Passed:', passed);
    Logger.log('❌ Failed:', failed);
    Logger.log('Total:', passed + failed);
    Logger.log('Success Rate:', Math.round(passed / (passed + failed) * 100) + '%');
    
    return failed === 0;
    
  } catch (error) {
    Logger.log('\n❌ ERROR:', error.toString());
    Logger.log('Stack:', error.stack);
    return false;
  }
}

/**
 * ทดสอบ CRUD Operations
 */
function testCRUD() {
  Logger.log('\n=== 🧪 Test 4: CRUD Operations ===\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // ต้องมี token ของ admin ก่อน
    Logger.log('Getting admin token...');
    const tokenResult = request_token('admin', 'admin123');
    
    if (!tokenResult.success) {
      Logger.log('❌ FAIL: Cannot get admin token');
      return false;
    }
    
    const token = tokenResult.token;
    Logger.log('✅ Got admin token\n');
    
    // Test 4.1: Create User
    Logger.log('Test 4.1: Create New User');
    const createResult = Database.create('users', {
      username: 'testuser',
      password: Helpers.hashPassword('testpass123'),
      email: 'test@example.com',
      type: 'user',
      first_name: 'Test',
      last_name: 'User',
      status: 'active'
    }, token);
    
    if (createResult.success && createResult.data.id) {
      Logger.log('✅ PASS: User created');
      Logger.log('User ID:', createResult.data.id);
      passed++;
      
      const userId = createResult.data.id;
      
      // Test 4.2: Read User
      Logger.log('\nTest 4.2: Read User by ID');
      const readResult = Database.read('users', userId, token);
      
      if (readResult.success && readResult.data.username === 'testuser') {
        Logger.log('✅ PASS: User read successfully');
        Logger.log('Username:', readResult.data.username);
        passed++;
      } else {
        Logger.log('❌ FAIL: Cannot read user');
        failed++;
      }
      
      // Test 4.3: Update User
      Logger.log('\nTest 4.3: Update User');
      const updateResult = Database.update('users', userId, {
        email: 'newemail@example.com',
        first_name: 'Updated'
      }, token);
      
      if (updateResult.success) {
        Logger.log('✅ PASS: User updated');
        passed++;
        
        // ตรวจสอบว่าอัปเดตจริง
        const verifyResult = Database.read('users', userId, token);
        if (verifyResult.data.email === 'newemail@example.com') {
          Logger.log('✅ PASS: Update verified');
          passed++;
        } else {
          Logger.log('❌ FAIL: Update not applied');
          failed++;
        }
      } else {
        Logger.log('❌ FAIL:', updateResult.message);
        failed += 2;
      }
      
      // Test 4.4: List Users
      Logger.log('\nTest 4.4: List Users');
      const listResult = Database.list('users', token);
      
      if (listResult.success && listResult.data.length > 0) {
        Logger.log('✅ PASS: Listed', listResult.data.length, 'users');
        passed++;
      } else {
        Logger.log('❌ FAIL: Cannot list users');
        failed++;
      }
      
      // Test 4.5: Delete User
      Logger.log('\nTest 4.5: Delete User');
      const deleteResult = Database.delete('users', userId, token);
      
      if (deleteResult.success) {
        Logger.log('✅ PASS: User deleted');
        passed++;
        
        // ตรวจสอบว่าลบจริง
        const verifyDelete = Database.read('users', userId, token);
        if (!verifyDelete.success) {
          Logger.log('✅ PASS: Deletion verified');
          passed++;
        } else {
          Logger.log('❌ FAIL: User still exists');
          failed++;
        }
      } else {
        Logger.log('❌ FAIL:', deleteResult.message);
        failed += 2;
      }
      
    } else {
      Logger.log('❌ FAIL:', createResult.message);
      failed += 7;
    }
    
    // Summary
    Logger.log('\n' + '='.repeat(50));
    Logger.log('CRUD Operations Test Summary:');
    Logger.log('✅ Passed:', passed);
    Logger.log('❌ Failed:', failed);
    Logger.log('Total:', passed + failed);
    Logger.log('Success Rate:', Math.round(passed / (passed + failed) * 100) + '%');
    
    return failed === 0;
    
  } catch (error) {
    Logger.log('\n❌ ERROR:', error.toString());
    Logger.log('Stack:', error.stack);
    return false;
  }
}

/**
 * รันทดสอบทั้งหมด
 */
function testAll() {
  Logger.log('🚀 Starting Full System Test...\n');
  Logger.log('=' .repeat(60));
  
  const results = {
    setup: false,
    config: false,
    auth: false,
    crud: false
  };
  
  // Test 1: Setup
  results.setup = testSetupLibrary();
  
  // รอสักครู่ให้ระบบพร้อม
  Utilities.sleep(1000);
  
  // Test 2: Config
  results.config = testConfigSystem();
  
  // Test 3: Authentication
  results.auth = testAuthentication();
  
  // Test 4: CRUD
  results.crud = testCRUD();
  
  // Final Summary
  Logger.log('\n\n' + '='.repeat(60));
  Logger.log('📊 FINAL TEST SUMMARY');
  Logger.log('='.repeat(60));
  Logger.log('1. Setup Library:       ' + (results.setup ? '✅ PASS' : '❌ FAIL'));
  Logger.log('2. Config System:       ' + (results.config ? '✅ PASS' : '❌ FAIL'));
  Logger.log('3. Authentication:      ' + (results.auth ? '✅ PASS' : '❌ FAIL'));
  Logger.log('4. CRUD Operations:     ' + (results.crud ? '✅ PASS' : '❌ FAIL'));
  Logger.log('='.repeat(60));
  
  const totalPassed = Object.values(results).filter(r => r).length;
  const totalTests = Object.values(results).length;
  
  Logger.log('\nOverall: ' + totalPassed + '/' + totalTests + ' test suites passed');
  Logger.log('Success Rate: ' + Math.round(totalPassed / totalTests * 100) + '%');
  
  if (totalPassed === totalTests) {
    Logger.log('\n🎉 ALL TESTS PASSED! 🎉');
    Logger.log('The library is working correctly!');
  } else {
    Logger.log('\n⚠️  SOME TESTS FAILED');
    Logger.log('Please check the logs above for details.');
  }
  
  return totalPassed === totalTests;
}

/**
 * ทดสอบแบบรวดเร็ว - ใช้เมื่อต้องการทดสอบด่วนๆ
 */
function quickTest() {
  Logger.log('⚡️ Quick Test\n');
  
  try {
    // 1. ทดสอบ Config
    Logger.log('1. Config:');
    const version = Helpers.getConfig('library_version', 'unknown');
    Logger.log('   Version:', version, version === '2.0.0' ? '✅' : '❌');
    
    // 2. ทดสอบ Token
    Logger.log('\n2. Authentication:');
    const tokenResult = request_token('admin', 'admin123');
    Logger.log('   Token:', tokenResult.success ? '✅' : '❌');
    
    if (tokenResult.success) {
      // 3. ทดสอบ Connect
      Logger.log('\n3. Connection:');
      const connectResult = connect(tokenResult.token);
      Logger.log('   Connect:', connectResult.success ? '✅' : '❌');
      
      // 4. ทดสอบ List
      Logger.log('\n4. Database:');
      const listResult = Database.list('users', tokenResult.token);
      Logger.log('   List:', listResult.success ? '✅ (' + listResult.data.length + ' users)' : '❌');
    }
    
    Logger.log('\n✅ Quick test completed');
    
  } catch (error) {
    Logger.log('\n❌ Error:', error.toString());
  }
}
