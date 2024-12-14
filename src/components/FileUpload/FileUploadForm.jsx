import React, { useState, useRef } from 'react';
import { uploadDocument } from '../../services/api';

function FileUploadForm({ onUploadSuccess, onClose }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace('.pdf', ''));
      }
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Please provide both a file and title');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(25);
      const response = await uploadDocument(file, title.trim());
      setProgress(100);
      
      if (onUploadSuccess) {
        onUploadSuccess(response);
      }
      
      // Reset form
      setFile(null);
      setTitle('');
      setProgress(0);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="documentTitle" className="form-label">
              Document Title
            </label>
            <input
              type="text"
              className="form-control"
              id="documentTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <div
              className={`file-upload-input ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div className="text-center p-4">
                {file ? (
                  <>
                    <i className="bi bi-file-earmark-pdf fs-1 text-primary mb-3"></i>
                    <p className="mb-1">{file.name}</p>
                    <p className="small text-muted mb-0">
                      Click or drag to replace
                    </p>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-upload fs-1 text-primary mb-3"></i>
                    <p className="mb-1">Drag and drop your PDF here or click to browse</p>
                    <p className="small text-muted mb-0">Supported format: PDF</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="d-none"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileSelect}
                disabled={loading}
              />
            </div>
          </div>

          {progress > 0 && (
            <div className="mb-4">
              <div className="progress">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar" 
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                >
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <div className="d-flex gap-2">
            {onClose && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary flex-grow-1"
              disabled={loading || !file || !title.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-upload me-2"></i>
                  Upload Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FileUploadForm;