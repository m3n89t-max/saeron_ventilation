import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail, FiMapPin, FiUser } from 'react-icons/fi';
import useSalesStore from '../store/salesStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const Customers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, customerGrades, getOrdersByCustomer } = useSalesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    address: '',
    manager: '',
    managerPhone: '',
    grade: '일반',
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === 'all' || customer.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        contact: customer.contact,
        email: customer.email,
        address: customer.address,
        manager: customer.manager,
        managerPhone: customer.managerPhone,
        grade: customer.grade,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        contact: '',
        email: '',
        address: '',
        manager: '',
        managerPhone: '',
        grade: '일반',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      name: '',
      contact: '',
      email: '',
      address: '',
      manager: '',
      managerPhone: '',
      grade: '일반',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('정말로 이 고객을 삭제하시겠습니까?')) {
      deleteCustomer(id);
    }
  };

  const gradeColors = {
    VIP: '#9C27B0',
    Gold: '#FF9800',
    Silver: '#9E9E9E',
    Bronze: '#795548',
    일반: '#607D8B',
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>고객 관리</h1>
          <p style={styles.subtitle}>총 {customers.length}명의 고객</p>
        </div>
        <button style={styles.addButton} onClick={() => handleOpenModal()}>
          <FiPlus style={{ marginRight: '8px' }} />
          고객 추가
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="고객명, 고객코드, 담당자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.gradeFilters}>
          <button
            style={{
              ...styles.gradeFilter,
              ...(selectedGrade === 'all' ? styles.gradeFilterActive : {}),
            }}
            onClick={() => setSelectedGrade('all')}
          >
            전체
          </button>
          {customerGrades.map((grade) => (
            <button
              key={grade}
              style={{
                ...styles.gradeFilter,
                ...(selectedGrade === grade ? styles.gradeFilterActive : {}),
              }}
              onClick={() => setSelectedGrade(grade)}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* 고객 그리드 */}
      <div style={styles.customersGrid}>
        {filteredCustomers.map((customer) => {
          const customerOrders = getOrdersByCustomer(customer.id);
          return (
            <div key={customer.id} style={styles.customerCard}>
              <div style={styles.cardHeader}>
                <div style={styles.customerCode}>{customer.code}</div>
                <div style={{
                  ...styles.gradeBadge,
                  backgroundColor: gradeColors[customer.grade] + '20',
                  color: gradeColors[customer.grade],
                }}>
                  {customer.grade}
                </div>
              </div>

              <h3 style={styles.customerName}>{customer.name}</h3>

              <div style={styles.customerDetails}>
                <div style={styles.detailItem}>
                  <FiUser style={styles.detailIcon} />
                  <span>{customer.manager}</span>
                </div>
                <div style={styles.detailItem}>
                  <FiPhone style={styles.detailIcon} />
                  <span>{customer.contact}</span>
                </div>
                <div style={styles.detailItem}>
                  <FiMail style={styles.detailIcon} />
                  <span>{customer.email}</span>
                </div>
                <div style={styles.detailItem}>
                  <FiMapPin style={styles.detailIcon} />
                  <span>{customer.address}</span>
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statItem}>
                  <div style={styles.statLabel}>총 구매액</div>
                  <div style={styles.statValue}>{formatCurrency(customer.totalPurchase)}</div>
                </div>
                <div style={styles.statItem}>
                  <div style={styles.statLabel}>주문 건수</div>
                  <div style={styles.statValue}>{customerOrders.length}건</div>
                </div>
              </div>

              <div style={styles.registeredDate}>
                가입일: {formatDate(customer.registeredDate)}
              </div>

              <div style={styles.cardActions}>
                <button
                  style={styles.editButton}
                  onClick={() => handleOpenModal(customer)}
                >
                  <FiEdit2 style={{ marginRight: '4px' }} />
                  수정
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(customer.id)}
                >
                  <FiTrash2 style={{ marginRight: '4px' }} />
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div style={styles.emptyState}>
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingCustomer ? '고객 정보 수정' : '새 고객 추가'}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>고객명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>연락처 *</label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>이메일 *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>주소 *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>담당자명 *</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>담당자 연락처 *</label>
                  <input
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>고객 등급 *</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  style={styles.select}
                  required
                >
                  {customerGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                  취소
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingCustomer ? '수정' : '추가'}
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
    marginBottom: '32px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  filterBar: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  searchBox: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  gradeFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  gradeFilter: {
    padding: '8px 16px',
    border: '2px solid #e0e0e0',
    backgroundColor: '#fff',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  gradeFilterActive: {
    backgroundColor: '#2196F3',
    color: '#fff',
    borderColor: '#2196F3',
  },
  customersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  customerCode: {
    fontSize: '12px',
    color: '#999',
    fontWeight: '600',
  },
  gradeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  customerName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '16px',
  },
  customerDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
  },
  detailIcon: {
    fontSize: '16px',
    color: '#999',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  statItem: {
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  registeredDate: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '16px',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  deleteButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
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
    backgroundColor: '#fff',
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
    color: '#1a1a1a',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Customers;
