import React, { useState, useEffect } from 'react';
import './App.css';
import SplashScreenOverlay from './components/SplashScreenOverlay';
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
import Questionnaire from './components/Questionnaire';
import PaymentPage from './components/PaymentPage';
import MealPlanView from './components/MealPlanView';
import Profile from './components/Profile';
import Admin from './components/Admin';
import MealOfTheDay from './components/MealOfTheDay';
import RecipeCard from './components/RecipeCard';

// Use relative paths in production (proxied by Vercel) or localhost in development
const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
console.log('API_BASE in browser:', API_BASE);

// Token management helpers
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [zipCode, setZipCode] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState({ primaryStore: null, comparisonStore: null });
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  // Helper for authenticated API calls
  const fetchWithAuth = (url, options = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
  };

  // Check for token in URL hash (from OAuth redirect) and authenticate
  useEffect(() => {
    // Check if accessing admin panel
    if (window.location.pathname === '/admin') {
      setCurrentView('admin');
      return;
    }

    // Check if accessing meal of the day
    if (window.location.pathname === '/meal-of-the-day') {
      setCurrentView('meal-of-the-day');
      return;
    }

    // Check if accessing recipe card
    if (window.location.pathname.startsWith('/recipe-card/')) {
      setCurrentView('recipe-card');
      return;
    }

    // Check for add_meal query parameter (from meal of the day CTA)
    const urlParams = new URLSearchParams(window.location.search);
    const mealToAdd = urlParams.get('add_meal');
    if (mealToAdd) {
      console.log('🍽️ User wants to add meal:', mealToAdd);
      localStorage.setItem('pending_meal_id', mealToAdd);
      // Show a friendly message that they need to sign up first
      alert('✨ Great choice! Sign in or create an account to add this meal to your personalized plan.');
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Check if there's a token in the URL hash (from OAuth redirect)
    const hash = window.location.hash;
    if (hash && hash.includes('token=')) {
      const token = hash.split('token=')[1].split('&')[0];
      console.log('Token received from OAuth redirect');
      setToken(token);
      // Clean up the URL
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Check if user is already authenticated with existing token
    const token = getToken();
    if (token) {
      console.log('Token found in localStorage, verifying...');
      fetch(`${API_BASE}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            console.log('User authenticated:', data.user.email);
            setUser(data.user);
            setCurrentView('zip');
          } else {
            console.log('Token invalid, removing');
            removeToken();
          }
        })
        .catch(err => {
          console.error('Error checking auth:', err);
          removeToken();
        });
    }
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
      const response = await fetchWithAuth(`${API_BASE}/api/payment-status`);
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

      const requestBody = {
        ...prefs,
        zipCode,
        primaryStore: selectedStores.primaryStore,
        comparisonStore: selectedStores.comparisonStore
      };

      console.log('🚀 Generating meal plan with request:', {
        selectedDays: requestBody.selectedDays,
        selectedMeals: requestBody.selectedMeals,
        cuisines: requestBody.cuisines,
        people: requestBody.people
      });

      const response = await fetchWithAuth(`${API_BASE}/api/generate-meals`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
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
    removeToken();
    setUser(null);
    setCurrentView('login');
    setZipCode('');
    setStores([]);
    setSelectedStores({ primaryStore: null, comparisonStore: null });
    setPreferences(null);
    setMealPlan(null);
    console.log('User logged out');
  };

  // Handler: View Profile
  const handleViewProfile = () => {
    setCurrentView('profile');
  };

  // Handler: Back from Profile
  const handleBackFromProfile = () => {
    // Return to previous view (usually mealplan or zip)
    if (mealPlan) {
      setCurrentView('mealplan');
    } else {
      setCurrentView('zip');
    }
  };

  return (
    <div className="App">
      <SplashScreenOverlay />

      {currentView === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {currentView === 'zip' && (
        <ZIPCodeInput
          onSubmit={handleZIPSubmit}
          user={user}
          onViewProfile={handleViewProfile}
          onLogout={handleLogout}
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
          onViewProfile={handleViewProfile}
        />
      )}

      {currentView === 'profile' && (
        <Profile
          user={user}
          onBack={handleBackFromProfile}
        />
      )}

      {currentView === 'admin' && (
        <Admin />
      )}

      {currentView === 'meal-of-the-day' && (
        <MealOfTheDay />
      )}

      {currentView === 'recipe-card' && (
        <RecipeCard />
      )}
    </div>
  );
}

export default App;