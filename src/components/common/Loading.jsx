function Loading({ message = 'Loading...' }) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-5">
        <div className="spinner-border text-primary loading-spinner mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mb-0">{message}</p>
      </div>
    );
  }
    
  export default Loading;