import React from 'react';

function Header({ onToggleDocuments }) {
  return (
    <header className="bg-white border-bottom">
      <nav className="navbar navbar-expand-lg py-2">
        <div className="container-fluid d-flex align-items-center">
          <div className="logo d-flex align-items-center">
            {/* Use the correct path to the image */}
            <img
              src="/fee.png"
              alt="Fee SESMag Logo"
              className="me-2"
              style={{ height: '40px', width: 'auto' }}
            />
            <span className="navbar-brand fw-semibold">Fee SESMag</span>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 ms-auto"
            onClick={onToggleDocuments}
          >
            <i className="bi bi-list fs-5"></i>
            <span>Your Documents</span>
            <i className="bi bi-chevron-right ms-1"></i>
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;
