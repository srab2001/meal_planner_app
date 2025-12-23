import React, { useState } from 'react';
import '../styles/QuestionPreview.css';

/**
 * QuestionPreview Component
 * 
 * Shows how the question will appear to users in the AI Coach interview.
 * Features:
 * - Interactive preview
 * - Mock answer input
 * - Visual styling matching production
 */

const QuestionPreview = ({ question, onClose }) => {
  const [mockAnswer, setMockAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedRange, setSelectedRange] = useState(5);

  // Get question type label
  const getQuestionTypeLabel = (type) => {
    const labels = {
      'text': '📝 Text Input',
      'multiple_choice': '🔘 Multiple Choice',
      'yes_no': '✅ Yes/No',
      'range': '📊 Range (1-10)'
    };
    return labels[type] || type;
  };

  // Render the preview based on question type
  const renderQuestionInput = () => {
    switch (question.question_type) {
      case 'text':
        return (
          <div className="preview-input">
            <textarea
              value={mockAnswer}
              onChange={(e) => setMockAnswer(e.target.value)}
              placeholder="User would type their answer here..."
              rows="3"
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="preview-options">
            {question.options && question.options.map((option, idx) => (
              <label key={idx} className="option-label">
                <input
                  type="radio"
                  name="option"
                  value={option}
                  checked={selectedOption === option}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="preview-yes-no">
            <label className="option-label">
              <input
                type="radio"
                name="yes-no"
                value="yes"
                checked={selectedOption === 'yes'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <span className="option-text">✅ Yes</span>
            </label>
            <label className="option-label">
              <input
                type="radio"
                name="yes-no"
                value="no"
                checked={selectedOption === 'no'}
                onChange={(e) => setSelectedOption(e.target.value)}
              />
              <span className="option-text">❌ No</span>
            </label>
          </div>
        );

      case 'range':
        return (
          <div className="preview-range">
            <input
              type="range"
              min="1"
              max="10"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="range-slider"
            />
            <div className="range-labels">
              <span className="range-label">1 (Low)</span>
              <span className="range-value">{selectedRange}</span>
              <span className="range-label">10 (High)</span>
            </div>
          </div>
        );

      default:
        return <p>Unknown question type</p>;
    }
  };

  return (
    <div className="question-preview">
      <div className="preview-header">
        <h2>Question Preview</h2>
        <p className="subtitle">This is how users will see this question in the AI Coach interview</p>
      </div>

      {/* Question Information */}
      <div className="preview-info">
        <div className="info-item">
          <label>Question Type:</label>
          <span className="badge">{getQuestionTypeLabel(question.question_type)}</span>
        </div>
        <div className="info-item">
          <label>Status:</label>
          <span className={`badge ${question.is_active ? 'active' : 'inactive'}`}>
            {question.is_active ? '🟢 Active' : '🔴 Inactive'}
          </span>
        </div>
        {question.options && question.options.length > 0 && (
          <div className="info-item">
            <label>Options:</label>
            <span className="badge">{question.options.length} options</span>
          </div>
        )}
      </div>

      {/* Question Preview */}
      <div className="preview-container">
        {/* Simulated Chat Interface */}
        <div className="chat-bubble assistant">
          <p className="question-text">{question.question_text}</p>
        </div>

        {/* User Response Area */}
        <div className="user-response">
          <div className="response-label">Your answer:</div>
          {renderQuestionInput()}
        </div>
      </div>

      {/* Details Section */}
      <div className="preview-details">
        <h3>Question Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <label>Question Text:</label>
            <p>{question.question_text}</p>
          </div>
          <div className="detail-item">
            <label>Type:</label>
            <p>{getQuestionTypeLabel(question.question_type)}</p>
          </div>
          {question.options && question.options.length > 0 && (
            <div className="detail-item">
              <label>Available Options:</label>
              <ul className="options-list">
                {question.options.map((option, idx) => (
                  <li key={idx}>{option}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-item">
            <label>Status:</label>
            <p>{question.is_active ? 'Active - Users will see this question' : 'Inactive - This question is hidden'}</p>
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div className="preview-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Back to Questions
        </button>
      </div>
    </div>
  );
};

export default QuestionPreview;
