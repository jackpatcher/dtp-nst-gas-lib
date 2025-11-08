# 📊 Database Schema Summary

**Version:** 2.0 (Simplified)  
**Last Updated:** November 8, 2025

---

## 🎯 Design Principle

**เก็บเฉพาะข้อมูลที่จำเป็น - เรียบง่าย เข้าใจง่าย**

---

## 📋 Tables Overview

### 1. **config** (4 fields)
ตารางตั้งค่าระบบแบบ key-value

| Field | Type | Description |
|-------|------|-------------|
| key | string | ชื่อ config |
| value | string | ค่า config |
| description | string | คำอธิบาย |
| updated_at | datetime | วันที่อัปเดต |

---

### 2. **organizations** (9 fields) ⭐
ข้อมูลหน่วยงาน/องค์กร

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key (internal) |
| hrms_id | string | HRMS ID (business key, FK) |
| dmz_id | string | DMZ ID |
| org_name | string | ชื่อหน่วยงาน |
| subdistrict | string | ตำบล/แขวง |
| district | string | อำเภอ/เขต |
| province | string | จังหวัด |
| created_at | datetime | วันที่สร้าง |
| updated_at | datetime | วันที่อัปเดต |

**Example:**
```javascript
{
  hrms_id: 'E6900000',
  dmz_id: 'DMZ001',
  org_name: 'กรมสมเด็จพระเจ้าตากสินมหาราช',
  subdistrict: 'คลองตัน',
  district: 'คลองเตย',
  province: 'กรุงเทพมหานคร'
}
```

---

### 3. **positions** (5 fields) ⭐
ข้อมูลตำแหน่ง

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| position_id | string | รหัสตำแหน่ง |
| name | string | ชื่อตำแหน่ง |
| created_at | datetime | วันที่สร้าง |
| updated_at | datetime | วันที่อัปเดต |

**Example:**
```javascript
{
  position_id: 'P001',
  name: 'นักวิชาการคอมพิวเตอร์'
}
```

---

### 4. **ranks** (5 fields) ⭐
ข้อมูลระดับ/ชั้น

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| rank_id | string | รหัสระดับ |
| name | string | ชื่อระดับ |
| created_at | datetime | วันที่สร้าง |
| updated_at | datetime | วันที่อัปเดต |

**Example:**
```javascript
{
  rank_id: 'R007',
  name: 'ชำนาญการ'
}
```

---

### 5. **users** (10 fields)
ข้อมูลผู้ใช้งาน

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| name | string | ชื่อ-นามสกุล |
| id13 | string | เลขประจำตัว 13 หลัก |
| password | string | รหัสผ่าน (hashed) |
| position_id | string | FK → positions.position_id |
| rank_id | string | FK → ranks.rank_id |
| hrms_id | string | FK → organizations.hrms_id |
| active | boolean | สถานะใช้งาน |
| created_at | datetime | วันที่สร้าง |
| updated_at | datetime | วันที่อัปเดต |

---

### 6. **logs** (8 fields)
บันทึกการใช้งาน (Audit Log)

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| action | string | การกระทำ (CREATE, READ, UPDATE, DELETE) |
| table_name | string | ชื่อตาราง |
| record_id | string | UUID ของข้อมูล |
| user_id | string | UUID ของผู้ใช้ |
| user_type | string | ประเภท (admin/user) |
| timestamp | datetime | เวลาที่เกิดเหตุการณ์ |
| details | string | รายละเอียดเพิ่มเติม (JSON) |

---

### 7. **admins** (9 fields)
ข้อมูลผู้ดูแลระบบ

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| username | string | Username |
| password | string | รหัสผ่าน (hashed) |
| email | string | อีเมล |
| first_name | string | ชื่อ |
| last_name | string | นามสกุล |
| status | string | สถานะ (active/inactive) |
| created_at | datetime | วันที่สร้าง |
| updated_at | datetime | วันที่อัปเดต |

---

### 8. **applications** (6 fields)
ข้อมูลแอปพลิเคชันที่เชื่อมต่อ

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| app_name | string | ชื่อแอป |
| app_key | string | App Key (สำหรับ connect) |
| app_secret | string | App Secret |
| status | string | สถานะ (active/inactive) |
| created_at | datetime | วันที่สร้าง |
| updated_at | datetime | วันที่อัปเดต |

---

### 9. **tokens** (12 fields)
ข้อมูล Authentication Token

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Primary Key |
| token | string | Token String (64 chars) |
| user_type | string | ประเภท (admin/user) |
| user_id | string | UUID ของผู้ใช้ |
| user_identifier | string | username หรือ id13 |
| app_key | string | App Key ที่ใช้ connect |
| hrms_id | string | HRMS ID (สำหรับ user) |
| expires_at | datetime | วันหมดอายุ |
| revoked | boolean | ถูกยกเลิกหรือไม่ |
| revoked_at | datetime | วันที่ยกเลิก |
| last_used | datetime | ใช้ล่าสุดเมื่อ |
| created_at | datetime | วันที่สร้าง |

---

## 🔗 Relationships

### Foreign Keys

```
users.hrms_id → organizations.hrms_id
users.position_id → positions.position_id
users.rank_id → ranks.rank_id

tokens.hrms_id → organizations.hrms_id (for user type)
```

### ER Diagram (Simple)

```
┌─────────────────┐
│  organizations  │
│  - uuid         │
│  - hrms_id (FK) │◄────┐
│  - org_name     │     │
│  - province     │     │
└─────────────────┘     │
                        │
                        │
┌─────────────────┐     │
│    positions    │     │
│  - uuid         │     │
│  - position_id  │◄──┐ │
│  - name         │   │ │
└─────────────────┘   │ │
                      │ │
                      │ │
┌─────────────────┐   │ │
│      ranks      │   │ │
│  - uuid         │   │ │
│  - rank_id (FK) │◄─┐│ │
│  - name         │  ││ │
└─────────────────┘  ││ │
                     ││ │
                     ││ │
┌─────────────────┐  ││ │
│      users      │  ││ │
│  - uuid         │  ││ │
│  - name         │  ││ │
│  - id13         │  ││ │
│  - position_id  ├──┘│ │
│  - rank_id      ├───┘ │
│  - hrms_id (FK) ├─────┘
└─────────────────┘
```

---

## 📊 Complexity Comparison

### Before Simplification
```
organizations: 12 fields (name_th, name_en, short_name_th, short_name_en, 
               department_code, level, parent_hrms_id, order_no...)
positions: 6 fields (name_th, name_en)
ranks: 9 fields (name_th, name_en, level, salary_min, salary_max)
```

### After Simplification ✅
```
organizations: 9 fields (org_name, subdistrict, district, province)
positions: 5 fields (position_id, name)
ranks: 5 fields (rank_id, name)
```

**Reduced by 30%** - เก็บเฉพาะข้อมูลจำเป็น

---

## 🎯 Design Benefits

1. **Simple & Clean** - ฟิลด์น้อยลง เข้าใจง่ายขึ้น
2. **Fast Performance** - อ่าน/เขียนเร็วขึ้น
3. **Easy Maintenance** - บำรุงรักษาง่าย
4. **Flexible** - ขยายได้ในอนาคต (ใช้ Config หรือ Details field)

---

## 📝 Notes

- ใช้ `hrms_id` เป็น Foreign Key แทน `uuid` เพื่อให้ค้นหาและ join ง่ายขึ้น
- `uuid` เป็น Internal Primary Key สำหรับใช้ภายในระบบเท่านั้น
- ทุก table มี `created_at` และ `updated_at` เพื่อ audit trail
- Password เก็บเป็น SHA-256 hash เท่านั้น (ไม่เก็บ plaintext)
