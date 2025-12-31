import React, { useState, useEffect } from 'react';
import './App.css';
import SplashScreenOverlay from './components/SplashScreenOverlay';
import AppSwitchboard from './components/AppSwitchboard';
import LoginPage from './components/LoginPage';
import ZIPCodeInput from './components/ZIPCodeInput';
import StoreSelection from './components/StoreSelection';
import Questionnaire from './components/Questionnaire';
import PaymentPage from './components/PaymentPage';
import MealPlanView from './components/MealPlanView';
import HistoryMenu from './components/HistoryMenu';
import Profile from './components/Profile';
import Admin from './components/Admin';
import MealOfTheDay from './components/MealOfTheDay';
import RecipeCard from './components/RecipeCard';
import WorkoutCheckOff from './components/WorkoutCheckOff';

// Nutrition Module
import { NutritionApp } from './modules/nutrition';

// Coaching Module
import { CoachingApp } from './modules/coaching';

// Progress Module (streaks, badges, referrals)
import { ProgressApp } from './modules/progress';

// Integrations Module (health data connections)
import { IntegrationsApp } from './modules/integrations';

// Fitness Module
import { FitnessApp } from './modules/fitness';

// Local Store Finder Module
import { LocalStoreFinderApp } from './modules/local-store-finder';

// Pantry App
import PantryApp from './apps/pantry/PantryApp';

// Household Setup
import { HouseholdSetup } from './apps/household';

// Admin Module (AI Coach question management)
import { AdminCoachPanel, AdminSwitchboard, UsersAdmin } from './modules/admin';

// Analytics Service
import analyticsService from './shared/services/AnalyticsService';

// Engagement Services
import { EngagementProvider } from './shared/context/EngagementContext';

// API Configuration - Always use production URLs (Vercel/Render)
// Local development should also point to production to avoid port conflicts
const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;
console.log('API_BASE in browser:', API_BASE);

// Token management helpers
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

function App() {
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('switchboard');
  const [zipCode, setZipCode] = useState('');
  const [stores, setStores] = useState([]);
  const [selectedStores, setSelectedStores] = useState({ primaryStore: null, comparisonStore: null });
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [checkoffToken, setCheckoffToken] = useState(null);

  // Helper for authenticated API calls with 401 handling
  const fetchWithAuth = async (url, options = {}) => {
    const token = getToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    // Handle authentication failures globally
    if (response.status === 401 || response.status === 403) {
      console.error('🔐 Authentication failed - logging out user');
      removeToken();
      setUser(null);
      setCurrentView('login');
    }

    return response;
  };

  // Handler: Login - MUST be defined before useEffect that calls it
  const handleLogin = (userData) => {
    console.log('🔐 handleLogin called for:', userData?.email);

    // Save user to localStorage FIRST
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Clear any stale SSO returnTo value (users always go to switchboard after login)
    localStorage.removeItem('sso_return_to');
    console.log('🔐 handleLogin: User logged in, going to switchboard');

    // Check if there's a redirect stored (user was trying to access specific app)
    const redirectTo = localStorage.getItem('redirect_after_login');
    if (redirectTo) {
      console.log('🔐 Redirecting to stored destination:', redirectTo);
      localStorage.removeItem('redirect_after_login');
      setCurrentView(redirectTo);
    } else {
      // Default: go to switchboard after login
      console.log('🔐 No redirect stored, going to switchboard');
      setShowSplash(false); // Ensure splash is hidden
      setCurrentView('switchboard');
    }
  };

  // Check for token in URL hash (from OAuth redirect) and authenticate
  useEffect(() => {
    // Check if accessing admin panel (public route - skip splash)
    if (window.location.pathname === '/admin') {
      setShowSplash(false);
      setCurrentView('admin');
      return;
    }

    // Check if accessing meal of the day (public route - skip splash)
    if (window.location.pathname === '/meal-of-the-day') {
      setShowSplash(false);
      setCurrentView('meal-of-the-day');
      return;
    }

    // Check if accessing recipe card (public route - skip splash)
    if (window.location.pathname.startsWith('/recipe-card/')) {
      setShowSplash(false);
      setCurrentView('recipe-card');
      return;
    }

    // Check if accessing workout check-off (public route - skip splash)
    if (window.location.pathname.startsWith('/workout/check-off/')) {
      const token = window.location.pathname.split('/workout/check-off/')[1];
      if (token) {
        setCheckoffToken(token);
        setShowSplash(false);
        setCurrentView('workout-checkoff');
        return;
      }
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

      // Extract redirect destination if it exists in the hash
      const redirectMatch = hash.match(/redirect=([^&]*)/);
      if (redirectMatch && redirectMatch[1]) {
        const redirect = decodeURIComponent(redirectMatch[1]);
        console.log('🔄 Found redirect in OAuth response:', redirect);
        localStorage.setItem('redirect_after_login', redirect);
      }

      // Note: returnTo is now stored in localStorage BEFORE OAuth redirect (in AppSwitchboard.js)
      // This ensures it survives the OAuth flow. We no longer try to extract it from the URL here.

      // Clean up the URL completely (remove hash AND query params)
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
        .then(res => {
          if (!res.ok) {
            console.warn(`Auth verification returned ${res.status}, still attempting login with token...`);
            // Even if verification fails, if we have a token and redirect, proceed
            const redirect = localStorage.getItem('redirect_after_login');
            if (redirect) {
              console.log('🔄 Have redirect info, proceeding despite auth verification issue');
              setShowSplash(false);
              localStorage.removeItem('redirect_after_login');
              setCurrentView(redirect);
              return null;
            }
            throw new Error(`Auth failed with status ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (!data) return; // Already handled above
          
          if (data.user) {
            console.log('User authenticated:', data.user.email);
            // Call handleLogin to trigger redirect logic
            handleLogin(data.user);
          } else {
            console.log('Token invalid, removing');
            removeToken();
          }
        })
        .catch(err => {
          console.error('Error checking auth:', err);
          // On network/CORS errors, check if we have redirect info to proceed with
          const redirect = localStorage.getItem('redirect_after_login');
          if (redirect) {
            console.log('🔄 Network error but have redirect, proceeding to:', redirect);
            setShowSplash(false);
            localStorage.removeItem('redirect_after_login');
            setCurrentView(redirect);
          } else {
            // Only remove token if there's no redirect pending
            removeToken();
          }
        });
    }

  }, []);

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

  // Handler: Go to History Menu (before store selection)
  const handleGoToHistoryMenu = () => {
    setCurrentView('history-menu');
  };

  // Handler: Load Previous Meal Plan
  const handleLoadHistoricalPlan = (entry) => {
    console.log('📋 Loading historical meal plan:', entry);
    if (entry.meal_plan) {
      setMealPlan(entry.meal_plan);
      setPreferences(entry.preferences);
      setSelectedStores(entry.stores || { primaryStore: null, comparisonStore: null });
      // Go directly to meal plan view (skip store selection)
      setCurrentView('mealplan');
    }
  };

  // Handler: Create New Plan (from history menu)
  const handleCreateNewPlan = () => {
    // Reset meal plan data and go to store selection
    setMealPlan(null);
    setPreferences(null);
    setSelectedStores({ primaryStore: null, comparisonStore: null });
    setCurrentView('store');
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
    // Track conversion to paid
    analyticsService.trackConversion('paid', {
      source: 'payment_page'
    });
    generateMealPlan(preferences);
  };

  // Generate meal plan (called after payment)
  const generateMealPlan = async (prefs) => {
    setCurrentView('loading');

    // Track plan generation started
    analyticsService.trackPlanGeneration('started', {
      days: prefs?.selectedDays?.length,
      preferences: prefs?.cuisines?.length || 0
    });

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

      // Track plan generation completed
      analyticsService.trackPlanGeneration('completed', {
        days: prefs?.selectedDays?.length,
        duration: ((Date.now() - startTime) / 1000).toFixed(2)
      });
    } catch (error) {
      console.error('Frontend error:', error);

      // Track plan generation failed
      analyticsService.trackPlanGeneration('failed', {
        error: error.message
      });

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
    setCurrentView('switchboard');
    setZipCode('');
    setStores([]);
    setSelectedStores({ primaryStore: null, comparisonStore: null });
    setPreferences(null);
    setMealPlan(null);
    console.log('User logged out');
  };

  // Handler: Splash Complete - Route to App Switchboard
  const handleSplashComplete = () => {
    console.log('🎬 handleSplashComplete called, currentView:', currentView);
    setShowSplash(false);
    // If there's a specific route (admin, meal-of-the-day, etc), don't override
    // Otherwise show switchboard
    if (!['admin', 'meal-of-the-day', 'recipe-card', 'workout-checkoff'].includes(currentView)) {
      console.log('🎬 Setting currentView to switchboard');
      setCurrentView('switchboard');
      // Track switchboard view
      analyticsService.trackSwitchboardView();
    }
  };

  // Handler: App Selection from Switchboard
  const handleSelectApp = (appId) => {
    console.log('Selected app:', appId);

    // Track app selection analytics
    analyticsService.trackAppSelection(appId, currentView);

    switch (appId) {
      case 'meal-planner':
        // Check if user is authenticated
        const token = getToken();
        if (token && user) {
          setCurrentView('zip');
        } else {
          // Remember where user wants to go after login
          localStorage.setItem('redirect_after_login', 'zip');
          setCurrentView('login');
        }
        break;
      case 'nutrition':
        // Nutrition module - requires authentication
        const nutritionToken = getToken();
        if (nutritionToken && user) {
          setCurrentView('nutrition');
        } else {
          // Remember where user wants to go after login
          localStorage.setItem('redirect_after_login', 'nutrition');
          setCurrentView('login');
        }
        break;
      case 'coaching':
        // Coaching module - requires authentication
        const coachingToken = getToken();
        if (coachingToken && user) {
          setCurrentView('coaching');
        } else {
          // Remember where user wants to go after login
          localStorage.setItem('redirect_after_login', 'coaching');
          setCurrentView('login');
        }
        break;
      case 'progress':
        // Progress module - requires authentication
        const progressToken = getToken();
        if (progressToken && user) {
          setCurrentView('progress');
        } else {
          // Remember where user wants to go after login
          localStorage.setItem('redirect_after_login', 'progress');
          setCurrentView('login');
        }
        break;
      case 'integrations':
        // Integrations module - requires authentication
        const integrationsToken = getToken();
        if (integrationsToken && user) {
          setCurrentView('integrations');
        } else {
          // Remember where user wants to go after login
          localStorage.setItem('redirect_after_login', 'integrations');
          setCurrentView('login');
        }
        break;
      case 'health-tracker':
        // Future app - not yet implemented
        alert(`${appId} is coming soon!`);
        break;
      case 'fitness':
        // Fitness module - requires authentication
        const fitnessToken = getToken();
        if (fitnessToken && user) {
          setCurrentView('fitness');
        } else {
          // Remember where user wants to go after login
          localStorage.setItem('redirect_after_login', 'fitness');
          setCurrentView('login');
        }
        break;
      case 'local-store-finder':
        // Local Store Finder - requires authentication
        const lsfToken = getToken();
        if (lsfToken && user) {
          setCurrentView('local-store-finder');
        } else {
          localStorage.setItem('redirect_after_login', 'local-store-finder');
          setCurrentView('login');
        }
        break;
      case 'pantry':
        // Pantry - requires authentication and household
        const pantryToken = getToken();
        if (pantryToken && user) {
          const householdId = localStorage.getItem('active_household_id');
          if (!householdId) {
            // No household - redirect to setup
            localStorage.setItem('redirect_after_household', 'pantry');
            setCurrentView('household-setup');
          } else {
            setCurrentView('pantry');
          }
        } else {
          localStorage.setItem('redirect_after_login', 'pantry');
          setCurrentView('login');
        }
        break;
      case 'household-setup':
        // Household Setup - requires authentication
        const hsToken = getToken();
        if (hsToken && user) {
          setCurrentView('household-setup');
        } else {
          localStorage.setItem('redirect_after_login', 'household-setup');
          setCurrentView('login');
        }
        break;
      case 'admin':
        // Admin panel - requires authentication and admin role
        const adminToken = getToken();
        if (adminToken && user && user.role === 'admin') {
          setCurrentView('admin-panel');
        } else {
          // Not authorized
          setCurrentView('switchboard');
          alert('You do not have admin privileges');
        }
        break;
      default:
        setCurrentView('switchboard');
    }
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

  // Handler: View Admin Panel
  const handleViewAdminPanel = () => {
    setCurrentView('admin-coach');
  };

  // Handler: Back from Admin Panel
  const handleBackFromAdminPanel = () => {
    setCurrentView('switchboard');
  };

  // Log current state for debugging
  console.log('🔄 App render - showSplash:', showSplash, 'currentView:', currentView, 'user:', user?.email);

  return (
    <EngagementProvider toastPosition="top-right">
      <div className="App">
        {/* Splash Screen - shown on first load only, before app selection */}
        {showSplash && (
          <SplashScreenOverlay onComplete={handleSplashComplete} />
        )}

      {/* App Switchboard - main app launcher */}
      {!showSplash && currentView === 'switchboard' && (
        <AppSwitchboard
          onSelectApp={handleSelectApp}
          user={user}
          onLogout={handleLogout}
          onLogin={handleLogin}
        />
      )}

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

      {currentView === 'history-menu' && (
        <HistoryMenu
          user={user}
          onNewPlan={handleCreateNewPlan}
          onLoadPlan={handleLoadHistoricalPlan}
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
          onViewNutrition={() => setCurrentView('nutrition')}
          onGoToHistoryMenu={handleGoToHistoryMenu}
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

      {/* Admin Coach Panel (question management) */}
      {currentView === 'admin-coach' && (
        <AdminCoachPanel
          user={user}
          onBack={handleBackFromAdminPanel}
        />
      )}

      {currentView === 'meal-of-the-day' && (
        <MealOfTheDay />
      )}

      {currentView === 'recipe-card' && (
        <RecipeCard />
      )}

      {/* Workout Check-Off (public, no auth required) */}
      {currentView === 'workout-checkoff' && checkoffToken && (
        <WorkoutCheckOff token={checkoffToken} />
      )}

      {/* Nutrition Module */}
      {currentView === 'nutrition' && (
        <NutritionApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Coaching Module */}
      {currentView === 'coaching' && (
        <CoachingApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Progress Module (streaks, badges, referrals) */}
      {currentView === 'progress' && (
        <ProgressApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Integrations Module (health data connections) */}
      {currentView === 'integrations' && (
        <IntegrationsApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Fitness Module */}
      {currentView === 'fitness' && (
        <FitnessApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Local Store Finder Module */}
      {currentView === 'local-store-finder' && (
        <LocalStoreFinderApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onLogout={handleLogout}
        />
      )}

      {/* Pantry App */}
      {currentView === 'pantry' && (
        <PantryApp
          user={user}
          onBack={() => setCurrentView('switchboard')}
        />
      )}

      {/* Household Setup */}
      {currentView === 'household-setup' && (
        <HouseholdSetup
          user={user}
          onComplete={(household) => {
            // After household setup, redirect to intended destination or pantry
            const redirectTo = localStorage.getItem('redirect_after_household') || 'pantry';
            localStorage.removeItem('redirect_after_household');
            setCurrentView(redirectTo);
          }}
          onSkip={() => setCurrentView('switchboard')}
          onBack={() => setCurrentView('switchboard')}
        />
      )}

      {/* Admin Panel - User Management */}
      {currentView === 'admin-panel' && (
        <AdminSwitchboard
          user={user}
          onBack={() => setCurrentView('switchboard')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}

      {currentView === 'admin-users' && (
        <UsersAdmin
          user={user}
          onBack={() => setCurrentView('admin-panel')}
          onNavigate={(view) => setCurrentView(view)}
        />
      )}
      </div>
    </EngagementProvider>
  );
}

export default App;