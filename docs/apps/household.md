# Household App Documentation

**Module:** /apps/household
**Database:** CORE DB (Neon)
**Status:** Active

---

## Overview

The Household App manages household membership, invitations, and role assignments. It uses only the CORE DB for data storage.

---

## Features

| Feature | Description | RBAC |
|---------|-------------|------|
| Members List | View all household members | All roles |
| Invite Member | Send email invitation with role | owner, admin |
| Accept Invite | Accept pending invitation | Invitee |
| Change Role | Modify member's role | owner, admin |
| Remove Member | Remove from household | owner, admin |

---

## API Routes

### GET /api/core/households/:id

Get household details with members and invites.

**Headers:**
- `Authorization: Bearer <token>`
- `X-Household-ID: <household_id>`

**Response:**
```json
{
  "household": {
    "id": "uuid",
    "name": "Family Household",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "members": [
    {
      "id": "membership_uuid",
      "user_id": "user_uuid",
      "email": "user@example.com",
      "display_name": "John Doe",
      "picture": "https://...",
      "role": "owner",
      "joined_at": "2025-01-01T00:00:00Z"
    }
  ],
  "invites": [
    {
      "id": "invite_uuid",
      "email": "invitee@example.com",
      "role": "member",
      "status": "pending",
      "expires_at": "2025-01-08T00:00:00Z"
    }
  ]
}
```

---

### POST /api/core/households/:id/invites

Send invitation to join household.

**Headers:**
- `Authorization: Bearer <token>`
- `X-Household-ID: <household_id>`

**Body:**
```json
{
  "email": "invitee@example.com",
  "role": "member"
}
```

**Response:**
```json
{
  "invite": {
    "id": "uuid",
    "email": "invitee@example.com",
    "role": "member",
    "token": "invite_token",
    "expires_at": "2025-01-08T00:00:00Z",
    "status": "pending"
  }
}
```

**RBAC:** owner, admin only

---

### POST /api/core/invites/:token/accept

Accept an invitation using token.

**Body:**
```json
{
  "token": "invite_token"
}
```

**Response:**
```json
{
  "success": true,
  "household": {
    "id": "uuid",
    "name": "Family Household"
  },
  "membership": {
    "id": "uuid",
    "role": "member"
  }
}
```

---

### PUT /api/core/households/:id/members/:memberId/role

Change member's role.

**Headers:**
- `Authorization: Bearer <token>`
- `X-Household-ID: <household_id>`

**Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "member": {
    "id": "uuid",
    "role": "admin"
  }
}
```

**RBAC:** owner, admin only
**Constraints:** Cannot change owner role, cannot change own role

---

### DELETE /api/core/households/:id/members/:memberId

Remove member from household.

**Headers:**
- `Authorization: Bearer <token>`
- `X-Household-ID: <household_id>`

**Response:**
```json
{
  "success": true
}
```

**RBAC:** owner, admin only
**Constraints:** Cannot remove owner, cannot remove self

---

### DELETE /api/core/households/:id/invites/:inviteId

Revoke pending invitation.

**Headers:**
- `Authorization: Bearer <token>`
- `X-Household-ID: <household_id>`

**Response:**
```json
{
  "success": true
}
```

**RBAC:** owner, admin only

---

## Data Model

### household_memberships

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| household_id | UUID | FK to households |
| role | String | owner, admin, member, viewer |
| is_active | Boolean | Membership status |
| joined_at | DateTime | When joined |

### invites

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String | Invitee email |
| household_id | UUID | FK to households |
| invited_by | UUID | FK to users |
| token | UUID | Unique invite token |
| role | String | Role to assign |
| status | String | pending, accepted, expired, revoked |
| expires_at | DateTime | Expiration date |
| accepted_at | DateTime | When accepted |

---

## RBAC Matrix

| Action | owner | admin | member | viewer |
|--------|-------|-------|--------|--------|
| View members | ✓ | ✓ | ✓ | ✓ |
| Send invite | ✓ | ✓ | ✗ | ✗ |
| Revoke invite | ✓ | ✓ | ✗ | ✗ |
| Change role | ✓ | ✓ | ✗ | ✗ |
| Remove member | ✓ | ✓ | ✗ | ✗ |
| Delete household | ✓ | ✗ | ✗ | ✗ |

---

## Component Structure

```
/apps/household/
├── HouseholdApp.jsx    # Main component
├── HouseholdApp.css    # Styles
└── index.js            # Export
```

---

## Usage

```jsx
import { HouseholdApp } from './apps/household';

<HouseholdApp
  user={user}
  onBack={() => setView('switchboard')}
  onLogout={handleLogout}
/>
```

---

**Version:** 1.0
**Last Updated:** December 28, 2025
