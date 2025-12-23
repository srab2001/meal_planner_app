import React, { useState } from 'react';

/**
 * MultipleChoiceDisplay - Renders a multiple choice question with radio buttons
 * 
 * Props:
 * - question: Object with question_text, id, options array
 * - onAnswer: Callback function when answer is selected
 * - disabled: Boolean to disable input while loading
 */
export default function MultipleChoiceDisplay({ question, onAnswer, disabled }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onAnswer(option);
  };

  return (
    <div className="multiple-choice-question">
      <p className="question-text">{question.question_text}</p>
      <div className="options-container">
        {question.options && question.options.length > 0 ? (
          question.options.map((option, idx) => (
            <label key={idx} className="option-label">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={selectedOption === option}
                onChange={() => handleSelect(option)}
                disabled={disabled}
                className="option-radio"
              />
              <span className="option-text">{option}</span>
            </label>
          ))
        ) : (
          <p className="no-options">No options available</p>
        )}
      </div>
    </div>
  );
}
