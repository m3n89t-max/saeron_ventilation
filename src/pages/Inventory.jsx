import React, { useState, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaBoxes, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';

const Inventory = () => {
  const { products, addProduct, updateProduct, deleteProduct, addStock, removeStock } =
    useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockType, setStockType] = useState('in');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '복합환풍기',
    quantity: 0,
    minQuantity: 0,
    price: 0,
    location: '',
    supplier: '',
  });

  const [stockFormData, setStockFormData] = useState({
    quantity: 0,
    note: '',
    user: '관리자',
  });

  const categories = ['전체', '복합환풍기', '일반환풍기', '환기시스템', '전자제품'];

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === '전체' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setShowModal(false);
    resetForm();
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    if (stockType === 'in') {
      addStock(
        stockProduct.id,
        parseInt(stockFormData.quantity),
        stockFormData.note,
        stockFormData.user
      );
    } else {
      const success = removeStock(
        stockProduct.id,
        parseInt(stockFormData.quantity),
        stockFormData.note,
        stockFormData.user
      );
      if (!success) {
        alert('재고가 부족합니다!');
        return;
      }
    }
    setShowStockModal(false);
    resetStockForm();
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      category: '복합환풍기',
      quantity: 0,
      minQuantity: 0,
      price: 0,
      location: '',
      supplier: '',
    });
    setEditingProduct(null);
  };

  const resetStockForm = () => {
    setStockFormData({
      quantity: 0,
      note: '',
      user: '관리자',
    });
    setStockProduct(null);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      quantity: product.quantity,
      minQuantity: product.minQuantity,
      price: product.price,
      location: product.location,
      supplier: product.supplier,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      deleteProduct(id);
    }
  };

  const openStockModal = (product, type) => {
    setStockProduct(product);
    setStockType(type);
    setShowStockModal(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>재고 관리</h2>
        <button
          onClick={() => setShowModal(true)}
          style={styles.addButton}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          제품 추가
        </button>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="제품명 또는 코드로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.categoryFilters}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                ...styles.categoryButton,
                ...(categoryFilter === cat ? styles.categoryButtonActive : {}),
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>제품코드</th>
              <th style={styles.th}>제품명</th>
              <th style={styles.th}>카테고리</th>
              <th style={styles.th}>재고수량</th>
              <th style={styles.th}>최소수량</th>
              <th style={styles.th}>단가</th>
              <th style={styles.th}>보관위치</th>
              <th style={styles.th}>공급업체</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>작업</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>{product.code}</td>
                <td style={styles.td}>
                  <div style={styles.productName}>{product.name}</div>
                </td>
                <td style={styles.td}>
                  <span style={styles.categoryBadge}>{product.category}</span>
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.quantityBadge,
                      color: product.quantity <= product.minQuantity ? '#F44336' : '#4CAF50',
                    }}
                  >
                    {formatNumber(product.quantity)}
                  </span>
                </td>
                <td style={styles.td}>{formatNumber(product.minQuantity)}</td>
                <td style={styles.td}>{formatCurrency(product.price)}</td>
                <td style={styles.td}>{product.location}</td>
                <td style={styles.td}>{product.supplier}</td>
                <td style={styles.td}>
                  {product.quantity === 0 ? (
                    <span style={{ ...styles.statusBadge, backgroundColor: '#F44336' }}>
                      품절
                    </span>
                  ) : product.quantity <= product.minQuantity ? (
                    <span style={{ ...styles.statusBadge, backgroundColor: '#FF9800' }}>
                      부족
                    </span>
                  ) : (
                    <span style={{ ...styles.statusBadge, backgroundColor: '#4CAF50' }}>
                      정상
                    </span>
                  )}
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      onClick={() => openStockModal(product, 'in')}
                      style={{ ...styles.actionButton, backgroundColor: '#4CAF50' }}
                      title="입고"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => openStockModal(product, 'out')}
                      style={{ ...styles.actionButton, backgroundColor: '#2196F3' }}
                      title="출고"
                    >
                      <FaArrowDown />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{ ...styles.actionButton, backgroundColor: '#FF9800' }}
                      title="수정"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{ ...styles.actionButton, backgroundColor: '#F44336' }}
                      title="삭제"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 제품 추가/수정 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingProduct ? '제품 수정' : '제품 추가'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>제품코드</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>제품명</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={styles.input}
                  >
                    {categories.filter((c) => c !== '전체').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>수량</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>최소수량</label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })
                    }
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>단가</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                    }
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>보관위치</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>공급업체</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton}>
                  {editingProduct ? '수정' : '추가'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
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

      {/* 입출고 모달 */}
      {showStockModal && stockProduct && (
        <div style={styles.modalOverlay} onClick={() => setShowStockModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {stockType === 'in' ? '입고 처리' : '출고 처리'} - {stockProduct.name}
            </h3>
            <div style={styles.stockInfo}>
              <p>
                현재 재고: <strong>{formatNumber(stockProduct.quantity)}</strong>
              </p>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>수량</label>
                <input
                  type="number"
                  value={stockFormData.quantity}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  style={styles.input}
                  min="1"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>담당자</label>
                <input
                  type="text"
                  value={stockFormData.user}
                  onChange={(e) =>
                    setStockFormData({ ...stockFormData, user: e.target.value })
                  }
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>비고</label>
                <textarea
                  value={stockFormData.note}
                  onChange={(e) =>
                    setStockFormData({ ...stockFormData, note: e.target.value })
                  }
                  style={{ ...styles.input, minHeight: '80px' }}
                  placeholder="입출고 사유를 입력하세요"
                />
              </div>
              <div style={styles.modalActions}>
                <button
                  type="submit"
                  style={{
                    ...styles.submitButton,
                    backgroundColor: stockType === 'in' ? '#4CAF50' : '#2196F3',
                  }}
                >
                  {stockType === 'in' ? '입고' : '출고'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStockModal(false);
                    resetStockForm();
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
  filterBar: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '16px',
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
  categoryFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  categoryButton: {
    padding: '8px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '20px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  categoryButtonActive: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50',
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
  productName: {
    fontWeight: 'bold',
    color: '#333',
  },
  categoryBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  quantityBadge: {
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
  actions: {
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
    maxWidth: '600px',
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
    marginBottom: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
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
  stockInfo: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
};

export default Inventory;
