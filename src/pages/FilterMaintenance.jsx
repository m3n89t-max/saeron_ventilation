import React, { useState, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaHistory, FaTools, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';
import useAppStore from '../store/appStore';

const EMPTY_CUSTOMER = { name: '', phone: '', address: '', contact: '', filterModel: '', installDate: '', cycleMonths: 6, notes: '' };
const EMPTY_HISTORY  = { replaceDate: new Date().toISOString().split('T')[0], filterType: '', technician: '', cost: '', notes: '' };

function addMonths(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  d.setMonth(d.getMonth() + months);
  return d;
}

function getStatus(lastDate, cycleMonths) {
  if (!lastDate) return 'unknown';
  const next = addMonths(lastDate, cycleMonths || 6);
  const now = new Date();
  const diffDays = Math.floor((next - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return 'overdue';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

const STATUS_MAP = {
  overdue:  { label: '교체필요', bg: '#FFEBEE', color: '#C62828', icon: <FaExclamationTriangle size={11} /> },
  soon:     { label: '1개월내', bg: '#FFF3E0', color: '#E65100', icon: <FaClock size={11} /> },
  ok:       { label: '정상',    bg: '#EAF5E9', color: '#3D8B37', icon: <FaCheckCircle size={11} /> },
  unknown:  { label: '미등록',  bg: '#F7FAFC', color: '#718096', icon: <FaClock size={11} /> },
};

function formatKo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return '-';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function FilterMaintenance() {
  const { filterCustomers, filterHistory, addFilterCustomer, updateFilterCustomer, deleteFilterCustomer, addFilterHistory, updateFilterHistory, deleteFilterHistory } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER);

  const [historyTarget, setHistoryTarget] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState(EMPTY_HISTORY);
  const [editHistory, setEditHistory] = useState(null);

  const enriched = useMemo(() => {
    return filterCustomers.map((c) => {
      const hist = filterHistory.filter((h) => h.customerId === c.id).sort((a, b) => new Date(b.replaceDate) - new Date(a.replaceDate));
      const lastDate = hist[0]?.replaceDate || c.installDate || null;
      const nextDate = addMonths(lastDate, c.cycleMonths || 6);
      const status = getStatus(lastDate, c.cycleMonths || 6);
      return { ...c, hist, lastDate, nextDate, status };
    });
  }, [filterCustomers, filterHistory]);

  const filtered = useMemo(() => {
    return enriched.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search) || (c.address || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === '전체' || c.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      const order = { overdue: 0, soon: 1, unknown: 2, ok: 3 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [enriched, search, statusFilter]);

  const stats = useMemo(() => ({
    total:   enriched.length,
    overdue: enriched.filter((c) => c.status === 'overdue').length,
    soon:    enriched.filter((c) => c.status === 'soon').length,
    ok:      enriched.filter((c) => c.status === 'ok').length,
  }), [enriched]);

  const openAddCustomer = () => { setEditCustomer(null); setCustomerForm(EMPTY_CUSTOMER); setShowCustomerModal(true); };
  const openEditCustomer = (c) => {
    setEditCustomer(c);
    setCustomerForm({ name: c.name, phone: c.phone || '', address: c.address || '', contact: c.contact || '', filterModel: c.filterModel || '', installDate: c.installDate ? new Date(c.installDate).toISOString().split('T')[0] : '', cycleMonths: c.cycleMonths || 6, notes: c.notes || '' });
    setShowCustomerModal(true);
  };
  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!customerForm.name.trim()) return;
    if (editCustomer) updateFilterCustomer(editCustomer.id, customerForm);
    else addFilterCustomer(customerForm);
    setShowCustomerModal(false);
  };

  const openHistory = (c) => { setHistoryTarget(c); setShowHistoryModal(true); setShowAddHistory(false); setEditHistory(null); };

  const handleHistorySubmit = (e) => {
    e.preventDefault();
    if (!historyForm.replaceDate) return;
    const payload = { ...historyForm, customerId: historyTarget.id, customerName: historyTarget.name, cost: parseInt(historyForm.cost) || 0 };
    if (editHistory) updateFilterHistory(editHistory.id, payload);
    else addFilterHistory(payload);
    setShowAddHistory(false);
    setEditHistory(null);
    setHistoryForm(EMPTY_HISTORY);
  };

  const openEditHistory = (h) => {
    setEditHistory(h);
    setHistoryForm({ replaceDate: h.replaceDate ? new Date(h.replaceDate).toISOString().split('T')[0] : '', filterType: h.filterType || '', technician: h.technician || '', cost: String(h.cost || ''), notes: h.notes || '' });
    setShowAddHistory(true);
  };

  const FIELDS_C = [
    { k: 'name',         l: '고객명 *',       type: 'text',   full: true },
    { k: 'phone',        l: '연락처',          type: 'text' },
    { k: 'contact',      l: '담당자',          type: 'text' },
    { k: 'address',      l: '주소',            type: 'text',   full: true },
    { k: 'filterModel',  l: '필터 모델',       type: 'text' },
    { k: 'installDate',  l: '설치일',          type: 'date' },
    { k: 'cycleMonths',  l: '교체주기(개월)',  type: 'number' },
    { k: 'notes',        l: '비고',            type: 'text',   full: true },
  ];

  const FIELDS_H = [
    { k: 'replaceDate', l: '교체일 *',   type: 'date' },
    { k: 'filterType',  l: '필터 종류',  type: 'text' },
    { k: 'technician',  l: '작업자',     type: 'text' },
    { k: 'cost',        l: '비용 (원)',  type: 'text', inputMode: 'numeric' },
    { k: 'notes',       l: '비고',       type: 'text', full: true },
  ];

  const targetHist = historyTarget ? filterHistory.filter((h) => h.customerId === historyTarget.id).sort((a, b) => new Date(b.replaceDate) - new Date(a.replaceDate)) : [];
  const targetEnriched = historyTarget ? enriched.find((c) => c.id === historyTarget.id) : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">필터 유지보수 관리</h2>
          <p className="page-subtitle">고객별 환기필터 교체 이력 및 교체 예정 관리</p>
        </div>
        <button className="btn-primary" onClick={openAddCustomer}><FaPlus size={12} /> 고객 등록</button>
      </div>

      {/* Stats */}
      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        {[
          { label: '전체 고객', value: stats.total, sub: '등록 고객 수', color: '#2C5AA0' },
          { label: '교체 필요', value: stats.overdue, sub: '6개월 초과', color: '#C62828' },
          { label: '1개월 내 교체', value: stats.soon, sub: '임박 고객', color: '#E65100' },
          { label: '정상', value: stats.ok, sub: '교체 완료', color: '#3D8B37' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: '12px', color: '#718096', fontWeight: '600', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#A0AEC0', marginTop: '4px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div className="search-bar">
          <div className="search-input-wrap">
            <FaSearch />
            <input className="form-input" placeholder="고객명, 연락처, 주소 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['전체', 'overdue', 'soon', 'ok', 'unknown'].map((v) => {
              const labels = { 전체: '전체', overdue: '교체필요', soon: '1개월내', ok: '정상', unknown: '미등록' };
              return (
                <button key={v} onClick={() => setStatusFilter(v)}
                  style={{ padding: '6px 14px', border: '1.5px solid', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    background: statusFilter === v ? '#2C5AA0' : '#fff',
                    color: statusFilter === v ? '#fff' : '#4A5568',
                    borderColor: statusFilter === v ? '#2C5AA0' : '#E2E8F0' }}>
                  {labels[v]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>총 {filtered.length}건</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>고객명</th>
                <th>연락처</th>
                <th>주소</th>
                <th>필터 모델</th>
                <th>교체주기</th>
                <th>최근 교체일</th>
                <th>다음 교체 예정</th>
                <th>상태</th>
                <th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>등록된 고객이 없습니다.</td></tr>
              ) : filtered.map((c) => {
                const st = STATUS_MAP[c.status];
                const nextStr = c.nextDate ? formatKo(c.nextDate.toISOString()) : '-';
                const diffDays = c.nextDate ? Math.floor((c.nextDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '700', fontSize: '13px' }}>{c.name}</td>
                    <td style={{ fontSize: '12px', color: '#4A5568' }}>{c.phone || '-'}</td>
                    <td style={{ fontSize: '12px', color: '#718096', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '-'}</td>
                    <td style={{ fontSize: '12px', color: '#4A5568' }}>{c.filterModel || '-'}</td>
                    <td style={{ fontSize: '12px', color: '#4A5568', textAlign: 'center' }}>{c.cycleMonths || 6}개월</td>
                    <td style={{ fontSize: '12px', color: '#4A5568' }}>{formatKo(c.lastDate)}</td>
                    <td style={{ fontSize: '12px', fontWeight: '600' }}>
                      <div>{nextStr}</div>
                      {diffDays !== null && (
                        <div style={{ fontSize: '11px', color: diffDays < 0 ? '#C62828' : diffDays <= 30 ? '#E65100' : '#3D8B37' }}>
                          {diffDays < 0 ? `${Math.abs(diffDays)}일 초과` : `D-${diffDays}`}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: st.bg, color: st.color }}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => openHistory(c)} title="이력 보기"
                          style={{ padding: '5px 8px', background: '#EBF4FF', color: '#2C5AA0', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FaHistory size={10} /> 이력
                        </button>
                        <button onClick={() => { setHistoryTarget(c); setShowAddHistory(true); setShowHistoryModal(true); setEditHistory(null); setHistoryForm(EMPTY_HISTORY); }} title="교체 등록"
                          style={{ padding: '5px 8px', background: '#EAF5E9', color: '#3D8B37', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FaTools size={10} /> 교체
                        </button>
                        <button onClick={() => openEditCustomer(c)} style={{ padding: '5px 8px', background: '#F7FAFC', color: '#718096', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaEdit size={11} /></button>
                        <button onClick={() => { if (window.confirm(`"${c.name}" 고객을 삭제하시겠습니까?\n교체 이력도 함께 삭제됩니다.`)) deleteFilterCustomer(c.id); }}
                          style={{ padding: '5px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 고객 등록/수정 모달 */}
      {showCustomerModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{editCustomer ? '고객 수정' : '고객 등록'}</h3>
              <button onClick={() => setShowCustomerModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            <form onSubmit={handleCustomerSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') e.preventDefault(); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {FIELDS_C.map(({ k, l, type, full }) => (
                  <div key={k} style={full ? { gridColumn: '1 / -1' } : {}}>
                    <label className="form-label">{l}</label>
                    <input className="form-input" type={type} value={customerForm[k]} onChange={(e) => setCustomerForm({ ...customerForm, [k]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCustomerModal(false)} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
                <button type="submit" className="btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 필터 이력 모달 */}
      {showHistoryModal && historyTarget && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{historyTarget.name} — 필터 교체 이력</h3>
                {targetEnriched && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#718096' }}>모델: {historyTarget.filterModel || '-'}</span>
                    <span style={{ fontSize: '12px', color: '#718096' }}>주기: {historyTarget.cycleMonths || 6}개월</span>
                    {targetEnriched.nextDate && (
                      <span style={{ fontSize: '12px', fontWeight: '700', color: STATUS_MAP[targetEnriched.status].color }}>
                        다음 교체: {formatKo(targetEnriched.nextDate.toISOString())}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => { setShowHistoryModal(false); setShowAddHistory(false); }} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
            </div>

            {/* 교체 등록 폼 */}
            {showAddHistory ? (
              <div style={{ background: '#F7FAFC', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#2C5AA0' }}>{editHistory ? '이력 수정' : '교체 내역 등록'}</h4>
                <form onSubmit={handleHistorySubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') e.preventDefault(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {FIELDS_H.map(({ k, l, type, inputMode, full }) => (
                      <div key={k} style={full ? { gridColumn: '1 / -1' } : {}}>
                        <label className="form-label">{l}</label>
                        <input className="form-input" type={type} inputMode={inputMode} value={historyForm[k]}
                          onChange={(e) => setHistoryForm({ ...historyForm, [k]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => { setShowAddHistory(false); setEditHistory(null); }} style={{ padding: '7px 14px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>취소</button>
                    <button type="submit" style={{ padding: '7px 14px', background: '#3D8B37', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>저장</button>
                  </div>
                </form>
              </div>
            ) : (
              <button onClick={() => { setShowAddHistory(true); setEditHistory(null); setHistoryForm(EMPTY_HISTORY); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', padding: '8px 16px', background: '#3D8B37', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                <FaPlus size={11} /> 교체 내역 추가
              </button>
            )}

            {/* 이력 목록 */}
            {targetHist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#718096', fontSize: '13px' }}>교체 이력이 없습니다.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>교체일</th>
                      <th>필터 종류</th>
                      <th>작업자</th>
                      <th className="text-right">비용</th>
                      <th>비고</th>
                      <th style={{ textAlign: 'center' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetHist.map((h) => (
                      <tr key={h.id}>
                        <td style={{ fontWeight: '700', fontSize: '13px' }}>{formatKo(h.replaceDate)}</td>
                        <td style={{ fontSize: '12px' }}>{h.filterType || '-'}</td>
                        <td style={{ fontSize: '12px' }}>{h.technician || '-'}</td>
                        <td className="text-right" style={{ fontSize: '12px', fontWeight: '600' }}>{h.cost ? `₩${Number(h.cost).toLocaleString()}` : '-'}</td>
                        <td style={{ fontSize: '12px', color: '#718096' }}>{h.notes || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => openEditHistory(h)} style={{ padding: '4px 8px', background: '#EBF4FF', color: '#2C5AA0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaEdit size={11} /></button>
                            <button onClick={() => { if (window.confirm('이 이력을 삭제하시겠습니까?')) deleteFilterHistory(h.id); }} style={{ padding: '4px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
