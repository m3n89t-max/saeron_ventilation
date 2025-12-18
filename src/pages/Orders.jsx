import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiPackage, FiDollarSign, FiCalendar, FiMapPin } from 'react-icons/fi';
import useSalesStore from '../store/salesStore';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const Orders = () => {
  const {
    orders,
    customers,
    addOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    updatePaymentStatus,
    orderStatuses,
    paymentStatuses,
  } = useSalesStore();
  
  const { products, removeStock } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    deliveryDate: '',
    shippingAddress: '',
    paymentMethod: '계좌이체',
    note: '',
    user: '',
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      setOrderItems(order.items || []);
      setFormData({
        customerId: order.customerId,
        customerName: order.customerName,
        deliveryDate: order.deliveryDate.split('T')[0],
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        note: order.note,
        user: order.user,
      });
    } else {
      setEditingOrder(null);
      setOrderItems([]);
      setFormData({
        customerId: '',
        customerName: '',
        deliveryDate: '',
        shippingAddress: '',
        paymentMethod: '계좌이체',
        note: '',
        user: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setOrderItems([]);
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find((c) => c.id === parseInt(customerId));
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.name,
        shippingAddress: customer.address,
      });
    }
  };

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { productId: '', productName: '', quantity: 1, price: 0, total: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index][field] = value;

    if (field === 'productId') {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].price = product.price;
        newItems[index].total = product.price * newItems[index].quantity;
      }
    }

    if (field === 'quantity' || field === 'price') {
      newItems[index].total = newItems[index].price * newItems[index].quantity;
    }

    setOrderItems(newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      alert('최소 1개 이상의 제품을 추가해주세요.');
      return;
    }

    const orderData = {
      ...formData,
      items: orderItems,
      totalAmount: calculateTotal(),
    };

    if (editingOrder) {
      updateOrder(editingOrder.id, orderData);
    } else {
      const newOrder = addOrder(orderData);
      // 재고 출고 처리
      orderItems.forEach((item) => {
        removeStock(item.productId, item.quantity, `주문 ${newOrder.orderNumber}`, formData.user);
      });
    }

    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('정말로 이 주문을 삭제하시겠습니까?')) {
      deleteOrder(id);
    }
  };

  const statusColors = {
    pending: '#FFC107',
    processing: '#2196F3',
    shipped: '#9C27B0',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  };

  const statusLabels = {
    pending: '대기중',
    processing: '처리중',
    shipped: '배송중',
    delivered: '배송완료',
    cancelled: '취소됨',
  };

  const paymentStatusLabels = {
    pending: '미결제',
    paid: '결제완료',
    partial: '부분결제',
    refund: '환불',
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>주문 관리</h1>
          <p style={styles.subtitle}>총 {orders.length}건의 주문</p>
        </div>
        <button style={styles.addButton} onClick={() => handleOpenModal()}>
          <FiPlus style={{ marginRight: '8px' }} />
          주문 추가
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="주문번호, 고객명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.statusFilters}>
          <button
            style={{
              ...styles.statusFilter,
              ...(statusFilter === 'all' ? styles.statusFilterActive : {}),
            }}
            onClick={() => setStatusFilter('all')}
          >
            전체
          </button>
          {orderStatuses.map((status) => (
            <button
              key={status}
              style={{
                ...styles.statusFilter,
                ...(statusFilter === status ? styles.statusFilterActive : {}),
              }}
              onClick={() => setStatusFilter(status)}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* 주문 목록 */}
      <div style={styles.ordersContainer}>
        {filteredOrders.map((order) => (
          <div key={order.id} style={styles.orderCard}>
            <div style={styles.orderHeader}>
              <div>
                <h3 style={styles.orderNumber}>{order.orderNumber}</h3>
                <p style={styles.customerName}>{order.customerName}</p>
              </div>
              <div style={styles.badges}>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: statusColors[order.status] + '20',
                    color: statusColors[order.status],
                  }}
                >
                  {statusLabels[order.status]}
                </span>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: order.paymentStatus === 'paid' ? '#4CAF5020' : '#FFC10720',
                    color: order.paymentStatus === 'paid' ? '#4CAF50' : '#FFC107',
                  }}
                >
                  {paymentStatusLabels[order.paymentStatus]}
                </span>
              </div>
            </div>

            <div style={styles.orderInfo}>
              <div style={styles.infoItem}>
                <FiCalendar style={styles.infoIcon} />
                <span>주문일: {formatDate(order.orderDate)}</span>
              </div>
              <div style={styles.infoItem}>
                <FiPackage style={styles.infoIcon} />
                <span>배송 예정일: {formatDate(order.deliveryDate)}</span>
              </div>
              <div style={styles.infoItem}>
                <FiMapPin style={styles.infoIcon} />
                <span>{order.shippingAddress}</span>
              </div>
              <div style={styles.infoItem}>
                <FiDollarSign style={styles.infoIcon} />
                <span>{order.paymentMethod}</span>
              </div>
            </div>

            <div style={styles.orderItems}>
              <h4 style={styles.itemsTitle}>주문 품목</h4>
              {order.items.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <span style={styles.itemName}>{item.productName}</span>
                  <span style={styles.itemQuantity}>x{item.quantity}</span>
                  <span style={styles.itemPrice}>{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            <div style={styles.orderFooter}>
              <div style={styles.totalAmount}>
                총액: <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>
              <div style={styles.orderActions}>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  style={styles.statusSelect}
                >
                  {orderStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                  style={styles.statusSelect}
                >
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {paymentStatusLabels[status]}
                    </option>
                  ))}
                </select>
                <button
                  style={styles.editButton}
                  onClick={() => handleOpenModal(order)}
                >
                  <FiEdit2 />
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDelete(order.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {order.note && (
              <div style={styles.orderNote}>
                <strong>비고:</strong> {order.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div style={styles.emptyState}>
          <p>검색 결과가 없습니다.</p>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingOrder ? '주문 정보 수정' : '새 주문 추가'}
            </h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>고객 선택 *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    style={styles.select}
                    required
                    disabled={!!editingOrder}
                  >
                    <option value="">고객을 선택하세요</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>배송 예정일 *</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>배송 주소 *</label>
                <input
                  type="text"
                  value={formData.shippingAddress}
                  onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>결제 방법 *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    style={styles.select}
                    required
                  >
                    <option value="계좌이체">계좌이체</option>
                    <option value="세금계산서">세금계산서</option>
                    <option value="현금">현금</option>
                    <option value="카드">카드</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>담당자 *</label>
                  <input
                    type="text"
                    value={formData.user}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>비고</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>

              {/* 주문 품목 */}
              <div style={styles.itemsSection}>
                <div style={styles.itemsHeader}>
                  <h4>주문 품목</h4>
                  <button
                    type="button"
                    style={styles.addItemButton}
                    onClick={handleAddItem}
                    disabled={!!editingOrder}
                  >
                    <FiPlus /> 품목 추가
                  </button>
                </div>

                {orderItems.map((item, index) => (
                  <div key={index} style={styles.itemEditRow}>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      style={{ ...styles.select, flex: 2 }}
                      required
                      disabled={!!editingOrder}
                    >
                      <option value="">제품 선택</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (재고: {product.quantity})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      style={{ ...styles.input, flex: 1 }}
                      min="1"
                      placeholder="수량"
                      required
                      disabled={!!editingOrder}
                    />
                    <input
                      type="text"
                      value={formatCurrency(item.total)}
                      style={{ ...styles.input, flex: 1 }}
                      readOnly
                    />
                    {!editingOrder && (
                      <button
                        type="button"
                        style={styles.removeItemButton}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}

                <div style={styles.totalRow}>
                  <strong>총 주문 금액:</strong>
                  <strong style={{ color: '#2196F3' }}>{formatCurrency(calculateTotal())}</strong>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                  취소
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingOrder ? '수정' : '주문 등록'}
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
  },
  statusFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statusFilter: {
    padding: '8px 16px',
    border: '2px solid #e0e0e0',
    backgroundColor: '#fff',
    borderRadius: '20px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statusFilterActive: {
    backgroundColor: '#2196F3',
    color: '#fff',
    borderColor: '#2196F3',
  },
  ordersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  orderNumber: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  customerName: {
    fontSize: '14px',
    color: '#666',
  },
  badges: {
    display: 'flex',
    gap: '8px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  orderInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
  },
  infoIcon: {
    fontSize: '16px',
    color: '#999',
  },
  orderItems: {
    backgroundColor: '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  itemsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '12px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  itemName: {
    flex: 2,
    fontSize: '14px',
    color: '#1a1a1a',
  },
  itemQuantity: {
    flex: 1,
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
  itemPrice: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '600',
    color: '#2196F3',
    textAlign: 'right',
  },
  orderFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '2px solid #e0e0e0',
  },
  totalAmount: {
    fontSize: '18px',
    color: '#1a1a1a',
  },
  orderActions: {
    display: 'flex',
    gap: '8px',
  },
  statusSelect: {
    padding: '8px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  editButton: {
    padding: '8px 12px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  deleteButton: {
    padding: '8px 12px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  orderNote: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#FFF9C4',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#666',
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
    maxWidth: '800px',
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
  itemsSection: {
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
  },
  itemsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  addItemButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  itemEditRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  removeItemButton: {
    padding: '12px',
    backgroundColor: '#F44336',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '18px',
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

export default Orders;
