import React, { useState } from 'react';

/**
 * TextQuestionDisplay - Renders a text input question
 * 
 * Props:
 * - question: Object with question_text, id
 * - onAnswer: Callback function when answer is submitted
 * - disabled: Boolean to disable input while loading
 */
export default function TextQuestionDisplay({ question, onAnswer, disabled }) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer.trim());
      setAnswer('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="text-question">
      <p className="question-text">{question.question_text}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your answer here... (Ctrl+Enter or Cmd+Enter to submit)"
        disabled={disabled}
        rows="3"
        className="text-input"
      />
      <div className="question-actions">
        <button
          onClick={handleSubmit}
          disabled={disabled || !answer.trim()}
          className="submit-btn"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
