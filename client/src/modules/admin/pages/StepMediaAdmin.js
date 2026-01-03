import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';
import '../styles/StepMediaAdmin.css';
import { StepVideo } from '../../../shared/components';
import MediaUpload from '../components/MediaUpload';
import {
  adminListStepMedia,
  adminCreateStepMedia,
  adminUpdateStepMedia,
  adminPublishStepMedia,
  adminDeleteStepMedia,
} from '../../../shared/utils/adminApi';

// Step key labels for display
const STEP_LABELS = {
  CUISINES: 'Cuisines Selection',
  SERVINGS: 'Number of Servings',
  INGREDIENTS: 'Ingredients List',
  DIETARY: 'Dietary Preferences',
  MEALS: 'Meal Types',
  STORES: 'Store Selection',
  RECIPES_WITH_PRICES: 'Recipes with Prices',
};

/**
 * StepMediaAdmin - Admin page for managing step media
 * Features:
 * - View all media grouped by step
 * - Create new media versions
 * - Preview video/poster
 * - Publish media to make it active
 * - Delete inactive media
 */
export default function StepMediaAdmin({ user, onBack }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');

  // Media data
  const [stepKeys, setStepKeys] = useState([]);
  const [mediaByStep, setMediaByStep] = useState({});
  const [selectedStep, setSelectedStep] = useState(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    stepKey: '',
    label: '',
    videoUrl: '',
    posterUrl: '',
    runRule: 'loop',
  });
  const [creating, setCreating] = useState(false);

  // Preview modal
  const [previewMedia, setPreviewMedia] = useState(null);

  // Messages
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadStepMedia();
  }, []);

  const loadStepMedia = async () => {
    try {
      const data = await adminListStepMedia();
      setIsAdmin(true);
      setStepKeys(data.stepKeys || []);
      setMediaByStep(data.media || {});
      if (data.stepKeys?.length > 0 && !selectedStep) {
        setSelectedStep(data.stepKeys[0]);
      }
    } catch (err) {
      console.error('Error loading step media:', err);
      if (err.message.includes('403')) {
        setIsAdmin(false);
      } else {
        setError('Failed to load step media');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new media
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.stepKey || !createForm.label) {
      setError('Step and label are required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const newMedia = await adminCreateStepMedia({
        stepKey: createForm.stepKey,
        label: createForm.label.trim(),
        videoUrl: createForm.videoUrl.trim() || null,
        posterUrl: createForm.posterUrl.trim() || null,
        runRule: createForm.runRule,
      });

      // Add to local state
      setMediaByStep(prev => ({
        ...prev,
        [createForm.stepKey]: [newMedia, ...(prev[createForm.stepKey] || [])],
      }));

      // Reset form
      setCreateForm({
        stepKey: '',
        label: '',
        videoUrl: '',
        posterUrl: '',
        runRule: 'loop',
      });
      setActiveTab('list');
      setSelectedStep(createForm.stepKey);
      setSuccess('Media created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error creating media:', err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  // Publish media
  const handlePublish = async (media) => {
    try {
      setError(null);
      await adminPublishStepMedia(media.id);

      // Update local state - mark this media as active, others as not
      setMediaByStep(prev => ({
        ...prev,
        [media.stepKey]: prev[media.stepKey].map(m => ({
          ...m,
          isActive: m.id === media.id,
          publishedAt: m.id === media.id ? new Date().toISOString() : m.publishedAt,
        })),
      }));

      setSuccess(`Published "${media.label}" for ${STEP_LABELS[media.stepKey]}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error publishing media:', err);
      setError(err.message);
    }
  };

  // Delete media
  const handleDelete = async (media) => {
    if (media.isActive) {
      setError('Cannot delete active media. Publish a different version first.');
      return;
    }

    if (!window.confirm(`Delete "${media.label}"? This cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await adminDeleteStepMedia(media.id);

      // Remove from local state
      setMediaByStep(prev => ({
        ...prev,
        [media.stepKey]: prev[media.stepKey].filter(m => m.id !== media.id),
      }));

      setSuccess('Media deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting media:', err);
      setError(err.message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Loading step media...</div>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>You do not have admin privileges to access this page.</p>
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const currentMedia = selectedStep ? (mediaByStep[selectedStep] || []) : [];

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Step Media Management</h1>
        <p className="subtitle">Manage video/poster content for meal planning steps</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="message error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}
      {success && (
        <div className="message success-message">
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Media Library
        </button>
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          + Add New Media
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'list' && (
          <>
            <h2>Media Library</h2>

            {/* Step Selector */}
            <div className="step-selector">
              {stepKeys.map(key => (
                <button
                  key={key}
                  className={`step-tab ${selectedStep === key ? 'active' : ''}`}
                  onClick={() => setSelectedStep(key)}
                >
                  {STEP_LABELS[key] || key}
                  {mediaByStep[key]?.some(m => m.isActive) && (
                    <span className="active-indicator">●</span>
                  )}
                </button>
              ))}
            </div>

            {/* Media List */}
            {selectedStep && (
              <div className="media-list">
                {currentMedia.length === 0 ? (
                  <div className="empty-state">
                    <p>No media for {STEP_LABELS[selectedStep]}</p>
                    <button
                      className="submit-btn"
                      onClick={() => {
                        setCreateForm(prev => ({ ...prev, stepKey: selectedStep }));
                        setActiveTab('create');
                      }}
                    >
                      Add Media
                    </button>
                  </div>
                ) : (
                  currentMedia.map(media => (
                    <div
                      key={media.id}
                      className={`media-card ${media.isActive ? 'active' : ''}`}
                    >
                      <div className="media-card-header">
                        <div>
                          <h3>{media.label}</h3>
                          {media.isActive && (
                            <span className="status-badge active">Active</span>
                          )}
                        </div>
                        <span className="run-rule-badge">{media.runRule}</span>
                      </div>

                      <div className="media-card-preview">
                        {media.videoUrl || media.posterUrl ? (
                          <button
                            className="preview-button"
                            onClick={() => setPreviewMedia(media)}
                          >
                            {media.posterUrl && (
                              <img
                                src={media.posterUrl}
                                alt="Poster preview"
                                className="poster-thumbnail"
                              />
                            )}
                            <span className="preview-overlay">
                              {media.videoUrl ? '▶ Preview Video' : 'View Poster'}
                            </span>
                          </button>
                        ) : (
                          <div className="no-media">No media files</div>
                        )}
                      </div>

                      <div className="media-card-meta">
                        <p>Created: {new Date(media.createdAt).toLocaleDateString()}</p>
                        {media.publishedAt && (
                          <p>Published: {new Date(media.publishedAt).toLocaleDateString()}</p>
                        )}
                      </div>

                      <div className="media-card-actions">
                        {!media.isActive && (
                          <button
                            className="save-btn"
                            onClick={() => handlePublish(media)}
                          >
                            Publish
                          </button>
                        )}
                        {!media.isActive && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleDelete(media)}
                          >
                            Delete
                          </button>
                        )}
                        {media.isActive && (
                          <span className="active-label">Currently active</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'create' && (
          <>
            <h2>Add New Media</h2>
            <form className="admin-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label>Step</label>
                <select
                  value={createForm.stepKey}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, stepKey: e.target.value }))}
                  required
                >
                  <option value="">Select a step...</option>
                  {stepKeys.map(key => (
                    <option key={key} value={key}>
                      {STEP_LABELS[key] || key}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Label</label>
                <input
                  type="text"
                  placeholder="e.g., Holiday promo video v2"
                  value={createForm.label}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, label: e.target.value }))}
                  required
                />
                <span className="form-hint">Admin-friendly name for this media version</span>
              </div>

              <div className="form-group">
                <label>Video</label>
                <MediaUpload
                  uploadType="video"
                  label="Upload Video"
                  accept="video/mp4,video/webm,video/quicktime"
                  onUploadComplete={(result) => {
                    setCreateForm(prev => ({ ...prev, videoUrl: result.url }));
                  }}
                />
                {createForm.videoUrl && (
                  <div className="uploaded-url">
                    <span>Video URL:</span>
                    <input
                      type="url"
                      value={createForm.videoUrl}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => setCreateForm(prev => ({ ...prev, videoUrl: '' }))}
                    >
                      ×
                    </button>
                  </div>
                )}
                <span className="form-hint">Upload MP4 video or paste URL directly</span>
              </div>

              <div className="form-group">
                <label>Poster Image</label>
                <MediaUpload
                  uploadType="poster"
                  label="Upload Poster"
                  accept="image/jpeg,image/png,image/webp"
                  onUploadComplete={(result) => {
                    setCreateForm(prev => ({ ...prev, posterUrl: result.url }));
                  }}
                />
                {createForm.posterUrl && (
                  <div className="uploaded-url">
                    <span>Poster URL:</span>
                    <input
                      type="url"
                      value={createForm.posterUrl}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, posterUrl: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={() => setCreateForm(prev => ({ ...prev, posterUrl: '' }))}
                    >
                      ×
                    </button>
                  </div>
                )}
                <span className="form-hint">Upload poster image or paste URL directly</span>
              </div>

              <div className="form-group">
                <label>Run Rule</label>
                <select
                  value={createForm.runRule}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, runRule: e.target.value }))}
                >
                  <option value="loop">Loop - Play continuously</option>
                  <option value="stopOnUserAction">Stop on User Action</option>
                </select>
                <span className="form-hint">How the video should behave when playing</span>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Media'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {previewMedia && (
        <div className="preview-modal-overlay" onClick={() => setPreviewMedia(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{previewMedia.label}</h3>
              <button onClick={() => setPreviewMedia(null)}>&times;</button>
            </div>
            <div className="preview-modal-content">
              <StepVideo
                videoUrl={previewMedia.videoUrl}
                posterUrl={previewMedia.posterUrl}
                runRule={previewMedia.runRule}
                showControls
              />
            </div>
            <div className="preview-modal-footer">
              <p>Step: {STEP_LABELS[previewMedia.stepKey]}</p>
              <p>Run Rule: {previewMedia.runRule}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
