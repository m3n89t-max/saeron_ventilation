import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMoneyBillWave, FaShoppingCart, FaBoxes, FaFileAlt,
  FaExclamationTriangle, FaArrowRight, FaChartLine,
  FaCreditCard, FaWarehouse, FaUniversity, FaPen, FaCheck, FaTimes,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatDate, getPaymentStatusLabel, getPaymentStatusClass, getQuoteStatusLabel, getQuoteStatusClass } from '../utils/formatters';

const Dashboard = () => {
  const {
    products, salesOrders, purchaseOrders, quotes,
    expenses, otherIncome, getLowStockProducts,
    getTotalInventoryValue, getTotalUnpaidReceivable, getTotalUnpaidPayable,
    getMonthSalesRevenue, getMonthPurchaseCost, getMonthOpExpense,
    bankBalance, setBankBalance,
  } = useAppStore();

  const now = new Date();
  const cy = now.getFullYear(), cm = now.getMonth() + 1;

  // 월 선택 상태
  const [viewYear, setViewYear] = useState(cy);
  const [viewMonth, setViewMonth] = useState(cm);
  const isCurrentMonth = viewYear === cy && viewMonth === cm;

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };
  const goCurrentMonth = () => { setViewYear(cy); setViewMonth(cm); };

  // 통장잔고 편집 상태
  const [editingBalance, setEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');

  const startEdit = () => {
    setBalanceInput(bankBalance > 0 ? String(bankBalance) : '');
    setEditingBalance(true);
  };
  const saveBalance = () => {
    const val = parseInt(balanceInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 0) setBankBalance(val);
    setEditingBalance(false);
  };
  const cancelEdit = () => setEditingBalance(false);

  const fmt = (v) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}억`;
    if (v >= 10000) return `${Math.floor(v / 10000).toLocaleString('ko-KR')}만`;
    return v.toLocaleString('ko-KR');
  };

  const stats = useMemo(() => {
    const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
    const prevM = viewMonth === 1 ? 12 : viewMonth - 1;

    const thisMonthSales = getMonthSalesRevenue(viewYear, viewMonth);
    const thisMonthPurchase = getMonthPurchaseCost(viewYear, viewMonth);
    const thisMonthOpExp = getMonthOpExpense(viewYear, viewMonth);
    const lastMonthSales = getMonthSalesRevenue(prevY, prevM);

    const lowStock = getLowStockProducts();
    const pendingQuotes = quotes.filter((q) => q.status === 'pending');
    const unpaidReceivable = getTotalUnpaidReceivable();
    const unpaidPayable = getTotalUnpaidPayable();
    const inventoryValue = getTotalInventoryValue();

    return {
      thisMonthSales, thisMonthPurchase, thisMonthOpExp, lastMonthSales,
      lowStock, pendingQuotes, unpaidReceivable, unpaidPayable, inventoryValue,
      netProfit: thisMonthSales - thisMonthPurchase - thisMonthOpExp,
    };
  }, [products, salesOrders, purchaseOrders, quotes, expenses, otherIncome, viewYear, viewMonth]);

  // 선택월 기준 최근 6개월 차트 데이터
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(viewYear, viewMonth - 1 - (5 - i), 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const sales = getMonthSalesRevenue(y, m);
      const cost = getMonthPurchaseCost(y, m) + getMonthOpExpense(y, m);
      return { label: `${m}월`, sales, cost, profit: sales - cost };
    });
  }, [salesOrders, purchaseOrders, expenses, otherIncome, viewYear, viewMonth]);

  // 선택월 매출/견적
  const viewStart = new Date(viewYear, viewMonth - 1, 1);
  const viewEnd = new Date(viewYear, viewMonth, 0, 23, 59, 59);

  const recentSales = useMemo(() => {
    const filtered = salesOrders.filter((o) => {
      const d = new Date(o.orderDate); return d >= viewStart && d <= viewEnd;
    }).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);
    if (filtered.length > 0) return filtered;
    return [...salesOrders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).slice(0, 5);
  }, [salesOrders, viewYear, viewMonth]);

  const recentQuotes = useMemo(() => {
    const filtered = quotes.filter((q) => {
      const d = new Date(q.createdAt); return d >= viewStart && d <= viewEnd;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    if (filtered.length > 0) return filtered;
    return [...quotes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [quotes, viewYear, viewMonth]);

  const lowStockList = getLowStockProducts().slice(0, 6);

  const monthLabel = `${viewYear}년 ${viewMonth}월`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">대시보드</h2>
          <p className="page-subtitle">{monthLabel} 기준</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 월 선택 내비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', borderRadius: '8px', padding: '5px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5568', padding: '4px 6px', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
              <FaChevronLeft size={11} />
            </button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C', minWidth: '88px', textAlign: 'center' }}>
              {monthLabel}
            </span>
            <button onClick={nextMonth} disabled={isCurrentMonth}
              style={{ background: 'none', border: 'none', cursor: isCurrentMonth ? 'default' : 'pointer', color: isCurrentMonth ? '#CBD5E0' : '#4A5568', padding: '4px 6px', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
              <FaChevronRight size={11} />
            </button>
          </div>
          {!isCurrentMonth && (
            <button onClick={goCurrentMonth} style={{ padding: '7px 14px', background: '#EBF4FF', color: '#2C5AA0', border: '1px solid #BEE3F8', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              이번달로
            </button>
          )}
          <Link to="/sales-purchase" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#2C5AA0', color: '#fff', borderRadius: '7px', fontSize: '13px', fontWeight: '600' }}>
            <FaChartLine size={13} /> 매입매출 관리
          </Link>
        </div>
      </div>

      {/* 통장 잔고 카드 */}
      <div style={{ background: 'linear-gradient(135deg, #1A365D 0%, #2C5AA0 100%)', borderRadius: '12px', padding: '20px 28px', marginBottom: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(44,90,160,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaUniversity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.75, marginBottom: '4px' }}>현재 통장 잔고</div>
            {editingBalance ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveBalance(); if (e.key === 'Escape') cancelEdit(); }}
                  placeholder="금액 입력 (원)"
                  autoFocus
                  style={{ fontSize: '20px', fontWeight: '800', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: '7px', color: '#fff', padding: '4px 10px', width: '180px', outline: 'none' }}
                />
                <button onClick={saveBalance} style={{ background: '#48BB78', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}><FaCheck size={13} /></button>
                <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}><FaTimes size={13} /></button>
              </div>
            ) : (
              <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                ₩{fmt(bankBalance)}
                <span style={{ fontSize: '13px', fontWeight: '400', opacity: 0.7, marginLeft: '8px' }}>({bankBalance.toLocaleString('ko-KR')}원)</span>
              </div>
            )}
          </div>
        </div>
        {!editingBalance && (
          <button onClick={startEdit} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '10px 18px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}>
            <FaPen size={11} /> 잔고 수정
          </button>
        )}
      </div>

      {/* KPI 카드 행 1 */}
      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard
          icon={<FaMoneyBillWave />}
          title={`${viewMonth}월 매출`}
          value={`₩${fmt(stats.thisMonthSales)}`}
          sub={`전월 ${formatCurrency(stats.lastMonthSales)}`}
          color="#3D8B37"
        />
        <StatsCard
          icon={<FaCreditCard />}
          title="미수금 (매출채권)"
          value={`₩${fmt(stats.unpaidReceivable)}`}
          sub="아직 입금되지 않은 금액"
          color="#C62828"
        />
        <StatsCard
          icon={<FaShoppingCart />}
          title={`${viewMonth}월 매입`}
          value={`₩${fmt(stats.thisMonthPurchase)}`}
          sub={`운영비 ${formatCurrency(stats.thisMonthOpExp)}`}
          color="#2C5AA0"
        />
        <StatsCard
          icon={<FaWarehouse />}
          title="재고 총액"
          value={`₩${fmt(stats.inventoryValue)}`}
          sub={`${products.length}개 제품 보유`}
          color="#6A1B9A"
        />
      </div>

      {/* KPI 카드 행 2 */}
      <div className="stats-grid-4" style={{ marginBottom: '24px' }}>
        <StatsCard
          icon={<FaChartLine />}
          title={`${viewMonth}월 순이익`}
          value={`₩${fmt(Math.abs(stats.netProfit))}`}
          sub={stats.netProfit >= 0 ? '흑자' : '적자'}
          color={stats.netProfit >= 0 ? '#3D8B37' : '#C62828'}
        />
        <StatsCard
          icon={<FaBoxes />}
          title="부족 재고"
          value={`${stats.lowStock.length}개 제품`}
          sub="최소수량 이하 제품"
          color={stats.lowStock.length > 0 ? '#E65100' : '#3D8B37'}
        />
        <StatsCard
          icon={<FaFileAlt />}
          title="검토중 견적"
          value={`${stats.pendingQuotes.length}건`}
          sub={`총 ${formatCurrency(stats.pendingQuotes.reduce((s, q) => s + q.totalAmount, 0))}`}
          color="#FB8C00"
        />
        <StatsCard
          icon={<FaCreditCard />}
          title="미지급금 (매입채무)"
          value={`₩${fmt(stats.unpaidPayable)}`}
          sub="지급하지 않은 매입금액"
          color="#546E7A"
        />
      </div>

      {/* 매출/비용 차트 */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A202C' }}>월별 매출 / 비용 현황 (최근 6개월)</h3>
          <Link to="/reports" style={{ fontSize: '12px', color: '#2C5AA0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            상세 리포트 <FaArrowRight size={10} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#718096' }} />
            <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#718096' }} />
            <Tooltip
              formatter={(v, name) => [formatCurrency(v), name === 'sales' ? '매출' : name === 'cost' ? '비용' : '순이익']}
              labelStyle={{ fontWeight: '700' }}
            />
            <Legend formatter={(v) => ({ sales: '매출', cost: '비용(매입+운영)', profit: '순이익' }[v] || v)} />
            <Bar dataKey="sales" fill="#3D8B37" name="sales" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cost" fill="#C62828" name="cost" radius={[3, 3, 0, 0]} />
            <Bar dataKey="profit" fill="#2C5AA0" name="profit" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 하단 2열 */}
      <div className="two-col" style={{ marginBottom: '20px' }}>
        {/* 매출 현황 */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{monthLabel} 매출 현황</h3>
            <Link to="/sales-purchase" style={{ fontSize: '12px', color: '#2C5AA0', fontWeight: '600' }}>전체보기</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>거래처</th>
                <th className="text-right">금액</th>
                <th>수금</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#718096', fontSize: '13px' }}>해당 월 매출 없음</td></tr>
              ) : recentSales.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{o.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>{formatDate(o.orderDate)}</div>
                  </td>
                  <td className="text-right" style={{ fontWeight: '700', color: '#1A202C' }}>
                    {formatCurrency(o.totalAmount)}
                  </td>
                  <td>
                    <span className={`badge ${getPaymentStatusClass(o.paymentStatus)}`}>
                      {getPaymentStatusLabel(o.paymentStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 견적 현황 */}
        <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{monthLabel} 견적 현황</h3>
            <Link to="/quotes" style={{ fontSize: '12px', color: '#2C5AA0', fontWeight: '600' }}>전체보기</Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>거래처</th>
                <th className="text-right">금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {recentQuotes.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#718096', fontSize: '13px' }}>해당 월 견적 없음</td></tr>
              ) : recentQuotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{q.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>{formatDate(q.createdAt)}</div>
                  </td>
                  <td className="text-right" style={{ fontWeight: '700', color: '#1A202C' }}>
                    {formatCurrency(q.totalAmount)}
                  </td>
                  <td>
                    <span className={`badge ${getQuoteStatusClass(q.status)}`}>
                      {getQuoteStatusLabel(q.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 부족 재고 알림 */}
      {lowStockList.length > 0 && (
        <div style={{ background: '#FFF3E0', border: '1px solid #FFB74D', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#E65100', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaExclamationTriangle /> 부족 재고 알림 ({lowStockList.length}개)
            </h3>
            <Link to="/inventory" style={{ fontSize: '12px', color: '#E65100', fontWeight: '600' }}>재고 관리 →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
            {lowStockList.map((p) => (
              <div key={p.id} style={{ background: '#fff', borderRadius: '7px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A202C' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>{p.code} · {p.location}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: p.quantity === 0 ? '#C62828' : '#E65100' }}>
                    {p.quantity}개
                  </div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>최소 {p.minQuantity}개</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
