import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import SalesManagement from './pages/SalesManagement';
import SalesManagementIntegrated from './pages/SalesManagementIntegrated';
import Quotes from './pages/Quotes';
import MonthlyClosing from './pages/MonthlyClosing';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <div style={styles.app}>
        <Navbar />
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<SalesManagementIntegrated />} />
            <Route path="/sales-management" element={<SalesManagement />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/monthly-closing" element={<MonthlyClosing />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFB',
  },
  main: {
    minHeight: 'calc(100vh - 140px)',
  },
};

export default App;
