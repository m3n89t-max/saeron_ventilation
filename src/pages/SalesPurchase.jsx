import React, { useState, useMemo, useRef } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTimes, FaShoppingCart, FaBoxes, FaFileInvoice, FaMoneyBillWave } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import {
  formatCurrency, formatDate,
  getPaymentStatusLabel, getPaymentStatusClass,
  getOrderStatusLabel, getOrderStatusClass,
} from '../utils/formatters';

const EMPTY_SALE = { customerName: '', items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }], totalAmount: 0, paidAmount: '', deliveryDate: '', paymentMethod: '계좌이체', note: '', user: '김영업' };
const EMPTY_PURCHASE = { supplierName: '', items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }], totalAmount: 0, paidAmount: '', expectedDate: '', paymentMethod: '세금계산서', note: '', user: '최관리' };

const PAYMENT_METHODS = ['계좌이체', '세금계산서', '현금', '카드', '미정'];

function OrderFormModal({ title, show, onClose, onSubmit, formData, setFormData, isError, errorMsg }) {
  if (!show) return null;
  const items = formData.items || [];
  const totalAmount = items.reduce((s, i) => s + (i.total || 0), 0);
  const handleItemChange = (idx, key, val) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [key]: key === 'quantity' || key === 'unitPrice' ? (parseInt(val) || 0) : val };
    newItems[idx].total = (newItems[idx].quantity || 0) * (newItems[idx].unitPrice || 0);
    setFormData({ ...formData, items: newItems });
  };
  const addItem = () => setFormData({ ...formData, items: [...items, { productName: '', quantity: 1, unitPrice: 0, total: 0 }] });
  const removeItem = (idx) => { if (items.length > 1) setFormData({ ...formData, items: items.filter((_, i) => i !== idx) }); };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '700px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
        </div>
        {isError && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '7px', marginBottom: '14px', fontSize: '13px' }}>{errorMsg}</div>}
        <form onSubmit={onSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') e.preventDefault(); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {Object.entries(formData).filter(([k]) => !['items', 'totalAmount'].includes(k)).map(([k, v]) => {
              const labels = { customerName: '거래처명 *', supplierName: '공급업체명 *', paidAmount: '수금액 (원)', deliveryDate: '납품일', expectedDate: '입고 예정일', paymentMethod: '결제방법', note: '비고', user: '담당자' };
              const label = labels[k] || k;
              const isAmount = k.includes('Amount');
              const type = isAmount ? 'text' : k.includes('Date') ? 'date' : 'text';
              if (k === 'paymentMethod') return (
                <div key={k}><label className="form-label">{label}</label>
                  <select className="form-input" value={v} onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              );
              const isName = k === 'customerName' || k === 'supplierName';
              return (
                <div key={k} style={isName ? { gridColumn: '1 / -1' } : {}}>
                  <label className="form-label">{label}</label>
                  <input
                    className="form-input"
                    type={type}
                    inputMode={isAmount ? 'numeric' : undefined}
                    value={v}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const val = isAmount ? raw.replace(/[^0-9]/g, '') : raw;
                      setFormData({ ...formData, [k]: val });
                    }}
                    placeholder={isName ? '거래처/업체명 입력' : isAmount ? '0' : ''}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>품목 내역</label>
              <button type="button" onClick={addItem} style={{ fontSize: '12px', color: '#2C5AA0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>+ 품목 추가</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
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
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px' }}><input className="form-input" value={item.productName} onChange={(e) => handleItemChange(idx, 'productName', e.target.value)} placeholder="제품명" style={{ fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px' }}><input className="form-input" type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} style={{ textAlign: 'right', fontSize: '13px' }} /></td>
                      <td style={{ padding: '4px' }}><input className="form-input" type="number" min="0" value={item.unitPrice} onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)} style={{ textAlign: 'right', fontSize: '13px' }} /></td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '700', fontSize: '13px' }}>{formatCurrency(item.total)}</td>
                      <td style={{ padding: '4px' }}><button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer' }}><FaTimes size={10} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ textAlign: 'right', padding: '10px 4px', fontWeight: '800', fontSize: '16px', color: '#2C5AA0', borderTop: '2px solid #E2E8F0', marginTop: '4px' }}>
              총액: {formatCurrency(totalAmount)}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
            <button type="submit" className="btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 수금 처리 전용 모달
function PaymentModal({ order, isSales, onClose, onConfirm }) {
  const remaining = order.totalAmount - order.paidAmount;
  const [addAmount, setAddAmount] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const parsed = parseInt((addAmount || '').replace(/[^0-9]/g, ''), 10) || 0;
  const newTotal = Math.min(order.paidAmount + parsed, order.totalAmount);
  const newRemaining = order.totalAmount - newTotal;

  const handleFull = () => setAddAmount(String(remaining));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!parsed || parsed <= 0) return setErr('수금액을 입력하세요.');
    onConfirm(newTotal);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1A202C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaMoneyBillWave color="#3D8B37" /> 수금 처리
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
        </div>

        {/* 현황 요약 */}
        <div style={{ background: '#F7FAFC', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>청구 총액</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#1A202C' }}>{formatCurrency(order.totalAmount)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>기수금</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#3D8B37' }}>{formatCurrency(order.paidAmount)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>미수금</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#C62828' }}>{formatCurrency(remaining)}</div>
          </div>
        </div>

        {err && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px', borderRadius: '7px', marginBottom: '12px', fontSize: '13px' }}>{err}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label className="form-label">이번에 받은 금액 (원) *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                className="form-input"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={addAmount}
                onChange={(e) => { setErr(''); setAddAmount(e.target.value.replace(/[^0-9]/g, '')); }}
                style={{ flex: 1, fontSize: '16px', fontWeight: '700' }}
              />
              <button type="button" onClick={handleFull}
                style={{ padding: '9px 14px', background: '#EBF4FF', color: '#2C5AA0', border: '1.5px solid #2C5AA0', borderRadius: '7px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                전액
              </button>
            </div>
            {parsed > 0 && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: newRemaining === 0 ? '#EAF5E9' : '#FFF3E0', borderRadius: '7px', fontSize: '13px' }}>
                <span style={{ color: '#718096' }}>수금 후 잔액: </span>
                <strong style={{ color: newRemaining === 0 ? '#3D8B37' : '#E65100', fontSize: '15px' }}>
                  {newRemaining === 0 ? '완납 ✓' : formatCurrency(newRemaining)}
                </strong>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
            <button type="submit" style={{ padding: '9px 18px', background: '#3D8B37', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaMoneyBillWave size={12} /> 수금 확정
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalesPurchase() {
  const { salesOrders, purchaseOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, getTotalUnpaidReceivable, getTotalUnpaidPayable } = useAppStore();

  const [tab, setTab] = useState('sales');
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [formData, setFormData] = useState(EMPTY_SALE);
  const [err, setErr] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);

  const now = new Date();
  const [monthFilter, setMonthFilter] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const isSales = tab === 'sales';
  const orders = isSales ? salesOrders : purchaseOrders;

  const availableMonths = useMemo(() => {
    const dateKey = isSales ? 'orderDate' : 'purchaseDate';
    const set = new Set();
    orders.forEach((o) => {
      const d = new Date(o[dateKey]);
      if (!isNaN(d)) set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return ['전체', ...[...set].sort((a, b) => b.localeCompare(a))];
  }, [orders, isSales]);

  const filtered = useMemo(() => {
    const nameKey = isSales ? 'customerName' : 'supplierName';
    const numKey = isSales ? 'orderNumber' : 'purchaseNumber';
    const dateKey = isSales ? 'orderDate' : 'purchaseDate';
    return orders.filter((o) => {
      const matchSearch = (o[nameKey] || '').toLowerCase().includes(search.toLowerCase()) || (o[numKey] || '').toLowerCase().includes(search.toLowerCase());
      const matchPay = payFilter === '전체' || o.paymentStatus === payFilter;
      const matchMonth = monthFilter === '전체' || (() => {
        const d = new Date(o[dateKey]);
        return !isNaN(d) && `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthFilter;
      })();
      return matchSearch && matchPay && matchMonth;
    }).sort((a, b) => new Date(b[isSales ? 'orderDate' : 'purchaseDate']) - new Date(a[isSales ? 'orderDate' : 'purchaseDate']));
  }, [orders, search, payFilter, monthFilter, isSales]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, o) => s + o.totalAmount, 0);
    const paid = filtered.reduce((s, o) => s + o.paidAmount, 0);
    const unpaid = total - paid;
    const paidCount = filtered.filter((o) => o.paymentStatus === 'paid').length;
    const pendingCount = filtered.filter((o) => o.paymentStatus === 'pending').length;
    return { total, paid, unpaid, paidCount, pendingCount, count: filtered.length };
  }, [filtered]);

  const partySummary = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const name = isSales ? o.customerName : o.supplierName;
      if (!name) return;
      if (!map[name]) map[name] = { name, total: 0, paid: 0, count: 0 };
      map[name].total += o.totalAmount;
      map[name].paid += o.paidAmount;
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [orders, isSales]);

  const [showSummary, setShowSummary] = useState(true);

  const monthSummary = useMemo(() => {
    const map = {};
    const dateKey = isSales ? 'orderDate' : 'purchaseDate';
    orders.forEach((o) => {
      const d = new Date(o[dateKey]);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { key, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`, total: 0, paid: 0, count: 0 };
      map[key].total += o.totalAmount;
      map[key].paid += o.paidAmount;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [orders, isSales]);

  const [showMonthSummary, setShowMonthSummary] = useState(true);

  const pivotData = useMemo(() => {
    const dateKey = isSales ? 'orderDate' : 'purchaseDate';
    const nameKey = isSales ? 'customerName' : 'supplierName';
    const monthSet = new Set();
    const partySet = new Set();
    const cells = {};
    orders.forEach((o) => {
      const d = new Date(o[dateKey]);
      if (isNaN(d)) return;
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mLabel = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
      const name = o[nameKey];
      if (!name) return;
      monthSet.add(JSON.stringify({ key: mKey, label: mLabel }));
      partySet.add(name);
      const cellKey = `${name}__${mKey}`;
      if (!cells[cellKey]) cells[cellKey] = { total: 0, paid: 0 };
      cells[cellKey].total += o.totalAmount;
      cells[cellKey].paid += o.paidAmount;
    });
    const months = [...monthSet].map((s) => JSON.parse(s)).sort((a, b) => a.key.localeCompare(b.key));
    const parties = [...partySet].sort();
    return { months, parties, cells };
  }, [orders, isSales]);

  const [showPivot, setShowPivot] = useState(true);

  const openAdd = () => {
    setEditOrder(null);
    setFormData(isSales ? { ...EMPTY_SALE, items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }] } : { ...EMPTY_PURCHASE, items: [{ productName: '', quantity: 1, unitPrice: 0, total: 0 }] });
    setErr('');
    setShowModal(true);
  };

  const openEdit = (o) => {
    setEditOrder(o);
    const nameKey = isSales ? 'customerName' : 'supplierName';
    const dateKey = isSales ? 'deliveryDate' : 'expectedDate';
    setFormData({
      [nameKey]: o[nameKey] || '',
      items: (o.items || []).map((i) => ({ ...i })),
      totalAmount: o.totalAmount,
      paidAmount: String(o.paidAmount || ''),
      [dateKey]: o[dateKey] ? new Date(o[dateKey]).toISOString().split('T')[0] : '',
      paymentMethod: o.paymentMethod || '계좌이체',
      note: o.note || '',
      user: o.user || '',
    });
    setErr('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameKey = isSales ? 'customerName' : 'supplierName';
    if (!formData[nameKey]?.trim()) return setErr(`${isSales ? '거래처' : '공급업체'}명을 입력하세요.`);
    const totalAmount = (formData.items || []).reduce((s, i) => s + (i.total || 0), 0);
    const paidAmount = Math.min(parseInt(formData.paidAmount) || 0, totalAmount);
    const paymentStatus = totalAmount === 0 ? 'pending' : paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
    const payload = { ...formData, totalAmount, paidAmount, paymentStatus };
    if (editOrder) {
      isSales ? updateSalesOrder(editOrder.id, payload) : updatePurchaseOrder(editOrder.id, payload);
    } else {
      isSales ? addSalesOrder(payload) : addPurchaseOrder(payload);
    }
    setShowModal(false);
  };

  const handleDelete = (o) => {
    const numKey = isSales ? 'orderNumber' : 'purchaseNumber';
    if (window.confirm(`"${o[numKey]}" 내역을 삭제하시겠습니까?`)) {
      isSales ? deleteSalesOrder(o.id) : deletePurchaseOrder(o.id);
      if (detailOrder?.id === o.id) setDetailOrder(null);
    }
  };

  const handlePaymentConfirm = (newTotalPaid) => {
    const o = paymentTarget;
    const paidAmount = newTotalPaid;
    const paymentStatus = paidAmount >= o.totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
    isSales ? updateSalesOrder(o.id, { paidAmount, paymentStatus }) : updatePurchaseOrder(o.id, { paidAmount, paymentStatus });
    if (detailOrder?.id === o.id) setDetailOrder({ ...detailOrder, paidAmount, paymentStatus });
    setPaymentTarget(null);
  };

  const fmt = (v) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}억`;
    if (v >= 10000) return `${Math.floor(v / 10000).toLocaleString('ko-KR')}만`;
    return v.toLocaleString('ko-KR');
  };

  const payOpts = [{ v: '전체', l: '전체' }, { v: 'paid', l: '완납' }, { v: 'partial', l: '부분수금' }, { v: 'pending', l: '미수금' }];
  const dateKey = isSales ? 'orderDate' : 'purchaseDate';
  const numKey = isSales ? 'orderNumber' : 'purchaseNumber';
  const nameKey = isSales ? 'customerName' : 'supplierName';

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h2 className="page-title">매입매출 관리</h2><p className="page-subtitle">매출(판매) 및 매입(구매) 내역 통합 관리</p></div>
        <button className="btn-primary" onClick={openAdd}><FaPlus size={12} /> {isSales ? '매출 등록' : '매입 등록'}</button>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '0', background: '#fff', borderRadius: '10px', padding: '6px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '20px', width: 'fit-content' }}>
        {[{ v: 'sales', l: '매출 (판매)', icon: <FaShoppingCart size={13} /> }, { v: 'purchase', l: '매입 (구매)', icon: <FaBoxes size={13} /> }].map(({ v, l, icon }) => (
          <button key={v} onClick={() => { setTab(v); setSearch(''); setPayFilter('전체'); setMonthFilter(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px', border: 'none', borderRadius: '7px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', background: tab === v ? '#2C5AA0' : 'transparent', color: tab === v ? '#fff' : '#718096', transition: 'all 0.15s' }}>
            {icon} {l}
          </button>
        ))}
      </div>

      {/* 월 선택 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        <span style={{ fontSize: '12px', color: '#718096', fontWeight: '700', whiteSpace: 'nowrap' }}>조회 월:</span>
        {availableMonths.map((m) => {
          const label = m === '전체' ? '전체' : (() => { const [y, mo] = m.split('-'); return `${y}년 ${parseInt(mo)}월`; })();
          return (
            <button key={m} onClick={() => setMonthFilter(m)}
              style={{ padding: '5px 14px', border: '1.5px solid', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
                background: monthFilter === m ? '#2C5AA0' : '#fff',
                color: monthFilter === m ? '#fff' : '#4A5568',
                borderColor: monthFilter === m ? '#2C5AA0' : '#E2E8F0' }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard icon={<FaFileInvoice />} title={isSales ? '총 매출액' : '총 매입액'} value={`₩${fmt(stats.total)}`} sub={`${stats.count}건`} color="#2C5AA0" />
        <StatsCard icon={<FaShoppingCart />} title="완납" value={`₩${fmt(stats.paid)}`} sub={`${stats.paidCount}건 완납`} color="#3D8B37" />
        <StatsCard icon={<FaFileInvoice />} title={isSales ? '미수금' : '미지급금'} value={`₩${fmt(stats.unpaid)}`} sub={`${stats.pendingCount}건 미납`} color="#C62828" />
        <StatsCard icon={<FaBoxes />} title="수금율" value={stats.total > 0 ? `${Math.round((stats.paid / stats.total) * 100)}%` : '0%'} sub="전체 수금 비율" color={stats.total > 0 && stats.paid / stats.total > 0.8 ? '#3D8B37' : '#E65100'} />
      </div>

      {/* 거래처/공급업체별 누적 집계 */}
      {partySummary.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px', overflow: 'hidden' }}>
          <div
            onClick={() => setShowSummary((v) => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', cursor: 'pointer', borderBottom: showSummary ? '1px solid #E2E8F0' : 'none', background: '#F7FAFC' }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2C5AA0' }}>
              {isSales ? '거래처' : '공급업체'}별 누적 현황 ({partySummary.length}개사)
            </span>
            <span style={{ fontSize: '12px', color: '#718096' }}>{showSummary ? '▲ 접기' : '▼ 펼치기'}</span>
          </div>
          {showSummary && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{isSales ? '거래처명' : '공급업체명'}</th>
                    <th className="text-right">거래건수</th>
                    <th className="text-right">누적 총액</th>
                    <th className="text-right">완납액</th>
                    <th className="text-right">미지급 잔액</th>
                    <th className="text-right">수금율</th>
                  </tr>
                </thead>
                <tbody>
                  {partySummary.map((p) => {
                    const unpaid = p.total - p.paid;
                    const rate = p.total > 0 ? Math.round((p.paid / p.total) * 100) : 0;
                    return (
                      <tr key={p.name}>
                        <td style={{ fontWeight: '700', fontSize: '13px' }}>{p.name}</td>
                        <td className="text-right" style={{ color: '#718096', fontSize: '13px' }}>{p.count}건</td>
                        <td className="text-right" style={{ fontWeight: '800', fontSize: '14px' }}>{formatCurrency(p.total)}</td>
                        <td className="text-right" style={{ color: '#3D8B37', fontWeight: '600' }}>{formatCurrency(p.paid)}</td>
                        <td className="text-right" style={{ color: unpaid > 0 ? '#C62828' : '#3D8B37', fontWeight: '700' }}>
                          {unpaid > 0 ? formatCurrency(unpaid) : '완납'}
                        </td>
                        <td className="text-right">
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                            background: rate >= 100 ? '#EAF5E9' : rate >= 50 ? '#FFF3E0' : '#FFEBEE',
                            color: rate >= 100 ? '#3D8B37' : rate >= 50 ? '#E65100' : '#C62828',
                          }}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#EBF4FF', fontWeight: '800' }}>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#2C5AA0' }}>합계</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#2C5AA0' }}>{partySummary.reduce((s, p) => s + p.count, 0)}건</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#1A202C' }}>{formatCurrency(partySummary.reduce((s, p) => s + p.total, 0))}</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#3D8B37' }}>{formatCurrency(partySummary.reduce((s, p) => s + p.paid, 0))}</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#C62828' }}>{formatCurrency(partySummary.reduce((s, p) => s + (p.total - p.paid), 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 월별 누적 집계 */}
      {monthSummary.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px', overflow: 'hidden' }}>
          <div
            onClick={() => setShowMonthSummary((v) => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', cursor: 'pointer', borderBottom: showMonthSummary ? '1px solid #E2E8F0' : 'none', background: '#F7FAFC' }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2C5AA0' }}>
              월별 누적 현황 ({monthSummary.length}개월)
            </span>
            <span style={{ fontSize: '12px', color: '#718096' }}>{showMonthSummary ? '▲ 접기' : '▼ 펼치기'}</span>
          </div>
          {showMonthSummary && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>월</th>
                    <th className="text-right">건수</th>
                    <th className="text-right">총액</th>
                    <th className="text-right">완납액</th>
                    <th className="text-right">미지급 잔액</th>
                    <th className="text-right">수금율</th>
                  </tr>
                </thead>
                <tbody>
                  {monthSummary.map((m) => {
                    const unpaid = m.total - m.paid;
                    const rate = m.total > 0 ? Math.round((m.paid / m.total) * 100) : 0;
                    return (
                      <tr key={m.key}>
                        <td style={{ fontWeight: '700', fontSize: '13px' }}>{m.label}</td>
                        <td className="text-right" style={{ color: '#718096', fontSize: '13px' }}>{m.count}건</td>
                        <td className="text-right" style={{ fontWeight: '800', fontSize: '14px' }}>{formatCurrency(m.total)}</td>
                        <td className="text-right" style={{ color: '#3D8B37', fontWeight: '600' }}>{formatCurrency(m.paid)}</td>
                        <td className="text-right" style={{ color: unpaid > 0 ? '#C62828' : '#3D8B37', fontWeight: '700' }}>
                          {unpaid > 0 ? formatCurrency(unpaid) : '완납'}
                        </td>
                        <td className="text-right">
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                            background: rate >= 100 ? '#EAF5E9' : rate >= 50 ? '#FFF3E0' : '#FFEBEE',
                            color: rate >= 100 ? '#3D8B37' : rate >= 50 ? '#E65100' : '#C62828',
                          }}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#EBF4FF', fontWeight: '800' }}>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#2C5AA0' }}>합계</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#2C5AA0' }}>{monthSummary.reduce((s, m) => s + m.count, 0)}건</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#1A202C' }}>{formatCurrency(monthSummary.reduce((s, m) => s + m.total, 0))}</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#3D8B37' }}>{formatCurrency(monthSummary.reduce((s, m) => s + m.paid, 0))}</td>
                    <td className="text-right" style={{ padding: '10px 14px', color: '#C62828' }}>{formatCurrency(monthSummary.reduce((s, m) => s + (m.total - m.paid), 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 거래처×월별 피벗 테이블 */}
      {pivotData.parties.length > 0 && pivotData.months.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px', overflow: 'hidden' }}>
          <div
            onClick={() => setShowPivot((v) => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', cursor: 'pointer', borderBottom: showPivot ? '1px solid #E2E8F0' : 'none', background: '#F7FAFC' }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#2C5AA0' }}>
              {isSales ? '거래처' : '공급업체'}별 월별 상세 현황
            </span>
            <span style={{ fontSize: '12px', color: '#718096' }}>{showPivot ? '▲ 접기' : '▼ 펼치기'}</span>
          </div>
          {showPivot && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ minWidth: `${200 + pivotData.months.length * 160 + 130}px` }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '120px' }}>{isSales ? '거래처' : '공급업체'}</th>
                    {pivotData.months.map((m) => (
                      <th key={m.key} className="text-right" style={{ minWidth: '140px' }}>{m.label}</th>
                    ))}
                    <th className="text-right" style={{ minWidth: '130px', background: '#EBF4FF', color: '#2C5AA0' }}>합계</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotData.parties.map((name) => {
                    const rowTotal = pivotData.months.reduce((s, m) => s + (pivotData.cells[`${name}__${m.key}`]?.total || 0), 0);
                    const rowPaid  = pivotData.months.reduce((s, m) => s + (pivotData.cells[`${name}__${m.key}`]?.paid  || 0), 0);
                    const rowUnpaid = rowTotal - rowPaid;
                    return (
                      <tr key={name}>
                        <td style={{ fontWeight: '700', fontSize: '13px' }}>{name}</td>
                        {pivotData.months.map((m) => {
                          const cell = pivotData.cells[`${name}__${m.key}`];
                          const unpaid = cell ? cell.total - cell.paid : 0;
                          return (
                            <td key={m.key} className="text-right" style={{ verticalAlign: 'top' }}>
                              {cell ? (
                                <div>
                                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{formatCurrency(cell.total)}</div>
                                  {unpaid > 0
                                    ? <div style={{ fontSize: '11px', color: '#C62828', marginTop: '2px' }}>미지급 {formatCurrency(unpaid)}</div>
                                    : <div style={{ fontSize: '11px', color: '#3D8B37', marginTop: '2px' }}>완납</div>}
                                </div>
                              ) : <span style={{ color: '#CBD5E0', fontSize: '12px' }}>-</span>}
                            </td>
                          );
                        })}
                        <td className="text-right" style={{ background: '#F7FBFF', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: '800', fontSize: '13px', color: '#1A202C' }}>{formatCurrency(rowTotal)}</div>
                          {rowUnpaid > 0
                            ? <div style={{ fontSize: '11px', color: '#C62828', marginTop: '2px' }}>미지급 {formatCurrency(rowUnpaid)}</div>
                            : <div style={{ fontSize: '11px', color: '#3D8B37', marginTop: '2px' }}>완납</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#EBF4FF', fontWeight: '800' }}>
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#2C5AA0' }}>월 합계</td>
                    {pivotData.months.map((m) => {
                      const colTotal = pivotData.parties.reduce((s, name) => s + (pivotData.cells[`${name}__${m.key}`]?.total || 0), 0);
                      return (
                        <td key={m.key} className="text-right" style={{ padding: '10px 14px', color: '#1A202C' }}>{formatCurrency(colTotal)}</td>
                      );
                    })}
                    <td className="text-right" style={{ padding: '10px 14px', color: '#2C5AA0' }}>
                      {formatCurrency(pivotData.parties.reduce((s, name) => s + pivotData.months.reduce((ss, m) => ss + (pivotData.cells[`${name}__${m.key}`]?.total || 0), 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div className="search-bar">
          <div className="search-input-wrap">
            <FaSearch />
            <input className="form-input" placeholder={`${isSales ? '거래처명' : '공급업체명'} 또는 번호 검색...`} value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {payOpts.map((o) => (
              <button key={o.v} onClick={() => setPayFilter(o.v)}
                style={{ padding: '6px 14px', border: '1.5px solid', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: payFilter === o.v ? '#2C5AA0' : '#fff', color: payFilter === o.v ? '#fff' : '#4A5568', borderColor: payFilter === o.v ? '#2C5AA0' : '#E2E8F0' }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>총 {filtered.length}건</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>{isSales ? '거래처' : '공급업체'}</th>
                <th>품목 요약</th>
                <th className="text-right">총액</th>
                <th className="text-right">수금액</th>
                <th className="text-right">미수금</th>
                <th>{isSales ? '납품일' : '입고예정일'}</th>
                <th>수금상태</th>
                <th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>내역이 없습니다.</td></tr>
              ) : filtered.map((o) => {
                const unpaid = o.totalAmount - o.paidAmount;
                return (
                  <tr key={o.id}>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace', color: '#2C5AA0', fontWeight: '700', cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>{o[numKey]}</td>
                    <td style={{ cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{o[nameKey]}</div>
                      <div style={{ fontSize: '11px', color: '#718096' }}>{formatDate(o[dateKey])}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: '#4A5568', cursor: 'pointer' }} onClick={() => setDetailOrder(o)}>
                      {o.items?.[0]?.productName}{(o.items?.length || 0) > 1 ? ` 외 ${o.items.length - 1}건` : ''}
                    </td>
                    <td className="text-right" style={{ fontWeight: '800', fontSize: '14px' }}>{formatCurrency(o.totalAmount)}</td>
                    <td className="text-right" style={{ fontWeight: '600', color: '#3D8B37' }}>{formatCurrency(o.paidAmount)}</td>
                    <td className="text-right" style={{ fontWeight: '700', color: unpaid > 0 ? '#C62828' : '#3D8B37' }}>
                      {unpaid > 0 ? formatCurrency(unpaid) : '완납'}
                    </td>
                    <td style={{ fontSize: '12px', color: '#718096' }}>{o.deliveryDate || o.expectedDate ? formatDate(o.deliveryDate || o.expectedDate) : '-'}</td>
                    <td>
                      <span className={`badge ${getPaymentStatusClass(o.paymentStatus)}`}>{getPaymentStatusLabel(o.paymentStatus)}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => setPaymentTarget(o)} title="수금 처리" style={{ padding: '5px 8px', background: '#EAF5E9', color: '#3D8B37', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>수금</button>
                        <button onClick={() => openEdit(o)} style={{ padding: '5px 8px', background: '#EBF4FF', color: '#2C5AA0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaEdit size={11} /></button>
                        <button onClick={() => handleDelete(o)} style={{ padding: '5px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#F7FAFC', fontWeight: '700' }}>
                  <td colSpan={3} style={{ padding: '12px 14px', fontSize: '13px', color: '#4A5568' }}>소계</td>
                  <td className="text-right" style={{ padding: '12px 14px', fontSize: '14px', color: '#1A202C' }}>{formatCurrency(filtered.reduce((s, o) => s + o.totalAmount, 0))}</td>
                  <td className="text-right" style={{ padding: '12px 14px', color: '#3D8B37' }}>{formatCurrency(filtered.reduce((s, o) => s + o.paidAmount, 0))}</td>
                  <td className="text-right" style={{ padding: '12px 14px', color: '#C62828' }}>{formatCurrency(filtered.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0))}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 상세 모달 */}
      {detailOrder && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '700' }}>{detailOrder[numKey]}</h3>
                <span className={`badge ${getPaymentStatusClass(detailOrder.paymentStatus)}`} style={{ marginTop: '6px', display: 'inline-block' }}>{getPaymentStatusLabel(detailOrder.paymentStatus)}</span>
              </div>
              <button onClick={() => setDetailOrder(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#718096' }}><FaTimes /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[[isSales ? '거래처' : '공급업체', detailOrder[nameKey]], ['결제방법', detailOrder.paymentMethod], [isSales ? '납품일' : '입고예정일', formatDate(detailOrder.deliveryDate || detailOrder.expectedDate)], ['담당자', detailOrder.user], ['등록일', formatDate(detailOrder[dateKey])]].map(([k, v]) => (
                <div key={k} style={{ background: '#F7FAFC', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '2px' }}>{k}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{v || '-'}</div>
                </div>
              ))}
            </div>
            <table className="data-table" style={{ marginBottom: '12px' }}>
              <thead><tr><th>제품명</th><th className="text-right">수량</th><th className="text-right">단가</th><th className="text-right">합계</th></tr></thead>
              <tbody>
                {(detailOrder.items || []).map((item, i) => (
                  <tr key={i}><td>{item.productName}</td><td className="text-right">{item.quantity?.toLocaleString()}</td><td className="text-right">{formatCurrency(item.unitPrice)}</td><td className="text-right fw-700">{formatCurrency(item.total)}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ background: '#F7FAFC', borderRadius: '8px', padding: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>총액</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1A202C' }}>{formatCurrency(detailOrder.totalAmount)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>수금액</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#3D8B37' }}>{formatCurrency(detailOrder.paidAmount)}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginBottom: '4px' }}>미수금</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: detailOrder.totalAmount - detailOrder.paidAmount > 0 ? '#C62828' : '#3D8B37' }}>
                  {detailOrder.totalAmount - detailOrder.paidAmount > 0 ? formatCurrency(detailOrder.totalAmount - detailOrder.paidAmount) : '완납'}
                </div>
              </div>
            </div>
            {detailOrder.note && <div style={{ background: '#FFF8E1', padding: '10px 14px', borderRadius: '7px', fontSize: '13px', color: '#4A5568', marginTop: '12px' }}><strong>비고:</strong> {detailOrder.note}</div>}
            {detailOrder.paymentStatus !== 'paid' && (
              <div className="modal-actions">
                <button onClick={() => { setDetailOrder(null); setPaymentTarget(detailOrder); }} style={{ padding: '9px 18px', background: '#3D8B37', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaMoneyBillWave size={12} /> 수금 처리
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <OrderFormModal
        title={editOrder ? (isSales ? '매출 수정' : '매입 수정') : (isSales ? '매출 등록' : '매입 등록')}
        show={showModal} onClose={() => setShowModal(false)} onSubmit={handleSubmit}
        formData={formData} setFormData={setFormData} isError={!!err} errorMsg={err}
      />

      {/* 수금 처리 모달 */}
      {paymentTarget && (
        <PaymentModal
          order={paymentTarget}
          isSales={isSales}
          onClose={() => setPaymentTarget(null)}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}
