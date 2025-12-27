import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './AICoachQuestionnaire.css';

/**
 * Screen B - AI Coach Questionnaire (Enhanced)
 * Features:
 * - 7 questions that feed into ChatGPT
 * - Support for regeneration with tweaks
 * - Pre-fills answers when regenerating
 */
function AICoachQuestionnaire({ user, token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    goalId,
    goalName,
    goalDescription,
    previousAnswers,
    tweakRequest,
  } = location.state || {};

  const [answers, setAnswers] = useState({
    fitness_objective: '',
    workout_location: '',
    intensity: '',
    days_per_week: '',
    overall_goal: '',
    injuries: '',
    focus_type: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill answers if regenerating
  useEffect(() => {
    if (previousAnswers) {
      setAnswers(previousAnswers);
    }
  }, [previousAnswers]);

  const questions = [
    {
      key: 'fitness_objective',
      label: '1. What is your fitness objective?',
      placeholder: 'e.g., Build strength, improve endurance, lose weight, train for a competition...',
    },
    {
      key: 'workout_location',
      label: '2. Where will you work out? (Gym, pool, or both)',
      placeholder: 'e.g., Gym only, Pool only, Both gym and pool, Home gym...',
    },
    {
      key: 'intensity',
      label: '3. How intense should the workout be?',
      placeholder: 'e.g., Low (recovery), Moderate (maintenance), High (pushing limits)...',
    },
    {
      key: 'days_per_week',
      label: '4. How many days per week can you work out?',
      placeholder: 'e.g., 3 days, 4-5 days, 6 days...',
    },
    {
      key: 'overall_goal',
      label: '5. What is your overall goal?',
      placeholder: 'e.g., Get stronger, feel healthier, prepare for an event, build muscle mass...',
    },
    {
      key: 'injuries',
      label: '6. Do you have any injured muscles or limitations?',
      placeholder: 'e.g., Lower back pain, knee injury, shoulder impingement, none...',
    },
    {
      key: 'focus_type',
      label: '7. What is your focus: strength, ability, or weight loss?',
      placeholder: 'e.g., Strength training, Athletic ability, Weight loss, Combination...',
    },
  ];

  const handleChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if at least some answers are provided
    const answeredCount = Object.values(answers).filter((v) => v.trim()).length;
    if (answeredCount < 3) {
      setError('Please answer at least 3 questions to generate a personalized plan.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if using demo token - use sample workout for demo users
      const isDemoUser = token && token.startsWith('demo-token-');

      if (isDemoUser) {
        // Parse user answers for personalized demo workout
        const locationAnswer = (answers.workout_location || '').toLowerCase();
        const intensityAnswer = (answers.intensity || '').toLowerCase();
        const daysAnswer = (answers.days_per_week || '').toLowerCase();
        const focusAnswer = (answers.focus_type || '').toLowerCase();
        const objectiveAnswer = (answers.fitness_objective || '').toLowerCase();

        // Determine location preferences
        const includePool = locationAnswer.includes('pool') || locationAnswer.includes('both') || locationAnswer.includes('swim');
        const includeGym = locationAnswer.includes('gym') || locationAnswer.includes('both') || !locationAnswer.includes('pool only');

        // Determine intensity level
        let intensityLevel = 'Medium';
        let setsMultiplier = 1;
        let caloriesPerDay = 400;
        if (intensityAnswer.includes('high') || intensityAnswer.includes('intense') || intensityAnswer.includes('push')) {
          intensityLevel = 'High';
          setsMultiplier = 1.5;
          caloriesPerDay = 600;
        } else if (intensityAnswer.includes('low') || intensityAnswer.includes('easy') || intensityAnswer.includes('recovery')) {
          intensityLevel = 'Low';
          setsMultiplier = 0.75;
          caloriesPerDay = 250;
        }

        // Determine number of days
        let numDays = 3;
        const daysMatch = daysAnswer.match(/(\d+)/);
        if (daysMatch) {
          numDays = Math.min(Math.max(parseInt(daysMatch[1]), 2), 6);
        } else if (daysAnswer.includes('every') || daysAnswer.includes('daily')) {
          numDays = 6;
        }

        // Determine focus type
        let focusType = 'strength';
        if (focusAnswer.includes('weight') || focusAnswer.includes('fat') || focusAnswer.includes('burn') || objectiveAnswer.includes('lose')) {
          focusType = 'weight_loss';
        } else if (focusAnswer.includes('ability') || focusAnswer.includes('athletic') || focusAnswer.includes('endurance')) {
          focusType = 'athletic';
        }

        // Generate exercises based on focus type
        const strengthExercises = {
          legs: [
            { name: 'Squats', sets: Math.round(4 * setsMultiplier), reps: '6-8', weight: '155 lbs' },
            { name: 'Romanian Deadlifts', sets: Math.round(3 * setsMultiplier), reps: '8-10', weight: '135 lbs' },
            { name: 'Leg Press', sets: Math.round(3 * setsMultiplier), reps: '10-12', weight: '200 lbs' },
          ],
          push: [
            { name: 'Bench Press', sets: Math.round(4 * setsMultiplier), reps: '6-8', weight: '135 lbs' },
            { name: 'Overhead Press', sets: Math.round(3 * setsMultiplier), reps: '8-10', weight: '85 lbs' },
            { name: 'Dips', sets: Math.round(3 * setsMultiplier), reps: '8-12', weight: 'Body' },
          ],
          pull: [
            { name: 'Deadlifts', sets: Math.round(4 * setsMultiplier), reps: '5-6', weight: '205 lbs' },
            { name: 'Barbell Rows', sets: Math.round(3 * setsMultiplier), reps: '8-10', weight: '115 lbs' },
            { name: 'Pull-ups', sets: Math.round(3 * setsMultiplier), reps: '6-10', weight: 'Body' },
          ],
        };

        const weightLossExercises = {
          hiit: [
            { name: 'Burpees', sets: Math.round(4 * setsMultiplier), reps: '15', weight: 'Body' },
            { name: 'Mountain Climbers', sets: Math.round(4 * setsMultiplier), reps: '30 sec', weight: 'Body' },
            { name: 'Jump Squats', sets: Math.round(4 * setsMultiplier), reps: '20', weight: 'Body' },
            { name: 'High Knees', sets: Math.round(3 * setsMultiplier), reps: '45 sec', weight: 'Body' },
          ],
          circuit: [
            { name: 'Kettlebell Swings', sets: Math.round(4 * setsMultiplier), reps: '20', weight: '35 lbs' },
            { name: 'Box Jumps', sets: Math.round(3 * setsMultiplier), reps: '12', weight: 'Body' },
            { name: 'Battle Ropes', sets: Math.round(3 * setsMultiplier), reps: '30 sec', weight: 'N/A' },
            { name: 'Rowing Machine', sets: Math.round(3 * setsMultiplier), reps: '500m', weight: 'N/A' },
          ],
        };

        const athleticExercises = {
          power: [
            { name: 'Power Cleans', sets: Math.round(4 * setsMultiplier), reps: '5', weight: '115 lbs' },
            { name: 'Box Jumps', sets: Math.round(3 * setsMultiplier), reps: '8', weight: 'Body' },
            { name: 'Medicine Ball Slams', sets: Math.round(3 * setsMultiplier), reps: '12', weight: '20 lbs' },
          ],
          agility: [
            { name: 'Ladder Drills', sets: Math.round(4 * setsMultiplier), reps: '4 patterns', weight: 'Body' },
            { name: 'Cone Sprints', sets: Math.round(4 * setsMultiplier), reps: '6', weight: 'Body' },
            { name: 'Lateral Bounds', sets: Math.round(3 * setsMultiplier), reps: '10 each', weight: 'Body' },
          ],
        };

        const poolExercises = {
          cardio: [
            { name: 'Freestyle Sprints', sets: Math.round(6 * setsMultiplier), reps: '50m', weight: 'N/A' },
            { name: 'Backstroke Laps', sets: Math.round(4 * setsMultiplier), reps: '100m', weight: 'N/A' },
            { name: 'Treading Water (high intensity)', sets: Math.round(4 * setsMultiplier), reps: '2 min', weight: 'N/A' },
          ],
          endurance: [
            { name: 'Continuous Swim', sets: '1', reps: '800m', weight: 'N/A' },
            { name: 'Mixed Stroke Intervals', sets: Math.round(4 * setsMultiplier), reps: '200m', weight: 'N/A' },
            { name: 'Water Jogging', sets: Math.round(3 * setsMultiplier), reps: '10 min', weight: 'N/A' },
          ],
        };

        // Build workout days based on preferences
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const workoutDays = [];
        let totalCalories = 0;

        for (let i = 0; i < numDays; i++) {
          const dayName = dayNames[i];
          let exercises = [];
          let location = 'Gym';

          if (includePool && includeGym) {
            // Alternate gym and pool
            if (i % 2 === 1) {
              location = 'Pool';
              exercises = focusType === 'weight_loss' ? poolExercises.cardio : poolExercises.endurance;
            } else {
              if (focusType === 'weight_loss') {
                exercises = i === 0 ? weightLossExercises.hiit : weightLossExercises.circuit;
              } else if (focusType === 'athletic') {
                exercises = i === 0 ? athleticExercises.power : athleticExercises.agility;
              } else {
                exercises = i === 0 ? strengthExercises.legs : (i === 2 ? strengthExercises.push : strengthExercises.pull);
              }
            }
          } else if (includePool && !includeGym) {
            location = 'Pool';
            exercises = i % 2 === 0 ? poolExercises.cardio : poolExercises.endurance;
          } else {
            // Gym only
            if (focusType === 'weight_loss') {
              exercises = i % 2 === 0 ? weightLossExercises.hiit : weightLossExercises.circuit;
            } else if (focusType === 'athletic') {
              exercises = i % 2 === 0 ? athleticExercises.power : athleticExercises.agility;
            } else {
              // Strength - rotate muscle groups
              const groups = [strengthExercises.legs, strengthExercises.push, strengthExercises.pull];
              exercises = groups[i % 3];
            }
          }

          workoutDays.push({
            day: dayName,
            location,
            exercises: exercises.map(e => ({ ...e, sets: String(e.sets) })),
          });

          totalCalories += caloriesPerDay;
        }

        // Generate personalized notes
        let closeoutNotes = `This ${numDays}-day ${intensityLevel.toLowerCase()} intensity plan is designed for ${focusType.replace('_', ' ')}. `;
        if (includePool && includeGym) {
          closeoutNotes += 'It combines gym training with pool sessions for variety and recovery. ';
        }
        if (focusType === 'weight_loss') {
          closeoutNotes += `Estimated ${totalCalories} calories burned per week. Focus on keeping rest periods short (30-45 sec) to maximize calorie burn.`;
        } else if (focusType === 'athletic') {
          closeoutNotes += 'Focus on explosive movements and proper form. Rest 60-90 seconds between sets.';
        } else {
          closeoutNotes += 'Progressive overload is key - increase weight when you can complete all reps with good form.';
        }

        const demoWorkout = {
          days: workoutDays,
          summary: {
            total_duration: intensityLevel === 'High' ? '75 minutes' : (intensityLevel === 'Low' ? '45 minutes' : '60 minutes'),
            intensity_level: intensityLevel,
            calories_burned_estimate: totalCalories,
            days_per_week: numDays,
            focus: focusType.replace('_', ' '),
          },
          closeout: {
            notes: closeoutNotes,
          },
        };

        navigate('/workout-plan', {
          state: {
            workout: demoWorkout,
            message: `Personalized ${focusType.replace('_', ' ')} workout generated based on your answers!`,
            goalName,
            goalId,
            answers,
          },
        });
        return;
      }

      // Build message content
      let messageContent = `Generate a workout plan based on these answers: ${JSON.stringify(answers)}`;

      // Add tweak request if regenerating
      if (tweakRequest) {
        messageContent += `\n\nADDITIONAL MODIFICATIONS REQUESTED: ${tweakRequest}`;
      }

      // Send answers to AI endpoint
      const response = await fetch(`${API_BASE}${ENDPOINTS.AI_INTERVIEW}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          interview_answers: answers,
          goal_id: goalId,
          goal_name: goalName,
          tweak_request: tweakRequest || null,
          messages: [
            {
              role: 'user',
              content: messageContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to generate workout plan');
      }

      const data = await response.json();

      // Navigate to workout plan result
      navigate('/workout-plan', {
        state: {
          workout: data.workout,
          message: data.message,
          goalName,
          goalId,
          answers,
        },
      });
    } catch (err) {
      console.error('Error generating workout plan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-coach">
      <div className="ai-coach__card">
        <div className="ai-coach__header">
          <h1 className="ai-coach__title">AI Workout Coach</h1>
          {goalName && (
            <p className="ai-coach__goal-badge">Goal: {goalName}</p>
          )}
          {tweakRequest && (
            <div className="ai-coach__tweak-notice">
              <strong>Regenerating with modifications:</strong>
              <p>{tweakRequest}</p>
            </div>
          )}
          <p className="ai-coach__subtitle">
            {tweakRequest
              ? 'Review your answers below and click Generate to create a modified plan.'
              : 'Answer the following questions so our AI can create your personalized workout plan.'}
          </p>
        </div>

        {error && <div className="ai-coach__error">{error}</div>}

        <form onSubmit={handleSubmit} className="ai-coach__form">
          {questions.map((q) => (
            <div key={q.key} className="ai-coach__field">
              <label htmlFor={q.key} className="ai-coach__label">
                {q.label}
              </label>
              <textarea
                id={q.key}
                className="ai-coach__textarea"
                placeholder={q.placeholder}
                value={answers[q.key]}
                onChange={(e) => handleChange(q.key, e.target.value)}
                disabled={loading}
                rows={2}
              />
            </div>
          ))}

          <button type="submit" className="ai-coach__button" disabled={loading}>
            {loading ? (
              <>
                <span className="ai-coach__spinner"></span>
                {tweakRequest ? 'Regenerating Plan...' : 'Generating Workout Plan...'}
              </>
            ) : tweakRequest ? (
              'Regenerate Modified Plan'
            ) : (
              'Generate AI Workout Plan'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AICoachQuestionnaire;
