import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [countdown, setCountdown] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

  // This will ALWAYS fire if component renders
  useEffect(() => {
    window.splashScreenMounted = true;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setFadeOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
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
      <div className="splash-background"></div>
      <div className="splash-content">
        <div className="splash-logo-section">
          <div className="splash-logo">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="2"/>
              <text x="100" y="115" fontSize="60" fontWeight="bold" textAnchor="middle" fill="white" fontFamily="system-ui">ASR</text>
            </svg>
          </div>
          <h1 className="splash-title">ASR Digital Services</h1>
          <p className="splash-subtitle">Meal Planner & Price Comparison</p>
        </div>
        <div className="splash-video-section">
          <div className="splash-video-placeholder">
            <div className="play-icon">▶</div>
            <p>Powered by Sora AI</p>
          </div>
        </div>
        <div className="splash-footer">
          <div className="splash-timer">
            <div className="timer-dot"></div>
            <span>Launching in <span className="countdown-number">{countdown}</span>s</span>
          </div>
          <button className="splash-skip-btn" onClick={handleSkip}>Skip</button>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
