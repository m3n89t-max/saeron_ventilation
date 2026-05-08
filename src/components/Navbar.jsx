import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/appStore';
import {
  FaTachometerAlt, FaBoxes, FaFileAlt, FaExchangeAlt,
  FaWallet, FaHistory, FaChartPie, FaCog, FaBars, FaTimes, FaFilter
} from 'react-icons/fa';

const NAV_ITEMS = [
  { path: '/',                   icon: FaTachometerAlt, label: '대시보드' },
  { path: '/inventory',          icon: FaBoxes,         label: '재고관리' },
  { path: '/quotes',             icon: FaFileAlt,       label: '견적현황' },
  { path: '/sales-purchase',     icon: FaExchangeAlt,   label: '매입매출' },
  { path: '/finance',            icon: FaWallet,        label: '수입지출' },
  { path: '/transactions',       icon: FaHistory,       label: '입출고내역' },
  { path: '/filter-maintenance', icon: FaFilter,        label: '필터관리' },
  { path: '/reports',            icon: FaChartPie,      label: '리포트' },
  { path: '/settings',           icon: FaCog,           label: '설정' },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { filterCustomers, filterHistory } = useAppStore();

  const filterAlertCount = useMemo(() => {
    const today = new Date();
    return filterCustomers.filter((c) => {
      const hist = filterHistory.filter((h) => h.customerId === c.id).sort((a, b) => new Date(b.replaceDate) - new Date(a.replaceDate));
      const lastDate = hist[0]?.replaceDate || c.installDate || null;
      if (!lastDate) return false;
      const next = new Date(lastDate);
      next.setMonth(next.getMonth() + (c.cycleMonths || 6));
      const diffDays = Math.floor((next - today) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;
  }, [filterCustomers, filterHistory]);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <nav style={S.nav}>
        <div style={S.inner}>
          {/* Brand */}
          <Link to="/" style={S.brand}>
            <img src="/saeron-logo.png" alt="새론" style={S.logo} />
            <div>
              <div style={S.brandName}>(주)새론 환기시스템</div>
              <div style={S.brandSub}>통합관리시스템</div>
            </div>
          </Link>

          {/* Desktop menu */}
          <div style={S.menu}>
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={isActive(path) ? 'nav-active' : 'nav-link'}
                style={S.navItem}
              >
                <Icon size={15} />
                <span>{label}</span>
                {path === '/filter-maintenance' && filterAlertCount > 0 && (
                  <span style={{ background: '#C62828', color: '#fff', borderRadius: '10px', fontSize: '10px', fontWeight: '800', padding: '1px 6px', lineHeight: '16px' }}>
                    {filterAlertCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button style={S.mobileBtn} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div style={S.mobileMenu}>
            {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                style={{ ...S.mobileItem, ...(isActive(path) ? S.mobileItemActive : {}) }}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
};

const S = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderBottom: '3px solid #2C5AA0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  inner: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: '0 24px',
    height: '65px',
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logo: {
    height: '44px',
    width: 'auto',
    objectFit: 'contain',
  },
  brandName: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#2C5AA0',
    lineHeight: '1.2',
  },
  brandSub: {
    fontSize: '11px',
    color: '#718096',
    fontWeight: '500',
  },
  menu: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'nowrap',
    overflowX: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 12px',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    color: '#4A5568',
    transition: 'all 0.15s',
  },
  mobileBtn: {
    display: 'none',
    border: 'none',
    background: 'none',
    fontSize: '20px',
    color: '#2C5AA0',
    cursor: 'pointer',
    padding: '8px',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid #E2E8F0',
    padding: '8px 0',
    backgroundColor: '#fff',
  },
  mobileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4A5568',
    textDecoration: 'none',
  },
  mobileItemActive: {
    backgroundColor: '#EBF4FF',
    color: '#2C5AA0',
  },
};

export default Navbar;
