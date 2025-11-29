import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
import Questionnaire from './components/Questionnaire';
import MealPlanView from './components/MealPlanView';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [zipCode, setZipCode] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  // Check if user is already authenticated
  useEffect(() => {
    fetch('/auth/user', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setCurrentView('zip');
        }
      })
      .catch(err => console.error('Error checking auth:', err));
  }, []);

  // Handler: Login
  const handleLogin = (userData) => {
    console.log('🟢 User logged in:', userData);
    setUser(userData);
    setCurrentView('zip');
  };

  // Handler: ZIP Code Submit
  const handleZIPSubmit = ({ zipCode: enteredZip, stores: foundStores }) => {
    console.log('🟢 ZIP submitted:', enteredZip);
    console.log('🟢 Stores found:', foundStores);
    setZipCode(enteredZip);
    setStores(foundStores);
    setCurrentView('store');
  };

  // Handler: Store Selection
  const handleStoreSelect = (store) => {
    console.log('🟢 Store selected:', store);
    setSelectedStore(store);
    setCurrentView('questionnaire');
  };

  // Handler: Back to ZIP
  const handleBackToZIP = () => {
    console.log('🟢 Going back to ZIP entry');
    setCurrentView('zip');
    setStores([]);
    setSelectedStore(null);
  };

  // Handler: Refresh Stores
  const handleRefreshStores = (newStores) => {
    console.log('🟢 Refreshing stores with new list:', newStores);
    setStores(newStores);
  };

  // Handler: Questionnaire Complete
  const handleQuestionnaireComplete = async (prefs) => {
    console.log('🟢 Questionnaire completed');
    console.log('Preferences:', prefs);
    console.log('ZIP Code:', zipCode);
    console.log('Selected Store:', selectedStore);
    
    setPreferences(prefs);
    setCurrentView('loading');

    try {
      console.log('🟢 Sending API request to /api/generate-meals...');
      const startTime = Date.now();
      
      const response = await fetch('/api/generate-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prefs,
          zipCode,
          groceryStore: selectedStore
        }),
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`🟢 API responded in ${elapsed} seconds`);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate meal plan');
      }

      console.log('🟢 Parsing response...');
      const data = await response.json();
      console.log('🟢 Received data keys:', Object.keys(data));
      
      if (data.mealPlan) {
        console.log('🟢 Meal plan days:', Object.keys(data.mealPlan));
      }
      if (data.shoppingList) {
        console.log('🟢 Shopping list categories:', Object.keys(data.shoppingList));
      }
      console.log('🟢 Total cost:', data.totalEstimatedCost);
      
      setMealPlan(data);
      setCurrentView('mealplan');
      console.log('✅ Success! Showing meal plan view');

    } catch (error) {
      console.error('❌❌❌ Frontend Error:', error);
      console.error('Error message:', error.message);
      alert('Failed to generate meal plan: ' + error.message + '\n\nPlease try again or check the console for details.');
      setCurrentView('questionnaire');
    }
  };

  // Handler: Start Over
  const handleStartOver = () => {
    console.log('🟢 Starting over - resetting all state');
    setCurrentView('zip');
    setZipCode('');
    setStores([]);
    setSelectedStore(null);
    setPreferences(null);
    setMealPlan(null);
  };

  // Handler: Logout
  const handleLogout = () => {
    console.log('🟢 Logging out');
    window.location.href = '/auth/logout';
  };

  return (
    <div className="App">
      {/* Login View */}
      {currentView === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {/* ZIP Code Entry View */}
      {currentView === 'zip' && (
        <ZIPCodeInput 
          onSubmit={handleZIPSubmit}
          user={user}
        />
      )}

      {/* Store Selection View */}
      {currentView === 'store' && (
        <StoreSelection
          stores={stores}
          zipCode={zipCode}
          onSubmit={handleStoreSelect}
          onBack={handleBackToZIP}
          onRefreshStores={handleRefreshStores}
        />
      )}

      {/* Questionnaire View */}
      {currentView === 'questionnaire' && (
        <Questionnaire 
          onSubmit={handleQuestionnaireComplete}
          user={user}
          selectedStore={selectedStore}
        />
      )}

      {/* Loading View */}
      {currentView === 'loading' && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <h2>Creating Your Personalized Meal Plan...</h2>
            <p>This may take 20-30 seconds</p>
            <p className="loading-details">
              Analyzing your preferences, finding recipes, and building your shopping list...
            </p>
          </div>
        </div>
      )}

      {/* Meal Plan View */}
      {currentView === 'mealplan' && (
        <MealPlanView
          mealPlan={mealPlan}
          preferences={preferences}
          user={user}
          selectedStore={selectedStore}
          onStartOver={handleStartOver}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;