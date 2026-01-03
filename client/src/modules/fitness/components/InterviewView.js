import React, { useState } from 'react';

export default function InterviewView({ onClose, onPlanGenerated }) {
  const questions = [
    { id: 'q1', question_text: 'What type of workout are you interested in?', question_type: 'text' },
    { id: 'q2', question_text: 'How many days per week can you exercise?', question_type: 'number' },
    { id: 'q3', question_text: 'What is your current fitness level?', question_type: 'single_select', options: ['Beginner','Intermediate','Advanced'] },
    { id: 'q4', question_text: 'Do you have access to gym equipment?', question_type: 'single_select', options: ['Yes','No'] },
    { id: 'q5', question_text: 'How much time can you dedicate per workout (minutes)?', question_type: 'number' }
  ];

  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all answered
    for (const q of questions) {
      if (!answers[q.id]) {
        setError('Please answer all questions');
        return;
      }
    }

    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const payloadAnswers = questions.map(q => ({ question_id: q.id, question_text: q.question_text, user_answer: answers[q.id] }));

      // include desired output hint in additional_context
      const submitResp = await fetch((process.env.REACT_APP_API_URL || '') + '/api/fitness-interview/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: `sess_${Date.now()}`, answers: payloadAnswers, additional_context: { desired_output: 'spreadsheet' } })
      });

      if (!submitResp.ok) {
        const err = await submitResp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to submit interview');
      }

      const submitData = await submitResp.json();
      const responseId = submitData.response_id;

      // Trigger plan generation
      const genResp = await fetch((process.env.REACT_APP_API_URL || '') + '/api/fitness-interview/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ response_id: responseId })
      });

      if (!genResp.ok) {
        const err = await genResp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to generate plan');
      }

      const genData = await genResp.json();
      const planId = genData.plan_id;

      // Notify parent to show plan viewer
      if (onPlanGenerated) onPlanGenerated(planId);
      if (onClose) onClose();
    } catch (err) {
      console.error('Interview submit error', err);
      setError(err.message || 'Failed to submit interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="interview-view">
      <h2>AI Workout Interview</h2>
      <form onSubmit={handleSubmit}>
        {questions.map((q) => (
          <div key={q.id} className="form-group">
            <label>{q.question_text}</label>
            {q.question_type === 'single_select' ? (
              <select value={answers[q.id]||''} onChange={(e)=>handleChange(q.id,e.target.value)} required>
                <option value="">Select...</option>
                {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input type={q.question_type === 'number' ? 'number' : 'text'} value={answers[q.id]||''} onChange={(e)=>handleChange(q.id,e.target.value)} required />
            )}
          </div>
        ))}
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Workout'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
