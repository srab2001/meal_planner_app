import React, { useState } from 'react';
import auditLogger from '../../../shared/services/AuditLogger';
import './HabitTracker.css';

/**
 * HabitTracker - Daily habit tracking with streaks
 * 
 * Features:
 * - Create custom habits
 * - Daily check-off
 * - Streak tracking
 * - Calendar view
 */
export default function HabitTracker({ habits, onUpdateHabits }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);

  // Habit icons
  const habitIcons = ['💧', '🏃', '📚', '🧘', '💪', '🥗', '😴', '🎯', '✍️', '🌱', '❤️', '🧠'];

  // Habit colors
  const habitColors = [
    'var(--asr-purple-500)',
    'var(--asr-orange-500)',
    'var(--asr-red-500)',
    '#22c55e',
    '#06b6d4',
    '#8b5cf6',
    '#f59e0b',
    '#ec4899'
  ];

  // New habit template
  const newHabitTemplate = {
    id: null,
    name: '',
    icon: '🎯',
    color: 'var(--asr-purple-500)',
    frequency: 'daily',
    reminderTime: '',
    completedToday: false,
    streak: 0,
    bestStreak: 0,
    history: [], // Array of dates when completed
    createdAt: null
  };

  const [formData, setFormData] = useState(newHabitTemplate);

  // Get today's date string
  const getTodayString = () => new Date().toISOString().split('T')[0];

  // Check if habit was completed on a specific date
  const isCompletedOn = (habit, dateString) => {
    return habit.history && habit.history.includes(dateString);
  };

  // Calculate current streak
  const calculateStreak = (history) => {
    if (!history || history.length === 0) return 0;
    
    const sortedDates = [...history].sort().reverse();
    const today = getTodayString();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If not completed today or yesterday, streak is 0
    if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
      return 0;
    }
    
    let streak = 0;
    let checkDate = sortedDates.includes(today) ? new Date() : new Date(Date.now() - 86400000);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(dateStr)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Toggle habit completion for today
  const handleToggleToday = (habitId) => {
    const today = getTodayString();
    const habit = habits.find(h => h.id === habitId);
    
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        let newHistory = [...(h.history || [])];
        let completedToday = h.completedToday;
        
        if (completedToday) {
          // Remove today from history
          newHistory = newHistory.filter(d => d !== today);
          completedToday = false;
        } else {
          // Add today to history
          if (!newHistory.includes(today)) {
            newHistory.push(today);
          }
          completedToday = true;
        }
        
        const streak = calculateStreak(newHistory);
        const bestStreak = Math.max(h.bestStreak || 0, streak);
        
        return {
          ...h,
          history: newHistory,
          completedToday,
          streak,
          bestStreak
        };
      }
      return h;
    });
    
    // Log habit toggle
    auditLogger.log({
      category: auditLogger.CATEGORIES.HABIT,
      action: habit?.completedToday ? 'habit_uncompleted' : 'habit_completed',
      level: auditLogger.LEVELS.INFO,
      details: { 
        habitId, 
        name: habit?.name,
        streak: updatedHabits.find(h => h.id === habitId)?.streak
      }
    });
    
    onUpdateHabits(updatedHabits);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open add modal
  const handleAddHabit = () => {
    setFormData(newHabitTemplate);
    setEditingHabit(null);
    setShowAddModal(true);
  };

  // Open edit modal
  const handleEditHabit = (habit) => {
    setFormData(habit);
    setEditingHabit(habit);
    setShowAddModal(true);
  };

  // Save habit
  const handleSaveHabit = (e) => {
    e.preventDefault();
    
    const habitData = {
      ...formData,
      id: formData.id || Date.now(),
      completedToday: isCompletedOn(formData, getTodayString()),
      streak: calculateStreak(formData.history || []),
      createdAt: formData.createdAt || new Date().toISOString()
    };

    let updatedHabits;
    if (editingHabit) {
      updatedHabits = habits.map(h => h.id === habitData.id ? habitData : h);
      // Log habit update
      auditLogger.log({
        category: auditLogger.CATEGORIES.HABIT,
        action: 'habit_updated',
        level: auditLogger.LEVELS.INFO,
        details: { habitId: habitData.id, name: habitData.name }
      });
    } else {
      updatedHabits = [...habits, habitData];
      // Log habit creation
      auditLogger.log({
        category: auditLogger.CATEGORIES.HABIT,
        action: 'habit_created',
        level: auditLogger.LEVELS.INFO,
        details: { habitId: habitData.id, name: habitData.name, frequency: habitData.frequency }
      });
    }

    onUpdateHabits(updatedHabits);
    setShowAddModal(false);
    setFormData(newHabitTemplate);
  };

  // Delete habit
  const handleDeleteHabit = (habitId) => {
    const habit = habits.find(h => h.id === habitId);
    if (window.confirm('Are you sure you want to delete this habit? Your streak will be lost.')) {
      const updatedHabits = habits.filter(h => h.id !== habitId);
      
      // Log habit deletion
      auditLogger.log({
        category: auditLogger.CATEGORIES.HABIT,
        action: 'habit_deleted',
        level: auditLogger.LEVELS.WARN,
        details: { habitId, name: habit?.name, bestStreak: habit?.bestStreak }
      });
      
      onUpdateHabits(updatedHabits);
    }
  };

  // View habit calendar
  const handleViewCalendar = (habit) => {
    setSelectedHabit(habit);
  };

  // Get last 30 days for calendar
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  // Calculate completion rate
  const getCompletionRate = (habit) => {
    if (!habit.history || habit.history.length === 0) return 0;
    const last30Days = getLast30Days();
    const completedInLast30 = last30Days.filter(d => habit.history.includes(d)).length;
    return Math.round((completedInLast30 / 30) * 100);
  };

  return (
    <div className="habit-tracker">
      <div className="habits-header">
        <div className="header-content">
          <h2>Daily Habits</h2>
          <p>Build consistency with daily habits</p>
        </div>
        <button className="add-habit-btn" onClick={handleAddHabit}>
          + New Habit
        </button>
      </div>

      {/* Today's Summary */}
      <div className="today-summary">
        <div className="summary-stat">
          <span className="stat-value">
            {habits.filter(h => h.completedToday).length}/{habits.length}
          </span>
          <span className="stat-label">Completed Today</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value">
            {habits.reduce((max, h) => Math.max(max, h.streak || 0), 0)}
          </span>
          <span className="stat-label">Best Streak</span>
        </div>
      </div>

      {/* Habits List */}
      <div className="habits-list">
        {habits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <h3>No habits yet</h3>
            <p>Create your first habit to start building consistency.</p>
            <button onClick={handleAddHabit}>Create Your First Habit</button>
          </div>
        ) : (
          habits.map(habit => (
            <div 
              key={habit.id} 
              className={`habit-card ${habit.completedToday ? 'completed' : ''}`}
              style={{ '--habit-color': habit.color }}
            >
              <button 
                className="habit-checkbox"
                onClick={() => handleToggleToday(habit.id)}
              >
                {habit.completedToday ? '✓' : ''}
              </button>

              <div className="habit-icon">{habit.icon}</div>

              <div className="habit-info">
                <h3>{habit.name}</h3>
                <div className="habit-stats">
                  <span className="streak">
                    🔥 {habit.streak || 0} day streak
                  </span>
                  <span className="separator">•</span>
                  <span className="best">
                    Best: {habit.bestStreak || 0}
                  </span>
                </div>
              </div>

              <div className="habit-actions">
                <button 
                  className="calendar-btn"
                  onClick={() => handleViewCalendar(habit)}
                  title="View calendar"
                >
                  📅
                </button>
                <button 
                  className="edit-btn"
                  onClick={() => handleEditHabit(habit)}
                  title="Edit habit"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteHabit(habit.id)}
                  title="Delete habit"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Calendar Modal */}
      {selectedHabit && (
        <div className="modal-overlay" onClick={() => setSelectedHabit(null)}>
          <div className="modal-content calendar-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="habit-modal-title">
                <span className="habit-icon">{selectedHabit.icon}</span>
                <h3>{selectedHabit.name}</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedHabit(null)}>×</button>
            </div>

            <div className="calendar-stats">
              <div className="calendar-stat">
                <span className="value">{selectedHabit.streak || 0}</span>
                <span className="label">Current Streak</span>
              </div>
              <div className="calendar-stat">
                <span className="value">{selectedHabit.bestStreak || 0}</span>
                <span className="label">Best Streak</span>
              </div>
              <div className="calendar-stat">
                <span className="value">{getCompletionRate(selectedHabit)}%</span>
                <span className="label">30-Day Rate</span>
              </div>
            </div>

            <div className="calendar-grid">
              <div className="calendar-header">
                <span>Last 30 Days</span>
              </div>
              <div className="calendar-days">
                {getLast30Days().map(date => (
                  <div 
                    key={date}
                    className={`calendar-day ${isCompletedOn(selectedHabit, date) ? 'completed' : ''}`}
                    title={new Date(date).toLocaleDateString()}
                    style={{ 
                      backgroundColor: isCompletedOn(selectedHabit, date) 
                        ? selectedHabit.color 
                        : 'var(--asr-gray-200)'
                    }}
                  />
                ))}
              </div>
              <div className="calendar-legend">
                <span>← Older</span>
                <span>Today →</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingHabit ? 'Edit Habit' : 'New Habit'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveHabit}>
              <div className="form-group">
                <label>Habit Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Drink 8 glasses of water"
                  required
                />
              </div>

              <div className="form-group">
                <label>Icon</label>
                <div className="icon-selector">
                  {habitIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-selector">
                  {habitColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${formData.color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Reminder Time (optional)</label>
                <input
                  type="time"
                  name="reminderTime"
                  value={formData.reminderTime}
                  onChange={handleInputChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingHabit ? 'Update Habit' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
