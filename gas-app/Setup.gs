/**
 * Setup.gs
 * App Initialization และ Setup Functions
 */

/**
 * ลงทะเบียน App ใน gas-lib
 */
function registerApp() {
  try {
    const APP_KEY = 'gas-app-document-system-2025';
    const APP_NAME = 'ระบบขอเอกสารประวัติข้าราชการ';
    
    const appData = {
      uuid: Utilities.getUuid(),
      app_key: APP_KEY,
      app_name: APP_NAME,
      description: 'ระบบขอเอกสาร กพ.7 และ กคศ.16',
      status: 'active',
      created_at: new Date().toISOString()
    };
    
    // บันทึกลง applications table ใน gas-lib
    dtpnstlib.Sheet.append('applications', appData);
    
    // เก็บ APP_KEY ใน Script Properties
    PropertiesService.getScriptProperties()
      .setProperty('APP_KEY', APP_KEY);
    
    Logger.log('✅ App registered successfully!');
    Logger.log('APP_KEY: ' + APP_KEY);
    
    return {
      success: true,
      appKey: APP_KEY,
      message: 'App registered successfully'
    };
    
  } catch (error) {
    Logger.log('❌ registerApp error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * สร้าง Sheets สำหรับ App
 */
function createAppSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. สร้าง document_requests sheet
    let requestsSheet = ss.getSheetByName('document_requests');
    if (!requestsSheet) {
      requestsSheet = ss.insertSheet('document_requests');
      
      const requestsHeaders = [
        'uuid', 'user_id', 'user_id13', 'user_name', 'document_type',
        'request_date', 'status', 'approved_by', 'approved_date',
        'rejected_by', 'rejection_reason', 'file_url', 'file_id',
        'downloaded', 'download_date', 'created_at', 'updated_at'
      ];
      
      requestsSheet.getRange(1, 1, 1, requestsHeaders.length)
        .setValues([requestsHeaders])
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');
      
      requestsSheet.setFrozenRows(1);
      
      Logger.log('✅ Created document_requests sheet');
    }
    
    // 2. สร้าง admin_logs sheet
    let logsSheet = ss.getSheetByName('admin_logs');
    if (!logsSheet) {
      logsSheet = ss.insertSheet('admin_logs');
      
      const logsHeaders = [
        'uuid', 'admin_id', 'admin_name', 'action', 'details', 'timestamp'
      ];
      
      logsSheet.getRange(1, 1, 1, logsHeaders.length)
        .setValues([logsHeaders])
        .setFontWeight('bold')
        .setBackground('#34a853')
        .setFontColor('#ffffff');
      
      logsSheet.setFrozenRows(1);
      
      Logger.log('✅ Created admin_logs sheet');
    }
    
    Logger.log('✅ All sheets created successfully!');
    
    return {
      success: true,
      message: 'Sheets created successfully'
    };
    
  } catch (error) {
    Logger.log('❌ createAppSheets error: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}

/**
 * Setup App ทั้งหมด (รันครั้งเดียวตอนติดตั้ง)
 */
function setupApp() {
  Logger.log('========================================');
  Logger.log('🚀 Starting App Setup...');
  Logger.log('========================================');
  
  // 1. สร้าง Sheets
  const sheetsResult = createAppSheets();
  if (!sheetsResult.success) {
    Logger.log('❌ Failed to create sheets');
    return;
  }
  
  // 2. ลงทะเบียน App
  const registerResult = registerApp();
  if (!registerResult.success) {
    Logger.log('❌ Failed to register app');
    return;
  }
  
  Logger.log('========================================');
  Logger.log('✅ App Setup Complete!');
  Logger.log('========================================');
  Logger.log('');
  Logger.log('📝 Next Steps:');
  Logger.log('1. Deploy as Web App');
  Logger.log('2. Set "Execute as: Me"');
  Logger.log('3. Set "Who has access: Anyone"');
  Logger.log('4. Copy Web App URL');
  Logger.log('');
  Logger.log('🔗 URLs:');
  Logger.log('User:  [WEB_APP_URL]');
  Logger.log('Admin: [WEB_APP_URL]?page=admin');
}

/**
 * ทดสอบการเชื่อมต่อ Library
 */
function testLibrary() {
  try {
    Logger.log('Testing library connection...');
    
    // ทดสอบ Auth
    Logger.log('1. Testing Auth module...');
    const authTest = dtpnstlib.Auth;
    Logger.log('   ✅ Auth module accessible');
    
    // ทดสอบ Sheet
    Logger.log('2. Testing Sheet module...');
    const usersResult = dtpnstlib.Sheet.read('users');
    Logger.log('   ✅ Sheet module accessible');
    Logger.log('   Users in database: ' + usersResult.rows.length);
    
    // ทดสอบ Helpers
    Logger.log('3. Testing Helpers module...');
    const uuid = dtpnstlib.Helpers.generateUUID();
    Logger.log('   ✅ Helpers module accessible');
    Logger.log('   Sample UUID: ' + uuid);
    
    Logger.log('');
    Logger.log('✅ All library functions are working!');
    
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ Library test failed: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}
