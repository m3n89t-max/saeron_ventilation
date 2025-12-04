import React, { useState, useMemo } from 'react';
import { FaCalendarAlt, FaCheckCircle, FaTrash, FaChartBar, FaFileInvoice, FaLock } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatNumber } from '../utils/formatters';

const MonthlyClosing = () => {
  const { 
    sales, 
    monthlyClosings,
    createMonthlyClosing, 
    deleteMonthlyClosing,
    getAllMonthlyClosings 
  } = useInventoryStore();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [selectedClosing, setSelectedClosing] = useState(null);

  // 현재 연도 기준 최근 5년
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 선택된 월의 판매 데이터
  const selectedMonthSales = useMemo(() => {
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    
    return sales.filter((s) => {
      const saleDate = new Date(s.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }, [sales, selectedYear, selectedMonth]);

  // 선택된 월의 통계
  const selectedMonthStats = useMemo(() => {
    const totalSales = selectedMonthSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const totalPaid = selectedMonthSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalUnpaid = totalSales - totalPaid;
    const count = selectedMonthSales.length;

    return { totalSales, totalPaid, totalUnpaid, count };
  }, [selectedMonthSales]);

  // 마감 여부 확인
  const isMonthClosed = useMemo(() => {
    return monthlyClosings.some(
      (c) => c.year === selectedYear && c.month === selectedMonth
    );
  }, [monthlyClosings, selectedYear, selectedMonth]);

  // 모든 마감 내역
  const allClosings = useMemo(() => {
    return getAllMonthlyClosings();
  }, [monthlyClosings, getAllMonthlyClosings]);

  const handleCreateClosing = () => {
    if (selectedMonthSales.length === 0) {
      alert('마감할 판매 내역이 없습니다.');
      return;
    }

    const result = createMonthlyClosing(selectedYear, selectedMonth);
    
    if (result.success) {
      alert(result.message);
      setShowClosingModal(false);
    } else {
      alert(result.message);
    }
  };

  const handleDeleteClosing = (id) => {
    if (window.confirm('마감 내역을 삭제하시겠습니까?')) {
      deleteMonthlyClosing(id);
      alert('마감 내역이 삭제되었습니다.');
    }
  };

  const handleViewClosing = (closing) => {
    setSelectedClosing(closing);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>월별 마감</h2>
          <p style={styles.subtitle}>월별 판매 현황 마감 및 조회</p>
        </div>
      </div>

      {/* 마감 생성 섹션 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <FaCalendarAlt style={{ marginRight: '8px' }} />
          마감 생성
        </h3>
        
        <div style={styles.closingForm}>
          <div style={styles.dateSelector}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={styles.select}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={styles.select}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </select>
          </div>

          <div style={styles.monthSummary}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>판매 건수</div>
              <div style={styles.summaryValue}>{formatNumber(selectedMonthStats.count)}건</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>총 매출액</div>
              <div style={styles.summaryValue}>{formatCurrency(selectedMonthStats.totalSales)}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>수금액</div>
              <div style={{ ...styles.summaryValue, color: '#4CAF50' }}>
                {formatCurrency(selectedMonthStats.totalPaid)}
              </div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>미수금</div>
              <div style={{ ...styles.summaryValue, color: '#F44336' }}>
                {formatCurrency(selectedMonthStats.totalUnpaid)}
              </div>
            </div>
          </div>

          {isMonthClosed ? (
            <div style={styles.closedBadge}>
              <FaLock style={{ marginRight: '8px' }} />
              이미 마감된 월입니다
            </div>
          ) : (
            <button
              onClick={() => setShowClosingModal(true)}
              style={styles.closingButton}
              disabled={selectedMonthStats.count === 0}
            >
              <FaCheckCircle style={{ marginRight: '8px' }} />
              {selectedYear}년 {selectedMonth}월 마감하기
            </button>
          )}
        </div>
      </div>

      {/* 마감 내역 목록 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <FaFileInvoice style={{ marginRight: '8px' }} />
          마감 내역
        </h3>

        {allClosings.length === 0 ? (
          <div style={styles.emptyMessage}>
            마감된 내역이 없습니다.
          </div>
        ) : (
          <div style={styles.closingList}>
            {allClosings.map((closing) => (
              <div key={closing.id} style={styles.closingItem}>
                <div style={styles.closingHeader}>
                  <div style={styles.closingTitle}>
                    <FaCalendarAlt style={{ marginRight: '8px', color: '#2196F3' }} />
                    {closing.year}년 {closing.month}월 마감
                  </div>
                  <div style={styles.closingDate}>
                    마감일: {new Date(closing.closingDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <div style={styles.closingStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>판매 건수</span>
                    <span style={styles.statValue}>{formatNumber(closing.salesCount)}건</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>총 매출액</span>
                    <span style={styles.statValue}>{formatCurrency(closing.totalSales)}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>수금액</span>
                    <span style={{ ...styles.statValue, color: '#4CAF50' }}>
                      {formatCurrency(closing.totalPaid)}
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>미수금</span>
                    <span style={{ ...styles.statValue, color: '#F44336' }}>
                      {formatCurrency(closing.totalUnpaid)}
                    </span>
                  </div>
                </div>

                <div style={styles.paymentStatus}>
                  <span style={styles.statusBadge}>
                    완납: {closing.paymentStatus.fullyPaid}건
                  </span>
                  <span style={{ ...styles.statusBadge, backgroundColor: '#FF9800' }}>
                    부분수금: {closing.paymentStatus.partiallyPaid}건
                  </span>
                  <span style={{ ...styles.statusBadge, backgroundColor: '#F44336' }}>
                    미수: {closing.paymentStatus.unpaid}건
                  </span>
                </div>

                <div style={styles.closingActions}>
                  <button
                    onClick={() => handleViewClosing(closing)}
                    style={styles.viewButton}
                  >
                    <FaChartBar style={{ marginRight: '4px' }} />
                    상세보기
                  </button>
                  <button
                    onClick={() => handleDeleteClosing(closing.id)}
                    style={styles.deleteButton}
                  >
                    <FaTrash style={{ marginRight: '4px' }} />
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 마감 확인 모달 */}
      {showClosingModal && (
        <div style={styles.modalOverlay} onClick={() => setShowClosingModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>월별 마감 확인</h3>
            <div style={styles.modalContent}>
              <p style={styles.modalText}>
                <strong>{selectedYear}년 {selectedMonth}월</strong>을 마감하시겠습니까?
              </p>
              <div style={styles.modalSummary}>
                <p>• 판매 건수: {formatNumber(selectedMonthStats.count)}건</p>
                <p>• 총 매출액: {formatCurrency(selectedMonthStats.totalSales)}</p>
                <p>• 수금액: {formatCurrency(selectedMonthStats.totalPaid)}</p>
                <p>• 미수금: {formatCurrency(selectedMonthStats.totalUnpaid)}</p>
              </div>
              <p style={styles.warningText}>
                ⚠️ 마감 후에는 해당 월의 판매 데이터가 저장되며, 마감 내역을 삭제하지 않는 한 수정할 수 없습니다.
              </p>
            </div>
            <div style={styles.modalActions}>
              <button onClick={handleCreateClosing} style={styles.confirmButton}>
                마감 실행
              </button>
              <button onClick={() => setShowClosingModal(false)} style={styles.cancelButton}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 마감 상세보기 모달 */}
      {selectedClosing && (
        <div style={styles.modalOverlay} onClick={() => setSelectedClosing(null)}>
          <div style={styles.largeModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {selectedClosing.year}년 {selectedClosing.month}월 마감 상세
            </h3>
            
            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>카테고리별 매출</h4>
              <table style={styles.detailTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>카테고리</th>
                    <th style={styles.th}>판매수량</th>
                    <th style={styles.th}>매출액</th>
                    <th style={styles.th}>수금액</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClosing.categoryBreakdown.map((cat) => (
                    <tr key={cat.category}>
                      <td style={styles.td}>{cat.category}</td>
                      <td style={styles.td}>{formatNumber(cat.quantity)}</td>
                      <td style={styles.td}>{formatCurrency(cat.sales)}</td>
                      <td style={styles.td}>{formatCurrency(cat.paid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setSelectedClosing(null)} style={styles.cancelButton}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  closingForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  dateSelector: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: 'white',
  },
  monthSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  closingButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 32px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  closedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  closingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  closingItem: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  closingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  closingTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  closingDate: {
    fontSize: '14px',
    color: '#666',
  },
  closingStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  paymentStatus: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  closingActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  emptyMessage: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '500px',
    width: '90%',
  },
  largeModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#333',
  },
  modalContent: {
    marginBottom: '24px',
  },
  modalText: {
    fontSize: '16px',
    marginBottom: '16px',
    color: '#333',
  },
  modalSummary: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  warningText: {
    fontSize: '14px',
    color: '#F57C00',
    backgroundColor: '#FFF3E0',
    padding: '12px',
    borderRadius: '8px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  detailSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#333',
  },
  detailTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '2px solid #e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
};

export default MonthlyClosing;
