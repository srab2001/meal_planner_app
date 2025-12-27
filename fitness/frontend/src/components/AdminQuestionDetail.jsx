import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './AdminQuestionDetail.css';

/**
 * Admin Question Detail Component
 *
 * Create or update one question record with:
 * - Question Text
 * - Plan Type (IEP | 504 | BIP)
 * - Status (Active | Inactive)
 * - Order
 * - Help Text (shown to user)
 * - COMAR Tag (optional)
 */
function AdminQuestionDetail({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    question_text: '',
    plan_type: 'IEP',
    is_active: true,
    order_position: 1,
    help_text: '',
    comar_tag: '',
    question_type: 'text'
  });
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      fetchQuestion();
    }
  }, [id, token]);

  const fetchQuestion = async () => {
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
        throw new Error('Failed to fetch question');
      }

      const data = await response.json();
      const questions = data.questions || [];
      const question = questions.find(q => q.id === parseInt(id));

      if (question) {
        setFormData({
          question_text: question.question_text || '',
          plan_type: question.plan_type || 'IEP',
          is_active: question.is_active !== false,
          order_position: question.order_position || 1,
          help_text: question.help_text || '',
          comar_tag: question.comar_tag || '',
          question_type: question.question_type || 'text'
        });
      } else {
        throw new Error('Question not found');
      }
    } catch (err) {
      console.error('Error fetching question:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const method = isEditMode ? 'PUT' : 'POST';
      const url = isEditMode
        ? `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}/${id}`
        : `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save question');
      }

      navigate('/admin/questions');
    } catch (err) {
      console.error('Error saving question:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/questions');
  };

  if (loading) {
    return (
      <div className="admin-question-detail">
        <div className="admin-question-detail__loading">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="admin-question-detail">
      <div className="admin-question-detail__card">
        {/* Header */}
        <div className="admin-question-detail__header">
          <h1 className="admin-question-detail__title">Question Detail</h1>
          <p className="admin-question-detail__subtitle">
            Create or update one question record.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="admin-question-detail__error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-question-detail__form">
          {/* Question Text */}
          <div className="admin-question-detail__field admin-question-detail__field--full">
            <label className="admin-question-detail__label">Question Text</label>
            <textarea
              name="question_text"
              className="asr-textarea"
              value={formData.question_text}
              onChange={handleChange}
              placeholder="Enter the question text..."
              rows={3}
            />
          </div>

          {/* Three Column Row: Plan Type, Status, Order */}
          <div className="admin-question-detail__row">
            <div className="admin-question-detail__field">
              <label className="admin-question-detail__label">
                Plan Type (IEP | 504 | BIP)
              </label>
              <select
                name="plan_type"
                className="asr-select"
                value={formData.plan_type}
                onChange={handleChange}
              >
                <option value="IEP">IEP</option>
                <option value="504">504</option>
                <option value="BIP">BIP</option>
              </select>
            </div>

            <div className="admin-question-detail__field">
              <label className="admin-question-detail__label">
                Status (Active | Inactive)
              </label>
              <select
                name="is_active"
                className="asr-select"
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_active: e.target.value === 'active'
                }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="admin-question-detail__field">
              <label className="admin-question-detail__label">Order</label>
              <input
                type="number"
                name="order_position"
                className="asr-input"
                value={formData.order_position}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          {/* Help Text */}
          <div className="admin-question-detail__field admin-question-detail__field--full">
            <label className="admin-question-detail__label">
              Help Text (shown to user)
            </label>
            <textarea
              name="help_text"
              className="asr-textarea"
              value={formData.help_text}
              onChange={handleChange}
              placeholder="Optional help text to guide the user..."
              rows={3}
            />
          </div>

          {/* COMAR Tag */}
          <div className="admin-question-detail__field admin-question-detail__field--full">
            <label className="admin-question-detail__label">
              COMAR Tag (optional)
            </label>
            <input
              type="text"
              name="comar_tag"
              className="asr-input"
              value={formData.comar_tag}
              onChange={handleChange}
              placeholder="e.g., measurable, timeline, specific..."
            />
            <span className="admin-question-detail__hint">
              Tags for COMAR validation: measurable, timeline, specific, achievable, relevant
            </span>
          </div>

          {/* Actions */}
          <div className="admin-question-detail__actions">
            <button
              type="button"
              className="asr-btn asr-btn--primary asr-btn--lg"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="asr-btn asr-btn--red asr-btn--lg"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="admin-question-detail__footer">
          Save updates the questions table.
        </div>
      </div>
    </div>
  );
}

export default AdminQuestionDetail;
