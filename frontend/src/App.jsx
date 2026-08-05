import { useState } from 'react';
import ScannerPage from './pages/ScannerPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ResultsPage from './pages/ResultsPage';
import Nav from './components/Nav';
import PageTransition from './components/PageTransition';

// Pages: 'scanner' | 'howitworks' | 'results'
export default function App() {
  const [page, setPage] = useState('scanner');
  const [transitioning, setTransitioning] = useState(false);
  const [scanResults, setScanResults] = useState(null);

  function navigate(to) {
    setTransitioning(true);
    setTimeout(() => {
      setPage(to);
      setTransitioning(false);
    }, 350);
  }

  function openResults(results) {
    setScanResults(results);
    navigate('results');
  }

  function closeResults() {
    navigate('scanner');
  }

  return (
    <>
      <PageTransition active={transitioning} />

      {page !== 'results' && (
        <Nav currentPage={page} onNavigate={navigate} />
      )}

      {page === 'scanner' && (
        <ScannerPage onNavigate={navigate} onResults={openResults} />
      )}
      {page === 'howitworks' && (
        <HowItWorksPage onNavigate={navigate} />
      )}
      {page === 'results' && (
        <ResultsPage
          results={scanResults}
          onClose={closeResults}
          onNewScan={closeResults}
        />
      )}
    </>
  );
}
