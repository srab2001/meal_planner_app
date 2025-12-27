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
        // Generate a sample workout plan for demo users (format matches parser)
        const demoWorkout = {
          days: [
            {
              day: 'Monday',
              location: 'Gym',
              exercises: [
                { name: 'Squats', sets: '4', reps: '8-10', weight: '135 lbs' },
                { name: 'Leg Press', sets: '3', reps: '10-12', weight: '180 lbs' },
                { name: 'Lunges', sets: '3', reps: '12 each', weight: '30 lbs' },
              ],
            },
            {
              day: 'Wednesday',
              location: 'Gym',
              exercises: [
                { name: 'Bench Press', sets: '4', reps: '8-10', weight: '115 lbs' },
                { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', weight: '40 lbs' },
                { name: 'Cable Flyes', sets: '3', reps: '12-15', weight: '25 lbs' },
              ],
            },
            {
              day: 'Friday',
              location: 'Gym',
              exercises: [
                { name: 'Deadlifts', sets: '4', reps: '6-8', weight: '185 lbs' },
                { name: 'Barbell Rows', sets: '3', reps: '8-10', weight: '95 lbs' },
                { name: 'Lat Pulldowns', sets: '3', reps: '10-12', weight: '100 lbs' },
              ],
            },
          ],
          summary: {
            total_duration: '60 minutes',
            intensity_level: 'Medium',
            calories_burned_estimate: 450,
          },
          closeout: {
            notes: 'This is a demo workout plan. Start with lighter weights and focus on proper form. Rest 60-90 seconds between sets.',
          },
        };

        navigate('/workout-plan', {
          state: {
            workout: demoWorkout,
            message: 'Demo workout plan generated based on your answers!',
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
