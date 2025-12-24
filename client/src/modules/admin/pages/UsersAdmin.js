import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';

const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

/**
 * UsersAdmin - User management page
 * Features:
 * - View and edit users (role, status)
 * - Send invitations
 * - Approve users
 * - Resend invitations
 */
export default function UsersAdmin({ user, onBack, onNavigate }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  // Users management
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState({});

  // Invitations
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteSending, setInviteSending] = useState(false);

  // Approve user
  const [approveEmail, setApproveEmail] = useState('');
  const [approveRole, setApproveRole] = useState('user');
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  // Messages
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Verify admin and load data
  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      // Check admin status
      const adminResponse = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (adminResponse.status === 403) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      if (!adminResponse.ok) throw new Error('Failed to verify admin');

      setIsAdmin(true);

      // Load users
      const usersData = await adminResponse.json();
      setUsers(usersData);

      // Load invites
      const invitesResponse = await fetch(`${API_BASE}/api/admin/invites`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (invitesResponse.ok) {
        const invitesData = await invitesResponse.json();
        setInvites(invitesData);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Start editing user
  const handleEditUser = (userObj) => {
    setEditingUserId(userObj.id);
    setEditingUser({
      role: userObj.role || 'user',
      status: userObj.status || 'active',
    });
  };

  // Save user changes
  const handleSaveUser = async (userId) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
      setEditingUserId(null);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUser({});
  };

  // Send invitation
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      setError('Please enter an email address');
      return;
    }

    setInviteSending(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const newInvite = await response.json();
      setInvites([newInvite, ...invites]);
      setInviteEmail('');
      setInviteRole('user');
      setSuccess('Invitation sent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.message);
    } finally {
      setInviteSending(false);
    }
  };

  // Approve user
  const handleApproveUser = async (e) => {
    e.preventDefault();
    if (!approveEmail) {
      setError('Please enter an email address');
      return;
    }

    setApproveSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/users/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: approveEmail,
          role: approveRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve user');
      }

      const approvedUser = await response.json();
      setUsers([approvedUser, ...users]);
      setApproveEmail('');
      setApproveRole('user');
      setSuccess('User approved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error approving user:', err);
      setError(err.message);
    } finally {
      setApproveSubmitting(false);
    }
  };

  // Resend invitation
  const handleResendInvite = async (inviteId) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/admin/invites/${inviteId}/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resend invitation');
      }

      const updatedInvite = await response.json();
      setInvites(invites.map(i => (i.id === inviteId ? updatedInvite : i)));
      setSuccess('Invitation resent successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error resending invitation:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Loading user management...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges to access this page.</p>
          <button className="back-button" onClick={onBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="back-button" onClick={onBack}>
          ← Admin Panel
        </button>
        <h1>User Management</h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error-message">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {success && (
        <div className="message success-message">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'invite' ? 'active' : ''}`}
          onClick={() => setActiveTab('invite')}
        >
          Send Invite
        </button>
        <button
          className={`tab-button ${activeTab === 'approve' ? 'active' : ''}`}
          onClick={() => setActiveTab('approve')}
        >
          Approve User
        </button>
        <button
          className={`tab-button ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
        >
          Invitations ({invites.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>All Users</h2>
            {users.length === 0 ? (
              <p className="empty-state">No users found</p>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={editingUserId === u.id ? 'editing' : ''}>
                        <td>{u.email}</td>
                        <td>{u.display_name || '-'}</td>
                        <td>
                          {editingUserId === u.id ? (
                            <select
                              value={editingUser.role}
                              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${u.role}`}>{u.role}</span>
                          )}
                        </td>
                        <td>
                          {editingUserId === u.id ? (
                            <select
                              value={editingUser.status}
                              onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                            >
                              <option value="active">Active</option>
                              <option value="pending">Pending</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          ) : (
                            <span className={`status-badge ${u.status}`}>{u.status}</span>
                          )}
                        </td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '-'}</td>
                        <td className="actions">
                          {editingUserId === u.id ? (
                            <>
                              <button className="save-btn" onClick={() => handleSaveUser(u.id)}>
                                Save
                              </button>
                              <button className="cancel-btn" onClick={handleCancelEdit}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button className="edit-btn" onClick={() => handleEditUser(u)}>
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Send Invite Tab */}
        {activeTab === 'invite' && (
          <div className="form-section">
            <h2>Send Invitation</h2>
            <form onSubmit={handleSendInvite} className="admin-form">
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={inviteSending}
              >
                {inviteSending ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        )}

        {/* Approve User Tab */}
        {activeTab === 'approve' && (
          <div className="form-section">
            <h2>Approve User (Direct)</h2>
            <form onSubmit={handleApproveUser} className="admin-form">
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={approveEmail}
                  onChange={(e) => setApproveEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={approveRole} onChange={(e) => setApproveRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={approveSubmitting}
              >
                {approveSubmitting ? 'Approving...' : 'Approve User'}
              </button>
            </form>
          </div>
        )}

        {/* Invitations Tab */}
        {activeTab === 'invites' && (
          <div className="invites-section">
            <h2>All Invitations</h2>
            {invites.length === 0 ? (
              <p className="empty-state">No invitations</p>
            ) : (
              <div className="invites-list">
                {invites.map((invite) => (
                  <div key={invite.id} className="invite-card">
                    <div className="invite-header">
                      <h3>{invite.email}</h3>
                      <span className={`status-badge ${invite.status}`}>{invite.status}</span>
                    </div>
                    <div className="invite-details">
                      <p>Role: <strong>{invite.role}</strong></p>
                      <p>Created: {new Date(invite.created_at).toLocaleDateString()}</p>
                      {invite.expires_at && (
                        <p>Expires: {new Date(invite.expires_at).toLocaleDateString()}</p>
                      )}
                    </div>
                    {invite.status === 'pending' && (
                      <button
                        className="resend-btn"
                        onClick={() => handleResendInvite(invite.id)}
                      >
                        Resend
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
