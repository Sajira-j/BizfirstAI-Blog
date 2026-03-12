# Database and Registration Data Documentation

## Database File Location

**Primary Database File:**
```
D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data\blogifier.db
```

**Database Type:** SQLite
**Purpose:** Stores all application data including user registrations, posts, newsletters, and settings

---

## Database Configuration

### Configuration File
**Location:** `D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\appsettings.json`

**Connection Settings:**
```json
{
  "Blogifier": {
    "DbProvider": "Sqlite",
    "ConnString": "Data Source=App_Data/blogifier.db",
    "Salt": "SECRET-CHANGE-ME!",
    "DemoMode": false
  }
}
```

---

## User Registration Data Structure

### User Entity Model
**Location:** `D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\Identity\UserInfo.cs`

### User Table Schema

The registration data is stored in the **`Users`** table with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int | Primary key (auto-increment) |
| `UserName` | string(256) | Unique username for login |
| `Email` | string(256) | User's email address |
| `NickName` | string(256) | Display name / nickname |
| `PasswordHash` | string(256) | Hashed password (secure) |
| `Avatar` | string(1024) | Profile picture URL (optional) |
| `Bio` | string(2048) | User biography (optional) |
| `Gender` | string(32) | User gender (optional) |
| `PhoneNumber` | string(32) | Phone number (optional) |
| `SecurityStamp` | string(32) | Security validation stamp |
| `ConcurrencyStamp` | string(64) | Concurrency control |
| `CreatedAt` | DateTime | Account creation timestamp |
| `UpdatedAt` | DateTime | Last update timestamp |
| `Type` | enum | User type/role |
| `State` | enum | User state (active/inactive) |
| `EmailConfirmed` | bool | Email verification status |
| `PhoneNumberConfirmed` | bool | Phone verification status |
| `TwoFactorEnabled` | bool | 2FA enabled status |
| `LockoutEnd` | DateTime | Account lockout expiry |
| `LockoutEnabled` | bool | Can account be locked |
| `AccessFailedCount` | int | Failed login attempts |

### User Entity Class
```csharp
public class UserInfo : IdentityUser<int>
{
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [StringLength(256)]
    public string NickName { get; set; } = default!;

    [StringLength(1024)]
    public string? Avatar { get; set; }

    [StringLength(2048)]
    public string? Bio { get; set; }

    [StringLength(32)]
    public string? Gender { get; set; }

    public UserType Type { get; set; }
    public UserState State { get; set; }
}
```

---

## Database Tables

### Primary Tables

**Database Context:** `D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\Data\AppDbContext.cs`

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| **Users** | Main user information | Id, UserName, Email, NickName, PasswordHash |
| **UserClaim** | User claims for authorization | UserId, ClaimType, ClaimValue |
| **UserLogin** | External login providers | UserId, LoginProvider, ProviderKey |
| **UserToken** | Authentication tokens | UserId, LoginProvider, Name, Value |
| **Posts** | Blog posts | Id, Slug, Title, Content, AuthorId |
| **Categories** | Post categories | Id, Category |
| **PostCategories** | Post-Category relationships | PostId, CategoryId |
| **Newsletters** | Newsletter campaigns | Id, Title, Content |
| **Subscribers** | Newsletter subscribers | Id, Email, IsActive |
| **Options** | Application settings | Key, Value |
| **Storages** | File storage metadata | Id, Path, Type |

---

## Registration Flow

### 1. User Submits Registration Form
**Form Location:** `src\Blogifier.Themes.Standard\Views\Themes\standard\register.cshtml`

**Fields Collected:**
- UserName
- NickName
- Email
- Password
- PasswordConfirm

### 2. Controller Processing
**Controller:** `src\Blogifier\Controllers\AccountController.cs`

**Process:**
1. Validates form input
2. Creates `UserInfo` object
3. Hashes password using ASP.NET Core Identity
4. Saves to database via Entity Framework Core
5. Sets default values (CreatedAt, Type, State)

### 3. Database Storage
**Data Flow:**
```
Registration Form → AccountController → UserInfo Model → AppDbContext → SQLite Database
```

**Stored In:**
- Physical File: `App_Data/blogifier.db`
- Table: `Users`
- Record: New row with all user information

---

## How to Access/View Database

### Option 1: DB Browser for SQLite (Recommended)
1. Download from: https://sqlitebrowser.org/
2. Install the application
3. Open the database file: `src\Blogifier\App_Data\blogifier.db`
4. Browse the `Users` table to see registration data

### Option 2: SQLite Studio
1. Download from: https://sqlitestudio.pl/
2. Open database file
3. Execute SQL queries or browse tables

### Option 3: Visual Studio Code
1. Install extension: "SQLite" by alexcvzz
2. Right-click `blogifier.db` file
3. Select "Open Database"
4. Browse tables in SQLite Explorer

### Option 4: Command Line
```bash
cd D:\BlogBizfirst\BizfirstAI-Blog\src\Blogifier\App_Data
sqlite3 blogifier.db

# View all users
SELECT * FROM Users;

# View user count
SELECT COUNT(*) FROM Users;

# View specific user
SELECT UserName, Email, NickName, CreatedAt FROM Users WHERE UserName = 'yourusername';
```

---

## Database Backup

### Manual Backup
Simply copy the file:
```
src\Blogifier\App_Data\blogifier.db
```

To a backup location with a timestamp:
```
blogifier-backup-2026-03-10.db
```

### Automated Backup Script
Create a batch file or PowerShell script to backup regularly.

---

## Security Notes

### Password Storage
- Passwords are **never stored in plain text**
- Uses **PBKDF2** hashing algorithm via ASP.NET Core Identity
- Each password has a unique salt
- Stored in `PasswordHash` column (256 characters)

### Database Security
- Database file should have restricted file permissions
- Production: Consider using SQL Server or PostgreSQL instead of SQLite
- Keep `Salt` value in `appsettings.json` secret
- Never commit database file to version control

### Connection String Security
- For production, move connection string to environment variables
- Use Azure Key Vault or similar for sensitive configuration
- Don't expose database file in public directories

---

## Alternative Database Providers

The application supports multiple database providers:

| Provider | Context File | Configuration |
|----------|--------------|---------------|
| SQLite (Current) | `SqliteDbContext.cs` | `"DbProvider": "Sqlite"` |
| SQL Server | `SqlServerDbContext.cs` | `"DbProvider": "SqlServer"` |
| PostgreSQL | `PostgresDbContext.cs` | `"DbProvider": "PostgreSQL"` |
| MySQL | `MySqlDbContext.cs` | `"DbProvider": "MySql"` |

### Switching Database Provider

1. Edit `appsettings.json`:
```json
{
  "Blogifier": {
    "DbProvider": "SqlServer",
    "ConnString": "Server=localhost;Database=blogifier;Trusted_Connection=True;"
  }
}
```

2. Run migrations:
```bash
dotnet ef database update
```

---

## Troubleshooting

### Database File Not Found
- Check if `App_Data` folder exists
- Verify path in `appsettings.json`
- Run application once to auto-create database

### Database Locked
- Close any applications accessing the database
- Restart the web application
- Check file permissions

### Corrupted Database
- Restore from backup
- Or delete `blogifier.db` and restart app (creates fresh database)

---

## Key File Locations Summary

| File Path | Purpose |
|-----------|---------|
| `src\Blogifier\App_Data\blogifier.db` | **Main database file** |
| `src\Blogifier\appsettings.json` | Database configuration |
| `src\Blogifier\Identity\UserInfo.cs` | User entity model |
| `src\Blogifier\Data\AppDbContext.cs` | Database context |
| `src\Blogifier\Controllers\AccountController.cs` | Registration logic |
| `src\Blogifier.Themes.Standard\Views\Themes\standard\register.cshtml` | Registration form |
| `src\Blogifier.Themes.Standard\Views\Themes\standard\login.cshtml` | Login form |

---

## Last Updated
2026-03-10
