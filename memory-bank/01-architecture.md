# Config2Page Architecture

## Overview
Config2Page is a role-based user management system built with modern web technologies. It provides a secure and scalable foundation for managing users, roles, and audit logs.

## Tech Stack

### Backend
- **Node.js & Express.js**: Server framework
- **TypeScript**: Type-safe development
- **Prisma**: ORM for database operations
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **cookie-parser**: HTTP-only cookie management

### Frontend
- **React**: UI framework
- **TypeScript**: Type-safe development
- **React Router**: Client-side routing
- **Context API**: State management
- **Tailwind CSS**: Styling
- **Axios**: HTTP client

## System Architecture

### Core Components

1. **Authentication System**
   - JWT-based authentication
   - HTTP-only cookie storage
   - Role-based access control
   - Session management

2. **User Management**
   - Role hierarchy (Admin > Moderator > User)
   - Permission-based actions
   - User CRUD operations
   - Profile management

3. **Audit System**
   - Activity logging
   - User action tracking
   - System event monitoring
   - Audit trail maintenance

### Database Schema

```prisma
// User Model
model User {
  id         Int       @id @default(autoincrement())
  first_name String    @db.VarChar(100)
  last_name  String    @db.VarChar(100)
  email      String    @unique @db.VarChar(255)
  password   String    @db.Text
  role       Role      @default(user)
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  actorLogs  AuditLog[] @relation("ActorLogs")
  targetLogs AuditLog[] @relation("TargetLogs")

  @@map("users")
}

// Audit Log Model
model AuditLog {
  id            Int      @id @default(autoincrement())
  actor_user_id Int
  action_type   String
  target_user_id Int?
  metadata      Json
  ip_address    String?  @db.VarChar(45)
  created_at    DateTime @default(now())
  
  actor         User     @relation("ActorLogs", fields: [actor_user_id], references: [id])
  target        User?    @relation("TargetLogs", fields: [target_user_id], references: [id])
  
  @@index([action_type])
  @@index([created_at])
  @@map("audit_logs")
}

// Role Enum
enum Role {
  admin
  moderator
  user
}
```

## Directory Structure

```
config2page/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable React components
│       ├── context/      # React Context providers
│       ├── pages/        # Page components
│       ├── services/     # API services
│       ├── types/        # TypeScript type definitions
│       └── utils/        # Utility functions
│
├── server/                # Backend Express application
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # Data models
│   ├── prisma/          # Prisma schema and migrations
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utility functions
│
├── docker/               # Docker configuration
├── prd/                 # Product requirement documents
└── memory-bank/         # Technical documentation
```

## Security Measures

1. **Authentication**
   - Secure password hashing with bcrypt
   - HTTP-only cookies for JWT storage
   - CORS configuration
   - Rate limiting

2. **Authorization**
   - Role-based access control
   - Route protection middleware
   - Permission validation

3. **Data Protection**
   - Input validation
   - SQL injection prevention (Prisma)
   - XSS protection
   - CSRF protection

## Development Workflow

1. **Local Development**
   ```bash
   # Start backend
   cd server
   npm install
   npm run dev

   # Start frontend
   cd client
   npm install
   npm start
   ```

2. **Database Management**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Create migration
   npx prisma migrate dev

   # Apply migrations
   npx prisma migrate deploy
   ```

3. **Docker Development**
   ```bash
   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f
   ```

## Deployment

The application is containerized using Docker and can be deployed using Docker Compose or Kubernetes. Each component (frontend, backend, database) is isolated in its own container for better scalability and maintenance.
