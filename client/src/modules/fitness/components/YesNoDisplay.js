import React from 'react';

/**
 * YesNoDisplay - Renders a yes/no question with two buttons
 * 
 * Props:
 * - question: Object with question_text, id
 * - onAnswer: Callback function when answer is selected
 * - disabled: Boolean to disable input while loading
 */
export default function YesNoDisplay({ question, onAnswer, disabled }) {
  return (
    <div className="yes-no-question">
      <p className="question-text">{question.question_text}</p>
      <div className="yes-no-buttons">
        <button
          onClick={() => onAnswer('Yes')}
          disabled={disabled}
          className="yes-btn"
        >
          ✅ Yes
        </button>
        <button
          onClick={() => onAnswer('No')}
          disabled={disabled}
          className="no-btn"
        >
          ❌ No
        </button>
      </div>
    </div>
  );
}
