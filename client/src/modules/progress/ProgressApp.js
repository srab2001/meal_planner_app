import React, { useState, useEffect, useCallback } from 'react';
import { StreakService } from './services/StreakService';
import { BadgeService } from './services/BadgeService';
import { ReferralService } from './services/ReferralService';
import './styles/ProgressApp.css';

/**
 * ProgressApp - Main Progress Module Component
 * 
 * Features:
 * - Streak tracking for weekly meal plan generation
 * - Achievement badges
 * - Referral system with limits
 */
export default function ProgressApp({ user, onBack, onLogout }) {
  const [currentView, setCurrentView] = useState('overview');
  const [streakData, setStreakData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [badgeStats, setBadgeStats] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Referral code input
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMessage, setReferralMessage] = useState(null);
  const [applyingCode, setApplyingCode] = useState(false);

  // Load all progress data
  const loadProgressData = useCallback(() => {
    setLoading(true);
    
    // Load streak data
    const streak = StreakService.getStreakDisplay();
    setStreakData(streak);
    
    // Load badges
    const earnedBadges = BadgeService.getEarnedBadges();
    setBadges(earnedBadges);
    setBadgeStats(BadgeService.getStats());
    
    // Load referral data
    if (user) {
      ReferralService.generateReferralCode(user.id || user.email);
    }
    const refStats = ReferralService.getStats();
    setReferralStats(refStats);
    
    setLoading(false);
  }, [user]);

  // Load on mount
  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  // Handle applying referral code
  const handleApplyReferralCode = async () => {
    if (!referralCodeInput.trim()) {
      setReferralMessage({ type: 'error', text: 'Please enter a referral code' });
      return;
    }
    
    setApplyingCode(true);
    setReferralMessage(null);
    
    const result = await ReferralService.applyReferralCode(
      referralCodeInput.trim().toUpperCase(),
      user?.id || user?.email
    );
    
    if (result.success) {
      setReferralMessage({ type: 'success', text: result.message });
      setReferralCodeInput('');
      loadProgressData(); // Refresh data
    } else {
      setReferralMessage({ type: 'error', text: result.error });
    }
    
    setApplyingCode(false);
  };

  // Handle sharing referral code
  const handleShareCode = async () => {
    const result = await ReferralService.shareReferralCode(user?.id || user?.email);
    if (result.success) {
      setReferralMessage({ type: 'success', text: result.message || 'Shared successfully!' });
    }
  };

  // Copy referral code to clipboard
  const handleCopyCode = async () => {
    if (referralStats?.myCode) {
      try {
        await navigator.clipboard.writeText(referralStats.myCode);
        setReferralMessage({ type: 'success', text: 'Code copied to clipboard!' });
        setTimeout(() => setReferralMessage(null), 2000);
      } catch (e) {
        setReferralMessage({ type: 'error', text: 'Could not copy code' });
      }
    }
  };

  if (loading) {
    return (
      <div className="progress-app">
        <div className="progress-loading">
          <div className="progress-spinner"></div>
          <p>Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-app">
      {/* Header */}
      <header className="progress-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Portal
        </button>
        <div className="header-title">
          <h1>🏆 Progress & Rewards</h1>
          <p>Track your streaks, badges, and referrals</p>
        </div>
        <div className="header-actions">
          {user && (
            <span className="user-name">{user.name || user.email}</span>
          )}
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="progress-nav">
        <button 
          className={`nav-tab ${currentView === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentView('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-tab ${currentView === 'badges' ? 'active' : ''}`}
          onClick={() => setCurrentView('badges')}
        >
          🎖️ Badges
        </button>
        <button 
          className={`nav-tab ${currentView === 'referrals' ? 'active' : ''}`}
          onClick={() => setCurrentView('referrals')}
        >
          🤝 Referrals
        </button>
      </nav>

      {/* Main Content */}
      <main className="progress-content">
        {currentView === 'overview' && (
          <OverviewView 
            streakData={streakData}
            badgeStats={badgeStats}
            referralStats={referralStats}
            recentBadges={badges.slice(-3)}
          />
        )}

        {currentView === 'badges' && (
          <BadgesView 
            badges={badges}
            badgeStats={badgeStats}
          />
        )}

        {currentView === 'referrals' && (
          <ReferralsView 
            referralStats={referralStats}
            referralCodeInput={referralCodeInput}
            setReferralCodeInput={setReferralCodeInput}
            referralMessage={referralMessage}
            applyingCode={applyingCode}
            onApplyCode={handleApplyReferralCode}
            onShareCode={handleShareCode}
            onCopyCode={handleCopyCode}
            user={user}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="progress-footer">
        <p>ASR Digital Services • Progress & Rewards</p>
      </footer>
    </div>
  );
}

/**
 * OverviewView - Main progress overview
 */
function OverviewView({ streakData, badgeStats, referralStats, recentBadges }) {
  return (
    <div className="overview-view">
      {/* Streak Section */}
      <section className="streak-section">
        <h2>🔥 Your Streak</h2>
        <div className="streak-card">
          <div className="streak-main">
            <div className="streak-number">
              {streakData?.currentStreak || 0}
            </div>
            <div className="streak-label">
              Week{streakData?.currentStreak !== 1 ? 's' : ''} in a row
            </div>
          </div>
          <div className="streak-details">
            <div className="streak-stat">
              <span className="stat-value">{streakData?.longestStreak || 0}</span>
              <span className="stat-label">Best Streak</span>
            </div>
            <div className="streak-stat">
              <span className="stat-value">{streakData?.totalPlans || 0}</span>
              <span className="stat-label">Total Plans</span>
            </div>
          </div>
          {streakData?.needsPlanThisWeek && (
            <div className="streak-warning">
              ⚠️ Generate a plan this week to keep your streak!
            </div>
          )}
        </div>
      </section>

      {/* Badge Progress */}
      <section className="badges-overview">
        <h2>🎖️ Badge Progress</h2>
        <div className="badge-progress-card">
          <div className="badge-progress-bar">
            <div 
              className="badge-progress-fill"
              style={{ width: `${badgeStats?.percentage || 0}%` }}
            ></div>
          </div>
          <p className="badge-progress-text">
            {badgeStats?.earned || 0} of {badgeStats?.total || 0} badges earned ({badgeStats?.percentage || 0}%)
          </p>
          
          {recentBadges.length > 0 && (
            <div className="recent-badges">
              <h4>Recent Badges</h4>
              <div className="recent-badges-list">
                {recentBadges.map(badge => (
                  <div key={badge.id} className="recent-badge">
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-name">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Referral Overview */}
      <section className="referrals-overview">
        <h2>🤝 Referrals</h2>
        <div className="referral-overview-card">
          <div className="referral-stats">
            <div className="referral-stat">
              <span className="stat-value">{referralStats?.totalReferrals || 0}</span>
              <span className="stat-label">Friends Referred</span>
            </div>
            <div className="referral-stat">
              <span className="stat-value">{referralStats?.unredeemedRewards || 0}</span>
              <span className="stat-label">Rewards to Claim</span>
            </div>
          </div>
          {referralStats?.myCode && (
            <div className="my-code-preview">
              <span className="code-label">Your Code:</span>
              <span className="code-value">{referralStats.myCode}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * BadgesView - All badges display
 */
function BadgesView({ badges, badgeStats }) {
  const categories = BadgeService.getBadgesByCategory();
  
  const categoryLabels = {
    streak: '🔥 Streak Badges',
    plans: '📝 Planning Badges',
    referral: '🤝 Referral Badges',
    engagement: '💡 Engagement Badges',
    special: '✨ Special Badges'
  };
  
  const rarityColors = {
    common: '#9ca3af',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
  };

  return (
    <div className="badges-view">
      <div className="badges-header">
        <h2>Your Badges</h2>
        <div className="badge-count">
          {badgeStats?.earned || 0} / {badgeStats?.total || 0} earned
        </div>
      </div>

      {Object.entries(categories).map(([category, { earned, locked }]) => (
        <section key={category} className="badge-category">
          <h3>{categoryLabels[category] || category}</h3>
          
          <div className="badges-grid">
            {/* Earned badges */}
            {earned.map(badge => (
              <div key={badge.id} className="badge-card earned">
                <div 
                  className="badge-icon-wrapper"
                  style={{ borderColor: rarityColors[badge.rarity] }}
                >
                  <span className="badge-icon">{badge.icon}</span>
                </div>
                <h4 className="badge-name">{badge.name}</h4>
                <p className="badge-description">{badge.description}</p>
                <span 
                  className="badge-rarity"
                  style={{ color: rarityColors[badge.rarity] }}
                >
                  {badge.rarity}
                </span>
                {badge.earnedAt && (
                  <span className="badge-date">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
            
            {/* Locked badges */}
            {locked.map(badge => (
              <div key={badge.id} className="badge-card locked">
                <div className="badge-icon-wrapper locked">
                  <span className="badge-icon">🔒</span>
                </div>
                <h4 className="badge-name">{badge.name}</h4>
                <p className="badge-description">{badge.description}</p>
                <span 
                  className="badge-rarity"
                  style={{ color: rarityColors[badge.rarity] }}
                >
                  {badge.rarity}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * ReferralsView - Referral management
 */
function ReferralsView({ 
  referralStats, 
  referralCodeInput, 
  setReferralCodeInput,
  referralMessage,
  applyingCode,
  onApplyCode,
  onShareCode,
  onCopyCode,
  user 
}) {
  return (
    <div className="referrals-view">
      {/* My Referral Code */}
      <section className="my-referral-code">
        <h2>📤 Share Your Code</h2>
        <div className="code-card">
          <p className="code-instruction">
            Share your referral code with friends. You'll both earn rewards when they sign up!
          </p>
          
          {referralStats?.myCode ? (
            <div className="code-display">
              <span className="the-code">{referralStats.myCode}</span>
              <div className="code-actions">
                <button className="copy-btn" onClick={onCopyCode}>
                  📋 Copy
                </button>
                <button className="share-btn" onClick={onShareCode}>
                  📤 Share
                </button>
              </div>
            </div>
          ) : (
            <p>Loading your referral code...</p>
          )}
          
          <div className="referral-limit-info">
            <span className="limit-icon">ℹ️</span>
            <span>
              {referralStats?.totalReferrals || 0} / {referralStats?.maxReferrals || 20} referrals used
            </span>
          </div>
        </div>
      </section>

      {/* Apply a Code */}
      {!referralStats?.wasReferred && (
        <section className="apply-code">
          <h2>📥 Have a Referral Code?</h2>
          <div className="apply-card">
            <p>Enter a friend's referral code to get 10% off your first plan!</p>
            
            <div className="code-input-group">
              <input
                type="text"
                placeholder="Enter code (e.g., ASRXXXX1234)"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                maxLength={12}
                disabled={applyingCode}
                title="Enter a referral code from a friend. Format: ASR followed by 8 characters. Each code can only be used once and you cannot use your own code."
                aria-label="Referral code input - enter a friend's code to receive a 10% discount"
              />
              <button 
                onClick={onApplyCode}
                disabled={applyingCode || !referralCodeInput.trim()}
                title="Click to apply the referral code. This action cannot be undone - you can only use one referral code per account."
              >
                {applyingCode ? 'Applying...' : 'Apply'}
              </button>
            </div>
            
            <div className="input-help-text">
              <small title="Referral codes are unique 12-character codes that start with 'ASR'. Get one from a friend who already uses the app.">
                💡 Codes are case-insensitive and start with "ASR"
              </small>
            </div>
            
            {referralMessage && (
              <div className={`referral-message ${referralMessage.type}`}>
                {referralMessage.type === 'success' ? '✅' : '❌'} {referralMessage.text}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Already Referred */}
      {referralStats?.wasReferred && (
        <section className="already-referred">
          <div className="referred-card">
            <span className="check-icon">✅</span>
            <h3>You were referred!</h3>
            <p>You used a referral code on {new Date(referralStats.referredBy.date).toLocaleDateString()}</p>
          </div>
        </section>
      )}

      {/* My Referrals List */}
      <section className="my-referrals">
        <h2>👥 People You've Referred</h2>
        
        {referralStats?.referrals?.length > 0 ? (
          <div className="referrals-list">
            {referralStats.referrals.map((referral, index) => (
              <div key={index} className="referral-item">
                <span className="referral-avatar">👤</span>
                <div className="referral-info">
                  <span className="referral-name">{referral.refereeName}</span>
                  <span className="referral-date">
                    Joined {new Date(referral.date).toLocaleDateString()}
                  </span>
                </div>
                {referral.rewardClaimed ? (
                  <span className="reward-claimed">✅ Reward Claimed</span>
                ) : (
                  <span className="reward-pending">🎁 Reward Available</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-referrals">
            <span className="no-referrals-icon">👥</span>
            <p>No referrals yet. Share your code to start earning rewards!</p>
          </div>
        )}
      </section>

      {/* Referral Rules */}
      <section className="referral-rules">
        <h3>📋 Referral Rules</h3>
        <ul>
          <li>You can refer up to {referralStats?.maxReferrals || 20} friends</li>
          <li>Each friend can only use one referral code</li>
          <li>You cannot use your own referral code</li>
          <li>Rewards are credited after your friend signs up</li>
        </ul>
      </section>
    </div>
  );
}
