# DTP NST GAS Library - Setup Checklist

## ✅ Pre-Setup Checklist

- [ ] Google Account with access to Google Sheets
- [ ] Google Drive storage space
- [ ] Basic understanding of Google Apps Script
- [ ] Text editor for copying code

---

## 📋 Setup Steps

### Phase 1: Create Foundation (15 minutes)

- [ ] **Step 1.1:** Create new Google Spreadsheet
  - [ ] Name it: "DTP NST Database"
  - [ ] Copy Spreadsheet ID from URL
  - [ ] Note: `_______________________________________`

- [ ] **Step 1.2:** Open Apps Script Editor
  - [ ] From Spreadsheet: Extensions > Apps Script
  - [ ] Note Project URL: `_______________________________________`

- [ ] **Step 1.3:** Prepare Files
  - [ ] Delete default `Code.gs` content
  - [ ] Create file: `Auth` (without .gs)
  - [ ] Create file: `Authorization`
  - [ ] Create file: `CRUD`
  - [ ] Create file: `Utils`
  - [ ] Create file: `Admin`

### Phase 2: Copy Code (10 minutes)

- [ ] **Step 2.1:** Copy code to files
  - [ ] `Code.gs` ← Copy from Code.gs
  - [ ] `Auth.gs` ← Copy from Auth.gs
  - [ ] `Authorization.gs` ← Copy from Authorization.gs
  - [ ] `CRUD.gs` ← Copy from CRUD.gs
  - [ ] `Utils.gs` ← Copy from Utils.gs
  - [ ] `Admin.gs` ← Copy from Admin.gs

- [ ] **Step 2.2:** Configure manifest
  - [ ] Enable manifest: Project Settings > Show appsscript.json
  - [ ] Copy content from `appsscript.json`
  - [ ] Save all files

### Phase 3: Initialize Database (10 minutes)

- [ ] **Step 3.1:** Run setupLibrary
  ```javascript
  function runSetup() {
    const spreadsheetId = 'YOUR_SPREADSHEET_ID';
    const result = setupLibrary(spreadsheetId);
    Logger.log(result);
  }
  ```
  - [ ] Replace `YOUR_SPREADSHEET_ID` with actual ID
  - [ ] Select function: `runSetup`
  - [ ] Click Run
  - [ ] Grant permissions when prompted
  - [ ] Verify: All sheets created ✅

- [ ] **Step 3.2:** Create Admin User
  ```javascript
  function runCreateAdmin() {
    const result = createInitialAdmin('admin', 'YourSecurePassword123', 'Administrator');
    Logger.log(result);
  }
  ```
  - [ ] Update password to your secure password
  - [ ] Select function: `runCreateAdmin`
  - [ ] Click Run
  - [ ] Note Admin credentials:
    - Username: `admin`
    - Password: `_______________________________________`

- [ ] **Step 3.3:** Register Application
  ```javascript
  function runRegisterApp() {
    const result = registerApplication('My App', 'Description', '');
    Logger.log(result);
  }
  ```
  - [ ] Update app name and description
  - [ ] Select function: `runRegisterApp`
  - [ ] Click Run
  - [ ] **IMPORTANT:** Copy app_key from log
  - [ ] Note App Key: `_______________________________________`

- [ ] **Step 3.4:** Test Setup
  ```javascript
  function runTest() {
    const result = testLibrarySetup();
    Logger.log(result);
  }
  ```
  - [ ] Select function: `runTest`
  - [ ] Click Run
  - [ ] Verify: All tests PASS ✅

### Phase 4: Deploy as Library (5 minutes)

- [ ] **Step 4.1:** Deploy
  - [ ] Click: Deploy > New deployment
  - [ ] Select type: Library
  - [ ] Description: `DTP NST GAS Library v1.0`
  - [ ] Access: Anyone (or as needed)
  - [ ] Click: Deploy

- [ ] **Step 4.2:** Note Deployment Info
  - [ ] Script ID: `_______________________________________`
  - [ ] Deployment ID: `_______________________________________`
  - [ ] Library URL: `_______________________________________`

### Phase 5: Setup Maintenance (Optional, 5 minutes)

- [ ] **Step 5.1:** Create Daily Trigger
  - [ ] Click: Triggers (⏰ icon)
  - [ ] Click: Add Trigger
  - [ ] Function: `dailyMaintenance`
  - [ ] Event source: Time-driven
  - [ ] Type: Day timer
  - [ ] Time: 2am to 3am
  - [ ] Click: Save

- [ ] **Step 5.2:** Verify Trigger
  - [ ] Check trigger appears in list
  - [ ] Status: Active ✅

---

## 🧪 Testing Checklist

### Test 1: Library Connection

- [ ] Create new Apps Script project (for testing)
- [ ] Add library with Script ID
- [ ] Identifier: `DTPNSTLib`
- [ ] Version: Select latest
- [ ] Save

### Test 2: Authentication

```javascript
function testAuth() {
  const result = DTPNSTLib.request_token({
    username: 'admin',
    password: 'YourPassword'
  }, 'admin');
  Logger.log(result);
}
```

- [ ] Replace password with your admin password
- [ ] Run `testAuth`
- [ ] Verify: `success: true` ✅
- [ ] Copy token for next test

### Test 3: Connection

```javascript
function testConnection() {
  const conn = DTPNSTLib.connect('YOUR_APP_KEY', 'YOUR_TOKEN');
  Logger.log(conn.info());
}
```

- [ ] Replace APP_KEY and TOKEN
- [ ] Run `testConnection`
- [ ] Verify: Connection successful ✅

### Test 4: CRUD Operations

```javascript
function testCRUD() {
  // Get connection
  const tokenResult = DTPNSTLib.request_token({
    username: 'admin',
    password: 'YourPassword'
  }, 'admin');
  
  const conn = DTPNSTLib.connect('YOUR_APP_KEY', tokenResult.token);
  
  // Test create
  const result = conn.create('positions', {
    name: 'Test Position',
    level: 5
  });
  
  Logger.log('Create:', result);
  
  // Test read
  const positions = conn.read('positions', {});
  Logger.log('Read:', positions);
}
```

- [ ] Update credentials
- [ ] Run `testCRUD`
- [ ] Verify: Create success ✅
- [ ] Verify: Read success ✅

---

## 📝 Important Information to Save

### Spreadsheet Information
- **Spreadsheet ID:** `_______________________________________`
- **Spreadsheet URL:** `_______________________________________`

### Admin Credentials
- **Username:** `admin`
- **Password:** `_______________________________________`
- **⚠️ Store securely - Never commit to Git**

### Application Information
- **App Name:** `_______________________________________`
- **App Key:** `_______________________________________`
- **⚠️ Store securely - Never share publicly**

### Library Information
- **Script ID:** `_______________________________________`
- **Library Identifier:** `DTPNSTLib`
- **Version:** `1.0.0`

### Deployment Information
- **Deployment ID:** `_______________________________________`
- **Deployed Date:** `_______________________________________`

---

## 🎯 Post-Setup Tasks

### Immediate Tasks (Do Now)
- [ ] Store credentials in password manager
- [ ] Share Script ID with developers who need access
- [ ] Test all CRUD operations
- [ ] Create sample data for testing

### Short-term Tasks (This Week)
- [ ] Add more admin users if needed
- [ ] Register all applications that will use library
- [ ] Set up monitoring for logs
- [ ] Create backup of spreadsheet

### Ongoing Tasks (Regular)
- [ ] Review logs weekly
- [ ] Update admin passwords monthly
- [ ] Rotate app keys quarterly
- [ ] Update library documentation as needed

---

## 🐛 Troubleshooting

### Common Issues During Setup

**Issue:** Can't save Apps Script file
- **Solution:** Check internet connection, try refreshing browser

**Issue:** Authorization error when running setup
- **Solution:** Click "Review permissions" and authorize the script

**Issue:** setupLibrary fails
- **Solution:** Verify Spreadsheet ID is correct, check permissions

**Issue:** All sheets not created
- **Solution:** Run setupLibrary again, check execution log for errors

**Issue:** Can't create admin
- **Solution:** Verify setupLibrary ran successfully first

**Issue:** Test setup shows failures
- **Solution:** Check which test failed, re-run that specific setup step

---

## 📚 Next Steps

After completing this checklist:

1. **Read Documentation**
   - [ ] Read README.md for full documentation
   - [ ] Read SETUP_TH.md for Thai guide
   - [ ] Review SCHEMA.md for database structure

2. **Try Examples**
   - [ ] Review Example.gs file
   - [ ] Run example functions
   - [ ] Modify for your use case

3. **Develop Your Application**
   - [ ] Add library to your project
   - [ ] Implement authentication
   - [ ] Start using CRUD operations

4. **Share with Team**
   - [ ] Share documentation
   - [ ] Share Script ID
   - [ ] Provide app keys
   - [ ] Train team members

---

## ✅ Setup Complete!

Congratulations! Your DTP NST GAS Library is now ready to use.

**What you've accomplished:**
✅ Database structure created
✅ Authentication system configured
✅ Admin user created
✅ Application registered
✅ Library deployed
✅ Maintenance scheduled

**You can now:**
- Create users and organizations
- Implement authentication in your apps
- Perform CRUD operations securely
- Track all operations with audit logs

**Remember to:**
- Keep credentials secure
- Regular backups
- Monitor logs
- Update documentation

---

**Date Completed:** ___________________  
**Completed By:** ___________________  
**Notes:** 
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```
