import React, { useState } from 'react';

/**
 * RangeDisplay - Renders a range slider question (1-10)
 * 
 * Props:
 * - question: Object with question_text, id
 * - onAnswer: Callback function when answer is submitted
 * - disabled: Boolean to disable input while loading
 */
export default function RangeDisplay({ question, onAnswer, disabled }) {
  const [value, setValue] = useState(5);

  const handleSubmit = () => {
    onAnswer(value);
  };

  return (
    <div className="range-question">
      <p className="question-text">{question.question_text}</p>
      <div className="range-container">
        <div className="range-labels">
          <span className="range-min">Low</span>
          <span className="range-max">High</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value))}
          disabled={disabled}
          className="range-slider"
        />
        <div className="range-value">
          <span className="current-value">{value}</span>
          <span className="range-scale">/10</span>
        </div>
      </div>
      <div className="question-actions">
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="submit-btn"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
