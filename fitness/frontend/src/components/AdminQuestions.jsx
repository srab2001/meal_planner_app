import React, { useState, useEffect } from 'react';
import { API_BASE, ENDPOINTS } from '../config/api';
import './AdminQuestions.module.css';

/**
 * Admin Interview Questions Management Component
 * Allows admins to view, create, edit, delete interview questions
 * for the AI Workout Coach
 */
function AdminQuestions({ token }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'text',
    order_position: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }

      const data = await response.json();
      setQuestions(Array.isArray(data) ? data : data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}/${editingId}`
        : `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save question: ${response.status}`);
      }

      await fetchQuestions();
      setShowForm(false);
      setEditingId(null);
      setFormData({
        question_text: '',
        question_type: 'text',
        order_position: 0,
        is_active: true,
      });
    } catch (err) {
      console.error('Error saving question:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const handleEdit = (question) => {
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      order_position: question.order_position,
      is_active: question.is_active,
    });
    setEditingId(question.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete question: ${response.status}`);
      }

      await fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      question_text: '',
      question_type: 'text',
      order_position: 0,
      is_active: true,
    });
  };

  if (loading) {
    return <div className="admin-questions loading">Loading questions...</div>;
  }

  if (error) {
    return (
      <div className="admin-questions error">
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={fetchQuestions} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-questions">
      <div className="header">
        <h2>⚙️ Interview Questions Management</h2>
        <button onClick={() => setShowForm(true)} className="add-btn">
          + Add Question
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Edit' : 'Add'} Question</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="question_text">Question Text *</label>
              <textarea
                id="question_text"
                name="question_text"
                value={formData.question_text}
                onChange={handleInputChange}
                required
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="question_type">Question Type *</label>
                <select
                  id="question_type"
                  name="question_type"
                  value={formData.question_type}
                  onChange={handleInputChange}
                >
                  <option value="text">Text</option>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="order_position">Order Position</label>
                <input
                  type="number"
                  id="order_position"
                  name="order_position"
                  value={formData.order_position}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <label htmlFor="is_active">Active</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingId ? 'Update' : 'Create'} Question
              </button>
              <button type="button" onClick={handleCancel} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="questions-list">
        {questions.length === 0 ? (
          <p className="empty-message">No questions created yet.</p>
        ) : (
          questions.map(question => (
            <div key={question.id} className="question-card">
              <div className="question-header">
                <h4>{question.question_text}</h4>
                <span className={`status ${question.is_active ? 'active' : 'inactive'}`}>
                  {question.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
              <div className="question-meta">
                <span className="type-badge">{question.question_type}</span>
                <span className="order">Order: {question.order_position}</span>
              </div>
              <div className="question-actions">
                <button onClick={() => handleEdit(question)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(question.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminQuestions;
