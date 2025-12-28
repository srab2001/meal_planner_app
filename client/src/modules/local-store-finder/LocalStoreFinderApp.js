import React, { useState } from 'react';
import './styles/LocalStoreFinderApp.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

/**
 * LocalStoreFinderApp - Main Local Store Finder Module Component
 *
 * Wizard-style interface for finding nearby stores:
 * Step 1: Enter location, store type, and intent
 * Step 2: Select from top 3 nearby stores
 * Step 3: Enter item to search for
 * Results: View table with store, item, price, link
 */
export default function LocalStoreFinderApp({ user, onBack, onLogout }) {
  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Location and store type
  const [locationText, setLocationText] = useState('');
  const [storeType, setStoreType] = useState('');
  const [intentText, setIntentText] = useState('');

  // Step 2: Store selection
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);

  // Step 3: Item search
  const [itemSearch, setItemSearch] = useState('');

  // Results
  const [results, setResults] = useState([]);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const storeTypes = [
    { value: 'home', label: 'Home Improvement', icon: '🏠' },
    { value: 'appliances', label: 'Appliances', icon: '🔌' },
    { value: 'clothing', label: 'Clothing', icon: '👕' },
    { value: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  ];

  // Step 1: Find nearby stores
  const handleFindStores = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/local-store-finder/locate-stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationText,
          storeType,
          intent: intentText,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. The feature may not be deployed yet.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find stores');
      }

      setStores(data.stores || []);
      setSelectedStores([]);
      setCurrentStep(2);
    } catch (err) {
      setError(err.message || 'Failed to find stores. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Toggle store selection
  const toggleStoreSelection = (storeId) => {
    setSelectedStores(prev => {
      if (prev.includes(storeId)) {
        return prev.filter(id => id !== storeId);
      } else {
        return [...prev, storeId];
      }
    });
  };

  // Step 2: Continue to item search
  const handleContinueToSearch = () => {
    setCurrentStep(3);
  };

  // Step 3: Search for item prices
  const handleSearchItem = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const selectedStoreData = stores.filter(s => selectedStores.includes(s.id));

      const response = await fetch(`${API_BASE}/api/local-store-finder/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeIds: selectedStores,
          query: itemSearch,
        }),
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned an invalid response. The feature may not be deployed yet.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search prices');
      }

      // Map results to match UI expected format
      const mappedResults = (data.results || []).map(r => ({
        store: r.store_name,
        item: r.item_name,
        price: r.price,
        unit: r.unit,
        link: r.product_url,
        notes: r.notes,
        collectedAt: r.collected_at,
      }));
      setResults(mappedResults);
      setCurrentStep(4); // Results view
    } catch (err) {
      setError(err.message || 'Failed to search prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset to start
  const handleStartOver = () => {
    setCurrentStep(1);
    setLocationText('');
    setStoreType('');
    setIntentText('');
    setStores([]);
    setSelectedStores([]);
    setItemSearch('');
    setResults([]);
    setError('');
  };

  // Validation helpers
  const isStep1Valid = locationText.trim() && storeType;
  const isStep2Valid = selectedStores.length > 0;
  const isStep3Valid = itemSearch.trim();

  return (
    <div className="local-store-finder-app">
      {/* Header */}
      <header className="lsf-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Portal
        </button>
        <div className="header-title">
          <h1>🏪 Local Store Finder</h1>
          <p>Find nearby stores and compare prices</p>
        </div>
        <div className="header-actions">
          {user && (
            <span className="user-name">{user.name || user.email}</span>
          )}
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="wizard-progress">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Location</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Stores</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Search</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Results</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="lsf-content">
        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Step 1: Location & Store Type */}
        {currentStep === 1 && (
          <div className="wizard-step step-1">
            <div className="step-card">
              <h2>📍 Where are you looking?</h2>
              <p className="step-description">Enter your location and what type of stores you need.</p>

              <div className="form-group">
                <label htmlFor="location">Location (Address, City, or ZIP)</label>
                <input
                  id="location"
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g., 123 Main St, Anytown or 12345"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Store Type</label>
                <div className="store-type-grid">
                  {storeTypes.map((type) => (
                    <button
                      key={type.value}
                      className={`store-type-btn ${storeType === type.value ? 'selected' : ''}`}
                      onClick={() => setStoreType(type.value)}
                      disabled={loading}
                    >
                      <span className="type-icon">{type.icon}</span>
                      <span className="type-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="intent">What are you looking for? (Optional)</label>
                <textarea
                  id="intent"
                  value={intentText}
                  onChange={(e) => setIntentText(e.target.value)}
                  placeholder="e.g., I need a new refrigerator, looking for the best deals"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <button
                className="primary-btn"
                onClick={handleFindStores}
                disabled={!isStep1Valid || loading}
              >
                {loading ? 'Finding Stores...' : 'Find Nearby Stores →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Store Selection */}
        {currentStep === 2 && (
          <div className="wizard-step step-2">
            <div className="step-card">
              <h2>🏬 Select Stores to Compare</h2>
              <p className="step-description">Choose which stores you'd like to compare prices at.</p>

              {stores.length === 0 ? (
                <div className="no-stores">
                  <span>😕</span>
                  <p>No stores found in your area. Try a different location.</p>
                  <button className="secondary-btn" onClick={() => setCurrentStep(1)}>
                    ← Go Back
                  </button>
                </div>
              ) : (
                <>
                  <div className="store-list">
                    {stores.map((store) => (
                      <div
                        key={store.id}
                        className={`store-card ${selectedStores.includes(store.id) ? 'selected' : ''}`}
                        onClick={() => toggleStoreSelection(store.id)}
                      >
                        <div className="store-checkbox">
                          {selectedStores.includes(store.id) ? '✓' : ''}
                        </div>
                        <div className="store-info">
                          <h3>{store.name}</h3>
                          <p className="store-address">{store.address}</p>
                          <p className="store-distance">📍 {store.distance}</p>
                        </div>
                        <div className="store-type-badge">{store.type}</div>
                      </div>
                    ))}
                  </div>

                  <div className="step-actions">
                    <button className="secondary-btn" onClick={() => setCurrentStep(1)}>
                      ← Go Back
                    </button>
                    <button
                      className="primary-btn"
                      onClick={handleContinueToSearch}
                      disabled={!isStep2Valid}
                    >
                      Continue →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Item Search */}
        {currentStep === 3 && (
          <div className="wizard-step step-3">
            <div className="step-card">
              <h2>🔍 What are you looking for?</h2>
              <p className="step-description">
                Searching at: {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''}
              </p>

              <div className="selected-stores-preview">
                {stores.filter(s => selectedStores.includes(s.id)).map(store => (
                  <span key={store.id} className="store-tag">{store.name}</span>
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="item-search">Item Name</label>
                <input
                  id="item-search"
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="e.g., Samsung refrigerator, winter jacket, drill set"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="step-actions">
                <button className="secondary-btn" onClick={() => setCurrentStep(2)}>
                  ← Go Back
                </button>
                <button
                  className="primary-btn"
                  onClick={handleSearchItem}
                  disabled={!isStep3Valid || loading}
                >
                  {loading ? 'Searching...' : 'Find Prices →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && (
          <div className="wizard-step step-4">
            <div className="step-card results-card">
              <h2>📊 Price Comparison Results</h2>
              <p className="step-description">
                Showing results for "{itemSearch}" at {selectedStores.length} store{selectedStores.length !== 1 ? 's' : ''}
              </p>

              {results.length === 0 ? (
                <div className="no-results">
                  <span>🔍</span>
                  <p>No results found. Try a different search term.</p>
                </div>
              ) : (
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Store</th>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Unit</th>
                        <th>Link</th>
                        <th>Notes</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, idx) => (
                        <tr key={idx}>
                          <td className="store-cell">{result.store}</td>
                          <td className="item-cell">{result.item}</td>
                          <td className="price-cell">{result.price}</td>
                          <td className="unit-cell">{result.unit || '-'}</td>
                          <td className="link-cell">
                            {result.link ? (
                              <a href={result.link} target="_blank" rel="noopener noreferrer">
                                View →
                              </a>
                            ) : '-'}
                          </td>
                          <td className="notes-cell">{result.notes || '-'}</td>
                          <td className="date-cell">{result.collectedAt || 'Now'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="step-actions">
                <button className="secondary-btn" onClick={() => setCurrentStep(3)}>
                  ← Search Again
                </button>
                <button className="primary-btn" onClick={handleStartOver}>
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="lsf-footer">
        <p>ASR Digital Services • Local Store Finder</p>
      </footer>
    </div>
  );
}
