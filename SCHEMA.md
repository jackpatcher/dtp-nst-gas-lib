# Database Schema - DTP NST GAS Library

## Enhanced Table Structure with Best Practices

### 1. user (Sheet: "users")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| name | string | Full name | Required |
| id13 | string | National ID (13 digits) | Required, Unique, Indexed |
| password | string | Hashed password | Required (SHA256) |
| position_id | string | Foreign Key | FK: position.uuid |
| rank_id | string | Foreign Key | FK: rank.uuid |
| org_id | string | Foreign Key | FK: org.uuid (changed from hrms_id) |
| active | boolean | Account status | Default: true |
| created_at | datetime | Creation timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-updated |

### 2. org (Sheet: "organizations")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| hrms_id | string | HRMS identifier | Unique, Indexed |
| dmz_id | string | DMZ identifier | Unique |
| org_name | string | Organization name | Required |
| subdistrict | string | Subdistrict | |
| district | string | District | |
| province | string | Province | Required |
| active | boolean | Organization status | Default: true |
| created_at | datetime | Creation timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-updated |

### 3. position (Sheet: "positions")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| name | string | Position name | Required, Unique |
| description | string | Position description | |
| level | integer | Position level | Optional |
| active | boolean | Status | Default: true |
| created_at | datetime | Creation timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-updated |

### 4. rank (Sheet: "ranks")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| name | string | Rank name | Required, Unique |
| abbreviation | string | Short form | |
| level | integer | Rank level | Optional |
| active | boolean | Status | Default: true |
| created_at | datetime | Creation timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-updated |

### 5. log (Sheet: "logs")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| user_id13 | string | User identifier | FK: user.id13 |
| action | string | Action performed | Required (CREATE/READ/UPDATE/DELETE) |
| table_name | string | Target table | Required |
| record_id | string | Target record UUID | |
| status | string | Status | SUCCESS/FAILED |
| app_id | string | Application ID | FK: app.uuid |
| ip_address | string | Client IP | Optional |
| details | string | Additional info (JSON) | Optional |
| created_at | datetime | Log timestamp | Auto-generated |

### 6. admin (Sheet: "admins")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| username | string | Admin username | Required, Unique, Indexed |
| password | string | Hashed password | Required (SHA256) |
| name | string | Admin full name | Required |
| role | string | Admin role | SUPER_ADMIN/ADMIN |
| active | boolean | Account status | Default: true |
| last_login | datetime | Last login time | Auto-updated |
| created_at | datetime | Creation timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-updated |

### 7. app (Sheet: "applications")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| appname | string | Application name | Required, Unique |
| app_key | string | API Key | Required, Unique, Auto-generated |
| description | string | App description | |
| callback_url | string | Callback URL | Optional |
| active | boolean | App status | Default: true |
| created_by | string | Creator admin ID | FK: admin.uuid |
| created_at | datetime | Creation timestamp | Auto-generated |
| updated_at | datetime | Last update timestamp | Auto-updated |

### 8. token (Sheet: "tokens")
| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| uuid | string | Primary Key | UUID v4, Required |
| token | string | JWT or random token | Required, Unique, Indexed |
| user_type | string | User type | ADMIN/USER |
| user_id | string | User identifier | FK: admin.uuid or user.uuid |
| user_identifier | string | Username or id13 | Indexed |
| app_key | string | Application key | FK: app.app_key |
| org_id | string | Organization (for users) | FK: org.uuid (null for admin) |
| expires_at | datetime | Expiration time | Required |
| revoked | boolean | Revocation status | Default: false |
| revoked_at | datetime | Revocation time | Optional |
| last_used | datetime | Last usage time | Auto-updated |
| created_at | datetime | Creation timestamp | Auto-generated |

## Sheet Header Configuration

Each sheet should have headers in Row 1 with the column names as listed above.

## Indexes (for faster lookups)
- user: id13
- admin: username
- token: token, user_identifier
- org: hrms_id
- app: app_key

## Security Best Practices
1. **Password Storage**: All passwords hashed with SHA-256 + salt
2. **Token Expiration**: Tokens expire after 24 hours (configurable)
3. **App Key**: Random 32-character keys for application authentication
4. **Token Format**: JWT-like structure with signature verification
5. **Audit Trail**: All operations logged in the logs table
6. **Soft Delete**: Use 'active' flag instead of hard deletes
7. **Rate Limiting**: Track last_used to implement rate limiting

## Access Control Rules
- **SUPER_ADMIN**: Full access to all tables including admin management
- **ADMIN**: CRUD on user, org, position, rank, app; Read on logs
- **USER**: Read-only access to own org's users and org information
