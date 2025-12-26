import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';

import AICoach from './components/AICoach';
import Dashboard from './components/Dashboard';
import AdminQuestions from './components/AdminQuestions';
import WorkoutLog from './components/WorkoutLog';
import WorkoutDetail from './components/WorkoutDetail';
import Login from './components/Login';
import { useAuth } from './hooks/useAuth';
import './App.css';

/**
 * Main Fitness App Component
 * Handles routing between different fitness screens with React Router
 */
function App() {
  const { user, token, loading, logout, setUser, setToken } = useAuth();

  if (loading) {
    return <div className="app-loading">Loading fitness app...</div>;
  }

  if (!user || !token) {
    return <Login onLoginSuccess={(newUser, newToken) => {
      setUser(newUser);
      setToken(newToken);
    }} />;
  }

  return (
    <Router>
      <div className="fitness-app">
        <header className="fitness-header">
          <h1>💪 Fitness Coach</h1>
          <nav className="fitness-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              📊 Dashboard
            </NavLink>
            <NavLink
              to="/workouts/new"
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              ➕ Log Workout
            </NavLink>
            <NavLink
              to="/ai-coach"
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
            >
              🤖 AI Coach
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink
                to="/admin/questions"
                className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
              >
                ⚙️ Questions
              </NavLink>
            )}
          </nav>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="fitness-main">
          <Routes>
            {/* Dashboard - Home */}
            <Route path="/" element={<Dashboard user={user} token={token} />} />

            {/* Workout Management */}
            <Route path="/workouts/new" element={<WorkoutLog user={user} token={token} />} />
            <Route path="/workouts/:id" element={<WorkoutDetail user={user} token={token} />} />
            <Route path="/workouts/:id/edit" element={<WorkoutLog user={user} token={token} />} />

            {/* AI Coach */}
            <Route path="/ai-coach" element={<AICoach user={user} token={token} />} />

            {/* Admin */}
            {user?.role === 'admin' && (
              <Route path="/admin/questions" element={<AdminQuestions token={token} />} />
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
