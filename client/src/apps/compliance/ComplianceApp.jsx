import React, { useState, useEffect } from 'react';
import './ComplianceApp.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function ComplianceApp({ user, onBack }) {
  const [weekData, setWeekData] = useState([]);
  const [missedItems, setMissedItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, skipped: 0, missed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const token = localStorage.getItem('auth_token');
  const householdId = localStorage.getItem('active_household_id');

  useEffect(() => { fetchComplianceData(); }, [selectedDate]);

  const fetchComplianceData = async () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    try {
      const [weekRes, missedRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/core/compliance/week?start=${startOfWeek.toISOString()}&household_id=${householdId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/core/compliance/missed?household_id=${householdId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/core/compliance/summary?household_id=${householdId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (weekRes.ok) setWeekData((await weekRes.json()).days || generateEmptyWeek(startOfWeek));
      if (missedRes.ok) setMissedItems((await missedRes.json()).items || []);
      if (summaryRes.ok) setSummary((await summaryRes.json()) || summary);
    } catch (err) {
      console.error('Error fetching compliance:', err);
      setWeekData(generateEmptyWeek(startOfWeek));
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyWeek = (start) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({ date: d.toISOString().split('T')[0], items: [] });
    }
    return days;
  };

  const handleCheckin = async (planItemId, status) => {
    try {
      await fetch(`${API_BASE}/api/core/compliance/checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Household-ID': householdId },
        body: JSON.stringify({ plan_item_id: planItemId, status })
      });
      fetchComplianceData();
    } catch (err) {
      alert('Error recording check-in');
    }
  };

  const navigateWeek = (delta) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta * 7);
    setSelectedDate(newDate);
  };

  const getWeekLabel = () => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const completionRate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  if (loading) return <div className="compliance-app loading"><div className="spinner"></div></div>;

  return (
    <div className="compliance-app">
      <header className="compliance-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>✓ Compliance</h1>
      </header>

      <div className="summary-bar">
        <div className="summary-stat">
          <span className="stat-value">{completionRate}%</span>
          <span className="stat-label">Completion</span>
        </div>
        <div className="summary-stat completed">
          <span className="stat-value">{summary.completed}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="summary-stat skipped">
          <span className="stat-value">{summary.skipped}</span>
          <span className="stat-label">Skipped</span>
        </div>
        <div className="summary-stat missed">
          <span className="stat-value">{summary.missed}</span>
          <span className="stat-label">Missed</span>
        </div>
      </div>

      <nav className="compliance-tabs">
        <button className={activeTab === 'week' ? 'active' : ''} onClick={() => setActiveTab('week')}>Week View</button>
        <button className={activeTab === 'missed' ? 'active' : ''} onClick={() => setActiveTab('missed')}>
          Missed {missedItems.length > 0 && <span className="badge">{missedItems.length}</span>}
        </button>
      </nav>

      <main className="compliance-content">
        {activeTab === 'week' && (
          <>
            <div className="week-nav">
              <button onClick={() => navigateWeek(-1)}>← Prev</button>
              <span className="week-label">{getWeekLabel()}</span>
              <button onClick={() => navigateWeek(1)}>Next →</button>
            </div>
            <div className="week-grid">
              {weekData.map(day => (
                <div key={day.date} className={`day-column ${day.date === new Date().toISOString().split('T')[0] ? 'today' : ''}`}>
                  <div className="day-header">
                    <span className="day-name">{new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span className="day-date">{new Date(day.date + 'T12:00:00').getDate()}</span>
                  </div>
                  <div className="day-items">
                    {(day.items || []).map(item => (
                      <div key={item.id} className={`plan-item status-${item.status || 'pending'}`}>
                        <span className="item-icon">{item.item_type === 'meal' ? '🍽️' : item.item_type === 'workout' ? '💪' : '📋'}</span>
                        <span className="item-title">{item.title}</span>
                        {item.status === 'pending' && (
                          <div className="item-actions">
                            <button className="done" onClick={() => handleCheckin(item.id, 'completed')}>✓</button>
                            <button className="skip" onClick={() => handleCheckin(item.id, 'skipped')}>✗</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {(!day.items || day.items.length === 0) && <p className="no-items">No items</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'missed' && (
          <div className="missed-list">
            {missedItems.map(item => (
              <div key={item.id} className="missed-card">
                <span className="item-icon">{item.item_type === 'meal' ? '🍽️' : item.item_type === 'workout' ? '💪' : '📋'}</span>
                <div className="item-info">
                  <h4>{item.title}</h4>
                  <p>{new Date(item.scheduled_at).toLocaleDateString()}</p>
                </div>
                <div className="item-actions">
                  <button className="done" onClick={() => handleCheckin(item.id, 'completed')}>Mark Done</button>
                  <button className="skip" onClick={() => handleCheckin(item.id, 'skipped')}>Skip</button>
                </div>
              </div>
            ))}
            {missedItems.length === 0 && <p className="empty">No missed items - great job!</p>}
          </div>
        )}
      </main>
    </div>
  );
}
