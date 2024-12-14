import React from 'react';

function InclusivityScore({ score }) {
  const percentage = score * 100;
  
  const getScoreInfo = (score) => {
    if (score >= 0.7) {
      return {
        color: 'success',
        icon: 'check-circle-fill',
        message: 'Good inclusivity practices detected',
        description: 'The document demonstrates strong consideration for accessibility and inclusivity.'
      };
    }
    if (score >= 0.4) {
      return {
        color: 'warning',
        icon: 'exclamation-circle-fill',
        message: 'Some inclusivity concerns detected',
        description: 'There are areas where accessibility and inclusivity could be improved.'
      };
    }
    return {
      color: 'danger',
      icon: 'x-circle-fill',
      message: 'Significant inclusivity issues detected',
      description: 'Major improvements are needed to make the content more accessible and inclusive.'
    };
  };

  const scoreInfo = getScoreInfo(score);

  return (
    <div className="card border-0 bg-light">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-4 text-center mb-3 mb-md-0">
            <div className={`display-4 text-${scoreInfo.color} mb-2`}>
              {percentage.toFixed(1)}%
            </div>
            <div className="h6 text-muted mb-0">Inclusivity Score</div>
          </div>
          
          <div className="col-md-8">
            <div className={`alert alert-${scoreInfo.color} mb-3`}>
              <div className="d-flex align-items-center">
                <i className={`bi bi-${scoreInfo.icon} me-2 fs-5`}></i>
                <div>
                  <div className="fw-bold">{scoreInfo.message}</div>
                  <div className="small">{scoreInfo.description}</div>
                </div>
              </div>
            </div>
            
            <div className="progress" style={{ height: '0.5rem' }}>
              <div
                className={`progress-bar bg-${scoreInfo.color}`}
                role="progressbar"
                style={{ width: `${percentage}%` }}
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InclusivityScore;