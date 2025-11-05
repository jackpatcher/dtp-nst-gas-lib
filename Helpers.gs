/**
 * Helpers.gs
 * ฟังก์ชันช่วยเหลือพื้นฐาน (Utility Functions)
 * 
 * ไม่ใช้ IIFE - เข้าใจง่าย อ่านง่าย
 */

// ====================================
// UUID GENERATION
// ====================================

/**
 * สร้าง UUID v4
 * @returns {string} UUID
 */
function Helpers_uuid() {
  return Utilities.getUuid();
}

// ====================================
// PASSWORD HASHING
// ====================================

/**
 * เข้ารหัสรหัสผ่านด้วย SHA-256
 * @param {string} password - รหัสผ่าน
 * @returns {string} รหัสผ่านที่เข้ารหัสแล้ว
 */
function Helpers_hashPassword(password) {
  if (!password) return '';
  
  const salt = 'dtp-nst-2025';
  const combined = password + salt;
  
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    combined,
    Utilities.Charset.UTF_8
  );
  
  // Convert to hex string
  return hash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

// ====================================
// TOKEN GENERATION
// ====================================

/**
 * สร้าง token สุ่มสำหรับ authentication
 * @returns {string} Token 64 ตัวอักษร
 */
function Helpers_generateToken() {
  const random1 = Utilities.getUuid();
  const random2 = Utilities.getUuid();
  const combined = random1 + random2;
  
  return Utilities.base64Encode(combined)
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 64);
}

/**
 * สร้าง App Key สำหรับ application
 * @returns {string} App Key
 */
function Helpers_generateAppKey() {
  return 'app_' + Utilities.getUuid().replace(/-/g, '').substring(0, 32);
}

// ====================================
// DATE/TIME
// ====================================

/**
 * รับเวลาปัจจุบันในรูปแบบ ISO string
 * @returns {string} เวลาปัจจุบัน
 */
function Helpers_now() {
  return new Date().toISOString();
}

/**
 * คำนวณเวลาที่หมดอายุ (24 ชั่วโมงจากตอนนี้)
 * @returns {Date} เวลาหมดอายุ
 */
function Helpers_expiresIn24Hours() {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now;
}

// ====================================
// VALIDATION
// ====================================

/**
 * ตรวจสอบรูปแบบเลขบัตรประชาชน 13 หลัก
 * @param {string} id13 - เลขบัตรประชาชน
 * @returns {boolean} ถูกต้องหรือไม่
 */
function Helpers_validateId13(id13) {
  if (!id13 || !/^\d{13}$/.test(id13)) {
    return false;
  }
  
  // ตรวจสอบ checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id13.charAt(i)) * (13 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id13.charAt(12));
}

/**
 * ตรวจสอบรูปแบบอีเมล
 * @param {string} email - อีเมล
 * @returns {boolean} ถูกต้องหรือไม่
 */
function Helpers_validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * ตรวจสอบความแข็งแรงของรหัสผ่าน
 * @param {string} password - รหัสผ่าน
 * @returns {Object} {valid: boolean, message: string}
 */
function Helpers_validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  
  return { valid: true, message: 'Password is valid' };
}

// ====================================
// RESPONSE FORMAT
// ====================================

/**
 * สร้าง response object แบบมาตรฐาน
 * @param {boolean} success - สำเร็จหรือไม่
 * @param {*} data - ข้อมูล
 * @param {string} message - ข้อความ
 * @returns {Object} Response object
 */
function Helpers_response(success, data, message) {
  return {
    success: success,
    data: data || null,
    message: message || ''
  };
}

// ====================================
// EXPORT (สำหรับเรียกใช้จากไฟล์อื่น)
// ====================================

const Helpers = {
  uuid: Helpers_uuid,
  hashPassword: Helpers_hashPassword,
  generateToken: Helpers_generateToken,
  generateAppKey: Helpers_generateAppKey,
  now: Helpers_now,
  expiresIn24Hours: Helpers_expiresIn24Hours,
  validateId13: Helpers_validateId13,
  validateEmail: Helpers_validateEmail,
  validatePassword: Helpers_validatePassword,
  response: Helpers_response
};
