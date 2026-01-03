/**
 * MediaUpload Component
 *
 * Client-side upload to Vercel Blob for video/poster files.
 * Uses @vercel/blob/client for direct browser uploads.
 */

import React, { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import './MediaUpload.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://meal-planner-app-mve2.onrender.com';

export default function MediaUpload({
  onUploadComplete,
  accept = 'video/mp4,image/jpeg,image/png,image/webp',
  label = 'Upload File',
  uploadType = 'video' // 'video' or 'poster'
}) {
  const inputFileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setProgress(0);

    if (!inputFileRef.current?.files || inputFileRef.current.files.length === 0) {
      setError('Please select a file');
      return;
    }

    const file = inputFileRef.current.files[0];

    // Validate file size (100MB max for videos, 10MB for images)
    const maxSize = uploadType === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${uploadType === 'video' ? '100MB' : '10MB'}`);
      return;
    }

    setUploading(true);

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `${API_BASE}/api/upload/media`,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setProgress(percent);
        },
      });

      setUploadedUrl(newBlob.url);

      if (onUploadComplete) {
        onUploadComplete({
          url: newBlob.url,
          type: uploadType,
          filename: file.name,
          size: file.size,
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = () => {
    setError(null);
    setUploadedUrl(null);
  };

  return (
    <div className="media-upload">
      <form onSubmit={handleSubmit}>
        <div className="upload-input-wrapper">
          <input
            name="file"
            ref={inputFileRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="upload-input"
          />
          <button
            type="submit"
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? `Uploading ${progress}%` : label}
          </button>
        </div>

        {uploading && (
          <div className="upload-progress">
            <div
              className="upload-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {error && (
          <div className="upload-error">
            {error}
          </div>
        )}

        {uploadedUrl && (
          <div className="upload-success">
            <span>Uploaded!</span>
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
              View file
            </a>
          </div>
        )}
      </form>
    </div>
  );
}
