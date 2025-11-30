import React, { useState } from 'react';
import './StoreSelection.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function StoreSelection({ stores, zipCode, onSubmit, onBack, onRefreshStores }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStoreSelect = (store) => {
    setSelectedStore(store);
  };

  const handleContinue = () => {
    if (selectedStore) {
      onSubmit(selectedStore);
    }
  };

  const handleFindMoreStores = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔄 Finding more stores for ZIP:', zipCode);

      const response = await fetch(`${API_BASE}/api/find-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ zipCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to find more stores');
      }

      const data = await response.json();
      console.log('✅ Found', data.stores.length, 'new stores');
      
      // Call the refresh callback with new stores
      onRefreshStores(data.stores);
      
      // Clear selection since we have new stores
      setSelectedStore(null);
      
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

        <h1>Select Your Grocery Store</h1>
        <p className="subtitle">
          Based on ZIP code: <strong>{zipCode}</strong>
        </p>

        <div className="stores-grid">
          {stores.map((store, index) => (
            <div
              key={index}
              className={`store-card ${selectedStore === store ? 'selected' : ''}`}
              onClick={() => handleStoreSelect(store)}
            >
              <div className="store-header">
                <h3 className="store-name">{store.name}</h3>
                {selectedStore === store && (
                  <span className="selected-badge">✓ Selected</span>
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
          ))}
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
            disabled={!selectedStore}
          >
            Continue with {selectedStore ? selectedStore.name : 'Selected Store'} →
          </button>
        </div>
      </div>
    </div>
  );
}

export default StoreSelection;