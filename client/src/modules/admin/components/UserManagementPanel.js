import React, { useState, useEffect } from 'react';
import '../styles/UserManagement.css';
import UserTable from './UserTable';
import InviteForm from './InviteForm';

/**
 * UserManagementPanel - Main admin panel for managing users and invitations
 * Features:
 * - View all users with roles and status
 * - Update user roles (user/admin) and status (active/pending/disabled)
 * - Create and send user invitations
 * - Resend invitations with token rotation
 * - View all pending/accepted invitations
 */
export default function UserManagementPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch users and invites on component mount and when switching tabs
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'invites') {
      fetchInvites();
    }
  }, [activeTab]);

  /**
   * Fetch all users from the admin API
   */
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to access admin features');
        } else if (response.status === 403) {
          throw new Error('You do not have admin privileges');
        } else {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all invitations from the admin API
   */
  const fetchInvites = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/invites', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to access admin features');
        } else if (response.status === 403) {
          throw new Error('You do not have admin privileges');
        } else {
          throw new Error(`Failed to fetch invites: ${response.statusText}`);
        }
      }

      const data = await response.json();
      setInvites(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching invites:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user update (role or status change)
   */
  const handleUserUpdate = async (userId, updates) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
      setSuccessMessage('User updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error updating user:', err);
    }
  };

  /**
   * Handle new invite creation
   */
  const handleInviteCreated = () => {
    setSuccessMessage('Invitation sent successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    // Refresh invites list
    fetchInvites();
  };

  /**
   * Handle resending an invitation
   */
  const handleResendInvite = async (inviteId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/invites/${inviteId}/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invite');
      }

      const updatedInvite = await response.json();
      setInvites(invites.map(i => (i.id === inviteId ? updatedInvite : i)));
      setSuccessMessage('Invitation resent successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Error resending invite:', err);
    }
  };

  return (
    <div className="user-management-panel">
      <h1 className="panel-title">Admin Panel - User Management</h1>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <span>{successMessage}</span>
        </div>
      )}

      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
        >
          Invitations ({invites.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Invite
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && (
          <div className="users-tab">
            <h2>User Management</h2>
            {loading ? (
              <p className="loading">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="empty-state">No users found</p>
            ) : (
              <UserTable users={users} onUserUpdate={handleUserUpdate} />
            )}
          </div>
        )}

        {activeTab === 'invites' && (
          <div className="invites-tab">
            <h2>Active Invitations</h2>
            {loading ? (
              <p className="loading">Loading invitations...</p>
            ) : invites.length === 0 ? (
              <p className="empty-state">No invitations</p>
            ) : (
              <div className="invites-list">
                {invites.map((invite) => (
                  <div key={invite.id} className="invite-card">
                    <div className="invite-header">
                      <div>
                        <h3>{invite.email}</h3>
                        <p className="invite-role">Role: {invite.role}</p>
                      </div>
                      <span className={`invite-status ${invite.status}`}>
                        {invite.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="invite-details">
                      <p>Created: {new Date(invite.created_at).toLocaleDateString()}</p>
                      {invite.expires_at && (
                        <p>
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {invite.status === 'pending' && (
                      <button
                        className="resend-button"
                        onClick={() => handleResendInvite(invite.id)}
                      >
                        Resend Invitation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-invite-tab">
            <h2>Send New Invitation</h2>
            <InviteForm onInviteCreated={handleInviteCreated} />
          </div>
        )}
      </div>
    </div>
  );
}
