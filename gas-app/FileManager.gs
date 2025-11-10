/**
 * FileManager.gs
 * File Upload และ Management
 */

/**
 * อัพโหลดไฟล์เอกสาร
 * รูปแบบชื่อไฟล์: {id13}_{ชื่อ-สกุล}.pdf
 * @param {Object} fileData - {name, mimeType, content (Base64)}
 * @returns {Object} {success, fileName, fileUrl, fileId, message}
 */
function uploadDocumentFile(fileData) {
  try {
    if (!validateAdminToken()) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // สร้าง/หา folder
    const folder = getOrCreateFolder('ประวัติข้าราชการ');
    
    // ดึง ID13 และชื่อจากชื่อไฟล์
    // Format: 1234567890123_นายทดสอบ_ระบบ.pdf
    const fileName = fileData.name;
    const match = fileName.match(/^(\d{13})_(.+)\.pdf$/);
    
    if (!match) {
      return { 
        success: false, 
        message: 'รูปแบบชื่อไฟล์ไม่ถูกต้อง ต้องเป็น: ID13_ชื่อ-สกุล.pdf' 
      };
    }
    
    const id13 = match[1];
    const name = match[2];
    
    // Decode Base64 และสร้างไฟล์
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData.content),
      fileData.mimeType,
      fileName
    );
    
    // Check if file exists และลบไฟล์เก่า
    const existingFiles = folder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }
    
    // Upload file
    const file = folder.createFile(blob);
    const fileUrl = file.getUrl();
    const fileId = file.getId();
    
    // อัปเดต document_requests ที่มี user_id13 ตรงกัน
    updateRequestsWithFile(id13, fileUrl, fileId);
    
    // บันทึก log
    logAdminAction('upload_file', 
      'Uploaded file: ' + fileName + ' (File ID: ' + fileId + ')');
    
    return {
      success: true,
      fileName: fileName,
      fileUrl: fileUrl,
      fileId: fileId,
      message: 'อัพโหลดไฟล์เรียบร้อย'
    };
    
  } catch (error) {
    Logger.log('uploadDocumentFile error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

/**
 * อัปเดตคำขอด้วย file URL
 * @param {string} id13
 * @param {string} fileUrl
 * @param {string} fileId
 */
function updateRequestsWithFile(id13, fileUrl, fileId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('document_requests');
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const rowId13 = data[i][headers.indexOf('user_id13')];
    const status = data[i][headers.indexOf('status')];
    
    // อัปเดตเฉพาะที่ยังเป็น pending
    if (rowId13 === id13 && status === 'pending') {
      sheet.getRange(i + 1, headers.indexOf('file_url') + 1).setValue(fileUrl);
      sheet.getRange(i + 1, headers.indexOf('file_id') + 1).setValue(fileId);
      sheet.getRange(i + 1, headers.indexOf('updated_at') + 1).setValue(new Date().toISOString());
    }
  }
}

/**
 * Get or Create Folder
 * @param {string} folderName
 * @returns {Folder}
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

/**
 * อัพโหลดหลายไฟล์พร้อมกัน (สำหรับทั้งโรงเรียน)
 * @param {Array} filesData - Array of {name, mimeType, content}
 * @returns {Object} {success, results, message}
 */
function uploadMultipleFiles(filesData) {
  try {
    if (!validateAdminToken()) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const results = [];
    
    filesData.forEach(function(fileData) {
      const result = uploadDocumentFile(fileData);
      results.push(result);
    });
    
    const successCount = results.filter(function(r) { return r.success; }).length;
    
    logAdminAction('upload_multiple_files',
      'Uploaded ' + successCount + '/' + filesData.length + ' files');
    
    return {
      success: true,
      results: results,
      message: 'อัพโหลดเรียบร้อย ' + successCount + '/' + filesData.length + ' ไฟล์'
    };
    
  } catch (error) {
    Logger.log('uploadMultipleFiles error: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}
