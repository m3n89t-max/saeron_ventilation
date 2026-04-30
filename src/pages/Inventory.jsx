import React, { useState, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaArrowUp, FaArrowDown, FaBoxes, FaTimes } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatNumber, formatDate, getStockStatusLabel, getStockStatusClass } from '../utils/formatters';

const EMPTY_PRODUCT = { name: '', category: '복합환풍기', quantity: 0, minQuantity: 10, purchasePrice: 0, salePrice: 0, location: '', supplier: '' };
const EMPTY_STOCK = { quantity: 1, unitPrice: 0, note: '', user: '관리자' };

export default function Inventory() {
  const { products, productCategories, addProduct, updateProduct, deleteProduct, addStockIn, addStockOut, getLowStockProducts, getTotalInventoryValue } = useAppStore();

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('전체');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockType, setStockType] = useState('in');
  const [formData, setFormData] = useState(EMPTY_PRODUCT);
  const [stockForm, setStockForm] = useState(EMPTY_STOCK);
  const [err, setErr] = useState('');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === '전체' || p.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    totalQty: products.reduce((s, p) => s + p.quantity, 0),
    totalValue: getTotalInventoryValue(),
    lowStock: getLowStockProducts().length,
  }), [products]);

  const openAdd = () => { setEditProduct(null); setFormData(EMPTY_PRODUCT); setErr(''); setShowProductModal(true); };
  const openEdit = (p) => { setEditProduct(p); setFormData({ name: p.name, category: p.category, quantity: p.quantity, minQuantity: p.minQuantity, purchasePrice: p.purchasePrice, salePrice: p.salePrice, location: p.location, supplier: p.supplier }); setErr(''); setShowProductModal(true); };
  const openStock = (p, type) => { setStockTarget(p); setStockType(type); setStockForm({ ...EMPTY_STOCK, unitPrice: type === 'in' ? p.purchasePrice : p.salePrice }); setErr(''); setShowStockModal(true); };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setErr('제품명을 입력하세요.');
    if (editProduct) {
      updateProduct(editProduct.id, formData);
    } else {
      addProduct({ ...formData, code: `PRD-${Date.now().toString().slice(-6)}` });
    }
    setShowProductModal(false);
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    const qty = parseInt(stockForm.quantity);
    if (!qty || qty <= 0) return setErr('수량을 입력하세요.');
    const fn = stockType === 'in' ? addStockIn : addStockOut;
    const ok = fn(stockTarget.id, qty, parseInt(stockForm.unitPrice) || 0, stockForm.note, stockForm.user);
    if (!ok) return setErr('재고가 부족합니다.');
    setShowStockModal(false);
  };

  const handleDelete = (p) => {
    if (window.confirm(`"${p.name}" 제품을 삭제하시겠습니까?`)) deleteProduct(p.id);
  };

  const cats = ['전체', ...productCategories];

  const fmt = (v) => {
    if (v >= 100000000) return `${(v / 100000000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}억`;
    if (v >= 10000) return `${Math.floor(v / 10000).toLocaleString('ko-KR')}만`;
    return v.toLocaleString('ko-KR');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">재고 관리</h2>
          <p className="page-subtitle">제품 등록, 입고/출고 처리, 재고 현황 관리</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <FaPlus size={12} /> 제품 등록
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard icon={<FaBoxes />} title="총 제품 수" value={`${stats.total}개`} sub="등록된 제품" color="#2C5AA0" />
        <StatsCard icon={<FaBoxes />} title="총 재고 수량" value={formatNumber(stats.totalQty)} sub="전체 보유수량" color="#3D8B37" />
        <StatsCard icon={<FaBoxes />} title="재고 총액" value={`₩${fmt(stats.totalValue)}`} sub={formatCurrency(stats.totalValue)} color="#6A1B9A" />
        <StatsCard icon={<FaBoxes />} title="부족 재고" value={`${stats.lowStock}개`} sub="최소수량 이하" color={stats.lowStock > 0 ? '#C62828' : '#3D8B37'} />
      </div>

      {/* Filter */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div className="search-bar">
          <div className="search-input-wrap">
            <FaSearch />
            <input className="form-input" placeholder="제품명 또는 코드 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                style={{ padding: '6px 14px', border: '1.5px solid', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: catFilter === c ? '#2C5AA0' : '#fff', color: catFilter === c ? '#fff' : '#4A5568', borderColor: catFilter === c ? '#2C5AA0' : '#E2E8F0', transition: 'all 0.15s' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600' }}>총 {filtered.length}개 제품</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>코드</th>
                <th>제품명</th>
                <th>카테고리</th>
                <th className="text-right">현재수량</th>
                <th className="text-right">최소수량</th>
                <th className="text-right">매입단가</th>
                <th className="text-right">판매단가</th>
                <th>위치</th>
                <th>상태</th>
                <th style={{ textAlign: 'center' }}>입출고</th>
                <th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>검색 결과가 없습니다.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontSize: '12px', color: '#718096', fontFamily: 'monospace' }}>{p.code}</td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>{p.supplier}</div>
                  </td>
                  <td><span style={{ fontSize: '12px', background: '#EBF4FF', color: '#2C5AA0', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{p.category}</span></td>
                  <td className="text-right" style={{ fontWeight: '700', fontSize: '16px', color: p.quantity === 0 ? '#C62828' : p.quantity <= p.minQuantity ? '#E65100' : '#1A202C' }}>
                    {formatNumber(p.quantity)}
                  </td>
                  <td className="text-right" style={{ color: '#718096' }}>{formatNumber(p.minQuantity)}</td>
                  <td className="text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="text-right" style={{ fontWeight: '600', color: '#3D8B37' }}>{formatCurrency(p.salePrice)}</td>
                  <td style={{ fontSize: '12px', color: '#718096' }}>{p.location}</td>
                  <td>
                    <span className={`badge ${getStockStatusClass(p.quantity, p.minQuantity)}`}>
                      {getStockStatusLabel(p.quantity, p.minQuantity)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => openStock(p, 'in')} title="입고" style={{ padding: '5px 10px', background: '#EAF5E9', color: '#3D8B37', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        <FaArrowDown size={10} /> 입고
                      </button>
                      <button onClick={() => openStock(p, 'out')} title="출고" style={{ padding: '5px 10px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        <FaArrowUp size={10} /> 출고
                      </button>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => openEdit(p)} style={{ padding: '5px 8px', background: '#EBF4FF', color: '#2C5AA0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaEdit size={11} /></button>
                      <button onClick={() => handleDelete(p)} style={{ padding: '5px 8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '5px', cursor: 'pointer' }}><FaTrash size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 제품 등록/수정 모달 */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{editProduct ? '제품 수정' : '새 제품 등록'}</h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            {err && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '7px', marginBottom: '14px', fontSize: '13px' }}>{err}</div>}
            <form onSubmit={handleProductSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: '제품명 *', key: 'name', type: 'text', placeholder: '제품명 입력', full: true },
                  { label: '카테고리', key: 'category', type: 'select' },
                  { label: '현재수량', key: 'quantity', type: 'number' },
                  { label: '최소수량', key: 'minQuantity', type: 'number' },
                  { label: '매입단가 (원)', key: 'purchasePrice', type: 'number' },
                  { label: '판매단가 (원)', key: 'salePrice', type: 'number' },
                  { label: '보관 위치', key: 'location', type: 'text', placeholder: '예) 창고A-101' },
                  { label: '공급업체', key: 'supplier', type: 'text', placeholder: '공급업체명' },
                ].map(({ label, key, type, placeholder, full }) => (
                  <div key={key} style={full ? { gridColumn: '1 / -1' } : {}}>
                    <label className="form-label">{label}</label>
                    {type === 'select' ? (
                      <select className="form-input" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}>
                        {productCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input className="form-input" type={type} value={formData[key]} placeholder={placeholder} onChange={(e) => setFormData({ ...formData, [key]: type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
                <button type="submit" className="btn-primary">{editProduct ? '수정 완료' : '등록 완료'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 입고/출고 모달 */}
      {showStockModal && stockTarget && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: stockType === 'in' ? '#3D8B37' : '#C62828' }}>
                {stockType === 'in' ? '입고 처리' : '출고 처리'}
              </h3>
              <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', color: '#718096', cursor: 'pointer' }}><FaTimes /></button>
            </div>
            <div style={{ background: '#F7FAFC', borderRadius: '7px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{stockTarget.name}</div>
              <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>현재 재고: <strong>{formatNumber(stockTarget.quantity)}개</strong></div>
            </div>
            {err && <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px', borderRadius: '7px', marginBottom: '14px', fontSize: '13px' }}>{err}</div>}
            <form onSubmit={handleStockSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label className="form-label">수량 *</label>
                  <input className="form-input" type="number" min="1" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">단가 (원)</label>
                  <input className="form-input" type="number" min="0" value={stockForm.unitPrice} onChange={(e) => setStockForm({ ...stockForm, unitPrice: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">담당자</label>
                  <input className="form-input" type="text" value={stockForm.user} onChange={(e) => setStockForm({ ...stockForm, user: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">비고</label>
                  <input className="form-input" type="text" placeholder="사유/메모" value={stockForm.note} onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowStockModal(false)} style={{ padding: '9px 18px', border: '1.5px solid #E2E8F0', borderRadius: '7px', background: '#fff', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>취소</button>
                <button type="submit" style={{ padding: '9px 18px', background: stockType === 'in' ? '#3D8B37' : '#C62828', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer' }}>
                  {stockType === 'in' ? '입고 완료' : '출고 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
