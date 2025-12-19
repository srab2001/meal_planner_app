/**
 * FeedbackModal Component
 * 
 * Modal for collecting user feedback (ratings, NPS, comments).
 * Uses ASR theme colors for styling.
 */

import React, { useState } from 'react';
import { useFeedback } from '../hooks';
import './FeedbackModal.css';

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  type = 'rating', // 'rating', 'nps', 'general'
  title = null,
  context = {} 
}) => {
  const { submitRating, submitNPS, submitGeneral, ratingScale, dismissPrompt } = useFeedback();
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedNPS, setSelectedNPS] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitRating = () => {
    if (selectedRating) {
      submitRating(selectedRating, comment, context);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    }
  };

  const handleSubmitNPS = () => {
    if (selectedNPS !== null) {
      submitNPS(selectedNPS, comment, context);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    }
  };

  const handleSubmitGeneral = () => {
    if (comment.trim()) {
      submitGeneral(comment, 'general', context);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    }
  };

  const handleDismiss = (days) => {
    dismissPrompt(days);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedRating(null);
    setSelectedNPS(null);
    setComment('');
    setSubmitted(false);
  };

  const renderRatingForm = () => (
    <>
      <h3 className="feedback-modal-title">
        {title || 'How would you rate your experience?'}
      </h3>
      
      <div className="feedback-modal-rating-options">
        {ratingScale.map((option) => (
          <button
            key={option.value}
            className={`feedback-modal-rating-option ${selectedRating === option.value ? 'selected' : ''}`}
            style={{ 
              borderColor: selectedRating === option.value ? option.color : 'transparent',
              backgroundColor: selectedRating === option.value ? `${option.color}20` : 'transparent'
            }}
            onClick={() => setSelectedRating(option.value)}
          >
            <span className="feedback-modal-rating-emoji">{option.emoji}</span>
            <span className="feedback-modal-rating-label">{option.label}</span>
          </button>
        ))}
      </div>
      
      <div className="feedback-modal-comment">
        <textarea
          placeholder="Tell us more (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="feedback-modal-actions">
        <button 
          className="feedback-modal-btn-secondary"
          onClick={() => handleDismiss(7)}
        >
          Ask me later
        </button>
        <button 
          className="feedback-modal-btn-primary"
          onClick={handleSubmitRating}
          disabled={!selectedRating}
        >
          Submit
        </button>
      </div>
    </>
  );

  const renderNPSForm = () => (
    <>
      <h3 className="feedback-modal-title">
        {title || 'How likely are you to recommend us?'}
      </h3>
      <p className="feedback-modal-subtitle">
        On a scale of 0-10
      </p>
      
      <div className="feedback-modal-nps-options">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
          let scoreColor = 'var(--asr-red-500)';
          if (score >= 7 && score <= 8) scoreColor = 'var(--asr-orange-500)';
          if (score >= 9) scoreColor = 'var(--asr-purple-600)';
          
          return (
            <button
              key={score}
              className={`feedback-modal-nps-option ${selectedNPS === score ? 'selected' : ''}`}
              style={{
                borderColor: selectedNPS === score ? scoreColor : 'transparent',
                backgroundColor: selectedNPS === score ? scoreColor : 'transparent',
                color: selectedNPS === score ? 'white' : 'var(--asr-gray-400)'
              }}
              onClick={() => setSelectedNPS(score)}
            >
              {score}
            </button>
          );
        })}
      </div>
      
      <div className="feedback-modal-nps-labels">
        <span>Not likely</span>
        <span>Very likely</span>
      </div>
      
      <div className="feedback-modal-comment">
        <textarea
          placeholder="What's the main reason for your score? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="feedback-modal-actions">
        <button 
          className="feedback-modal-btn-secondary"
          onClick={() => handleDismiss(30)}
        >
          Not now
        </button>
        <button 
          className="feedback-modal-btn-primary"
          onClick={handleSubmitNPS}
          disabled={selectedNPS === null}
        >
          Submit
        </button>
      </div>
    </>
  );

  const renderGeneralForm = () => (
    <>
      <h3 className="feedback-modal-title">
        {title || 'Share your feedback'}
      </h3>
      
      <div className="feedback-modal-comment feedback-modal-comment-full">
        <textarea
          placeholder="What would you like to tell us?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
        />
      </div>
      
      <div className="feedback-modal-actions">
        <button 
          className="feedback-modal-btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button 
          className="feedback-modal-btn-primary"
          onClick={handleSubmitGeneral}
          disabled={!comment.trim()}
        >
          Send Feedback
        </button>
      </div>
    </>
  );

  const renderThankYou = () => (
    <div className="feedback-modal-thankyou">
      <div className="feedback-modal-thankyou-icon">🙏</div>
      <h3 className="feedback-modal-thankyou-title">Thank you!</h3>
      <p className="feedback-modal-thankyou-message">
        Your feedback helps us improve.
      </p>
    </div>
  );

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-modal-close" onClick={onClose}>×</button>
        
        {submitted ? (
          renderThankYou()
        ) : (
          <>
            {type === 'rating' && renderRatingForm()}
            {type === 'nps' && renderNPSForm()}
            {type === 'general' && renderGeneralForm()}
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
