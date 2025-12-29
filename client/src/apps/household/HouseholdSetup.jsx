import React, { useState } from 'react';
import './HouseholdSetup.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' }
];

const DIET_OPTIONS = [
  { value: 'none', label: 'No Restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' }
];

export default function HouseholdSetup({ user, onComplete, onSkip, onBack }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [householdName, setHouseholdName] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);
  const [members, setMembers] = useState([
    { name: user?.name || user?.email || '', role: 'owner', diet: 'none', isCurrentUser: true }
  ]);
  const [sharePantryInventory, setSharePantryInventory] = useState(true);
  const [shareShoppingList, setShareShoppingList] = useState(true);
  const [shareMealPlans, setShareMealPlans] = useState(true);
  const [primaryShopperIndex, setPrimaryShopperIndex] = useState(0);

  const token = localStorage.getItem('auth_token');

  // Adjust members array when size changes
  const handleSizeChange = (delta) => {
    const newSize = Math.max(1, Math.min(50, householdSize + delta));
    setHouseholdSize(newSize);

    // Adjust members array
    if (newSize > members.length) {
      const newMembers = [...members];
      for (let i = members.length; i < newSize; i++) {
        newMembers.push({ name: '', role: 'member', diet: 'none', isCurrentUser: false });
      }
      setMembers(newMembers);
    } else if (newSize < members.length) {
      // Keep the current user and trim others
      const currentUserIndex = members.findIndex(m => m.isCurrentUser);
      const newMembers = members.slice(0, newSize);
      if (currentUserIndex >= newSize) {
        newMembers[0] = members[currentUserIndex];
      }
      setMembers(newMembers);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const addMember = () => {
    if (members.length < 50) {
      setMembers([...members, { name: '', role: 'member', diet: 'none', isCurrentUser: false }]);
      setHouseholdSize(householdSize + 1);
    }
  };

  const handleSubmit = async () => {
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/core/household`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: householdName.trim(),
          size: householdSize,
          members: members.map((m, i) => ({
            ...m,
            isPrimaryShopper: i === primaryShopperIndex
          })),
          sharePantryInventory,
          shareShoppingList,
          shareMealPlans,
          primaryShopperId: members[primaryShopperIndex]?.isCurrentUser ? user?.id : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create household');
      }

      // Save household ID to localStorage
      localStorage.setItem('active_household_id', data.household.id);

      // Move to next step or complete
      if (step < 3) {
        setStep(step + 1);
      } else {
        onComplete?.(data.household);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack?.();
    }
  };

  return (
    <div className="household-setup">
      <div className="household-setup-card">
        <header className="setup-header">
          <h1>Set Up Household</h1>
          <span className="step-indicator">Step {step} of 3</span>
        </header>

        <div className="setup-divider" />

        {step === 1 && (
          <div className="setup-form">
            {/* Household Name */}
            <div className="form-group">
              <label htmlFor="householdName">Household Name</label>
              <input
                type="text"
                id="householdName"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Example: Smith Household"
              />
            </div>

            {/* Household Size */}
            <div className="form-group">
              <label>Household Size</label>
              <div className="size-selector">
                <span>Number of people:</span>
                <button
                  type="button"
                  className="size-btn"
                  onClick={() => handleSizeChange(-1)}
                  disabled={householdSize <= 1}
                >
                  -
                </button>
                <span className="size-value">{householdSize}</span>
                <button
                  type="button"
                  className="size-btn"
                  onClick={() => handleSizeChange(1)}
                  disabled={householdSize >= 50}
                >
                  +
                </button>
              </div>
            </div>

            {/* Household Members */}
            <div className="form-group">
              <label>Household Members</label>
              <div className="members-list">
                {members.map((member, index) => (
                  <div key={index} className="member-row">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder="Name"
                      disabled={member.isCurrentUser}
                      className="member-name"
                    />
                    <select
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                      disabled={member.isCurrentUser}
                      className="member-role"
                    >
                      {member.isCurrentUser && <option value="owner">Owner</option>}
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <select
                      value={member.diet}
                      onChange={(e) => handleMemberChange(index, 'diet', e.target.value)}
                      className="member-diet"
                    >
                      {DIET_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button type="button" className="add-member-btn" onClick={addMember}>
                Add another person
              </button>
            </div>

            {/* Shared Pantry Settings */}
            <div className="form-group">
              <label>Shared Pantry Settings</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={sharePantryInventory}
                    onChange={(e) => setSharePantryInventory(e.target.checked)}
                  />
                  Share pantry inventory
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={shareShoppingList}
                    onChange={(e) => setShareShoppingList(e.target.checked)}
                  />
                  Share shopping list
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={shareMealPlans}
                    onChange={(e) => setShareMealPlans(e.target.checked)}
                  />
                  Share meal plans
                </label>
              </div>
            </div>

            {/* Primary Shopper */}
            <div className="form-group">
              <label htmlFor="primaryShopper">Primary Shopper</label>
              <select
                id="primaryShopper"
                value={primaryShopperIndex}
                onChange={(e) => setPrimaryShopperIndex(Number(e.target.value))}
              >
                {members.map((member, index) => (
                  <option key={index} value={index}>
                    {member.name || `Person ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Actions */}
            <button
              type="button"
              className="primary-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Continue to Pantry Setup'}
            </button>

            <button type="button" className="skip-btn" onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-form">
            <div className="step-content">
              <h2>Pantry Setup</h2>
              <p>Your household has been created! You can now start adding items to your pantry.</p>
              <p>You can always configure your pantry later from the Pantry app.</p>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => setStep(3)}
            >
              Continue
            </button>

            <button type="button" className="skip-btn" onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="setup-form">
            <div className="step-content success-content">
              <div className="success-icon">✓</div>
              <h2>All Set!</h2>
              <p>Your household "{householdName}" has been created successfully.</p>
              <p>You can now use the Pantry app to track your food inventory.</p>
            </div>

            <button
              type="button"
              className="primary-btn"
              onClick={() => onComplete?.({ id: localStorage.getItem('active_household_id'), name: householdName })}
            >
              Go to Pantry
            </button>
          </div>
        )}

        <div className="setup-divider" />

        <footer className="setup-footer">
          {step > 1 || onBack ? (
            <button type="button" className="back-btn" onClick={handleBack}>
              &lt; Back
            </button>
          ) : (
            <div />
          )}
          <button type="button" className="help-btn">
            Help &gt;
          </button>
        </footer>
      </div>
    </div>
  );
}
