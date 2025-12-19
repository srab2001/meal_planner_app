import React, { useState } from 'react';
import auditLogger from '../../../shared/services/AuditLogger';
import './GoalManager.css';

/**
 * GoalManager - Create and track health goals
 * 
 * Features:
 * - Create SMART goals
 * - Track progress
 * - Visual progress indicators
 * - Goal categories
 */
export default function GoalManager({ goals, onUpdateGoals }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active'); // 'all', 'active', 'completed'

  // Goal categories
  const categories = [
    { id: 'weight', name: 'Weight', icon: '⚖️', color: 'var(--asr-purple-500)' },
    { id: 'nutrition', name: 'Nutrition', icon: '🥗', color: 'var(--asr-orange-500)' },
    { id: 'fitness', name: 'Fitness', icon: '💪', color: '#22c55e' },
    { id: 'habit', name: 'Habit', icon: '✅', color: 'var(--asr-red-500)' },
    { id: 'wellness', name: 'Wellness', icon: '🧘', color: '#06b6d4' },
    { id: 'custom', name: 'Custom', icon: '🎯', color: 'var(--asr-gray-500)' }
  ];

  // New goal template
  const newGoalTemplate = {
    id: null,
    title: '',
    description: '',
    category: 'custom',
    targetValue: 100,
    currentValue: 0,
    unit: '%',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    status: 'active',
    progress: 0
  };

  const [formData, setFormData] = useState(newGoalTemplate);

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    if (activeFilter === 'active') return goal.status === 'active';
    if (activeFilter === 'completed') return goal.status === 'completed';
    return true;
  });

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate progress percentage
  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  // Open add modal
  const handleAddGoal = () => {
    setFormData(newGoalTemplate);
    setEditingGoal(null);
    setShowAddModal(true);
  };

  // Open edit modal
  const handleEditGoal = (goal) => {
    setFormData(goal);
    setEditingGoal(goal);
    setShowAddModal(true);
  };

  // Save goal
  const handleSaveGoal = (e) => {
    e.preventDefault();
    
    const progress = calculateProgress(formData.currentValue, formData.targetValue);
    const status = progress >= 100 ? 'completed' : 'active';
    
    const goalData = {
      ...formData,
      id: formData.id || Date.now(),
      progress,
      status,
      updatedAt: new Date().toISOString()
    };

    let updatedGoals;
    if (editingGoal) {
      updatedGoals = goals.map(g => g.id === goalData.id ? goalData : g);
      // Log goal update
      auditLogger.log({
        category: auditLogger.CATEGORIES.GOAL,
        action: 'goal_updated',
        level: auditLogger.LEVELS.INFO,
        details: { goalId: goalData.id, title: goalData.title, category: goalData.category, progress }
      });
    } else {
      updatedGoals = [...goals, { ...goalData, createdAt: new Date().toISOString() }];
      // Log goal creation
      auditLogger.log({
        category: auditLogger.CATEGORIES.GOAL,
        action: 'goal_created',
        level: auditLogger.LEVELS.INFO,
        details: { goalId: goalData.id, title: goalData.title, category: goalData.category }
      });
    }

    onUpdateGoals(updatedGoals);
    setShowAddModal(false);
    setFormData(newGoalTemplate);
  };

  // Update goal progress
  const handleUpdateProgress = (goalId, newValue) => {
    const goal = goals.find(g => g.id === goalId);
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        const progress = calculateProgress(newValue, g.targetValue);
        const wasCompleted = g.status === 'completed';
        const isNowCompleted = progress >= 100;
        
        // Log goal completion if just completed
        if (!wasCompleted && isNowCompleted) {
          auditLogger.log({
            category: auditLogger.CATEGORIES.GOAL,
            action: 'goal_completed',
            level: auditLogger.LEVELS.INFO,
            details: { goalId, title: g.title, category: g.category }
          });
        }
        
        return {
          ...g,
          currentValue: newValue,
          progress,
          status: isNowCompleted ? 'completed' : 'active',
          updatedAt: new Date().toISOString()
        };
      }
      return g;
    });
    
    // Log progress update
    auditLogger.log({
      category: auditLogger.CATEGORIES.GOAL,
      action: 'goal_progress_updated',
      level: auditLogger.LEVELS.DEBUG,
      details: { goalId, newValue, title: goal?.title }
    });
    
    onUpdateGoals(updatedGoals);
  };

  // Delete goal
  const handleDeleteGoal = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    if (window.confirm('Are you sure you want to delete this goal?')) {
      const updatedGoals = goals.filter(g => g.id !== goalId);
      
      // Log goal deletion
      auditLogger.log({
        category: auditLogger.CATEGORIES.GOAL,
        action: 'goal_deleted',
        level: auditLogger.LEVELS.WARN,
        details: { goalId, title: goal?.title, category: goal?.category }
      });
      
      onUpdateGoals(updatedGoals);
    }
  };

  // Get category info
  const getCategory = (categoryId) => {
    return categories.find(c => c.id === categoryId) || categories[5];
  };

  // Get days remaining
  const getDaysRemaining = (targetDate) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="goal-manager">
      <div className="goals-header">
        <div className="header-content">
          <h2>Goals</h2>
          <p>Set and track your health goals</p>
        </div>
        <button className="add-goal-btn" onClick={handleAddGoal}>
          + New Goal
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="goals-tabs">
        <button 
          className={`tab ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          Active ({goals.filter(g => g.status === 'active').length})
        </button>
        <button 
          className={`tab ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveFilter('completed')}
        >
          Completed ({goals.filter(g => g.status === 'completed').length})
        </button>
        <button 
          className={`tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({goals.length})
        </button>
      </div>

      {/* Goals List */}
      <div className="goals-list">
        {filteredGoals.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🎯</span>
            <h3>No goals yet</h3>
            <p>
              {activeFilter === 'completed' 
                ? "You haven't completed any goals yet. Keep going!" 
                : "Set your first goal to start tracking your progress."}
            </p>
            {activeFilter !== 'active' && (
              <button onClick={() => setActiveFilter('active')}>View Active Goals</button>
            )}
            {activeFilter === 'active' && (
              <button onClick={handleAddGoal}>Create Your First Goal</button>
            )}
          </div>
        ) : (
          filteredGoals.map(goal => {
            const category = getCategory(goal.category);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            
            return (
              <div 
                key={goal.id} 
                className={`goal-card ${goal.status}`}
                style={{ '--goal-color': category.color }}
              >
                <div className="goal-header">
                  <div className="goal-category">
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-name">{category.name}</span>
                  </div>
                  <div className="goal-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditGoal(goal)}
                      title="Edit goal"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Delete goal"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3>{goal.title}</h3>
                {goal.description && <p className="goal-description">{goal.description}</p>}

                <div className="goal-progress">
                  <div className="progress-info">
                    <span className="current-value">
                      {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </span>
                    <span className="progress-percent">{goal.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {goal.status === 'active' && (
                  <div className="quick-update">
                    <input
                      type="number"
                      value={goal.currentValue}
                      onChange={(e) => handleUpdateProgress(goal.id, parseFloat(e.target.value) || 0)}
                      min="0"
                      max={goal.targetValue * 2}
                    />
                    <span className="unit">{goal.unit}</span>
                  </div>
                )}

                {goal.status === 'completed' && (
                  <div className="completed-badge">
                    🎉 Completed!
                  </div>
                )}

                {daysRemaining !== null && goal.status === 'active' && (
                  <div className={`days-remaining ${daysRemaining < 0 ? 'overdue' : daysRemaining <= 7 ? 'urgent' : ''}`}>
                    {daysRemaining < 0 
                      ? `${Math.abs(daysRemaining)} days overdue`
                      : daysRemaining === 0 
                      ? 'Due today!'
                      : `${daysRemaining} days left`
                    }
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveGoal}>
              <div className="form-group">
                <label>Goal Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Lose 10 pounds"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <div className="category-selector">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-option ${formData.category === cat.id ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      style={{ '--cat-color': cat.color }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Why is this goal important to you?"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Value *</label>
                  <input
                    type="number"
                    name="targetValue"
                    value={formData.targetValue}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Current Value</label>
                  <input
                    type="number"
                    name="currentValue"
                    value={formData.currentValue}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                  >
                    <option value="%">%</option>
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                    <option value="days">days</option>
                    <option value="times">times</option>
                    <option value="glasses">glasses</option>
                    <option value="steps">steps</option>
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    name="targetDate"
                    value={formData.targetDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
