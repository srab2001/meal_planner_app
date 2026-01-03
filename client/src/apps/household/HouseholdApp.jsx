import React, { useState, useEffect } from 'react';
import './HouseholdApp.css';

/**
 * HouseholdApp - Manage household members and invites
 *
 * Features:
 * - Members list with roles
 * - Invite by email + token
 * - Accept invite
 * - Change role
 * - Remove member
 *
 * RBAC:
 * - owner/admin: full management
 * - member/viewer: read-only
 */

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function HouseholdApp({ user, onBack, onLogout }) {
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  // Current user's role in this household
  const [userRole, setUserRole] = useState(null);
  const canManage = userRole === 'owner' || userRole === 'admin' || user?.role === 'admin';

  const token = localStorage.getItem('auth_token');
  const householdId = localStorage.getItem('active_household_id');

  useEffect(() => {
    fetchHouseholdData();
  }, [householdId]);

  const fetchHouseholdData = async () => {
    if (!householdId) {
      setError('No household selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch household details
      const response = await fetch(
        `${API_BASE}/api/core/households/${householdId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Household-ID': householdId
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch household');
      }

      const data = await response.json();
      setHousehold(data.household);
      setMembers(data.members || []);
      setInvites(data.invites || []);

      // Find current user's role
      const currentMember = data.members?.find(m => m.user_id === user?.id);
      setUserRole(currentMember?.role || null);

    } catch (err) {
      console.error('Error fetching household:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);

      const response = await fetch(
        `${API_BASE}/api/core/households/${householdId}/invites`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Household-ID': householdId
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole
          })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to send invite');
      }

      const data = await response.json();
      setInvites([...invites, data.invite]);
      setInviteEmail('');
      setShowInviteForm(false);
      alert(`Invite sent to ${inviteEmail}`);

    } catch (err) {
      console.error('Error sending invite:', err);
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm('Revoke this invite?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/core/households/${householdId}/invites/${inviteId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Household-ID': householdId
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to revoke invite');
      }

      setInvites(invites.filter(i => i.id !== inviteId));

    } catch (err) {
      console.error('Error revoking invite:', err);
      alert(err.message);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/core/households/${householdId}/members/${memberId}/role`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Household-ID': householdId
          },
          body: JSON.stringify({ role: newRole })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to change role');
      }

      setMembers(members.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ));

    } catch (err) {
      console.error('Error changing role:', err);
      alert(err.message);
    }
  };

  const handleRemoveMember = async (memberId, memberEmail) => {
    if (!window.confirm(`Remove ${memberEmail} from this household?`)) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/core/households/${householdId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Household-ID': householdId
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      setMembers(members.filter(m => m.id !== memberId));

    } catch (err) {
      console.error('Error removing member:', err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="household-app loading">
        <div className="spinner"></div>
        <p>Loading household...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="household-app error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  }

  return (
    <div className="household-app">
      {/* Header */}
      <header className="household-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <div className="header-content">
          <h1>👨‍👩‍👧‍👦 {household?.name || 'Household'}</h1>
          <p>{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button
            className="btn-invite"
            onClick={() => setShowInviteForm(!showInviteForm)}
          >
            + Invite Member
          </button>
        )}
      </header>

      {/* Invite Form */}
      {showInviteForm && canManage && (
        <div className="invite-form-container">
          <form className="invite-form" onSubmit={handleInvite}>
            <h3>Invite New Member</h3>
            <div className="form-row">
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <button type="submit" disabled={inviting}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <section className="members-section">
        <h2>Members</h2>
        <div className="members-list">
          {members.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">
                {member.picture ? (
                  <img src={member.picture} alt="" />
                ) : (
                  <span>{(member.display_name || member.email)?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="member-info">
                <h4>{member.display_name || member.email}</h4>
                <p>{member.email}</p>
              </div>
              <div className="member-role">
                {canManage && member.user_id !== user?.id && member.role !== 'owner' ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleChangeRole(member.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <span className={`role-badge role-${member.role}`}>
                    {member.role}
                  </span>
                )}
              </div>
              {canManage && member.user_id !== user?.id && member.role !== 'owner' && (
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveMember(member.id, member.email)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pending Invites */}
      {canManage && invites.length > 0 && (
        <section className="invites-section">
          <h2>Pending Invites</h2>
          <div className="invites-list">
            {invites.filter(i => i.status === 'pending').map(invite => (
              <div key={invite.id} className="invite-card">
                <div className="invite-info">
                  <h4>{invite.email}</h4>
                  <p>Role: {invite.role} • Expires: {new Date(invite.expires_at).toLocaleDateString()}</p>
                </div>
                <button
                  className="btn-revoke"
                  onClick={() => handleRevokeInvite(invite.id)}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Read-only notice */}
      {!canManage && (
        <div className="readonly-notice">
          <p>You have read-only access to this household. Contact an admin to make changes.</p>
        </div>
      )}
    </div>
  );
}
