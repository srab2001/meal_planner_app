import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/FitnessApp.css';

export default function InterviewPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = (process.env.REACT_APP_API_URL || '') ;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const resp = await axios.get(`${API_URL}/api/fitness-interview/questions`, { headers: { Authorization: `Bearer ${token}` } });
        if (resp.data && resp.data.ok) {
          const qs = resp.data.data.questions || [];
          qs.sort((a,b)=> (a.sort_order||0) - (b.sort_order||0));
          setQuestions(qs);
        } else {
          setError((resp.data && resp.data.message) || 'Failed to load questions');
        }
      } catch (err) {
        console.error('Failed to load questions', err);
        setError(err.response?.data?.message || err.message || 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_URL]);

  const handleChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleMultiChange = (key, selected) => {
    setAnswers(prev => ({ ...prev, [key]: selected }));
  };

  const validate = () => {
    for (const q of questions) {
      if (q.is_required) {
        const v = answers[q.key];
        if (v === undefined || v === null || (Array.isArray(v) && v.length === 0) || (typeof v === 'string' && String(v).trim() === '')) {
          setError(`Please answer: ${q.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validate()) return;
    try {
      setGenerating(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      // Build response_json keyed by question.key
      const response_json = {};
      for (const q of questions) {
        response_json[q.key] = answers[q.key] !== undefined ? answers[q.key] : null;
      }
      // also include low_impact toggle if present separately
      if (answers.low_impact !== undefined) response_json.low_impact = answers.low_impact;

      const submitResp = await axios.post(`${API_URL}/api/fitness-interview/submit`, { session_id: `sess_${Date.now()}`, response_json, additional_context: { desired_output: 'spreadsheet' } }, { headers: { Authorization: `Bearer ${token}` } });
      if (!(submitResp.data && submitResp.data.success && submitResp.data.response_id)) {
        throw new Error(submitResp.data.message || 'Submit failed');
      }
      const responseId = submitResp.data.response_id;
      // Trigger generation (show generating screen)
      const genResp = await axios.post(`${API_URL}/api/fitness-interview/generate-plan`, { response_id: responseId }, { headers: { Authorization: `Bearer ${token}` } });
      if (!(genResp.data && genResp.data.success && genResp.data.plan_id)) {
        throw new Error(genResp.data.message || 'Generate failed');
      }
      const planId = genResp.data.plan_id;
      // Navigate to fitness dashboard and open plan
      window.location.href = `/fitness?plan_id=${planId}`;
    } catch (err) {
      console.error('Interview submit error', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit');
      setGenerating(false);
    }
  };

  if (loading) return <div className="fitness-view"><p>Loading interview...</p></div>;
  if (error) return <div className="fitness-view"><p className="error">{error}</p></div>;

  // If generating, show generating progress
  if (generating) {
    return (
      <div className="fitness-view generating-screen">
        <h2>Generating Workout Plan</h2>
        <div className="progress-bar"><div className="progress" style={{width:'50%'}}></div></div>
        <p>Building your workout plan</p>
        <ul>
          <li>Uses your goals</li>
          <li>Fits your schedule</li>
          <li>Respects injuries</li>
        </ul>
      </div>
    );
  }

  // Multi-step interview UI
  const totalSteps = questions.length + 1; // +1 for review
  const atReview = step >= questions.length;

  const currentQuestion = questions[step];

  const canGoNext = () => {
    if (atReview) return true;
    const q = currentQuestion;
    if (!q) return false;
    const v = answers[q.key];
    if (q.is_required) return !(v === undefined || v === null || (Array.isArray(v) && v.length === 0) || (typeof v === 'string' && v.trim() === ''));
    return true;
  };

  const goNext = () => { if (atReview) { handleSubmit(); } else setStep(s => Math.min(s+1, questions.length)); };
  const goBack = () => { if (step>0) setStep(s => s-1); }

  // Render current question form control with enhanced UI
  function renderQuestionControl(q) {
    if (!q) return null;
    
    const value = answers[q.key] || (q.input_type === 'multi_select' ? [] : '');
    
    if (q.input_type === 'single_select') {
      // Render as button grid for better UX
      return (
        <div className="options-grid">
          {q.options && q.options.map(o => (
            <button
              key={o.value}
              type="button"
              className={`option-button ${value === o.value ? 'active' : ''}`}
              onClick={() => handleChange(q.key, o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      );
    }
    
    if (q.input_type === 'multi_select') {
      // Render as checkbox grid for better UX
      return (
        <div className="options-grid multi">
          {q.options && q.options.map(o => (
            <label key={o.value} className="checkbox-option">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(o.value)}
                onChange={e => {
                  const newVal = Array.isArray(value) ? [...value] : [];
                  if (e.target.checked) {
                    if (!newVal.includes(o.value)) newVal.push(o.value);
                  } else {
                    const idx = newVal.indexOf(o.value);
                    if (idx > -1) newVal.splice(idx, 1);
                  }
                  handleMultiChange(q.key, newVal);
                }}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
    }
    
    if (q.input_type === 'number') {
      return (
        <div className="number-input-container">
          <input
            type="number"
            min="0"
            value={value}
            onChange={e => handleChange(q.key, e.target.value)}
            className="number-input"
          />
        </div>
      );
    }
    
    // text type (for injuries/notes)
    return (
      <textarea
        value={value}
        onChange={e => handleChange(q.key, e.target.value)}
        className="text-input"
        placeholder="Describe any injuries or limitations..."
        rows="4"
      />
    );
  }

  return (
    <div className="fitness-view interview-page">
      <header className="interview-header"><button onClick={() => window.history.back()} className="back">◀</button><h2>Fitness Interview</h2></header>

      {!atReview ? (
        <div className="question-screen">
          <div className="question-title"><h3>{currentQuestion.label}</h3></div>
          <div className="form-group">
            {renderQuestionControl(currentQuestion)}
            {currentQuestion.help_text && <small className="help-text">{currentQuestion.help_text}</small>}
          </div>
          {/* Special: if this is the injuries field, show a low-impact toggle */}
          {currentQuestion && currentQuestion.key === 'injuries' && (
            <div className="form-group toggle-group">
              <label>Low impact only</label>
              <label className="switch">
                <input type="checkbox" checked={!!answers.low_impact} onChange={e => setAnswers(prev=>({...prev, low_impact: e.target.checked}))} />
                <span className="slider" />
              </label>
            </div>
          )}

          <div className="step-footer">
            <div className="progress-dots">{questions.map((_,i)=> <span key={i} className={i===step? 'dot active' : 'dot'}></span>)}</div>
            <div className="actions">
              <button type="button" onClick={goBack} disabled={step===0}>Back</button>
              <button type="button" onClick={goNext} disabled={!canGoNext()}>{step === questions.length-1 ? 'Review' : 'Next'}</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="review-screen">
          <h3>Review and Generate Workout</h3>
          <div className="summary">
            {questions.map(q => (
              <div key={q.key} className="summary-row">
                <div className="summary-label">{q.label}</div>
                <div className="summary-value">{Array.isArray(answers[q.key]) ? answers[q.key].join(', ') : String(answers[q.key] || '')}</div>
              </div>
            ))}
            {/* include low impact */}
            <div className="summary-row"><div className="summary-label">Low impact only</div><div className="summary-value">{answers.low_impact ? 'Yes' : 'No'}</div></div>
          </div>
          <div className="review-actions">
            <button onClick={() => setStep(0)}>Edit Answers</button>
            <button onClick={() => handleSubmit()} className="primary">Generate Workout Plan</button>
          </div>
        </div>
      )}
    </div>
  );
}
