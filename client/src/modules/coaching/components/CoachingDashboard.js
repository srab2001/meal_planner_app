import React from 'react';
import './CoachingDashboard.css';

/**
 * CoachingDashboard - Main overview dashboard for coaching
 * 
 * Displays health score, quick actions, insights, and progress summaries
 */
export default function CoachingDashboard({
  user,
  healthScore,
  goals,
  habits,
  programs,
  mealPlanData,
  nutritionData,
  onNavigate
}) {
  // Get today's date formatted
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate habits completed today
  const habitsCompletedToday = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;

  // Calculate active goals
  const activeGoals = goals.filter(g => g.status === 'active').length;

  // Calculate enrolled programs
  const enrolledPrograms = programs.filter(p => p.enrolled).length;

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--score-excellent, #22c55e)';
    if (score >= 60) return 'var(--score-good, #f59e0b)';
    if (score >= 40) return 'var(--score-fair, #f97316)';
    return 'var(--score-needs-work, #ef4444)';
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  // Generate daily insight
  const getDailyInsight = () => {
    const insights = [
      {
        title: "Great Progress!",
        message: "You've been consistent with your meal planning this week. Keep it up!",
        type: "positive"
      },
      {
        title: "Hydration Reminder",
        message: "Remember to drink water throughout the day. Aim for 8 glasses!",
        type: "tip"
      },
      {
        title: "Meal Prep Sunday",
        message: "Planning your meals on Sunday can save time and reduce stress all week.",
        type: "tip"
      },
      {
        title: "Celebrate Small Wins",
        message: "Every healthy choice you make is a step toward your goals!",
        type: "motivation"
      }
    ];
    
    // Return a semi-random insight based on day of week
    const dayIndex = new Date().getDay();
    return insights[dayIndex % insights.length];
  };

  const dailyInsight = getDailyInsight();

  return (
    <div className="coaching-dashboard">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</h2>
          <p className="date">{today}</p>
        </div>
      </section>

      {/* Health Score Card */}
      <section className="health-score-section">
        <div className="health-score-card">
          <div className="score-header">
            <h3>Your Health Score</h3>
            <span className="trend-badge" title={`Trending ${healthScore?.trend || 'stable'}`}>
              {getTrendIcon(healthScore?.trend)}
            </span>
          </div>
          
          <div className="score-display">
            <div 
              className="score-ring"
              style={{ 
                '--score-color': getScoreColor(healthScore?.overall || 0),
                '--score-percent': `${healthScore?.overall || 0}%`
              }}
            >
              <div className="score-inner">
                <span className="score-value">{healthScore?.overall || 0}</span>
                <span className="score-label">/ 100</span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          {healthScore?.breakdown && (
            <div className="score-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-label">Nutrition</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill" 
                    style={{ 
                      width: `${healthScore.breakdown.nutrition}%`,
                      backgroundColor: 'var(--asr-orange-500)'
                    }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.nutrition}%</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Consistency</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill" 
                    style={{ 
                      width: `${healthScore.breakdown.consistency}%`,
                      backgroundColor: 'var(--asr-purple-500)'
                    }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.consistency}%</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Habits</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill" 
                    style={{ 
                      width: `${healthScore.breakdown.habits}%`,
                      backgroundColor: '#22c55e'
                    }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.habits}%</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-label">Goals</span>
                <div className="breakdown-bar">
                  <div 
                    className="breakdown-fill" 
                    style={{ 
                      width: `${healthScore.breakdown.goals}%`,
                      backgroundColor: 'var(--asr-red-500)'
                    }}
                  />
                </div>
                <span className="breakdown-value">{healthScore.breakdown.goals}%</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="quick-stats">
        <div className="stat-card" onClick={() => onNavigate('habits')}>
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{habitsCompletedToday}/{totalHabits}</span>
            <span className="stat-label">Habits Today</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('goals')}>
          <span className="stat-icon">🎯</span>
          <div className="stat-content">
            <span className="stat-value">{activeGoals}</span>
            <span className="stat-label">Active Goals</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('programs')}>
          <span className="stat-icon">📚</span>
          <div className="stat-content">
            <span className="stat-value">{enrolledPrograms}</span>
            <span className="stat-label">Programs</span>
          </div>
        </div>
      </section>

      {/* Daily Insight */}
      <section className="daily-insight">
        <div className={`insight-card ${dailyInsight.type}`}>
          <div className="insight-icon">
            {dailyInsight.type === 'positive' && '🌟'}
            {dailyInsight.type === 'tip' && '💡'}
            {dailyInsight.type === 'motivation' && '💪'}
          </div>
          <div className="insight-content">
            <h4>{dailyInsight.title}</h4>
            <p>{dailyInsight.message}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn chat" onClick={() => onNavigate('chat')}>
            <span className="action-icon">💬</span>
            <span className="action-text">Chat with AI Coach</span>
          </button>
          <button className="action-btn habits" onClick={() => onNavigate('habits')}>
            <span className="action-icon">✅</span>
            <span className="action-text">Log Habits</span>
          </button>
          <button className="action-btn goals" onClick={() => onNavigate('goals')}>
            <span className="action-icon">➕</span>
            <span className="action-text">Add Goal</span>
          </button>
          <button className="action-btn programs" onClick={() => onNavigate('programs')}>
            <span className="action-icon">📖</span>
            <span className="action-text">Browse Programs</span>
          </button>
        </div>
      </section>

      {/* Active Programs Preview */}
      {enrolledPrograms > 0 && (
        <section className="programs-preview">
          <div className="section-header">
            <h3>Your Programs</h3>
            <button className="see-all" onClick={() => onNavigate('programs')}>
              See All →
            </button>
          </div>
          <div className="programs-list">
            {programs.filter(p => p.enrolled).slice(0, 2).map(program => (
              <div key={program.id} className="program-card-mini" style={{ '--program-color': program.color }}>
                <span className="program-icon">{program.icon}</span>
                <div className="program-info">
                  <h4>{program.name}</h4>
                  <div className="program-progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${program.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{program.progress}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data Integration Status */}
      <section className="data-status">
        <h3>Connected Data</h3>
        <div className="status-grid">
          <div className={`status-item ${mealPlanData ? 'connected' : 'disconnected'}`}>
            <span className="status-icon">🍽️</span>
            <span className="status-text">Meal Plan</span>
            <span className="status-badge">{mealPlanData ? '✓' : '—'}</span>
          </div>
          <div className={`status-item ${nutritionData ? 'connected' : 'disconnected'}`}>
            <span className="status-icon">🥗</span>
            <span className="status-text">Nutrition</span>
            <span className="status-badge">{nutritionData ? '✓' : '—'}</span>
          </div>
        </div>
        {!mealPlanData && !nutritionData && (
          <p className="status-hint">
            💡 Connect your Meal Plan or Nutrition data for personalized coaching!
          </p>
        )}
      </section>
    </div>
  );
}
