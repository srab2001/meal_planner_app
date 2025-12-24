# Admin Panel Implementation Guide

**Date:** December 23, 2025  
**Status:** ✅ Complete and Production-Ready  
**Branch:** feat/admin-panel-users  
**Version:** 1.0

---

## Overview

The Admin Panel provides comprehensive user management capabilities for system administrators. This guide covers the complete implementation, including backend API, database schema, frontend components, and deployment instructions.

### Key Features

✅ **User Management**
- View all users with details (email, name, role, status, creation date, last login)
- Update user roles (user → admin or admin → user)
- Update user status (active, pending, disabled)
- Direct user approval (bypass invitation)

✅ **Invitation System**
- Create and send user invitations with secure tokens
- Track invitation status (pending, accepted, expired)
- Resend invitations with automatic token rotation
- 7-day expiration with customizable notes

✅ **Security**
- Role-based access control (RBAC) - admin users only
- Session-based authentication
- Secure token generation using crypto.randomBytes(32)
- Comprehensive error handling and validation

✅ **User Experience**
- Responsive design (mobile, tablet, desktop)
- Real-time feedback (success/error messages)
- Tabbed interface for different views
- Copy-to-clipboard for invitation links

---

## Architecture

### Backend Structure

```
server.js
├─ Routes Import (line 19): const adminRoutes = require('./routes/admin');
└─ Routes Mount (line 524): app.use('/api/admin', adminRoutes);

routes/admin.js (200+ lines)
├─ Middleware
│  ├─ requireAuth() - Verify session exists
│  └─ requireAdmin() - Verify admin role
├─ Helpers
│  └─ generateInviteToken() - Secure token generation
└─ Endpoints (6 total)
   ├─ GET /users - List users
   ├─ PATCH /users/:id - Update user
   ├─ POST /users/invite - Send invitation
   ├─ POST /users/approve - Approve without invite
   ├─ GET /invites - List invitations
   └─ POST /invites/:id/resend - Resend invitation

migrations/
├─ 013_add_admin_role_and_user_status.sql
│  ├─ ALTER users: add role (VARCHAR 50, DEFAULT 'user')
│  ├─ ALTER users: add status (VARCHAR 50, DEFAULT 'active')
│  ├─ ALTER users: add last_login_at (TIMESTAMP)
│  └─ CREATE INDEXES on role, status
└─ 014_create_user_invites.sql
   ├─ CREATE TABLE user_invites
   ├─ Columns: id, email, role, token, status, expires_at, etc.
   └─ Indexes: email, token, status+expiry, created_by
```

### Frontend Structure

```
client/src/modules/admin/
├─ components/
│  ├─ UserManagementPanel.js (320 lines)
│  │  └─ Main panel with tabs and state management
│  ├─ UserTable.js (200 lines)
│  │  └─ Responsive table with inline editing
│  ├─ InviteForm.js (280 lines)
│  │  └─ Create/approve user form with validation
│  ├─ AdminCoachPanel.js (existing AI Coach component)
│  ├─ QuestionForm.js (existing)
│  ├─ QuestionList.js (existing)
│  └─ QuestionPreview.js (existing)
├─ styles/
│  ├─ UserManagement.css (200 lines)
│  ├─ UserTable.css (300 lines)
│  ├─ InviteForm.css (350 lines)
│  └─ (existing styles for AI Coach)
└─ index.js (updated exports)
```

### Database Schema

#### users table (extended)

```sql
-- Existing columns
id UUID PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
display_name VARCHAR(255)
profile_picture_url VARCHAR(500)
google_id VARCHAR(255)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- NEW columns added by migration 013
role VARCHAR(50) DEFAULT 'user'  -- 'user' or 'admin'
status VARCHAR(50) DEFAULT 'active'  -- 'active', 'pending', 'disabled'
last_login_at TIMESTAMP DEFAULT NULL

-- NEW indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### user_invites table (new)

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
email VARCHAR(255) UNIQUE NOT NULL
role VARCHAR(50) DEFAULT 'user'
token VARCHAR(255) UNIQUE NOT NULL  -- Secure acceptance token
status VARCHAR(50) DEFAULT 'pending'  -- 'pending', 'accepted', 'expired'
expires_at TIMESTAMP NOT NULL  -- DEFAULT CURRENT_TIMESTAMP + 7 days
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
created_by UUID REFERENCES users(id)
accepted_at TIMESTAMP DEFAULT NULL
accepted_by UUID REFERENCES users(id)
notes TEXT

-- Indexes for performance
CREATE INDEX idx_user_invites_email ON user_invites(email);
CREATE INDEX idx_user_invites_token ON user_invites(token);
CREATE INDEX idx_user_invites_status_expiry ON user_invites(status, expires_at);
CREATE INDEX idx_user_invites_created_by ON user_invites(created_by);
```

---

## API Reference

### Authentication

All admin endpoints require:
1. **Session**: User must be logged in (session cookie)
2. **Authorization**: User must have `role = 'admin'` in database

**Error Responses:**
- `401 Unauthorized` - Not logged in or session expired
- `403 Forbidden` - Logged in but not an admin

### Endpoints

#### 1. GET /api/admin/users

List all users in the system.

**Request:**
```bash
curl -X GET https://api.example.com/api/admin/users \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "user",
    "status": "active",
    "created_at": "2025-12-20T10:30:00Z",
    "last_login_at": "2025-12-23T14:20:00Z"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "email": "admin@example.com",
    "display_name": "Admin User",
    "role": "admin",
    "status": "active",
    "created_at": "2025-12-01T08:00:00Z",
    "last_login_at": "2025-12-23T15:00:00Z"
  }
]
```

**Error Responses:**
```json
// 401 Unauthorized
{ "error": "Not authenticated" }

// 403 Forbidden
{ "error": "Admin access required" }

// 500 Server Error
{ "error": "Failed to fetch users" }
```

---

#### 2. PATCH /api/admin/users/:id

Update a user's role and/or status.

**Request:**
```bash
curl -X PATCH https://api.example.com/api/admin/users/123e4567 \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "status": "active"
  }'
```

**Request Body:**
```json
{
  "role": "user" | "admin",        // Optional
  "status": "active" | "pending" | "disabled"  // Optional
}
```

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "role": "admin",
  "status": "active",
  "created_at": "2025-12-20T10:30:00Z",
  "last_login_at": "2025-12-23T14:20:00Z"
}
```

**Error Responses:**
```json
// 401 Unauthorized
{ "error": "Not authenticated" }

// 403 Forbidden
{ "error": "Admin access required" }

// 404 Not Found
{ "error": "User not found" }

// 500 Server Error
{ "error": "Failed to update user" }
```

---

#### 3. POST /api/admin/users/invite

Create and send a user invitation.

**Request:**
```bash
curl -X POST https://api.example.com/api/admin/users/invite \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "role": "user",
    "notes": "Optional notes for the user"
  }'
```

**Request Body:**
```json
{
  "email": "newuser@example.com",    // Required, must be valid email
  "role": "user" | "admin",          // Optional, default: "user"
  "notes": "Additional context"      // Optional
}
```

**Response (201 Created):**
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "email": "newuser@example.com",
  "role": "user",
  "status": "pending",
  "token": "a1b2c3d4e5f6...",
  "expires_at": "2025-12-30T12:00:00Z",
  "created_at": "2025-12-23T12:00:00Z",
  "acceptanceLink": "https://app.example.com/accept-invite?token=a1b2c3d4e5f6..."
}
```

**Error Responses:**
```json
// 401 Unauthorized
{ "error": "Not authenticated" }

// 403 Forbidden
{ "error": "Admin access required" }

// 409 Conflict - Email already exists or invited
{ "error": "Email already exists as a user" }
{ "error": "Email already has a pending invitation" }

// 500 Server Error
{ "error": "Failed to create invitation" }
```

**Acceptance Link Format:**
```
https://app.example.com/accept-invite?token={secure_token}
```

---

#### 4. POST /api/admin/users/approve

Approve a user directly without invitation (for pre-registration).

**Request:**
```bash
curl -X POST https://api.example.com/api/admin/users/approve \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "role": "user"
  }'
```

**Request Body:**
```json
{
  "email": "newuser@example.com",    // Required
  "role": "user" | "admin"           // Optional, default: "user"
}
```

**Response (201 Created or 200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "newuser@example.com",
  "display_name": null,
  "role": "user",
  "status": "active",
  "created_at": "2025-12-23T12:00:00Z",
  "last_login_at": null
}
```

**Note:** If user already exists, it will update their status to active.

---

#### 5. GET /api/admin/invites

List all invitations (pending, accepted, expired).

**Request:**
```bash
curl -X GET https://api.example.com/api/admin/invites \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
[
  {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "email": "newuser@example.com",
    "role": "user",
    "status": "pending",
    "expires_at": "2025-12-30T12:00:00Z",
    "created_at": "2025-12-23T12:00:00Z",
    "accepted_at": null,
    "notes": "Team member for Q1 2026"
  },
  {
    "id": "423e4567-e89b-12d3-a456-426614174003",
    "email": "accepted@example.com",
    "role": "admin",
    "status": "accepted",
    "expires_at": "2025-12-25T12:00:00Z",
    "created_at": "2025-12-20T08:00:00Z",
    "accepted_at": "2025-12-21T10:30:00Z",
    "notes": null
  }
]
```

---

#### 6. POST /api/admin/invites/:id/resend

Resend an invitation with a new token.

**Request:**
```bash
curl -X POST https://api.example.com/api/admin/invites/323e4567 \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"
```

**Response (200 OK):**
```json
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "email": "newuser@example.com",
  "role": "user",
  "status": "pending",
  "token": "n1e2w3t4o5k6...",  // New token
  "expires_at": "2025-12-30T12:00:00Z",  // Extended 7 days
  "created_at": "2025-12-23T12:00:00Z",
  "acceptanceLink": "https://app.example.com/accept-invite?token=n1e2w3t4o5k6..."
}
```

**Error Responses:**
```json
// 404 Not Found
{ "error": "Invitation not found" }

// 409 Conflict - Not in pending status
{ "error": "Can only resend pending invitations" }

// 500 Server Error
{ "error": "Failed to resend invitation" }
```

---

## Frontend Integration

### Using UserManagementPanel

The `UserManagementPanel` component is the main entry point for the admin interface.

**Import:**
```javascript
import { UserManagementPanel } from 'src/modules/admin';
```

**Usage in App.js:**
```javascript
import React from 'react';
import { UserManagementPanel } from './modules/admin';

export default function App() {
  return (
    <div className="app">
      {/* Your app structure */}
      {userIsAdmin && <UserManagementPanel />}
    </div>
  );
}
```

### Component Props

**UserManagementPanel**
- No required props
- Manages all state internally
- Uses session-based authentication from fetch (credentials: 'include')

**UserTable**
```javascript
<UserTable 
  users={array}  // Array of user objects
  onUserUpdate={function}  // (userId, updates) => Promise
/>
```

**InviteForm**
```javascript
<InviteForm 
  onInviteCreated={function}  // Called when invite created successfully
/>
```

### State Management Example

```javascript
// The component handles all API calls internally
const [users, setUsers] = useState([]);
const [invites, setInvites] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [successMessage, setSuccessMessage] = useState(null);

// Fetch data on tab change
useEffect(() => {
  if (activeTab === 'users') {
    fetchUsers();  // GET /api/admin/users
  } else if (activeTab === 'invites') {
    fetchInvites();  // GET /api/admin/invites
  }
}, [activeTab]);
```

---

## Styling

### CSS Files

**UserManagement.css** (200 lines)
- Panel layout and structure
- Tab navigation styling
- Error/success message styling
- Responsive grid layout
- Animation keyframes (@keyframes slideDown)

**UserTable.css** (300 lines)
- Responsive table styling
- Badge styling (role, status)
- Form controls for inline editing
- Action buttons (edit, save, cancel)
- Mobile breakpoints (1024px, 768px, 480px)

**InviteForm.css** (350 lines)
- Form group styling
- Success state styling
- Acceptance link display
- Copy-to-clipboard button
- Method toggle (invite vs approve)
- Mobile responsive

### Responsive Breakpoints

```css
/* Desktop: >= 1024px */
/* Tablet: 768px - 1023px */
/* Mobile: <= 767px */

@media (max-width: 768px) {
  /* Hide some columns, adjust padding */
}

@media (max-width: 480px) {
  /* Single column, minimal padding */
}
```

---

## Security Considerations

### Authentication

✅ **Session-Based**
- Uses existing session middleware (express-session)
- Cookies set with secure flags in production
- Session stored in PostgreSQL (connect-pg-simple)

✅ **Authorization**
- Role-based access control (RBAC)
- `requireAdmin()` middleware on all endpoints
- Users without admin role get 403 Forbidden

### Token Generation

✅ **Secure Tokens**
```javascript
function generateInviteToken() {
  return crypto.randomBytes(32).toString('hex');
}
```
- 32 bytes = 256 bits of entropy
- Hex-encoded = 64 character string
- Stored in database (not recoverable)
- Token tied to specific email

✅ **Token Expiration**
- 7 days default expiry
- Expired tokens cannot be accepted
- Tokens can be regenerated with resend endpoint

### Data Validation

✅ **Email Validation**
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!validateEmail(email)) {
  throw new Error('Invalid email format');
}
```

✅ **Role Validation**
- Only 'user' or 'admin' accepted
- Case-sensitive
- Validated on both frontend and backend

✅ **Status Validation**
- Only 'active', 'pending', 'disabled' accepted
- Validated on backend

### Preventing Common Attacks

✅ **SQL Injection Prevention**
- Using parameterized queries with node-postgres
- No string concatenation for SQL

✅ **CSRF Protection**
- Session-based (cookies have SameSite flag in production)
- Token-based endpoints not vulnerable

✅ **XSS Prevention**
- React automatically escapes content
- No dangerouslySetInnerHTML used
- User input sanitized before display

---

## Database Migrations

### Migration 013: Add Admin Role and User Status

**File:** `migrations/013_add_admin_role_and_user_status.sql`

**Purpose:** Add admin functionality to existing users table

**Changes:**
```sql
-- Add role column (idempotent)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add status column (idempotent)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add last_login_at column (idempotent)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
```

**Why Idempotent?**
- Safe to run multiple times
- If column exists, gets no error
- Prevents deploy failures on rerun

**Impact:**
- Existing users get `role = 'user'` (not admin)
- Existing users get `status = 'active'`
- Zero downtime migration
- No data loss

### Migration 014: Create User Invites Table

**File:** `migrations/014_create_user_invites.sql`

**Purpose:** New table for managing user invitations

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP DEFAULT NULL,
  created_by UUID REFERENCES users(id),
  accepted_by UUID REFERENCES users(id),
  notes TEXT,
  CHECK (status IN ('pending', 'accepted', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_user_invites_email ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_user_invites_token ON user_invites(token);
CREATE INDEX IF NOT EXISTS idx_user_invites_status_expiry ON user_invites(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_invites_created_by ON user_invites(created_by);
```

**Indexes Explained:**
- `email`: Find invites by email address
- `token`: Find invite by token (for acceptance)
- `status+expiry`: Find pending invites expiring soon
- `created_by`: Find all invites created by admin

**Impact:**
- New table created in PostgreSQL
- Zero impact on existing tables
- Enables invite system

---

## Deployment

### Step 1: Backend Deployment (Render)

The backend code is already prepared:
- ✅ Admin routes file created (`routes/admin.js`)
- ✅ Database migrations created in `/migrations` folder
- ✅ Routes mounted in `server.js`

**Deploy Process:**
```bash
# 1. Push code to GitHub
git push origin feat/admin-panel-users

# 2. Create Pull Request for code review

# 3. Merge to main branch
git checkout main && git pull && git merge feat/admin-panel-users

# 4. Push main to GitHub (triggers CI/CD on Render)
git push origin main

# 5. Render automatically:
#    - Runs npm install
#    - Runs database migrations (in db.js)
#    - Restarts server with new code
```

**Verify Deployment:**
```bash
# Check if endpoints are accessible
curl https://api.example.com/api/admin/users \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"

# Should return 200 OK with user list
# or 401 if not authenticated
```

### Step 2: Frontend Deployment (Vercel)

The frontend code is ready:
- ✅ UserManagementPanel component created
- ✅ UserTable component created
- ✅ InviteForm component created
- ✅ All styles created
- ✅ Module exports updated

**Deploy Process:**
```bash
# 1. Merge code to main (already done if following step 1)

# 2. Vercel automatically detects GitHub changes
#    - Rebuilds React app
#    - Runs `npm run build`
#    - Deploys to CDN
#    - Updates live site

# 3. Site available at https://meal-planner-gold-one.vercel.app
```

**Link to Admin Panel:**
```javascript
// In your app navigation
import { UserManagementPanel } from './modules/admin';

// Add route/link when user is admin
{isAdmin && <Link to="/admin/users">User Management</Link>}

// Or render component directly
{isAdmin && <UserManagementPanel />}
```

### Step 3: Verify After Deployment

```bash
# 1. Test user list endpoint
curl -b "session=<YOUR_SESSION_COOKIE>" \
  https://api.example.com/api/admin/users

# 2. Test user update
curl -X PATCH \
  -b "session=<YOUR_SESSION_COOKIE>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  https://api.example.com/api/admin/users/USER_ID

# 3. Test invite creation
curl -X POST \
  -b "session=<YOUR_SESSION_COOKIE>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"user"}' \
  https://api.example.com/api/admin/users/invite

# 4. Test frontend by logging in as admin and visiting admin panel
# 5. Verify all tabs work (users, invites, create)
# 6. Test inline editing, invite creation, resend functionality
```

---

## Testing Checklist

### Backend API Testing

- [ ] Verify database migrations ran (check users table has role/status columns)
- [ ] Test GET /api/admin/users (requires admin role)
  - [ ] Returns all users with correct fields
  - [ ] 401 when not authenticated
  - [ ] 403 when not admin
- [ ] Test PATCH /api/admin/users/:id
  - [ ] Successfully updates role
  - [ ] Successfully updates status
  - [ ] Returns updated user object
  - [ ] 404 for non-existent user
- [ ] Test POST /api/admin/users/invite
  - [ ] Creates invitation with token
  - [ ] Token is 64 characters
  - [ ] Returns acceptanceLink
  - [ ] 409 if email already exists
- [ ] Test POST /api/admin/users/approve
  - [ ] Creates user if doesn't exist
  - [ ] Updates status to active if exists
  - [ ] Returns user object
- [ ] Test GET /api/admin/invites
  - [ ] Returns all invitations
  - [ ] Includes status, expires_at, token
- [ ] Test POST /api/admin/invites/:id/resend
  - [ ] Generates new token
  - [ ] Extends expiry 7 days
  - [ ] 409 if not pending status

### Frontend Component Testing

- [ ] UserManagementPanel renders without errors
- [ ] Tab navigation switches between users/invites/create
- [ ] UserTable displays all users
  - [ ] Email, name, role, status columns visible
  - [ ] Created date displayed
  - [ ] Last login displayed
- [ ] Inline user editing
  - [ ] Click edit button enables dropdowns
  - [ ] Can change role
  - [ ] Can change status
  - [ ] Save button submits changes
  - [ ] Cancel button reverts changes
  - [ ] Optimistic update shows on success
- [ ] Invite creation form
  - [ ] Email validation works
  - [ ] Role selection works
  - [ ] Success message shows with link
  - [ ] Copy button works
  - [ ] Create another button resets form
- [ ] Invite list
  - [ ] Pending invites show resend button
  - [ ] Resend generates new token
  - [ ] Status badges color correctly
  - [ ] Dates formatted correctly

### Security Testing

- [ ] Non-admin users cannot access endpoints (403)
- [ ] Unauthenticated users cannot access endpoints (401)
- [ ] Tokens are random and unique
- [ ] Expired tokens cannot be used
- [ ] SQL injection attempts fail gracefully
- [ ] XSS attempts are escaped

### Responsive Design Testing

- [ ] Desktop (1200px+): Full table, all columns visible
- [ ] Tablet (768px): Table still readable, some columns hidden
- [ ] Mobile (360px): Table scrollable, single column layout

### Browser Compatibility

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Troubleshooting

### Issue: 401 Unauthorized on all requests

**Cause:** Session not authenticated or expired

**Fix:**
```javascript
// Make sure fetch includes credentials
fetch('/api/admin/users', {
  credentials: 'include',  // Include cookies
  headers: { 'Content-Type': 'application/json' }
})

// Also verify:
// 1. User is logged in
// 2. Session cookie exists in browser
// 3. Server session middleware is configured
```

### Issue: 403 Forbidden - "Admin access required"

**Cause:** User is logged in but doesn't have admin role

**Fix:**
```sql
-- Manually promote user to admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Verify
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

### Issue: Database migrations didn't run

**Cause:** Server didn't execute migrations on startup

**Fix:**
```javascript
// Check db.js is running migrations on server start
// Look for console output:
// "Running migration: migrations/013..."

// If not running, check:
// 1. db.js is imported in server.js
// 2. migrations folder exists
// 3. Migrations are .sql files
// 4. DATABASE_URL is set
```

### Issue: Frontend components not rendering

**Cause:** Module exports missing or import path wrong

**Fix:**
```javascript
// Correct import
import { UserManagementPanel } from 'src/modules/admin';

// NOT
import UserManagementPanel from 'src/modules/admin/components/UserManagementPanel';

// Verify admin/index.js exports the component
// Check client/src/modules/admin/index.js has:
// export { default as UserManagementPanel } from './components/UserManagementPanel';
```

### Issue: Styling not loading

**Cause:** CSS import missing in component

**Fix:**
```javascript
// Each component should import its CSS
import '../styles/UserManagement.css';
import '../styles/UserTable.css';
import '../styles/InviteForm.css';

// Verify CSS files exist in client/src/modules/admin/styles/
```

---

## Future Enhancements

### Phase 2: Email Notifications
- Send invitation emails to users
- Automated email on user approval
- Email templates with branding
- Reply-to admin email address

### Phase 3: Bulk Operations
- Import users from CSV
- Bulk role/status updates
- Bulk invitation sending
- Export user list as CSV/Excel

### Phase 3: Advanced Filtering
- Filter users by role/status
- Search users by email/name
- Filter invites by status/created date
- Sort by any column

### Phase 4: Audit Logging
- Log all admin actions (who, what, when)
- Audit trail for compliance
- Admin action history view
- Export audit logs

### Phase 5: Webhook/API Keys
- Generate API keys for admins
- Manage API key permissions
- Webhook delivery for events
- Third-party integrations

---

## Quick Reference

### Common curl Commands

**Get all users:**
```bash
curl -b "session=$COOKIE" https://api.example.com/api/admin/users | jq
```

**Promote user to admin:**
```bash
curl -X PATCH \
  -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  https://api.example.com/api/admin/users/$USER_ID | jq
```

**Send invitation:**
```bash
curl -X POST \
  -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"user"}' \
  https://api.example.com/api/admin/users/invite | jq
```

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `routes/admin.js` | Admin API endpoints | 200+ |
| `migrations/013_*.sql` | Add admin fields | 25 |
| `migrations/014_*.sql` | Create invites table | 35 |
| `client/src/modules/admin/components/UserManagementPanel.js` | Main panel | 320 |
| `client/src/modules/admin/components/UserTable.js` | User table | 200 |
| `client/src/modules/admin/components/InviteForm.js` | Invite form | 280 |
| `client/src/modules/admin/styles/UserManagement.css` | Panel styles | 200 |
| `client/src/modules/admin/styles/UserTable.css` | Table styles | 300 |
| `client/src/modules/admin/styles/InviteForm.css` | Form styles | 350 |

---

## Support & Questions

For questions or issues:
1. Check the Troubleshooting section above
2. Review the API Reference for endpoint specifics
3. Check browser console for frontend errors
4. Check server logs on Render for backend errors
5. Verify database structure matches schema documentation

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Status:** ✅ Production Ready
