import React from 'react';
import '../styles/QuestionList.css';

/**
 * QuestionList Component
 * 
 * Displays all questions in a draggable list format.
 * Features:
 * - Drag-drop reordering
 * - Edit and delete actions
 * - Toggle active/inactive status
 * - Preview functionality
 * - Question type badges
 */

const QuestionList = ({
  questions,
  draggedQuestion,
  reordering,
  onReorderStart,
  onReorderDrop,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview
}) => {
  // Get question type label
  const getQuestionTypeLabel = (type) => {
    const labels = {
      'text': '📝 Text Input',
      'multiple_choice': '🔘 Multiple Choice',
      'yes_no': '✅ Yes/No',
      'range': '📊 Range'
    };
    return labels[type] || type;
  };

  return (
    <div className="question-list">
      {questions.map((question, index) => (
        <div
          key={question.id}
          className={`question-item ${!question.is_active ? 'inactive' : ''} ${
            draggedQuestion?.id === question.id ? 'dragging' : ''
          }`}
          draggable={true}
          onDragStart={() => onReorderStart(question)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => !reordering && onReorderDrop(question)}
        >
          {/* Drag Handle */}
          <div className="drag-handle" title="Drag to reorder">
            ⋮⋮
          </div>

          {/* Question Number */}
          <div className="question-number">{index + 1}</div>

          {/* Question Content */}
          <div className="question-content">
            <h3 className="question-text">{question.question_text}</h3>
            <div className="question-meta">
              <span className="question-type">{getQuestionTypeLabel(question.question_type)}</span>
              {question.options && question.options.length > 0 && (
                <span className="option-count">{question.options.length} options</span>
              )}
              <span className={`status ${question.is_active ? 'active' : 'inactive'}`}>
                {question.is_active ? '🟢 Active' : '🔴 Inactive'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="question-actions">
            <button
              className="action-btn preview-btn"
              onClick={() => onPreview(question)}
              title="Preview question"
            >
              👁️
            </button>
            <button
              className="action-btn status-btn"
              onClick={() => onToggleActive(question.id, question.is_active)}
              title={question.is_active ? 'Deactivate question' : 'Activate question'}
            >
              {question.is_active ? '🔓' : '🔒'}
            </button>
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(question)}
              title="Edit question"
            >
              ✏️
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(question.id)}
              title="Delete question"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
