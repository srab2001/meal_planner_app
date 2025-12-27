import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, ENDPOINTS } from '../config/api';
import './AdminQuestionBank.css';

/**
 * Admin Question Bank Component
 *
 * Features:
 * - List all interview questions with Order, Question, Plan, Status columns
 * - Search by question text
 * - Filter by Plan Type (IEP, 504, BIP)
 * - Filter by Status (Active, Inactive)
 * - Add, edit, delete, reorder questions
 */
function AdminQuestionBank({ token }) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [planTypeFilter, setPlanTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [questions, searchTerm, planTypeFilter, statusFilter]);

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
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      const questionList = data.questions || [];
      setQuestions(questionList.sort((a, b) => a.order_position - b.order_position));
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Plan Type filter
    if (planTypeFilter) {
      filtered = filtered.filter(q => q.plan_type === planTypeFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(q =>
        statusFilter === 'active' ? q.is_active : !q.is_active
      );
    }

    setFilteredQuestions(filtered);
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
        throw new Error('Failed to delete question');
      }

      await fetchQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err.message);
    }
  };

  const handleToggleStatus = async (question) => {
    try {
      const response = await fetch(
        `${API_BASE}${ENDPOINTS.INTERVIEW_QUESTIONS}/${question.id}/toggle`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle status');
      }

      await fetchQuestions();
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(err.message);
    }
  };

  const getPlanTypeBadgeClass = (planType) => {
    switch (planType) {
      case 'IEP': return 'asr-badge asr-badge--iep';
      case '504': return 'asr-badge asr-badge--504';
      case 'BIP': return 'asr-badge asr-badge--bip';
      default: return 'asr-badge';
    }
  };

  if (loading) {
    return (
      <div className="admin-question-bank">
        <div className="admin-question-bank__loading">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="admin-question-bank">
      {/* Header */}
      <div className="admin-question-bank__header">
        <div>
          <h1 className="admin-question-bank__title">Question Bank</h1>
          <p className="admin-question-bank__subtitle">Add, edit, delete, reorder.</p>
        </div>
        <button
          className="asr-btn asr-btn--orange"
          onClick={() => navigate('/admin/questions/new')}
        >
          + Add Question
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="admin-question-bank__error">
          <strong>Error:</strong> {error}
          <button onClick={fetchQuestions} className="asr-btn asr-btn--sm asr-btn--outline" style={{ marginLeft: '12px' }}>
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="admin-question-bank__filters">
        <input
          type="text"
          className="asr-input admin-question-bank__search"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="asr-select admin-question-bank__filter"
          value={planTypeFilter}
          onChange={(e) => setPlanTypeFilter(e.target.value)}
        >
          <option value="">Plan Type</option>
          <option value="IEP">IEP</option>
          <option value="504">504</option>
          <option value="BIP">BIP</option>
        </select>
        <select
          className="asr-select admin-question-bank__filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Questions Table */}
      <div className="admin-question-bank__table-wrapper">
        <table className="admin-question-bank__table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Order</th>
              <th>Question</th>
              <th style={{ width: '100px' }}>Plan</th>
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-question-bank__empty">
                  {questions.length === 0
                    ? 'No questions created yet. Click "Add Question" to create one.'
                    : 'No questions match the current filters.'}
                </td>
              </tr>
            ) : (
              filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td className="admin-question-bank__order">{question.order_position}</td>
                  <td className="admin-question-bank__text">
                    {question.question_text}
                    {question.help_text && (
                      <span className="admin-question-bank__help">
                        {question.help_text}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={getPlanTypeBadgeClass(question.plan_type)}>
                      {question.plan_type || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`asr-badge ${question.is_active ? 'asr-badge--active' : 'asr-badge--inactive'}`}>
                      {question.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-question-bank__actions">
                    <button
                      className="asr-btn asr-btn--sm asr-btn--outline"
                      onClick={() => navigate(`/admin/questions/${question.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="asr-btn asr-btn--sm asr-btn--outline"
                      onClick={() => handleToggleStatus(question)}
                    >
                      {question.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="asr-btn asr-btn--sm asr-btn--red"
                      onClick={() => handleDelete(question.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="admin-question-bank__footer">
        <span>Changes save to database when you confirm.</span>
      </div>
    </div>
  );
}

export default AdminQuestionBank;
