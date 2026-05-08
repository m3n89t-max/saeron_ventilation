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
import FilterMaintenance from './pages/FilterMaintenance';
import useAppStore from './store/appStore';

function App() {
  const { _loaded, initSync, filterCustomers, filterHistory } = useAppStore();

  useEffect(() => {
    let cleanup;
    initSync().then((fn) => { cleanup = fn; });
    return () => { if (cleanup) cleanup(); };
  }, []);

  // 브라우저 알림 (데이터 로드 후 1회 실행)
  useEffect(() => {
    if (!_loaded || filterCustomers.length === 0) return;
    const today = new Date();
    const alerts = filterCustomers.filter((c) => {
      const hist = filterHistory.filter((h) => h.customerId === c.id).sort((a, b) => new Date(b.replaceDate) - new Date(a.replaceDate));
      const lastDate = hist[0]?.replaceDate || c.installDate || null;
      if (!lastDate) return false;
      const next = new Date(lastDate);
      next.setMonth(next.getMonth() + (c.cycleMonths || 6));
      return Math.floor((next - today) / (1000 * 60 * 60 * 24)) <= 30;
    });
    if (alerts.length === 0) return;
    if (!('Notification' in window)) return;
    const send = () => {
      new Notification('새론 환기시스템 — 필터 교체 알림', {
        body: `교체가 필요하거나 임박한 고객 ${alerts.length}건이 있습니다.\n${alerts.slice(0, 3).map((c) => c.name).join(', ')}${alerts.length > 3 ? ' 외' : ''}`,
        icon: '/saeron-logo.png',
      });
    };
    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => { if (p === 'granted') send(); });
    }
  }, [_loaded]);

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
            <Route path="/filter-maintenance" element={<FilterMaintenance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
