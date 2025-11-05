# 📚 DTP NST Library - ตัวอย่างการใช้งาน

> รวมตัวอย่างการใช้งานทั้งหมดในที่เดียว

---

## 📑 สารบัญ

1. [Setup](#1-setup-ติดตั้งระบบ)
2. [Authentication](#2-authentication)
3. [Admin - Full Access](#3-admin---full-access)
4. [User - Limited Access](#4-user---limited-access)
5. [Batch Operations](#5-batch-operations)
6. [Error Handling](#6-error-handling)
7. [Maintenance](#7-maintenance)

---

## 1. Setup (ติดตั้งระบบ)

### ติดตั้งครั้งแรก

```javascript
function firstTimeSetup() {
  Logger.log('=== Setting up library ===');
  
  // 1. สร้าง sheets ทั้งหมด
  const setupResult = setupLibrary();
  Logger.log('Setup:', setupResult);
  
  // 2. สร้าง admin คนแรก
  const adminResult = createFirstAdmin(
    'admin',           // username
    'admin123456',     // password (อย่างน้อย 6 ตัว)
    'System Admin'     // ชื่อเต็ม
  );
  Logger.log('Admin:', adminResult);
  
  // 3. ลงทะเบียน application
  const appResult = registerApp(
    'My Application',
    'ระบบจัดการข้อมูลบุคลากร'
  );
  Logger.log('App:', appResult);
  
  // ⚠️ สำคัญ: เก็บ App Key ไว้ให้ดี!
  const APP_KEY = appResult.data.app_key;
  Logger.log('=== SAVE THIS APP KEY ===');
  Logger.log(APP_KEY);
}
```

### ตรวจสอบว่าติดตั้งสำเร็จ

```javascript
function checkInstallation() {
  const result = checkSetup();
  
  Logger.log('=== System Status ===');
  Logger.log('Admins:', result.data.admins);
  Logger.log('Applications:', result.data.applications);
  Logger.log('Issues:', result.data.issues.length);
  
  if (result.success) {
    Logger.log('✅ Ready to use!');
  } else {
    Logger.log('❌ Setup incomplete');
    result.data.issues.forEach(issue => Logger.log('  -', issue));
  }
}
```

---

## 2. Authentication

### Admin Login

```javascript
function exampleAdminLogin() {
  // ขอ token สำหรับ admin
  const tokenResult = request_token({
    username: 'admin',
    password: 'admin123456'
  }, 'admin');
  
  if (!tokenResult.success) {
    Logger.log('Login failed:', tokenResult.message);
    return;
  }
  
  Logger.log('✅ Login successful');
  Logger.log('Token:', tokenResult.token);
  Logger.log('Expires:', tokenResult.expiresAt);
  
  return tokenResult.token;
}
```

### User Login

```javascript
function exampleUserLogin() {
  // ขอ token สำหรับ user
  const tokenResult = request_token({
    id13: '1234567890123',    // เลขบัตรประชาชน 13 หลัก
    password: 'user123456'
  }, 'user');
  
  if (!tokenResult.success) {
    Logger.log('Login failed:', tokenResult.message);
    return;
  }
  
  Logger.log('✅ User login successful');
  Logger.log('Token:', tokenResult.token);
  
  return tokenResult.token;
}
```

### การเชื่อมต่อ

```javascript
function exampleConnect() {
  const APP_KEY = 'app_abc123...'; // ใส่ app key ของคุณ
  
  // 1. Login
  const token = exampleAdminLogin();
  
  // 2. Connect
  const conn = connect(APP_KEY, token);
  
  if (conn.success === false) {
    Logger.log('Connection failed:', conn.message);
    return;
  }
  
  // 3. ดูข้อมูล session
  const info = conn.info();
  Logger.log('Connected as:', info.data.user_type);
  Logger.log('Organization:', info.data.org_id);
  
  return conn;
}
```

---

## 3. Admin - Full Access

### สร้างข้อมูลครบชุด

```javascript
function exampleAdminFullCRUD() {
  Logger.log('=== Admin Full CRUD Example ===');
  
  const APP_KEY = 'YOUR_APP_KEY';
  const token = exampleAdminLogin();
  const conn = connect(APP_KEY, token);
  
  // 1. สร้าง Organization
  Logger.log('\n1. Creating organization...');
  const org = conn.create('organizations', {
    org_name: 'กรมสมเด็จพระเจ้าตากสินมหาราช',
    hrms_id: 'E6900000',
    dmz_id: 'DMZ001',
    subdistrict: 'คลองตัน',
    district: 'คลองเตย',
    province: 'กรุงเทพมหานคร'
  });
  Logger.log('Organization:', org.data.uuid);
  
  // 2. สร้าง Position
  Logger.log('\n2. Creating position...');
  const position = conn.create('positions', {
    name: 'นักวิชาการคอมพิวเตอร์',
    description: 'ตำแหน่งนักวิชาการคอมพิวเตอร์',
    level: 5
  });
  Logger.log('Position:', position.data.uuid);
  
  // 3. สร้าง Rank
  Logger.log('\n3. Creating rank...');
  const rank = conn.create('ranks', {
    name: 'ชำนาญการ',
    abbreviation: 'ชก.',
    level: 7
  });
  Logger.log('Rank:', rank.data.uuid);
  
  // 4. สร้าง User
  Logger.log('\n4. Creating user...');
  const user = conn.create('users', {
    name: 'สมชาย ใจดี',
    id13: '1234567890123',
    password: 'user123456',
    position_id: position.data.uuid,
    rank_id: rank.data.uuid,
    org_id: org.data.uuid
  });
  Logger.log('User:', user.data.uuid);
  
  // 5. อ่านข้อมูลทั้งหมด
  Logger.log('\n5. Reading all data...');
  const allOrgs = conn.read('organizations');
  Logger.log('Total organizations:', allOrgs.data.length);
  
  const allUsers = conn.read('users');
  Logger.log('Total users:', allUsers.data.length);
  
  // 6. อัปเดตข้อมูล
  Logger.log('\n6. Updating user...');
  const updated = conn.update('users', user.data.uuid, {
    name: 'สมชาย ใจดี (แก้ไข)'
  });
  Logger.log('Updated:', updated.success);
  
  // 7. ลบข้อมูล (Soft Delete)
  Logger.log('\n7. Deleting user...');
  const deleted = conn.delete('users', user.data.uuid);
  Logger.log('Deleted:', deleted.success);
  
  // 8. ตรวจสอบว่าลบแล้ว (active = false)
  const activeUsers = conn.read('users', { active: true });
  Logger.log('Active users:', activeUsers.data.length);
  
  Logger.log('\n=== Example Complete ===');
}
```

### อ่านข้อมูลด้วยเงื่อนไข

```javascript
function exampleFiltering() {
  const APP_KEY = 'YOUR_APP_KEY';
  const token = exampleAdminLogin();
  const conn = connect(APP_KEY, token);
  
  // ค้นหาองค์กรในกรุงเทพ
  const bkkOrgs = conn.read('organizations', {
    province: 'กรุงเทพมหานคร',
    active: true
  });
  
  Logger.log('Organizations in Bangkok:', bkkOrgs.data.length);
  
  bkkOrgs.data.forEach(org => {
    Logger.log('-', org.org_name, '(', org.district, ')');
  });
}
```

---

## 4. User - Limited Access

### User สามารถอ่านได้เฉพาะองค์กรตัวเอง

```javascript
function exampleUserAccess() {
  Logger.log('=== User Access Example ===');
  
  const APP_KEY = 'YOUR_APP_KEY';
  
  // 1. User Login
  const userToken = request_token({
    id13: '1234567890123',
    password: 'user123456'
  }, 'user');
  
  const conn = connect(APP_KEY, userToken.token);
  
  // 2. User พยายามสร้างข้อมูล (ไม่ได้)
  Logger.log('\n1. Trying to create organization...');
  const createResult = conn.create('organizations', {
    org_name: 'Test Org',
    province: 'Bangkok'
  });
  Logger.log('Result:', createResult.message); // Permission denied
  
  // 3. User อ่านข้อมูล (ได้เฉพาะองค์กรตัวเอง)
  Logger.log('\n2. Reading organizations...');
  const orgs = conn.read('organizations');
  Logger.log('Can see', orgs.data.length, 'organization(s)');
  
  // 4. User อ่าน positions (ได้ทั้งหมด)
  Logger.log('\n3. Reading positions...');
  const positions = conn.read('positions');
  Logger.log('Can see', positions.data.length, 'position(s)');
  
  // 5. User พยายามอ่าน admins (ไม่ได้)
  Logger.log('\n4. Trying to read admins...');
  const admins = conn.read('admins');
  Logger.log('Result:', admins.message); // Permission denied
  
  Logger.log('\n=== Example Complete ===');
}
```

---

## 5. Batch Operations

### สร้างข้อมูลหลายรายการ

```javascript
function exampleBatchCreate() {
  const APP_KEY = 'YOUR_APP_KEY';
  const token = exampleAdminLogin();
  const conn = connect(APP_KEY, token);
  
  // สร้าง positions หลายตัว
  const positions = [
    { name: 'นักวิเคราะห์นโยบายและแผน', level: 7 },
    { name: 'นักทรัพยากรบุคคล', level: 6 },
    { name: 'นักวิชาการเงินและบัญชี', level: 5 },
    { name: 'เจ้าหน้าที่บริหารงานทั่วไป', level: 3 }
  ];
  
  const results = {
    success: 0,
    failed: 0,
    created: []
  };
  
  positions.forEach(pos => {
    const result = conn.create('positions', pos);
    
    if (result.success) {
      results.success++;
      results.created.push(result.data.uuid);
      Logger.log('✅ Created:', pos.name);
    } else {
      results.failed++;
      Logger.log('❌ Failed:', pos.name, '-', result.message);
    }
  });
  
  Logger.log('\n=== Summary ===');
  Logger.log('Success:', results.success);
  Logger.log('Failed:', results.failed);
  Logger.log('Total:', positions.length);
  
  return results;
}
```

### อัปเดตหลายรายการ

```javascript
function exampleBatchUpdate() {
  const APP_KEY = 'YOUR_APP_KEY';
  const token = exampleAdminLogin();
  const conn = connect(APP_KEY, token);
  
  // อ่าน positions ทั้งหมด
  const allPositions = conn.read('positions');
  
  let updated = 0;
  
  // อัปเดต description ให้ทุก position
  allPositions.data.forEach(pos => {
    const result = conn.update('positions', pos.uuid, {
      description: 'ตำแหน่ง' + pos.name + ' (อัปเดตโดยระบบ)'
    });
    
    if (result.success) {
      updated++;
    }
  });
  
  Logger.log('Updated', updated, '/', allPositions.data.length, 'positions');
}
```

---

## 6. Error Handling

### จัดการ Error อย่างถูกต้อง

```javascript
function exampleErrorHandling() {
  const APP_KEY = 'YOUR_APP_KEY';
  const token = exampleAdminLogin();
  
  // 1. ตรวจสอบ connection
  const conn = connect(APP_KEY, token);
  
  if (conn.success === false) {
    Logger.log('❌ Connection failed:', conn.message);
    return;
  }
  
  // 2. สร้างข้อมูล + จัดการ error
  const result = conn.create('users', {
    name: 'Test User',
    id13: 'invalid-id',  // ID13 ไม่ถูกต้อง
    password: '123'       // รหัสผ่านสั้นเกินไป
  });
  
  if (!result.success) {
    Logger.log('❌ Create failed:', result.message);
    
    // แสดง error แบบละเอียด
    if (result.message.includes('ID13')) {
      Logger.log('  → ID13 format is invalid');
    }
    if (result.message.includes('password')) {
      Logger.log('  → Password is too short');
    }
  }
  
  // 3. อ่านข้อมูลที่ไม่มี
  const notFound = conn.read('users', { uuid: 'not-exist' });
  
  if (notFound.data.length === 0) {
    Logger.log('No data found with the specified filters');
  }
}
```

### Retry Logic

```javascript
function exampleRetry() {
  const APP_KEY = 'YOUR_APP_KEY';
  const maxRetries = 3;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const token = request_token({
        username: 'admin',
        password: 'admin123456'
      }, 'admin');
      
      if (token.success) {
        Logger.log('✅ Login successful on attempt', i + 1);
        return token;
      }
      
    } catch (error) {
      Logger.log('❌ Attempt', i + 1, 'failed:', error.message);
      
      if (i === maxRetries - 1) {
        Logger.log('Max retries reached');
        throw error;
      }
      
      Utilities.sleep(1000); // รอ 1 วินาที
    }
  }
}
```

---

## 7. Maintenance

### ฟังก์ชันบำรุงรักษา (รันทุกวัน)

```javascript
function dailyMaintenanceJob() {
  Logger.log('=== Starting Daily Maintenance ===');
  Logger.log('Time:', new Date());
  
  const result = dailyMaintenance();
  
  if (result.success) {
    Logger.log('✅ Maintenance completed');
    Logger.log('Tokens cleaned:', result.data.tokens_cleaned);
    Logger.log('Logs cleaned:', result.data.logs_cleaned);
  } else {
    Logger.log('❌ Maintenance failed:', result.message);
  }
  
  Logger.log('=== Maintenance Complete ===');
}
```

### ตั้งค่า Trigger อัตโนมัติ

```javascript
function setupDailyTrigger() {
  // ลบ trigger เก่า (ถ้ามี)
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'dailyMaintenanceJob') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // สร้าง trigger ใหม่ (รันทุกวันเวลา 02:00)
  ScriptApp.newTrigger('dailyMaintenanceJob')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
  
  Logger.log('✅ Daily trigger created');
}
```

### ดูสถิติ

```javascript
function viewSystemStats() {
  const stats = getStatistics();
  
  Logger.log('=== System Statistics ===');
  Logger.log('\nUsers:');
  Logger.log('  Total:', stats.data.users.total);
  Logger.log('  Active:', stats.data.users.active);
  Logger.log('  Inactive:', stats.data.users.inactive);
  
  Logger.log('\nOrganizations:');
  Logger.log('  Total:', stats.data.organizations.total);
  Logger.log('  Active:', stats.data.organizations.active);
  
  Logger.log('\nTokens:');
  Logger.log('  Total:', stats.data.tokens.total);
  Logger.log('  Active:', stats.data.tokens.active);
  Logger.log('  Expired:', stats.data.tokens.expired);
  Logger.log('  Revoked:', stats.data.tokens.revoked);
  
  Logger.log('\nLogs:');
  Logger.log('  Total:', stats.data.logs.total);
  Logger.log('  Today:', stats.data.logs.today);
}
```

---

## 🎯 Quick Test

### ทดสอบระบบทั้งหมดในฟังก์ชันเดียว

```javascript
function quickTest() {
  Logger.log('=== DTP NST Library - Quick Test ===\n');
  
  // Config
  const APP_KEY = 'YOUR_APP_KEY'; // ⚠️ เปลี่ยนเป็น app key จริง
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123456';
  
  // 1. Check setup
  Logger.log('1. Checking setup...');
  const setup = checkSetup();
  if (!setup.success) {
    Logger.log('❌ Setup incomplete. Run setupLibrary() first.');
    return;
  }
  Logger.log('✅ Setup OK');
  
  // 2. Admin login
  Logger.log('\n2. Admin login...');
  const adminToken = request_token({
    username: ADMIN_USER,
    password: ADMIN_PASS
  }, 'admin');
  if (!adminToken.success) {
    Logger.log('❌ Login failed:', adminToken.message);
    return;
  }
  Logger.log('✅ Login OK');
  
  // 3. Connect
  Logger.log('\n3. Connecting...');
  const conn = connect(APP_KEY, adminToken.token);
  if (conn.success === false) {
    Logger.log('❌ Connection failed:', conn.message);
    return;
  }
  Logger.log('✅ Connected');
  
  // 4. Create test data
  Logger.log('\n4. Creating test organization...');
  const org = conn.create('organizations', {
    org_name: 'Test Organization ' + new Date().getTime(),
    province: 'Test Province'
  });
  if (!org.success) {
    Logger.log('❌ Create failed:', org.message);
    return;
  }
  Logger.log('✅ Created:', org.data.uuid);
  
  // 5. Read data
  Logger.log('\n5. Reading organizations...');
  const orgs = conn.read('organizations', { active: true });
  Logger.log('✅ Found', orgs.data.length, 'organizations');
  
  // 6. Update data
  Logger.log('\n6. Updating organization...');
  const updated = conn.update('organizations', org.data.uuid, {
    org_name: org.data.org_name + ' (Updated)'
  });
  Logger.log('✅ Updated:', updated.success);
  
  // 7. Delete data
  Logger.log('\n7. Deleting organization...');
  const deleted = conn.delete('organizations', org.data.uuid);
  Logger.log('✅ Deleted:', deleted.success);
  
  // 8. Summary
  Logger.log('\n=== Test Complete ===');
  Logger.log('✅ All operations successful!');
  Logger.log('Library is working correctly.');
}
```

---

## 📝 หมายเหตุ

- Token หมดอายุใน **24 ชั่วโมง**
- Password ต้อง **อย่างน้อย 6 ตัวอักษร**
- ID13 ต้อง **13 หลักและผ่าน checksum**
- Soft Delete: ข้อมูลไม่ถูกลบจริง แต่ตั้ง `active = false`
- Admin มีสิทธิ์ **CRUD ทั้งหมด**
- User อ่านได้ **เฉพาะองค์กรตัวเอง**

---

---

## 8. Config Management

### ดู Config ทั้งหมด

```javascript
function exampleViewConfig() {
  const result = viewAllConfig();
  
  if (result.success) {
    Logger.log('=== All Configuration ===');
    
    // แสดงแบบ list
    result.data.list.forEach(function(config) {
      Logger.log(config.key + ':', config.value);
      Logger.log('  Description:', config.description);
      Logger.log('  Updated:', config.updated_at);
      Logger.log('');
    });
    
    // หรือแสดงแบบ object (ง่ายกว่า)
    Logger.log('\n=== As Object ===');
    Logger.log(result.data.object);
  }
}
```

### อ่าน Config เดียว

```javascript
function exampleGetConfig() {
  // อ่าน config เดียว
  const tokenHours = Helpers.getConfig('token_expiry_hours');
  Logger.log('Token expires in:', tokenHours, 'hours');
  
  // อ่านพร้อม default value
  const maxAttempts = Helpers.getConfig('max_login_attempts', '3');
  Logger.log('Max login attempts:', maxAttempts);
  
  // ใช้งานจริง
  const logRetention = parseInt(Helpers.getConfig('log_retention_days', '90'));
  Logger.log('Keep logs for', logRetention, 'days');
}
```

### แก้ไข Config

```javascript
function exampleUpdateConfig() {
  // เปลี่ยน token expiry เป็น 48 ชม.
  const result1 = updateConfig(
    'token_expiry_hours',
    '48',
    'เพิ่มเวลาหมดอายุเป็น 48 ชั่วโมง'
  );
  Logger.log('Update result:', result1.message);
  
  // เปลี่ยนชื่อระบบ
  const result2 = updateConfig(
    'system_name',
    'DTP NST Library v2.0',
    'อัปเดตชื่อระบบ'
  );
  Logger.log('Update result:', result2.message);
}
```

### เพิ่ม Config ใหม่

```javascript
function exampleAddConfig() {
  // เพิ่ม config ใหม่
  const configs = [
    {
      key: 'max_login_attempts',
      value: '5',
      description: 'จำนวนครั้งที่พยายาม login สูงสุดก่อนล็อคบัญชี'
    },
    {
      key: 'session_timeout_minutes',
      value: '30',
      description: 'เวลา timeout ของ session (นาที)'
    },
    {
      key: 'enable_email_notification',
      value: 'true',
      description: 'เปิด/ปิด การแจ้งเตือนทางอีเมล'
    },
    {
      key: 'admin_email',
      value: 'admin@example.com',
      description: 'อีเมลของผู้ดูแลระบบ'
    }
  ];
  
  configs.forEach(function(config) {
    const result = addConfig(config.key, config.value, config.description);
    
    if (result.success) {
      Logger.log('✅ Added:', config.key);
    } else {
      Logger.log('❌ Failed:', config.key, '-', result.message);
    }
  });
}
```

### ลบ Config

```javascript
function exampleRemoveConfig() {
  const result = removeConfig('old_config_key');
  
  if (result.success) {
    Logger.log('✅ Config removed');
  } else {
    Logger.log('❌ Failed:', result.message);
  }
}
```

### ใช้ Config ในการทำงาน

```javascript
function exampleUseConfig() {
  // 1. ใช้ config กำหนด token expiry
  function createCustomToken(user, userType) {
    const hours = parseInt(Helpers.getConfig('token_expiry_hours', '24'));
    const token = Helpers.generateToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + hours);
    
    return {
      token: token,
      expiresAt: expires.toISOString(),
      expiryHours: hours
    };
  }
  
  // 2. ใช้ config กำหนด password policy
  function validatePasswordWithConfig(password) {
    const minLength = parseInt(Helpers.getConfig('password_min_length', '6'));
    
    if (password.length < minLength) {
      return {
        valid: false,
        message: 'Password must be at least ' + minLength + ' characters'
      };
    }
    
    return { valid: true };
  }
  
  // 3. ใช้ config ควบคุม features
  function sendNotificationIfEnabled(message) {
    const enabled = Helpers.getConfig('enable_email_notification', 'false');
    
    if (enabled === 'true') {
      const adminEmail = Helpers.getConfig('admin_email', '');
      if (adminEmail) {
        // MailApp.sendEmail(adminEmail, 'Notification', message);
        Logger.log('📧 Email sent to:', adminEmail);
      }
    } else {
      Logger.log('📧 Email notification is disabled');
    }
  }
  
  // ทดสอบ
  const tokenInfo = createCustomToken({}, 'admin');
  Logger.log('Token expires in:', tokenInfo.expiryHours, 'hours');
  
  const passwordCheck = validatePasswordWithConfig('12345');
  Logger.log('Password valid:', passwordCheck.valid);
  
  sendNotificationIfEnabled('Test notification');
}
```

### Export/Import Config

```javascript
function exampleExportConfig() {
  // Export config เป็น JSON
  const result = viewAllConfig();
  
  if (result.success) {
    const configJson = JSON.stringify(result.data.object, null, 2);
    Logger.log('=== Config Export ===');
    Logger.log(configJson);
    
    // เก็บใน Properties (ถ้าต้องการ backup)
    PropertiesService.getScriptProperties().setProperty(
      'config_backup',
      configJson
    );
    
    Logger.log('✅ Config backed up to Script Properties');
  }
}

function exampleImportConfig() {
  // Import config จาก JSON
  const configJson = PropertiesService.getScriptProperties().getProperty('config_backup');
  
  if (configJson) {
    const configs = JSON.parse(configJson);
    
    Object.keys(configs).forEach(function(key) {
      addConfig(key, configs[key], 'Imported from backup');
    });
    
    Logger.log('✅ Config restored from backup');
  } else {
    Logger.log('❌ No backup found');
  }
}
```

### Reset Config to Default

```javascript
function resetConfigToDefault() {
  Logger.log('=== Resetting Config to Default ===');
  
  // ลบ config ทั้งหมด
  const allConfig = viewAllConfig();
  allConfig.data.list.forEach(function(config) {
    removeConfig(config.key);
  });
  
  Logger.log('✅ All config removed');
  
  // สร้าง default config ใหม่
  initializeDefaultConfig();
  
  Logger.log('✅ Default config recreated');
}
```

---

**Happy Coding! 🚀**
