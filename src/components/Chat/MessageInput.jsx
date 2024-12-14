import React, { useState, useRef } from 'react';
import { sendChatMessage, uploadDocument } from '../../services/api';

function MessageInput({ 
  documentId, 
  onMessageSent, 
  onUserMessage, 
  onDocumentUpload, 
  setIsTyping, 
  documentAnalysis 
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const currentMessage = message.trim();
    setMessage(''); // Clear input immediately

    // Create user message object
    const userMessage = {
      id: Date.now(),
      message: currentMessage,
      is_fee: false,
      timestamp: new Date().toISOString()
    };
    
    // Immediately display user message
    onUserMessage(userMessage);
    
    try {
      setError(null);
      setIsTyping(true);
      
      const response = await sendChatMessage(documentId, currentMessage);
      
      if (response.conversation && Array.isArray(response.conversation)) {
        // Only send Fee's response since we've already shown the user message
        const feeResponse = response.conversation.find(msg => msg.is_fee);
        if (feeResponse) {
          onMessageSent([feeResponse]);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setError(error.message || 'Failed to send message');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        message: "I'm sorry, I couldn't process your message. Please try again.",
        is_fee: true,
        timestamp: new Date().toISOString()
      };
      onMessageSent([errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create system message about upload start
      const uploadStartMessage = {
        id: Date.now(),
        message: `Uploading document: ${file.name}...`,
        is_fee: true,
        timestamp: new Date().toISOString()
      };
      onMessageSent([uploadStartMessage]);

      // Upload the document
      const uploadedDoc = await uploadDocument(file, file.name.replace('.pdf', ''));
      
      // Handle successful upload
      if (onDocumentUpload) {
        await onDocumentUpload(uploadedDoc);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload document');
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now(),
        message: `Failed to upload document: ${error.message}. Please try again.`,
        is_fee: true,
        timestamp: new Date().toISOString()
      };
      onMessageSent([errorMessage]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getPlaceholderText = () => {
    if (isUploading) return "Uploading document...";
    if (documentId) return "Ask about the document...";
    return "Chat with Fee or upload a document...";
  };

  return (
    <div className="message-input-container border-top mt-auto">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show m-2 py-2">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-circle me-2"></i>
            <span>{error}</span>
            <button 
              type="button" 
              className="btn-close ms-auto"
              onClick={() => setError(null)} 
              aria-label="Close"
            />
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-3">
        <div className="input-group">
          {/* File Upload Button */}
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload PDF document"
          >
            {isUploading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-file-earmark-pdf"></i>
            )}
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={isUploading}
          />

          {/* Message Input */}
          <input
            type="text"
            className="form-control"
            placeholder={getPlaceholderText()}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isUploading}
          />

          {/* Send Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isUploading || !message.trim()}
          >
            {isUploading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-send me-2"></i>
            )}
            <span className="d-none d-sm-inline">Send</span>
          </button>
        </div>

        {/* Upload Progress Indicator */}
        {isUploading && (
          <div className="progress mt-2" style={{ height: '2px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: '100%' }} 
            />
          </div>
        )}
      </form>
    </div>
  );
}

export default MessageInput;