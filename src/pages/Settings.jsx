import React, { useState } from 'react';
import { FaDownload, FaUpload, FaTrash, FaCog, FaInfoCircle, FaDatabase } from 'react-icons/fa';
import useAppStore from '../store/appStore';

export default function Settings() {
  const { exportData, resetAll, products, salesOrders, purchaseOrders, quotes, customers, suppliers, expenses, otherIncome, transactions } = useAppStore();
  const [importStatus, setImportStatus] = useState('');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saeron_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('데이터가 내보내기 완료되었습니다.');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.products || data.salesOrders) {
          setImportStatus('백업 파일이 로드되었습니다. (현재 버전에서는 수동으로 데이터를 확인하세요)');
        } else {
          setImportStatus('올바른 백업 파일이 아닙니다.');
        }
      } catch {
        setImportStatus('파일 형식 오류입니다. JSON 파일을 확인하세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (!window.confirm('⚠️ 모든 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    if (!window.confirm('정말로 초기화하시겠습니까? 모든 데이터가 삭제됩니다.')) return;
    resetAll();
    window.location.href = '/';
  };

  const dataCounts = [
    { label: '제품', count: products.length },
    { label: '입출고 내역', count: transactions.length },
    { label: '견적', count: quotes.length },
    { label: '매출', count: salesOrders.length },
    { label: '매입', count: purchaseOrders.length },
    { label: '운영 지출', count: expenses.length },
    { label: '기타 수입', count: otherIncome.length },
    { label: '거래처', count: customers.length },
    { label: '공급업체', count: suppliers.length },
  ];

  const Section = ({ title, icon, children }) => (
    <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A202C', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div><h2 className="page-title">설정</h2><p className="page-subtitle">데이터 관리, 백업, 시스템 정보</p></div>
      </div>

      {/* 데이터 현황 */}
      <Section title="데이터 현황" icon={<FaDatabase color="#2C5AA0" />}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
          {dataCounts.map(({ label, count }) => (
            <div key={label} style={{ background: '#F7FAFC', borderRadius: '8px', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#2C5AA0' }}>{count}</div>
              <div style={{ fontSize: '12px', color: '#718096', fontWeight: '600', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* 데이터 백업 */}
      <Section title="데이터 백업 / 복원" icon={<FaDatabase color="#3D8B37" />}>
        {importStatus && (
          <div style={{ background: '#EAF5E9', color: '#3D8B37', padding: '10px 14px', borderRadius: '7px', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
            {importStatus}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>데이터 내보내기</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>현재 모든 데이터를 JSON 파일로 저장합니다.</div>
            </div>
            <button className="btn-primary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <FaDownload size={12} /> 내보내기
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>데이터 불러오기</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>JSON 백업 파일을 불러옵니다.</div>
            </div>
            <label className="btn-outline" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', flexShrink: 0 }}>
              <FaUpload size={12} /> 불러오기
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            </label>
          </div>
        </div>
      </Section>

      {/* 데이터 초기화 */}
      <Section title="데이터 초기화" icon={<FaTrash color="#C62828" />}>
        <div style={{ background: '#FFEBEE', borderRadius: '8px', padding: '16px', border: '1px solid #FFCDD2' }}>
          <div style={{ fontWeight: '700', fontSize: '14px', color: '#C62828', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaInfoCircle /> 주의: 이 작업은 되돌릴 수 없습니다.
          </div>
          <div style={{ fontSize: '13px', color: '#4A5568', marginBottom: '14px' }}>
            모든 데이터(제품, 매출, 매입, 견적, 입출고 등)가 삭제되고 초기 상태로 돌아갑니다.
            반드시 데이터를 먼저 백업하세요.
          </div>
          <button onClick={handleReset} style={{ padding: '10px 20px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaTrash size={12} /> 데이터 초기화
          </button>
        </div>
      </Section>

      {/* 시스템 정보 */}
      <Section title="시스템 정보" icon={<FaInfoCircle color="#718096" />}>
        <div style={{ display: 'grid', gap: '8px' }}>
          {[
            ['시스템명', '(주)새론 환기시스템 통합관리시스템'],
            ['버전', '2.0.0'],
            ['개발 프레임워크', 'React 18 + Vite'],
            ['상태 관리', 'Zustand (LocalStorage 영구 저장)'],
            ['최종 업데이트', '2026-04-30'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: '1px solid #F0F4F8' }}>
              <span style={{ fontSize: '13px', color: '#718096', fontWeight: '600', minWidth: '140px' }}>{k}</span>
              <span style={{ fontSize: '13px', color: '#1A202C' }}>{v}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
