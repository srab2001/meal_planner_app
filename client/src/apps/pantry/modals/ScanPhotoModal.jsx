import React, { useState, useRef } from 'react';
import './ScanPhotoModal.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function ScanPhotoModal({ householdId, onClose, onItemsIdentified }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [identifiedItems, setIdentifiedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [adding, setAdding] = useState(false);

  const fileInputRef = useRef(null);
  const token = localStorage.getItem('auth_token');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const analyzePhoto = async () => {
    if (!image) {
      setError('Please select or capture an image first');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setIdentifiedItems([]);

    try {
      const res = await fetch(`${API_BASE}/api/core/pantry/analyze-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image,
          household_id: householdId
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to analyze photo');
      }

      const data = await res.json();
      setIdentifiedItems(data.items || []);

      // Select all items by default
      const defaultSelected = {};
      data.items.forEach((item, idx) => {
        defaultSelected[idx] = true;
      });
      setSelectedItems(defaultSelected);

      if (data.items.length === 0) {
        setError('No food items detected in the image. Try a clearer photo.');
      }
    } catch (err) {
      console.error('Error analyzing photo:', err);
      setError(err.message || 'Failed to analyze photo');
    } finally {
      setAnalyzing(false);
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
      // Add items one by one
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

      // Notify parent and close
      onItemsIdentified?.(addedItems);
      onClose();
    } catch (err) {
      console.error('Error adding items:', err);
      setError('Failed to add some items. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setPreview(null);
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
          {!preview ? (
            <div className="upload-section">
              <div className="upload-area" onClick={handleCapture}>
                <div className="upload-icon">📷</div>
                <p>Click to take a photo or select an image</p>
                <p className="upload-hint">Supports JPG, PNG (max 10MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="preview-section">
              <div className="image-preview">
                <img src={preview} alt="Food to scan" />
                <button className="clear-btn" onClick={clearImage}>
                  Change Image
                </button>
              </div>

              {!identifiedItems.length && !analyzing && (
                <button
                  className="analyze-btn"
                  onClick={analyzePhoto}
                  disabled={analyzing}
                >
                  {analyzing ? 'Analyzing...' : 'Identify Food Items'}
                </button>
              )}

              {analyzing && (
                <div className="analyzing-indicator">
                  <div className="spinner"></div>
                  <p>AI is analyzing your photo...</p>
                </div>
              )}

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
