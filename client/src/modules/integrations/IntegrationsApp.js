import React, { useState, useEffect } from 'react';
import { healthDataService, HEALTH_PROVIDERS, CONNECTION_STATUS } from './services/HealthDataService';
import featureFlags from '../../shared/services/FeatureFlags';
import auditLogger from '../../shared/services/AuditLogger';
import './styles/IntegrationsApp.css';

/**
 * IntegrationsApp - Health data integrations module
 * 
 * Features:
 * - Connect/disconnect health providers
 * - Import steps and sleep data
 * - View imported data summary
 * - Feature flag gating
 */
export default function IntegrationsApp({ user, onBack, onLogout }) {
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [importedData, setImportedData] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);

  // Initialize on mount
  useEffect(() => {
    initializeService();
  }, [user]);

  const initializeService = async () => {
    setIsLoading(true);
    
    // Check feature flag
    const enabled = featureFlags.isEnabled('health_integrations');
    setIsFeatureEnabled(enabled);
    
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Initialize health data service
    healthDataService.init(user?.id || user?.email);
    
    // Load providers and their status
    const providerList = healthDataService.getProviders();
    setProviders(providerList);
    
    const statusMap = {};
    providerList.forEach(p => {
      statusMap[p.id] = healthDataService.getConnectionStatus(p.id);
    });
    setConnectionStatus(statusMap);
    
    // Load any existing imported data
    setImportedData(healthDataService.getImportedData());
    
    setIsLoading(false);
  };

  // Handle connect
  const handleConnect = async (providerId) => {
    setMessage(null);
    setConnectionStatus(prev => ({ ...prev, [providerId]: CONNECTION_STATUS.CONNECTING }));
    
    const result = await healthDataService.connect(providerId);
    
    if (result.success) {
      setConnectionStatus(prev => ({ ...prev, [providerId]: CONNECTION_STATUS.CONNECTED }));
      setMessage({ type: 'success', text: `Connected to ${getProviderName(providerId)}!` });
    } else {
      setConnectionStatus(prev => ({ ...prev, [providerId]: CONNECTION_STATUS.ERROR }));
      setMessage({ type: 'error', text: result.error });
    }
  };

  // Handle disconnect
  const handleDisconnect = async (providerId) => {
    if (!window.confirm(`Disconnect from ${getProviderName(providerId)}? This will remove stored credentials.`)) {
      return;
    }
    
    setMessage(null);
    const result = await healthDataService.disconnect(providerId);
    
    if (result.success) {
      setConnectionStatus(prev => ({ ...prev, [providerId]: CONNECTION_STATUS.DISCONNECTED }));
      setMessage({ type: 'success', text: `Disconnected from ${getProviderName(providerId)}` });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
  };

  // Handle import data
  const handleImport = async (providerId) => {
    setMessage(null);
    setIsImporting(true);
    
    const result = await healthDataService.importData(providerId, { days: 7 });
    
    if (result.success) {
      setImportedData(healthDataService.getImportedData());
      setMessage({ 
        type: 'success', 
        text: `Imported ${result.summary.stepsImported} days of steps and sleep data!` 
      });
    } else {
      setMessage({ type: 'error', text: result.error });
    }
    
    setIsImporting(false);
  };

  // Get provider name
  const getProviderName = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || providerId;
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusConfig = {
      [CONNECTION_STATUS.CONNECTED]: { label: 'Connected', class: 'status-connected' },
      [CONNECTION_STATUS.CONNECTING]: { label: 'Connecting...', class: 'status-connecting' },
      [CONNECTION_STATUS.DISCONNECTED]: { label: 'Not Connected', class: 'status-disconnected' },
      [CONNECTION_STATUS.ERROR]: { label: 'Error', class: 'status-error' }
    };
    
    const config = statusConfig[status] || statusConfig[CONNECTION_STATUS.DISCONNECTED];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  // Feature disabled view
  if (!isFeatureEnabled) {
    return (
      <div className="integrations-app">
        <header className="integrations-header">
          <button className="back-button" onClick={onBack}>← Back</button>
          <div className="header-title">
            <h1>🔗 Integrations</h1>
            <p>Connect your health apps</p>
          </div>
        </header>
        <main className="integrations-content">
          <div className="feature-disabled">
            <span className="disabled-icon">🔒</span>
            <h2>Feature Not Available</h2>
            <p>Health integrations are currently not enabled for your account.</p>
            <p className="hint">Contact support or check back later for access.</p>
            <button className="back-btn" onClick={onBack}>Return to Portal</button>
          </div>
        </main>
      </div>
    );
  }

  // Loading view
  if (isLoading) {
    return (
      <div className="integrations-app">
        <div className="integrations-loading">
          <div className="spinner"></div>
          <p>Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="integrations-app">
      {/* Header */}
      <header className="integrations-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div className="header-title">
          <h1>🔗 Integrations</h1>
          <p>Connect your health apps</p>
        </div>
        <div className="header-actions">
          {user && <span className="user-name">{user.name || user.email}</span>}
          <button className="logout-button" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Message */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button className="dismiss" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <main className="integrations-content">
        {/* Providers Section */}
        <section className="providers-section">
          <h2>Health Data Sources</h2>
          <p className="section-description">
            Connect your health apps to import steps and sleep data.
          </p>
          
          <div className="providers-grid">
            {providers.map(provider => {
              const status = connectionStatus[provider.id] || CONNECTION_STATUS.DISCONNECTED;
              const isConnected = status === CONNECTION_STATUS.CONNECTED;
              const isConnecting = status === CONNECTION_STATUS.CONNECTING;
              
              return (
                <div key={provider.id} className="provider-card">
                  <div className="provider-header">
                    <span className="provider-icon" style={{ backgroundColor: provider.color }}>
                      {provider.icon}
                    </span>
                    <div className="provider-info">
                      <h3>{provider.name}</h3>
                      {renderStatusBadge(status)}
                    </div>
                  </div>
                  
                  <div className="provider-capabilities">
                    <span className="capability-label">Available data:</span>
                    <div className="capabilities-list">
                      {provider.capabilities.map(cap => (
                        <span key={cap} className="capability-badge">
                          {cap === 'steps' && '👟'}
                          {cap === 'sleep' && '😴'}
                          {cap === 'heart_rate' && '❤️'}
                          {cap === 'weight' && '⚖️'}
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="provider-actions">
                    {isConnected ? (
                      <>
                        <button 
                          className="import-btn"
                          onClick={() => handleImport(provider.id)}
                          disabled={isImporting}
                        >
                          {isImporting ? 'Importing...' : '📥 Import Data'}
                        </button>
                        <button 
                          className="disconnect-btn"
                          onClick={() => handleDisconnect(provider.id)}
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button 
                        className="connect-btn"
                        onClick={() => handleConnect(provider.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? 'Connecting...' : '🔗 Connect'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Imported Data Section */}
        {importedData && (importedData.summary.totalStepsRecords > 0 || importedData.summary.totalSleepRecords > 0) && (
          <section className="data-section">
            <h2>Imported Data</h2>
            
            <div className="data-cards">
              {/* Steps Card */}
              <div className="data-card steps-card">
                <div className="data-card-header">
                  <span className="data-icon">👟</span>
                  <h3>Steps</h3>
                </div>
                <div className="data-card-body">
                  <div className="data-stat">
                    <span className="stat-value">{importedData.summary.totalStepsRecords}</span>
                    <span className="stat-label">Days Tracked</span>
                  </div>
                  {importedData.summary.latestSteps && (
                    <div className="latest-data">
                      <span className="latest-label">Latest:</span>
                      <span className="latest-value">
                        {importedData.summary.latestSteps.steps.toLocaleString()} steps
                      </span>
                      <span className="latest-date">
                        {importedData.summary.latestSteps.date}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sleep Card */}
              <div className="data-card sleep-card">
                <div className="data-card-header">
                  <span className="data-icon">😴</span>
                  <h3>Sleep</h3>
                </div>
                <div className="data-card-body">
                  <div className="data-stat">
                    <span className="stat-value">{importedData.summary.totalSleepRecords}</span>
                    <span className="stat-label">Nights Tracked</span>
                  </div>
                  {importedData.summary.latestSleep && (
                    <div className="latest-data">
                      <span className="latest-label">Latest:</span>
                      <span className="latest-value">
                        {importedData.summary.latestSleep.hours} hours
                      </span>
                      <span className="latest-quality">
                        Quality: {importedData.summary.latestSleep.quality}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Data Table */}
            {importedData.steps.length > 0 && (
              <div className="recent-data">
                <h3>Recent Steps</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Steps</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedData.steps.slice(-5).reverse().map((entry, idx) => (
                      <tr key={idx}>
                        <td>{entry.date}</td>
                        <td>{entry.steps.toLocaleString()}</td>
                        <td>{entry.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Privacy Notice */}
        <section className="privacy-section">
          <h3>🔒 Your Privacy</h3>
          <ul>
            <li>Your health data is stored locally on your device</li>
            <li>Connection tokens are encrypted before storage</li>
            <li>You can disconnect and delete data at any time</li>
            <li>We only import minimal data: steps and sleep</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="integrations-footer">
        <p>ASR Health Portal • Integrations Module</p>
      </footer>
    </div>
  );
}
