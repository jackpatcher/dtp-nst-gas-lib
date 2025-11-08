/**
 * Cache.gs
 * ระบบ Cache สำหรับเพิ่มความเร็ว
 * ใช้ CacheService ของ Google Apps Script
 */

// ====================================
// CACHE CONFIGURATION
// ====================================

const CACHE_CONFIG = {
  TTL: {
    SHORT: 60,        // 1 นาที - สำหรับข้อมูลที่เปลี่ยนบ่อย
    MEDIUM: 600,      // 10 นาที - สำหรับข้อมูล reference
    LONG: 3600        // 1 ชั่วโมง - สำหรับข้อมูลที่เปลี่ยนน้อย
  },
  PREFIX: {
    USER: 'user:',
    ADMIN: 'admin:',
    APP: 'app:',
    TOKEN: 'token:',
    ORG: 'org:',
    POS: 'pos:',
    RANK: 'rank:',
    CONFIG: 'config:'
  }
};

// ====================================
// CACHE OPERATIONS
// ====================================

/**
 * รับ CacheService (Script level)
 * @private
 */
function _getCacheService() {
  return CacheService.getScriptCache();
}

/**
 * บันทึกข้อมูลลง cache
 * @param {string} key - Cache key
 * @param {*} value - ข้อมูลที่ต้องการเก็บ
 * @param {number} ttl - เวลาหมดอายุ (วินาที)
 * @returns {boolean} สำเร็จหรือไม่
 */
function Cache_set(key, value, ttl) {
  try {
    const cache = _getCacheService();
    const serialized = JSON.stringify(value);
    cache.put(key, serialized, ttl || CACHE_CONFIG.TTL.MEDIUM);
    return true;
  } catch (error) {
    Logger.log('Cache_set error: ' + error.toString());
    return false;
  }
}

/**
 * อ่านข้อมูลจาก cache
 * @param {string} key - Cache key
 * @returns {*|null} ข้อมูลที่เก็บไว้หรือ null
 */
function Cache_get(key) {
  try {
    const cache = _getCacheService();
    const cached = cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    Logger.log('Cache_get error: ' + error.toString());
    return null;
  }
}

/**
 * ลบข้อมูลออกจาก cache
 * @param {string} key - Cache key
 */
function Cache_remove(key) {
  try {
    const cache = _getCacheService();
    cache.remove(key);
  } catch (error) {
    Logger.log('Cache_remove error: ' + error.toString());
  }
}

/**
 * ลบ cache ทั้งหมด
 */
function Cache_removeAll() {
  try {
    const cache = _getCacheService();
    cache.removeAll();
  } catch (error) {
    Logger.log('Cache_removeAll error: ' + error.toString());
  }
}

/**
 * ลบ cache ที่เกี่ยวข้องกับ prefix
 * @param {string} prefix - Prefix ของ cache key
 */
function Cache_removeByPrefix(prefix) {
  // Note: CacheService ไม่มี API สำหรับลบตาม prefix
  // ต้องเก็บ key list เอง หรือใช้วิธีอื่น
  // สำหรับตอนนี้ใช้ removeAll() แทน
  Cache_removeAll();
}

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * สร้าง cache key สำหรับ user
 * @param {string} identifier - id13 หรือ username
 * @returns {string} Cache key
 */
function Cache_userKey(identifier) {
  return CACHE_CONFIG.PREFIX.USER + identifier;
}

/**
 * สร้าง cache key สำหรับ admin
 * @param {string} username - Username
 * @returns {string} Cache key
 */
function Cache_adminKey(username) {
  return CACHE_CONFIG.PREFIX.ADMIN + username;
}

/**
 * สร้าง cache key สำหรับ app
 * @param {string} appKey - App key
 * @returns {string} Cache key
 */
function Cache_appKey(appKey) {
  return CACHE_CONFIG.PREFIX.APP + appKey;
}

/**
 * สร้าง cache key สำหรับ token
 * @param {string} token - Token
 * @returns {string} Cache key
 */
function Cache_tokenKey(token) {
  return CACHE_CONFIG.PREFIX.TOKEN + token;
}

/**
 * สร้าง cache key สำหรับ organization
 * @param {string} hrmsId - HRMS ID
 * @returns {string} Cache key
 */
function Cache_orgKey(hrmsId) {
  return CACHE_CONFIG.PREFIX.ORG + hrmsId;
}

/**
 * สร้าง cache key สำหรับ config
 * @param {string} configKey - Config key
 * @returns {string} Cache key
 */
function Cache_configKey(configKey) {
  return CACHE_CONFIG.PREFIX.CONFIG + configKey;
}

// ====================================
// DOMAIN-SPECIFIC CACHE FUNCTIONS
// ====================================

/**
 * Cache user data
 * @param {string} id13 - User ID13
 * @param {Object} userData - User data
 */
function Cache_setUser(id13, userData) {
  Cache_set(Cache_userKey(id13), userData, CACHE_CONFIG.TTL.SHORT);
}

/**
 * Get cached user data
 * @param {string} id13 - User ID13
 * @returns {Object|null} User data
 */
function Cache_getUser(id13) {
  return Cache_get(Cache_userKey(id13));
}

/**
 * Cache admin data
 * @param {string} username - Admin username
 * @param {Object} adminData - Admin data
 */
function Cache_setAdmin(username, adminData) {
  Cache_set(Cache_adminKey(username), adminData, CACHE_CONFIG.TTL.SHORT);
}

/**
 * Get cached admin data
 * @param {string} username - Admin username
 * @returns {Object|null} Admin data
 */
function Cache_getAdmin(username) {
  return Cache_get(Cache_adminKey(username));
}

/**
 * Cache token data
 * @param {string} token - Token
 * @param {Object} tokenData - Token data
 */
function Cache_setToken(token, tokenData) {
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const ttl = Math.floor((expiresAt - now) / 1000);
  
  // Cache จนกว่า token จะหมดอายุ (แต่ไม่เกิน 6 ชั่วโมง)
  const cacheTTL = Math.min(ttl, 21600);
  
  if (cacheTTL > 0) {
    Cache_set(Cache_tokenKey(token), tokenData, cacheTTL);
  }
}

/**
 * Get cached token data
 * @param {string} token - Token
 * @returns {Object|null} Token data
 */
function Cache_getToken(token) {
  return Cache_get(Cache_tokenKey(token));
}

/**
 * Cache application data
 * @param {string} appKey - App key
 * @param {Object} appData - App data
 */
function Cache_setApp(appKey, appData) {
  Cache_set(Cache_appKey(appKey), appData, CACHE_CONFIG.TTL.LONG);
}

/**
 * Get cached application data
 * @param {string} appKey - App key
 * @returns {Object|null} App data
 */
function Cache_getApp(appKey) {
  return Cache_get(Cache_appKey(appKey));
}

/**
 * Cache organization data
 * @param {string} hrmsId - HRMS ID
 * @param {Object} orgData - Organization data
 */
function Cache_setOrg(hrmsId, orgData) {
  Cache_set(Cache_orgKey(hrmsId), orgData, CACHE_CONFIG.TTL.LONG);
}

/**
 * Get cached organization data
 * @param {string} hrmsId - HRMS ID
 * @returns {Object|null} Organization data
 */
function Cache_getOrg(hrmsId) {
  return Cache_get(Cache_orgKey(hrmsId));
}

/**
 * Cache config value
 * @param {string} key - Config key
 * @param {string} value - Config value
 */
function Cache_setConfig(key, value) {
  Cache_set(Cache_configKey(key), value, CACHE_CONFIG.TTL.LONG);
}

/**
 * Get cached config value
 * @param {string} key - Config key
 * @returns {string|null} Config value
 */
function Cache_getConfig(key) {
  return Cache_get(Cache_configKey(key));
}

// ====================================
// EXPORT
// ====================================

const Cache = {
  set: Cache_set,
  get: Cache_get,
  remove: Cache_remove,
  removeAll: Cache_removeAll,
  removeByPrefix: Cache_removeByPrefix,
  
  // Key generators
  userKey: Cache_userKey,
  adminKey: Cache_adminKey,
  appKey: Cache_appKey,
  tokenKey: Cache_tokenKey,
  orgKey: Cache_orgKey,
  configKey: Cache_configKey,
  
  // Domain-specific
  setUser: Cache_setUser,
  getUser: Cache_getUser,
  setAdmin: Cache_setAdmin,
  getAdmin: Cache_getAdmin,
  setToken: Cache_setToken,
  getToken: Cache_getToken,
  setApp: Cache_setApp,
  getApp: Cache_getApp,
  setOrg: Cache_setOrg,
  getOrg: Cache_getOrg,
  setConfig: Cache_setConfig,
  getConfig: Cache_getConfig,
  
  // Config
  CONFIG: CACHE_CONFIG
};
