import React, { useEffect, useState } from 'react';

export default function FitnessInterviewAdminPage() {
  const API_BASE = process.env.REACT_APP_API_URL || '';
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [inputType, setInputType] = useState('single_select');
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/admin/fitness-interview/questions`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Load failed');
      const data = await res.json();
      setQuestions(data.data || []);
    } catch (e) { setError(e.message || 'Failed'); }
    setLoading(false);
  }

  function addOption() {
    if (!newOption.trim()) return;
    setOptions(prev => [...prev, newOption.trim()]);
    setNewOption('');
  }

  async function createQuestion() {
    try {
      const token = localStorage.getItem('auth_token');
      const payload = { question_text: label, question_type: inputType === 'single_select' ? 'multiple_choice' : inputType, options, is_active: true };
      const res = await fetch(`${API_BASE}/api/admin/fitness-interview/questions`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Create failed');
      await load();
      setLabel(''); setKey(''); setOptions([]);
    } catch (e) { alert(e.message || 'Create failed'); }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Fitness Interview Admin (Simple)</h1>
      <button onClick={load}>Reload</button>
      {loading ? <p>Loading...</p> : null}
      {error ? <div style={{color:'red'}}>{error}</div> : null}

      <h2>Create question</h2>
      <div style={{display:'grid',gap:8,maxWidth:600}}>
        <input placeholder="Label" value={label} onChange={e=>setLabel(e.target.value)} />
        <select value={inputType} onChange={e=>setInputType(e.target.value)}>
          <option value="single_select">Single Select</option>
          <option value="multi_select">Multi Select</option>
          <option value="number">Number</option>
          <option value="text">Text</option>
        </select>
        <div>
          <input placeholder="New option" value={newOption} onChange={e=>setNewOption(e.target.value)} />
          <button onClick={addOption}>Add</button>
        </div>
        <div>Options: {options.join(', ')}</div>
        <div>
          <button onClick={createQuestion}>Create</button>
        </div>
      </div>

      <h2>Existing</h2>
      <ul>
        {questions.map(q => (
          <li key={q.id}>{q.question_text} ({q.question_type}) - Active: {q.is_active ? 'yes':'no'}</li>
        ))}
      </ul>
    </div>
  );
}
