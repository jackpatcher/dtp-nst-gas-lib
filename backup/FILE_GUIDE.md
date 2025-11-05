# 🎯 DTP NST GAS Library - Complete File Guide

## 📂 File Organization

```
dtp-nst-gas-lib/
│
├── 📝 Core Library Files (Upload to Apps Script)
│   ├── Code.gs              - Main library & public API
│   ├── Auth.gs              - Authentication & token management
│   ├── Authorization.gs     - Role-based access control
│   ├── CRUD.gs             - Database operations
│   ├── Utils.gs            - Utilities & helpers
│   ├── Admin.gs            - Admin functions
│   └── appsscript.json     - Project configuration
│
├── 📖 Documentation Files
│   ├── README.md           - Full documentation (English)
│   ├── README_TH.md        - คู่มือภาษาไทย
│   ├── SETUP_TH.md         - Setup guide (Thai, detailed)
│   ├── SETUP_CHECKLIST.md  - Installation checklist
│   ├── SCHEMA.md           - Database schema
│   ├── ARCHITECTURE.md     - System architecture
│   └── PROJECT_SUMMARY.md  - Project overview
│
├── 💡 Example & Reference
│   └── Example.gs          - Usage examples
│
└── ⚙️ Configuration
    ├── .gitignore          - Git ignore rules
    └── FILE_GUIDE.md       - This file
```

---

## 🎬 Quick Start Guide

### For First-Time Setup

**Follow this order:**

1. **Read First** → `README_TH.md` (ภาษาไทย) or `README.md` (English)
2. **Setup Guide** → `SETUP_TH.md` (step-by-step in Thai)
3. **Use Checklist** → `SETUP_CHECKLIST.md` (tick as you go)
4. **Copy Files** → Upload all `.gs` files to Apps Script
5. **Run Setup** → Follow instructions in setup guide
6. **Test** → Run examples from `Example.gs`

### For Developers Using the Library

1. **Quick Reference** → `README.md` or `README_TH.md`
2. **Code Examples** → `Example.gs`
3. **API Reference** → `README.md` (API Reference section)
4. **Database Schema** → `SCHEMA.md`

### For System Architects

1. **Architecture** → `ARCHITECTURE.md`
2. **Schema Details** → `SCHEMA.md`
3. **Project Summary** → `PROJECT_SUMMARY.md`

---

## 📋 File Descriptions

### Core Library Files (Apps Script)

#### `Code.gs` - Main Entry Point
**Purpose:** Public API and connection management
**Key Functions:**
- `request_token()` - Get authentication token
- `connect()` - Establish connection
- `Connection` class - Provides CRUD methods

**When to read:** 
- Understanding the public API
- Learning how to use the library

---

#### `Auth.gs` - Authentication System
**Purpose:** User authentication and token management
**Key Components:**
- `Auth.authenticate()` - Verify credentials
- `Auth.generateToken()` - Create tokens
- `Auth.validateToken()` - Validate tokens
- `TokenManager` - Token lifecycle management

**When to read:**
- Understanding authentication flow
- Implementing security features

---

#### `Authorization.gs` - Access Control
**Purpose:** Role-based permissions
**Key Components:**
- `canCreate()`, `canRead()`, `canUpdate()`, `canDelete()`
- Access rules for Admin and User roles
- Org-based filtering for users

**When to read:**
- Understanding permission system
- Modifying access rules

---

#### `CRUD.gs` - Database Operations
**Purpose:** Create, Read, Update, Delete operations
**Key Functions:**
- `create()` - Insert new records
- `read()` - Query records
- `update()` - Modify records
- `delete()` - Remove records (soft/hard)

**When to read:**
- Understanding data operations
- Learning validation logic

---

#### `Utils.gs` - Utilities
**Purpose:** Helper functions and utilities
**Key Components:**
- `SheetManager` - Sheet access management
- `AuditLog` - Operation logging
- `Validator` - Data validation

**When to read:**
- Understanding helper functions
- Implementing custom validators

---

#### `Admin.gs` - Administration
**Purpose:** Setup and maintenance functions
**Key Functions:**
- `setupLibrary()` - Initialize database
- `createInitialAdmin()` - Create admin user
- `registerApplication()` - Register apps
- `dailyMaintenance()` - Cleanup tasks

**When to read:**
- Setting up the library
- Performing maintenance

---

#### `appsscript.json` - Configuration
**Purpose:** Apps Script project settings
**Contains:**
- OAuth scopes
- Time zone
- Runtime version

**When to read:**
- Initial setup
- Troubleshooting permissions

---

### Documentation Files

#### `README.md` - Main Documentation (English)
**Purpose:** Complete library documentation
**Sections:**
- Features overview
- Setup instructions
- API reference
- Usage examples
- Troubleshooting

**Read when:** You need comprehensive English documentation

---

#### `README_TH.md` - คู่มือภาษาไทย
**Purpose:** Thai language quick guide
**Sections:**
- ภาพรวมระบบ
- วิธีใช้งานง่ายๆ
- ตัวอย่างโค้ด
- แก้ปัญหา

**Read when:** คุณต้องการเอกสารภาษาไทยแบบเข้าใจง่าย

---

#### `SETUP_TH.md` - Setup Guide (Thai, Detailed)
**Purpose:** Step-by-step setup instructions in Thai
**Sections:**
- การสร้าง Spreadsheet
- การติดตั้ง Apps Script
- การตั้งค่าเริ่มต้น
- ตัวอย่างการใช้งาน

**Read when:** กำลังติดตั้งครั้งแรก (แนะนำอ่านคู่กับ Checklist)

---

#### `SETUP_CHECKLIST.md` - Installation Checklist
**Purpose:** Interactive setup checklist
**Features:**
- Step-by-step checkboxes
- Space to write down credentials
- Pre/post-setup tasks
- Troubleshooting section

**Read when:** You want to track setup progress

---

#### `SCHEMA.md` - Database Schema
**Purpose:** Detailed database structure
**Sections:**
- All table definitions
- Field descriptions
- Constraints and indexes
- Relationships
- Best practices

**Read when:**
- Understanding data model
- Planning modifications
- Troubleshooting data issues

---

#### `ARCHITECTURE.md` - System Architecture
**Purpose:** Visual system diagrams
**Contents:**
- System architecture
- Authentication flow
- Authorization flow
- CRUD operation flow
- Data model relationships
- Security layers

**Read when:**
- Understanding system design
- Planning integrations
- Learning the codebase

---

#### `PROJECT_SUMMARY.md` - Project Overview
**Purpose:** High-level project summary
**Sections:**
- Key features
- API reference
- Access control matrix
- Best practices
- Common issues

**Read when:**
- Quick project overview
- Presenting to stakeholders
- Planning similar projects

---

### Example & Reference

#### `Example.gs` - Usage Examples
**Purpose:** Working code examples
**Examples:**
1. Admin full access
2. User limited access
3. Batch operations
4. Error handling
5. Filtered queries
6. Secure configuration

**Read when:**
- Learning how to use the library
- Copy-paste starting code
- Understanding real-world usage

---

## 🎯 Reading Order by Role

### System Administrator
1. `README_TH.md` - Overview
2. `SETUP_TH.md` - Installation guide
3. `SETUP_CHECKLIST.md` - Follow checklist
4. `Admin.gs` - Understand admin functions
5. `Example.gs` - Test examples

### Application Developer
1. `README.md` - API documentation
2. `Example.gs` - Code examples
3. `SCHEMA.md` - Data structure
4. `Code.gs` - Public API
5. `Authorization.gs` - Permissions

### Security Auditor
1. `ARCHITECTURE.md` - System design
2. `Auth.gs` - Authentication
3. `Authorization.gs` - Access control
4. `SCHEMA.md` - Data model
5. `Utils.gs` - Validators

### Database Designer
1. `SCHEMA.md` - Current schema
2. `ARCHITECTURE.md` - Relationships
3. `CRUD.gs` - Operations
4. `Utils.gs` - Sheet management

---

## 📝 Documentation Languages

| File | Language | Audience | Detail Level |
|------|----------|----------|--------------|
| README.md | English | All | High |
| README_TH.md | ไทย | All | Medium |
| SETUP_TH.md | ไทย | Admin | High |
| SETUP_CHECKLIST.md | English | Admin | High |
| SCHEMA.md | English | Developer | High |
| ARCHITECTURE.md | English | Architect | High |
| PROJECT_SUMMARY.md | English | Manager | Medium |

---

## 🔧 File Usage by Task

### Task: Initial Setup
**Files to use:**
1. ✅ `SETUP_TH.md` - Read instructions
2. ✅ `SETUP_CHECKLIST.md` - Follow checklist
3. ✅ All `.gs` files - Copy to Apps Script
4. ✅ `appsscript.json` - Configure project

### Task: Understanding the System
**Files to read:**
1. 📖 `README.md` or `README_TH.md`
2. 📖 `ARCHITECTURE.md`
3. 📖 `SCHEMA.md`
4. 📖 `PROJECT_SUMMARY.md`

### Task: Using the Library
**Files to reference:**
1. 💻 `Example.gs` - Copy examples
2. 📖 `README.md` - API reference
3. 📖 `SCHEMA.md` - Data structure

### Task: Modifying the Library
**Files to study:**
1. 🔍 `Code.gs` - Entry point
2. 🔍 `Auth.gs` - Auth logic
3. 🔍 `Authorization.gs` - Permissions
4. 🔍 `CRUD.gs` - Operations
5. 🔍 `Utils.gs` - Helpers

### Task: Troubleshooting
**Files to check:**
1. 🐛 `README.md` - Troubleshooting section
2. 🐛 `SETUP_CHECKLIST.md` - Common issues
3. 🐛 `Example.gs` - Working code
4. 🐛 Execution logs in Apps Script

---

## 📚 Learning Path

### Beginner Level
**Goal:** Use the library in your application

**Reading Order:**
1. `README_TH.md` - Get overview (15 min)
2. `SETUP_TH.md` - Setup guide (30 min)
3. `Example.gs` - Study examples (30 min)
4. Practice with `quickTest()` function

**Time:** ~2 hours

---

### Intermediate Level
**Goal:** Understand how it works

**Reading Order:**
1. `ARCHITECTURE.md` - System design (30 min)
2. `SCHEMA.md` - Data structure (20 min)
3. `Code.gs` - Public API (20 min)
4. `Auth.gs` - Authentication (30 min)
5. `CRUD.gs` - Operations (30 min)

**Time:** ~3 hours

---

### Advanced Level
**Goal:** Modify and extend

**Reading Order:**
1. All core `.gs` files in detail (2 hours)
2. `ARCHITECTURE.md` - Deep dive (1 hour)
3. `PROJECT_SUMMARY.md` - Best practices (30 min)
4. Experiment with modifications

**Time:** ~4-5 hours

---

## 🎓 Tips for Reading

### For Quick Start
- Start with `README_TH.md` (ไทย) or `README.md`
- Jump to `Example.gs` for code
- Use `SETUP_CHECKLIST.md` during setup

### For Deep Understanding
- Read `ARCHITECTURE.md` first
- Then study each `.gs` file
- Cross-reference with `SCHEMA.md`

### For Problem Solving
- Check troubleshooting in `README.md`
- Review relevant `.gs` file
- Run `testLibrarySetup()` from `Admin.gs`

---

## 🔍 Finding Information

### "How do I authenticate?"
→ `Auth.gs` + `Example.gs` (Example 1 & 2)

### "What permissions does User role have?"
→ `Authorization.gs` + `README.md` (Access Control)

### "How do I create a record?"
→ `CRUD.gs` + `Example.gs` (Example 1)

### "What's the database structure?"
→ `SCHEMA.md`

### "How does token management work?"
→ `Auth.gs` (TokenManager) + `ARCHITECTURE.md`

### "Setup is failing, what do I do?"
→ `SETUP_CHECKLIST.md` (Troubleshooting) + Execution logs

---

## ✅ File Checklist

Before deploying, ensure you have:

- [ ] All 7 `.gs` files in Apps Script
- [ ] `appsscript.json` configured
- [ ] Script Properties set (SPREADSHEET_ID)
- [ ] All sheets created
- [ ] Admin user created
- [ ] At least one application registered
- [ ] Tests passing (`testLibrarySetup()`)

---

## 🎯 Summary

**Total Files:** 17
- **Code Files:** 7 (.gs + .json)
- **Documentation:** 8 (.md)
- **Configuration:** 2 (.gitignore, guide)

**Languages:** 
- Code: JavaScript (Google Apps Script)
- Docs: English + Thai (ไทย)

**Primary Entry Points:**
- Setup: `SETUP_TH.md` or `SETUP_CHECKLIST.md`
- Usage: `README.md` or `README_TH.md`
- Code: `Example.gs`
- Reference: `SCHEMA.md` + `ARCHITECTURE.md`

---

**Happy Coding! 🚀**

*Last Updated: November 2025*
*DTP NST Team*
