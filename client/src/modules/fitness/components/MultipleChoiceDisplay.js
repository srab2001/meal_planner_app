import React, { useState } from 'react';

/**
 * MultipleChoiceDisplay - Renders a multiple choice question with radio buttons
 *
 * Props:
 * - question: Object with question_text, id, options array (can be strings or {value, label} objects)
 * - onAnswer: Callback function when answer is selected
 * - disabled: Boolean to disable input while loading
 */
export default function MultipleChoiceDisplay({ question, onAnswer, disabled }) {
  const [selectedValue, setSelectedValue] = useState(null);

  const handleSelect = (option) => {
    // Support both string options and {value, label} objects
    const value = typeof option === 'object' ? option.value : option;
    setSelectedValue(value);
    onAnswer(value);
  };

  // Get display label for an option
  const getLabel = (option) => {
    if (typeof option === 'object') {
      return option.label || option.value;
    }
    return option;
  };

  // Get value for an option
  const getValue = (option) => {
    if (typeof option === 'object') {
      return option.value;
    }
    return option;
  };

  return (
    <div className="multiple-choice-question">
      <p className="question-text">{question.question_text}</p>
      {question.help_text && <p className="question-help">{question.help_text}</p>}
      <div className="options-container">
        {question.options && question.options.length > 0 ? (
          question.options.map((option, idx) => (
            <label key={idx} className="option-label">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={getValue(option)}
                checked={selectedValue === getValue(option)}
                onChange={() => handleSelect(option)}
                disabled={disabled}
                className="option-radio"
              />
              <span className="option-text">{getLabel(option)}</span>
            </label>
          ))
        ) : (
          <p className="no-options">No options available</p>
        )}
      </div>
    </div>
  );
}
