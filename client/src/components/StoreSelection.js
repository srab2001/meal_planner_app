import React, { useState } from 'react';
import './StoreSelection.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function StoreSelection({ stores, zipCode, onSubmit, onBack, onRefreshStores }) {
  const [primaryStore, setPrimaryStore] = useState(null);
  const [comparisonStore, setComparisonStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStoreSelect = (store) => {
    if (!primaryStore) {
      // Select as primary store first
      setPrimaryStore(store);
    } else if (primaryStore === store) {
      // Clicking primary again deselects it
      setPrimaryStore(null);
      // If there was a comparison store, make it primary
      if (comparisonStore) {
        setPrimaryStore(comparisonStore);
        setComparisonStore(null);
      }
    } else if (!comparisonStore) {
      // Select as comparison store
      setComparisonStore(store);
    } else if (comparisonStore === store) {
      // Clicking comparison again deselects it
      setComparisonStore(null);
    } else {
      // Replace comparison store
      setComparisonStore(store);
    }
  };

  const handleContinue = () => {
    if (primaryStore) {
      onSubmit({
        primaryStore,
        comparisonStore: comparisonStore || null
      });
    }
  };

  const handleFindMoreStores = async () => {
    setIsLoading(true);

    try {
      console.log('🔄 Finding more stores for ZIP:', zipCode);

      // Get JWT token from localStorage
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_BASE}/api/find-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ zipCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to find more stores');
      }

      const data = await response.json();
      console.log('✅ Found', data.stores.length, 'new stores');
      
      // Call the refresh callback with new stores
      onRefreshStores(data.stores);

      // Clear selections since we have new stores
      setPrimaryStore(null);
      setComparisonStore(null);
      
    } catch (error) {
      console.error('❌ Error finding more stores:', error);
      alert('Failed to find more stores. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="store-selection-page">
      <div className="store-selection-container">
        <button onClick={onBack} className="back-button">
          ← Back to ZIP Code
        </button>

        <h1>Select Grocery Stores</h1>
        <p className="subtitle">
          Based on ZIP code: <strong>{zipCode}</strong>
        </p>
        <p className="instruction-text">
          Select your <strong>primary store</strong>, then optionally select a <strong>second store</strong> to compare prices
        </p>

        <div className="stores-grid">
          {stores.map((store, index) => {
            const isPrimary = primaryStore === store;
            const isComparison = comparisonStore === store;
            const isSelected = isPrimary || isComparison;

            return (
              <div
                key={index}
                className={`store-card ${isSelected ? 'selected' : ''} ${isPrimary ? 'primary' : ''} ${isComparison ? 'comparison' : ''}`}
                onClick={() => handleStoreSelect(store)}
              >
                <div className="store-header">
                  <h3 className="store-name">{store.name}</h3>
                  {isPrimary && (
                    <span className="selected-badge primary-badge">⭐ Primary Store</span>
                  )}
                  {isComparison && (
                    <span className="selected-badge comparison-badge">💰 Compare Prices</span>
                  )}
                </div>
              
              <div className="store-details">
                <p className="store-address">
                  📍 {store.address}
                </p>
                <p className="store-distance">
                  🚗 {store.distance}
                </p>
                {store.type && (
                  <span className={`store-type-badge ${store.type.toLowerCase()}`}>
                    {store.type}
                  </span>
                )}
              </div>
              </div>
            );
          })}
        </div>

        <div className="action-buttons">
          <button
            onClick={handleFindMoreStores}
            className="refresh-stores-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Finding More Stores...
              </>
            ) : (
              <>
                🔄 Find Different Stores
              </>
            )}
          </button>

          <button
            onClick={handleContinue}
            className="continue-button"
            disabled={!primaryStore}
          >
            {primaryStore && comparisonStore ? (
              <>Continue with {primaryStore.name} vs {comparisonStore.name} →</>
            ) : primaryStore ? (
              <>Continue with {primaryStore.name} →</>
            ) : (
              <>Select a Store to Continue →</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoreSelection;