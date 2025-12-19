import React, { useState, useEffect, useCallback } from 'react';
import './Profile.css';

// API Configuration - Always use production URLs (Vercel/Render)
const PRODUCTION_API = 'https://meal-planner-app-mve2.onrender.com';
const API_BASE = process.env.REACT_APP_API_URL || PRODUCTION_API;

function Profile({ user, onBack }) {
  // Dynamic options loaded from API
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [dietaryOptionsData, setDietaryOptionsData] = useState([]);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [bio, setBio] = useState('');

  // Preferences states
  const [defaultCuisines, setDefaultCuisines] = useState([]);
  const [defaultPeople, setDefaultPeople] = useState(2);
  const [defaultMeals, setDefaultMeals] = useState(['breakfast', 'lunch', 'dinner']);
  const [defaultDietary, setDefaultDietary] = useState([]);
  const [emailNotifications, setEmailNotifications] = useState({
    weeklyReminder: true,
    mealPlanReady: true,
    favoriteRecipeDigest: false,
    accountActivity: true,
    promotions: false
  });
  const [theme, setTheme] = useState('light');

  // Load cuisine and dietary options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Load cuisines
        const cuisinesResponse = await fetch(`${API_BASE}/api/cuisines`);
        if (cuisinesResponse.ok) {
          const cuisinesData = await cuisinesResponse.json();
          setCuisineOptions(cuisinesData.cuisines.map(c => c.name));
        }

        // Load dietary options
        const dietaryResponse = await fetch(`${API_BASE}/api/dietary-options`);
        if (dietaryResponse.ok) {
          const dietaryData = await dietaryResponse.json();
          setDietaryOptionsData(dietaryData.options);
        }
      } catch (error) {
        console.error('Error loading options:', error);
      }
    };

    loadOptions();
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfileData(data);

      // Populate form fields
      setDisplayName(data.user.display_name || '');
      setPhoneNumber(data.user.phone_number || '');
      setTimezone(data.user.timezone || 'America/New_York');
      setBio(data.user.bio || '');

      // Populate preferences
      if (data.preferences) {
        setDefaultCuisines(data.preferences.default_cuisines || []);
        setDefaultPeople(data.preferences.default_people || 2);
        setDefaultMeals(data.preferences.default_meals || ['breakfast', 'lunch', 'dinner']);
        setDefaultDietary(data.preferences.default_dietary || []);
        setEmailNotifications(data.preferences.email_notifications || emailNotifications);
        setTheme(data.preferences.theme || 'light');
      }

    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [emailNotifications]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          display_name: displayName,
          phone_number: phoneNumber,
          timezone,
          bio
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      await loadProfileData();

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          default_cuisines: defaultCuisines,
          default_people: defaultPeople,
          default_meals: defaultMeals,
          default_dietary: defaultDietary,
          email_notifications: emailNotifications,
          theme
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setSuccess('Preferences updated successfully!');
      await loadProfileData();

    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleCuisine = (cuisine) => {
    setDefaultCuisines(prev =>
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const toggleDietary = (dietary) => {
    setDefaultDietary(prev =>
      prev.includes(dietary)
        ? prev.filter(d => d !== dietary)
        : [...prev, dietary]
    );
  };

  const toggleMeal = (meal) => {
    setDefaultMeals(prev =>
      prev.includes(meal)
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={onBack} className="back-button">← Back to Meal Plan</button>
        <h1>My Profile</h1>
        <div className="user-info-header">
          <img src={profileData?.user.picture_url} alt={displayName} className="profile-avatar" />
          <div>
            <h2>{displayName || user.displayName}</h2>
            <p>{profileData?.user.email}</p>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Info
        </button>
        <button
          className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="profile-form">
            <h3>Personal Information</h3>

            <div className="form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={profileData?.user.email}
                disabled
                className="disabled-input"
              />
              <small>Email cannot be changed (linked to Google account)</small>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio (Optional)</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        )}

        {activeTab === 'preferences' && (
          <form onSubmit={handleSavePreferences} className="preferences-form">
            <h3>Meal Planning Defaults</h3>
            <p className="hint">These will be pre-selected when you create a new meal plan</p>

            <div className="form-section">
              <label>Favorite Cuisines</label>
              <div className="cuisine-grid">
                {cuisineOptions.map(cuisine => (
                  <button
                    key={cuisine}
                    type="button"
                    className={`cuisine-btn ${defaultCuisines.includes(cuisine) ? 'selected' : ''}`}
                    onClick={() => toggleCuisine(cuisine)}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label htmlFor="defaultPeople">Default Number of People</label>
              <input
                id="defaultPeople"
                type="number"
                min="1"
                max="20"
                value={defaultPeople}
                onChange={(e) => setDefaultPeople(parseInt(e.target.value))}
              />
            </div>

            <div className="form-section">
              <label>Default Meals</label>
              <div className="meal-checkboxes">
                {['breakfast', 'lunch', 'dinner'].map(meal => (
                  <label key={meal} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={defaultMeals.includes(meal)}
                      onChange={() => toggleMeal(meal)}
                    />
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label>Dietary Preferences</label>
              <div className="dietary-grid">
                {dietaryOptionsData.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    className={`dietary-btn ${defaultDietary.includes(option.key) ? 'selected' : ''}`}
                    onClick={() => toggleDietary(option.key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <h3>Email Notifications</h3>
            <div className="form-section">
              {Object.entries({
                weeklyReminder: 'Weekly meal planning reminder',
                mealPlanReady: 'Notify when meal plan is ready',
                favoriteRecipeDigest: 'Monthly favorite recipes digest',
                accountActivity: 'Account activity alerts',
                promotions: 'Promotions and updates'
              }).map(([key, label]) => (
                <label key={key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={emailNotifications[key]}
                    onChange={(e) => setEmailNotifications(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                  />
                  {label}
                </label>
              ))}
            </div>

            <h3>Appearance</h3>
            <div className="form-section">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (system preference)</option>
              </select>
            </div>

            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        )}

        {activeTab === 'stats' && profileData?.stats && (
          <div className="stats-content">
            <h3>Your Statistics</h3>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{profileData.stats.favorites_count || 0}</div>
                <div className="stat-label">Favorite Recipes</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-value">{profileData.stats.meal_plans_count || 0}</div>
                <div className="stat-label">Meal Plans Created</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎂</div>
                <div className="stat-value">{formatDate(profileData.user.created_at)}</div>
                <div className="stat-label">Member Since</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-value">{formatDate(profileData.stats.last_meal_plan)}</div>
                <div className="stat-label">Last Meal Plan</div>
              </div>
            </div>

            <div className="account-details">
              <h4>Account Details</h4>
              <div className="detail-row">
                <span>Account ID:</span>
                <code>{profileData.user.id}</code>
              </div>
              <div className="detail-row">
                <span>Last Login:</span>
                <span>{formatDate(profileData.user.last_login)}</span>
              </div>
              <div className="detail-row">
                <span>Timezone:</span>
                <span>{profileData.user.timezone || 'Not set'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
