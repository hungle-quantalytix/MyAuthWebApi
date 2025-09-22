# MyAuthWebApi


## Features

- **Claim-Based Authorization**: User-specific claims for flexible access control
- **Permission-Based Authorization**: Fine-grained permissions with resource-specific access control

## Core Components

- **Middleware**: Custom middleware for permission and claim validation
- **Attributes**: Custom authorization attributes for declarative security

## Authorization Systems

The system implements two complementary authorization approaches. Both of them depend on 2 properties
- **ResourceType**: Type of resource (e.g., "Product", "Category")
- **Action**: Action to perform (e.g., "Read", "Write", "Delete"). Action can be a predefined enum in code or database (postgres also support enum or sql server have type)

### Claim System
- **ResourceId**: Currently not use but idea is it use for restrict to document level if need
- **DisplayName**: Generated with formart {resourceType}:{action}
- **User Association**: Claims are directly associated with users through many-to-many relationship

#### Adding Resource to systems
When deploying new resource/table need to protect, we need to migrate new claims to `Claims` table.
```sql
INSERT INTO Claims
(ResourceType, ResourceId, "Action", DisplayName)
VALUES('Product', '*', 'read', 'product:read');
INSERT INTO Claims
(ResourceType, ResourceId, "Action", DisplayName)
VALUES('Product', '*', 'write', 'product:write');
INSERT INTO Claims
(ResourceType, ResourceId, "Action", DisplayName)
VALUES('Product', '*', '*', 'product:all');
```

- `POST /api/Users/assign-claim` - Assign claim to user

#### Using Claim Attributes
```csharp
[RequireClaim("read", nameof(Product))]
public async Task<ActionResult<Product>> GetProduct(int id)
{
}
```

### Permission System
Inspired by Googel Zanzibar https://www.zanzibar.academy/
- **ResourceId**: Specific resource identifier or "*" for all resources
- **SubjectType**: Type of subject (e.g., "User", "Role", "Claim")
- **SubjectId**: Specific subject identifier or "*" for all subjects

#### Adding Resource to systems
When deploying new resource/table need to protect, we need to migrate information to `Permission` table.
```sql
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', 'read', 'User', '*');
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', 'write', 'User', '*');
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', '*', 'User', '*');
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', 'read', 'Role', 'ProductViewer');
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', 'write', 'Role', 'ProductAdmin');
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', '*', 'Role', 'ProductAdmin');
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', 'read', 'Claim', '1'); -- Example ClaimId = 1 product:read
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', 'write', 'Claim', '2'); -- Example ClaimId = 2 product:write
INSERT INTO Permissions
(ResourceType, ResourceId, "Action", SubjectType, SubjectId)
VALUES('Product', '*', '*', 'Claim', '3'); -- Example ClaimId = 3 product:all
```

- `POST /api/Users/assign-claim` - Assign claim to user

#### Using Permission Attributes

```csharp
[RequirePermission("read", nameof(Product), "*")]
public async Task<ActionResult<Product>> GetProduct(int id)
{
}
```

---
##  Getting Started

### 1. Restore Dependencies

```bash
dotnet restore
```

### 2. Update Database

```bash
dotnet ef database update
```

### 3. Run the Application

```bash
dotnet run
```

The API will be available at `https://localhost:5245` (or the port specified in your launch settings).


## 📚 API Endpoints

### Authentication Endpoints

- `POST /register` - Register a new user
- `POST /login` - Authenticate user and get access tokens
- `POST /refresh` - Refresh access token using refresh token

### User Management

- `GET /api/Users` - Get all users (Admin only)
- `POST /api/Users/assign-role` - Assign role to user
- `POST /api/Users/assign-claim` - Assign claim to user

### Role Management

- `GET /api/Roles` - Get all roles
- `POST /api/Roles` - Create new role

### Permission Management

- `GET /api/Permissions` - Get all permissions
- `POST /api/Permissions` - Create new permission

### Claim Management

- `GET /api/Claims` - Get all claims
- `POST /api/Claims` - Create new claim

### Business Logic

- `GET /api/Products` - Get all products
- `GET /api/Products/{id}` - Get product by ID
- `POST /api/Products` - Create new product
- `GET /api/Categories` - Get all categories
- `POST /api/Categories` - Create new category

## 📝 Notes

This is a sample authentication system for internal development and testing purposes.