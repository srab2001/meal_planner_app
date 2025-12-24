import React, { useState } from 'react';
import '../styles/UserTable.css';

/**
 * UserTable - Display and manage users with inline editing
 * Allows:
 * - View user details (email, name, role, status, created date, last login)
 * - Change user role (user to admin or vice versa)
 * - Change user status (active/pending/disabled)
 */
export default function UserTable({ users, onUserUpdate }) {
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditingRole(user.role);
    setEditingStatus(user.status);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditingRole('');
    setEditingStatus('');
  };

  const saveChanges = async (userId, user) => {
    setSubmitting(true);
    const updates = {};

    if (editingRole !== user.role) {
      updates.role = editingRole;
    }
    if (editingStatus !== user.status) {
      updates.status = editingStatus;
    }

    if (Object.keys(updates).length === 0) {
      setEditingUserId(null);
      setSubmitting(false);
      return;
    }

    try {
      await onUserUpdate(userId, updates);
      setEditingUserId(null);
      setEditingRole('');
      setEditingStatus('');
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'disabled':
        return '#f44336';
      default:
        return '#999';
    }
  };

  return (
    <div className="user-table-container">
      <table className="user-table">
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
          {users.map((user) => (
            <tr key={user.id} className={`user-row ${user.role === 'admin' ? 'admin-user' : ''}`}>
              <td className="email">{user.email}</td>
              <td className="name">{user.display_name || '-'}</td>
              <td className="role">
                {editingUserId === user.id ? (
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="role-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                )}
              </td>
              <td className="status">
                {editingUserId === user.id ? (
                  <select
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value)}
                    className="status-select"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="disabled">Disabled</option>
                  </select>
                ) : (
                  <span
                    className={`status-badge ${user.status}`}
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  >
                    {user.status}
                  </span>
                )}
              </td>
              <td className="created-date">{formatDate(user.created_at)}</td>
              <td className="last-login">{formatDate(user.last_login_at)}</td>
              <td className="actions">
                {editingUserId === user.id ? (
                  <>
                    <button
                      className="save-button"
                      onClick={() => saveChanges(user.id, user)}
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className="cancel-button"
                      onClick={cancelEdit}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="edit-button"
                    onClick={() => startEdit(user)}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
