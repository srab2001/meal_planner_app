#!/bin/bash

# ============================================
# Create Frontend Components Script
# Generates all React component files with full content
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ $1${NC}"; }
print_step() { echo -e "${BLUE}▶ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

if [ -z "$1" ]; then
    echo "Usage: ./create-frontend-files.sh /path/to/mealsapp"
    exit 1
fi

PROJECT_DIR="$1"
CLIENT_DIR="$PROJECT_DIR/client/src"

if [ ! -d "$CLIENT_DIR" ]; then
    print_error "client/src directory not found at: $CLIENT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

echo "=============================================="
echo "   Creating Frontend Component Files"
echo "=============================================="
echo ""

# ============================================
# STEP 1: Backup existing files
# ============================================
print_step "Step 1: Backing up existing files (if any)..."

BACKUP_DIR="backup_frontend_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "client/src/App.js" ]; then
    cp client/src/App.js "$BACKUP_DIR/"
    print_success "Backed up App.js"
fi

if [ -f "client/src/components/Questionnaire.js" ]; then
    cp client/src/components/Questionnaire.js "$BACKUP_DIR/"
    print_success "Backed up Questionnaire.js"
fi

echo ""

# ============================================
# FILE 1: ZIPCodeInput.js
# ============================================
print_step "Creating ZIPCodeInput.js..."

cat > client/src/components/ZIPCodeInput.js << 'ZIPCODEJS'
import React, { useState } from 'react';
import './ZIPCodeInput.css';

function ZIPCodeInput({ onSubmit, user }) {
  const [zipCode, setZipCode] = useState('');
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
      // Call backend to find stores
      const response = await fetch('/api/find-stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zipCode: zipCode.trim() }),
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
          
          <div className="zip-input-wrapper">
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
            
            <button 
              type="submit" 
              className="zip-submit-button"
              disabled={isLoading || !zipCode}
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
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="zip-info">
          <p>💡 <strong>Why do we need this?</strong></p>
          <p>We'll find grocery stores in your area and tailor your meal plan to items available at your local store.</p>
        </div>
      </form>
    </div>
  );
}

export default ZIPCodeInput;
ZIPCODEJS

print_success "Created ZIPCodeInput.js"

# ============================================
# FILE 2: ZIPCodeInput.css
# ============================================
print_step "Creating ZIPCodeInput.css..."

cat > client/src/components/ZIPCodeInput.css << 'ZIPCODECSS'
.zip-code-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.zip-code-header {
  text-align: center;
  margin-bottom: 40px;
}

.zip-code-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.zip-code-header p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

.user-greeting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding: 12px 20px;
  background: #f8f9ff;
  border-radius: 25px;
  display: inline-flex;
}

.user-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #667eea;
}

.zip-code-form {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 30px;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.label-icon {
  font-size: 1.5rem;
}

.zip-input-wrapper {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.zip-input {
  flex: 1;
  min-width: 200px;
  padding: 16px 20px;
  font-size: 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s ease;
  font-family: inherit;
}

.zip-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.zip-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.zip-submit-button {
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.zip-submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.zip-submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinner-small {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.arrow {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.zip-submit-button:hover:not(:disabled) .arrow {
  transform: translateX(4px);
}

.error-message {
  margin-top: 12px;
  padding: 12px;
  background: #fff3f3;
  border-left: 4px solid #ff4444;
  border-radius: 8px;
  color: #cc0000;
  font-weight: 500;
}

.zip-info {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.zip-info p {
  margin: 8px 0;
  color: #555;
  line-height: 1.6;
}

.zip-info strong {
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .zip-code-container {
    padding: 20px 15px;
  }

  .zip-code-header h1 {
    font-size: 2rem;
  }

  .zip-code-form {
    padding: 30px 20px;
  }

  .zip-input-wrapper {
    flex-direction: column;
  }

  .zip-input,
  .zip-submit-button {
    width: 100%;
  }
}
ZIPCODECSS

print_success "Created ZIPCodeInput.css"

# ============================================
# FILE 3: StoreSelection.js
# ============================================
print_step "Creating StoreSelection.js..."

cat > client/src/components/StoreSelection.js << 'STOREJS'
import React, { useState } from 'react';
import './StoreSelection.css';

function StoreSelection({ stores, zipCode, onSubmit, onBack }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedStore) {
      setError('Please select a grocery store');
      return;
    }

    onSubmit(selectedStore);
  };

  return (
    <div className="store-selection-container">
      <div className="store-selection-header">
        <h1>🛒 Select Your Grocery Store</h1>
        <p>Stores near <strong>{zipCode}</strong></p>
        <button onClick={onBack} className="back-button">
          ← Change ZIP Code
        </button>
      </div>

      <form onSubmit={handleSubmit} className="store-selection-form">
        <div className="stores-list">
          {stores && stores.length > 0 ? (
            stores.map((store, index) => (
              <label
                key={index}
                className={`store-card ${selectedStore?.name === store.name ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="store"
                  value={store.name}
                  checked={selectedStore?.name === store.name}
                  onChange={() => {
                    setSelectedStore(store);
                    setError('');
                  }}
                  className="store-radio"
                />
                
                <div className="store-info">
                  <div className="store-header">
                    <span className="store-icon">🏪</span>
                    <h3 className="store-name">{store.name}</h3>
                    {selectedStore?.name === store.name && (
                      <span className="selected-badge">✓ Selected</span>
                    )}
                  </div>
                  
                  {store.address && (
                    <p className="store-address">
                      📍 {store.address}
                    </p>
                  )}
                  
                  {store.distance && (
                    <p className="store-distance">
                      🚗 {store.distance}
                    </p>
                  )}
                  
                  {store.type && (
                    <span className="store-type-badge">{store.type}</span>
                  )}
                </div>
              </label>
            ))
          ) : (
            <div className="no-stores">
              <p>😕 No stores found for this area</p>
              <button type="button" onClick={onBack} className="retry-button">
                Try Different ZIP Code
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {stores && stores.length > 0 && (
          <button
            type="submit"
            className="continue-button"
            disabled={!selectedStore}
          >
            Continue to Meal Preferences
            <span className="arrow">→</span>
          </button>
        )}
      </form>

      <div className="store-info-box">
        <p>💡 <strong>Why select a store?</strong></p>
        <p>We'll tailor your meal plan to ingredients available at your chosen store and prioritize items that are on sale.</p>
      </div>
    </div>
  );
}

export default StoreSelection;
STOREJS

print_success "Created StoreSelection.js"

# ============================================
# FILE 4: StoreSelection.css
# ============================================
print_step "Creating StoreSelection.css..."

cat > client/src/components/StoreSelection.css << 'STORECSS'
.store-selection-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.store-selection-header {
  text-align: center;
  margin-bottom: 40px;
}

.store-selection-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.store-selection-header p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

.back-button {
  padding: 10px 20px;
  font-size: 1rem;
  color: #667eea;
  background: transparent;
  border: 2px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.back-button:hover {
  background: #667eea;
  color: white;
}

.store-selection-form {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stores-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.store-card {
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: block;
}

.store-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.store-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.store-radio {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.store-info {
  pointer-events: none;
}

.store-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.store-icon {
  font-size: 2rem;
}

.store-name {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
}

.selected-badge {
  padding: 4px 12px;
  background: #4caf50;
  color: white;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.store-address {
  color: #666;
  margin: 8px 0;
  font-size: 0.95rem;
}

.store-distance {
  color: #888;
  margin: 8px 0;
  font-size: 0.9rem;
}

.store-type-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e8eaf6;
  color: #5c6bc0;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 8px;
}

.no-stores {
  text-align: center;
  padding: 60px 20px;
}

.no-stores p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

.retry-button {
  padding: 12px 24px;
  font-size: 1rem;
  color: white;
  background: #667eea;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.error-message {
  margin: 20px 0;
  padding: 12px;
  background: #fff3f3;
  border-left: 4px solid #ff4444;
  border-radius: 8px;
  color: #cc0000;
  font-weight: 500;
}

.continue-button {
  width: 100%;
  padding: 18px;
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.continue-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.continue-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow {
  font-size: 1.3rem;
  transition: transform 0.3s ease;
}

.continue-button:hover:not(:disabled) .arrow {
  transform: translateX(4px);
}

.store-info-box {
  margin-top: 30px;
  padding: 20px;
  background: #f8f9ff;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.store-info-box p {
  margin: 8px 0;
  color: #555;
  line-height: 1.6;
}

.store-info-box strong {
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .store-selection-container {
    padding: 20px 15px;
  }

  .store-selection-header h1 {
    font-size: 2rem;
  }

  .store-selection-form {
    padding: 20px;
  }

  .store-card {
    padding: 15px;
  }

  .store-name {
    font-size: 1.1rem;
  }

  .store-header {
    flex-wrap: wrap;
  }
}
STORECSS

print_success "Created StoreSelection.css"

echo ""
echo "=============================================="
print_success "✨ All Frontend Components Created!"
echo "=============================================="
echo ""

echo "Files created:"
echo "  ✓ client/src/components/ZIPCodeInput.js"
echo "  ✓ client/src/components/ZIPCodeInput.css"
echo "  ✓ client/src/components/StoreSelection.js"
echo "  ✓ client/src/components/StoreSelection.css"
echo ""

if [ -d "$BACKUP_DIR" ]; then
    echo "Backups saved in: $BACKUP_DIR"
    echo ""
fi

print_info "⚠️  IMPORTANT: You still need to update App.js manually!"
echo ""
echo "See: UPDATE_APP_JS_GUIDE.md for instructions"
echo "Or use the automated script: ./update-app-js.sh"
echo ""
