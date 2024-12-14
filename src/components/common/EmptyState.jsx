import React from 'react';

function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  actionLabel = 'Get Started'
}) {
  return (
    <div className="card text-center p-5">
      <div className="mb-4">
        <i className={`bi bi-${icon} fs-1 text-muted`}></i>
      </div>
      <h3 className="h5 mb-3">{title}</h3>
      {description && (
        <p className="text-muted mb-4">{description}</p>
      )}
      {action && (
        <button 
          className="btn btn-primary"
          onClick={action}
        >
          <i className="bi bi-upload me-2"></i>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;