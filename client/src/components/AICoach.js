import React, { useState } from 'react';
import './AICoach.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AICoach({ onWorkoutGenerated, onClose }) {
  const [step, setStep] = useState(1); // 1: Questions, 2: Generating, 3: Preview
  const [formData, setFormData] = useState({
    fitnessGoal: '',
    experienceLevel: '',
    workoutDuration: '',
    equipment: [],
    targetMuscles: [],
    daysPerWeek: 3
  });
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fitnessGoals = [
    { value: 'muscle_gain', label: 'Build Muscle', icon: '💪' },
    { value: 'weight_loss', label: 'Lose Weight', icon: '🔥' },
    { value: 'endurance', label: 'Improve Endurance', icon: '🏃' },
    { value: 'strength', label: 'Increase Strength', icon: '🏋️' },
    { value: 'flexibility', label: 'Enhance Flexibility', icon: '🧘' },
    { value: 'general', label: 'General Fitness', icon: '✨' }
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: '0-6 months experience' },
    { value: 'intermediate', label: 'Intermediate', description: '6 months - 2 years' },
    { value: 'advanced', label: 'Advanced', description: '2+ years experience' }
  ];

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' }
  ];

  const equipmentOptions = [
    'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar',
    'Bench', 'Kettlebell', 'Bodyweight Only', 'Full Gym Access'
  ];

  const muscleGroups = [
    'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.fitnessGoal) errors.push('Please select a fitness goal');
    if (!formData.experienceLevel) errors.push('Please select your experience level');
    if (!formData.workoutDuration) errors.push('Please select workout duration');
    if (formData.equipment.length === 0) errors.push('Please select at least one equipment option');

    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    return true;
  };

  const handleGenerateWorkout = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setStep(2); // Show generating screen

    try {
      const response = await fetch(`${API_BASE}/api/fitness/ai/generate-workout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate workout');
      }

      const data = await response.json();
      setGeneratedWorkout(data.workout);
      setStep(3); // Show preview
    } catch (err) {
      console.error('Error generating workout:', err);
      setError(err.message);
      setStep(1); // Go back to questions
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkout = () => {
    if (generatedWorkout) {
      onWorkoutGenerated(generatedWorkout);
      onClose();
    }
  };

  const renderStep1 = () => (
    <div className="ai-coach-questions">
      <h2>Let's Create Your Perfect Workout</h2>
      <p className="subtitle">Answer a few questions and I'll generate a personalized workout plan</p>

      {/* Fitness Goal */}
      <div className="question-section">
        <h3>What's your primary fitness goal?</h3>
        <div className="goal-grid">
          {fitnessGoals.map(goal => (
            <button
              key={goal.value}
              className={`goal-card ${formData.fitnessGoal === goal.value ? 'selected' : ''}`}
              onClick={() => handleInputChange('fitnessGoal', goal.value)}
            >
              <span className="goal-icon">{goal.icon}</span>
              <span className="goal-label">{goal.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="question-section">
        <h3>What's your experience level?</h3>
        <div className="experience-grid">
          {experienceLevels.map(level => (
            <button
              key={level.value}
              className={`experience-card ${formData.experienceLevel === level.value ? 'selected' : ''}`}
              onClick={() => handleInputChange('experienceLevel', level.value)}
            >
              <div className="experience-label">{level.label}</div>
              <div className="experience-description">{level.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Workout Duration */}
      <div className="question-section">
        <h3>How long do you want to work out?</h3>
        <div className="duration-grid">
          {durationOptions.map(duration => (
            <button
              key={duration.value}
              className={`duration-button ${formData.workoutDuration === duration.value ? 'selected' : ''}`}
              onClick={() => handleInputChange('workoutDuration', duration.value)}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="question-section">
        <h3>What equipment do you have access to?</h3>
        <div className="equipment-grid">
          {equipmentOptions.map(equipment => (
            <button
              key={equipment}
              className={`equipment-chip ${formData.equipment.includes(equipment) ? 'selected' : ''}`}
              onClick={() => toggleArrayItem('equipment', equipment)}
            >
              {equipment}
            </button>
          ))}
        </div>
      </div>

      {/* Target Muscles (Optional) */}
      <div className="question-section">
        <h3>Target specific muscle groups? (Optional)</h3>
        <div className="muscle-grid">
          {muscleGroups.map(muscle => (
            <button
              key={muscle}
              className={`muscle-chip ${formData.targetMuscles.includes(muscle) ? 'selected' : ''}`}
              onClick={() => toggleArrayItem('targetMuscles', muscle)}
            >
              {muscle}
            </button>
          ))}
        </div>
      </div>

      {/* Days per Week */}
      <div className="question-section">
        <h3>How many days per week do you plan to work out?</h3>
        <div className="days-selector">
          <button
            className="days-button"
            onClick={() => handleInputChange('daysPerWeek', Math.max(1, formData.daysPerWeek - 1))}
          >
            −
          </button>
          <span className="days-display">{formData.daysPerWeek} days/week</span>
          <button
            className="days-button"
            onClick={() => handleInputChange('daysPerWeek', Math.min(7, formData.daysPerWeek + 1))}
          >
            +
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="ai-coach-actions">
        <button className="action-button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="action-button primary" onClick={handleGenerateWorkout}>
          Generate Workout ✨
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="ai-coach-generating">
      <div className="generating-animation">
        <div className="spinner-large"></div>
        <h2>Creating Your Personalized Workout...</h2>
        <p>Our AI is analyzing your preferences and generating the perfect routine</p>
        <div className="generating-steps">
          <div className="step active">✓ Analyzing fitness goals</div>
          <div className="step active">✓ Selecting exercises</div>
          <div className="step active">⏳ Optimizing workout plan</div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="ai-coach-preview">
      <h2>Your AI-Generated Workout</h2>
      <div className="workout-preview">
        <div className="preview-header">
          <h3>{generatedWorkout?.workoutName || 'Custom Workout'}</h3>
          <div className="preview-meta">
            <span>📅 {new Date().toLocaleDateString()}</span>
            <span>⏱️ ~{formData.workoutDuration} min</span>
            <span>💪 {generatedWorkout?.exercises?.length || 0} exercises</span>
          </div>
        </div>

        <div className="preview-exercises">
          {generatedWorkout?.exercises?.map((exercise, index) => (
            <div key={index} className="preview-exercise">
              <div className="preview-exercise-header">
                <span className="exercise-number">{index + 1}</span>
                <div>
                  <h4>{exercise.exerciseName}</h4>
                  <span className="exercise-category">{exercise.category}</span>
                </div>
              </div>
              <div className="preview-sets">
                {exercise.sets?.map((set, setIndex) => (
                  <div key={setIndex} className="preview-set">
                    Set {setIndex + 1}: {set.reps} reps
                    {set.weight > 0 && ` × ${set.weight} ${set.unit}`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {generatedWorkout?.notes && (
          <div className="preview-notes">
            <h4>Coach's Notes:</h4>
            <p>{generatedWorkout.notes}</p>
          </div>
        )}
      </div>

      <div className="ai-coach-actions">
        <button className="action-button secondary" onClick={() => setStep(1)}>
          Regenerate
        </button>
        <button className="action-button primary" onClick={handleSaveWorkout}>
          Save Workout
        </button>
      </div>
    </div>
  );

  return (
    <div className="ai-coach-overlay" onClick={onClose}>
      <div className="ai-coach-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>✕</button>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}

export default AICoach;
