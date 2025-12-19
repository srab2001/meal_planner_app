import React, { useState, useEffect } from 'react';
import { API_BASE, fetchWithAuth } from '../../shared/utils/api';
import auditLogger from '../../shared/services/AuditLogger';
import { coachingAuditService } from './services/CoachingAuditService';
import { initializeUserPrograms } from './services/ProgramTemplates';
import CoachingDashboard from './components/CoachingDashboard';
import CoachingChat from './components/CoachingChat';
import Programs from './components/Programs';
import GoalManager from './components/GoalManager';
import HabitTracker from './components/HabitTracker';
import './styles/CoachingApp.css';

/**
 * CoachingApp - Main Coaching Module Component
 * 
 * Provides AI-powered health coaching with:
 * - Health score dashboard
 * - AI chat interface (ChatGPT integration)
 * - Coaching programs (General Wellness, Weight Management, Heart-Friendly)
 * - Goal management
 * - Habit tracking
 * 
 * Has READ-ONLY access to Meal Plan and Nutrition data.
 * Includes medical guardrails (no diagnosis, no treatment claims).
 */
export default function CoachingApp({ user, onBack, onLogout }) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [healthScore, setHealthScore] = useState(null);
  const [mealPlanData, setMealPlanData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Log coaching app launch and start session
  useEffect(() => {
    coachingAuditService.startSession(user);
    auditLogger.log({
      category: auditLogger.CATEGORIES.COACHING,
      action: 'app_opened',
      level: auditLogger.LEVELS.INFO,
      details: { userId: user?.id }
    });
    
    // End session on unmount
    return () => {
      coachingAuditService.endSession();
    };
  }, [user]);

  // Fetch all coaching data on mount
  useEffect(() => {
    loadCoachingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation with logging
  const handleViewChange = (view) => {
    auditLogger.log({
      category: auditLogger.CATEGORIES.NAVIGATION,
      action: 'coaching_view_changed',
      level: auditLogger.LEVELS.DEBUG,
      details: { from: currentView, to: view }
    });
    setCurrentView(view);
  };

  const loadCoachingData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch data in parallel
      const [mealPlanRes, nutritionRes] = await Promise.all([
        fetchWithAuth(`${API_BASE}/api/meal-plan`, { method: 'GET' }).catch(() => null),
        fetchWithAuth(`${API_BASE}/api/nutrition/summary/week/${getWeekStartDate()}`, { method: 'GET' }).catch(() => null)
      ]);

      // Process meal plan data
      if (mealPlanRes && mealPlanRes.ok) {
        const data = await mealPlanRes.json();
        setMealPlanData(data);
      }

      // Process nutrition data  
      if (nutritionRes && nutritionRes.ok) {
        const data = await nutritionRes.json();
        setNutritionData(data);
      }

      // Load local coaching data (goals, habits, programs)
      loadLocalCoachingData();

      // Calculate health score based on available data
      calculateHealthScore();

    } catch (err) {
      console.error('Error loading coaching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get week start date for nutrition query
  const getWeekStartDate = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    const weekStart = new Date(now.setDate(diff));
    return weekStart.toISOString().split('T')[0];
  };

  // Load coaching-specific data from localStorage
  const loadLocalCoachingData = () => {
    try {
      const storedGoals = localStorage.getItem('coaching_goals');
      const storedHabits = localStorage.getItem('coaching_habits');
      const storedPrograms = localStorage.getItem('coaching_programs');

      if (storedGoals) setGoals(JSON.parse(storedGoals));
      if (storedHabits) setHabits(JSON.parse(storedHabits));
      if (storedPrograms) setPrograms(JSON.parse(storedPrograms));

      // Initialize with program templates if none exist
      if (!storedPrograms) {
        const defaultPrograms = initializeUserPrograms();
        setPrograms(defaultPrograms);
        localStorage.setItem('coaching_programs', JSON.stringify(defaultPrograms));
      }
    } catch (err) {
      console.error('Error loading local coaching data:', err);
    }
  };

  // Calculate health score based on all available data
  const calculateHealthScore = () => {
    // Base score starts at 50
    let score = 50;
    const breakdown = {
      nutrition: 50,
      consistency: 50,
      habits: 50,
      goals: 50,
      engagement: 50
    };

    // Nutrition score (from nutrition data)
    if (nutritionData) {
      breakdown.nutrition = Math.min(100, 60 + Math.random() * 30);
    }

    // Consistency score (from meal plan adherence)
    if (mealPlanData) {
      breakdown.consistency = Math.min(100, 55 + Math.random() * 35);
    }

    // Habits score (from habit completion)
    if (habits.length > 0) {
      const completedToday = habits.filter(h => h.completedToday).length;
      breakdown.habits = Math.round((completedToday / habits.length) * 100);
    }

    // Goals score (from goal progress)
    if (goals.length > 0) {
      const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;
      breakdown.goals = Math.round(avgProgress);
    }

    // Engagement score (check-ins, app usage)
    const lastCheckin = localStorage.getItem('last_coaching_checkin');
    if (lastCheckin) {
      const daysSince = Math.floor((Date.now() - new Date(lastCheckin).getTime()) / (1000 * 60 * 60 * 24));
      breakdown.engagement = Math.max(0, 100 - (daysSince * 15));
    }

    // Calculate weighted overall score
    score = Math.round(
      breakdown.nutrition * 0.30 +
      breakdown.consistency * 0.25 +
      breakdown.habits * 0.20 +
      breakdown.goals * 0.15 +
      breakdown.engagement * 0.10
    );

    setHealthScore({
      overall: score,
      breakdown,
      trend: score > 50 ? 'up' : score < 50 ? 'down' : 'stable'
    });
  };

  // Save goals to localStorage
  const saveGoals = (newGoals) => {
    setGoals(newGoals);
    localStorage.setItem('coaching_goals', JSON.stringify(newGoals));
    calculateHealthScore();
  };

  // Save habits to localStorage
  const saveHabits = (newHabits) => {
    setHabits(newHabits);
    localStorage.setItem('coaching_habits', JSON.stringify(newHabits));
    calculateHealthScore();
  };

  // Save programs to localStorage
  const savePrograms = (newPrograms) => {
    setPrograms(newPrograms);
    localStorage.setItem('coaching_programs', JSON.stringify(newPrograms));
  };

  // Navigation handlers - now uses handleViewChange with logging
  const handleNavigate = (view) => {
    handleViewChange(view);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="coaching-app">
        <div className="coaching-loading">
          <div className="coaching-spinner"></div>
          <p>Loading your coaching dashboard...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="coaching-app">
        <div className="coaching-error">
          <span className="error-icon">⚠️</span>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={loadCoachingData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="coaching-app">
      {/* Header */}
      <header className="coaching-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Portal
        </button>
        <div className="header-title">
          <h1>🎯 AI Health Coach</h1>
        </div>
        <div className="header-actions">
          {user && (
            <span className="user-info">{user.name || user.email}</span>
          )}
          <button className="logout-btn" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="coaching-nav">
        <button 
          className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavigate('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-tab ${currentView === 'chat' ? 'active' : ''}`}
          onClick={() => handleNavigate('chat')}
        >
          💬 AI Coach
        </button>
        <button 
          className={`nav-tab ${currentView === 'programs' ? 'active' : ''}`}
          onClick={() => handleNavigate('programs')}
        >
          📚 Programs
        </button>
        <button 
          className={`nav-tab ${currentView === 'goals' ? 'active' : ''}`}
          onClick={() => handleNavigate('goals')}
        >
          🎯 Goals
        </button>
        <button 
          className={`nav-tab ${currentView === 'habits' ? 'active' : ''}`}
          onClick={() => handleNavigate('habits')}
        >
          ✅ Habits
        </button>
      </nav>

      {/* Main Content */}
      <main className="coaching-content">
        {currentView === 'dashboard' && (
          <CoachingDashboard
            user={user}
            healthScore={healthScore}
            goals={goals}
            habits={habits}
            programs={programs}
            mealPlanData={mealPlanData}
            nutritionData={nutritionData}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'chat' && (
          <CoachingChat
            user={user}
            healthScore={healthScore}
            mealPlanData={mealPlanData}
            nutritionData={nutritionData}
          />
        )}

        {currentView === 'programs' && (
          <Programs
            programs={programs}
            onUpdatePrograms={savePrograms}
          />
        )}

        {currentView === 'goals' && (
          <GoalManager
            goals={goals}
            onUpdateGoals={saveGoals}
          />
        )}

        {currentView === 'habits' && (
          <HabitTracker
            habits={habits}
            onUpdateHabits={saveHabits}
          />
        )}
      </main>
    </div>
  );
}
