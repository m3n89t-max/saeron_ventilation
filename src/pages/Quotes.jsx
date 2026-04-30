import React, { useState, useMemo } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaFileAlt, FaExchangeAlt } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatDate, getQuoteStatusLabel, getQuoteStatusClass } from '../utils/formatters';

const EMPTY_QUOTE = { customerName: '', customerPhone: '', customerEmail: '', validUntil: '', status: 'pending', note: '', user: '김영업', items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }] };

export default function Quotes() {
  const { quotes, addQuote, updateQuote, deleteQuote, addSalesOrder } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editQuote, setEditQuote] = useState(null);
  const [formData, setFormData] = useState(EMPTY_QUOTE);
  const [err, setErr] = useState('');
  const [detailQuote, setDetailQuote] = useState(null);

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const matchSearch = q.customerName.toLowerCase().includes(search.toLowerCase()) || (q.quoteNumber || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === '전체' || q.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [quotes, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = quotes.filter((q) => q.status === 'pending');
    const accepted = quotes.filter((q) => q.status === 'accepted');
    const rejected = quotes.filter((q) => q.status === 'rejected');
    const winRate = quotes.length > 0 ? Math.round((accepted.length / quotes.length) * 100) : 0;
    return {
      total: quotes.length, pending: pending.length, accepted: accepted.length, rejected: rejected.length,
      pendingAmt: pending.reduce((s, q) => s + q.totalAmount, 0),
      acceptedAmt: accepted.reduce((s, q) => s + q.totalAmount, 0),
      winRate,
    };
  }, [quotes]);

  const openAdd = () => { setEditQuote(null); setFormData({ ...EMPTY_QUOTE, items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }] }); setErr(''); setShowModal(true); };
  const openEdit = (q) => {
    setEditQuote(q);
    setFormData({ customerName: q.customerName, customerPhone: q.customerPhone || '', customerEmail: q.customerEmail || '', validUntil: q.validUntil || '', status: q.status, note: q.note || '', user: q.user || '', items: q.items.map((i) => ({ ...i })) });
    setErr(''); setShowModal(true);
  };

  const handleItemChange = (idx, key, val) => {
    const items = [...formData.items];
    items[idx] = { ...items[idx], [key]: key === 'quantity' || key === 'unitPrice' ? (parseInt(val) || 0) : val };
    items[idx].total = (items[idx].quantity || 0) * (items[idx].unitPrice || 0);
    setFormData({ ...formData, items });
  };
  const addItem = () => setFormData({ ...formData, items: [...formData.items, { productName: '', quantity: 1, unitPrice: 0, total: 0 }] });
  const removeItem = (idx) => { if (formData.items.length > 1) setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) }); };

  const totalAmount = formData.items.reduce((s, i) => s + (i.total || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) return setErr('거래처명을 입력하세요.');
    if (formData.items.some((i) => !i.productName.trim())) return setErr('제품명을 모두 입력하세요.');
    if (editQuote) { updateQuote(editQuote.id, { ...formData, totalAmount }); } else { addQuote({ ...formData, totalAmount }); }
    setShowModal(false);
  };

  const handleDelete = (q) => { if (window.confirm(`"${q.quoteNumber}" 견적을 삭제하시겠습니까?`)) deleteQuote(q.id); };

  const handleConvert = (q) => {
    if (!window.confirm(`"${q.quoteNumber}" 견적을 수주(매출)로 전환하시겠습니까?`)) return;
    addSalesOrder({ customerId: null, customerName: q.customerName, items: q.items, totalAmount: q.totalAmount, paidAmount: 0, paymentMethod: '미정', note: `견적 전환: ${q.quoteNumber}` });
    updateQuote(q.id, { status: 'accepted' });
    setDetailQuote(null);
    alert('수주 전환 완료! 매입매출 > 매출 탭에서 확인하세요.');
  };

  const statusOpts = [{ v: '전체', l: '전체' }, { v: 'pending', l: '검토중' }, { v: 'accepted', l: '수주성사' }, { v: 'rejected', l: '거절' }];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h2 className="page-title">견적 현황</h2><p className="page-subtitle">견적서 작성, 관리, 수주 전환</p></div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> 견적 작성</button>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard icon={<FaFileAlt />} title="총 견적건수" value={`${stats.total}건`} sub={`수주율 ${stats.winRate}%`} color="#2C5AA0" />
        <StatsCard icon={<FaFileAlt />} title="검토중" value={`${stats.pending}건`} sub={formatCurrency(stats.pendingAmt)} color="#E65100" />
        <StatsCard icon={<FaCheckCircle />} title="수주성사" value={`${stats.accepted}건`} sub={formatCurrency(stats.acceptedAmt)} color="#3D8B37" />
        <StatsCard icon={<FaTimes />} title="거절" value={`${stats.rejected}건`} sub="협의 불발" color="#C62828" />
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div className="search-bar">
          <div className="search-input-wrap">
            <FaSearch />
            <input className="form-input" placeholder="거래처명 또는 견적번호 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {statusOpts.map((o) => (
              <button key={o.v} onClick={() => setStatusFilter(o.v)}
                style={{ padding: '6px 14px', border: '1.5px solid', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: statusFilter === o.v ? '#2C5AA0' : '#fff', color: statusFilter === o.v ? '#fff' : '#4A5568', borderColor: statusFilter === o.v ? '#2C5AA0' : '#E2E8F0' }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>총 {filtered.length}건</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>견적번호</th><th>거래처</th><th>제품 요약</th><th className="text-right">견적금액</th><th>유효기간</th><th>상태</th><th>담당자</th><th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>견적 내역이 없습니다.</td></tr>
              ) : filtered.map((q) => (
                <tr key={q.id}>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace', color: '#2C5AA0', fontWeight: '700', cursor: 'pointer' }} onClick={() => setDetailQuote(q)}>{q.quoteNumber}</td>
                  <td style={{ cursor: 'pointer' }} onClick={() => setDetailQuote(q)}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{q.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>{q.customerPhone}</div>
                  </td>
                  <td style={{ cursor: 'pointer', fontSize: '12px', color: '#4A5568' }} onClick={() => setDetailQuote(q)}>
                    {q.items[0]?.productName}{q.items.length > 1 ? ` 외 ${q.items.length - 1}건` : ''}
                  </td>
                  <td className="text-right" style={{ fontWeight: '800', fontSize: '15px', color: '#1A202C', cursor: 'pointer' }} onClick={() => setDetailQuote(q)}>
                    {formatCurrency(q.totalAmount)}
                  </td>
                  <td style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => setDetailQuote(q)}>
                    {q.validUntil || '-'}
                    {q.validUntil && new Date(q.validUntil) < new Date() && q.status === 'pending' && (
                      <span style={{ marginLeft: '6px', fontSize: '11px', color: '#C62828', fontWeight: '600' }}>만료</span>
                    )}
                  </td>
                  <td><span className={`badge ${getQuoteStatusClass(q.status)}`}>{getQuoteStatusLabel(q.status)}</span></td>
                  <td style={{ fontSize: '13px' }}>{q.user}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {q.status === 'pending' && (
                        <button onClick={() => handleConvert(q)} title="수주 전환" style={{ padding: '5px 8px', background: '#EAF5E9', color: '#3D8B37', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FaExchangeAlt size={9} /> 수주
                        </button>
                      )}
                      <button onClick={() => openEdit(q)} style={{ padding: '5px 8px', background: '#EBF4FF', color: '#2C5AA0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaEdit size={11} /></button>
                      <button onClick={() => handleDelete(q)} style={{ padding: '5px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {detailQuote && (
        <div className="modal-overlay" onClick={() => setDetailQuote(null)}>
          <div className="modal-box" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{detailQuote.quoteNumber}</h3>
                <span className={`badge ${getQuoteStatusClass(detailQuote.status)}`} style={{ marginTop: '6px', display: 'inline-block' }}>{getQuoteStatusLabel(detailQuote.status)}</span>
              </div>
              <button onClick={() => setDetailQuote(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#718096' }}><FaTimes /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[['거래처', detailQuote.customerName], ['연락처', detailQuote.customerPhone || '-'], ['이메일', detailQuote.customerEmail || '-'], ['유효기간', detailQuote.validUntil || '-'], ['담당자', detailQuote.user], ['작성일', formatDate(detailQuote.createdAt)]].map(([k, v]) => (
                <div key={k} style={{ background: '#F7FAFC', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '2px' }}>{k}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{v}</div>
                </div>
              ))}
            </div>
            <table className="data-table" style={{ marginBottom: '12px' }}>
              <thead><tr><th>제품명</th><th className="text-right">수량</th><th className="text-right">단가</th><th className="text-right">합계</th></tr></thead>
              <tbody>
                {detailQuote.items.map((item, i) => (
                  <tr key={i}><td>{item.productName}</td><td className="text-right">{item.quantity?.toLocaleString()}</td><td className="text-right">{formatCurrency(item.unitPrice)}</td><td className="text-right fw-700">{formatCurrency(item.total)}</td></tr>
                ))}
                <tr style={{ background: '#EBF4FF' }}>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: '700' }}>총 견적금액</td>
                  <td className="text-right" style={{ fontWeight: '800', fontSize: '16px', color: '#2C5AA0' }}>{formatCurrency(detailQuote.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
            {detailQuote.note && <div style={{ background: '#FFF8E1', padding: '10px 14px', borderRadius: '7px', fontSize: '13px', color: '#4A5568', marginBottom: '12px' }}><strong>비고:</strong> {detailQuote.note}</div>}
            {detailQuote.status === 'pending' && (
              <div className="modal-actions">
                <button onClick={() => { updateQuote(detailQuote.id, { status: 'rejected' }); setDetailQuote(null); }} className="btn-danger">거절 처리</button>
                <button onClick={() => handleConvert(detailQuote)} style={{ padding: '9px 18px', background: '#3D8B37', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaExchangeAlt size={12} /> 수주 전환
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 작성/수정 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{editQuote ? '견적 수정' : '견적 작성'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            {err && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '7px', marginBottom: '14px', fontSize: '13px' }}>{err}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}><label className="form-label">거래처명 *</label><input className="form-input" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="거래처명 입력" /></div>
                <div><label className="form-label">연락처</label><input className="form-input" value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="010-0000-0000" /></div>
                <div><label className="form-label">이메일</label><input className="form-input" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} /></div>
                <div><label className="form-label">유효기간</label><input className="form-input" type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} /></div>
                <div><label className="form-label">담당자</label><input className="form-input" value={formData.user} onChange={(e) => setFormData({ ...formData, user: e.target.value })} /></div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>견적 품목</label>
                  <button type="button" onClick={addItem} style={{ fontSize: '12px', color: '#2C5AA0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>+ 품목 추가</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: '#F7FAFC' }}>
                        <th style={{ padding: '8px', textAlign: 'left', fontSize: '11px', color: '#718096', fontWeight: '700' }}>제품명</th>
                        <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', color: '#718096', fontWeight: '700', width: '80px' }}>수량</th>
                        <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', color: '#718096', fontWeight: '700', width: '120px' }}>단가</th>
                        <th style={{ padding: '8px', textAlign: 'right', fontSize: '11px', color: '#718096', fontWeight: '700', width: '120px' }}>합계</th>
                        <th style={{ width: '30px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '4px' }}><input className="form-input" value={item.productName} onChange={(e) => handleItemChange(idx, 'productName', e.target.value)} placeholder="제품명" style={{ fontSize: '13px' }} /></td>
                          <td style={{ padding: '4px' }}><input className="form-input" type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} style={{ textAlign: 'right', fontSize: '13px' }} /></td>
                          <td style={{ padding: '4px' }}><input className="form-input" type="number" min="0" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} style={{ textAlign: 'right', fontSize: '13px' }} /></td>
                          <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '700', fontSize: '13px' }}>{formatCurrency(item.total)}</td>
                          <td style={{ padding: '4px' }}><button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', padding: '4px' }}><FaTimes size={10} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ textAlign: 'right', padding: '10px 4px', fontWeight: '800', fontSize: '16px', color: '#2C5AA0', borderTop: '2px solid #E2E8F0', marginTop: '4px' }}>
                  총 견적금액: {formatCurrency(totalAmount)}
                </div>
              </div>

              <div><label className="form-label">비고</label><textarea className="form-input" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} rows={2} placeholder="특이사항, 조건 등" style={{ resize: 'vertical' }} /></div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
                <button type="submit" className="btn-primary">{editQuote ? '수정 완료' : '견적 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
