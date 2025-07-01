# Config2Page

A role-based user management system with audit logging capabilities, built with React, Express.js, and PostgreSQL.

## Features

- 🔐 Role-based access control (Admin, Moderator, User)
- 👥 User management with permissions
- 📝 Audit logging for user actions
- 🎨 Responsive UI with Tailwind CSS
- 🔒 Secure authentication with JWT
- 🛡️ TypeScript for type safety
- 🐘 PostgreSQL with Prisma ORM
- 🐳 Docker support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/config2page.git
   cd config2page
   ```

2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Backend
   cd server
   cp .env.example .env
   # Edit .env with your database credentials

   # Frontend
   cd ../client
   cp .env.example .env
   ```

4. Run database migrations:
   ```bash
   cd server
   npx prisma migrate dev
   ```

5. Start the development servers:
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   npm start
   ```

6. Open http://localhost:3000 in your browser

### Docker Setup

Run the entire application stack using Docker Compose:

```bash
docker-compose up -d
```

## Documentation

Detailed documentation is available in the `memory-bank` folder:

- [Architecture Overview](memory-bank/01-architecture.md)
  - System design
  - Tech stack
  - Directory structure

- [Authentication & Authorization](memory-bank/02-auth.md)
  - Authentication flow
  - Role-based access control
  - JWT implementation

- [User Management](memory-bank/03-user-management.md)
  - User model
  - CRUD operations
  - Permission system

- [Audit Logging](memory-bank/04-audit-logging.md)
  - Event tracking
  - Data structure
  - Implementation details

- [API Documentation](memory-bank/05-api.md)
  - Endpoints
  - Request/Response formats
  - Error handling

- [Frontend Components](memory-bank/06-frontend.md)
  - Component architecture
  - State management
  - UI/UX design

## Project Structure

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

## Available Scripts

### Backend

```bash
cd server

# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database
npx prisma migrate dev    # Create migration
npx prisma migrate reset  # Reset database
npx prisma generate      # Generate Prisma client
```

### Frontend

```bash
cd client

# Development
npm start

# Build
npm run build

# Tests
npm test

# Type checking
npm run typecheck
```

## Environment Variables

### Backend (.env)

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

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
