import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/common/Header';
import Home from './pages/Home';

function App() {
  const [showDocuments, setShowDocuments] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Header onToggleDocuments={() => setShowDocuments(!showDocuments)} />
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  showDocuments={showDocuments}
                  onToggleDocuments={setShowDocuments}
                />
              }
            />
          </Routes>
        </main>
        <footer className="py-3 bg-light">
          <div className="container text-center">
            <p className="mb-0 text-muted">Fee SESMag Document Analyzer</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
