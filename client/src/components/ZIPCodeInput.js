import React, { useState } from 'react';
import './ZIPCodeInput.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function ZIPCodeInput({ onSubmit, user }) {
  const [zipCode, setZipCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateZipCode = (zip) => {
    // US ZIP code: 5 digits or 5+4 format
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateZipCode(zipCode)) {
      setError('Please enter a valid ZIP code (e.g., 27617)');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      // Call backend to find stores
      const response = await fetch(`${API_BASE}/api/find-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          zipCode: zipCode.trim(),
          storeName: storeName.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find stores');
      }

      const data = await response.json();

      // Pass ZIP and stores to parent
      onSubmit({
        zipCode: zipCode.trim(),
        stores: data.stores
      });

    } catch (error) {
      console.error('Error finding stores:', error);
      setError('Unable to find stores. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="zip-code-container">
      <div className="zip-code-header">
        <h1>🏠 Where Are You Located?</h1>
        <p>We'll find grocery stores near you</p>
        {user && (
          <div className="user-greeting">
            <img src={user.picture} alt={user.name} className="user-avatar-small" />
            <span>Hi, {user.given_name}!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="zip-code-form">
        <div className="form-group">
          <label htmlFor="zipCode" className="section-label">
            <span className="label-icon">📍</span>
            Enter Your ZIP Code
          </label>

          <input
            id="zipCode"
            type="text"
            className="zip-input"
            placeholder="e.g., 27617"
            value={zipCode}
            onChange={(e) => {
              setZipCode(e.target.value);
              setError('');
            }}
            maxLength="10"
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="storeName" className="section-label">
            <span className="label-icon">🏪</span>
            Specific Store Name (Optional)
          </label>

          <input
            id="storeName"
            type="text"
            className="zip-input"
            placeholder="e.g., Whole Foods, Harris Teeter, Trader Joe's"
            value={storeName}
            onChange={(e) => {
              setStoreName(e.target.value);
              setError('');
            }}
            disabled={isLoading}
          />

          <p className="field-hint">
            Leave blank to see all nearby stores, or enter a specific store name to prioritize it in results
          </p>
        </div>

        <button
          type="submit"
          className="zip-submit-button"
          disabled={isLoading || !zipCode}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {isLoading ? (
            <>
              <span className="spinner-small"></span>
              Finding Stores...
            </>
          ) : (
            <>
              Find Stores
              <span className="arrow">→</span>
            </>
          )}
        </button>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="zip-info">
          <p>💡 <strong>Why do we need this?</strong></p>
          <p>We'll find grocery stores in your area and tailor your meal plan to items available at your local store.</p>
        </div>
      </form>
    </div>
  );
}

export default ZIPCodeInput;
