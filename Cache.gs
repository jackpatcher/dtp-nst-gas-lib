/**
 * Cache.gs
 * ระบบ Cache แบบง่าย - ปิดใช้งาน (เพื่อความเร็วและลดความซับซ้อน)
 */

// ====================================
// CACHE OPERATIONS (ปิด - ไม่ใช้จริง)
// ====================================

/**
 * Get จาก cache (คืนค่า null เสมอ - ปิดcache)
 */
function Cache_get(key) {
  return null;  // ปิด cache
}

/**
 * Set ลง cache (ไม่ทำอะไร)
 */
function Cache_set(key, value, ttl) {
  return true;  // ไม่ทำอะไร
}

/**
 * Remove จาก cache (ไม่ทำอะไร)
 */
function Cache_remove(key) {
  return true;  // ไม่ทำอะไร
}

// ====================================
// DOMAIN-SPECIFIC CACHE (ปิดทั้งหมด)
// ====================================

function Cache_getUser(id13) { return null; }
function Cache_setUser(id13, user, ttl) { return true; }
function Cache_getAdmin(username) { return null; }
function Cache_setAdmin(username, admin, ttl) { return true; }
function Cache_getToken(token) { return null; }
function Cache_setToken(token, tokenData, ttl) { return true; }
function Cache_getApp(appKey) { return null; }
function Cache_setApp(appKey, app, ttl) { return true; }
function Cache_getOrg(hrmsId) { return null; }
function Cache_setOrg(hrmsId, org, ttl) { return true; }

// ====================================
// EXPORT
// ====================================

const Cache = {
  get: Cache_get,
  set: Cache_set,
  remove: Cache_remove,
  getUser: Cache_getUser,
  setUser: Cache_setUser,
  getAdmin: Cache_getAdmin,
  setAdmin: Cache_setAdmin,
  getToken: Cache_getToken,
  setToken: Cache_setToken,
  getApp: Cache_getApp,
  setApp: Cache_setApp,
  getOrg: Cache_getOrg,
  setOrg: Cache_setOrg
};
