import React, { useState, useEffect } from 'react';
import '../styles/AdminCoachPanel.css';
import QuestionList from './QuestionList';
import QuestionForm from './QuestionForm';
import QuestionPreview from './QuestionPreview';

/**
 * AdminCoachPanel Component
 * 
 * Main admin dashboard for managing AI Coach interview questions.
 * Features:
 * - View all questions with edit/delete options
 * - Create new questions
 * - Edit existing questions
 * - Delete questions (soft delete)
 * - Reorder questions via drag-drop
 * - Preview questions as they appear to users
 * - Toggle question active/inactive status
 */

const AdminCoachPanel = ({ user, onBack }) => {
  const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';
  
  // State Management
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'add', 'preview'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  /**
   * Fetch all questions from backend
   */
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/admin/questions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have admin access to manage questions');
        }
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle creating a new question
   */
  const handleCreateQuestion = async (questionData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/admin/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create question');
      }

      const data = await response.json();
      setQuestions([...questions, data.question]);
      
      // Show success message
      setSaveMessage('✅ Question created successfully');
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Reset form
      setActiveTab('list');
    } catch (err) {
      console.error('Error creating question:', err);
      setError(err.message);
    }
  };

  /**
   * Handle updating an existing question
   */
  const handleUpdateQuestion = async (questionId, questionData) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update question');
      }

      const data = await response.json();
      setQuestions(questions.map(q => q.id === questionId ? data.question : q));
      
      // Show success message
      setSaveMessage('✅ Question updated successfully');
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Reset form
      setEditingQuestion(null);
      setActiveTab('list');
    } catch (err) {
      console.error('Error updating question:', err);
      setError(err.message);
    }
  };

  /**
   * Handle deleting a question (soft delete)
   */
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question? This action can be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete question');
      }

      setQuestions(questions.filter(q => q.id !== questionId));
      
      // Show success message
      setSaveMessage('✅ Question deleted successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting question:', err);
      setError(err.message);
    }
  };

  /**
   * Handle toggling question active status
   */
  const handleToggleActive = async (questionId, isActive) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/admin/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update question status');
      }

      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, is_active: !isActive } : q
      ));
    } catch (err) {
      console.error('Error toggling question status:', err);
      setError(err.message);
    }
  };

  /**
   * Handle reordering questions via drag-drop
   */
  const handleReorderStart = (question) => {
    setReordering(true);
    setDraggedQuestion(question);
  };

  const handleReorderDrop = async (targetQuestion) => {
    if (!draggedQuestion || draggedQuestion.id === targetQuestion.id) {
      setReordering(false);
      setDraggedQuestion(null);
      return;
    }

    try {
      // Create new order
      const dragIndex = questions.findIndex(q => q.id === draggedQuestion.id);
      const targetIndex = questions.findIndex(q => q.id === targetQuestion.id);
      
      const newQuestions = [...questions];
      newQuestions.splice(dragIndex, 1);
      newQuestions.splice(targetIndex, 0, draggedQuestion);

      // Update order positions
      const reorderData = {
        questions: newQuestions.map((q, idx) => ({
          id: q.id,
          order_position: idx + 1
        }))
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/admin/questions/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reorderData)
      });

      if (!response.ok) {
        throw new Error('Failed to reorder questions');
      }

      setQuestions(newQuestions);
      setSaveMessage('✅ Questions reordered successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Error reordering questions:', err);
      setError(err.message);
    } finally {
      setReordering(false);
      setDraggedQuestion(null);
    }
  };

  /**
   * Start editing a question
   */
  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setActiveTab('add');
  };

  /**
   * Preview a question
   */
  const handlePreviewQuestion = (question) => {
    setSelectedQuestion(question);
    setActiveTab('preview');
  };

  // Render
  return (
    <div className="admin-coach-panel">
      {/* Header */}
      <header className="admin-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>🤖 AI Coach Interview Questions</h1>
        <p className="subtitle">Manage and configure questions for the AI Coach workout interview</p>
      </header>

      {/* Messages */}
      {saveMessage && <div className="success-message">{saveMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Questions ({questions.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setEditingQuestion(null);
            setActiveTab('add');
          }}
        >
          ➕ {editingQuestion ? 'Edit' : 'Create'} Question
        </button>
        {selectedQuestion && (
          <button 
            className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Preview
          </button>
        )}
      </div>

      {/* Content Areas */}
      <div className="admin-content">
        {/* Questions List Tab */}
        {activeTab === 'list' && (
          <div className="tab-content">
            {loading ? (
              <div className="loading">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="empty-state">
                <p>No questions created yet. Create your first question to get started!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingQuestion(null);
                    setActiveTab('add');
                  }}
                >
                  Create First Question
                </button>
              </div>
            ) : (
              <QuestionList
                questions={questions}
                draggedQuestion={draggedQuestion}
                reordering={reordering}
                onReorderStart={handleReorderStart}
                onReorderDrop={handleReorderDrop}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onToggleActive={handleToggleActive}
                onPreview={handlePreviewQuestion}
              />
            )}
          </div>
        )}

        {/* Create/Edit Question Tab */}
        {activeTab === 'add' && (
          <div className="tab-content">
            <QuestionForm
              question={editingQuestion}
              onSubmit={(data) => {
                if (editingQuestion) {
                  handleUpdateQuestion(editingQuestion.id, data);
                } else {
                  handleCreateQuestion(data);
                }
              }}
              onCancel={() => {
                setEditingQuestion(null);
                setActiveTab('list');
              }}
            />
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && selectedQuestion && (
          <div className="tab-content">
            <QuestionPreview
              question={selectedQuestion}
              onClose={() => setActiveTab('list')}
            />
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <footer className="admin-footer">
        <div className="stats">
          <span>Total Questions: <strong>{questions.length}</strong></span>
          <span>Active: <strong>{questions.filter(q => q.is_active).length}</strong></span>
          <span>Inactive: <strong>{questions.filter(q => !q.is_active).length}</strong></span>
        </div>
      </footer>
    </div>
  );
};

export default AdminCoachPanel;
