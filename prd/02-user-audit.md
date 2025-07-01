# 🔧 PRD — Audit Logging System for User Management App

---

## 📌 Overview

This document covers the **Audit Logging** module, a new page accessible only to **Admins**, designed to provide a comprehensive, read-only view of user activities across the platform. This module will be integrated as part of the left navigation menu and improve transparency and traceability within the system.

---

## 📋 Goals

- Maintain an audit trail of important activities
- Track user login sessions
- Monitor changes to user data (edit/delete)
- Ensure immutability for logs (read-only)
- Show audit logs in a user-friendly interface for Admins

---

## 🏢 Access Control

| Role      | Access Audit Page |
| --------- | ----------------- |
| Admin     | ✅                 |
| Moderator | ❌                 |
| User      | ❌                 |

- The **Audit Page** link appears in the sidebar only for Admins.

---

## 📜 Auditable Actions

The system should track:

1. **Login Activity**

   - Successful/failed logins
   - Timestamp, user ID/email, IP address

2. **User Management Actions**

   - Edit: Who edited, target user, fields changed
   - Delete: Who deleted, target user, role

All entries should be immutable and visible only to Admins.

---

## 📄 Suggested Schema for `audit_logs` Table

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER NOT NULL,
  action_type VARCHAR(50) CHECK (action_type IN ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'EDIT_USER', 'DELETE_USER')),
  target_user_id INTEGER,
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notes:

- `actor_user_id`: User who performed the action
- `target_user_id`: User on whom action was performed (nullable for logins)
- `metadata`: JSON storing field-level changes or login errors
- `ip_address`: Optional but useful for audits

---

## 🛋️ UI Design

### Audit Page (Admin Only)

- Display entries in a **sortable, searchable table**
- Columns:
  - Timestamp
  - Action Type
  - Actor (name/email)
  - Target User (if applicable)
  - Details (expandable JSON or pretty string)
- Include date filters and pagination

---

## 🔢 Backend Notes

- New Express route: `GET /audit-logs`
- Only allow access if role === 'admin'
- Support query params:
  - `?from=2024-01-01&to=2024-01-31`
  - `?action_type=EDIT_USER`
- Log entries should be written **immediately after the action is performed**

---

## ✨ Future Enhancements

- Filter by IP address or keyword
- Add login/logout duration tracking
- Support export (CSV, JSON)
- Monitor failed login attempts over time

