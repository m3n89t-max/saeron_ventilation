import React, { useState, useMemo } from 'react';
import { FaPlus, FaSearch, FaTrash, FaTimes, FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatDate } from '../utils/formatters';

const PAYMENT_METHODS = ['계좌이체', '현금', '법인카드', '자동이체', '카드'];
const EMPTY_EXPENSE = { category: '인건비', amount: 0, date: new Date().toISOString().split('T')[0], description: '', paymentMethod: '계좌이체', user: '경영지원' };
const EMPTY_INCOME = { category: '설치공사', amount: 0, date: new Date().toISOString().split('T')[0], description: '', paymentMethod: '계좌이체', user: '김영업' };

export default function Finance() {
  const {
    expenses, otherIncome, salesOrders, purchaseOrders,
    expenseCategories, otherIncomeCategories,
    addExpense, deleteExpense, addOtherIncome, deleteOtherIncome,
    getMonthSalesRevenue, getMonthPurchaseCost, getMonthOpExpense,
  } = useAppStore();

  const [tab, setTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [formData, setFormData] = useState(EMPTY_EXPENSE);
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');

  const now = new Date();
  const cy = now.getFullYear(), cm = now.getMonth() + 1;

  // 최근 6개월 차트 데이터
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(cy, cm - 1 - (5 - i), 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const revenue = getMonthSalesRevenue(y, m);
      const purchaseCost = getMonthPurchaseCost(y, m);
      const opExpense = getMonthOpExpense(y, m);
      const profit = revenue - purchaseCost - opExpense;
      return { label: `${m}월`, revenue, purchaseCost, opExpense, totalCost: purchaseCost + opExpense, profit };
    });
  }, [salesOrders, purchaseOrders, expenses, otherIncome]);

  const thisMonth = useMemo(() => {
    const revenue = getMonthSalesRevenue(cy, cm);
    const purchaseCost = getMonthPurchaseCost(cy, cm);
    const opExpense = getMonthOpExpense(cy, cm);
    const totalExpense = purchaseCost + opExpense;
    const profit = revenue - totalExpense;
    const profitRate = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
    return { revenue, purchaseCost, opExpense, totalExpense, profit, profitRate };
  }, [salesOrders, purchaseOrders, expenses, otherIncome]);

  // 지출 카테고리별 합계 (이번달)
  const expCatData = useMemo(() => {
    const start = new Date(cy, cm - 1, 1), end = new Date(cy, cm, 0, 23, 59, 59);
    const map = {};
    expenses.filter((e) => { const d = new Date(e.date); return d >= start && d <= end; }).forEach((e) => {
      if (!map[e.category]) map[e.category] = 0;
      map[e.category] += e.amount;
    });
    return Object.entries(map).map(([cat, amount]) => ({ cat, amount })).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const allExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).filter((e) =>
      e.category.includes(search) || e.description.includes(search) || e.user.includes(search)
    );
  }, [expenses, search]);

  const allIncome = useMemo(() => {
    return [...otherIncome].sort((a, b) => new Date(b.date) - new Date(a.date)).filter((i) =>
      i.category.includes(search) || i.description.includes(search)
    );
  }, [otherIncome, search]);

  const openModal = (type) => {
    setModalType(type);
    setFormData(type === 'expense' ? { ...EMPTY_EXPENSE } : { ...EMPTY_INCOME });
    setErr('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return setErr('금액을 입력하세요.');
    if (!formData.description.trim()) return setErr('내용을 입력하세요.');
    if (modalType === 'expense') {
      addExpense(formData);
    } else {
      addOtherIncome(formData);
    }
    setShowModal(false);
  };

  const tabs = [
    { v: 'overview', l: '손익 현황' },
    { v: 'expense', l: '지출 내역' },
    { v: 'income', l: '기타 수입' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h2 className="page-title">수입 / 지출</h2><p className="page-subtitle">월별 손익 현황, 운영 지출, 기타 수입 관리</p></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-outline" onClick={() => openModal('income')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px' }}>
            <FaPlus size={11} /> 기타수입 등록
          </button>
          <button className="btn-primary" onClick={() => openModal('expense')}>
            <FaPlus size={12} /> 지출 등록
          </button>
        </div>
      </div>

      {/* 이번달 핵심 지표 */}
      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard icon={<FaArrowUp />} title="이번달 총 수입" value={`₩${(thisMonth.revenue / 10000).toFixed(0)}만`} sub={formatCurrency(thisMonth.revenue)} color="#3D8B37" />
        <StatsCard icon={<FaArrowDown />} title="이번달 매입원가" value={`₩${(thisMonth.purchaseCost / 10000).toFixed(0)}만`} sub={formatCurrency(thisMonth.purchaseCost)} color="#C62828" />
        <StatsCard icon={<FaArrowDown />} title="이번달 운영비" value={`₩${(thisMonth.opExpense / 10000).toFixed(0)}만`} sub={formatCurrency(thisMonth.opExpense)} color="#E65100" />
        <StatsCard icon={<FaWallet />} title="이번달 순이익" value={`₩${(Math.abs(thisMonth.profit) / 10000).toFixed(0)}만`} sub={thisMonth.profit >= 0 ? `흑자 (이익률 ${thisMonth.profitRate}%)` : `적자 (손실률 ${Math.abs(thisMonth.profitRate)}%)`} color={thisMonth.profit >= 0 ? '#3D8B37' : '#C62828'} />
      </div>

      {/* 탭 */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0' }}>
          {tabs.map(({ v, l }) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ padding: '14px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', color: tab === v ? '#2C5AA0' : '#718096', borderBottom: tab === v ? '2px solid #2C5AA0' : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s' }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px' }}>
          {/* 손익 현황 탭 */}
          {tab === 'overview' && (
            <>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C', marginBottom: '16px' }}>월별 수입 / 지출 / 순이익 추이 (최근 6개월)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F8" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#718096' }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip formatter={(v, name) => [formatCurrency(v), { revenue: '총수입', purchaseCost: '매입원가', opExpense: '운영비', profit: '순이익' }[name] || name]} labelStyle={{ fontWeight: '700' }} />
                  <Legend formatter={(v) => ({ revenue: '총수입', purchaseCost: '매입원가', opExpense: '운영비', profit: '순이익' }[v] || v)} />
                  <Bar dataKey="revenue" fill="#3D8B37" name="revenue" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="purchaseCost" fill="#C62828" name="purchaseCost" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="opExpense" fill="#E65100" name="opExpense" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="profit" fill="#2C5AA0" name="profit" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* 월별 요약 테이블 */}
              <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C', marginBottom: '12px' }}>월별 손익 요약</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>월</th>
                      <th className="text-right">총 수입</th>
                      <th className="text-right">매입원가</th>
                      <th className="text-right">운영비</th>
                      <th className="text-right">총 비용</th>
                      <th className="text-right">순이익</th>
                      <th className="text-right">이익률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((row) => {
                      const profitRate = row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0;
                      return (
                        <tr key={row.label}>
                          <td style={{ fontWeight: '700' }}>{row.label}</td>
                          <td className="text-right" style={{ color: '#3D8B37', fontWeight: '600' }}>{formatCurrency(row.revenue)}</td>
                          <td className="text-right" style={{ color: '#C62828' }}>{formatCurrency(row.purchaseCost)}</td>
                          <td className="text-right" style={{ color: '#E65100' }}>{formatCurrency(row.opExpense)}</td>
                          <td className="text-right">{formatCurrency(row.totalCost)}</td>
                          <td className="text-right" style={{ fontWeight: '800', color: row.profit >= 0 ? '#3D8B37' : '#C62828' }}>{formatCurrency(row.profit)}</td>
                          <td className="text-right">
                            <span style={{ fontSize: '13px', fontWeight: '700', color: profitRate >= 0 ? '#3D8B37' : '#C62828', background: profitRate >= 20 ? '#EAF5E9' : profitRate >= 0 ? '#FFF3E0' : '#FFEBEE', padding: '2px 8px', borderRadius: '10px' }}>
                              {profitRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 이번달 지출 카테고리 */}
              {expCatData.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C', marginBottom: '12px' }}>이번달 운영비 항목별 현황</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                    {expCatData.map(({ cat, amount }) => (
                      <div key={cat} style={{ background: '#F7FAFC', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#4A5568' }}>{cat}</span>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#C62828' }}>{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 지출 내역 탭 */}
          {tab === 'expense' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="search-input-wrap" style={{ maxWidth: '300px' }}>
                  <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '13px' }} />
                  <input className="form-input" placeholder="내용, 카테고리 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
                </div>
                <button className="btn-primary" onClick={() => openModal('expense')}><FaPlus size={11} /> 지출 등록</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>날짜</th><th>카테고리</th><th>내용</th><th className="text-right">금액</th><th>결제방법</th><th>담당자</th><th style={{ textAlign: 'center' }}>삭제</th></tr>
                </thead>
                <tbody>
                  {allExpenses.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>지출 내역이 없습니다.</td></tr>
                  ) : allExpenses.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: '13px' }}>{formatDate(e.date)}</td>
                      <td><span style={{ fontSize: '12px', background: '#FFEBEE', color: '#C62828', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{e.category}</span></td>
                      <td style={{ fontSize: '13px' }}>{e.description}</td>
                      <td className="text-right" style={{ fontWeight: '700', color: '#C62828' }}>{formatCurrency(e.amount)}</td>
                      <td style={{ fontSize: '12px', color: '#718096' }}>{e.paymentMethod}</td>
                      <td style={{ fontSize: '12px', color: '#718096' }}>{e.user}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => { if (window.confirm('삭제하시겠습니까?')) deleteExpense(e.id); }} style={{ padding: '4px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {allExpenses.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#F7FAFC', fontWeight: '700' }}>
                      <td colSpan={3} style={{ padding: '12px 14px', color: '#4A5568' }}>합계</td>
                      <td className="text-right" style={{ padding: '12px 14px', color: '#C62828', fontSize: '14px' }}>{formatCurrency(allExpenses.reduce((s, e) => s + e.amount, 0))}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </>
          )}

          {/* 기타 수입 탭 */}
          {tab === 'income' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="search-input-wrap" style={{ maxWidth: '300px' }}>
                  <FaSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#718096', fontSize: '13px' }} />
                  <input className="form-input" placeholder="내용, 카테고리 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
                </div>
                <button className="btn-primary" onClick={() => openModal('income')}><FaPlus size={11} /> 기타수입 등록</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>날짜</th><th>카테고리</th><th>내용</th><th className="text-right">금액</th><th>결제방법</th><th>담당자</th><th style={{ textAlign: 'center' }}>삭제</th></tr>
                </thead>
                <tbody>
                  {allIncome.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>기타 수입 내역이 없습니다.</td></tr>
                  ) : allIncome.map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontSize: '13px' }}>{formatDate(i.date)}</td>
                      <td><span style={{ fontSize: '12px', background: '#EAF5E9', color: '#3D8B37', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{i.category}</span></td>
                      <td style={{ fontSize: '13px' }}>{i.description}</td>
                      <td className="text-right" style={{ fontWeight: '700', color: '#3D8B37' }}>{formatCurrency(i.amount)}</td>
                      <td style={{ fontSize: '12px', color: '#718096' }}>{i.paymentMethod}</td>
                      <td style={{ fontSize: '12px', color: '#718096' }}>{i.user}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => { if (window.confirm('삭제하시겠습니까?')) deleteOtherIncome(i.id); }} style={{ padding: '4px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {allIncome.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#F7FAFC', fontWeight: '700' }}>
                      <td colSpan={3} style={{ padding: '12px 14px', color: '#4A5568' }}>합계</td>
                      <td className="text-right" style={{ padding: '12px 14px', color: '#3D8B37', fontSize: '14px' }}>{formatCurrency(allIncome.reduce((s, i) => s + i.amount, 0))}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </>
          )}
        </div>
      </div>

      {/* 등록 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{modalType === 'expense' ? '지출 등록' : '기타 수입 등록'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            {err && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px', borderRadius: '7px', marginBottom: '14px', fontSize: '13px' }}>{err}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">카테고리</label>
                  <select className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {(modalType === 'expense' ? expenseCategories : otherIncomeCategories).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">내용 *</label>
                  <input className="form-input" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="지출/수입 내용 입력" />
                </div>
                <div>
                  <label className="form-label">금액 (원) *</label>
                  <input className="form-input" type="number" min="0" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">날짜</label>
                  <input className="form-input" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">결제방법</label>
                  <select className="form-input" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">담당자</label>
                  <input className="form-input" value={formData.user} onChange={(e) => setFormData({ ...formData, user: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
                <button type="submit" className="btn-primary">등록 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
