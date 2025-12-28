import React, { useState, useEffect } from 'react';
import './MedicalApp.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function MedicalApp({ user, onBack }) {
  const [profile, setProfile] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [allergyForm, setAllergyForm] = useState({ allergen: '', severity: 'moderate', notes: '' });
  const [conditionForm, setConditionForm] = useState({ condition: '', status: 'active', notes: '' });
  const [profileForm, setProfileForm] = useState({ date_of_birth: '', height_cm: '', weight_kg: '', blood_type: '' });

  const token = localStorage.getItem('auth_token');

  useEffect(() => { fetchMedicalData(); }, []);

  const fetchMedicalData = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/core/medical/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setAllergies(data.allergies || []);
        setConditions(data.conditions || []);
        setConstraints(data.constraints || []);
        if (data.profile) {
          setProfileForm({
            date_of_birth: data.profile.date_of_birth?.split('T')[0] || '',
            height_cm: data.profile.height_cm || '',
            weight_kg: data.profile.weight_kg || '',
            blood_type: data.profile.blood_type || ''
          });
        }
      }
    } catch (err) {
      console.error('Error fetching medical data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/core/medical/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        alert('Profile saved');
      }
    } catch (err) {
      alert('Error saving profile');
    }
  };

  const handleAddAllergy = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/core/medical/allergies`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(allergyForm)
      });
      if (response.ok) {
        const data = await response.json();
        setAllergies([...allergies, data.allergy]);
        setConstraints(data.constraints || constraints);
        setAllergyForm({ allergen: '', severity: 'moderate', notes: '' });
        setShowAllergyForm(false);
      }
    } catch (err) {
      alert('Error adding allergy');
    }
  };

  const handleAddCondition = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/core/medical/conditions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(conditionForm)
      });
      if (response.ok) {
        const data = await response.json();
        setConditions([...conditions, data.condition]);
        setConstraints(data.constraints || constraints);
        setConditionForm({ condition: '', status: 'active', notes: '' });
        setShowConditionForm(false);
      }
    } catch (err) {
      alert('Error adding condition');
    }
  };

  const handleDeleteAllergy = async (id) => {
    if (!confirm('Remove this allergy?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/core/medical/allergies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAllergies(allergies.filter(a => a.id !== id));
        const data = await response.json();
        setConstraints(data.constraints || constraints);
      }
    } catch (err) {
      alert('Error removing allergy');
    }
  };

  const handleDeleteCondition = async (id) => {
    if (!confirm('Remove this condition?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/core/medical/conditions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setConditions(conditions.filter(c => c.id !== id));
        const data = await response.json();
        setConstraints(data.constraints || constraints);
      }
    } catch (err) {
      alert('Error removing condition');
    }
  };

  if (loading) return <div className="medical-app loading"><div className="spinner"></div></div>;

  return (
    <div className="medical-app">
      <header className="medical-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>🏥 Medical Profile</h1>
      </header>

      <nav className="medical-tabs">
        {['profile', 'allergies', 'conditions', 'constraints'].map(tab => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'constraints' && constraints.length > 0 && <span className="badge">{constraints.length}</span>}
          </button>
        ))}
      </nav>

      <main className="medical-content">
        {activeTab === 'profile' && (
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={profileForm.date_of_birth} onChange={e => setProfileForm({...profileForm, date_of_birth: e.target.value})} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" value={profileForm.height_cm} onChange={e => setProfileForm({...profileForm, height_cm: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" value={profileForm.weight_kg} onChange={e => setProfileForm({...profileForm, weight_kg: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Blood Type</label>
              <select value={profileForm.blood_type} onChange={e => setProfileForm({...profileForm, blood_type: e.target.value})}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-save">Save Profile</button>
          </form>
        )}

        {activeTab === 'allergies' && (
          <div className="list-section">
            <div className="section-header">
              <h2>Allergies</h2>
              <button onClick={() => setShowAllergyForm(!showAllergyForm)}>+ Add</button>
            </div>
            {showAllergyForm && (
              <form className="add-form" onSubmit={handleAddAllergy}>
                <input placeholder="Allergen (e.g., peanuts)" value={allergyForm.allergen} onChange={e => setAllergyForm({...allergyForm, allergen: e.target.value})} required />
                <select value={allergyForm.severity} onChange={e => setAllergyForm({...allergyForm, severity: e.target.value})}>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="life-threatening">Life-threatening</option>
                </select>
                <button type="submit">Add</button>
              </form>
            )}
            <div className="items-list">
              {allergies.map(a => (
                <div key={a.id} className={`item-card severity-${a.severity}`}>
                  <div className="item-info"><h4>{a.allergen}</h4><span className="severity">{a.severity}</span></div>
                  <button className="btn-delete" onClick={() => handleDeleteAllergy(a.id)}>×</button>
                </div>
              ))}
              {allergies.length === 0 && <p className="empty">No allergies recorded</p>}
            </div>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div className="list-section">
            <div className="section-header">
              <h2>Medical Conditions</h2>
              <button onClick={() => setShowConditionForm(!showConditionForm)}>+ Add</button>
            </div>
            {showConditionForm && (
              <form className="add-form" onSubmit={handleAddCondition}>
                <input placeholder="Condition (e.g., diabetes)" value={conditionForm.condition} onChange={e => setConditionForm({...conditionForm, condition: e.target.value})} required />
                <select value={conditionForm.status} onChange={e => setConditionForm({...conditionForm, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="managed">Managed</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button type="submit">Add</button>
              </form>
            )}
            <div className="items-list">
              {conditions.map(c => (
                <div key={c.id} className={`item-card status-${c.status}`}>
                  <div className="item-info"><h4>{c.condition}</h4><span className="status">{c.status}</span></div>
                  <button className="btn-delete" onClick={() => handleDeleteCondition(c.id)}>×</button>
                </div>
              ))}
              {conditions.length === 0 && <p className="empty">No conditions recorded</p>}
            </div>
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="list-section">
            <div className="section-header"><h2>Active Constraints</h2></div>
            <p className="section-desc">These are auto-computed from your allergies and conditions.</p>
            <div className="items-list">
              {constraints.map(c => (
                <div key={c.id} className={`constraint-card type-${c.constraint_type}`}>
                  <div className="constraint-info">
                    <h4>{c.constraint_key.replace(/_/g, ' ')}</h4>
                    <span className="type">{c.constraint_type}</span>
                    {c.value && <span className="value">Max: {c.value}</span>}
                  </div>
                </div>
              ))}
              {constraints.length === 0 && <p className="empty">No active constraints</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
