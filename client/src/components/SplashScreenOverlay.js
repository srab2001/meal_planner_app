import React, { useState, useEffect } from 'react';
import './SplashScreenOverlay.css';

export default function SplashScreenOverlay() {
  const [countdown, setCountdown] = useState(15);
  const [fadeOut, setFadeOut] = useState(false);

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
        const overlay = document.getElementById('splash-overlay');
        if (overlay) overlay.remove();
      }, 500);
    }
  }, [countdown]);

  return (
    <div id="splash-overlay" className={`splash-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <video 
        className="splash-video" 
        autoPlay 
        muted 
        loop 
        playsInline
      >
        <source src="/videos/splash-bg.mp4" type="video/mp4" />
        <source src="/videos/splash-bg.webm" type="video/webm" />
      </video>
      <div className="splash-bg"></div>
      <div className="splash-inner">
        <div className="construction-graphic">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Cone */}
            <polygon points="100,20 80,80 120,80" fill="#FF6B6B" />
            <polygon points="80,80 120,80 115,85 85,85" fill="#E63946" />
            {/* Tape */}
            <rect x="85" y="30" width="30" height="60" fill="#FFD93D" opacity="0.8" />
            <line x1="85" y1="35" x2="115" y2="35" stroke="#FFA500" strokeWidth="2" />
            <line x1="85" y1="45" x2="115" y2="45" stroke="#FFA500" strokeWidth="2" />
            <line x1="85" y1="55" x2="115" y2="55" stroke="#FFA500" strokeWidth="2" />
            <line x1="85" y1="65" x2="115" y2="65" stroke="#FFA500" strokeWidth="2" />
            {/* Wrench */}
            <rect x="40" y="100" width="50" height="12" rx="6" fill="#6C757D" transform="rotate(-30 65 106)" />
            <circle cx="50" cy="100" r="8" fill="#495057" />
            {/* Hammer */}
            <rect x="120" y="95" width="8" height="40" fill="#8B4513" />
            <rect x="110" y="130" width="28" height="16" rx="2" fill="#A0522D" />
          </svg>
        </div>
        <h1>ASR Digital Services</h1>
        <p className="under-construction">🚧 Under Construction 🚧</p>
        <p className="subtitle">Meal Planner & Price Comparison</p>
        <div className="splash-timer">
          <span>Launching in {countdown}s</span>
          <button onClick={() => { setFadeOut(true); setTimeout(() => document.getElementById('splash-overlay').remove(), 500); }}>Skip</button>
        </div>
      </div>
    </div>
  );
}
