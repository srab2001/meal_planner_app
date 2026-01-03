/**
 * StepVideo Component
 *
 * Displays video/poster media for meal planning steps.
 * Supports autoplay, looping, and stopOnUserAction behaviors.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import './StepVideo.css';

const StepVideo = ({
  videoUrl,
  posterUrl,
  runRule = 'loop', // 'loop' | 'stopOnUserAction'
  className = '',
  onEnded = null,
  onUserAction = null,
  muted = true,
  showControls = false
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [error, setError] = useState(null);

  // Handle video end event
  const handleEnded = useCallback(() => {
    if (runRule === 'loop') {
      // Restart video for looping
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    } else {
      // stopOnUserAction - pause at end
      setHasEnded(true);
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    }
  }, [runRule, onEnded]);

  // Handle user interaction (click/tap)
  const handleUserAction = useCallback(() => {
    if (runRule === 'stopOnUserAction' && isPlaying) {
      // Stop video on user action
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      if (onUserAction) {
        onUserAction();
      }
    }
  }, [runRule, isPlaying, onUserAction]);

  // Auto-play video when component mounts
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      const playVideo = async () => {
        try {
          await videoRef.current.play();
          setIsPlaying(true);
          setError(null);
        } catch (err) {
          console.warn('[StepVideo] Autoplay failed:', err.message);
          // Autoplay may be blocked - that's okay
          setError('Click to play video');
        }
      };

      playVideo();
    }
  }, [videoUrl]);

  // Handle video error
  const handleError = (e) => {
    console.error('[StepVideo] Video error:', e);
    setError('Video failed to load');
  };

  // Handle play state changes
  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  // Handle click to play if autoplay was blocked
  const handleClick = () => {
    if (!isPlaying && videoRef.current && !hasEnded) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setError(null);
        })
        .catch(() => {});
    }
    handleUserAction();
  };

  // If no video, show poster only
  if (!videoUrl && posterUrl) {
    return (
      <div className={`step-video-container poster-only ${className}`}>
        <img
          src={posterUrl}
          alt="Step illustration"
          className="step-video-poster"
        />
      </div>
    );
  }

  // If no media at all, return null
  if (!videoUrl && !posterUrl) {
    return null;
  }

  return (
    <div
      className={`step-video-container ${className}`}
      onClick={handleClick}
    >
      <video
        ref={videoRef}
        className="step-video"
        src={videoUrl}
        poster={posterUrl}
        muted={muted}
        playsInline
        controls={showControls}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
      />

      {/* Play overlay for blocked autoplay */}
      {error && !isPlaying && (
        <div className="step-video-overlay">
          <div className="step-video-play-button">
            <span>&#9658;</span>
          </div>
          <p className="step-video-error">{error}</p>
        </div>
      )}

      {/* Ended overlay for stopOnUserAction */}
      {hasEnded && runRule === 'stopOnUserAction' && (
        <div className="step-video-overlay ended">
          <div className="step-video-replay-button" onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().then(() => {
                setHasEnded(false);
                setIsPlaying(true);
              }).catch(() => {});
            }
          }}>
            <span>&#8634;</span>
            <p>Replay</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepVideo;
