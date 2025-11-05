/**
 * Example Usage of DTP NST GAS Library
 * 
 * This file demonstrates how to use the library from another Apps Script project
 * 
 * Prerequisites:
 * 1. Add the library to your project (Libraries > Add a library)
 * 2. Use identifier: DTPNSTLib
 * 3. Have your app_key ready (from registerApplication)
 */

// ============================================
// CONFIGURATION
// ============================================

// Store these in Script Properties for security
const CONFIG = {
  APP_KEY: 'YOUR_APP_KEY_HERE',  // Get from registerApplication()
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'admin123456'
};

// ============================================
// EXAMPLE 1: Admin Authentication & CRUD
// ============================================

function example1_AdminFullAccess() {
  Logger.log('=== Example 1: Admin Full Access ===');
  
  // Step 1: Request admin token
  const tokenResult = DTPNSTLib.request_token({
    username: CONFIG.ADMIN_USERNAME,
    password: CONFIG.ADMIN_PASSWORD
  }, 'admin');
  
  if (!tokenResult.success) {
    Logger.log('Authentication failed: ' + tokenResult.message);
    return;
  }
  
  Logger.log('Token obtained: ' + tokenResult.token);
  Logger.log('Expires at: ' + tokenResult.expiresAt);
  
  const token = tokenResult.token;
  
  // Step 2: Connect to library
  const conn = DTPNSTLib.connect(CONFIG.APP_KEY, token);
  
  if (!conn.success) {
    Logger.log('Connection failed: ' + conn.message);
    return;
  }
  
  Logger.log('Connected successfully');
  
  // Step 3: Create organization
  const orgResult = conn.create('organizations', {
    hrms_id: 'HRMS001',
    dmz_id: 'DMZ001',
    org_name: 'กรมสมเด็จพระเจ้าตากสินมหาราช',
    subdistrict: 'แขวงคลองตัน',
    district: 'เขตคลองเตย',
    province: 'กรุงเทพมหานคร'
  });
  
  Logger.log('Create Organization:', orgResult);
  
  if (!orgResult.success) {
    Logger.log('Failed to create organization');
    return;
  }
  
  const orgId = orgResult.data.uuid;
  
  // Step 4: Create position
  const positionResult = conn.create('positions', {
    name: 'นักวิชาการคomputer',
    description: 'ตำแหน่งนักวิชาการคอมพิวเตอร์',
    level: 5
  });
  
  Logger.log('Create Position:', positionResult);
  const positionId = positionResult.data.uuid;
  
  // Step 5: Create rank
  const rankResult = conn.create('ranks', {
    name: 'ชำนาญการ',
    abbreviation: 'ชก.',
    level: 7
  });
  
  Logger.log('Create Rank:', rankResult);
  const rankId = rankResult.data.uuid;
  
  // Step 6: Create user
  const userResult = conn.create('users', {
    name: 'สมชาย ใจดี',
    id13: '1234567890123',
    password: 'user123456',
    position_id: positionId,
    rank_id: rankId,
    org_id: orgId
  });
  
  Logger.log('Create User:', userResult);
  
  if (!userResult.success) {
    Logger.log('Failed to create user');
    return;
  }
  
  const userId = userResult.data.uuid;
  
  // Step 7: Read all users
  const readResult = conn.read('users', {});
  Logger.log('All Users:', readResult);
  
  // Step 8: Update user
  const updateResult = conn.update('users', userId, {
    name: 'สมชาย ใจดี (แก้ไข)'
  });
  
  Logger.log('Update User:', updateResult);
  
  // Step 9: Read specific user
  const specificUserResult = conn.read('users', { uuid: userId });
  Logger.log('Specific User:', specificUserResult);
  
  // Step 10: Soft delete user
  const deleteResult = conn.delete('users', userId);
  Logger.log('Delete User:', deleteResult);
  
  // Step 11: Verify soft delete (active = false)
  const verifyDelete = conn.read('users', { uuid: userId });
  Logger.log('After Delete:', verifyDelete);
  
  // Step 12: Get connection info
  const info = conn.info();
  Logger.log('Connection Info:', info);
  
  // Step 13: Disconnect
  const disconnectResult = conn.disconnect();
  Logger.log('Disconnect:', disconnectResult);
  
  Logger.log('=== Example 1 Complete ===');
}

// ============================================
// EXAMPLE 2: User Limited Access
// ============================================

function example2_UserLimitedAccess() {
  Logger.log('=== Example 2: User Limited Access ===');
  
  // Prerequisite: User must exist with id13='1234567890123'
  
  // Step 1: Request user token
  const tokenResult = DTPNSTLib.request_token({
    id13: '1234567890123',
    password: 'user123456'
  }, 'user');
  
  if (!tokenResult.success) {
    Logger.log('Authentication failed: ' + tokenResult.message);
    return;
  }
  
  Logger.log('User token obtained');
  const token = tokenResult.token;
  
  // Step 2: Connect to library
  const conn = DTPNSTLib.connect(CONFIG.APP_KEY, token);
  
  if (!conn.success) {
    Logger.log('Connection failed: ' + conn.message);
    return;
  }
  
  // Step 3: Read users (only from same org)
  const readUsersResult = conn.read('users', {});
  Logger.log('Users in my org:', readUsersResult);
  
  // Step 4: Read organizations (only my org)
  const readOrgsResult = conn.read('organizations', {});
  Logger.log('My organization:', readOrgsResult);
  
  // Step 5: Read positions (all positions)
  const readPositionsResult = conn.read('positions', {});
  Logger.log('All positions:', readPositionsResult);
  
  // Step 6: Try to create user (should fail)
  const createResult = conn.create('users', {
    name: 'Test User',
    id13: '9876543210987',
    password: 'test123456'
  });
  
  Logger.log('Try to create user (should fail):', createResult);
  
  // Step 7: Try to update user (should fail)
  const updateResult = conn.update('users', 'some-uuid', {
    name: 'Updated Name'
  });
  
  Logger.log('Try to update user (should fail):', updateResult);
  
  // Step 8: Try to delete user (should fail)
  const deleteResult = conn.delete('users', 'some-uuid');
  Logger.log('Try to delete user (should fail):', deleteResult);
  
  // Step 9: Try to access logs (should fail)
  const readLogsResult = conn.read('logs', {});
  Logger.log('Try to read logs (should fail):', readLogsResult);
  
  Logger.log('=== Example 2 Complete ===');
}

// ============================================
// EXAMPLE 3: Batch Operations
// ============================================

function example3_BatchOperations() {
  Logger.log('=== Example 3: Batch Operations ===');
  
  // Get admin token
  const tokenResult = DTPNSTLib.request_token({
    username: CONFIG.ADMIN_USERNAME,
    password: CONFIG.ADMIN_PASSWORD
  }, 'admin');
  
  if (!tokenResult.success) {
    Logger.log('Authentication failed');
    return;
  }
  
  const conn = DTPNSTLib.connect(CONFIG.APP_KEY, tokenResult.token);
  
  if (!conn.success) {
    Logger.log('Connection failed');
    return;
  }
  
  // Create multiple positions
  const positions = [
    { name: 'นักวิเคราะห์นโยบายและแผน', level: 7 },
    { name: 'นักทรัพยากรบุคคล', level: 6 },
    { name: 'นักวิชาการเงินและบัญชี', level: 5 }
  ];
  
  const createdPositions = [];
  
  positions.forEach(function(pos) {
    const result = conn.create('positions', pos);
    if (result.success) {
      createdPositions.push(result.data);
      Logger.log('Created position: ' + pos.name);
    } else {
      Logger.log('Failed to create position: ' + pos.name + ' - ' + result.message);
    }
  });
  
  Logger.log('Created ' + createdPositions.length + ' positions');
  
  // Read all positions
  const allPositions = conn.read('positions', { active: true });
  Logger.log('Total active positions: ' + allPositions.data.length);
  
  Logger.log('=== Example 3 Complete ===');
}

// ============================================
// EXAMPLE 4: Error Handling
// ============================================

function example4_ErrorHandling() {
  Logger.log('=== Example 4: Error Handling ===');
  
  // Test 1: Invalid credentials
  const test1 = DTPNSTLib.request_token({
    username: 'invalid',
    password: 'wrong'
  }, 'admin');
  
  Logger.log('Test 1 - Invalid credentials:', test1);
  
  // Test 2: Invalid app key
  const tokenResult = DTPNSTLib.request_token({
    username: CONFIG.ADMIN_USERNAME,
    password: CONFIG.ADMIN_PASSWORD
  }, 'admin');
  
  if (tokenResult.success) {
    const test2 = DTPNSTLib.connect('invalid-app-key', tokenResult.token);
    Logger.log('Test 2 - Invalid app key:', test2);
  }
  
  // Test 3: Invalid token
  const test3 = DTPNSTLib.connect(CONFIG.APP_KEY, 'invalid-token');
  Logger.log('Test 3 - Invalid token:', test3);
  
  // Test 4: Missing required fields
  if (tokenResult.success) {
    const conn = DTPNSTLib.connect(CONFIG.APP_KEY, tokenResult.token);
    
    if (conn.success) {
      const test4 = conn.create('users', {
        name: 'Test User'
        // Missing required fields: id13, password
      });
      
      Logger.log('Test 4 - Missing fields:', test4);
    }
  }
  
  // Test 5: Duplicate unique field
  if (tokenResult.success) {
    const conn = DTPNSTLib.connect(CONFIG.APP_KEY, tokenResult.token);
    
    if (conn.success) {
      // Try to create duplicate position
      conn.create('positions', { name: 'นักวิชาการคอมพิวเตอร์' });
      const test5 = conn.create('positions', { name: 'นักวิชาการคอมพิวเตอร์' });
      
      Logger.log('Test 5 - Duplicate field:', test5);
    }
  }
  
  Logger.log('=== Example 4 Complete ===');
}

// ============================================
// EXAMPLE 5: Working with Filters
// ============================================

function example5_FilteredQueries() {
  Logger.log('=== Example 5: Filtered Queries ===');
  
  const tokenResult = DTPNSTLib.request_token({
    username: CONFIG.ADMIN_USERNAME,
    password: CONFIG.ADMIN_PASSWORD
  }, 'admin');
  
  if (!tokenResult.success) return;
  
  const conn = DTPNSTLib.connect(CONFIG.APP_KEY, tokenResult.token);
  if (!conn.success) return;
  
  // Filter 1: Active users only
  const activeUsers = conn.read('users', { active: true });
  Logger.log('Active users:', activeUsers.data.length);
  
  // Filter 2: Users in specific organization
  const orgUsers = conn.read('users', { org_id: 'specific-org-uuid' });
  Logger.log('Users in specific org:', orgUsers.data.length);
  
  // Filter 3: Positions at specific level
  const level5Positions = conn.read('positions', { level: 5 });
  Logger.log('Level 5 positions:', level5Positions.data.length);
  
  // Filter 4: Multiple conditions
  const specificRank = conn.read('ranks', { level: 7, active: true });
  Logger.log('Level 7 active ranks:', specificRank.data.length);
  
  Logger.log('=== Example 5 Complete ===');
}

// ============================================
// EXAMPLE 6: Using Script Properties for Security
// ============================================

function example6_SecureConfiguration() {
  Logger.log('=== Example 6: Secure Configuration ===');
  
  // Store sensitive data in Script Properties
  const props = PropertiesService.getScriptProperties();
  
  // Set properties (run once)
  props.setProperty('DTP_APP_KEY', 'your-app-key');
  props.setProperty('DTP_ADMIN_USERNAME', 'admin');
  props.setProperty('DTP_ADMIN_PASSWORD', 'admin123456');
  
  // Retrieve properties
  const appKey = props.getProperty('DTP_APP_KEY');
  const username = props.getProperty('DTP_ADMIN_USERNAME');
  const password = props.getProperty('DTP_ADMIN_PASSWORD');
  
  // Use in authentication
  const tokenResult = DTPNSTLib.request_token({
    username: username,
    password: password
  }, 'admin');
  
  if (tokenResult.success) {
    Logger.log('Authenticated securely using Script Properties');
    
    const conn = DTPNSTLib.connect(appKey, tokenResult.token);
    Logger.log('Connected:', conn.success);
  }
  
  Logger.log('=== Example 6 Complete ===');
}

// ============================================
// HELPER FUNCTION: Run All Examples
// ============================================

function runAllExamples() {
  Logger.log('========================================');
  Logger.log('Running All Examples');
  Logger.log('========================================');
  
  try {
    example1_AdminFullAccess();
  } catch (e) {
    Logger.log('Example 1 error: ' + e.toString());
  }
  
  Utilities.sleep(2000); // Wait 2 seconds
  
  try {
    example2_UserLimitedAccess();
  } catch (e) {
    Logger.log('Example 2 error: ' + e.toString());
  }
  
  Utilities.sleep(2000);
  
  try {
    example3_BatchOperations();
  } catch (e) {
    Logger.log('Example 3 error: ' + e.toString());
  }
  
  Utilities.sleep(2000);
  
  try {
    example4_ErrorHandling();
  } catch (e) {
    Logger.log('Example 4 error: ' + e.toString());
  }
  
  Utilities.sleep(2000);
  
  try {
    example5_FilteredQueries();
  } catch (e) {
    Logger.log('Example 5 error: ' + e.toString());
  }
  
  Logger.log('========================================');
  Logger.log('All Examples Complete');
  Logger.log('========================================');
}

// ============================================
// TEST FUNCTION: Quick Test
// ============================================

function quickTest() {
  Logger.log('=== Quick Test ===');
  
  // Replace with your actual values
  const APP_KEY = 'your-app-key-here';
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123456';
  
  // 1. Get token
  const tokenResult = DTPNSTLib.request_token({
    username: ADMIN_USER,
    password: ADMIN_PASS
  }, 'admin');
  
  Logger.log('Token request:', tokenResult);
  
  if (!tokenResult.success) {
    Logger.log('FAILED: Could not get token');
    return;
  }
  
  // 2. Connect
  const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);
  
  if (!conn.success) {
    Logger.log('FAILED: Could not connect');
    Logger.log('Message:', conn.message);
    return;
  }
  
  // 3. Test read
  const positions = conn.read('positions', {});
  Logger.log('Positions:', positions);
  
  // 4. Get info
  const info = conn.info();
  Logger.log('Connection info:', info);
  
  Logger.log('=== Quick Test Complete ===');
  Logger.log('SUCCESS: Library is working correctly!');
}
