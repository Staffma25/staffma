import React, { useState } from 'react';
import { uploadDocument, deleteDocument } from '../utils/s3Upload';

const ALLOWED_FILE_TYPES = {
  'application/pdf': true,
  'image/jpeg': true,
  'image/png': true,
  'image/jpg': true
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const DocumentUpload = ({ employeeId, documentType, currentDocument, onDocumentUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    if (!ALLOWED_FILE_TYPES[file.type]) {
      throw new Error('Invalid file type. Please upload PDF, JPEG, or PNG files only.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      validateFile(file);
      const fileUrl = await uploadDocument(file, employeeId, documentType);
      onDocumentUpdate(documentType, fileUrl);
    } catch (error) {
      setError(error.message || 'Failed to upload document. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    try {
      setError(null);
      await deleteDocument(employeeId, documentType);
      onDocumentUpdate(documentType, null);
    } catch (error) {
      setError(error.message || 'Failed to delete document. Please try again.');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="document-upload">
      <div className="document-info">
        <h4>{documentType.charAt(0).toUpperCase() + documentType.slice(1)}</h4>
        {currentDocument?.url && (
          <div className="document-preview">
            <a 
              href={currentDocument.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="view-document"
            >
              View Document
            </a>
            <button 
              onClick={handleDelete}
              className="delete-document"
              disabled={isUploading}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="upload-controls">
        <input
          type="file"
          id={`file-${documentType}`}
          onChange={handleFileChange}
          disabled={isUploading}
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
        />
        <label 
          htmlFor={`file-${documentType}`}
          className={`upload-button ${isUploading ? 'uploading' : ''}`}
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </label>
        <div className="file-info">
          <small>Accepted formats: PDF, JPEG, PNG (max 5MB)</small>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <style jsx>{`
        .document-upload {
          padding: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .document-info {
          margin-bottom: 1rem;
        }

        .document-info h4 {
          margin: 0 0 0.5rem 0;
          color: #2d3748;
        }

        .document-preview {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .view-document {
          color: #4299e1;
          text-decoration: none;
        }

        .view-document:hover {
          text-decoration: underline;
        }

        .delete-document {
          background: #fc8181;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }

        .delete-document:hover {
          background: #f56565;
        }

        .delete-document:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        .upload-button {
          display: inline-block;
          background: #4299e1;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .upload-button:hover {
          background: #3182ce;
        }

        .upload-button.uploading {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .error-message {
          color: #e53e3e;
          margin-top: 0.5rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-icon {
          font-size: 1rem;
        }

        .file-info {
          margin-top: 0.5rem;
          color: #718096;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default DocumentUpload; 