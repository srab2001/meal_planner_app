import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  // Auto-close splash when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      setFadeOut(true);
      // Wait for fade animation to complete before calling onComplete
      const fadeTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 500);

      return () => clearTimeout(fadeTimer);
    }
  }, [countdown, onComplete]);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 500);
  };

  if (!isVisible) return null;

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
