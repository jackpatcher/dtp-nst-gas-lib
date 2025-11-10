/**
 * Code.gs
 * Entry Point และ Routing
 */

/**
 * doGet - เปิดเป็น Web App
 * @param {Object} e - Event object
 * @returns {HtmlOutput}
 */
function doGet(e) {
  const page = e.parameter.page || 'user';
  
  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('ระบบจัดการเอกสาร - Admin')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Default: User page
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('ระบบขอเอกสารประวัติข้าราชการ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * ทดสอบว่า library เชื่อมต่อได้หรือไม่
 */
function testLibraryConnection() {
  try {
    Logger.log('Testing library connection...');
    
    // ทดสอบเรียก library
    const result = dtpnstlib.Sheet.read('users');
    
    Logger.log('Library connected successfully!');
    Logger.log('Users count: ' + result.rows.length);
    
    return {
      success: true,
      message: 'Library connected',
      usersCount: result.rows.length
    };
    
  } catch (error) {
    Logger.log('Library connection failed: ' + error.toString());
    return {
      success: false,
      message: error.toString()
    };
  }
}
