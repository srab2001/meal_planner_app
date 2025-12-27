import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';

import GoalBuilder from './components/GoalBuilder';
import FitnessDashboard from './components/FitnessDashboard';
import WorkoutLogPage from './components/WorkoutLogPage';
import WorkoutDetail from './components/WorkoutDetail';
import GoalsTracker from './components/GoalsTracker';
import ProgressSummary from './components/ProgressSummary';
import AdminLayout from './components/AdminLayout';
import AdminQuestionBank from './components/AdminQuestionBank';
import AdminQuestionDetail from './components/AdminQuestionDetail';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import './styles/asr-theme.css';
import './App.css';

/**
 * ASR Fitness Platform - Main App Component
 * Modernized fitness app with admin control, AI-driven goals, and COMAR-aware saving
 */
function App() {
  const { user, token, loading, logout, setUser, setToken } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading ASR Fitness Platform...</div>;
  }

  if (!user || !token) {
    return <Login onLoginSuccess={(newUser, newToken) => {
      setUser(newUser);
      setToken(newToken);
    }} />;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <div className="asr-app">
        {/* ASR Header */}
        <header className="asr-header">
          <div className="asr-header__logo">
            <div className="asr-header__logo-img">ASR</div>
            <h1 className="asr-header__title">Goal Builder | Six Questions</h1>
          </div>

          <nav className="asr-header__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/goals/new"
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              Create Goal
            </NavLink>
            <NavLink
              to="/goals"
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              Goals
            </NavLink>
            <NavLink
              to="/workouts"
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              Workouts
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
            >
              Progress
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin/questions"
                className={({ isActive }) => `asr-btn ${isActive ? 'asr-btn--orange' : 'asr-btn--outline'}`}
              >
                Admin
              </NavLink>
            )}
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
            {/* Dashboard - Home */}
            <Route path="/" element={<FitnessDashboard user={user} token={token} />} />

            {/* Goal Builder - 6 Questions Form */}
            <Route path="/goals/new" element={<GoalBuilder user={user} token={token} />} />
            <Route path="/goals/:id/edit" element={<GoalBuilder user={user} token={token} />} />

            {/* Goals Tracker */}
            <Route path="/goals" element={<GoalsTracker user={user} token={token} />} />

            {/* Workout Management */}
            <Route path="/workouts" element={<WorkoutLogPage user={user} token={token} />} />
            <Route path="/workouts/new" element={<WorkoutLogPage user={user} token={token} mode="new" />} />
            <Route path="/workouts/:id" element={<WorkoutDetail user={user} token={token} />} />

            {/* Progress Summary */}
            <Route path="/progress" element={<ProgressSummary user={user} token={token} />} />

            {/* Admin Routes */}
            {isAdmin && (
              <>
                <Route path="/admin" element={<AdminLayout user={user} token={token} />}>
                  <Route index element={<Navigate to="/admin/questions" replace />} />
                  <Route path="questions" element={<AdminQuestionBank token={token} />} />
                  <Route path="questions/new" element={<AdminQuestionDetail token={token} />} />
                  <Route path="questions/:id" element={<AdminQuestionDetail token={token} />} />
                </Route>
              </>
            )}

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
