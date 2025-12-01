import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBox, FaChartBar, FaHistory, FaCog, FaWarehouse } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <FaWarehouse />, label: '대시보드' },
    { path: '/inventory', icon: <FaBox />, label: '재고 관리' },
    { path: '/transactions', icon: <FaHistory />, label: '입출고 내역' },
    { path: '/reports', icon: <FaChartBar />, label: '리포트' },
    { path: '/settings', icon: <FaCog />, label: '설정' },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.brandLink}>
          <div style={styles.brand}>
            <img 
              src="/saeron-logo.png" 
              alt="새론 로고" 
              style={styles.logo}
            />
            <h1 style={styles.brandText}>(주)새론 재고관리</h1>
          </div>
        </Link>
        <div style={styles.menu}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'nav-item-active' : 'nav-item'}
              style={{
                ...styles.menuItem,
                ...(location.pathname === item.path ? styles.menuItemActive : {}),
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: '#ffffff',
    color: '#333',
    padding: '0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    borderBottom: '3px solid #7AB547',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
  },
  brandLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 0',
  },
  logo: {
    height: '50px',
    width: 'auto',
    objectFit: 'contain',
  },
  brandIcon: {
    fontSize: '28px',
    color: '#7AB547',
  },
  brandText: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    color: '#2C5AA0',
  },
  menu: {
    display: 'flex',
    gap: '4px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 20px',
    color: '#555',
    textDecoration: 'none',
    transition: 'all 0.3s',
    borderRadius: '8px',
    fontWeight: '500',
  },
  menuItemActive: {
    backgroundColor: '#F0F7FF',
    color: '#2C5AA0',
    borderBottom: '3px solid #2C5AA0',
  },
  menuIcon: {
    fontSize: '18px',
  },
};

export default Navbar;
