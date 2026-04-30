import React, { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency } from '../utils/formatters';

const COLORS = ['#2C5AA0', '#3D8B37', '#C62828', '#E65100', '#6A1B9A', '#546E7A', '#0277BD', '#558B2F'];

export default function Reports() {
  const {
    products, salesOrders, purchaseOrders, quotes, transactions,
    expenses, otherIncome, productCategories,
    getMonthSalesRevenue, getMonthPurchaseCost, getMonthOpExpense,
  } = useAppStore();

  const now = new Date();
  const cy = now.getFullYear(), cm = now.getMonth() + 1;

  // 6개월 매출/비용 추이
  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(cy, cm - 1 - (5 - i), 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const revenue = getMonthSalesRevenue(y, m);
      const cost = getMonthPurchaseCost(y, m) + getMonthOpExpense(y, m);
      return { label: `${m}월`, revenue, cost, profit: revenue - cost };
    });
  }, [salesOrders, purchaseOrders, expenses, otherIncome]);

  // 카테고리별 재고 현황
  const categoryStock = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (!map[p.category]) map[p.category] = { cat: p.category, count: 0, qty: 0, value: 0 };
      map[p.category].count += 1;
      map[p.category].qty += p.quantity;
      map[p.category].value += p.quantity * p.salePrice;
    });
    return Object.values(map);
  }, [products]);

  // 거래처별 매출 Top 5
  const topCustomers = useMemo(() => {
    const map = {};
    salesOrders.forEach((o) => {
      if (!map[o.customerName]) map[o.customerName] = { name: o.customerName, revenue: 0, count: 0 };
      map[o.customerName].revenue += o.totalAmount;
      map[o.customerName].count += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [salesOrders]);

  // 견적 전환 분석
  const quoteAnalysis = useMemo(() => {
    const total = quotes.length;
    const accepted = quotes.filter((q) => q.status === 'accepted').length;
    const rejected = quotes.filter((q) => q.status === 'rejected').length;
    const pending = quotes.filter((q) => q.status === 'pending').length;
    const winRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return [
      { name: '수주성사', value: accepted },
      { name: '검토중', value: pending },
      { name: '거절', value: rejected },
    ];
  }, [quotes]);

  // 제품별 판매량 Top 5
  const topProducts = useMemo(() => {
    const map = {};
    salesOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        if (!map[item.productName]) map[item.productName] = { name: item.productName, qty: 0, revenue: 0 };
        map[item.productName].qty += item.quantity || 0;
        map[item.productName].revenue += item.total || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [salesOrders]);

  // 지출 카테고리 분포
  const expenseByCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (!map[e.category]) map[e.category] = { name: e.category, value: 0 };
      map[e.category].value += e.amount;
    });
    return Object.values(map);
  }, [expenses]);

  // 전체 KPI
  const kpi = useMemo(() => {
    const totalRevenue = salesOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalPaid = salesOrders.reduce((s, o) => s + o.paidAmount, 0);
    const totalPurchase = purchaseOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalInventoryValue = products.reduce((s, p) => s + p.quantity * p.salePrice, 0);
    const winRate = quotes.length > 0 ? Math.round((quotes.filter((q) => q.status === 'accepted').length / quotes.length) * 100) : 0;
    return { totalRevenue, totalPaid, totalPurchase, totalInventoryValue, winRate };
  }, [salesOrders, purchaseOrders, products, quotes]);

  const fmt = (v) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}억`;
    if (v >= 10000) return `${Math.floor(v / 10000).toLocaleString('ko-KR')}만`;
    return v.toLocaleString('ko-KR');
  };

  const Card = ({ title, children }) => (
    <div style={{ background: '#fff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C', marginBottom: '16px' }}>{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h2 className="page-title">리포트 & 분석</h2><p className="page-subtitle">매출, 재고, 견적, 지출 통합 분석</p></div>
      </div>

      {/* 전체 KPI */}
      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard icon="₩" title="누적 총 매출" value={`₩${fmt(kpi.totalRevenue)}`} sub={formatCurrency(kpi.totalRevenue)} color="#3D8B37" />
        <StatsCard icon="₩" title="누적 총 매입" value={`₩${fmt(kpi.totalPurchase)}`} sub={formatCurrency(kpi.totalPurchase)} color="#C62828" />
        <StatsCard icon="%" title="견적 수주율" value={`${kpi.winRate}%`} sub={`총 ${quotes.length}건 중 성사`} color="#2C5AA0" />
        <StatsCard icon="₩" title="현재 재고 총액" value={`₩${fmt(kpi.totalInventoryValue)}`} sub={formatCurrency(kpi.totalInventoryValue)} color="#6A1B9A" />
      </div>

      {/* 매출/비용 추이 */}
      <Card title="월별 매출 / 비용 / 순이익 추이 (최근 6개월)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#718096' }} />
            <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#718096' }} />
            <Tooltip formatter={(v, name) => [formatCurrency(v), { revenue: '매출', cost: '비용', profit: '순이익' }[name] || name]} labelStyle={{ fontWeight: '700' }} />
            <Legend formatter={(v) => ({ revenue: '매출', cost: '비용', profit: '순이익' }[v] || v)} />
            <Bar dataKey="revenue" fill="#3D8B37" name="revenue" radius={[3, 3, 0, 0]} />
            <Bar dataKey="cost" fill="#C62828" name="cost" radius={[3, 3, 0, 0]} />
            <Bar dataKey="profit" fill="#2C5AA0" name="profit" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="two-col">
        {/* 카테고리별 재고 */}
        <Card title="카테고리별 재고 현황">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryStock} dataKey="value" nameKey="cat" cx="50%" cy="50%" outerRadius={80} label={({ cat, percent }) => `${cat} ${(percent * 100).toFixed(0)}%`} labelLine>
                {categoryStock.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <table className="data-table" style={{ marginTop: '12px' }}>
            <thead><tr><th>카테고리</th><th className="text-right">제품수</th><th className="text-right">수량</th><th className="text-right">재고액</th></tr></thead>
            <tbody>
              {categoryStock.map((c, i) => (
                <tr key={c.cat}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block', flexShrink: 0 }} />
                    {c.cat}
                  </td>
                  <td className="text-right">{c.count}</td>
                  <td className="text-right">{c.qty.toLocaleString()}</td>
                  <td className="text-right" style={{ fontWeight: '700' }}>{formatCurrency(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* 견적 전환 분석 */}
        <Card title="견적 전환 분석">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={quoteAnalysis.filter((q) => q.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {quoteAnalysis.map((_, i) => <Cell key={i} fill={['#3D8B37', '#E65100', '#C62828'][i % 3]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
            {quoteAnalysis.map((q, i) => (
              <div key={q.name} style={{ background: '#F7FAFC', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>{q.name}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: ['#3D8B37', '#E65100', '#C62828'][i] }}>{q.value}건</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="two-col">
        {/* 거래처별 매출 Top5 */}
        <Card title="거래처별 매출 TOP 5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topCustomers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#4A5568' }} width={90} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#2C5AA0" radius={[0, 3, 3, 0]} name="매출액" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 제품별 판매 Top5 */}
        <Card title="제품별 매출 TOP 5">
          <table className="data-table">
            <thead><tr><th>순위</th><th>제품명</th><th className="text-right">판매수량</th><th className="text-right">매출액</th></tr></thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>매출 데이터 없음</td></tr>
              ) : topProducts.map((p, i) => (
                <tr key={p.name}>
                  <td>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: i < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][i] : '#E2E8F0', color: i < 3 ? '#fff' : '#718096', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: '600' }}>{p.name}</td>
                  <td className="text-right">{p.qty.toLocaleString()}개</td>
                  <td className="text-right" style={{ fontWeight: '700', color: '#3D8B37' }}>{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* 지출 분석 */}
      {expenseByCategory.length > 0 && (
        <Card title="운영 지출 항목별 분포">
          <div className="two-col">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <table className="data-table">
              <thead><tr><th>항목</th><th className="text-right">금액</th><th className="text-right">비율</th></tr></thead>
              <tbody>
                {expenseByCategory.map((e, i) => {
                  const total = expenseByCategory.reduce((s, x) => s + x.value, 0);
                  return (
                    <tr key={e.name}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                        {e.name}
                      </td>
                      <td className="text-right" style={{ fontWeight: '700' }}>{formatCurrency(e.value)}</td>
                      <td className="text-right" style={{ color: '#718096' }}>{total > 0 ? Math.round((e.value / total) * 100) : 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
