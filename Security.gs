/**
 * Security.gs
 * ระบบรักษาความปลอดภัยแบบง่าย - เน้นเร็ว ไม่ซับซ้อน
 */

// ====================================
// RATE LIMITING (ปิดใช้งาน - เพื่อความเร็ว)
// ====================================

/**
 * ตรวจสอบ rate limit (ปิด - คืนค่า allowed ตลอด)
 */
function Security_checkRateLimit(key, action) {
  return { 
    allowed: true, 
    remaining: 999, 
    resetAt: null 
  };
}

/**
 * Reset rate limit (ไม่ทำอะไร)
 */
function Security_resetRateLimit(key, action) {
  return true;
}

// ====================================
// INPUT VALIDATION (ตรวจสอบพื้นฐาน)
// ====================================

/**
 * ตรวจสอบรูปแบบ email
 */
function Security_validateEmail(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * ตรวจสอบรูปแบบ UUID
 */
function Security_validateUUID(uuid) {
  if (!uuid) return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * ตรวจสอบรูปแบบ token (64 ตัวอักษร)
 */
function Security_validateTokenFormat(token) {
  if (!token) return false;
  return token.length === 64 && /^[a-zA-Z0-9]+$/.test(token);
}

/**
 * ตรวจสอบว่า token หมดอายุหรือไม่
 */
function Security_isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  const now = new Date();
  const expiry = new Date(expiresAt);
  return now > expiry;
}

/**
 * ป้องกัน XSS - ทำความสะอาด string พื้นฐาน
 */
function Security_sanitizeInput(input) {
  if (!input || typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * ตรวจสอบความยาว string
 */
function Security_validateLength(str, min, max) {
  if (!str || typeof str !== 'string') return false;
  const len = str.length;
  return len >= min && len <= max;
}

// ====================================
// EXPORT (สำหรับ Security. namespace)
// ====================================

const Security = {
  checkRateLimit: Security_checkRateLimit,
  resetRateLimit: Security_resetRateLimit,
  validateEmail: Security_validateEmail,
  validateUUID: Security_validateUUID,
  validateTokenFormat: Security_validateTokenFormat,
  isTokenExpired: Security_isTokenExpired,
  sanitizeInput: Security_sanitizeInput,
  validateLength: Security_validateLength
};
