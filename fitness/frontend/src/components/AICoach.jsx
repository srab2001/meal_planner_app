import React, { useState, useEffect } from 'react';
import { API_BASE, ENDPOINTS } from '../config/api';
import './AICoach.module.css';

/**
 * AI Workout Coach Component
 * Guides user through fitness assessment interview
 * Generates personalized workout plan based on answers
 */
function AICoach({ user, token }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch interview questions on mount
  useEffect(() => {
    fetchQuestions();
  }, [token]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}?active=true`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const data = await response.json();
      setQuestions(Array.isArray(data) ? data : data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitAnswers = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Build messages array from Q&A pairs for conversation history
      const messages = questions.map((q, idx) => ({
        role: 'user',
        content: `Q${idx + 1}: ${q.question_text}\nA: ${answers[q.id] || 'No answer provided'}`
      }));

      // Add initial context message
      messages.unshift({
        role: 'user',
        content: 'I want to create a personalized workout plan based on my fitness assessment.'
      });

      // Backend expects: messages, interview_answers, userProfile
      const payload = {
        messages: messages,
        interview_answers: answers,
        userProfile: {
          age: user.age,
          fitness_level: user.fitness_level,
        },
      };

      const response = await fetch(`${API_BASE}${ENDPOINTS.AI_WORKOUT_PLAN}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to generate plan: ${response.status}`);
      }

      const result = await response.json();

      // Check if workout was successfully generated
      if (result.workoutGenerated && result.workout) {
        setWorkoutPlan(result.workout);
      } else {
        throw new Error('Workout was not generated. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting answers:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="ai-coach-container loading">Loading interview questions...</div>;
  }

  if (error) {
    return (
      <div className="ai-coach-container error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={fetchQuestions} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="ai-coach-container empty">
        <h2>No Interview Questions Available</h2>
        <p>Please contact an administrator to set up interview questions for the AI coach.</p>
      </div>
    );
  }

  if (workoutPlan) {
    return (
      <div className="ai-coach-container plan">
        <h2>🎯 Your Personalized Workout Plan</h2>
        <div className="plan-content">
          <pre>{JSON.stringify(workoutPlan, null, 2)}</pre>
        </div>
        <button onClick={() => {
          setWorkoutPlan(null);
          setCurrentQuestionIndex(0);
          setAnswers({});
        }} className="restart-btn">
          Start Over
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="ai-coach-container">
      <h2>💪 Fitness Assessment</h2>
      
      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="progress-text">Question {currentQuestionIndex + 1} of {questions.length}</p>

      {/* Question */}
      <div className="question-card">
        <h3>{currentQuestion.question_text}</h3>
        
        {currentQuestion.question_type === 'text' && (
          <input
            type="text"
            placeholder="Your answer..."
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            className="answer-input"
          />
        )}

        {currentQuestion.question_type === 'multiple-choice' && (
          <div className="answer-options">
            {['Yes', 'No', 'Sometimes', 'Not Sure'].map(option => (
              <button
                key={option}
                className={`option-btn ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.question_type === 'rating' && (
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                className={`rating-btn ${answers[currentQuestion.id] === rating ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, rating)}
              >
                {rating}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="navigation">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="nav-btn prev-btn"
        >
          ← Previous
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitAnswers}
            disabled={submitting}
            className="submit-btn"
          >
            {submitting ? 'Generating Plan...' : 'Generate Workout Plan'}
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="nav-btn next-btn"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

export default AICoach;
