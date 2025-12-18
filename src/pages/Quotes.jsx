import React, { useState, useMemo } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFileInvoice, FaStar, FaCheckCircle, FaTimesCircle, FaClock, FaFileExcel, FaDownload } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

const Quotes = () => {
  const { 
    quotes, 
    products, 
    addQuote, 
    updateQuote, 
    deleteQuote, 
    getTotalQuotes,
    getSuccessQuotesTotal,
    getProspectQuotes,
  } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, success, rejected

  const [quoteFormData, setQuoteFormData] = useState({
    customerName: '',
    customerCompany: '',
    customerPhone: '',
    customerEmail: '',
    products: [{ productId: null, productName: '', quantity: 1, unitPrice: 0 }],
    totalAmount: 0,
    validUntil: '',
    status: 'pending', // pending, success, rejected
    isProspect: false, // 가망고객 표시
    note: '',
    user: '관리자',
    attachedFile: null, // 첨부파일 정보 { name, size, type, data }
  });

  // 통계 계산
  const stats = useMemo(() => {
    const total = quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
    const successTotal = quotes
      .filter((q) => q.status === 'success')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0);
    const prospectCount = quotes.filter((q) => q.isProspect === true).length;
    const pendingCount = quotes.filter((q) => q.status === 'pending').length;
    const successRate = quotes.length > 0 
      ? ((quotes.filter((q) => q.status === 'success').length / quotes.length) * 100).toFixed(1)
      : 0;

    return {
      total,
      successTotal,
      prospectCount,
      pendingCount,
      successRate,
    };
  }, [quotes]);

  // 필터링된 견적
  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        quote.customerName.toLowerCase().includes(searchLower) ||
        (quote.customerCompany && quote.customerCompany.toLowerCase().includes(searchLower)) ||
        (quote.customerPhone && quote.customerPhone.includes(searchLower))
      );

      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  // 제품 추가
  const handleAddProduct = () => {
    setQuoteFormData({
      ...quoteFormData,
      products: [
        ...quoteFormData.products,
        { productId: null, productName: '', quantity: 1, unitPrice: 0 },
      ],
    });
  };

  // 제품 제거
  const handleRemoveProduct = (index) => {
    const newProducts = quoteFormData.products.filter((_, i) => i !== index);
    setQuoteFormData({
      ...quoteFormData,
      products: newProducts,
    });
    calculateTotal(newProducts);
  };

  // 제품명 변경
  const handleProductNameChange = (index, name) => {
    const newProducts = [...quoteFormData.products];
    newProducts[index].productName = name;
    setQuoteFormData({
      ...quoteFormData,
      products: newProducts,
    });
  };

  // 제품 선택 (옵션)
  const handleProductSelect = (index, productId) => {
    if (!productId) return;
    
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      const newProducts = [...quoteFormData.products];
      newProducts[index] = {
        ...newProducts[index],
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
      };
      setQuoteFormData({
        ...quoteFormData,
        products: newProducts,
      });
      calculateTotal(newProducts);
    }
  };

  // 수량 변경
  const handleQuantityChange = (index, quantity) => {
    const newProducts = [...quoteFormData.products];
    newProducts[index].quantity = parseInt(quantity) || 1;
    setQuoteFormData({
      ...quoteFormData,
      products: newProducts,
    });
    calculateTotal(newProducts);
  };

  // 단가 변경
  const handlePriceChange = (index, price) => {
    const newProducts = [...quoteFormData.products];
    newProducts[index].unitPrice = parseInt(price) || 0;
    setQuoteFormData({
      ...quoteFormData,
      products: newProducts,
    });
    calculateTotal(newProducts);
  };

  // 총액 계산
  const calculateTotal = (products) => {
    const total = products.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
      0
    );
    setQuoteFormData((prev) => ({
      ...prev,
      totalAmount: total,
    }));
  };

  // 파일 첨부 처리
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유효성 검사
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('엑셀 파일만 업로드 가능합니다. (.xls, .xlsx)');
      e.target.value = '';
      return;
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
      e.target.value = '';
      return;
    }

    // 파일을 Base64로 인코딩
    const reader = new FileReader();
    reader.onload = (event) => {
      setQuoteFormData({
        ...quoteFormData,
        attachedFile: {
          name: file.name,
          size: file.size,
          type: file.type,
          data: event.target.result, // Base64 데이터
        },
      });
    };
    reader.readAsDataURL(file);
  };

  // 파일 삭제
  const handleFileRemove = () => {
    setQuoteFormData({
      ...quoteFormData,
      attachedFile: null,
    });
  };

  // 파일 다운로드
  const handleFileDownload = (file) => {
    if (!file) return;
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 견적 제출
  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    
    // 제품명이 입력되었는지 확인
    const hasValidProducts = quoteFormData.products.some(p => p.productName.trim() !== '');
    if (!hasValidProducts) {
      alert('최소 1개 이상의 제품을 입력해주세요.');
      return;
    }

    if (editingQuote) {
      updateQuote(editingQuote.id, quoteFormData);
      alert('견적이 수정되었습니다!');
    } else {
      addQuote(quoteFormData);
      alert('견적이 등록되었습니다!');
    }
    
    setShowQuoteModal(false);
    resetForm();
  };

  // 폼 초기화
  const resetForm = () => {
    setQuoteFormData({
      customerName: '',
      customerCompany: '',
      customerPhone: '',
      customerEmail: '',
      products: [{ productId: null, productName: '', quantity: 1, unitPrice: 0 }],
      totalAmount: 0,
      validUntil: '',
      status: 'pending',
      isProspect: false,
      note: '',
      user: '관리자',
      attachedFile: null,
    });
    setEditingQuote(null);
  };

  // 견적 수정
  const handleEdit = (quote) => {
    setEditingQuote(quote);
    setQuoteFormData({
      customerName: quote.customerName,
      customerCompany: quote.customerCompany || '',
      customerPhone: quote.customerPhone || '',
      customerEmail: quote.customerEmail || '',
      products: quote.products || [{ productId: null, productName: '', quantity: 1, unitPrice: 0 }],
      totalAmount: quote.totalAmount || 0,
      validUntil: quote.validUntil || '',
      status: quote.status || 'pending',
      isProspect: quote.isProspect || false,
      note: quote.note || '',
      user: quote.user || '관리자',
      attachedFile: quote.attachedFile || null,
    });
    setShowQuoteModal(true);
  };

  // 견적 삭제
  const handleDelete = (id) => {
    if (window.confirm('견적을 삭제하시겠습니까?')) {
      deleteQuote(id);
    }
  };

  // 상태 변경
  const handleStatusChange = (id, newStatus) => {
    updateQuote(id, { status: newStatus });
  };

  // 상태 아이콘 및 색상
  const getStatusInfo = (status) => {
    switch (status) {
      case 'success':
        return { icon: <FaCheckCircle />, color: '#4CAF50', text: '성사' };
      case 'rejected':
        return { icon: <FaTimesCircle />, color: '#F44336', text: '불발' };
      default:
        return { icon: <FaClock />, color: '#FF9800', text: '대기중' };
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>견적 현황</h2>
          <p style={styles.subtitle}>고객 견적 관리 및 성사 현황</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setShowQuoteModal(true);
          }} 
          style={styles.addButton}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          견적 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaFileInvoice style={{ color: '#2196F3', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>총 견적액</div>
            <div style={styles.statValue}>{formatCurrency(stats.total)}</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaCheckCircle style={{ color: '#4CAF50', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>성사 금액</div>
            <div style={styles.statValue}>{formatCurrency(stats.successTotal)}</div>
            <div style={styles.statSubtext}>성사율: {stats.successRate}%</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaStar style={{ color: '#FF9800', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>가망고객</div>
            <div style={styles.statValue}>{formatNumber(stats.prospectCount)}명</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>
            <FaClock style={{ color: '#9E9E9E', fontSize: '32px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>대기중</div>
            <div style={styles.statValue}>{formatNumber(stats.pendingCount)}건</div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div style={styles.filterSection}>
        <div style={styles.statusFilter}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              ...styles.filterButton,
              ...(statusFilter === 'all' ? styles.filterButtonActive : {}),
            }}
          >
            전체
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              ...styles.filterButton,
              ...(statusFilter === 'pending' ? styles.filterButtonActive : {}),
            }}
          >
            대기중
          </button>
          <button
            onClick={() => setStatusFilter('success')}
            style={{
              ...styles.filterButton,
              ...(statusFilter === 'success' ? styles.filterButtonActive : {}),
            }}
          >
            성사
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            style={{
              ...styles.filterButton,
              ...(statusFilter === 'rejected' ? styles.filterButtonActive : {}),
            }}
          >
            불발
          </button>
        </div>

        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="고객명, 회사명, 전화번호로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* 견적 내역 테이블 */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>가망</th>
              <th style={styles.th}>견적일시</th>
              <th style={styles.th}>고객명</th>
              <th style={styles.th}>회사명</th>
              <th style={styles.th}>연락처</th>
              <th style={styles.th}>견적금액</th>
              <th style={styles.th}>유효기한</th>
              <th style={styles.th}>첨부파일</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan="10" style={styles.emptyMessage}>
                  견적 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredQuotes.map((quote) => {
                const statusInfo = getStatusInfo(quote.status);
                return (
                  <tr key={quote.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      {quote.isProspect && (
                        <FaStar style={{ color: '#FF9800', fontSize: '18px' }} title="가망고객" />
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(quote.createdDate)}</td>
                    <td style={styles.td}>
                      <div style={styles.customerName}>{quote.customerName}</div>
                    </td>
                    <td style={styles.td}>{quote.customerCompany || '-'}</td>
                    <td style={styles.td}>{quote.customerPhone || '-'}</td>
                    <td style={styles.td}>
                      <span style={styles.amount}>{formatCurrency(quote.totalAmount)}</span>
                    </td>
                    <td style={styles.td}>{quote.validUntil || '-'}</td>
                    <td style={styles.td}>
                      {quote.attachedFile ? (
                        <button
                          onClick={() => handleFileDownload(quote.attachedFile)}
                          style={styles.downloadButton}
                          title={quote.attachedFile.name}
                        >
                          <FaFileExcel style={{ marginRight: '4px', color: '#217346' }} />
                          <FaDownload />
                        </button>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <select
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                        style={{
                          ...styles.statusSelect,
                          color: statusInfo.color,
                          borderColor: statusInfo.color,
                        }}
                      >
                        <option value="pending">대기중</option>
                        <option value="success">성사</option>
                        <option value="rejected">불발</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleEdit(quote)}
                          style={{ ...styles.actionButton, backgroundColor: '#2196F3' }}
                          title="수정"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          style={{ ...styles.actionButton, backgroundColor: '#F44336' }}
                          title="삭제"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 견적 등록/수정 모달 */}
      {showQuoteModal && (
        <div style={styles.modalOverlay} onClick={() => setShowQuoteModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingQuote ? '견적 수정' : '견적 등록'}
            </h3>
            <form onSubmit={handleQuoteSubmit}>
              {/* 고객 정보 */}
              <div style={styles.sectionTitle}>고객 정보</div>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>고객명 *</label>
                  <input
                    type="text"
                    value={quoteFormData.customerName}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, customerName: e.target.value })
                    }
                    style={styles.input}
                    required
                    placeholder="고객명 입력"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>회사명</label>
                  <input
                    type="text"
                    value={quoteFormData.customerCompany}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, customerCompany: e.target.value })
                    }
                    style={styles.input}
                    placeholder="회사명 입력"
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>연락처 *</label>
                  <input
                    type="tel"
                    value={quoteFormData.customerPhone}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, customerPhone: e.target.value })
                    }
                    style={styles.input}
                    required
                    placeholder="010-1234-5678"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>이메일</label>
                  <input
                    type="email"
                    value={quoteFormData.customerEmail}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, customerEmail: e.target.value })
                    }
                    style={styles.input}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* 제품 정보 */}
              <div style={styles.sectionTitle}>
                제품 정보
                <button
                  type="button"
                  onClick={handleAddProduct}
                  style={styles.addProductButton}
                >
                  <FaPlus style={{ marginRight: '4px' }} />
                  제품 추가
                </button>
              </div>

              {quoteFormData.products.map((product, index) => (
                <div key={index} style={styles.productRow}>
                  <div style={styles.productGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>제품명 *</label>
                      <input
                        type="text"
                        value={product.productName}
                        onChange={(e) => handleProductNameChange(index, e.target.value)}
                        style={styles.input}
                        required
                        placeholder="제품명을 직접 입력하세요"
                        list={`product-suggestions-${index}`}
                      />
                      <datalist id={`product-suggestions-${index}`}>
                        {products.map((p) => (
                          <option key={p.id} value={p.name} />
                        ))}
                      </datalist>
                      <select
                        value=""
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        style={{...styles.input, marginTop: '8px', fontSize: '13px', color: '#666'}}
                      >
                        <option value="">또는 등록된 제품에서 선택</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.price)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>수량</label>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={styles.input}
                        min="1"
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>단가</label>
                      <input
                        type="number"
                        value={product.unitPrice}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        style={styles.input}
                        min="0"
                        required
                        placeholder="원"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>소계</label>
                      <div style={styles.subtotal}>
                        {formatCurrency(product.quantity * product.unitPrice)}
                      </div>
                    </div>
                  </div>

                  {quoteFormData.products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(index)}
                      style={styles.removeProductButton}
                      title="제품 제거"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}

              {/* 총 견적금액 */}
              <div style={styles.totalAmountBox}>
                <div style={styles.totalAmountLabel}>총 견적금액</div>
                <div style={styles.totalAmount}>
                  {formatCurrency(quoteFormData.totalAmount)}
                </div>
              </div>

              {/* 견적 상세 정보 */}
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>유효기한</label>
                  <input
                    type="date"
                    value={quoteFormData.validUntil}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, validUntil: e.target.value })
                    }
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>담당자</label>
                  <input
                    type="text"
                    value={quoteFormData.user}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, user: e.target.value })
                    }
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              {/* 가망고객 체크박스 */}
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={quoteFormData.isProspect}
                    onChange={(e) =>
                      setQuoteFormData({ ...quoteFormData, isProspect: e.target.checked })
                    }
                    style={styles.checkbox}
                  />
                  <FaStar style={{ color: '#FF9800', marginLeft: '8px', marginRight: '4px' }} />
                  가망고객으로 표시
                </label>
              </div>

              {/* 비고 */}
              <div style={styles.formGroup}>
                <label style={styles.label}>비고</label>
                <textarea
                  value={quoteFormData.note}
                  onChange={(e) =>
                    setQuoteFormData({ ...quoteFormData, note: e.target.value })
                  }
                  style={{ ...styles.input, minHeight: '80px' }}
                  placeholder="특이사항을 입력하세요"
                />
              </div>

              {/* 견적서 파일 첨부 */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <FaFileExcel style={{ marginRight: '8px', color: '#217346' }} />
                  견적서 파일 첨부 (엑셀)
                </label>
                {quoteFormData.attachedFile ? (
                  <div style={styles.fileAttached}>
                    <div style={styles.fileInfo}>
                      <FaFileExcel style={{ fontSize: '24px', color: '#217346', marginRight: '12px' }} />
                      <div>
                        <div style={styles.fileName}>{quoteFormData.attachedFile.name}</div>
                        <div style={styles.fileSize}>
                          {(quoteFormData.attachedFile.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFileRemove}
                      style={styles.removeFileButton}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <div style={styles.fileUploadBox}>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      onChange={handleFileUpload}
                      style={styles.fileInput}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" style={styles.fileUploadLabel}>
                      <FaFileExcel style={{ fontSize: '32px', color: '#217346', marginBottom: '8px' }} />
                      <div>엑셀 파일을 선택하세요</div>
                      <div style={styles.fileUploadHint}>(.xls, .xlsx 파일, 최대 5MB)</div>
                    </label>
                  </div>
                )}
              </div>

              {/* 버튼 */}
              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingQuote ? '수정' : '등록'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuoteModal(false);
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
  filterSection: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusFilter: {
    display: 'flex',
    gap: '8px',
  },
  filterButton: {
    padding: '10px 20px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#666',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
    color: 'white',
  },
  searchBox: {
    position: 'relative',
    flex: 1,
    minWidth: '300px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
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
  customerName: {
    fontWeight: 'bold',
    color: '#333',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#2196F3',
  },
  statusSelect: {
    padding: '6px 12px',
    border: '2px solid',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: 'white',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
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
    maxWidth: '900px',
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
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '24px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addProductButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  productRow: {
    position: 'relative',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '12px',
  },
  subtotal: {
    padding: '12px',
    backgroundColor: '#E3F2FD',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#2196F3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeProductButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '6px 10px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  totalAmountBox: {
    backgroundColor: '#E8F5E9',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  totalAmountLabel: {
    fontSize: '16px',
    color: '#2E7D32',
    marginBottom: '8px',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#333',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
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
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#E8F5E9',
    border: '1px solid #217346',
    borderRadius: '6px',
    color: '#217346',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  fileUploadBox: {
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  fileInput: {
    display: 'none',
  },
  fileUploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    color: '#666',
    fontSize: '14px',
  },
  fileUploadHint: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
  fileAttached: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#E8F5E9',
    borderRadius: '8px',
    border: '2px solid #217346',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  fileName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
  },
  fileSize: {
    fontSize: '12px',
    color: '#666',
  },
  removeFileButton: {
    padding: '8px 12px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'opacity 0.2s',
  },
};

export default Quotes;
