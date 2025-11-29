# Phase 1 Implementation Guide
# ZIP Code Entry & Store Selection

## 📋 Overview
Add ZIP code entry and AI-powered grocery store finder to your meal planner.

---

## 🎯 What Gets Built

1. ✅ ZIP code input page
2. ✅ GPT-powered store finder
3. ✅ Store selection UI
4. ✅ Pass selected store to meal generation

---

## 📂 Files to Create/Modify

### Frontend (React):
- `client/src/components/ZIPCodeInput.js` (NEW)
- `client/src/components/ZIPCodeInput.css` (NEW)
- `client/src/components/StoreSelection.js` (NEW)
- `client/src/components/StoreSelection.css` (NEW)
- `client/src/App.js` (MODIFY)
- `client/src/components/Questionnaire.js` (MODIFY - remove grocery store input)

### Backend (Node.js):
- `server.js` (MODIFY - add new endpoints)

---

## 🔨 Step-by-Step Implementation

### STEP 1: Create ZIP Code Input Component

**File:** `client/src/components/ZIPCodeInput.js`

```javascript
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
```

---

**File:** `client/src/components/ZIPCodeInput.css`

```css
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
```

---

### STEP 2: Create Store Selection Component

**File:** `client/src/components/StoreSelection.js`

```javascript
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
```

---

**File:** `client/src/components/StoreSelection.css`

```css
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
```

---

### STEP 3: Add Backend Endpoint

**File:** `server.js` (ADD THIS CODE)

```javascript
// ADD THIS AFTER YOUR EXISTING ROUTES, BEFORE app.listen()

// Store Finder Endpoint
app.post('/api/find-stores', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { zipCode } = req.body;

    if (!zipCode || !/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return res.status(400).json({ error: 'Invalid ZIP code' });
    }

    // Use GPT to find common stores in the area
    const prompt = `Given the ZIP code ${zipCode}, list major grocery stores commonly found in this area of the United States.

For each store, provide:
- name: The official store name
- type: Category like "Organic", "Discount", "Conventional", "Specialty"
- typical_distance: Range like "1-3 miles", "2-5 miles", etc.

List 6-8 major chains that would realistically be in this area. Include a mix of:
- National chains (Walmart, Kroger, Target)
- Regional chains appropriate for this area
- Specialty stores (Whole Foods, Trader Joe's)

Return ONLY valid JSON in this exact format:
{
  "stores": [
    {
      "name": "Store Name",
      "address": "Typical location within 5 miles",
      "distance": "2-4 miles",
      "type": "Conventional"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides grocery store information. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const storeData = JSON.parse(responseText);

    res.json(storeData);

  } catch (error) {
    console.error('Error finding stores:', error);
    res.status(500).json({ error: 'Failed to find stores' });
  }
});
```

---

### STEP 4: Update App.js Flow

**File:** `client/src/App.js` (MODIFY)

```javascript
import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';  // NEW
import StoreSelection from './components/StoreSelection';  // NEW
import Questionnaire from './components/Questionnaire';
import MealPlan from './components/MealPlan';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('login');  // login, zip, store, questionnaire, mealplan
  const [zipCode, setZipCode] = useState('');  // NEW
  const [stores, setStores] = useState([]);  // NEW
  const [selectedStore, setSelectedStore] = useState(null);  // NEW
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/auth/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setCurrentStep('zip');  // Changed from 'questionnaire'
      } else {
        setCurrentStep('login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentStep('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST' });
    setUser(null);
    setCurrentStep('login');
    setZipCode('');
    setStores([]);
    setSelectedStore(null);
    setPreferences(null);
    setMealPlan(null);
  };

  // NEW: Handle ZIP code submission
  const handleZIPSubmit = ({ zipCode, stores }) => {
    setZipCode(zipCode);
    setStores(stores);
    setCurrentStep('store');
  };

  // NEW: Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    setCurrentStep('questionnaire');
  };

  // NEW: Handle back to ZIP
  const handleBackToZIP = () => {
    setCurrentStep('zip');
    setStores([]);
    setSelectedStore(null);
  };

  const handleQuestionnaireSubmit = async (prefs) => {
    setPreferences(prefs);
    setCurrentStep('loading');

    try {
      // Pass selected store info to meal generation
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prefs,
          zipCode,  // NEW
          groceryStore: selectedStore  // NEW - pass full store object
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      setMealPlan(data.mealPlan);
      setCurrentStep('mealplan');

    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
      setCurrentStep('questionnaire');
    }
  };

  const handleRegenerateMeals = async (selectedMeals) => {
    try {
      const response = await fetch('/api/regenerate-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences,
          selectedMeals,
          zipCode,  // NEW
          groceryStore: selectedStore  // NEW
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate meals');
      }

      const data = await response.json();
      
      // Update meal plan with new meals
      const updatedMealPlan = mealPlan.map((day) => {
        const updatedDay = { ...day };
        
        Object.keys(selectedMeals).forEach(mealKey => {
          if (selectedMeals[mealKey] && data.newMeals[mealKey]) {
            updatedDay[mealKey] = data.newMeals[mealKey];
          }
        });
        
        return updatedDay;
      });

      setMealPlan(updatedMealPlan);

    } catch (error) {
      console.error('Error regenerating meals:', error);
      alert('Failed to regenerate meals. Please try again.');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('zip');  // Changed from 'questionnaire'
    setZipCode('');
    setStores([]);
    setSelectedStore(null);
    setPreferences(null);
    setMealPlan(null);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {currentStep === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {currentStep === 'zip' && (
        <ZIPCodeInput 
          onSubmit={handleZIPSubmit}
          user={user}
        />
      )}

      {currentStep === 'store' && (
        <StoreSelection
          stores={stores}
          zipCode={zipCode}
          onSubmit={handleStoreSelect}
          onBack={handleBackToZIP}
        />
      )}

      {currentStep === 'questionnaire' && (
        <Questionnaire 
          onSubmit={handleQuestionnaireSubmit}
          user={user}
          selectedStore={selectedStore}  // NEW - pass to display
        />
      )}

      {currentStep === 'loading' && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <h2>Creating Your Personalized Meal Plan...</h2>
            <p>This may take 20-30 seconds</p>
          </div>
        </div>
      )}

      {currentStep === 'mealplan' && (
        <MealPlan
          mealPlan={mealPlan}
          preferences={preferences}
          user={user}
          selectedStore={selectedStore}  // NEW - pass to display
          onRegenerate={handleRegenerateMeals}
          onStartOver={handleStartOver}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
```

---

### STEP 5: Update Questionnaire (Remove Grocery Input)

**File:** `client/src/components/Questionnaire.js` (MODIFY)

Remove the grocery store input section since we now have it from the previous step.

Add this at the top to show selected store:

```javascript
function Questionnaire({ onSubmit, user, selectedStore }) {
  // ... existing state ...

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-header">
        <h1>🍽️ Let's Plan Your Meals</h1>
        <p>Tell us your preferences</p>
        
        {/* NEW: Show selected store */}
        {selectedStore && (
          <div className="selected-store-display">
            <span className="store-icon-small">🛒</span>
            <span>Shopping at: <strong>{selectedStore.name}</strong></span>
          </div>
        )}
        
        {user && (
          <div className="user-greeting">
            <img src={user.picture} alt={user.name} className="user-avatar-small" />
            <span>Hi, {user.given_name}!</span>
          </div>
        )}
      </div>

      {/* Remove the grocery store input section */}
      {/* Keep all other sections */}
      
      {/* ... rest of component ... */}
    </div>
  );
}
```

Add this CSS to Questionnaire.css:

```css
.selected-store-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #e8f5e9;
  border-radius: 20px;
  margin: 15px 0;
}

.store-icon-small {
  font-size: 1.2rem;
}

.selected-store-display strong {
  color: #2e7d32;
}
```

---

## ✅ Testing Phase 1

### Test Flow:
1. Start app
2. Login with Google
3. Enter ZIP code (e.g., 27617)
4. See list of stores
5. Select a store
6. Continue to questionnaire
7. See selected store displayed
8. Generate meal plan

### Verify:
- ✅ ZIP validation works
- ✅ Stores load from GPT
- ✅ Store selection works
- ✅ Selected store shows in questionnaire
- ✅ Store info passes to meal generation

---

## 🎉 Phase 1 Complete!

You now have:
- ✅ ZIP code input
- ✅ AI-powered store finder
- ✅ Store selection UI
- ✅ Integration with existing flow

**Next:** Move to Phase 2 for price scraping!
