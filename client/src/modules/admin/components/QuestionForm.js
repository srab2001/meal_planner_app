import React, { useState, useEffect } from 'react';
import '../styles/QuestionForm.css';

/**
 * QuestionForm Component
 * 
 * Form for creating and editing interview questions.
 * Features:
 * - Dynamic form based on question type
 * - Option management (add, edit, remove)
 * - Validation
 * - Preview of options
 */

const QuestionForm = ({ question, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'text',
    options: [],
    is_active: true
  });

  const [newOption, setNewOption] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with existing question data
  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text || '',
        question_type: question.question_type || 'text',
        options: question.options || [],
        is_active: question.is_active !== false
      });
    }
  }, [question]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle question type change
  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...prev,
      question_type: newType,
      options: newType === 'text' ? [] : prev.options // Clear options for text type
    }));
  };

  // Add option
  const handleAddOption = () => {
    if (!newOption.trim()) {
      setErrors(prev => ({ ...prev, newOption: 'Option cannot be empty' }));
      return;
    }

    if (formData.options.includes(newOption.trim())) {
      setErrors(prev => ({ ...prev, newOption: 'This option already exists' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption.trim()]
    }));
    setNewOption('');
    setErrors(prev => ({ ...prev, newOption: null }));
  };

  // Remove option
  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.question_text.trim()) {
      newErrors.question_text = 'Question text is required';
    }

    if (formData.question_text.length < 5) {
      newErrors.question_text = 'Question must be at least 5 characters';
    }

    if (formData.question_text.length > 500) {
      newErrors.question_text = 'Question must not exceed 500 characters';
    }

    // Validate options for non-text types
    if (formData.question_type !== 'text') {
      if (formData.question_type === 'yes_no') {
        // Yes/No doesn't need options
      } else if (formData.options.length < 2) {
        newErrors.options = 'At least 2 options are required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      onSubmit(formData);
    } catch (error) {
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setSubmitting(false);
    }
  };

  // Render option input based on type
  const renderOptionsSection = () => {
    if (formData.question_type === 'text') {
      return null; // Text questions don't have options
    }

    if (formData.question_type === 'yes_no') {
      return (
        <div className="options-preview">
          <h4>Options (predefined for Yes/No)</h4>
          <ul className="options-list">
            <li>✅ Yes</li>
            <li>❌ No</li>
          </ul>
        </div>
      );
    }

    if (formData.question_type === 'range') {
      return (
        <div className="options-preview">
          <h4>Options (predefined for Range)</h4>
          <p className="info-text">Users will see a slider from 1-10</p>
        </div>
      );
    }

    // Multiple choice options
    return (
      <div className="form-group">
        <label htmlFor="options">Options</label>
        <div className="option-input-group">
          <input
            type="text"
            value={newOption}
            onChange={(e) => {
              setNewOption(e.target.value);
              if (errors.newOption) {
                setErrors(prev => ({ ...prev, newOption: null }));
              }
            }}
            placeholder="Enter option and press Add"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddOption();
              }
            }}
            className={errors.newOption ? 'error' : ''}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddOption}
          >
            Add Option
          </button>
        </div>
        {errors.newOption && <span className="error-text">{errors.newOption}</span>}

        {formData.options.length > 0 && (
          <div className="options-list-group">
            <h5>Current Options ({formData.options.length})</h5>
            <ul className="options-list">
              {formData.options.map((option, index) => (
                <li key={index} className="option-item">
                  <span className="option-text">{option}</span>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleRemoveOption(index)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.options && <span className="error-text">{errors.options}</span>}
      </div>
    );
  };

  return (
    <div className="question-form">
      <h2>{question ? 'Edit Question' : 'Create New Question'}</h2>

      <form onSubmit={handleSubmit}>
        {/* Question Text */}
        <div className="form-group">
          <label htmlFor="question_text">Question Text *</label>
          <textarea
            id="question_text"
            name="question_text"
            value={formData.question_text}
            onChange={handleInputChange}
            placeholder="Enter your question..."
            rows="3"
            className={errors.question_text ? 'error' : ''}
          />
          <div className="char-count">
            {formData.question_text.length} / 500
          </div>
          {errors.question_text && (
            <span className="error-text">{errors.question_text}</span>
          )}
        </div>

        {/* Question Type */}
        <div className="form-group">
          <label htmlFor="question_type">Question Type *</label>
          <select
            id="question_type"
            name="question_type"
            value={formData.question_type}
            onChange={handleTypeChange}
          >
            <option value="text">📝 Text Input</option>
            <option value="multiple_choice">🔘 Multiple Choice</option>
            <option value="yes_no">✅ Yes/No</option>
            <option value="range">📊 Range (1-10)</option>
          </select>
          <p className="info-text">
            {formData.question_type === 'text' && 'Users will provide a free-form text answer'}
            {formData.question_type === 'multiple_choice' && 'Users will select from the options you provide'}
            {formData.question_type === 'yes_no' && 'Users will answer with Yes or No'}
            {formData.question_type === 'range' && 'Users will select a value from 1-10'}
          </p>
        </div>

        {/* Options Section */}
        {renderOptionsSection()}

        {/* Active Status */}
        <div className="form-group checkbox">
          <label htmlFor="is_active">
            <input
              id="is_active"
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            Active (shown to users)
          </label>
        </div>

        {/* Submit Errors */}
        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (question ? 'Update Question' : 'Create Question')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;
