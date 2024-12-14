import React, { useEffect, useRef } from 'react';
import MarkdownMessage from './MarkdownMessage';

function MessageList({ messages, isTyping, documentContext }) {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    const isScrolledToBottom = container && 
      (container.scrollHeight - container.clientHeight <= container.scrollTop + 100);
    
    if (isScrolledToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const renderMessageContent = (message) => {
    // Handle system messages (like document uploads)
    if (message.is_system) {
      return (
        <div className="system-message text-center">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            {message.message}
          </small>
        </div>
      );
    }

    // Regular message content
    return (
      <div 
        className={`message-bubble d-inline-block p-3 rounded-3 ${
          message.is_fee 
            ? 'fee bg-primary text-white' 
            : 'bg-light border'
        }`}
      >
        <div className="message-header mb-2">
          <small className={message.is_fee ? 'text-white opacity-75' : 'text-muted'}>
            {message.is_fee ? (
              <>
                <i className="bi bi-robot me-1"></i>
                Fee
              </>
            ) : (
              <>
                <i className="bi bi-person me-1"></i>
                You
              </>
            )}
            <span className="ms-2">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit'
              })}
            </span>
          </small>
        </div>
        <div className="message-content">
          {message.is_fee ? (
            <MarkdownMessage text={message.message} />
          ) : (
            message.message
          )}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => (
    <div className="message mb-3">
      <div className="message-bubble fee bg-primary text-white d-inline-block p-3 rounded-3">
        <div className="message-header mb-2">
          <small className="text-white opacity-75">
            <i className="bi bi-robot me-1"></i>
            Fee
          </small>
        </div>
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center p-5">
      <i className="bi bi-chat-dots fs-1 text-muted mb-3 d-block"></i>
      <h5 className="text-muted fw-normal">Start a Conversation</h5>
      <p className="text-muted mb-0 small">
        {documentContext 
          ? "Ask Fee about the document analysis"
          : "Chat with Fee or upload a document to analyze"
        }
      </p>
    </div>
  );

  const renderDocumentHeader = () => (
    documentContext && (
      <div className="text-center p-3 border-bottom bg-light">
        <small className="text-muted">
          <i className="bi bi-file-earmark-text me-1"></i>
          Discussing document analysis
        </small>
      </div>
    )
  );

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="messages-container">
        {renderDocumentHeader()}
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="messages-container" ref={messagesContainerRef}>
      {renderDocumentHeader()}
      
      {messages.map((msg, index) => (
        <div
          key={msg.id || index}
          className={`message mb-3 ${msg.is_system ? 'my-2' : msg.is_fee ? '' : 'text-end'}`}
        >
          {renderMessageContent(msg)}
        </div>
      ))}
      
      {isTyping && renderTypingIndicator()}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;