# Frontend Components

## Overview

The Config2Page frontend is built with React and TypeScript, using a component-based architecture. The UI is designed to be responsive, accessible, and user-friendly, with role-based access control integrated throughout.

## Project Structure

```
client/
├── public/            # Static files
└── src/
    ├── components/    # Reusable UI components
    ├── context/       # React Context providers
    ├── pages/         # Page components
    ├── services/      # API service functions
    ├── types/         # TypeScript type definitions
    └── utils/         # Utility functions
```

## Core Components

### Authentication Context

The `AuthContext` provides authentication state and functions throughout the application:

```tsx
// context/AuthContext.tsx
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

### Protected Route

The `ProtectedRoute` component ensures that only authenticated users with the appropriate roles can access certain routes:

```tsx
// components/ProtectedRoute.tsx
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
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

## Page Components

### Login Page

The Login page handles user authentication and first-time admin setup:

```tsx
// pages/LoginPage.tsx
const LoginPage: React.FC = () => {
  const { login, error, loading, initAdmin } = useAuth();
  const [isFirstUser, setIsFirstUser] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });
  const [adminForm, setAdminForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  // Check if this is first-time setup
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/check-first-user`);
        setIsFirstUser(response.data.isFirstUser);
      } catch (err) {
        console.error('Error checking first user:', err);
      }
    };

    checkFirstUser();
  }, []);

  // Handle login form submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/');
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  // Handle admin setup form submission
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await initAdmin(adminForm);
      navigate('/');
    } catch (err) {
      // Error is handled by the auth context
    }
  };

  // Render login or admin setup form based on isFirstUser
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isFirstUser ? 'Welcome to Config2Page' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isFirstUser ? (
            <form onSubmit={handleAdminSubmit}>
              {/* Admin setup form fields */}
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit}>
              {/* Login form fields */}
            </form>
          )}
          
          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Landing Page

The Landing page serves as the main dashboard after login:

```tsx
// pages/LandingPage.tsx
const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Config2Page</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, {user.first_name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Config2Page</h2>
          <p className="mb-6 text-gray-600">
            A role-based user management system with responsive interface.
          </p>

          {/* Role-specific welcome message */}
          {user && (
            <div className="mb-8 p-4 bg-blue-50 rounded-md">
              {user.role === 'admin' && (
                <p className="text-blue-800">
                  As an administrator, you have full access to manage all users and their permissions.
                </p>
              )}
              {user.role === 'moderator' && (
                <p className="text-blue-800">
                  As a moderator, you can manage basic users and edit your own details.
                </p>
              )}
              {user.role === 'user' && (
                <p className="text-blue-800">
                  As a user, you can view all users and edit your own details.
                </p>
              )}
            </div>
          )}

          {/* Navigation cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium mb-2">User Management</h3>
              <p className="text-gray-600 mb-4">
                View, edit, and manage users based on your role permissions.
              </p>
              <Link
                to="/users"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to User Management
              </Link>
            </div>

            <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-medium mb-2">Your Profile</h3>
              <p className="text-gray-600 mb-4">
                View and edit your personal information.
              </p>
              {user && (
                <Link
                  to={`/users/${user.id}`}
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  View Profile
                </Link>
              )}
            </div>

            {/* Audit Logs Card (Admin Only) */}
            {user?.role === 'admin' && (
              <div className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium mb-2">Audit Logs</h3>
                <p className="text-gray-600 mb-4">
                  View system activity and user action logs.
                </p>
                <Link
                  to="/audit-logs"
                  className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View Audit Logs
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
```

### User Management Page

The User Management page provides a UI for managing users based on the current user's role:

```tsx
// pages/UserManagementPage.tsx
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

  // Reset form when mode changes
  useEffect(() => {
    if (mode === 'create') {
      setEditingUser(null);
      setEditForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'user',
        password: '',
      });
    } else if (mode === 'edit') {
      // Form is already set by handleEditClick
    } else {
      // Reset form when mode is null
      setEditForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'user',
        password: '',
      });
    }
  }, [mode]);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data.users);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = { ...editForm };
      // Only include password if it's not empty
      if (payload.password === '') {
        delete payload.password;
      }

      if (mode === 'create') {
        await axios.post(`${API_URL}/users`, payload);
      } else if (mode === 'edit' && editingUser) {
        await axios.put(`${API_URL}/users/${editingUser.id}`, payload);
      }

      setMode(null);
      setEditingUser(null);
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.response?.data?.message || `Error ${mode === 'create' ? 'creating' : 'updating'} user`);
    }
  };

  // Render user management UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center space-x-4">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setMode('create')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create User
              </button>
            )}
            <Link to="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User table */}
        {/* Create/Edit User Modal */}
        {/* Delete Confirmation Modal */}
      </main>
    </div>
  );
};
```

### Audit Log Page

The Audit Log page provides a comprehensive view of system activities with filtering and pagination:

```tsx
// pages/AuditLogPage.tsx
const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    action_type: ''
  });
  const [pagination, setPagination] = useState<AuditPagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Fetch logs on component mount and when filters/pagination change
  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format metadata for display
  const formatMetadata = (metadata: any): string => {
    if (!metadata) return 'No details';
    
    if (metadata.changes) {
      return metadata.changes.map((change: any) => (
        `${change.field}: ${change.oldValue} → ${change.newValue}`
      )).join(', ');
    }
    
    if (metadata.reason) {
      return `Reason: ${metadata.reason}`;
    }
    
    if (metadata.user_details) {
      return `User: ${metadata.user_details.email} (${metadata.user_details.role})`;
    }
    
    if (metadata.browser) {
      return `Browser: ${metadata.browser}`;
    }
    
    return JSON.stringify(metadata);
  };

  // Get action type color
  const getActionTypeColor = (actionType: string): string => {
    switch (actionType) {
      case AUDIT_TYPES.LOGIN_SUCCESS:
        return 'bg-green-100 text-green-800';
      case AUDIT_TYPES.LOGIN_FAILURE:
        return 'bg-red-100 text-red-800';
      case AUDIT_TYPES.CREATE_USER:
        return 'bg-blue-100 text-blue-800';
      case AUDIT_TYPES.EDIT_USER:
        return 'bg-yellow-100 text-yellow-800';
      case AUDIT_TYPES.DELETE_USER:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Fetch logs with filters and pagination
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.from) queryParams.append('from', filters.from);
      if (filters.to) queryParams.append('to', filters.to);
      if (filters.action_type) queryParams.append('action_type', filters.action_type);
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      const response = await axios.get(`${API_URL}/audit/logs?${queryParams.toString()}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Render audit log UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        {/* Logs table */}
        {/* Pagination */}
      </main>
    </div>
  );
};
```

## App Routing

The main App component sets up the routing structure:

```tsx
// App.tsx
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect to login for unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};
```

## TypeScript Types

### User Type

```typescript
// context/AuthContext.tsx
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
  updated_at: string;
}
```

### Audit Log Types

```typescript
// types/audit.ts
export interface AuditLog {
  id: number;
  action_type: string;
  actor_user_id: number;
  target_user_id?: number;
  metadata: any;
  ip_address?: string;
  created_at: string;
  actor: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
  target?: Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;
}

export interface AuditPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuditResponse {
  logs: AuditLog[];
  pagination: AuditPagination;
}

export const AUDIT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CREATE_USER: 'CREATE_USER',
  EDIT_USER: 'EDIT_USER',
  DELETE_USER: 'DELETE_USER',
} as const;

export type AuditActionType = typeof AUDIT_TYPES[keyof typeof AUDIT_TYPES];
```

## Styling

The application uses Tailwind CSS for styling, providing a responsive and modern UI:

- Consistent color scheme
- Responsive layout for all screen sizes
- Accessible form controls
- Interactive elements with hover/focus states
- Modal dialogs for forms and confirmations
- Loading indicators for async operations

## Best Practices

1. **Component Structure**
   - Functional components with hooks
   - Clear separation of concerns
   - Reusable components for common UI elements

2. **State Management**
   - Context API for global state
   - Local state for component-specific data
   - Proper loading and error states

3. **TypeScript Integration**
   - Strong typing for all components and functions
   - Interface definitions for data structures
   - Type guards for conditional rendering

4. **Performance Optimization**
   - Memoization for expensive calculations
   - Pagination for large data sets
   - Conditional rendering to minimize DOM updates

5. **Security**
   - Role-based access control
   - Input validation
   - Secure authentication flow

## Future Enhancements

1. **UI Improvements**
   - Dark mode support
   - Customizable themes
   - Improved accessibility features

2. **Performance**
   - Code splitting for faster initial load
   - Virtualized lists for large data sets
   - Optimized bundle size

3. **Features**
   - User profile images
   - Advanced filtering and sorting
   - Export functionality for data tables
