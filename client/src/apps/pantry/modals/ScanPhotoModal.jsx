import React, { useState, useRef } from 'react';
import './ScanPhotoModal.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function ScanPhotoModal({ householdId, onClose, onItemsIdentified }) {
  const [images, setImages] = useState([]); // Array of { file, preview, base64 }
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [identifiedItems, setIdentifiedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [adding, setAdding] = useState(false);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem('auth_token');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setError(null);
    const newImages = [];

    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files');
        return;
      }

      // Validate file size (max 10MB each)
      if (file.size > 10 * 1024 * 1024) {
        setError('Each image must be less than 10MB');
        return;
      }

      // Create preview and base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          file,
          preview: e.target.result,
          base64: e.target.result
        };
        setImages(prev => [...prev, imageData]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePhotos = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setIdentifiedItems([]);
    setAnalyzingProgress({ current: 0, total: images.length });

    try {
      const allItems = [];

      // Analyze each photo
      for (let i = 0; i < images.length; i++) {
        setAnalyzingProgress({ current: i + 1, total: images.length });

        const res = await fetch(`${API_BASE}/api/core/pantry/analyze-photo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            image: images[i].base64,
            household_id: householdId
          })
        });

        if (!res.ok) {
          const data = await res.json();
          console.error(`Failed to analyze photo ${i + 1}:`, data.error);
          continue; // Continue with other photos
        }

        const data = await res.json();
        if (data.items && data.items.length > 0) {
          // Add photo index to each item for reference
          const itemsWithSource = data.items.map(item => ({
            ...item,
            sourcePhotoIndex: i
          }));
          allItems.push(...itemsWithSource);
        }
      }

      setIdentifiedItems(allItems);

      // Select all items by default
      const defaultSelected = {};
      allItems.forEach((_, idx) => {
        defaultSelected[idx] = true;
      });
      setSelectedItems(defaultSelected);

      if (allItems.length === 0) {
        setError('No food items detected in any of the images. Try clearer photos.');
      }
    } catch (err) {
      console.error('Error analyzing photos:', err);
      setError(err.message || 'Failed to analyze photos');
    } finally {
      setAnalyzing(false);
      setAnalyzingProgress({ current: 0, total: 0 });
    }
  };

  const toggleItem = (idx) => {
    setSelectedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const updateItem = (idx, field, value) => {
    setIdentifiedItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const addSelectedItems = async () => {
    const itemsToAdd = identifiedItems.filter((_, idx) => selectedItems[idx]);

    if (itemsToAdd.length === 0) {
      setError('Please select at least one item to add');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const addedItems = [];
      for (const item of itemsToAdd) {
        const res = await fetch(`${API_BASE}/api/core/pantry/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            itemName: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            purchaseDate: item.purchaseDate,
            expirationDate: item.expirationDate,
            household_id: householdId
          })
        });

        if (res.ok) {
          const data = await res.json();
          addedItems.push(data.item);
        }
      }

      onItemsIdentified?.(addedItems);
      onClose();
    } catch (err) {
      console.error('Error adding items:', err);
      setError('Failed to add some items. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const clearAll = () => {
    setImages([]);
    setIdentifiedItems([]);
    setSelectedItems({});
    setError(null);
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="scan-modal-overlay" onClick={onClose}>
      <div className="scan-modal" onClick={e => e.stopPropagation()}>
        <div className="scan-modal-header">
          <h2>Scan Food Items</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="scan-modal-content">
          {images.length === 0 ? (
            <div className="upload-section">
              <div className="upload-area" onClick={handleAddMore}>
                <div className="upload-icon">📷</div>
                <p>Click to select photos</p>
                <p className="upload-hint">Select one or multiple photos (max 10MB each)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="preview-section">
              {/* Photo thumbnails */}
              <div className="photo-grid">
                {images.map((img, idx) => (
                  <div key={idx} className="photo-thumbnail">
                    <img src={img.preview} alt={`Photo ${idx + 1}`} />
                    <button
                      className="remove-photo-btn"
                      onClick={() => removeImage(idx)}
                      title="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {/* Add more button */}
                <div className="photo-thumbnail add-more" onClick={handleAddMore}>
                  <span>+</span>
                  <p>Add More</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {/* Analyze button */}
              {!identifiedItems.length && !analyzing && (
                <div className="action-buttons">
                  <button className="clear-all-btn" onClick={clearAll}>
                    Clear All
                  </button>
                  <button
                    className="analyze-btn"
                    onClick={analyzePhotos}
                    disabled={analyzing}
                  >
                    Identify Food Items ({images.length} photo{images.length !== 1 ? 's' : ''})
                  </button>
                </div>
              )}

              {/* Analyzing progress */}
              {analyzing && (
                <div className="analyzing-indicator">
                  <div className="spinner"></div>
                  <p>Analyzing photo {analyzingProgress.current} of {analyzingProgress.total}...</p>
                </div>
              )}

              {/* Identified items */}
              {identifiedItems.length > 0 && (
                <div className="identified-items">
                  <h3>Identified Items ({identifiedItems.length})</h3>
                  <p className="items-hint">Uncheck items you don't want to add, or edit quantities</p>

                  <div className="items-list">
                    {identifiedItems.map((item, idx) => (
                      <div key={idx} className={`item-row ${!selectedItems[idx] ? 'unchecked' : ''}`}>
                        <label className="item-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedItems[idx] || false}
                            onChange={() => toggleItem(idx)}
                          />
                        </label>

                        <div className="item-details">
                          <input
                            type="text"
                            className="item-name"
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                          />

                          <div className="item-quantity">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                            />
                            <select
                              value={item.unit}
                              onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            >
                              <option value="count">count</option>
                              <option value="lbs">lbs</option>
                              <option value="oz">oz</option>
                              <option value="gallon">gallon</option>
                              <option value="dozen">dozen</option>
                              <option value="box">box</option>
                              <option value="bag">bag</option>
                              <option value="can">can</option>
                              <option value="bottle">bottle</option>
                              <option value="jar">jar</option>
                              <option value="pack">pack</option>
                            </select>
                          </div>
                        </div>

                        <span
                          className="confidence-badge"
                          style={{ backgroundColor: getConfidenceColor(item.confidence) }}
                        >
                          {item.confidence}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>

        <div className="scan-modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          {identifiedItems.length > 0 && (
            <button
              className="add-btn"
              onClick={addSelectedItems}
              disabled={adding || Object.values(selectedItems).filter(Boolean).length === 0}
            >
              {adding ? 'Adding...' : `Add ${Object.values(selectedItems).filter(Boolean).length} Items`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
