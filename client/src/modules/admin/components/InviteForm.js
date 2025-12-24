import React, { useState } from 'react';
import '../styles/InviteForm.css';

/**
 * InviteForm - Form to create and send user invitations
 * Features:
 * - Email input with validation
 * - Role selection (user or admin)
 * - Optional notes for the invitation
 * - Copy to clipboard for acceptance link (after sending)
 * - Alternative: Approve user without invitation
 */
export default function InviteForm({ onInviteCreated }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [notes, setNotes] = useState('');
  const [method, setMethod] = useState('invite'); // 'invite' or 'approve'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const validateEmail = (emailStr) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate email
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '';
      let payload = { email, role };

      if (method === 'invite') {
        endpoint = '/api/admin/users/invite';
        if (notes) {
          payload.notes = notes;
        }
      } else {
        endpoint = '/api/admin/users/approve';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to ${method === 'invite' ? 'send invite' : 'approve user'}`
        );
      }

      const data = await response.json();

      if (method === 'invite') {
        setCreatedInvite(data);
        setSuccess(`Invitation sent to ${email}`);
      } else {
        setSuccess(`User ${email} approved successfully`);
      }

      // Reset form
      setEmail('');
      setRole('user');
      setNotes('');

      // Call parent callback
      if (onInviteCreated) {
        onInviteCreated();
      }
    } catch (err) {
      setError(err.message);
      console.error('Error sending invite:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (createdInvite?.acceptanceLink) {
      try {
        await navigator.clipboard.writeText(createdInvite.acceptanceLink);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        setError('Failed to copy link to clipboard');
      }
    }
  };

  return (
    <div className="invite-form-container">
      {createdInvite && (
        <div className="invite-success-details">
          <h3>✓ Invitation Created</h3>
          <p>Email: <strong>{createdInvite.email}</strong></p>
          <p>Role: <strong>{createdInvite.role}</strong></p>
          <p>Expires: <strong>{new Date(createdInvite.expires_at).toLocaleDateString()}</strong></p>

          <div className="acceptance-link-section">
            <p className="section-label">Acceptance Link:</p>
            <div className="link-box">
              <code>{createdInvite.acceptanceLink}</code>
            </div>
            <button
              type="button"
              className="copy-button"
              onClick={handleCopyLink}
            >
              {copiedToClipboard ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>

          <p className="help-text">
            Share this link with the user to accept the invitation. They can also use the token directly.
          </p>

          <button
            type="button"
            className="create-another-button"
            onClick={() => {
              setCreatedInvite(null);
              setSuccess(null);
            }}
          >
            Create Another Invitation
          </button>
        </div>
      )}

      {!createdInvite && (
        <form onSubmit={handleSubmit} className="invite-form">
          {error && (
            <div className="form-error">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="form-success">
              <span>{success}</span>
            </div>
          )}

          <div className="method-toggle">
            <label className="method-option">
              <input
                type="radio"
                value="invite"
                checked={method === 'invite'}
                onChange={(e) => setMethod(e.target.value)}
              />
              Send Invitation (with token)
            </label>
            <label className="method-option">
              <input
                type="radio"
                value="approve"
                checked={method === 'approve'}
                onChange={(e) => setMethod(e.target.value)}
              />
              Approve User (bypass invitation)
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="user">User (Standard access)</option>
              <option value="admin">Admin (Full access)</option>
            </select>
          </div>

          {method === 'invite' && (
            <div className="form-group">
              <label htmlFor="notes">Notes (optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes for this invitation..."
                rows="3"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-info">
            {method === 'invite' ? (
              <p>
                The user will receive an invitation link valid for 7 days. They can accept
                using the provided token to create their account.
              </p>
            ) : (
              <p>
                The user will be approved immediately and can log in with their account
                (must have OAuth configured).
              </p>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || !email}
          >
            {loading ? 'Processing...' : method === 'invite' ? 'Send Invitation' : 'Approve User'}
          </button>
        </form>
      )}
    </div>
  );
}
