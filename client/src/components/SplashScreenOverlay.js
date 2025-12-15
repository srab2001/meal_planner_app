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
        <div className="splash-logo">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="2"/>
            <text x="100" y="115" fontSize="60" fontWeight="bold" textAnchor="middle" fill="white">ASR</text>
          </svg>
        </div>
        <h1>ASR Digital Services</h1>
        <p>Meal Planner & Price Comparison</p>
        <div className="splash-timer">
          <span>Launching in {countdown}s</span>
          <button onClick={() => { setFadeOut(true); setTimeout(() => document.getElementById('splash-overlay').remove(), 500); }}>Skip</button>
        </div>
      </div>
    </div>
  );
}
