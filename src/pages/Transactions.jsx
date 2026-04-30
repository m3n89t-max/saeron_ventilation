import React, { useState, useMemo } from 'react';
import { FaSearch, FaArrowUp, FaArrowDown, FaHistory, FaDownload } from 'react-icons/fa';
import useAppStore from '../store/appStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Transactions() {
  const { transactions, products } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [catFilter, setCatFilter] = useState('전체');

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['전체', ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = (t.productName || '').toLowerCase().includes(search.toLowerCase())
        || (t.note || '').toLowerCase().includes(search.toLowerCase())
        || (t.reference || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === '전체' || t.type === typeFilter;
      const product = products.find((p) => p.id === t.productId);
      const matchCat = catFilter === '전체' || (product && product.category === catFilter);
      return matchSearch && matchType && matchCat;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, search, typeFilter, catFilter, products]);

  const stats = useMemo(() => {
    const inTx = transactions.filter((t) => t.type === 'in');
    const outTx = transactions.filter((t) => t.type === 'out');
    const inVal = inTx.reduce((s, t) => s + (t.quantity * t.unitPrice), 0);
    const outVal = outTx.reduce((s, t) => s + (t.quantity * t.unitPrice), 0);
    return { inCount: inTx.length, outCount: outTx.length, inVal, outVal, total: transactions.length };
  }, [transactions]);

  const handleExport = () => {
    const rows = [['날짜', '제품명', '구분', '수량', '단가', '금액', '담당자', '비고', '참조번호']];
    filtered.forEach((t) => {
      rows.push([formatDate(t.date), t.productName, t.type === 'in' ? '입고' : '출고', t.quantity, t.unitPrice, t.quantity * t.unitPrice, t.user, t.note, t.reference]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `입출고내역_${new Date().toLocaleDateString('ko-KR').replace(/\./g, '').replace(/ /g, '')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const typeOpts = [{ v: '전체', l: '전체' }, { v: 'in', l: '입고' }, { v: 'out', l: '출고' }];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h2 className="page-title">입출고 내역</h2><p className="page-subtitle">제품 입고 및 출고 거래 이력</p></div>
        <button className="btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px' }}>
          <FaDownload size={12} /> CSV 내보내기
        </button>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: '20px' }}>
        <StatsCard icon={<FaHistory />} title="전체 거래건수" value={`${stats.total}건`} sub="입고 + 출고" color="#2C5AA0" />
        <StatsCard icon={<FaArrowDown />} title="입고 건수" value={`${stats.inCount}건`} sub={formatCurrency(stats.inVal)} color="#3D8B37" />
        <StatsCard icon={<FaArrowUp />} title="출고 건수" value={`${stats.outCount}건`} sub={formatCurrency(stats.outVal)} color="#C62828" />
        <StatsCard icon={<FaHistory />} title="표시 건수" value={`${filtered.length}건`} sub="현재 필터 기준" color="#6A1B9A" />
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '14px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
        <div className="search-bar">
          <div className="search-input-wrap">
            <FaSearch />
            <input className="form-input" placeholder="제품명, 비고, 참조번호 검색..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {typeOpts.map((o) => (
              <button key={o.v} onClick={() => setTypeFilter(o.v)}
                style={{ padding: '6px 14px', border: '1.5px solid', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', background: typeFilter === o.v ? (o.v === 'in' ? '#3D8B37' : o.v === 'out' ? '#C62828' : '#2C5AA0') : '#fff', color: typeFilter === o.v ? '#fff' : '#4A5568', borderColor: typeFilter === o.v ? (o.v === 'in' ? '#3D8B37' : o.v === 'out' ? '#C62828' : '#2C5AA0') : '#E2E8F0' }}>
                {o.l}
              </button>
            ))}
            <select className="form-input" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ minWidth: '100px', fontSize: '12px', padding: '6px 10px' }}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
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
                <th>날짜</th><th>구분</th><th>제품명</th><th className="text-right">수량</th><th className="text-right">단가</th><th className="text-right">금액</th><th>담당자</th><th>비고</th><th>참조번호</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>내역이 없습니다.</td></tr>
              ) : filtered.map((t) => {
                const isIn = t.type === 'in';
                return (
                  <tr key={t.id}>
                    <td style={{ fontSize: '12px', color: '#718096', whiteSpace: 'nowrap' }}>{formatDate(t.date)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: isIn ? '#EAF5E9' : '#FFEBEE', color: isIn ? '#3D8B37' : '#C62828' }}>
                        {isIn ? <FaArrowDown size={9} /> : <FaArrowUp size={9} />} {isIn ? '입고' : '출고'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{t.productName}</div>
                    </td>
                    <td className="text-right" style={{ fontWeight: '700', fontSize: '15px', color: isIn ? '#3D8B37' : '#C62828' }}>
                      {isIn ? '+' : '-'}{t.quantity?.toLocaleString()}
                    </td>
                    <td className="text-right" style={{ fontSize: '13px', color: '#718096' }}>{formatCurrency(t.unitPrice)}</td>
                    <td className="text-right" style={{ fontWeight: '700', fontSize: '13px' }}>{formatCurrency(t.quantity * t.unitPrice)}</td>
                    <td style={{ fontSize: '12px', color: '#718096' }}>{t.user}</td>
                    <td style={{ fontSize: '12px', color: '#4A5568', maxWidth: '180px' }}>{t.note}</td>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace', color: '#2C5AA0' }}>{t.reference || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
