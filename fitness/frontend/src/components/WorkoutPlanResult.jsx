import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './WorkoutPlanResult.css';

/**
 * Screen C - Workout Plan Result (Enhanced)
 * Features:
 * - Display AI-generated workout plan in table format
 * - Inline editing of sets/reps/weights
 * - Save workout to history
 * - Export to PDF
 * - Regenerate with tweaks
 * - Text me my workout (SMS)
 */
function WorkoutPlanResult({ user, token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { workout, message, goalName, goalId, answers } = location.state || {};
  const printRef = useRef(null);

  // State for editable rows
  const [editableRows, setEditableRows] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showTweakModal, setShowTweakModal] = useState(false);
  const [tweakNotes, setTweakNotes] = useState('');

  // SMS Feature State
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savedPhone, setSavedPhone] = useState(null);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState(null);
  const [savedWorkoutId, setSavedWorkoutId] = useState(null);

  // Load saved phone on mount
  useEffect(() => {
    loadSavedPhone();
  }, []);

  const loadSavedPhone = async () => {
    try {
      // Try localStorage first
      const localPhone = localStorage.getItem('userPhone');
      if (localPhone) {
        setSavedPhone(localPhone);
        setPhoneNumber(localPhone);
      }

      // Then try API if authenticated
      if (token && !token.startsWith('demo-token-')) {
        const response = await fetch(`${API_BASE}/api/fitness/sms/phone`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.phone) {
            setSavedPhone(data.phone);
            // Don't overwrite if user already typed something
            if (!phoneNumber) setPhoneNumber(data.phone);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load saved phone:', err);
    }
  };

  // Format phone for display (US format)
  const formatPhoneDisplay = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // Handle SMS send
  const handleSendSms = async () => {
    if (!phoneNumber.trim()) {
      setSmsError('Please enter a phone number');
      return;
    }

    // Validate phone format (basic)
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setSmsError('Please enter a valid 10-digit phone number');
      return;
    }

    // Save workout first if not saved
    let workoutId = savedWorkoutId;
    if (!workoutId) {
      try {
        setSmsSending(true);
        setSmsError(null);

        // Save workout to get ID
        const rowsToSave = editableRows.length > 0 ? editableRows : parseWorkoutToRows();
        const daysMap = {};
        rowsToSave.forEach((row) => {
          const dayKey = row.dayGroup || row.day || 'Day 1';
          if (!daysMap[dayKey]) {
            daysMap[dayKey] = { day: dayKey, exercises: [] };
          }
          daysMap[dayKey].exercises.push({
            location: row.location,
            exercise: row.exercise,
            sets: row.sets,
            reps: row.reps,
            weight: row.weight,
          });
        });

        const workoutData = {
          days: Object.values(daysMap),
          summary: workout?.summary || {},
          closeout: workout?.closeout,
        };

        const saveResponse = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            workout_date: new Date().toISOString().split('T')[0],
            workout_type: 'ai-generated',
            duration_minutes: parseInt(workout?.summary?.total_duration) || 60,
            notes: `AI-generated workout for goal: ${goalName || 'Custom'}`,
            workout_data: JSON.stringify(workoutData),
            goal_id: goalId,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save workout');
        }

        const saveData = await saveResponse.json();
        workoutId = saveData.workout?.id || saveData.id;
        setSavedWorkoutId(workoutId);
      } catch (err) {
        setSmsError('Please save the workout first');
        setSmsSending(false);
        return;
      }
    }

    try {
      // Format phone to E.164
      let formattedPhone = cleaned;
      if (cleaned.length === 10) {
        formattedPhone = `+1${cleaned}`;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        formattedPhone = `+${cleaned}`;
      }

      // Save phone to profile
      await fetch(`${API_BASE}/api/fitness/sms/phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      // Save to localStorage as backup
      localStorage.setItem('userPhone', formattedPhone);

      // Send SMS
      const response = await fetch(`${API_BASE}/api/fitness/sms/send/${workoutId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to send text');
      }

      setSmsSuccess(true);
      setSmsError(null);
      setSavedPhone(formattedPhone);

      // Clear success after 5 seconds
      setTimeout(() => setSmsSuccess(false), 5000);
    } catch (err) {
      console.error('SMS send error:', err);
      setSmsError(err.message);
    } finally {
      setSmsSending(false);
    }
  };

  // Parse workout data into table rows
  const parseWorkoutToRows = () => {
    if (!workout) return [];

    const rows = [];

    // Primary format: Daily plan with exercises array
    if (workout.days && Array.isArray(workout.days)) {
      workout.days.forEach((day, dayIndex) => {
        const exercises = day.exercises || [];
        exercises.forEach((ex, i) => {
          rows.push({
            id: `${dayIndex}-${i}`,
            day: i === 0 ? (day.day || day.name || 'Day') : '',
            dayGroup: day.day || day.name || `Day ${dayIndex + 1}`,
            location: ex.location || day.location || 'Gym',
            exercise: ex.name || ex.exercise || (typeof ex === 'string' ? ex : ''),
            sets: ex.sets || '3',
            reps: ex.reps || '10',
            weight: ex.weight || 'Body',
          });
        });
      });
      return rows;
    }

    // Alternative format: weekly_plan
    if (workout.weekly_plan && Array.isArray(workout.weekly_plan)) {
      workout.weekly_plan.forEach((day, dayIndex) => {
        const exercises = day.exercises || [];
        exercises.forEach((ex, i) => {
          rows.push({
            id: `${dayIndex}-${i}`,
            day: i === 0 ? (day.day || day.name || 'Day') : '',
            dayGroup: day.day || day.name || `Day ${dayIndex + 1}`,
            location: ex.location || day.location || 'Gym',
            exercise: ex.name || ex.exercise || (typeof ex === 'string' ? ex : ''),
            sets: ex.sets || '3',
            reps: ex.reps || '10',
            weight: ex.weight || 'Body',
          });
        });
      });
      return rows;
    }

    // Legacy format: Section-based workout
    if (workout.warm_up || workout.strength || workout.cardio) {
      let sectionIndex = 0;

      if (workout.warm_up?.exercises) {
        workout.warm_up.exercises.forEach((exercise, i) => {
          rows.push({
            id: `warmup-${i}`,
            day: i === 0 ? 'Warm Up' : '',
            dayGroup: 'Warm Up',
            location: 'Any',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '-',
            reps: workout.warm_up.duration || '-',
            weight: 'Body',
          });
        });
        sectionIndex++;
      }

      if (workout.strength?.exercises) {
        const setsReps = workout.strength.sets_reps || '3x10';
        const matches = setsReps.match(/\d+/g) || ['3', '10'];
        const [sets, reps] = matches;

        workout.strength.exercises.forEach((exercise, i) => {
          rows.push({
            id: `strength-${i}`,
            day: i === 0 ? 'Strength' : '',
            dayGroup: 'Strength',
            location: 'Gym',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: sets,
            reps: reps,
            weight: 'Varies',
          });
        });
        sectionIndex++;
      }

      if (workout.cardio?.exercises) {
        workout.cardio.exercises.forEach((exercise, i) => {
          rows.push({
            id: `cardio-${i}`,
            day: i === 0 ? 'Cardio' : '',
            dayGroup: 'Cardio',
            location: workout.cardio.notes?.toLowerCase().includes('pool') ? 'Pool' : 'Gym',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '-',
            reps: workout.cardio.duration || '-',
            weight: 'Body',
          });
        });
        sectionIndex++;
      }

      if (workout.agility?.exercises) {
        workout.agility.exercises.forEach((exercise, i) => {
          rows.push({
            id: `agility-${i}`,
            day: i === 0 ? 'Agility' : '',
            dayGroup: 'Agility',
            location: 'Gym',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '3',
            reps: '30 sec',
            weight: 'Body',
          });
        });
      }

      if (workout.recovery?.exercises) {
        workout.recovery.exercises.forEach((exercise, i) => {
          rows.push({
            id: `recovery-${i}`,
            day: i === 0 ? 'Recovery' : '',
            dayGroup: 'Recovery',
            location: 'Any',
            exercise: typeof exercise === 'string' ? exercise : exercise.name || '',
            sets: '-',
            reps: workout.recovery.duration || '-',
            weight: 'Body',
          });
        });
      }
    }

    return rows;
  };

  // Initialize editable rows from parsed data
  React.useEffect(() => {
    const rows = parseWorkoutToRows();
    setEditableRows(rows);
  }, [workout]);

  const workoutRows = isEditing ? editableRows : parseWorkoutToRows();

  // Handle cell edit
  const handleCellEdit = (rowId, field, value) => {
    setEditableRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    if (!isEditing) {
      setEditableRows(parseWorkoutToRows());
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Save workout to history
  const saveWorkout = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      // Group rows back into days format
      const rowsToSave = editableRows.length > 0 ? editableRows : workoutRows;
      const daysMap = {};
      rowsToSave.forEach((row) => {
        const dayKey = row.dayGroup || row.day || 'Day 1';
        if (!daysMap[dayKey]) {
          daysMap[dayKey] = {
            day: dayKey,
            exercises: [],
          };
        }
        daysMap[dayKey].exercises.push({
          location: row.location,
          exercise: row.exercise,
          sets: row.sets,
          reps: row.reps,
          weight: row.weight,
        });
      });

      const workoutData = {
        days: Object.values(daysMap),
        summary: workout?.summary || {
          total_duration: '60 minutes',
          intensity_level: 'medium',
          calories_burned_estimate: 400,
        },
        closeout: workout?.closeout,
      };

      // Check if using demo token - save to localStorage for demo users
      const isDemoUser = token && token.startsWith('demo-token-');

      if (isDemoUser) {
        // Save to localStorage for demo users
        const savedWorkouts = JSON.parse(localStorage.getItem('demoWorkouts') || '[]');
        savedWorkouts.push({
          id: 'demo-workout-' + Date.now(),
          workout_date: new Date().toISOString().split('T')[0],
          workout_type: 'ai-generated',
          duration_minutes: parseInt(workout?.summary?.total_duration) || 60,
          notes: `AI-generated workout for goal: ${goalName || 'Custom'}`,
          workout_data: workoutData,
          goal_id: goalId,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('demoWorkouts', JSON.stringify(savedWorkouts));

        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
        return;
      }

      const response = await fetch(`${API_BASE}${ENDPOINTS.WORKOUTS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workout_date: new Date().toISOString().split('T')[0],
          workout_type: 'ai-generated',
          duration_minutes: parseInt(workout?.summary?.total_duration) || 60,
          notes: `AI-generated workout for goal: ${goalName || 'Custom'}`,
          workout_data: JSON.stringify(workoutData),
          goal_id: goalId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save workout');
      }

      setSaveSuccess(true);
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving workout:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export to PDF using browser print
  const exportToPDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Workout Plan - ${goalName || 'My Workout'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #5B2C6F; margin-bottom: 10px; }
            .badge { background: #F5A623; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; display: inline-block; margin-bottom: 15px; }
            .summary { display: flex; gap: 40px; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #5B2C6F; display: block; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #5B2C6F; color: white; padding: 12px; text-align: left; }
            td { padding: 10px 12px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .day-cell { font-weight: bold; color: #5B2C6F; }
            .notes { background: linear-gradient(135deg, #5B2C6F, #7B3F9E); color: white; padding: 20px; border-radius: 8px; margin-top: 20px; }
            .notes h3 { margin: 0 0 10px 0; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Your Workout Plan</h1>
          ${goalName ? `<span class="badge">Goal: ${goalName}</span>` : ''}

          ${workout?.summary ? `
            <div class="summary">
              <div class="stat">
                <span class="stat-value">${workout.summary.total_duration || '60 min'}</span>
                <span class="stat-label">Duration</span>
              </div>
              <div class="stat">
                <span class="stat-value">${workout.summary.intensity_level || 'Medium'}</span>
                <span class="stat-label">Intensity</span>
              </div>
              <div class="stat">
                <span class="stat-value">${workout.summary.calories_burned_estimate || '~400'}</span>
                <span class="stat-label">Calories</span>
              </div>
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Location</th>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              ${workoutRows.map((row) => `
                <tr>
                  <td class="day-cell">${row.day}</td>
                  <td>${row.location}</td>
                  <td>${row.exercise}</td>
                  <td>${row.sets}</td>
                  <td>${row.reps}</td>
                  <td>${row.weight}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${workout?.closeout?.notes ? `
            <div class="notes">
              <h3>Coach Notes</h3>
              <p>${workout.closeout.notes}</p>
            </div>
          ` : ''}

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString()} | ASR Fitness Coach
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle regenerate with tweaks
  const handleRegenerateWithTweaks = () => {
    setShowTweakModal(true);
  };

  const submitTweaks = () => {
    setShowTweakModal(false);
    navigate('/ai-coach', {
      state: {
        goalName,
        goalId,
        previousAnswers: answers,
        tweakRequest: tweakNotes,
      },
    });
  };

  // If no workout data, show error
  if (!workout && !workoutRows.length) {
    return (
      <div className="workout-result">
        <div className="workout-result__card">
          <h1 className="workout-result__title">No Workout Plan</h1>
          <p className="workout-result__empty">
            No workout plan was generated. Please try again.
          </p>
          <button
            className="workout-result__button"
            onClick={() => navigate('/create-goal')}
          >
            Create New Goal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-result">
      <div className="workout-result__card" ref={printRef}>
        <div className="workout-result__header">
          <h1 className="workout-result__title">Your Workout Plan</h1>
          {goalName && (
            <p className="workout-result__goal-badge">Goal: {goalName}</p>
          )}
          {message && <p className="workout-result__message">{message}</p>}
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="workout-result__success">
            Workout saved to your history successfully!
          </div>
        )}
        {saveError && (
          <div className="workout-result__error">
            Error: {saveError}
          </div>
        )}

        {/* Summary Stats */}
        {workout?.summary && (
          <div className="workout-result__summary">
            <div className="workout-result__stat">
              <span className="workout-result__stat-value">
                {workout.summary.total_duration || '60 min'}
              </span>
              <span className="workout-result__stat-label">Duration</span>
            </div>
            <div className="workout-result__stat">
              <span className="workout-result__stat-value">
                {workout.summary.intensity_level || 'Medium'}
              </span>
              <span className="workout-result__stat-label">Intensity</span>
            </div>
            <div className="workout-result__stat">
              <span className="workout-result__stat-value">
                {workout.summary.calories_burned_estimate || '~400'}
              </span>
              <span className="workout-result__stat-label">Calories</span>
            </div>
          </div>
        )}

        {/* Edit Mode Toggle */}
        <div className="workout-result__toolbar">
          <button
            className={`workout-result__tool-btn ${isEditing ? 'workout-result__tool-btn--active' : ''}`}
            onClick={toggleEditMode}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Workout'}
          </button>
          <button
            className="workout-result__tool-btn"
            onClick={exportToPDF}
          >
            Export PDF
          </button>
        </div>

        {/* Workout Table */}
        <div className="workout-result__table-wrapper">
          <table className="workout-result__table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Location</th>
                <th>Exercise</th>
                <th>Sets</th>
                <th>Reps</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {workoutRows.map((row, index) => (
                <tr key={row.id || index}>
                  <td className="workout-result__cell-day">{row.day}</td>
                  <td>
                    {isEditing ? (
                      <select
                        className="workout-result__edit-select"
                        value={row.location}
                        onChange={(e) => handleCellEdit(row.id, 'location', e.target.value)}
                      >
                        <option value="Gym">Gym</option>
                        <option value="Pool">Pool</option>
                        <option value="Home">Home</option>
                        <option value="Outdoor">Outdoor</option>
                        <option value="Any">Any</option>
                      </select>
                    ) : (
                      row.location
                    )}
                  </td>
                  <td className="workout-result__cell-exercise">
                    {isEditing ? (
                      <input
                        type="text"
                        className="workout-result__edit-input"
                        value={row.exercise}
                        onChange={(e) => handleCellEdit(row.id, 'exercise', e.target.value)}
                      />
                    ) : (
                      row.exercise
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="workout-result__edit-input workout-result__edit-input--small"
                        value={row.sets}
                        onChange={(e) => handleCellEdit(row.id, 'sets', e.target.value)}
                      />
                    ) : (
                      row.sets
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="workout-result__edit-input workout-result__edit-input--small"
                        value={row.reps}
                        onChange={(e) => handleCellEdit(row.id, 'reps', e.target.value)}
                      />
                    ) : (
                      row.reps
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="workout-result__edit-input workout-result__edit-input--small"
                        value={row.weight}
                        onChange={(e) => handleCellEdit(row.id, 'weight', e.target.value)}
                      />
                    ) : (
                      row.weight
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Closeout / Notes */}
        {workout?.closeout?.notes && (
          <div className="workout-result__closeout">
            <h3>Coach Notes</h3>
            <p>{workout.closeout.notes}</p>
          </div>
        )}

        {/* SMS Feature - Text Me My Workout */}
        <div className="workout-result__sms-section">
          <div className="workout-result__sms-toggle">
            <label className="workout-result__toggle-label">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => {
                  setSmsEnabled(e.target.checked);
                  setSmsSuccess(false);
                  setSmsError(null);
                }}
              />
              <span className="workout-result__toggle-slider"></span>
              <span className="workout-result__toggle-text">Text me my workout</span>
            </label>
          </div>

          {smsEnabled && (
            <div className="workout-result__sms-form">
              <div className="workout-result__sms-input-group">
                <input
                  type="tel"
                  className="workout-result__sms-input"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setSmsError(null);
                  }}
                  disabled={smsSending}
                />
                <button
                  className="workout-result__sms-send-btn"
                  onClick={handleSendSms}
                  disabled={smsSending || !phoneNumber.trim()}
                >
                  {smsSending ? (
                    <span className="workout-result__sms-spinner"></span>
                  ) : (
                    'Send text'
                  )}
                </button>
              </div>

              {smsSuccess && (
                <div className="workout-result__sms-success">
                  Text sent! Check your phone for the workout link.
                </div>
              )}

              {smsError && (
                <div className="workout-result__sms-error">
                  {smsError}
                </div>
              )}

              {savedPhone && !smsSuccess && (
                <p className="workout-result__sms-hint">
                  Previously used: {formatPhoneDisplay(savedPhone)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="workout-result__actions">
          {isEditing ? (
            <button
              className="workout-result__button workout-result__button--success"
              onClick={saveWorkout}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save to History'}
            </button>
          ) : (
            <>
              <button
                className="workout-result__button workout-result__button--success"
                onClick={saveWorkout}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Workout'}
              </button>
              <button
                className="workout-result__button workout-result__button--secondary"
                onClick={handleRegenerateWithTweaks}
              >
                Regenerate with Tweaks
              </button>
              <button
                className="workout-result__button"
                onClick={() => navigate('/create-goal')}
              >
                New Goal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tweak Modal */}
      {showTweakModal && (
        <div className="workout-result__modal-overlay" onClick={() => setShowTweakModal(false)}>
          <div className="workout-result__modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="workout-result__modal-title">Regenerate with Tweaks</h2>
            <p className="workout-result__modal-desc">
              Describe what you'd like to change about this workout:
            </p>
            <textarea
              className="workout-result__modal-textarea"
              placeholder="e.g., Make cardio easier, add more upper body exercises, reduce total time to 45 minutes..."
              value={tweakNotes}
              onChange={(e) => setTweakNotes(e.target.value)}
              rows={4}
            />
            <div className="workout-result__modal-actions">
              <button
                className="workout-result__button workout-result__button--secondary"
                onClick={() => setShowTweakModal(false)}
              >
                Cancel
              </button>
              <button
                className="workout-result__button"
                onClick={submitTweaks}
                disabled={!tweakNotes.trim()}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutPlanResult;
