# DTP NST GAS Library - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                           │
│  (Web Apps, Mobile Apps, Other Apps Script Projects)               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ 1. request_token()
                             │    (username/id13, password, userType)
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      DTP NST GAS Library                            │
│                         (Public API)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  request_token(credentials, userType) ─────→ Returns: token        │
│  connect(appKey, token) ──────────────────→ Returns: conn object   │
│                                                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ 2. connect()
                             │    (appKey, token)
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Connection Object                                │
├─────────────────────────────────────────────────────────────────────┤
│  Methods:                                                           │
│  • create(tableName, data)                                         │
│  • read(tableName, filters)                                        │
│  • update(tableName, uuid, data)                                   │
│  • delete(tableName, uuid, hardDelete)                             │
│  • info()                                                          │
│  • disconnect()                                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ 3. CRUD Operations
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Core Modules                                     │
├───────────────┬──────────────┬──────────────┬──────────────────────┤
│               │              │              │                      │
│  Auth.gs      │  Authz.gs    │  CRUD.gs     │  Utils.gs           │
│               │              │              │                      │
│ • authenticate│ • canCreate  │ • create     │ • SheetManager      │
│ • generateTok │ • canRead    │ • read       │ • AuditLog          │
│ • validateTok │ • canUpdate  │ • update     │ • Validator         │
│ • validateApp │ • canDelete  │ • delete     │ • TokenManager      │
│               │              │              │                      │
└───────┬───────┴──────┬───────┴──────┬───────┴──────┬───────────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                       │
                       │ 4. Data Access Layer
                       ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Google Spreadsheet                               │
├─────────────────────────────────────────────────────────────────────┤
│  Sheets:                                                            │
│  ┌──────────────┬──────────────┬──────────────┬─────────────────┐ │
│  │ users        │ organizations│ positions    │ ranks           │ │
│  ├──────────────┼──────────────┼──────────────┼─────────────────┤ │
│  │ logs         │ admins       │ applications │ tokens          │ │
│  └──────────────┴──────────────┴──────────────┴─────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. Call request_token(credentials, userType)
     ↓
┌─────────────────┐
│   Auth.gs       │
│  authenticate() │
└────┬────────────┘
     │
     │ 2. Verify credentials
     ↓
┌──────────────────────┐
│  For Admin:          │     ┌─────────────────────┐
│  - Check admins      │────→│  admins sheet       │
│    sheet             │     └─────────────────────┘
│  - Verify username   │
│  - Check password    │
│    (hashed)          │
└──────────────────────┘
     │
┌──────────────────────┐
│  For User:           │     ┌─────────────────────┐
│  - Check users       │────→│  users sheet        │
│    sheet             │     └─────────────────────┘
│  - Verify id13       │
│  - Check password    │
│    (hashed)          │
└──────┬───────────────┘
       │
       │ 3. Generate token
       ↓
┌─────────────────┐
│  TokenManager   │
│  saveToken()    │
└────┬────────────┘
     │
     │ 4. Save to tokens sheet
     ↓
┌──────────────────────┐
│  tokens sheet        │
│  - token             │
│  - user_type         │
│  - user_id           │
│  - expires_at        │
│  - org_id (for user) │
└──────────────────────┘
     │
     │ 5. Return token to client
     ↓
┌──────────┐
│  Client  │
│  Stores  │
│  Token   │
└──────────┘
```

---

## Authorization Flow

```
┌──────────┐
│  Client  │
│  + token │
└────┬─────┘
     │
     │ 1. Call connect(appKey, token)
     ↓
┌─────────────────┐
│   Auth.gs       │
│  validateApp()  │
│  validateToken()│
└────┬────────────┘
     │
     │ 2. Check app_key in applications sheet
     ↓
┌──────────────────┐
│ applications     │
│ sheet            │
│ - Verify key     │
│ - Check active   │
└────┬─────────────┘
     │
     │ 3. Check token in tokens sheet
     ↓
┌──────────────────┐
│ tokens sheet     │
│ - Verify token   │
│ - Check expiry   │
│ - Check revoked  │
└────┬─────────────┘
     │
     │ 4. Create Connection object
     ↓
┌──────────────────────────┐
│  Connection Object       │
│  + userType (admin/user) │
│  + userId                │
│  + orgId (if user)       │
└────┬─────────────────────┘
     │
     │ 5. On CRUD operation
     ↓
┌─────────────────┐
│ Authorization   │
│ .gs             │
│ - canCreate?    │
│ - canRead?      │
│ - canUpdate?    │
│ - canDelete?    │
└────┬────────────┘
     │
     ├─→ Admin: ✅ All operations on all tables
     │
     └─→ User:  ✅ Read only, with org filter
```

---

## CRUD Operation Flow

```
┌──────────────┐
│   Client     │
│ conn.create()│
│ conn.read()  │
│ conn.update()│
│ conn.delete()│
└──────┬───────┘
       │
       │ 1. Call CRUD method
       ↓
┌──────────────────────┐
│  Authorization       │
│  Check permissions   │
└──────┬───────────────┘
       │
       │ 2. If authorized
       ↓
┌──────────────────────┐
│  CRUD.gs             │
│  Perform operation   │
└──────┬───────────────┘
       │
       │ 3. Data validation
       ↓
┌──────────────────────┐
│  Validator           │
│  - Required fields   │
│  - Unique fields     │
│  - Format checks     │
└──────┬───────────────┘
       │
       │ 4. Access sheet
       ↓
┌──────────────────────┐
│  SheetManager        │
│  Get/Update sheet    │
└──────┬───────────────┘
       │
       │ 5. Sheet operation
       ↓
┌──────────────────────┐
│  Google Sheet        │
│  - appendRow()       │
│  - getDataRange()    │
│  - getRange()        │
│  - deleteRow()       │
└──────┬───────────────┘
       │
       │ 6. Log operation
       ↓
┌──────────────────────┐
│  AuditLog            │
│  Log action          │
└──────┬───────────────┘
       │
       │ 7. Save to logs sheet
       ↓
┌──────────────────────┐
│  logs sheet          │
│  - user_id13         │
│  - action            │
│  - table_name        │
│  - status            │
│  - timestamp         │
└──────┬───────────────┘
       │
       │ 8. Return result
       ↓
┌──────────────┐
│   Client     │
│  {success,   │
│   data,      │
│   message}   │
└──────────────┘
```

---

## Data Model Relationships

```
┌─────────────────┐
│  organizations  │
│  ├─ uuid (PK)   │
│  ├─ hrms_id     │
│  └─ org_name    │
└────────┬────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐
│     users       │
│  ├─ uuid (PK)   │
│  ├─ id13 (UK)   │
│  ├─ name        │
│  ├─ password    │
│  ├─ org_id (FK) │◄────┐
│  ├─ position_id │     │
│  └─ rank_id     │     │
└────┬───┬────────┘     │
     │   │              │
     │   │              │
     │   └─────────┐    │
     │             │    │
     │ N:1         │ N:1│
     ↓             ↓    │
┌──────────┐  ┌────────────┐
│ position │  │   ranks    │
│ (FK)     │  │   (FK)     │
└──────────┘  └────────────┘

┌─────────────────┐
│     admins      │
│  ├─ uuid (PK)   │
│  ├─ username    │
│  ├─ password    │
│  └─ role        │
└─────────────────┘

┌─────────────────┐
│  applications   │
│  ├─ uuid (PK)   │
│  ├─ appname     │
│  ├─ app_key(UK) │
│  └─ active      │
└────────┬────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐
│     tokens      │
│  ├─ uuid (PK)   │
│  ├─ token (UK)  │
│  ├─ user_type   │
│  ├─ user_id     │
│  ├─ app_key(FK) │
│  ├─ org_id      │
│  └─ expires_at  │
└─────────────────┘

┌─────────────────┐
│      logs       │
│  ├─ uuid (PK)   │
│  ├─ user_id13   │
│  ├─ action      │
│  ├─ table_name  │
│  ├─ record_id   │
│  ├─ status      │
│  └─ created_at  │
└─────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────┐
│         Layer 1: Application            │
│         Validation                      │
│  • App Key verification                 │
│  • App active status check              │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Layer 2: Authentication         │
│  • Token validation                     │
│  • Token expiration check               │
│  • Token revocation check               │
│  • User credentials verification        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Layer 3: Authorization          │
│  • Role-based access control            │
│  • Operation permission check           │
│  • Org-based data filtering (users)     │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Layer 4: Data Validation        │
│  • Required fields check                │
│  • Unique fields check                  │
│  • Format validation (ID13, email)      │
│  • Input sanitization                   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│         Layer 5: Audit Logging          │
│  • Log all operations                   │
│  • Track user, action, status           │
│  • Timestamp all activities             │
└─────────────────────────────────────────┘
```

---

## Module Dependencies

```
┌──────────────┐
│   Code.gs    │  (Main Entry Point)
│  Public API  │
└──────┬───────┘
       │
       ├─────────────────────────────┐
       │                             │
       ↓                             ↓
┌──────────────┐            ┌──────────────┐
│   Auth.gs    │            │  CRUD.gs     │
│              │            │              │
└──────┬───────┘            └──────┬───────┘
       │                           │
       │                           │
       ↓                           ↓
┌──────────────┐            ┌──────────────┐
│Authorization │            │   Utils.gs   │
│    .gs       │            │              │
└──────────────┘            │ • SheetMgr   │
                            │ • AuditLog   │
                            │ • Validator  │
                            │ • TokenMgr   │
                            └──────────────┘

All modules depend on:
• Utilities (built-in)
• SpreadsheetApp (built-in)
• PropertiesService (built-in)
• Logger (built-in)
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│      Google Apps Script Project         │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Source Files:                  │    │
│  │  • Code.gs                      │    │
│  │  • Auth.gs                      │    │
│  │  • Authorization.gs             │    │
│  │  • CRUD.gs                      │    │
│  │  • Utils.gs                     │    │
│  │  • Admin.gs                     │    │
│  │  • appsscript.json              │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Script Properties:             │    │
│  │  • SPREADSHEET_ID               │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Triggers:                      │    │
│  │  • dailyMaintenance (Time)      │    │
│  └────────────────────────────────┘    │
└───────────────┬─────────────────────────┘
                │
                │ Deploy as Library
                ↓
┌─────────────────────────────────────────┐
│         Library Deployment              │
│  • Script ID: xxx...yyy                 │
│  • Version: 1.0.0                       │
│  • Access: Configured                   │
└───────────────┬─────────────────────────┘
                │
                │ Used by
                ↓
┌─────────────────────────────────────────┐
│      Client Apps Script Projects        │
│  • Add Library (Script ID)              │
│  • Use Identifier: DTPNSTLib           │
│  • Call: DTPNSTLib.request_token()     │
│  • Call: DTPNSTLib.connect()           │
└─────────────────────────────────────────┘
```

---

## Token Lifecycle

```
┌──────────────┐
│ Client calls │
│request_token │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│ 1. CREATED       │
│ • Generate token │
│ • Set expiry     │
│   (24 hours)     │
│ • Save to sheet  │
│ • revoked: false │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ 2. ACTIVE        │
│ • Used in API    │
│   calls          │
│ • last_used      │
│   updated        │
└──────┬───────────┘
       │
       ├──→ 3a. EXPIRED
       │    • expires_at < now
       │    • Cannot be used
       │    • Cleaned by
       │      dailyMaintenance
       │
       └──→ 3b. REVOKED
            • disconnect() called
            • revoked: true
            • revoked_at set
            • Cannot be used
```

---

This architecture ensures:
✅ Secure authentication and authorization
✅ Proper data validation
✅ Complete audit trail
✅ Scalable design
✅ Easy maintenance
