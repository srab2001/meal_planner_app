import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';
import {
  adminListUsers,
  adminUpdateUser,
  adminInviteUser,
  adminApproveUser,
  adminListInvites,
  adminResendInvite,
} from '../../../shared/utils/adminApi';

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

  // Add user (formerly "approve user")
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [addingUser, setAddingUser] = useState(false);

  // Messages
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Verify admin and load data
  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      // Load users and check admin status in one call
      const usersData = await adminListUsers();
      setIsAdmin(true);
      setUsers(usersData.users);

      // Load invites
      const invitesData = await adminListInvites();
      setInvites(invitesData.invites);
    } catch (err) {
      console.error('Error loading admin data:', err);
      if (err.message.includes('403')) {
        setIsAdmin(false);
      } else {
        setError('Failed to load admin data');
      }
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
      const updatedUser = await adminUpdateUser(userId, editingUser);
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
      const newInvite = await adminInviteUser({
        email: inviteEmail,
        role: inviteRole,
      });
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

  // Add new user
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail) {
      setError('Please enter an email address');
      return;
    }

    setAddingUser(true);
    setError(null);

    try {
      const newUser = await adminApproveUser({
        email: newUserEmail,
        display_name: newUserName || null,
        role: newUserRole,
      });
      setUsers([newUser, ...users]);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRole('user');
      setSuccess(`User ${newUserEmail} added successfully! They can now log in with Google.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  // Resend invitation
  const handleResendInvite = async (inviteId) => {
    try {
      setError(null);
      const updatedInvite = await adminResendInvite(inviteId);
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
          className={`tab-button ${activeTab === 'adduser' ? 'active' : ''}`}
          onClick={() => setActiveTab('adduser')}
        >
          + Add User
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

        {/* Add User Tab */}
        {activeTab === 'adduser' && (
          <div className="form-section">
            <h2>Add New User</h2>
            <p className="form-description">
              Create a new user account. They can log in immediately using Google OAuth with the email address you specify.
            </p>
            <form onSubmit={handleAddUser} className="admin-form">
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Display Name (optional)</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Smith"
                />
                <small className="form-hint">Will be updated when user logs in with Google</small>
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                  <option value="user">User (Standard access)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={addingUser}
              >
                {addingUser ? 'Adding User...' : 'Add User'}
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
