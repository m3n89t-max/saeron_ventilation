import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Quotes from './pages/Quotes';
import SalesPurchase from './pages/SalesPurchase';
import Finance from './pages/Finance';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import useAppStore from './store/appStore';

function App() {
  const { _loaded, initSync } = useAppStore();

  useEffect(() => {
    let cleanup;
    initSync().then((fn) => { cleanup = fn; });
    return () => { if (cleanup) cleanup(); };
  }, []);

  if (!_loaded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F7FAFC', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#2C5AA0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#718096', fontSize: '14px', fontWeight: '600' }}>데이터 불러오는 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 68px)' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/sales-purchase" element={<SalesPurchase />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
