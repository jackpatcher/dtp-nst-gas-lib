# DTP NST GAS Library - Project Summary

## 📁 Project Structure

```
dtp-nst-gas-lib/
├── Code.gs              # Main library entry point with public API
├── Auth.gs              # Authentication and token management
├── Authorization.gs     # Role-based access control (RBAC)
├── CRUD.gs             # Create, Read, Update, Delete operations
├── Utils.gs            # Sheet manager, audit log, validators
├── Admin.gs            # Admin functions and setup utilities
├── appsscript.json     # Apps Script project configuration
├── Example.gs          # Complete usage examples
├── README.md           # Full documentation (English)
├── SETUP_TH.md         # Setup guide (Thai)
└── SCHEMA.md           # Database schema documentation
```

## 🎯 Key Features

### 1. **Authentication System**
- Token-based authentication
- Support for Admin and User roles
- Password hashing with SHA-256
- Token expiration (24 hours)
- Token revocation

### 2. **Authorization System**
- Role-based access control (RBAC)
- Admin: Full CRUD access to all tables
- User: Read-only access to own organization data
- Field-level protection

### 3. **CRUD Operations**
- Create records with validation
- Read with filtering
- Update with protection
- Soft delete and hard delete options
- Automatic timestamp management

### 4. **Security Features**
- Password hashing
- Token validation
- App key authentication
- Input sanitization
- Audit logging

### 5. **Data Validation**
- Required field validation
- Unique field validation
- ID13 checksum validation
- Email format validation
- Date format validation

### 6. **Audit Logging**
- All operations logged
- Track user, action, table, status
- Log cleanup functionality
- Searchable logs

## 📊 Database Tables

1. **users** - User accounts with credentials
2. **organizations** - Organization/department data
3. **positions** - Job positions
4. **ranks** - Ranks/levels
5. **logs** - Audit trail of all operations
6. **admins** - Administrator accounts
7. **applications** - Registered applications
8. **tokens** - Authentication tokens

## 🔌 Public API

### Main Functions

```javascript
// Request authentication token
DTPNSTLib.request_token(credentials, userType)

// Connect to library
DTPNSTLib.connect(appKey, token)
```

### Connection Methods

```javascript
conn.create(tableName, data)
conn.read(tableName, filters)
conn.update(tableName, uuid, data)
conn.delete(tableName, uuid, hardDelete)
conn.info()
conn.disconnect()
```

## 🚀 Quick Start

### For Library Setup

1. Create Google Spreadsheet
2. Create Apps Script project
3. Copy all .gs files
4. Run `setupLibrary(spreadsheetId)`
5. Run `createInitialAdmin(username, password, name)`
6. Run `registerApplication(appname, description, createdBy)`
7. Deploy as Library
8. Note the Script ID

### For Application Usage

1. Add library to your project
2. Request token
3. Connect with app_key and token
4. Use CRUD operations
5. Disconnect when done

## 🔐 Access Control Matrix

| Table | Admin Create | Admin Read | Admin Update | Admin Delete | User Create | User Read | User Update | User Delete |
|-------|--------------|------------|--------------|--------------|-------------|-----------|-------------|-------------|
| users | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (org) | ❌ | ❌ |
| organizations | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (own) | ❌ | ❌ |
| positions | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (all) | ❌ | ❌ |
| ranks | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ (all) | ❌ | ❌ |
| logs | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| admins | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| applications | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| tokens | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 💡 Usage Examples

### Example 1: Admin Creating User
```javascript
const tokenResult = DTPNSTLib.request_token({
  username: 'admin',
  password: 'password'
}, 'admin');

const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);

const user = conn.create('users', {
  name: 'John Doe',
  id13: '1234567890123',
  password: 'userpass',
  org_id: 'org-uuid'
});
```

### Example 2: User Reading Organization Data
```javascript
const tokenResult = DTPNSTLib.request_token({
  id13: '1234567890123',
  password: 'userpass'
}, 'user');

const conn = DTPNSTLib.connect(APP_KEY, tokenResult.token);

// Automatically filtered to user's org
const users = conn.read('users', {});
const org = conn.read('organizations', {});
```

### Example 3: Batch Operations
```javascript
const conn = DTPNSTLib.connect(APP_KEY, token);

const positions = [
  { name: 'Developer', level: 5 },
  { name: 'Manager', level: 7 },
  { name: 'Director', level: 9 }
];

positions.forEach(pos => {
  const result = conn.create('positions', pos);
  Logger.log(result);
});
```

## 🛠️ Admin Utilities

### Setup Functions
- `setupLibrary(spreadsheetId)` - Initialize database
- `createInitialAdmin(username, password, name)` - Create first admin
- `registerApplication(appname, description, createdBy)` - Register app
- `testLibrarySetup()` - Test configuration

### Maintenance Functions
- `dailyMaintenance()` - Clean expired tokens and old logs
- `getLibraryStats()` - Get usage statistics
- `TokenManager.cleanupExpiredTokens()` - Clean expired tokens
- `AuditLog.cleanOldLogs(daysToKeep)` - Clean old logs

## 📈 Best Practices

### Security
1. Store sensitive data in Script Properties
2. Use strong passwords (min 8 characters)
3. Rotate app keys regularly
4. Review logs periodically
5. Revoke unused tokens

### Performance
1. Use specific filters in read operations
2. Batch operations when possible
3. Clean up old logs and tokens
4. Index important fields

### Maintenance
1. Run daily maintenance
2. Backup spreadsheet regularly
3. Monitor error logs
4. Update documentation

## 🐛 Common Issues & Solutions

### "Spreadsheet not configured"
- **Solution:** Run `setupLibrary(spreadsheetId)` with correct ID

### "Invalid token"
- **Solution:** Request new token, tokens expire after 24 hours

### "Access denied"
- **Solution:** Check user role and permissions

### "Invalid app key"
- **Solution:** Verify app_key or register new application

### "Duplicate value for unique field"
- **Solution:** Check for existing records with same value

## 📚 Documentation Files

- **README.md** - Complete documentation in English
- **SETUP_TH.md** - Setup guide in Thai
- **SCHEMA.md** - Database schema details
- **Example.gs** - Working code examples

## 🔄 Future Enhancements

- Rate limiting per app/user
- API versioning
- Batch operations endpoint
- Data export/import utilities
- Advanced filtering (AND/OR logic)
- Webhook notifications
- Multi-language error messages
- Real-time sync capabilities

## 📝 Version History

### Version 1.0.0 (November 2025)
- Initial release
- Token-based authentication
- RBAC authorization
- Full CRUD operations
- Audit logging
- Data validation
- Admin utilities

## 👥 Credits

**Developed by:** DTP NST Team  
**License:** MIT  
**Contact:** See README.md

---

## 🎓 Learning Resources

### Understanding the Code

1. **Code.gs** - Start here to understand the public API
2. **Auth.gs** - Learn about authentication flow
3. **Authorization.gs** - Understand access control
4. **CRUD.gs** - See how data operations work
5. **Utils.gs** - Discover helper functions
6. **Example.gs** - See practical usage

### Key Concepts

- **Token-based Authentication:** Secure, stateless authentication
- **RBAC:** Role-based access control for fine-grained permissions
- **Soft Delete:** Mark records inactive instead of deleting
- **Audit Logging:** Track all operations for compliance
- **UUID:** Universal unique identifiers for records

## 📞 Support & Contribution

For issues, questions, or contributions:
1. Check documentation first
2. Run `testLibrarySetup()` for diagnostics
3. Review execution logs
4. Check audit logs in spreadsheet

---

**Thank you for using DTP NST GAS Library!**
