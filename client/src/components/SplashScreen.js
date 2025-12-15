import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [countdown, setCountdown] = useState(15);

  // Start countdown immediately on mount
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        const newVal = prev - 1;
        if (newVal <= 0) {
          clearInterval(countdownTimer);
          return 0;
        }
        return newVal;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  // Auto-hide when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      setFadeOut(true);
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdown, onComplete]);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 500);
  };

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* Background with gradient */}
      <div className="splash-background"></div>

      {/* Content Container */}
      <div className="splash-content">
        {/* Logo Section */}
        <div className="splash-logo-section">
          <div className="splash-logo">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              {/* ASR Circle Background */}
              <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="2"/>
              
              {/* ASR Initials */}
              <text 
                x="100" 
                y="115" 
                fontSize="60" 
                fontWeight="bold" 
                textAnchor="middle" 
                fill="white"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                ASR
              </text>
            </svg>
          </div>
          <h1 className="splash-title">ASR Digital Services</h1>
          <p className="splash-subtitle">Meal Planner & Price Comparison</p>
        </div>

        {/* Video/Media Section */}
        <div className="splash-video-section">
          <div className="splash-video-placeholder">
            <div className="play-icon">▶</div>
            <p>Powered by Sora AI</p>
          </div>
        </div>

        {/* Bottom Section with Timer */}
        <div className="splash-footer">
          <div className="splash-timer">
            <div className="timer-dot"></div>
            <span>Launching in <span id="countdown" className="countdown-number">{countdown}</span>s</span>
          </div>
          <button 
            className="splash-skip-btn"
            onClick={handleSkip}
            aria-label="Skip splash screen"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
