# API Documentation

## Base URL

The API base URL is: `http://localhost:5000/api` (development) or your production domain.

## Authentication

All API requests (except `/auth/check-first-user` and `/auth/init-admin`) require authentication via JWT token stored in an HTTP-only cookie.

### Error Responses

When authentication fails:
```json
{
  "message": "Authentication required"
}
```

When authorization fails:
```json
{
  "message": "Access denied"
}
```

## Authentication Endpoints

### Check First-Time Setup
Check if this is the first time running the application (no users exist).

**Endpoint:** `GET /auth/check-first-user`  
**Access:** Public

**Response:**
```json
{
  "isFirstUser": true
}
```

### Initialize Admin
Create the first admin user during initial setup.

**Endpoint:** `POST /auth/init-admin`  
**Access:** Public (only when no users exist)

**Request Body:**
```json
{
  "first_name": "Admin",
  "last_name": "User",
  "email": "admin@example.com",
  "password": "AdminPass123"
}
```

**Response:**
```json
{
  "message": "Admin user created successfully",
  "user": {
    "id": 1,
    "first_name": "Admin",
    "last_name": "User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### Login
Authenticate a user and create a session.

**Endpoint:** `POST /auth/login`  
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2025-04-12T20:11:14.000Z",
    "updated_at": "2025-04-12T20:11:14.000Z"
  }
}
```

### Get Current Session
Get the currently authenticated user's information.

**Endpoint:** `GET /auth/session`  
**Access:** Authenticated users

**Response:**
```json
{
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "user",
    "created_at": "2025-04-12T20:11:14.000Z",
    "updated_at": "2025-04-12T20:11:14.000Z"
  }
}
```

### Logout
End the current user session.

**Endpoint:** `POST /auth/logout`  
**Access:** Authenticated users

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## User Management Endpoints

### Create User
Create a new user (admin only).

**Endpoint:** `POST /users`  
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

### Get All Users
Get a list of all users.

**Endpoint:** `GET /users`  
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
Get a specific user's details.

**Endpoint:** `GET /users/:id`  
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
Update a user's details.

**Endpoint:** `PUT /users/:id`  
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
Delete a user.

**Endpoint:** `DELETE /users/:id`  
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

## Audit Log Endpoints

### Get Audit Logs
Get a paginated list of audit logs with optional filtering.

**Endpoint:** `GET /audit/logs`  
**Access:** Admin only

**Query Parameters:**
- `from` (optional): Start date (ISO format)
- `to` (optional): End date (ISO format)
- `action_type` (optional): Type of action to filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "action_type": "LOGIN_SUCCESS",
      "actor_user_id": 1,
      "target_user_id": 1,
      "metadata": {
        "browser": "Mozilla/5.0..."
      },
      "ip_address": "192.168.1.1",
      "created_at": "2025-04-12T20:11:14.000Z",
      "actor": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
      },
      "target": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

## Error Handling

All endpoints follow a consistent error response format:

### Validation Error
```json
{
  "message": "Invalid email format"
}
```

### Not Found Error
```json
{
  "message": "User not found"
}
```

### Permission Error
```json
{
  "message": "Only admin can create users"
}
```

### Server Error
```json
{
  "message": "Error creating user"
}
```

## HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (not authorized)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

## CORS Configuration

CORS is configured to allow requests only from the frontend origin:
- Development: `http://localhost:3000`
- Production: Your production domain

## Environment Variables

The API requires the following environment variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/config2page

# JWT Configuration
JWT_SECRET=your-secret-key

# Cookie Configuration
COOKIE_SECRET=your-cookie-secret

# CORS Configuration
CLIENT_URL=http://localhost:3000
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Testing the API

You can use tools like Postman or curl to test the API endpoints. Here's an example using curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPass123"}' \
  -c cookies.txt

# Get users (using saved cookie)
curl http://localhost:5000/api/users \
  -b cookies.txt
```

## WebSocket Support

The API does not currently implement WebSocket connections. All communication is done through HTTP requests.
