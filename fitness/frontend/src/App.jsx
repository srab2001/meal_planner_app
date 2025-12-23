import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AICoach from './components/AICoach';
import Dashboard from './components/Dashboard';
import AdminQuestions from './components/AdminQuestions';
import { useAuth } from './hooks/useAuth';
import './App.css';

/**
 * Main Fitness App Component
 * Handles routing between different fitness screens
 */
function App() {
  const { user, token, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return <div className="app-loading">Loading fitness app...</div>;
  }

  if (!user || !token) {
    return (
      <div className="app-login-prompt">
        <h1>Fitness Module</h1>
        <p>Please log in to access the fitness app.</p>
        <p>Redirect to main app login...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="fitness-app">
        <header className="fitness-header">
          <h1>💪 Fitness Coach</h1>
          <nav className="fitness-nav">
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-btn ${activeTab === 'ai-coach' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-coach')}
            >
              🤖 AI Coach
            </button>
            {user?.role === 'admin' && (
              <button
                className={`nav-btn ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                ⚙️ Questions
              </button>
            )}
          </nav>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="fitness-main">
          <Routes>
            <Route path="/" element={
              activeTab === 'dashboard' ? <Dashboard user={user} token={token} /> :
              activeTab === 'ai-coach' ? <AICoach user={user} token={token} /> :
              activeTab === 'questions' && user?.role === 'admin' ? <AdminQuestions token={token} /> :
              <Navigate to="/" />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
