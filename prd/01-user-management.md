# 📍 Product Requirements Document (PRD) — User Management Web App

---

## 📌 Overview

A responsive, role-based user management web application built with **React (frontend)** and **Express.js (backend)**, using a **relational database (PostgreSQL or MySQL via RDS)**. It supports **Admin**, **Moderator**, and **User** roles with permission-based access to pages and actions. The system bootstraps with a first-user admin setup.

---

## 🎯 Goals

- Allow users to register/login via a cookie-auth system
- Display different UI views based on user roles
- Let Admins/Moderators manage users based on defined rules
- Fully responsive interface
- Backend compatible with both Postgres and MySQL
- Ready for Docker-based deployment

---

## 👤 User Roles & Permissions

| Role      | Landing Page | User Management | Can Edit                  | Can Delete            |
| --------- | ------------ | --------------- | ------------------------- | --------------------- |
| Admin     | ✅            | ✅               | All users including self  | All users except self |
| Moderator | ✅            | ✅               | Basic users + own details | Basic users only      |
| User      | ✅            | ✅               | Own details only          | ❌                     |

---

## 📅 First-Time Setup

- On first app launch, if no users are present, prompt account creation.
- The created user will be assigned the **Admin** role.

---

## 🔑 Authentication

- Login with email + password
- Backend validates credentials and issues an **HTTP-only cookie**
- Session is valid until cookie expiry
- Auth middleware protects private routes

---

## 📝 User Model (Database Schema)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'moderator', 'user')),
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Password Requirements

- Minimum 8 characters
- At least one lowercase and one uppercase character

---

## 🛋️ Pages & UI

### 1. Login Page

- Login form with email and password
- Redirects to landing page after login

### 2. Landing Page

- Welcoming themed page
- Always accessible after login

### 3. User Management Page

- Table showing all users with their roles
- **Edit Button**: Opens modal with editable fields (role-based restriction)
- **Delete Button**: Opens confirmation modal before deletion

---

## 🔧 Tech Stack

### Frontend

- React with React Router
- Context for role-based rendering
- Custom CSS for styling
- Fully responsive layout

### Backend

- Express.js
- Middleware for cookie-auth
- Compatible with PostgreSQL and MySQL
- Assumes DB schema exists

### Docker Support

- Multi-stage Dockerfile
- Docker Compose for local testing

---

## 🔢 API Overview (Planned)

- `POST /login`
- `GET /session`
- `GET /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `POST /init-admin` (only if no users exist)

---

## ✨ Design Guidelines

- Clean, modern look
- Themed landing page with minimal graphics
- Modal-based forms for editing and confirmation
- Use of hover effects, transitions, and consistent spacing

