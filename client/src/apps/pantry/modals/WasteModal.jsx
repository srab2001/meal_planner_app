import React, { useState } from 'react';
import './Modal.css';

const WASTE_REASONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'overbought', label: 'Overbought' },
  { value: 'other', label: 'Other' }
];

export default function WasteModal({ item, onClose, onSuccess, apiBase, token, householdId }) {
  const [form, setForm] = useState({
    amount: item.quantity,
    unit: item.unit || 'count',
    reason: 'expired',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (form.amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (form.amount > item.quantity) {
      return `Amount cannot exceed available quantity (${item.quantity})`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const notes = form.reason === 'other'
        ? form.notes
        : `Reason: ${WASTE_REASONS.find(r => r.value === form.reason)?.label}${form.notes ? ` - ${form.notes}` : ''}`;

      const res = await fetch(`${apiBase}/api/pantry/items/event`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Household-ID': householdId
        },
        body: JSON.stringify({
          pantryItemId: item.id,
          eventType: 'waste',
          amount: parseFloat(form.amount),
          unit: form.unit,
          notes,
          household_id: householdId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to record waste');
      }

      onSuccess(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mark as Waste</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-item-info">
          <strong>{item.itemName}</strong>
          <span>Available: {item.quantity} {item.unit}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                max={item.quantity}
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <select id="unit" name="unit" value={form.unit} onChange={handleChange}>
                <option value="count">count</option>
                <option value="lbs">lbs</option>
                <option value="oz">oz</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="mL">mL</option>
                <option value="cups">cups</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason *</label>
            <select id="reason" name="reason" value={form.reason} onChange={handleChange}>
              {WASTE_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder={form.reason === 'other' ? 'Please describe...' : 'Optional notes...'}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-warning" disabled={submitting}>
              {submitting ? 'Recording...' : 'Mark as Waste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
