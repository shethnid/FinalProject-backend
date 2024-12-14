import React from 'react';

function MarkdownMessage({ text }) {
  const formatMarkdown = (text) => {
    // Handle bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle lists
    text = text.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Handle line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  };

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(text) }}
    />
  );
}

export default MarkdownMessage;