import React, { useEffect, useState } from 'react';
import { getDocuments } from '../../services/api';
import Loading from '../common/Loading';

function DocumentList({ onSelectDocument, selectedDocument, isVisible }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return <Loading message="Loading documents..." />;
  }

  if (!loading && documents.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-body text-center py-4">
          <i className="bi bi-file-earmark-text fs-1 text-muted mb-3 d-block"></i>
          <h3 className="h5 mb-2">No Documents Yet</h3>
          <p className="text-muted mb-0">Upload your first document to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm overflow-hidden">
      <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={loadDocuments}
          title="Refresh list"
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh List
        </button>
      </div>

      <div className="list-group list-group-flush">
        {error && (
          <div className="alert alert-danger m-3" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </div>
        )}
        
        {documents.map((doc) => (
          <button
            key={doc.id}
            className={`list-group-item list-group-item-action border-0 ${
              selectedDocument?.id === doc.id ? 'active' : ''
            }`}
            onClick={() => onSelectDocument(doc)}
          >
            <div className="d-flex align-items-center gap-3">
              <div className="document-icon">
                <i className={`bi bi-file-earmark-pdf fs-4 ${
                  selectedDocument?.id === doc.id ? 'text-white' : 'text-primary'
                }`}></i>
              </div>
              <div className="flex-grow-1 text-start">
                <h3 className="h6 mb-1">{doc.title}</h3>
                <p className={`small mb-0 ${
                  selectedDocument?.id === doc.id ? 'text-white-50' : 'text-muted'
                }`}>
                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DocumentList;