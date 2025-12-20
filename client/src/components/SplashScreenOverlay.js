import React, { useState, useEffect } from 'react';
import './SplashScreenOverlay.css';

/**
 * SplashScreenOverlay - Branded splash shown on first load only
 * 
 * Features:
 * - Centered ASR Digital Services logo
 * - "Brought to you by ASR Digital Services" text
 * - 10-second duration before routing to App Switchboard
 * - Reserved container for future promotional video
 * - First-load only (uses sessionStorage)
 */
export default function SplashScreenOverlay({ onComplete }) {
  const [countdown, setCountdown] = useState(10);
  const [fadeOut, setFadeOut] = useState(false);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  // Check if user has already seen splash this session
  useEffect(() => {
    const seen = sessionStorage.getItem('asr_splash_shown');
    if (seen === 'true') {
      console.log('🎬 Splash already seen this session, skipping');
      setHasSeenSplash(true);
      // Use setTimeout to ensure parent state is ready before calling onComplete
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 0);
    }
  }, [onComplete]);

  // Countdown timer
  useEffect(() => {
    if (hasSeenSplash) return;

    const interval = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [hasSeenSplash]);

  // Handle completion after countdown or skip
  useEffect(() => {
    if (hasSeenSplash) return;

    if (countdown <= 0) {
      handleComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, hasSeenSplash]);

  const handleComplete = () => {
    setFadeOut(true);
    sessionStorage.setItem('asr_splash_shown', 'true');
    
    // Let React handle the DOM - just call onComplete after fade animation
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Don't render if already seen this session
  if (hasSeenSplash) {
    return null;
  }

  return (
    <div id="splash-overlay" className={`splash-overlay ${fadeOut ? 'fade-out' : ''}`}>
      {/* Background gradient */}
      <div className="splash-bg"></div>
      
      <div className="splash-inner">
        {/* ASR Digital Services Logo */}
        <div className="splash-logo">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Outer circle */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="3"/>
            {/* Inner glow effect */}
            <circle cx="100" cy="100" r="85" fill="rgba(255,255,255,0.1)"/>
            {/* ASR Text */}
            <text 
              x="100" 
              y="115" 
              fontSize="52" 
              fontWeight="bold" 
              textAnchor="middle" 
              fill="white" 
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            >
              ASR
            </text>
          </svg>
        </div>

        {/* Company Name */}
        <h1 className="splash-title">ASR Digital Services</h1>
        
        {/* Tagline */}
        <p className="splash-tagline">Brought to you by ASR Digital Services</p>

        {/* ============================================
            TODO: FUTURE VIDEO CONTAINER
            ============================================
            Replace this placeholder with a 10-second promotional video.
            Video should:
            - Auto-play on load (muted initially)
            - Be responsive and centered
            - Have fallback for unsupported browsers
            
            Example implementation:
            <video 
              className="splash-promo-video" 
              autoPlay 
              muted 
              playsInline
              onEnded={handleComplete}
            >
              <source src="/videos/asr-promo.mp4" type="video/mp4" />
              <source src="/videos/asr-promo.webm" type="video/webm" />
            </video>
            ============================================ */}
        <div className="splash-video-placeholder">
          <div className="video-placeholder-content">
            <span className="video-icon">🎬</span>
            <p>Video Coming Soon</p>
          </div>
        </div>
        {/* END TODO: FUTURE VIDEO CONTAINER */}

        {/* Timer and Skip Button */}
        <div className="splash-timer">
          <div className="timer-progress">
            <div 
              className="timer-bar" 
              style={{ width: `${(10 - countdown) * 10}%` }}
            ></div>
          </div>
          <span className="timer-text">Launching in {countdown}s</span>
          <button className="skip-button" onClick={handleSkip}>
            Skip →
          </button>
        </div>
      </div>
    </div>
  );
}
