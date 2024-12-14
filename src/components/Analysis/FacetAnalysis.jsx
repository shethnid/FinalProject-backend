import React, { useState } from 'react';

function FacetAnalysis({ facet, data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if there's any content to display
  const hasContent = Object.values(data).some(items => items.length > 0);
  if (!hasContent) return null;

  const getIconForCategory = (category) => {
    switch (category) {
      case 'assumptions':
        return 'bi-diagram-2';
      case 'potential_issues':
        return 'bi-exclamation-triangle';
      case 'recommendations':
        return 'bi-lightbulb';
      default:
        return 'bi-card-text';
    }
  };

  const getColorForCategory = (category) => {
    switch (category) {
      case 'assumptions':
        return 'text-primary';
      case 'potential_issues':
        return 'text-danger';
      case 'recommendations':
        return 'text-success';
      default:
        return 'text-body';
    }
  };

  return (
    <div className="card mb-3 border">
      <div 
        className="card-header bg-light cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="h6 mb-0 text-capitalize">
            {facet.replace(/_/g, ' ')} Analysis
          </h5>
          <button 
            className="btn btn-link btn-sm p-0 text-muted"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="card-body">
          {Object.entries(data).map(([category, items]) => {
            if (!items.length) return null;
            
            return (
              <div key={category} className="mb-3">
                <h6 className="text-capitalize mb-3 d-flex align-items-center">
                  <i className={`bi ${getIconForCategory(category)} ${getColorForCategory(category)} me-2`}></i>
                  {category.replace(/_/g, ' ')}
                </h6>
                <div className="list-group">
                  {items.map((item, index) => (
                    <div 
                      key={index} 
                      className="list-group-item d-flex align-items-start gap-2"
                    >
                      <i className={`bi ${getIconForCategory(category)} ${getColorForCategory(category)} mt-1`}></i>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FacetAnalysis;