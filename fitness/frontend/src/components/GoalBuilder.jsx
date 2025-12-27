import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './GoalBuilder.css';

/**
 * Goal Builder Component - Six Questions Layout
 *
 * Features:
 * - Six question layout with multiline text boxes
 * - Left column: Questions (from admin-managed question bank)
 * - Right column: AI-generated output (after submission)
 * - Draft saves without COMAR validation
 * - Save runs COMAR check then stores
 */
function GoalBuilder({ user, token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Questions from admin question bank
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [aiOutput, setAiOutput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [comarStatus, setComarStatus] = useState(null);

  useEffect(() => {
    fetchQuestions();
    if (isEditMode) {
      fetchExistingGoal();
    }
  }, [token, id]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}?active=true`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load questions');
      }

      const data = await response.json();
      const questionList = data.questions || [];

      // Take first 6 questions, sorted by order
      const sortedQuestions = questionList
        .sort((a, b) => a.order_position - b.order_position)
        .slice(0, 6);

      setQuestions(sortedQuestions);

      // Initialize answers
      const initialAnswers = {};
      sortedQuestions.forEach((q, index) => {
        initialAnswers[`question_${index + 1}`] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingGoal = async () => {
    try {
      const response = await fetch(
        `${API_BASE}${ENDPOINTS.GOALS}/${id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.answers) {
          setAnswers(data.answers);
        }
        if (data.ai_output) {
          setAiOutput(data.ai_output);
        }
      }
    } catch (err) {
      console.error('Error fetching goal:', err);
    }
  };

  const handleAnswerChange = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }));
    // Clear COMAR status when user modifies answers
    setComarStatus(null);
  };

  /**
   * COMAR Validation
   * Checks if the goal meets COMAR compliance requirements
   */
  const runComarValidation = async () => {
    // Simulate COMAR check - in production this would call backend
    const issues = [];

    // Check all required questions are answered
    questions.forEach((q, index) => {
      const key = `question_${index + 1}`;
      if (!answers[key] || answers[key].trim().length < 10) {
        issues.push(`Question ${index + 1} requires a more detailed response (minimum 10 characters)`);
      }
    });

    // Check for COMAR-specific requirements based on question tags
    questions.forEach((q, index) => {
      if (q.comar_tag) {
        const key = `question_${index + 1}`;
        const answer = answers[key] || '';

        // Check if answer includes measurable goals
        if (q.comar_tag === 'measurable' && !/\d/.test(answer)) {
          issues.push(`Question ${index + 1} (${q.comar_tag}): Must include measurable metrics or numbers`);
        }

        // Check for timeline
        if (q.comar_tag === 'timeline' && !/week|day|month|year/i.test(answer)) {
          issues.push(`Question ${index + 1} (${q.comar_tag}): Must specify a timeline`);
        }
      }
    });

    return {
      valid: issues.length === 0,
      issues
    };
  };

  /**
   * Draft Save - Stores to plan without COMAR validation
   */
  const handleDraftSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        answers,
        status: 'draft',
        user_id: user.id,
        created_at: new Date().toISOString()
      };

      const response = await fetch(
        `${API_BASE}${ENDPOINTS.GOALS}${isEditMode ? `/${id}` : ''}`,
        {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goal_type: 'custom_plan',
            status: 'draft',
            plan_data: payload
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      alert('Draft saved successfully! You can continue editing later.');
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Final Save - Runs COMAR check then stores
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Run COMAR validation
      const comarResult = await runComarValidation();
      setComarStatus(comarResult);

      if (!comarResult.valid) {
        setError('COMAR validation failed. Please address the issues below.');
        setSaving(false);
        return;
      }

      // Generate AI output based on answers
      const aiResponse = await generateAiPlan();

      const payload = {
        answers,
        ai_output: aiResponse,
        status: 'active',
        comar_validated: true,
        validated_at: new Date().toISOString(),
        user_id: user.id
      };

      const response = await fetch(
        `${API_BASE}${ENDPOINTS.GOALS}${isEditMode ? `/${id}` : ''}`,
        {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goal_type: 'custom_plan',
            status: 'active',
            plan_data: payload
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save goal');
      }

      alert('Goal saved successfully with COMAR validation!');
      navigate('/goals');
    } catch (err) {
      console.error('Error saving goal:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Generate AI Plan based on user answers
   */
  const generateAiPlan = async () => {
    try {
      const response = await fetch(
        `${API_BASE}${ENDPOINTS.AI_INTERVIEW}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Generate a fitness plan based on my answers' }],
            interview_answers: answers
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAiOutput(data.workout || data.message);
        return data.workout || data.message;
      }

      return null;
    } catch (err) {
      console.error('Error generating AI plan:', err);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="goal-builder">
        <div className="goal-builder__loading">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="goal-builder">
      {/* Header */}
      <div className="goal-builder__header">
        <h1 className="goal-builder__title">Create Goal</h1>
        <p className="goal-builder__subtitle">
          Draft saves without COMAR. Save runs COMAR.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="goal-builder__error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* COMAR Validation Issues */}
      {comarStatus && !comarStatus.valid && (
        <div className="goal-builder__comar-issues">
          <strong>COMAR Validation Issues:</strong>
          <ul>
            {comarStatus.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="goal-builder__layout">
        {/* Left Column - Questions */}
        <div className="goal-builder__questions">
          {questions.length === 0 ? (
            <div className="goal-builder__no-questions">
              No questions configured. Please contact an administrator.
            </div>
          ) : (
            questions.map((question, index) => (
              <div key={question.id || index} className="goal-builder__question">
                <label className="goal-builder__question-label">
                  Question {index + 1}
                  {question.help_text && (
                    <span className="goal-builder__help-text">{question.help_text}</span>
                  )}
                </label>
                <p className="goal-builder__question-text">{question.question_text}</p>
                <textarea
                  className="goal-builder__textarea"
                  value={answers[`question_${index + 1}`] || ''}
                  onChange={(e) => handleAnswerChange(`question_${index + 1}`, e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                />
              </div>
            ))
          )}
        </div>

        {/* Right Column - AI Output */}
        <div className="goal-builder__output">
          <h3 className="goal-builder__output-title">AI-Generated Plan</h3>
          {aiOutput ? (
            <div className="goal-builder__output-content">
              {typeof aiOutput === 'object' ? (
                <pre>{JSON.stringify(aiOutput, null, 2)}</pre>
              ) : (
                <p>{aiOutput}</p>
              )}
            </div>
          ) : (
            <div className="goal-builder__output-placeholder">
              Complete the questions and click "Save" to generate your personalized AI plan.
            </div>
          )}
        </div>
      </div>

      {/* Fixed Footer with Actions */}
      <footer className="goal-builder__footer">
        <span className="goal-builder__footer-text">
          Draft → store to plan. Save → COMAR check then store.
        </span>
        <div className="goal-builder__footer-actions">
          <button
            className="asr-btn asr-btn--orange asr-btn--lg"
            onClick={handleDraftSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Draft'}
          </button>
          <button
            className="asr-btn asr-btn--red asr-btn--lg"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Validating...' : 'Save'}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default GoalBuilder;
