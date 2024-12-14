import { useState, useEffect, useCallback } from 'react';
import { analyzeDocument } from '../services/api';
import FileUploadForm from '../components/FileUpload/FileUploadForm';
import DocumentList from '../components/DocumentViewer/DocumentList';
import AnalysisResults from '../components/Analysis/AnalysisResults';
import PDFViewer from '../components/DocumentViewer/PDFViewer';
import Loading from '../components/common/Loading';
import ChatInterface from '../components/Chat/ChatInterface';

function Home({ showDocuments, onToggleDocuments }) {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [showUpload, setShowUpload] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);

  // Reset states when document is deselected
  useEffect(() => {
    if (!selectedDocument) {
      setAnalysis(null);
      setPdfUrl(null);
      setError(null);
    }
  }, [selectedDocument]);

  const constructFileUrl = useCallback((fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith('http')) return fileUrl;
    return `http://localhost:8000${fileUrl}`.replace(/([^:]\/)\/+/g, "$1");
  }, []);

  const handleDocumentSelect = async (document) => {
    try {
      setLoading(true);
      setError(null);
      onToggleDocuments(false);

      const fileUrl = constructFileUrl(document.file);
      setSelectedDocument({
        ...document,
        file: fileUrl
      });
      setPdfUrl(fileUrl);

      const result = await analyzeDocument(document.id);
      if (!result.fee_perspective_analysis) {
        throw new Error('Invalid analysis data received');
      }

      setAnalysis(result.fee_perspective_analysis);
      setActiveView('chat'); // Switch to chat view when document is selected
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze document');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (document) => {
    try {
      const fileUrl = constructFileUrl(document.file);
      setSelectedDocument({
        ...document,
        file: fileUrl
      });
      setPdfUrl(fileUrl);
      setShowUpload(false);
      await handleDocumentSelect(document);
    } catch (err) {
      console.error('Upload handling error:', err);
      setError('Failed to process uploaded document');
    }
  };

  const renderViewToggle = () => {
    if (!selectedDocument) return null;

    return (
      <div className="view-toggle mb-3">
        <div className="btn-group w-100">
          <button
            className={`btn ${activeView === 'chat' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('chat')}
          >
            <i className="bi bi-chat-dots me-2"></i>
            Chat with Fee
          </button>
          <button
            className={`btn ${activeView === 'document' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('document')}
          >
            <i className="bi bi-file-text me-2"></i>
            Document View
          </button>
          <button
            className={`btn ${activeView === 'analysis' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveView('analysis')}
          >
            <i className="bi bi-graph-up me-2"></i>
            Analysis View
          </button>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="card">
          <div className="card-body">
            <Loading message="Analyzing document..." />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <h4 className="alert-heading d-flex align-items-center">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Analysis Failed
          </h4>
          <p className="mb-3">{error}</p>
          {selectedDocument && (
            <button
              className="btn btn-outline-danger"
              onClick={() => handleDocumentSelect(selectedDocument)}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Retry Analysis
            </button>
          )}
        </div>
      );
    }

    switch (activeView) {
      case 'document':
        return (
          <PDFViewer file={pdfUrl} />
        );
      case 'analysis':
        return (
          <AnalysisResults analysis={analysis} />
        );
      case 'chat':
      default:
        return (
          <div className={`chat-view h-100 ${showChatHistory ? 'with-history' : ''}`}>
            <ChatInterface 
              documentId={selectedDocument?.id}
              analysis={analysis}
              fullHeight={true}
              onDocumentUpload={handleUploadSuccess}
              showHistory={showChatHistory}
              onToggleHistory={() => setShowChatHistory(!showChatHistory)}
            />
          </div>
        );
    }
  };

  const renderUploadSection = () => {
    if (!showUpload) return null;

    return (
      <div className="upload-section">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">Upload New Document</h3>
              <button 
                className="btn btn-icon btn-sm btn-outline-secondary"
                onClick={() => setShowUpload(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          <div className="card-body">
            <FileUploadForm 
              onUploadSuccess={handleUploadSuccess}
              onClose={() => setShowUpload(false)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-layout">
      {/* Documents Sidebar */}
      <div className={`documents-overlay ${showDocuments ? 'visible' : ''}`}>
        <div className="documents-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Your Documents</h5>
            <button 
              className="btn btn-sm btn-icon btn-outline-secondary"
              onClick={() => onToggleDocuments(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div className="documents-content">
          <div className="p-3">
            <button 
              className="btn btn-primary w-100"
              onClick={() => {
                setShowUpload(true);
                onToggleDocuments(false);
              }}
            >
              <i className="bi bi-cloud-upload me-2"></i>
              Upload Document
            </button>
          </div>
          <div className="px-3">
            <DocumentList 
              onSelectDocument={handleDocumentSelect}
              selectedDocument={selectedDocument}
              isVisible={true}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-container">
        {renderUploadSection()}
        
        <div className="content-section">
          {renderViewToggle()}
          
          <div className="main-view">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;