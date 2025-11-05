# DTP NST GAS Library

Google Apps Script Library สำหรับจัดการข้อมูล Account พร้อมระบบ Authentication และ Authorization

## 🌟 Features

- ✅ **Authentication**: ระบบ Token-based authentication
- ✅ **Authorization**: Role-based access control (Admin / User)
- ✅ **CRUD Operations**: สำหรับทุกตารางข้อมูล
- ✅ **Audit Logging**: บันทึกทุก operation
- ✅ **Security**: Password hashing, Token expiration, App key validation
- ✅ **Data Validation**: ตรวจสอบความถูกต้องของข้อมูล

## 📋 Database Schema

### Tables
1. **users** - ข้อมูลผู้ใช้งาน
2. **organizations** - ข้อมูลหน่วยงาน
3. **positions** - ข้อมูลตำแหน่ง
4. **ranks** - ข้อมูลยศ/ระดับ
5. **logs** - Audit log ของทุก operation
6. **admins** - ข้อมูล Admin
7. **applications** - ข้อมูลแอปพลิเคชันที่ใช้งาน Library
8. **tokens** - ข้อมูล Authentication tokens

รายละเอียดทั้งหมดดูได้ที่: [SCHEMA.md](./SCHEMA.md)

## 🚀 Setup Instructions

### 1. สร้าง Google Spreadsheet

```
1. สร้าง Google Spreadsheet ใหม่
2. คัดลอก Spreadsheet ID จาก URL
   URL รูปแบบ: https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit
```

### 2. สร้าง Apps Script Project

```
1. จาก Spreadsheet: Extensions > Apps Script
2. ลบโค้ดเริ่มต้นทั้งหมด
3. สร้างไฟล์ใหม่สำหรับแต่ละ module:
   - Code.gs (Main library)
   - Auth.gs (Authentication)
   - Authorization.gs (Authorization)
   - CRUD.gs (CRUD operations)
   - Utils.gs (Utilities)
   - Admin.gs (Admin functions)
4. คัดลอกโค้ดจาก repository นี้ไปยังไฟล์ที่สอดคล้องกัน
```

### 3. Configure Project Settings

```
1. Project Settings (⚙️) > Show "appsscript.json" manifest file in editor
2. แทนที่ด้วยเนื้อหาจาก appsscript.json ใน repository
```

### 4. Initialize Library

เปิด Apps Script Editor และรันคำสั่งต่อไปนี้:

```javascript
// 1. Setup library with your spreadsheet ID
function runSetup() {
  const spreadsheetId = 'YOUR_SPREADSHEET_ID_HERE';
  const result = setupLibrary(spreadsheetId);
  Logger.log(result);
}

// 2. Create initial admin user
function runCreateAdmin() {
  const result = createInitialAdmin('admin', 'admin123456', 'System Administrator');
  Logger.log(result);
}

// 3. Register your first application
function runRegisterApp() {
  const result = registerApplication('My First App', 'Test application', '');
  Logger.log(result);
  // บันทึก app_key ที่ได้ไว้ใช้งาน
}

// 4. Test the setup
function runTest() {
  const result = testLibrarySetup();
  Logger.log(result);
}
```

### 5. Deploy as Library

```
1. Deploy > New deployment
2. Type: Library
3. Description: DTP NST GAS Library v1.0
4. Access: Anyone with the link (หรือตามต้องการ)
5. Click Deploy
6. คัดลอก Script ID ที่ได้
```

### 6. Setup Scheduled Maintenance (Optional)

```
1. Triggers (⏰) > Add Trigger
2. Function: dailyMaintenance
3. Event source: Time-driven
4. Type: Day timer
5. Time: เลือกเวลาที่ต้องการ (แนะนำ 2-3 AM)
6. Save
```

## 📚 Usage Guide

### สำหรับ Applications ที่ต้องการใช้งาน Library

#### 1. เพิ่ม Library ไปยัง Project

```
1. เปิด Apps Script Project ของคุณ
2. Libraries (+) > Add a library
3. Script ID: [YOUR_LIBRARY_SCRIPT_ID]
4. Identifier: DTPNSTLib (หรือชื่ออื่นที่ต้องการ)
5. Version: เลือก version ล่าสุด
6. Add
```

#### 2. Request Token

```javascript
// For Admin
function getAdminToken() {
  const credentials = {
    username: 'admin',
    password: 'admin123456'
  };
  
  const result = DTPNSTLib.request_token(credentials, 'admin');
  
  if (result.success) {
    Logger.log('Token: ' + result.token);
    Logger.log('Expires at: ' + result.expiresAt);
    return result.token;
  } else {
    Logger.log('Error: ' + result.message);
  }
}

// For User
function getUserToken() {
  const credentials = {
    id13: '1234567890123',
    password: 'userpassword'
  };
  
  const result = DTPNSTLib.request_token(credentials, 'user');
  
  if (result.success) {
    Logger.log('Token: ' + result.token);
    return result.token;
  } else {
    Logger.log('Error: ' + result.message);
  }
}
```

#### 3. Connect to Library

```javascript
function connectAndUseCRUD() {
  const appKey = 'YOUR_APP_KEY_HERE';
  const token = 'YOUR_TOKEN_HERE';
  
  // Connect
  const conn = DTPNSTLib.connect(appKey, token);
  
  if (!conn.success) {
    Logger.log('Connection failed: ' + conn.message);
    return;
  }
  
  // ตอนนี้คุณสามารถใช้ CRUD operations ได้
  
  // CREATE
  const createResult = conn.create('users', {
    name: 'John Doe',
    id13: '1234567890123',
    password: 'securepassword',
    position_id: 'position-uuid-here',
    rank_id: 'rank-uuid-here',
    org_id: 'org-uuid-here'
  });
  Logger.log('Create result:', createResult);
  
  // READ
  const readResult = conn.read('users', { active: true });
  Logger.log('Read result:', readResult);
  
  // UPDATE
  const updateResult = conn.update('users', 'user-uuid-here', {
    name: 'John Doe Updated'
  });
  Logger.log('Update result:', updateResult);
  
  // DELETE (soft delete)
  const deleteResult = conn.delete('users', 'user-uuid-here');
  Logger.log('Delete result:', deleteResult);
  
  // Get connection info
  const info = conn.info();
  Logger.log('Connection info:', info);
  
  // Disconnect (revoke token)
  const disconnectResult = conn.disconnect();
  Logger.log('Disconnect result:', disconnectResult);
}
```

## 🔐 Access Control Rules

### Admin Role
- **users**: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
- **organizations**: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
- **positions**: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
- **ranks**: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
- **logs**: ✅ Read
- **admins**: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
- **applications**: ✅ Create, ✅ Read, ✅ Update, ✅ Delete
- **tokens**: ✅ Read, ✅ Delete

### User Role
- **users**: ✅ Read (เฉพาะ org ของตัวเอง)
- **organizations**: ✅ Read (เฉพาะ org ของตัวเอง)
- **positions**: ✅ Read (ทุก position)
- **ranks**: ✅ Read (ทุก rank)
- **Other tables**: ❌ No access

## 📖 API Reference

### Public Functions

#### `request_token(credentials, userType)`
Request authentication token

**Parameters:**
- `credentials` (Object): 
  - For admin: `{username: string, password: string}`
  - For user: `{id13: string, password: string}`
- `userType` (string): `'admin'` or `'user'`

**Returns:** `{success, token, expiresAt, userType, userId, message}`

#### `connect(appKey, token)`
Connect to library with app key and token

**Parameters:**
- `appKey` (string): Application key
- `token` (string): Authentication token

**Returns:** Connection object with methods:
- `create(tableName, data)`
- `read(tableName, filters)`
- `update(tableName, uuid, data)`
- `delete(tableName, uuid, hardDelete)`
- `info()`
- `disconnect()`

### Admin Functions

#### `setupLibrary(spreadsheetId)`
Initialize library with spreadsheet

#### `createInitialAdmin(username, password, name)`
Create first admin user

#### `registerApplication(appname, description, createdBy)`
Register new application, returns app_key

#### `dailyMaintenance()`
Clean up expired tokens and old logs

#### `getLibraryStats()`
Get library statistics

#### `testLibrarySetup()`
Test library configuration

## 🔒 Security Best Practices

1. **Password Security**
   - Passwords are hashed with SHA-256
   - Minimum 8 characters recommended
   - Never log or expose passwords

2. **Token Management**
   - Tokens expire after 24 hours
   - Store tokens securely
   - Revoke tokens when not needed
   - Clean up expired tokens regularly

3. **App Keys**
   - Keep app keys confidential
   - One key per application
   - Rotate keys periodically
   - Deactivate unused applications

4. **Data Validation**
   - ID13 checksum validation
   - Email format validation
   - Input sanitization
   - Required field validation

## 🐛 Troubleshooting

### "Spreadsheet not configured"
```javascript
// Run setup again with correct spreadsheet ID
setupLibrary('YOUR_SPREADSHEET_ID');
```

### "Invalid token"
```javascript
// Request new token
const result = DTPNSTLib.request_token(credentials, userType);
```

### "Access denied"
- ตรวจสอบว่าผู้ใช้มีสิทธิ์ในการทำ operation นั้นหรือไม่
- Admin มีสิทธิ์ทุกอย่าง
- User มีสิทธิ์อ่านเฉพาะข้อมูลใน org ของตัวเอง

### Logs not working
```javascript
// Check if logs sheet exists and has proper headers
testLibrarySetup();
```

## 📊 Monitoring

### View Logs
```javascript
function viewRecentLogs() {
  const conn = DTPNSTLib.connect(appKey, token);
  const logs = conn.read('logs', {});
  Logger.log(logs);
}
```

### Get Statistics
```javascript
function showStats() {
  const stats = getLibraryStats();
  Logger.log(stats);
}
```

## 🔄 Updates and Maintenance

### Regular Tasks
1. **Daily**: Run `dailyMaintenance()` to clean up expired tokens
2. **Weekly**: Review logs for suspicious activity
3. **Monthly**: Review and rotate app keys
4. **Quarterly**: Update user passwords

### Version Control
- Use version descriptions when deploying
- Test new versions before using in production
- Keep documentation updated

## 📝 Example Application

ดูตัวอย่างการใช้งานแบบเต็มรูปแบบใน [Example.gs](./Example.gs)

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Test your changes thoroughly
2. Update documentation
3. Follow existing code style
4. Add comments for complex logic

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

สำหรับคำถามหรือปัญหา:
1. ตรวจสอบ Troubleshooting section
2. ดู logs ใน Apps Script
3. ทดสอบด้วย `testLibrarySetup()`

## 🎯 Roadmap

- [ ] Rate limiting
- [ ] API versioning
- [ ] Batch operations
- [ ] Data export/import
- [ ] Advanced filtering
- [ ] Webhooks support
- [ ] Multi-language support

---

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Author:** DTP NST Team
