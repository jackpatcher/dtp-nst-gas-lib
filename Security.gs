/**
 * Security.gs
 * ระบบรักษาความปลอดภัย (Rate Limiting, Validation, etc.)
 */

// ====================================
// RATE LIMITING CONFIGURATION
// ====================================

const RATE_LIMIT_CONFIG = {
  LOGIN: {
    MAX_ATTEMPTS: 5,      // จำกัด 5 ครั้งต่อ
    WINDOW: 900,          // 15 นาที (900 วินาที)
    LOCKOUT: 1800         // ล็อค 30 นาที (1800 วินาที)
  },
  TOKEN_CREATE: {
    MAX_ATTEMPTS: 10,     // จำกัด 10 token ต่อ
    WINDOW: 3600          // 1 ชั่วโมง
  },
  API_CALL: {
    MAX_ATTEMPTS: 100,    // จำกัด 100 calls ต่อ
    WINDOW: 3600          // 1 ชั่วโมง
  }
};

// ====================================
// RATE LIMITING FUNCTIONS
// ====================================

/**
 * ตรวจสอบ rate limit
 * @param {string} key - Unique key (เช่น username, ip)
 * @param {string} action - ชนิดของ action (login, token_create, api_call)
 * @returns {Object} {allowed: boolean, remaining: number, resetAt: Date}
 */
function Security_checkRateLimit(key, action) {
  const config = RATE_LIMIT_CONFIG[action.toUpperCase()];
  
  if (!config) {
    return { allowed: true, remaining: 999, resetAt: null };
  }
  
  const rateLimitKey = 'ratelimit:' + action + ':' + key;
  const lockoutKey = 'lockout:' + action + ':' + key;
  
  // ตรวจสอบว่าถูกล็อคอยู่หรือไม่
  const lockout = Cache_get(lockoutKey);
  if (lockout) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(lockout.resetAt),
      locked: true,
      message: 'Account temporarily locked due to too many attempts'
    };
  }
  
  // ตรวจสอบจำนวนครั้งที่ใช้งาน
  let attempts = Cache_get(rateLimitKey) || { count: 0, firstAttempt: new Date() };
  
  const now = new Date();
  const elapsed = (now - new Date(attempts.firstAttempt)) / 1000;
  
  // ถ้าเกิน window ให้ reset
  if (elapsed > config.WINDOW) {
    attempts = { count: 0, firstAttempt: now };
  }
  
  // ตรวจสอบว่าเกิน limit หรือไม่
  if (attempts.count >= config.MAX_ATTEMPTS) {
    // ล็อคบัญชี (สำหรับ login)
    if (action.toLowerCase() === 'login' && config.LOCKOUT) {
      const resetAt = new Date(now.getTime() + config.LOCKOUT * 1000);
      Cache_set(lockoutKey, { resetAt: resetAt.toISOString() }, config.LOCKOUT);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt,
        locked: true,
        message: 'Too many failed attempts. Account locked for ' + (config.LOCKOUT / 60) + ' minutes.'
      };
    }
    
    const resetAt = new Date(new Date(attempts.firstAttempt).getTime() + config.WINDOW * 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt: resetAt,
      message: 'Rate limit exceeded. Try again later.'
    };
  }
  
  // อนุญาต - เพิ่มจำนวนครั้ง
  attempts.count += 1;
  Cache_set(rateLimitKey, attempts, config.WINDOW);
  
  return {
    allowed: true,
    remaining: config.MAX_ATTEMPTS - attempts.count,
    resetAt: new Date(new Date(attempts.firstAttempt).getTime() + config.WINDOW * 1000)
  };
}

/**
 * Reset rate limit สำหรับ key
 * @param {string} key - Unique key
 * @param {string} action - ชนิดของ action
 */
function Security_resetRateLimit(key, action) {
  const rateLimitKey = 'ratelimit:' + action + ':' + key;
  const lockoutKey = 'lockout:' + action + ':' + key;
  
  Cache_remove(rateLimitKey);
  Cache_remove(lockoutKey);
}

// ====================================
// PASSWORD SECURITY
// ====================================

/**
 * สร้าง salt แบบ unique สำหรับแต่ละ user
 * @param {string} identifier - User identifier (username, id13)
 * @returns {string} Unique salt
 */
function Security_generateSalt(identifier) {
  const baseSalt = 'dtp-nst-2025';
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    identifier + baseSalt,
    Utilities.Charset.UTF_8
  ).map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('').substring(0, 32);
}

/**
 * Hash password ด้วย unique salt
 * @param {string} password - Password
 * @param {string} identifier - User identifier
 * @returns {string} Hashed password
 */
function Security_hashPasswordWithSalt(password, identifier) {
  if (!password || !identifier) return '';
  
  const salt = Security_generateSalt(identifier);
  const combined = password + salt;
  
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    combined,
    Utilities.Charset.UTF_8
  );
  
  return hash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

/**
 * ตรวจสอบความแข็งแรงของ password
 * @param {string} password - Password
 * @returns {Object} {valid: boolean, score: number, message: string}
 */
function Security_validatePasswordStrength(password) {
  if (!password) {
    return { valid: false, score: 0, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, score: 0, message: 'Password must be at least 8 characters' };
  }
  
  let score = 0;
  const checks = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
    length: password.length >= 12
  };
  
  if (checks.lowercase) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.numbers) score += 1;
  if (checks.special) score += 1;
  if (checks.length) score += 1;
  
  let message = 'Weak password';
  if (score >= 4) message = 'Strong password';
  else if (score >= 3) message = 'Medium password';
  
  return {
    valid: score >= 2,
    score: score,
    message: message,
    checks: checks
  };
}

// ====================================
// INPUT VALIDATION & SANITIZATION
// ====================================

/**
 * ตรวจสอบและทำความสะอาด input
 * @param {string} input - Input string
 * @param {string} type - ชนิดของ input (text, email, number, uuid)
 * @returns {Object} {valid: boolean, value: string, message: string}
 */
function Security_validateInput(input, type) {
  if (input === null || input === undefined) {
    return { valid: false, value: '', message: 'Input is required' };
  }
  
  const str = String(input).trim();
  
  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(str)) {
        return { valid: false, value: str, message: 'Invalid email format' };
      }
      return { valid: true, value: str.toLowerCase(), message: 'Valid email' };
      
    case 'number':
      if (!/^\d+$/.test(str)) {
        return { valid: false, value: str, message: 'Must be a number' };
      }
      return { valid: true, value: str, message: 'Valid number' };
      
    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(str)) {
        return { valid: false, value: str, message: 'Invalid UUID format' };
      }
      return { valid: true, value: str.toLowerCase(), message: 'Valid UUID' };
      
    case 'alphanumeric':
      if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
        return { valid: false, value: str, message: 'Only letters, numbers, underscore, and dash allowed' };
      }
      return { valid: true, value: str, message: 'Valid alphanumeric' };
      
    case 'text':
    default:
      // ลบอักขระที่อันตราย
      const sanitized = str
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .substring(0, 1000); // จำกัดความยาว
      
      return { valid: true, value: sanitized, message: 'Valid text' };
  }
}

/**
 * ป้องกัน SQL Injection (สำหรับ future use กับ database)
 * @param {string} input - Input string
 * @returns {string} Escaped string
 */
function Security_escapeString(input) {
  if (!input) return '';
  
  return String(input)
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\0')
    .replace(/\x1a/g, '\\Z');
}

// ====================================
// TOKEN SECURITY
// ====================================

/**
 * ตรวจสอบว่า token หมดอายุหรือไม่
 * @param {string} expiresAt - ISO date string
 * @returns {boolean} หมดอายุหรือไม่
 */
function Security_isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  
  const expiry = new Date(expiresAt);
  const now = new Date();
  
  return now >= expiry;
}

/**
 * ตรวจสอบ token format
 * @param {string} token - Token string
 * @returns {boolean} Valid format หรือไม่
 */
function Security_validateTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  
  // Token ควรยาว 64 ตัวอักษร และเป็น alphanumeric
  return /^[a-zA-Z0-9]{64}$/.test(token);
}

// ====================================
// EXPORT
// ====================================

const Security = {
  // Rate limiting
  checkRateLimit: Security_checkRateLimit,
  resetRateLimit: Security_resetRateLimit,
  
  // Password
  generateSalt: Security_generateSalt,
  hashPasswordWithSalt: Security_hashPasswordWithSalt,
  validatePasswordStrength: Security_validatePasswordStrength,
  
  // Input validation
  validateInput: Security_validateInput,
  escapeString: Security_escapeString,
  
  // Token
  isTokenExpired: Security_isTokenExpired,
  validateTokenFormat: Security_validateTokenFormat,
  
  // Config
  CONFIG: RATE_LIMIT_CONFIG
};
