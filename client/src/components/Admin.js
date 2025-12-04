import React, { useState, useEffect } from 'react';
import './Admin.css';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');

  // Stats
  const [stats, setStats] = useState(null);

  // Discount codes
  const [discountCodes, setDiscountCodes] = useState([]);
  const [newCode, setNewCode] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_uses: '',
    valid_until: ''
  });

  // Settings
  const [freeMealPlansLimit, setFreeMealPlansLimit] = useState(10);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Options management
  const [cuisines, setCuisines] = useState([]);
  const [dietaryOptions, setDietaryOptions] = useState([]);
  const [newCuisine, setNewCuisine] = useState({ name: '', display_order: '' });
  const [newDietaryOption, setNewDietaryOption] = useState({ key: '', label: '', display_order: '' });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
      loadData();
    }
  }, [activeTab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        setIsAuthenticated(true);
        setPassword('');
        loadData();
      } else {
        setLoginError(data.error || 'Invalid password');
      }
    } catch (error) {
      setLoginError('Failed to login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setPassword('');
  };

  const loadData = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      if (activeTab === 'stats') {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setStats(data.stats);
      } else if (activeTab === 'codes') {
        const response = await fetch(`${API_BASE}/api/admin/discount-codes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setDiscountCodes(data.codes || []);
      } else if (activeTab === 'settings') {
        const response = await fetch(`${API_BASE}/api/admin/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setFreeMealPlansLimit(data.settings.free_meal_plans_limit);
      } else if (activeTab === 'options') {
        // Load cuisines
        const cuisinesResponse = await fetch(`${API_BASE}/api/admin/cuisines`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const cuisinesData = await cuisinesResponse.json();
        setCuisines(cuisinesData.cuisines || []);

        // Load dietary options
        const dietaryResponse = await fetch(`${API_BASE}/api/admin/dietary-options`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dietaryData = await dietaryResponse.json();
        setDietaryOptions(dietaryData.options || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/discount-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newCode,
          discount_value: parseFloat(newCode.discount_value),
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null
        })
      });

      if (response.ok) {
        setMessage('✅ Discount code created successfully!');
        setNewCode({
          code: '',
          description: '',
          discount_type: 'percentage',
          discount_value: '',
          max_uses: '',
          valid_until: ''
        });
        loadData();
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to create discount code');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCode = async (id, currentActive) => {
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/discount-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling code:', error);
    }
  };

  const handleDeleteCode = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount code?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/discount-codes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('✅ Discount code deleted');
        loadData();
      }
    } catch (error) {
      setMessage('❌ Failed to delete code');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ free_meal_plans_limit: parseInt(freeMealPlansLimit) })
      });

      if (response.ok) {
        setMessage('✅ Settings saved successfully!');
      } else {
        setMessage('❌ Failed to save settings');
      }
    } catch (error) {
      setMessage('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Cuisine management functions
  const handleCreateCuisine = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/cuisines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCuisine.name,
          display_order: newCuisine.display_order ? parseInt(newCuisine.display_order) : 0
        })
      });

      if (response.ok) {
        setMessage('✅ Cuisine added successfully!');
        setNewCuisine({ name: '', display_order: '' });
        loadData();
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to add cuisine');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCuisine = async (id, currentActive) => {
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/cuisines/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling cuisine:', error);
    }
  };

  const handleDeleteCuisine = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cuisine?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/cuisines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('✅ Cuisine deleted');
        loadData();
      }
    } catch (error) {
      setMessage('❌ Failed to delete cuisine');
    }
  };

  // Dietary option management functions
  const handleCreateDietaryOption = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/admin/dietary-options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: newDietaryOption.key,
          label: newDietaryOption.label,
          display_order: newDietaryOption.display_order ? parseInt(newDietaryOption.display_order) : 0
        })
      });

      if (response.ok) {
        setMessage('✅ Dietary option added successfully!');
        setNewDietaryOption({ key: '', label: '', display_order: '' });
        loadData();
      } else {
        const data = await response.json();
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to add dietary option');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDietaryOption = async (id, currentActive) => {
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/dietary-options/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling dietary option:', error);
    }
  };

  const handleDeleteDietaryOption = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dietary option?')) {
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch(`${API_BASE}/api/admin/dietary-options/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage('✅ Dietary option deleted');
        loadData();
      }
    } catch (error) {
      setMessage('❌ Failed to delete dietary option');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>🔐 Admin Panel</h1>
          <p>Enter admin password to continue</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-password-input"
              required
            />
            {loginError && <div className="error-message">{loginError}</div>}
            <button type="submit" className="login-btn">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>⚙️ Admin Panel</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Dashboard
        </button>
        <button
          className={`admin-tab ${activeTab === 'codes' ? 'active' : ''}`}
          onClick={() => setActiveTab('codes')}
        >
          🎟️ Discount Codes
        </button>
        <button
          className={`admin-tab ${activeTab === 'options' ? 'active' : ''}`}
          onClick={() => setActiveTab('options')}
        >
          🍽️ Options
        </button>
        <button
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="admin-content">
        {activeTab === 'stats' && stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Total Users</div>
              <div className="stat-sublabel">{stats.users_this_week} this week</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-value">{stats.total_meal_plans}</div>
              <div className="stat-label">Meal Plans Generated</div>
              <div className="stat-sublabel">{stats.meal_plans_this_week} this week</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎟️</div>
              <div className="stat-value">{stats.active_discount_codes}</div>
              <div className="stat-label">Active Discount Codes</div>
              <div className="stat-sublabel">{stats.total_discount_uses} total uses</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💎</div>
              <div className="stat-value">{stats.premium_subscribers}</div>
              <div className="stat-label">Premium Subscribers</div>
            </div>
          </div>
        )}

        {activeTab === 'codes' && (
          <div className="codes-section">
            <div className="create-code-form">
              <h2>Create New Discount Code</h2>
              <form onSubmit={handleCreateCode}>
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Code (e.g., SAVE20)"
                    value={newCode.code}
                    onChange={(e) => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newCode.description}
                    onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                  />
                </div>
                <div className="form-row">
                  <select
                    value={newCode.discount_type}
                    onChange={(e) => setNewCode({...newCode, discount_type: e.target.value})}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={newCode.discount_type === 'percentage' ? 'Discount % (e.g., 20)' : 'Amount ($)'}
                    value={newCode.discount_value}
                    onChange={(e) => setNewCode({...newCode, discount_value: e.target.value})}
                    required
                  />
                </div>
                <div className="form-row">
                  <input
                    type="number"
                    placeholder="Max Uses (optional)"
                    value={newCode.max_uses}
                    onChange={(e) => setNewCode({...newCode, max_uses: e.target.value})}
                  />
                  <input
                    type="date"
                    placeholder="Valid Until (optional)"
                    value={newCode.valid_until}
                    onChange={(e) => setNewCode({...newCode, valid_until: e.target.value})}
                  />
                </div>
                <button type="submit" className="create-btn" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Discount Code'}
                </button>
              </form>
            </div>

            <div className="codes-list">
              <h2>Existing Discount Codes</h2>
              {discountCodes.length === 0 ? (
                <p>No discount codes yet</p>
              ) : (
                <table className="codes-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Value</th>
                      <th>Uses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map(code => (
                      <tr key={code.id}>
                        <td><strong>{code.code}</strong></td>
                        <td>{code.discount_type}</td>
                        <td>
                          {code.discount_type === 'percentage'
                            ? `${code.discount_value}%`
                            : `$${code.discount_value}`}
                        </td>
                        <td>{code.uses_count || 0} / {code.max_uses || '∞'}</td>
                        <td>
                          <span className={`status ${code.active ? 'active' : 'inactive'}`}>
                            {code.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleCode(code.id, code.active)}
                            className="toggle-btn"
                          >
                            {code.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'options' && (
          <div className="options-section">
            <div className="codes-section">
              {/* Cuisines Management */}
              <div className="create-code-form">
                <h2>Manage Cuisines</h2>
                <form onSubmit={handleCreateCuisine}>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Cuisine Name (e.g., Ethiopian)"
                      value={newCuisine.name}
                      onChange={(e) => setNewCuisine({...newCuisine, name: e.target.value})}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Display Order (optional)"
                      value={newCuisine.display_order}
                      onChange={(e) => setNewCuisine({...newCuisine, display_order: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="create-btn" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Cuisine'}
                  </button>
                </form>

                <div className="codes-list" style={{marginTop: '20px'}}>
                  <h3>Existing Cuisines</h3>
                  {cuisines.length === 0 ? (
                    <p>No cuisines yet</p>
                  ) : (
                    <table className="codes-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Display Order</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cuisines.map(cuisine => (
                          <tr key={cuisine.id}>
                            <td><strong>{cuisine.name}</strong></td>
                            <td>{cuisine.display_order}</td>
                            <td>
                              <span className={`status ${cuisine.active ? 'active' : 'inactive'}`}>
                                {cuisine.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleCuisine(cuisine.id, cuisine.active)}
                                className="toggle-btn"
                              >
                                {cuisine.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteCuisine(cuisine.id)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Dietary Options Management */}
              <div className="create-code-form">
                <h2>Manage Dietary Options</h2>
                <form onSubmit={handleCreateDietaryOption}>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Key (e.g., lowSodium)"
                      value={newDietaryOption.key}
                      onChange={(e) => setNewDietaryOption({...newDietaryOption, key: e.target.value})}
                      required
                    />
                    <input
                      type="text"
                      placeholder="Label (e.g., Low-Sodium)"
                      value={newDietaryOption.label}
                      onChange={(e) => setNewDietaryOption({...newDietaryOption, label: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <input
                      type="number"
                      placeholder="Display Order (optional)"
                      value={newDietaryOption.display_order}
                      onChange={(e) => setNewDietaryOption({...newDietaryOption, display_order: e.target.value})}
                    />
                    <div></div>
                  </div>
                  <button type="submit" className="create-btn" disabled={saving}>
                    {saving ? 'Adding...' : 'Add Dietary Option'}
                  </button>
                </form>

                <div className="codes-list" style={{marginTop: '20px'}}>
                  <h3>Existing Dietary Options</h3>
                  {dietaryOptions.length === 0 ? (
                    <p>No dietary options yet</p>
                  ) : (
                    <table className="codes-table">
                      <thead>
                        <tr>
                          <th>Key</th>
                          <th>Label</th>
                          <th>Display Order</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dietaryOptions.map(option => (
                          <tr key={option.id}>
                            <td><code>{option.key}</code></td>
                            <td><strong>{option.label}</strong></td>
                            <td>{option.display_order}</td>
                            <td>
                              <span className={`status ${option.active ? 'active' : 'inactive'}`}>
                                {option.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleDietaryOption(option.id, option.active)}
                                className="toggle-btn"
                              >
                                {option.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteDietaryOption(option.id)}
                                className="delete-btn"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>Application Settings</h2>
            <form onSubmit={handleSaveSettings}>
              <div className="setting-item">
                <label htmlFor="freeMealPlans">
                  Free Meal Plans Per Month:
                </label>
                <input
                  id="freeMealPlans"
                  type="number"
                  min="0"
                  max="100"
                  value={freeMealPlansLimit}
                  onChange={(e) => setFreeMealPlansLimit(e.target.value)}
                  className="setting-input"
                />
                <p className="setting-description">
                  Number of free meal plans each user can generate per month before requiring payment.
                </p>
              </div>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
