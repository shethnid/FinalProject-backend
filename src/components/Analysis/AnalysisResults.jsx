import React, { useState } from 'react';
import FacetAnalysis from './FacetAnalysis';
import InclusivityScore from './InclusivityScore';

function AnalysisResults({ analysis }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!analysis) return null;

  const renderOverallAssessment = () => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-body">
        <div className="mb-4">
          <InclusivityScore score={analysis.overall_assessment.inclusivity_score} />
        </div>

        {/* Score Justification */}
        {analysis.overall_assessment.score_justification && (
          <div className="mb-4">
            <h4 className="h6 mb-3">Score Justification</h4>
            <div className="alert alert-info">
              <i className="bi bi-info-circle-fill me-2"></i>
              {analysis.overall_assessment.score_justification}
            </div>
          </div>
        )}

        {/* Major Concerns */}
        {analysis.overall_assessment.major_concerns?.length > 0 && (
          <div className="mb-4">
            <h4 className="h6 mb-3 d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
              Major Concerns
            </h4>
            <div className="list-group">
              {analysis.overall_assessment.major_concerns.map((concern, index) => (
                <div key={index} className="list-group-item list-group-item-danger d-flex align-items-start gap-2">
                  <i className="bi bi-exclamation-circle-fill mt-1"></i>
                  <span>{concern}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positive Aspects */}
        {analysis.overall_assessment.positive_aspects?.length > 0 && (
          <div className="mb-4">
            <h4 className="h6 mb-3 d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success me-2"></i>
              Positive Aspects
            </h4>
            <div className="list-group">
              {analysis.overall_assessment.positive_aspects.map((aspect, index) => (
                <div key={index} className="list-group-item list-group-item-success d-flex align-items-start gap-2">
                  <i className="bi bi-check-circle-fill mt-1"></i>
                  <span>{aspect}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderFeesPerspective = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="alert alert-primary d-flex align-items-center mb-4">
          <i className="bi bi-person-workspace me-3 fs-4"></i>
          <div>
            <h4 className="h6 mb-1">Fee's Analysis Lens</h4>
            <p className="mb-0">Analysis provided from a high-SES technology user perspective with advanced access, 
            high confidence, and strong technical literacy.</p>
          </div>
        </div>

        {/* Technology Requirements Table */}
        <div className="mb-4">
          <h4 className="h6 mb-3">Technology Requirements Analysis</h4>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: '20%' }}>Category</th>
                  <th scope="col" style={{ width: '40%' }}>Fee's Perspective</th>
                  <th scope="col" style={{ width: '40%' }}>Inclusivity Considerations</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analysis.fee_perspective.expectations || {}).map(([aspect, data]) => (
                  <tr key={aspect}>
                    <td className="text-capitalize fw-medium">
                      {aspect.replace(/_/g, ' ')}
                    </td>
                    <td>{data.perspective}</td>
                    <td>{data.consideration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Facet Analysis */}
        {Object.entries(analysis.facet_analysis || {}).map(([facet, data]) => (
          <FacetAnalysis key={facet} facet={facet} data={data} />
        ))}

        {/* Recommendations */}
        {analysis.fee_perspective.recommendations?.length > 0 && (
          <div className="mt-4">
            <h4 className="h6 mb-3 d-flex align-items-center">
              <i className="bi bi-lightbulb-fill text-warning me-2"></i>
              Fee's Recommendations
            </h4>
            <div className="list-group">
              {analysis.fee_perspective.recommendations.map((rec, index) => (
                <div key={index} className="list-group-item d-flex align-items-start gap-2">
                  <i className="bi bi-arrow-right-circle-fill text-primary mt-1"></i>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="analysis-results">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="bi bi-clipboard-data me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'fee' ? 'active' : ''}`}
                onClick={() => setActiveTab('fee')}
              >
                <i className="bi bi-person-workspace me-2"></i>
                Fee's Perspective
              </button>
            </li>
          </ul>
        </div>
        
        <div className="card-body">
          <div className="tab-content">
            {activeTab === 'overview' && renderOverallAssessment()}
            {activeTab === 'fee' && renderFeesPerspective()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisResults;