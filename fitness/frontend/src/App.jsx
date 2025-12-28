import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useParams } from 'react-router-dom';

import CreateGoal from './components/CreateGoal';
import AICoachQuestionnaire from './components/AICoachQuestionnaire';
import WorkoutPlanResult from './components/WorkoutPlanResult';
import GoalsTracker from './components/GoalsTracker';
import Login from './components/Login';
import WorkoutCheckOff from './components/WorkoutCheckOff';
import { useAuth } from './hooks/useAuth';
import './styles/asr-theme.css';
import './App.css';

/**
 * ASR Fitness Platform - Main App Component
 *
 * Simplified 3-Screen Flow:
 * 1. Create Fitness Goal (Screen A)
 * 2. AI Coach Questionnaire (Screen B) - 7 questions
 * 3. Workout Plan Result (Screen C) - Table format
 *
 * Additional Routes:
 * - /workout/check-off/:token - Public workout check-off (no auth)
 */

/**
 * Wrapper for authenticated routes
 */
function AuthenticatedApp({ user, token, logout, setUser, setToken }) {
  if (!user || !token) {
    return <Login onLoginSuccess={(newUser, newToken) => {
      setUser(newUser);
      setToken(newToken);
    }} />;
  }

  return (
    <div className="asr-app">
        {/* ASR Header */}
        <header className="asr-header">
          <div className="asr-header__logo">
            <div className="asr-header__logo-img">ASR</div>
            <h1 className="asr-header__title">Fitness Coach</h1>
          </div>

          <nav className="asr-header__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              Create Goal
            </NavLink>
            <NavLink
              to="/goals"
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              My Goals
            </NavLink>
          </nav>

          <div className="asr-header__user">
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              {user.email}
            </span>
            <button className="asr-btn asr-btn--red asr-btn--sm" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="asr-main">
          <Routes>
            {/* Screen A - Create Fitness Goal */}
            <Route path="/" element={<CreateGoal user={user} token={token} />} />
            <Route path="/create-goal" element={<CreateGoal user={user} token={token} />} />

            {/* Screen B - AI Coach Questionnaire (7 Questions) */}
            <Route path="/ai-coach" element={<AICoachQuestionnaire user={user} token={token} />} />

            {/* Screen C - Workout Plan Result (Table) */}
            <Route path="/workout-plan" element={<WorkoutPlanResult user={user} token={token} />} />

            {/* Goals List */}
            <Route path="/goals" element={<GoalsTracker user={user} token={token} />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
  );
}

/**
 * Main App with routing
 */
function App() {
  const { user, token, loading, logout, setUser, setToken } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading ASR Fitness Platform...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public route - Workout Check-off (no auth required) */}
        <Route path="/workout/check-off/:token" element={<WorkoutCheckOff />} />

        {/* All other routes require authentication */}
        <Route path="/*" element={
          <AuthenticatedApp
            user={user}
            token={token}
            logout={logout}
            setUser={setUser}
            setToken={setToken}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;
