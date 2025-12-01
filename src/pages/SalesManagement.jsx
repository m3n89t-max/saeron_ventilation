import React, { useState, useMemo } from 'react';
import { FaPlus, FaSearch, FaTrash, FaMoneyBillWave, FaUser, FaBoxOpen } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

const Sales = () => {
  const { products, sales, addSale, deleteSale, getTotalSales } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // 월별 필터
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showAllMonths, setShowAllMonths] = useState(true);

  const [saleFormData, setSaleFormData] = useState({
    productId: null,
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0, // 총 판매금액
    paidAmount: 0, // 수금액
    customer: '',
    customerPhone: '',
    address: '',
    note: '',
    user: '관리자',
  });

  // 재고가 있는 제품만 필터링
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.quantity > 0);
  }, [products]);

  // 연도 목록 생성 (최근 5년)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // 검색어 필터
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        sale.productName.toLowerCase().includes(searchLower) ||
        sale.customer.toLowerCase().includes(searchLower) ||
        (sale.customerPhone && sale.customerPhone.includes(searchLower))
      );

      // 월별 필터
      if (!showAllMonths) {
        const saleDate = new Date(sale.date);
        const matchesMonth = (
          saleDate.getFullYear() === selectedYear &&
          saleDate.getMonth() + 1 === selectedMonth
        );
        return matchesSearch && matchesMonth;
      }

      return matchesSearch;
    });
  }, [sales, searchTerm, showAllMonths, selectedYear, selectedMonth]);

  // 필터링된 판매 통계
  const filteredStats = useMemo(() => {
    const totalAmount = filteredSales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
    const totalPaid = filteredSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalUnpaid = totalAmount - totalPaid;
    const count = filteredSales.length;

    return { totalAmount, totalPaid, totalUnpaid, count };
  }, [filteredSales]);

  const totalSalesAmount = useMemo(() => {
    return getTotalSales();
  }, [sales, getTotalSales]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    const calculatedTotal = saleFormData.quantity * product.price;
    setSaleFormData({
      ...saleFormData,
      productId: product.id,
      unitPrice: product.price,
      totalAmount: calculatedTotal,
      paidAmount: 0,
    });
  };

  const handleSaleSubmit = (e) => {
    e.preventDefault();
    
    const result = addSale(saleFormData);
    
    if (result.success) {
      alert(result.message);
      setShowSaleModal(false);
      resetForm();
    } else {
      alert(result.message);
    }
  };

  const resetForm = () => {
    setSaleFormData({
      productId: null,
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      paidAmount: 0,
      customer: '',
      customerPhone: '',
      address: '',
      note: '',
      user: '관리자',
    });
    setSelectedProduct(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('판매 내역을 삭제하시겠습니까? (재고는 복구되지 않습니다)')) {
      deleteSale(id);
    }
  };

  const todaySales = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter((s) => s.date.split('T')[0] === today);
  }, [sales]);

  const todaySalesAmount = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
  }, [todaySales]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>판매 관리</h2>
          <p style={styles.subtitle}>제품 판매 및 고객 관리</p>
        </div>
        <button onClick={() => setShowSaleModal(true)} style={styles.addButton}>
          <FaPlus style={{ marginRight: '8px' }} />
          판매 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaMoneyBillWave style={{ color: '#4CAF50', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>총 판매액 (전체)</div>
            <div style={styles.statValue}>{formatCurrency(totalSalesAmount)}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaBoxOpen style={{ color: '#2196F3', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>총 판매 건수 (전체)</div>
            <div style={styles.statValue}>{formatNumber(sales.length)}건</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaMoneyBillWave style={{ color: '#FF9800', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>오늘 판매액</div>
            <div style={styles.statValue}>{formatCurrency(todaySalesAmount)}</div>
            <div style={styles.statSubtext}>{todaySales.length}건</div>
          </div>
        </div>
      </div>

      {/* 월별 필터 및 필터링된 통계 */}
      <div style={styles.filterCard}>
        <div style={styles.filterHeader}>
          <h3 style={styles.filterTitle}>판매 내역 조회</h3>
          <div style={styles.filterToggle}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showAllMonths}
                onChange={(e) => setShowAllMonths(e.target.checked)}
                style={styles.checkbox}
              />
              전체 기간 보기
            </label>
          </div>
        </div>

        {!showAllMonths && (
          <div style={styles.monthSelector}>
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
        )}

        {/* 필터링된 통계 */}
        <div style={styles.filteredStats}>
          <div style={styles.filteredStatItem}>
            <div style={styles.filteredStatLabel}>
              {showAllMonths ? '전체' : `${selectedYear}년 ${selectedMonth}월`} 판매
            </div>
            <div style={styles.filteredStatValue}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {formatNumber(filteredStats.count)}건
              </span>
            </div>
          </div>
          <div style={styles.filteredStatItem}>
            <div style={styles.filteredStatLabel}>판매액</div>
            <div style={styles.filteredStatValue}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                {formatCurrency(filteredStats.totalAmount)}
              </span>
            </div>
          </div>
          <div style={styles.filteredStatItem}>
            <div style={styles.filteredStatLabel}>수금액</div>
            <div style={styles.filteredStatValue}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
                {formatCurrency(filteredStats.totalPaid)}
              </span>
            </div>
          </div>
          <div style={styles.filteredStatItem}>
            <div style={styles.filteredStatLabel}>미수금</div>
            <div style={styles.filteredStatValue}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#F44336' }}>
                {formatCurrency(filteredStats.totalUnpaid)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div style={styles.searchBox}>
        <FaSearch style={styles.searchIcon} />
        <input
          type="text"
          placeholder="제품명, 고객명, 전화번호로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* 판매 내역 테이블 */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>판매일시</th>
              <th style={styles.th}>제품명</th>
              <th style={styles.th}>수량</th>
              <th style={styles.th}>판매금액</th>
              <th style={styles.th}>수금액</th>
              <th style={styles.th}>미수금</th>
              <th style={styles.th}>고객명</th>
              <th style={styles.th}>연락처</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan="10" style={styles.emptyMessage}>
                  판매 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => {
                const unpaidAmount = (sale.totalPrice || 0) - (sale.paidAmount || 0);
                const paymentStatus = unpaidAmount === 0 ? '완납' : unpaidAmount === sale.totalPrice ? '미수' : '부분수금';
                const statusColor = unpaidAmount === 0 ? '#4CAF50' : unpaidAmount === sale.totalPrice ? '#F44336' : '#FF9800';
                
                return (
                  <tr key={sale.id} style={styles.tableRow}>
                    <td style={styles.td}>{formatDate(sale.date)}</td>
                    <td style={styles.td}>
                      <div style={styles.productName}>{sale.productName}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.quantityBadge}>{formatNumber(sale.quantity)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.totalPrice}>{formatCurrency(sale.totalPrice || 0)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.paidAmount }}>{formatCurrency(sale.paidAmount || 0)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.unpaidAmount, color: statusColor }}>
                        {formatCurrency(unpaidAmount)}
                      </span>
                    </td>
                    <td style={styles.td}>{sale.customer}</td>
                    <td style={styles.td}>{sale.customerPhone || '-'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusBadge, backgroundColor: statusColor }}>
                        {paymentStatus}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        style={{ ...styles.actionButton, backgroundColor: '#F44336' }}
                        title="삭제"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 판매 등록 모달 */}
      {showSaleModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSaleModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>판매 등록</h3>
            <form onSubmit={handleSaleSubmit}>
              {/* 제품 선택 */}
              <div style={styles.formGroup}>
                <label style={styles.label}>제품 선택 *</label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = availableProducts.find((p) => p.id === parseInt(e.target.value));
                    if (product) handleProductSelect(product);
                  }}
                  style={styles.input}
                  required
                >
                  <option value="">제품을 선택하세요</option>
                  {availableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (재고: {product.quantity})
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div style={styles.productInfo}>
                  <p>
                    현재 재고: <strong>{formatNumber(selectedProduct.quantity)}</strong>
                  </p>
                  <p>
                    판매 단가: <strong>{formatCurrency(selectedProduct.price)}</strong>
                  </p>
                </div>
              )}

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>판매 수량 *</label>
                  <input
                    type="number"
                    value={saleFormData.quantity}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value) || 1;
                      const calculatedTotal = quantity * saleFormData.unitPrice;
                      setSaleFormData({
                        ...saleFormData,
                        quantity,
                        totalAmount: calculatedTotal,
                      });
                    }}
                    style={styles.input}
                    min="1"
                    max={selectedProduct?.quantity || 1}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>판매 단가 *</label>
                  <input
                    type="number"
                    value={saleFormData.unitPrice}
                    onChange={(e) => {
                      const unitPrice = parseInt(e.target.value) || 0;
                      const calculatedTotal = saleFormData.quantity * unitPrice;
                      setSaleFormData({
                        ...saleFormData,
                        unitPrice,
                        totalAmount: calculatedTotal,
                      });
                    }}
                    style={styles.input}
                    required
                    min="0"
                    placeholder="원"
                  />
                </div>
              </div>

              {/* 총 판매금액 및 수금액 */}
              <div style={styles.paymentSection}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>총 판매금액 *</label>
                  <input
                    type="number"
                    value={saleFormData.totalAmount}
                    onChange={(e) =>
                      setSaleFormData({
                        ...saleFormData,
                        totalAmount: parseInt(e.target.value) || 0,
                      })
                    }
                    style={styles.input}
                    required
                    min="0"
                    placeholder="원"
                  />
                  <div style={styles.helpText}>
                    자동 계산: {formatCurrency(saleFormData.quantity * saleFormData.unitPrice)}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>수금액</label>
                  <input
                    type="number"
                    value={saleFormData.paidAmount}
                    onChange={(e) =>
                      setSaleFormData({
                        ...saleFormData,
                        paidAmount: parseInt(e.target.value) || 0,
                      })
                    }
                    style={styles.input}
                    min="0"
                    max={saleFormData.totalAmount}
                    placeholder="수금한 금액 입력"
                  />
                  <div style={styles.helpText}>
                    미수금: {formatCurrency(saleFormData.totalAmount - saleFormData.paidAmount)}
                  </div>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>고객명 *</label>
                  <input
                    type="text"
                    value={saleFormData.customer}
                    onChange={(e) =>
                      setSaleFormData({ ...saleFormData, customer: e.target.value })
                    }
                    style={styles.input}
                    required
                    placeholder="고객명 입력"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>연락처</label>
                  <input
                    type="tel"
                    value={saleFormData.customerPhone}
                    onChange={(e) =>
                      setSaleFormData({ ...saleFormData, customerPhone: e.target.value })
                    }
                    style={styles.input}
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>배송지 주소</label>
                <input
                  type="text"
                  value={saleFormData.address}
                  onChange={(e) =>
                    setSaleFormData({ ...saleFormData, address: e.target.value })
                  }
                  style={styles.input}
                  placeholder="배송지 주소"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>담당자 *</label>
                <input
                  type="text"
                  value={saleFormData.user}
                  onChange={(e) => setSaleFormData({ ...saleFormData, user: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>비고</label>
                <textarea
                  value={saleFormData.note}
                  onChange={(e) => setSaleFormData({ ...saleFormData, note: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px' }}
                  placeholder="특이사항을 입력하세요"
                />
              </div>

              {/* 수금 정보 요약 */}
              {selectedProduct && saleFormData.totalAmount > 0 && (
                <div style={styles.paymentSummary}>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>총 판매금액:</span>
                    <span style={styles.summaryValue}>{formatCurrency(saleFormData.totalAmount)}</span>
                  </div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>수금액:</span>
                    <span style={{ ...styles.summaryValue, color: '#4CAF50' }}>
                      {formatCurrency(saleFormData.paidAmount)}
                    </span>
                  </div>
                  <div style={styles.summaryDivider}></div>
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>미수금:</span>
                    <span style={{ 
                      ...styles.summaryValue, 
                      color: saleFormData.totalAmount - saleFormData.paidAmount > 0 ? '#F44336' : '#4CAF50',
                      fontWeight: 'bold',
                      fontSize: '20px'
                    }}>
                      {formatCurrency(saleFormData.totalAmount - saleFormData.paidAmount)}
                    </span>
                  </div>
                </div>
              )}

              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton} disabled={!selectedProduct}>
                  판매 등록
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSaleModal(false);
                    resetForm();
                  }}
                  style={styles.cancelButton}
                >
                  취소
                </button>
              </div>
            </form>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  statIcon: {
    flex: '0 0 auto',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  statSubtext: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  searchIcon: {
    position: 'absolute',
    left: '32px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 45px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '2px solid #e0e0e0',
  },
  tableRow: {
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  emptyMessage: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
  },
  productName: {
    fontWeight: 'bold',
    color: '#333',
  },
  quantityBadge: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#2196F3',
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#4CAF50',
  },
  actionButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    fontSize: '14px',
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
    maxWidth: '700px',
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
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
  },
  label: {
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  productInfo: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  paymentSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    backgroundColor: '#F0F7FF',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  helpText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  paymentSummary: {
    backgroundColor: '#E8F5E9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#555',
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: '#C8E6C9',
    margin: '12px 0',
  },
  paidAmount: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#4CAF50',
  },
  unpaidAmount: {
    fontWeight: 'bold',
    fontSize: '16px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-block',
  },
  totalAmountBox: {
    backgroundColor: '#E8F5E9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  totalAmountLabel: {
    fontSize: '14px',
    color: '#2E7D32',
    margin: 0,
    marginBottom: '8px',
  },
  totalAmount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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
    transition: 'background-color 0.2s',
  },
  filterCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  filterTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  filterToggle: {
    display: 'flex',
    alignItems: 'center',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  monthSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
  },
  select: {
    padding: '10px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  filteredStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  filteredStatItem: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#F5F7FA',
    borderRadius: '8px',
  },
  filteredStatLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
    fontWeight: '500',
  },
  filteredStatValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
};

export default Sales;
