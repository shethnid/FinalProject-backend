import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { getDocumentConversations, getChatHistory } from '../../services/api';
import Loading from '../common/Loading';

function ChatInterface({ documentId, analysis, fullHeight, onDocumentUpload }) {
  const [activeTab, setActiveTab] = useState('general');
  const [generalMessages, setGeneralMessages] = useState([]);
  const [documentMessages, setDocumentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Initialize general chat with welcome message
  useEffect(() => {
    if (generalMessages.length === 0) {
      setGeneralMessages([{
        id: 'welcome',
        message: "Hello! I'm Fee. You can start chatting with me right away, or upload a document for us to discuss. What would you like to do?",
        is_fee: true,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  // Load document conversations when document changes
  useEffect(() => {
    if (documentId) {
      loadDocumentConversations();
    }
  }, [documentId]);

  // Load chat history
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadDocumentConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDocumentConversations(documentId);
      
      if (response && Array.isArray(response)) {
        setDocumentMessages(response);
        // Don't automatically switch tabs here
      } else {
        throw new Error('Invalid conversation data received');
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversation history');
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await getChatHistory(null, currentPage);
      if (response.results) {
        setChatHistory(prev => [...prev, ...response.results]);
        setHasMoreHistory(response.next !== null);
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleNewMessage = (newMessages) => {
    if (activeTab === 'general') {
      setGeneralMessages(prev => [...prev, ...newMessages]);
    } else {
      setDocumentMessages(prev => [...prev, ...newMessages]);
    }
  };

  const handleUserMessage = (userMessage) => {
    if (activeTab === 'general') {
      setGeneralMessages(prev => [...prev, userMessage]);
    } else {
      setDocumentMessages(prev => [...prev, userMessage]);
    }
  };

  const handleDocumentUpload = async (document) => {
    try {
      if (onDocumentUpload) {
        await onDocumentUpload(document);
      }

      const systemMessage = {
        id: Date.now(),
        message: `Document "${document.title}" has been uploaded successfully. I'll analyze it and we can discuss it.`,
        is_fee: true,
        timestamp: new Date().toISOString()
      };
      
      handleNewMessage([systemMessage]);
      setActiveTab('document'); // Switch to document tab after upload
    } catch (error) {
      console.error('Document upload handling error:', error);
      
      const errorMessage = {
        id: Date.now(),
        message: `There was an error processing the document: ${error.message}`,
        is_fee: true,
        timestamp: new Date().toISOString()
      };
      
      handleNewMessage([errorMessage]);
    }
  };

  const renderChatHistory = () => (
    <div className="chat-history-sidebar">
      <div className="chat-history-header">
        <h6 className="mb-0">Chat History</h6>
      </div>
      <div className="chat-history-list">
        {chatHistory.map((chat) => (
          <div key={chat.id} className="chat-history-item">
            <div className="chat-preview">
              <small className="text-muted">
                {new Date(chat.timestamp).toLocaleDateString()}
              </small>
              <p className="mb-0 text-truncate">{chat.message}</p>
            </div>
          </div>
        ))}
        {hasMoreHistory && (
          <button 
            className="btn btn-link btn-sm w-100"
            onClick={loadChatHistory}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="card-header bg-white border-bottom">
      <div className="d-flex justify-content-between align-items-center">
        <ul className="nav nav-tabs card-header-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <i className="bi bi-chat me-2"></i>
              General Chat
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'document' ? 'active' : ''}`}
              onClick={() => setActiveTab('document')}
              disabled={!documentId}
            >
              <i className="bi bi-file-text me-2"></i>
              Document Discussion
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <Loading message="Loading conversation..." />;
    }

    if (error) {
      return (
        <div className="alert alert-danger m-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-exclamation-circle me-2"></i>
            <span>{error}</span>
            <button 
              className="btn btn-sm btn-outline-danger ms-auto"
              onClick={loadDocumentConversations}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="chat-main-content">
        {renderChatHistory()}
        <div className="chat-messages-container">
          <MessageList 
            messages={activeTab === 'general' ? generalMessages : documentMessages}
            isTyping={isTyping}
            documentContext={activeTab === 'document'}
          />
          <MessageInput 
            documentId={activeTab === 'document' ? documentId : null}
            onMessageSent={handleNewMessage}
            onUserMessage={handleUserMessage}
            onDocumentUpload={handleDocumentUpload}
            setIsTyping={setIsTyping}
            documentAnalysis={activeTab === 'document' ? analysis : null}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`card border-0 shadow-sm ${fullHeight ? 'h-100' : ''}`}>
      {renderHeader()}
      
      <div className="card-body p-0">
        <div className={`chat-container ${fullHeight ? 'chat-container-full' : ''}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;