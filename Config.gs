/**
 * Config.gs
 * ตั้งค่าทั้งหมดของ Library
 * 
 * ⚠️ แก้ไขค่าที่นี่ก่อนใช้งาน
 */

// ====================================
// SPREADSHEET CONFIGURATION
// ====================================

/**
 * SPREADSHEET_ID - ID ของ Google Spreadsheet ที่เก็บข้อมูล
 * 
 * วิธีหา ID:
 * 1. เปิด Google Spreadsheet
 * 2. ดู URL: https://docs.google.com/spreadsheets/d/YOUR_ID_HERE/edit
 * 3. คัดลอก YOUR_ID_HERE มาใส่ตรงนี้
 * 
 * ⚠️ CRITICAL: ต้องตั้งค่านี้ถ้าจะเรียกใช้ library จาก script อื่น
 * ถ้าทดสอบ local ในไฟล์เดียวกับ spreadsheet สามารถเว้นว่างได้
 */
const SPREADSHEET_ID = '';

// ====================================
// TOKEN CONFIGURATION
// ====================================

/**
 * TOKEN_EXPIRY_HOURS - อายุของ token (ชั่วโมง)
 * Default: 24 ชั่วโมง
 */
const TOKEN_EXPIRY_HOURS = 24;

// ====================================
// EXPORT
// ====================================

const Config = {
  // Spreadsheet
  SPREADSHEET_ID: SPREADSHEET_ID,
  
  // Token
  TOKEN_EXPIRY_HOURS: TOKEN_EXPIRY_HOURS
};
