import React, { useState } from 'react';
import './Dashboard.css';
import MealPlanView from './MealPlanView';
import FitnessTracker from './FitnessTracker';
import CombinedInsights from './CombinedInsights';

function Dashboard({
  user,
  mealPlan,
  preferences,
  selectedStore,
  onStartOver,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('meals');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'meals':
        return (
          <MealPlanView
            mealPlan={mealPlan}
            preferences={preferences}
            user={user}
            selectedStore={selectedStore}
            onStartOver={onStartOver}
            onLogout={onLogout}
          />
        );
      case 'fitness':
        return <FitnessTracker user={user} />;
      case 'insights':
        return <CombinedInsights user={user} mealPlan={mealPlan} />;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Tab Navigation */}
      <nav className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('meals')}
        >
          <span className="tab-icon">🍽️</span>
          <span className="tab-label">Meals</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'fitness' ? 'active' : ''}`}
          onClick={() => setActiveTab('fitness')}
        >
          <span className="tab-icon">💪</span>
          <span className="tab-label">Fitness</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Insights</span>
        </button>
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default Dashboard;
