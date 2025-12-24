# Admin Panel Quick Reference

**Date:** December 23, 2025  
**Quick Lookup Guide for Admin Panel Implementation**

---

## 🚀 Quick Start

### For Developers

**1. Access Admin Routes**
```javascript
// Routes available at /api/admin
GET    /api/admin/users                  // List all users
PATCH  /api/admin/users/:id              // Update user role/status
POST   /api/admin/users/invite           // Send invitation
POST   /api/admin/users/approve          // Approve user
GET    /api/admin/invites                // List invites
POST   /api/admin/invites/:id/resend     // Resend invite
```

**2. Component Usage**
```javascript
import { UserManagementPanel } from 'src/modules/admin';

export default function App() {
  return userIsAdmin ? <UserManagementPanel /> : null;
}
```

**3. Test with curl**
```bash
curl -b "session=$COOKIE" https://api.example.com/api/admin/users | jq
```

---

## 🗄️ Database

### New Fields (Migration 013)
```
users table:
- role VARCHAR(50) DEFAULT 'user'
- status VARCHAR(50) DEFAULT 'active'
- last_login_at TIMESTAMP DEFAULT NULL
```

### New Table (Migration 014)
```
user_invites:
- id, email, role, token, status
- expires_at (7 days), created_at, accepted_at
- created_by (FK), accepted_by (FK), notes
```

---

## 🔐 Security

**Auth Required:** ✅ Session + Admin Role
**Token Generation:** `crypto.randomBytes(32).toString('hex')`
**Token Expiry:** 7 days
**Token Reuse:** ❌ Single use only

---

## 📝 File Structure

```
Backend:
- routes/admin.js (200+ lines)
- migrations/013_*.sql
- migrations/014_*.sql
- server.js (routes imported & mounted)

Frontend:
- components/UserManagementPanel.js
- components/UserTable.js
- components/InviteForm.js
- styles/UserManagement.css
- styles/UserTable.css
- styles/InviteForm.css
- index.js (exports all)
```

---

## ⚡ API Endpoints

### Users Endpoint
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id` | Update role/status |

### Invitations Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/users/invite` | Create & send invite |
| POST | `/api/admin/users/approve` | Approve without invite |
| GET | `/api/admin/invites` | List all invites |
| POST | `/api/admin/invites/:id/resend` | Resend with new token |

---

## 🔍 Common Operations

### Promote User to Admin
```bash
curl -X PATCH -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  https://api.example.com/api/admin/users/$USER_ID
```

### Send Invitation
```bash
curl -X POST -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"user"}' \
  https://api.example.com/api/admin/users/invite
```

### Approve User Directly
```bash
curl -X POST -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"user"}' \
  https://api.example.com/api/admin/users/approve
```

### Disable User
```bash
curl -X PATCH -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"status":"disabled"}' \
  https://api.example.com/api/admin/users/$USER_ID
```

---

## 🛠️ Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Not logged in | Login first |
| 403 Forbidden | Not an admin | Promote user to admin role |
| 409 Conflict | Email exists | Use different email |
| 404 Not Found | User doesn't exist | Check user ID |
| CSS not loading | Import missing | Check component has CSS import |

---

## 📋 User Roles & Status

### Roles
- `user` - Standard user (default)
- `admin` - Full admin access

### Status
- `active` - User can login
- `pending` - User awaiting approval
- `disabled` - User cannot login

---

## 🎨 Frontend Components

### UserManagementPanel
Main container with tabs
- Props: None
- State: users, invites, activeTab, loading, error
- Tabs: Users | Invites | Create

### UserTable
Editable user list
- Props: `users`, `onUserUpdate`
- Features: Inline edit, role/status change, save/cancel

### InviteForm
Create/approve users
- Props: `onInviteCreated`
- Methods: invite (with token) or approve (direct)
- Success: Shows acceptance link with copy button

---

## 🧪 Testing Endpoints

```bash
# 1. GET users (requires admin)
curl -b "session=$COOKIE" https://api.example.com/api/admin/users

# 2. CREATE invite
curl -X POST -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  https://api.example.com/api/admin/users/invite

# 3. VIEW invites
curl -b "session=$COOKIE" https://api.example.com/api/admin/invites

# 4. RESEND invite
curl -X POST -b "session=$COOKIE" \
  https://api.example.com/api/admin/invites/$INVITE_ID/resend

# 5. UPDATE user
curl -X PATCH -b "session=$COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","status":"active"}' \
  https://api.example.com/api/admin/users/$USER_ID
```

---

## 📱 Responsive Breakpoints

| Screen | Breakpoint | Changes |
|--------|-----------|---------|
| Desktop | >= 1024px | Full table, all columns |
| Tablet | 768-1023px | Hide dates, smaller text |
| Mobile | <= 767px | Horizontal scroll, minimal UI |

---

## 🚢 Deployment

1. **Push to GitHub**
   ```bash
   git push origin feat/admin-panel-users
   ```

2. **Create Pull Request**
   ```
   Title: Admin Panel - User Management
   Description: Complete implementation of admin user management
   ```

3. **Merge to main**
   ```bash
   git checkout main && git merge feat/admin-panel-users
   ```

4. **Deploy (automatic on Render)**
   - Migrations run automatically
   - Backend API ready
   - Frontend builds and deploys

---

## 🔗 Integration Points

**In your app navigation:**
```javascript
{userRole === 'admin' && (
  <Link to="/admin">
    Admin Panel
  </Link>
)}
```

**As a route:**
```javascript
import { UserManagementPanel } from 'src/modules/admin';

<Route path="/admin" element={<UserManagementPanel />} />
```

---

## 📊 Database Queries

### Get all admins
```sql
SELECT * FROM users WHERE role = 'admin';
```

### Get pending users
```sql
SELECT * FROM users WHERE status = 'pending';
```

### Get pending invites
```sql
SELECT * FROM user_invites WHERE status = 'pending' AND expires_at > NOW();
```

### Promote user
```sql
UPDATE users SET role = 'admin' WHERE id = $1;
```

### Disable user
```sql
UPDATE users SET status = 'disabled' WHERE id = $1;
```

---

## 🔑 Environment Variables

No new env vars needed - uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session middleware
- `PORT` - Server port

---

## 📞 Support

| Item | Value |
|------|-------|
| Documentation | ADMIN_PANEL_COMPLETE.md |
| API Reference | ADMIN_PANEL_COMPLETE.md#api-reference |
| Troubleshooting | ADMIN_PANEL_COMPLETE.md#troubleshooting |
| Deployment | ADMIN_PANEL_COMPLETE.md#deployment |

---

## ✅ Verification Checklist

- [ ] Database migrations ran (users table has role/status)
- [ ] Admin routes mounted in server.js
- [ ] Components render without errors
- [ ] Logged in as admin to access panel
- [ ] Can view users list
- [ ] Can edit user roles
- [ ] Can send invitations
- [ ] Can approve users
- [ ] Can resend invitations
- [ ] Non-admins get 403 error

---

**Last Updated:** December 23, 2025  
**Status:** ✅ Production Ready  
**Branch:** feat/admin-panel-users
