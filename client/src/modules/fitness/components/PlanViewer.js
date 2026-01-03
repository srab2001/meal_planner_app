import React, { useEffect, useState } from 'react';
import '../styles/WorkoutDisplay.css';

export default function PlanViewer({ onClose, planId }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const url = (process.env.REACT_APP_API_URL || '') + (planId ? `/api/fitness/plan/${planId}` : '/api/fitness/plan/latest');
        const resp = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error('Failed to fetch latest plan');
        const data = await resp.json();
        setPlan(data.data || data);
      } catch (err) {
        console.error('Error fetching plan:', err);
        setError(err.message || 'Failed to load plan');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  if (loading) return <div className="plan-viewer">Loading plan...</div>;
  if (error) return (
    <div className="plan-viewer">
      <div>Error: {error}</div>
      <button onClick={onClose}>Close</button>
    </div>
  );

  const p = plan.plan_json || plan;
  // If the model provided a CSV spreadsheet, parse it. Otherwise convert sessions -> rows
  let rows = [];
  if (p.spreadsheet_csv && typeof p.spreadsheet_csv === 'string') {
    // Simple CSV parse (no quoted commas handling) - sufficient for model-generated simple CSV
    const lines = p.spreadsheet_csv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const headers = lines.length ? lines[0].split(',').map(h => h.trim()) : [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const row = {};
      for (let j = 0; j < headers.length; j++) row[headers[j]] = cols[j] || '';
      rows.push(row);
    }
  } else if (Array.isArray(p.sessions)) {
    for (const s of p.sessions) {
      const main = s.main || [];
      for (const ex of main) {
        rows.push({
          session: s.title,
          durationMinutes: s.durationMinutes,
          exercise_name: ex.name,
          sets: ex.sets,
          repsOrTime: ex.repsOrTime,
          restSeconds: ex.restSeconds,
          notes: ex.notes || ''
        });
      }
    }
  }

  return (
    <div className="plan-viewer">
      <div className="plan-header">
        <h2>{p.planSummary?.name || 'Your Workout Plan'}</h2>
        <button onClick={onClose}>Close</button>
      </div>

      <div className="plan-body">
        <section className="plan-summary">
          <h3>Summary</h3>
          <pre>{JSON.stringify(p.planSummary, null, 2)}</pre>
        </section>

        <section className="plan-spreadsheet">
          <h3>Workout Spreadsheet</h3>
          {rows.length === 0 ? (
            <p>No exercises found in plan.</p>
          ) : (
            <table className="workout-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Duration</th>
                  <th>Exercise</th>
                  <th>Sets</th>
                  <th>Reps/Time</th>
                  <th>Rest (s)</th>
                  <th>Notes</th>
                  <th>Done</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.session}</td>
                    <td>{r.durationMinutes}</td>
                    <td>{r.name}</td>
                    <td>{r.sets}</td>
                    <td>{r.repsOrTime}</td>
                    <td>{r.restSeconds}</td>
                    <td><input defaultValue={r.notes} /></td>
                    <td><input type="checkbox" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="plan-notes">
          <h3>Safety Notes</h3>
          <pre>{JSON.stringify(p.safetyNotes, null, 2)}</pre>
        </section>
      </div>
    </div>
  );
}
