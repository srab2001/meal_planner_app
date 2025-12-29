import React, { useState } from 'react';
import './Modal.css';

export default function AdjustModal({ item, onClose, onSuccess, apiBase, token, householdId }) {
  const [form, setForm] = useState({
    newQuantity: item.quantity,
    unit: item.unit || 'count',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (form.newQuantity < 0) {
      return 'Quantity cannot be negative';
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
      const res = await fetch(`${apiBase}/api/core/pantry/items/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Household-ID': householdId
        },
        body: JSON.stringify({
          pantryItemId: item.id,
          quantity: parseFloat(form.newQuantity),
          unit: form.unit,
          notes: form.notes || `Adjusted from ${item.quantity} to ${form.newQuantity}`,
          household_id: householdId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to adjust quantity');
      }

      onSuccess(data.item);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const difference = parseFloat(form.newQuantity) - item.quantity;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adjust Quantity</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-item-info">
          <strong>{item.itemName}</strong>
          <span>Current: {item.quantity} {item.unit}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newQuantity">New Quantity *</label>
              <input
                type="number"
                id="newQuantity"
                name="newQuantity"
                value={form.newQuantity}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              {difference !== 0 && (
                <small className={difference > 0 ? 'positive' : 'negative'}>
                  {difference > 0 ? '+' : ''}{difference.toFixed(2)}
                </small>
              )}
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
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Reason for adjustment..."
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
