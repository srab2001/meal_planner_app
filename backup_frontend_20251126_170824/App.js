import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import Questionnaire from './components/Questionnaire';
import MealPlanView from './components/MealPlanView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('login');
  const [preferences, setPreferences] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:5000/auth/user', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setCurrentView('questionnaire');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setCurrentView('login');
      setPreferences(null);
      setMealPlan(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleQuestionnaireComplete = (prefs) => {
    setPreferences(prefs);
    setCurrentView('mealplan');
  };

  const handleBackToQuestionnaire = () => {
    setCurrentView('questionnaire');
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
      {currentView === 'login' && <LoginPage />}
      
      {currentView === 'questionnaire' && (
        <Questionnaire
          user={user}
          onComplete={handleQuestionnaireComplete}
          onLogout={handleLogout}
        />
      )}
      
      {currentView === 'mealplan' && (
        <MealPlanView
          user={user}
          preferences={preferences}
          mealPlan={mealPlan}
          setMealPlan={setMealPlan}
          onBack={handleBackToQuestionnaire}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
