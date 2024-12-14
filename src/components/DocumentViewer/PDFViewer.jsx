import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFViewer({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('File changed:', file);
    setError(null);
    setLoading(true);
    setPageNumber(1);
    setNumPages(null);
  }, [file]);

  useEffect(() => {
    console.log('Page number changed:', pageNumber);
  }, [pageNumber]);

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    console.log('PDF loaded successfully with', nextNumPages, 'pages');
    setNumPages(nextNumPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err) => {
    console.error('PDF Load Error:', err);
    setError('Failed to load PDF. Please ensure the file is accessible and try again.');
    setLoading(false);
  };

  const onPageLoadSuccess = () => {
    console.log('Page loaded successfully:', pageNumber);
  };

  const onPageLoadError = (err) => {
    console.error('Page Load Error:', err);
  };

  const previousPage = () => {
    if (pageNumber <= 1) return;
    console.log('Going to previous page from', pageNumber);
    setPageNumber(pageNumber - 1);
  };

  const nextPage = () => {
    if (pageNumber >= numPages) return;
    console.log('Going to next page from', pageNumber);
    setPageNumber(pageNumber + 1);
  };

  if (!file) {
    return (
      <div className="pdf-viewer-container">
        <div className="card h-100">
          <div className="card-body d-flex flex-column align-items-center justify-content-center text-center py-5">
            <div className="mb-4">
              <i className="bi bi-file-earmark-pdf fs-1 text-muted"></i>
            </div>
            <h3 className="h5 mb-2">No Document Selected</h3>
            <p className="text-muted mb-0">Select a document from the list to view its contents</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container">
      <div className="card h-100">
        <div className="card-header bg-light py-2">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <i className="bi bi-file-earmark-text me-2"></i>
              <h2 className="h6 mb-0">Document Preview</h2>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="btn-group">
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
                >
                  <i className="bi bi-zoom-out"></i>
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => setScale(1.0)}
                >
                  100%
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => setScale(prev => Math.min(2, prev + 0.1))}
                >
                  <i className="bi bi-zoom-in"></i>
                </button>
              </div>
              <div className="btn-group">
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={previousPage}
                  disabled={pageNumber <= 1 || loading}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  disabled
                >
                  {loading ? '--' : `${pageNumber} / ${numPages || '--'}`}
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={nextPage}
                  disabled={!numPages || pageNumber >= numPages || loading}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0">
          <div className="pdf-viewer">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading PDF...</span>
                  </div>
                </div>
              }
              error={
                <div className="alert alert-danger m-4">
                  <h6 className="alert-heading mb-1">Failed to Load PDF</h6>
                  <p className="mb-0">{error || 'Please ensure the file is accessible and try again.'}</p>
                </div>
              }
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
                cMapPacked: true,
                withCredentials: true
              }}
            >
              {!loading && (
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="pdf-page bg-white"
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  loading={
                    <div className="text-center p-4">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading page...</span>
                      </div>
                    </div>
                  }
                />
              )}
            </Document>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;