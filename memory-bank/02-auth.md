# Authentication & Authorization

## Overview

Config2Page implements a secure authentication and authorization system using JWT (JSON Web Tokens) stored in HTTP-only cookies. This approach provides a balance between security and user experience.

## Authentication Flow

### Registration (First-Time Admin Setup)

1. When the application is first launched with no users in the database, it prompts for admin account creation
2. The system validates the email format and password requirements
3. The password is hashed using bcrypt with a salt factor of 10
4. A new user is created with the admin role
5. A JWT token is generated and stored in an HTTP-only cookie
6. The user is redirected to the landing page

### Login Process

1. User submits email and password
2. System looks up the user by email
3. If the user exists, the password is verified using bcrypt
4. On successful verification:
   - A JWT token is generated containing the user ID and role
   - The token is stored in an HTTP-only cookie with a 24-hour expiration
   - User information (excluding password) is returned to the client
5. On failed verification:
   - An audit log entry is created for the failed login attempt
   - A generic "Invalid credentials" error is returned

### Session Management

1. The frontend includes the HTTP-only cookie in all API requests
2. The authentication middleware validates the JWT token on protected routes
3. If the token is valid, the user information is attached to the request object
4. If the token is invalid or expired, a 401 Unauthorized response is returned
5. The session expires after 24 hours, requiring the user to log in again

### Logout Process

1. User initiates logout
2. The server clears the token cookie
3. An audit log entry is created for the logout event
4. The user is redirected to the login page

## Authorization System

### Role Hierarchy

Config2Page implements a three-tier role hierarchy:

1. **Admin**: Full system access
   - Can create, read, update, and delete all users
   - Cannot delete their own account
   - Has access to audit logs

2. **Moderator**: Limited management access
   - Can read all users
   - Can update their own details
   - Can update and delete basic users
   - Cannot modify other moderators or admins

3. **User**: Basic access
   - Can read all users
   - Can update their own details only
   - Cannot delete any accounts

### Permission Enforcement

Permissions are enforced at multiple levels:

1. **Frontend Level**:
   - UI elements (buttons, links) are conditionally rendered based on user role
   - Protected routes redirect unauthorized users
   - The `ProtectedRoute` component handles role-based access control

2. **API Level**:
   - Middleware functions validate user authentication and authorization
   - The `authenticate` middleware verifies the JWT token
   - The `authorize` middleware checks if the user has the required role
   - The `checkUserPermissions` middleware enforces specific rules for user operations

### Authorization Middleware

#### authenticate Middleware

```typescript
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret'
    ) as JwtPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request object
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

#### authorize Middleware

```typescript
export const authorize = (allowedRoles: ('admin' | 'moderator' | 'user')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
};
```

#### checkUserPermissions Middleware

```typescript
export const checkUserPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { user } = req;
  const targetUserId = parseInt(req.params.id);

  if (!user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Admin can edit/delete all users except self-deletion
  if (user.role === 'admin') {
    if (req.method === 'DELETE' && user.id === targetUserId) {
      return res.status(403).json({ message: 'Admins cannot delete their own account' });
    }
    return next();
  }

  // Moderator can edit basic users and their own details
  if (user.role === 'moderator') {
    if (req.method === 'DELETE') {
      // Check if target user is a basic user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId }
      });
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (targetUser.role !== 'user') {
        return res.status(403).json({ message: 'Moderators can only delete basic users' });
      }
      
      return next();
    }
    
    if (user.id === targetUserId) {
      return next();
    }
  }

  // Basic users can only edit their own details
  if (user.role === 'user') {
    if (user.id !== targetUserId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.method === 'DELETE') {
      return res.status(403).json({ message: 'Basic users cannot delete accounts' });
    }
    return next();
  }

  return res.status(403).json({ message: 'Access denied' });
};
```

## Frontend Authentication Context

The frontend uses React Context API to manage authentication state:

```typescript
// AuthContext.tsx
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configure axios to include credentials
  axios.defaults.withCredentials = true;

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if user is authenticated
  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/session`);
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    // Implementation...
  };

  // Logout function
  const logout = async (): Promise<void> => {
    // Implementation...
  };

  // Initialize admin user
  const initAdmin = async (userData: InitAdminData): Promise<void> => {
    // Implementation...
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        checkAuth,
        initAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

## Protected Routes

The `ProtectedRoute` component ensures that only authenticated users with the appropriate roles can access certain routes:

```typescript
// ProtectedRoute.tsx
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access if no specific roles are required
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
```

## Security Considerations

1. **Password Security**:
   - Passwords are hashed using bcrypt with a salt factor of 10
   - Password requirements: minimum 8 characters, at least one uppercase and one lowercase letter

2. **Token Security**:
   - JWT tokens are stored in HTTP-only cookies to prevent JavaScript access
   - Cookies are set with secure flag in production
   - Tokens expire after 24 hours

3. **API Security**:
   - CORS is configured to allow only the frontend origin
   - Input validation is performed on all API endpoints
   - Generic error messages are used to prevent information leakage

4. **Audit Logging**:
   - All authentication events (login success/failure, logout) are logged
   - IP addresses are captured for security analysis
   - User agent information is recorded for login events
