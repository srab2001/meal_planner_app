import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
import Questionnaire from './components/Questionnaire';
import PaymentPage from './components/PaymentPage';
import MealPlanView from './components/MealPlanView';

// Use relative paths in production (proxied by Vercel) or localhost in development
const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
console.log('API_BASE in browser:', API_BASE);

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [zipCode, setZipCode] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState({ primaryStore: null, comparisonStore: null });
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  // Check if user is already authenticated
  useEffect(() => {
    fetch(`${API_BASE}/auth/user`, {
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
    setUser(userData);
    setCurrentView('zip');
  };

  // Handler: ZIP Code Submit
  const handleZIPSubmit = ({ zipCode: enteredZip, stores: foundStores }) => {
    setZipCode(enteredZip);
    setStores(foundStores);
    setCurrentView('store');
  };

  // Handler: Store Selection
  const handleStoreSelect = (storesData) => {
    setSelectedStores(storesData);
    setCurrentView('questionnaire');
  };

  // Handler: Back to ZIP
  const handleBackToZIP = () => {
    setCurrentView('zip');
    setStores([]);
    setSelectedStores({ primaryStore: null, comparisonStore: null });
  };

  // Handler: Refresh Stores
  const handleRefreshStores = (newStores) => {
    setStores(newStores);
  };

  // Handler: Questionnaire Complete
  const handleQuestionnaireComplete = async (prefs) => {
    setPreferences(prefs);

    // Check if user already has paid access
    try {
      const response = await fetch(`${API_BASE}/api/payment-status`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.hasPaidAccess) {
        // User already paid, skip payment page
        generateMealPlan(prefs);
      } else {
        // Show payment page
        setCurrentView('payment');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Default to showing payment page if check fails
      setCurrentView('payment');
    }
  };

  // Handler: Payment Complete
  const handlePaymentComplete = () => {
    generateMealPlan(preferences);
  };

  // Generate meal plan (called after payment)
  const generateMealPlan = async (prefs) => {
    setCurrentView('loading');

    try {
      const startTime = Date.now();

      const response = await fetch(`${API_BASE}/api/generate-meals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...prefs,
          zipCode,
          primaryStore: selectedStores.primaryStore,
          comparisonStore: selectedStores.comparisonStore
        }),
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('Generate meals response time (seconds):', elapsed);
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to generate meal plan');
      }

      const data = await response.json();
      setMealPlan(data);
      setCurrentView('mealplan');
    } catch (error) {
      console.error('Frontend error:', error);
      alert(
        'Failed to generate meal plan: ' +
        error.message +
        '\n\nPlease try again or check the console for details.'
      );
      setCurrentView('questionnaire');
    }
  };

  // Handler: Start Over
  const handleStartOver = () => {
    setCurrentView('zip');
    setZipCode('');
    setStores([]);
    setSelectedStores({ primaryStore: null, comparisonStore: null });
    setPreferences(null);
    setMealPlan(null);
  };

  // Handler: Logout
  const handleLogout = () => {
    window.location.href = `${API_BASE}/auth/logout`;
  };

  return (
    <div className="App">
      {currentView === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {currentView === 'zip' && (
        <ZIPCodeInput
          onSubmit={handleZIPSubmit}
          user={user}
        />
      )}

      {currentView === 'store' && (
        <StoreSelection
          stores={stores}
          zipCode={zipCode}
          onSubmit={handleStoreSelect}
          onBack={handleBackToZIP}
          onRefreshStores={handleRefreshStores}
        />
      )}

      {currentView === 'questionnaire' && (
        <Questionnaire
          onSubmit={handleQuestionnaireComplete}
          user={user}
          selectedStores={selectedStores}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'payment' && (
        <PaymentPage
          user={user}
          selectedStores={selectedStores}
          preferences={preferences}
          onPaymentComplete={handlePaymentComplete}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'loading' && (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="spinner-large"></div>
            <h2>Creating your meal plan</h2>
            <p>This can take up to 30 seconds</p>
            <p className="loading-details">
              Building meals and a shopping list based on your inputs
            </p>
          </div>
        </div>
      )}

      {currentView === 'mealplan' && (
        <MealPlanView
          mealPlan={mealPlan}
          preferences={preferences}
          user={user}
          selectedStores={selectedStores}
          onStartOver={handleStartOver}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;