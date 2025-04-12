# User Management

## Overview

The User Management module in Config2Page provides a comprehensive system for managing users with different roles and permissions. It includes features for creating, reading, updating, and deleting users, with role-based access control.

## User Model

The User model is defined in the Prisma schema:

```prisma
model User {
  id         Int      @id @default(autoincrement())
  first_name String   @db.VarChar(100)
  last_name  String   @db.VarChar(100)
  email      String   @unique @db.VarChar(255)
  password   String   @db.Text
  role       Role     @default(user)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Audit log relations
  actorLogs  AuditLog[] @relation("ActorLogs")
  targetLogs AuditLog[] @relation("TargetLogs")

  @@map("users")
}

enum Role {
  admin
  moderator
  user
}
```

## User Roles and Permissions

### Admin
- Can view all users
- Can create new users with any role
- Can edit all users including their roles
- Can delete all users except themselves
- Has access to audit logs

### Moderator
- Can view all users
- Can edit their own details
- Can edit basic users' details
- Can delete basic users
- Cannot modify other moderators or admins
- Cannot access audit logs

### User (Basic)
- Can view all users
- Can edit their own details only
- Cannot delete any accounts
- Cannot access audit logs

## API Endpoints

### User Creation

**Endpoint:** `POST /api/users`  
**Access:** Admin only

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "role": "user",
  "password": "Password123"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "created_at": "2025-04-12T20:11:14.000Z",
    "updated_at": "2025-04-12T20:11:14.000Z"
  }
}
```

### Get All Users

**Endpoint:** `GET /api/users`  
**Access:** All authenticated users

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@example.com",
      "role": "admin",
      "created_at": "2025-04-12T20:11:14.000Z",
      "updated_at": "2025-04-12T20:11:14.000Z"
    },
    {
      "id": 2,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "created_at": "2025-04-12T20:11:14.000Z",
      "updated_at": "2025-04-12T20:11:14.000Z"
    }
  ]
}
```

### Get User by ID

**Endpoint:** `GET /api/users/:id`  
**Access:** 
- Admin: All users
- Moderator: All users
- User: Only themselves

**Response:**
```json
{
  "user": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "created_at": "2025-04-12T20:11:14.000Z",
    "updated_at": "2025-04-12T20:11:14.000Z"
  }
}
```

### Update User

**Endpoint:** `PUT /api/users/:id`  
**Access:** 
- Admin: Can update all users
- Moderator: Can update basic users and themselves
- User: Can update only themselves

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "role": "moderator",  // Only admins can change roles
  "password": "NewPassword123"  // Optional
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 2,
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "role": "moderator",
    "created_at": "2025-04-12T20:11:14.000Z",
    "updated_at": "2025-04-12T20:15:30.000Z"
  }
}
```

### Delete User

**Endpoint:** `DELETE /api/users/:id`  
**Access:** 
- Admin: Can delete all users except themselves
- Moderator: Can delete basic users only
- User: Cannot delete any accounts

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

## Implementation Details

### User Creation

```typescript
// Create new user (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Only admin can create users
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can create users' });
    }

    const { first_name, last_name, email, role, password } = req.body;

    // Validate email format
    if (!email?.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    
    if (password.length < minLength || !hasLowerCase || !hasUpperCase) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain both uppercase and lowercase letters'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    // Log user creation
    if (req.user) {
      await logUserAction(
        req.user.id,
        AUDIT_TYPES.CREATE_USER,
        newUser.id,
        { 
          user_details: {
            email: newUser.email,
            role: newUser.role
          }
        },
        req.clientIp
      );
    }

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});
```

### User Update

```typescript
// Update user
router.put('/:id', authenticate, checkUserPermissions, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, role, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build update data
    const updates: any = {};
    if (first_name) updates.first_name = first_name;
    if (last_name) updates.last_name = last_name;
    if (email) {
      if (!email.includes('@')) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      updates.email = email;
    }

    // Only admin and moderators can change roles
    if (role && (req.user?.role === 'admin' || (req.user?.role === 'moderator' && existingUser.role === 'user'))) {
      updates.role = role;
    }

    // Handle password update if provided
    if (password) {
      const minLength = 8;
      const hasLowerCase = /[a-z]/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      
      if (password.length < minLength || !hasLowerCase || !hasUpperCase) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long and contain both uppercase and lowercase letters'
        });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updates,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    // Log user edit
    if (req.user) {
      await logUserEdit(
        req.user.id,
        parseInt(id),
        existingUser,
        updatedUser,
        req.clientIp
      );
    }

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});
```

## Frontend Implementation

### User Management Page

The User Management page provides a UI for managing users based on the current user's role:

```tsx
const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'user',
    password: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Check if current user can edit a specific user
  const canEdit = (targetUser: User): boolean => {
    if (!currentUser) return false;

    // Admin can edit all users
    if (currentUser.role === 'admin') return true;

    // Moderator can edit basic users and themselves
    if (currentUser.role === 'moderator') {
      return targetUser.role === 'user' || targetUser.id === currentUser.id;
    }

    // Basic users can only edit themselves
    return targetUser.id === currentUser.id;
  };

  // Check if current user can delete a specific user
  const canDelete = (targetUser: User): boolean => {
    if (!currentUser) return false;

    // Admin can delete all users except themselves
    if (currentUser.role === 'admin') {
      return targetUser.id !== currentUser.id;
    }

    // Moderator can delete basic users
    if (currentUser.role === 'moderator') {
      return targetUser.role === 'user';
    }

    // Basic users cannot delete any users
    return false;
  };

  // Other implementation details...
};
```

### User Creation Form

```tsx
{/* Create/Edit User Modal */}
{(mode === 'create' || mode === 'edit') && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl w-[520px] overflow-hidden">
      <div className="px-12 py-4 border-b">
        <h3 className="text-lg font-medium">{mode === 'create' ? 'Create User' : 'Edit User'}</h3>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="px-12 py-8 space-y-8 bg-gray-50">
          <div className="space-y-2">
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              value={editForm.first_name}
              onChange={handleInputChange}
              className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
            />
          </div>
          {/* Other form fields... */}
          {/* Role field (conditionally rendered based on permissions) */}
          {currentUser && mode === 'create' && currentUser.role === 'admin' && (
            <div className="space-y-2">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                id="role"
                value={editForm.role}
                onChange={handleInputChange}
                className="block w-[448px] border border-gray-300 rounded-md shadow-sm py-1.5 px-3 bg-white"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
        </div>
        <div className="px-12 py-4 bg-white border-t flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setMode(null);
              setEditingUser(null);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

## First-Time Setup

When the application is first launched with no users in the database, it prompts for admin account creation:

```typescript
// Check if this is first-time setup (no users exist)
router.get('/check-first-user', async (req, res) => {
  try {
    const isFirstUser = await checkFirstUser();
    res.json({ isFirstUser });
  } catch (error) {
    console.error('Error checking first user:', error);
    res.status(500).json({ message: 'Error checking first user status' });
  }
});

// First-time admin setup
router.post('/init-admin', async (req, res) => {
  try {
    const isFirstUser = await checkFirstUser();
    if (!isFirstUser) {
      return res.status(403).json({ message: 'Admin already exists' });
    }

    const { first_name, last_name, email, password } = req.body;
    
    // Validate email format
    if (!email?.includes('@')) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    
    if (password.length < minLength || !hasLowerCase || !hasUpperCase) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain both uppercase and lowercase letters'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role: 'admin'
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Error creating admin user' });
  }
});
```

## Password Requirements

All passwords in the system must meet the following requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter

These requirements are enforced on both the frontend and backend to ensure consistency.

## Audit Logging

All user management actions are logged in the audit system:

1. **User Creation**
   - Actor: The user who created the new user
   - Target: The newly created user
   - Metadata: Email and role of the new user

2. **User Updates**
   - Actor: The user who made the changes
   - Target: The user being updated
   - Metadata: Field-by-field changes (old value → new value)

3. **User Deletion**
   - Actor: The user who performed the deletion
   - Target: The deleted user
   - Metadata: Email and role of the deleted user

This audit trail provides accountability and traceability for all user management operations.
