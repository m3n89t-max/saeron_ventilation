import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiTrendingUp, FiDollarSign, FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiPhone, FiMail, FiMapPin, FiUser } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useSalesStore from '../store/salesStore';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const SalesManagementIntegrated = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, customers
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>판매 관리</h1>
        <p style={styles.subtitle}>판매 현황과 고객 관리를 한 곳에서</p>
      </div>

      {/* 탭 네비게이션 */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'dashboard' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('dashboard')}
        >
          <FiShoppingCart style={{ marginRight: '8px' }} />
          판매 현황
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'customers' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('customers')}
        >
          <FiUsers style={{ marginRight: '8px' }} />
          고객 관리
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div style={styles.tabContent}>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'customers' && <CustomersTab />}
      </div>
    </div>
  );
};

// 판매 현황 탭
const DashboardTab = () => {
  const { salesStats, orders, customers, updateSalesStats, getTopCustomers, getRecentOrders, addOrder, addCustomer } = useSalesStore();
  const { products } = useInventoryStore();
  
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleFormData, setSaleFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerCompany: '',
    items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
    totalAmount: 0,
    paidAmount: 0,
    paymentStatus: 'paid',
    paymentMethod: 'card',
    note: '',
  });

  useEffect(() => {
    updateSalesStats();
  }, [updateSalesStats]);

  const topCustomers = getTopCustomers(5);
  const recentOrders = getRecentOrders(5);

  // 주문 상태별 통계
  const orderStatusData = [
    { name: '대기중', value: salesStats.pendingOrders, color: '#FFC107' },
    { name: '처리중', value: salesStats.processingOrders, color: '#2196F3' },
    { name: '배송완료', value: salesStats.deliveredOrders, color: '#4CAF50' },
  ];

  // 최근 7일 매출 추이
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOrders = orders.filter((o) => {
      const orderDate = new Date(o.orderDate);
      return orderDate.toDateString() === date.toDateString() && o.paymentStatus === 'paid';
    });
    const dayTotal = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    last7Days.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      sales: dayTotal / 1000000,
    });
  }

  // 고객 등급별 분포
  const gradeDistribution = ['VIP', 'Gold', 'Silver', 'Bronze', '일반'].map((grade) => ({
    name: grade,
    count: customers.filter((c) => c.grade === grade).length,
  }));

  const handleAddItem = () => {
    setSaleFormData({
      ...saleFormData,
      items: [
        ...saleFormData.items,
        { productId: '', productName: '', quantity: 1, unitPrice: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = saleFormData.items.filter((_, i) => i !== index);
    const total = newItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
    setSaleFormData({
      ...saleFormData,
      items: newItems,
      totalAmount: total,
    });
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      const newItems = [...saleFormData.items];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
      };
      const total = newItems.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      );
      setSaleFormData({
        ...saleFormData,
        items: newItems,
        totalAmount: total,
      });
    }
  };

  const handleQuantityChange = (index, quantity) => {
    const newItems = [...saleFormData.items];
    newItems[index].quantity = parseInt(quantity) || 1;
    const total = newItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
    setSaleFormData({
      ...saleFormData,
      items: newItems,
      totalAmount: total,
    });
  };

  const handlePriceChange = (index, price) => {
    const newItems = [...saleFormData.items];
    newItems[index].unitPrice = parseInt(price) || 0;
    const total = newItems.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
    setSaleFormData({
      ...saleFormData,
      items: newItems,
      totalAmount: total,
    });
  };

  const handleSubmitSale = (e) => {
    e.preventDefault();
    
    if (saleFormData.items.length === 0 || !saleFormData.items[0].productId) {
      alert('최소 1개 이상의 제품을 선택해주세요.');
      return;
    }

    let customerId = saleFormData.customerId;
    
    if (!customerId && saleFormData.customerName) {
      const newCustomer = addCustomer({
        name: saleFormData.customerName || '익명',
        contact: saleFormData.customerPhone || '',
        email: saleFormData.customerEmail || '',
        address: saleFormData.customerAddress || '',
        manager: saleFormData.customerName || '익명',
        managerPhone: saleFormData.customerPhone || '',
        grade: '일반',
      });
      customerId = newCustomer.id;
    }

    addOrder({
      customerId: customerId,
      customerName: saleFormData.customerName || customers.find(c => c.id === customerId)?.name || '익명',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      shippingAddress: saleFormData.customerAddress || customers.find(c => c.id === customerId)?.address || '',
      paymentMethod: saleFormData.paymentMethod,
      note: saleFormData.note,
      user: '관리자',
      items: saleFormData.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
      totalAmount: saleFormData.totalAmount,
      paidAmount: saleFormData.paymentStatus === 'partial' ? saleFormData.paidAmount : (saleFormData.paymentStatus === 'paid' ? saleFormData.totalAmount : 0),
      paymentStatus: saleFormData.paymentStatus,
    });

    alert('판매가 등록되었습니다!');
    setShowSaleModal(false);
    setSaleFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      customerCompany: '',
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
      totalAmount: 0,
      paidAmount: 0,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      note: '',
    });
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
    <>
      {/* 판매 등록 버튼 */}
      <div style={{ marginBottom: '24px' }}>
        <button style={styles.addButton} onClick={() => setShowSaleModal(true)}>
          <FiPlus style={{ marginRight: '8px' }} />
          판매 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={styles.statsGrid}>
        <StatCard
          icon={<FiDollarSign />}
          title="오늘 매출"
          value={formatCurrency(salesStats.todaySales)}
          color="#4CAF50"
        />
        <StatCard
          icon={<FiTrendingUp />}
          title="이번 주 매출"
          value={formatCurrency(salesStats.weeklySales)}
          color="#2196F3"
        />
        <StatCard
          icon={<FiShoppingCart />}
          title="이번 달 매출"
          value={formatCurrency(salesStats.monthlySales)}
          color="#9C27B0"
        />
        <StatCard
          icon={<FiUsers />}
          title="총 고객 수"
          value={`${customers.length}명`}
          color="#FF9800"
        />
      </div>

      {/* 차트 그리드 */}
      <div style={styles.chartsGrid}>
        {/* 최근 7일 매출 추이 */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>최근 7일 매출 추이</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" label={{ value: '(백만원)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value) => [`${value.toFixed(1)}백만원`, '매출']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Line type="monotone" dataKey="sales" stroke="#2196F3" strokeWidth={2} dot={{ fill: '#2196F3', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 주문 상태 분포 */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>주문 상태 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 고객 등급 분포 */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>고객 등급 분포</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#4CAF50" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 상위 고객 */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>상위 고객 TOP 5</h3>
          <div style={styles.listContainer}>
            {topCustomers.map((customer, index) => (
              <div key={customer.id} style={styles.listItem}>
                <div style={styles.rankBadge}>{index + 1}</div>
                <div style={styles.customerInfo}>
                  <div style={styles.customerName}>{customer.name}</div>
                  <div style={styles.customerGrade}>{customer.grade}</div>
                </div>
                <div style={styles.customerAmount}>
                  {formatCurrency(customer.totalPurchase)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 주문 */}
      <div style={styles.recentOrders}>
        <h3 style={styles.sectionTitle}>최근 주문</h3>
        <div style={styles.ordersTable}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>주문번호</th>
                <th style={styles.th}>고객명</th>
                <th style={styles.th}>주문일</th>
                <th style={styles.th}>금액</th>
                <th style={styles.th}>수금액</th>
                <th style={styles.th}>잔액</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>결제상태</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const paidAmount = order.paidAmount || 0;
                const balance = order.totalAmount - paidAmount;
                return (
                  <tr key={order.id} style={styles.tableRow}>
                    <td style={styles.td}>{order.orderNumber}</td>
                    <td style={styles.td}>{order.customerName}</td>
                    <td style={styles.td}>{formatDate(order.orderDate)}</td>
                    <td style={styles.td}>{formatCurrency(order.totalAmount)}</td>
                    <td style={styles.td}>
                      <span style={{ color: '#4CAF50', fontWeight: '600' }}>
                        {formatCurrency(paidAmount)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        color: balance > 0 ? '#F44336' : '#666', 
                        fontWeight: balance > 0 ? '600' : '400' 
                      }}>
                        {formatCurrency(balance)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: statusColors[order.status] + '20',
                        color: statusColors[order.status],
                      }}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: order.paymentStatus === 'paid' ? '#4CAF5020' : (order.paymentStatus === 'partial' ? '#FF980020' : '#FFC10720'),
                        color: order.paymentStatus === 'paid' ? '#4CAF50' : (order.paymentStatus === 'partial' ? '#FF9800' : '#FFC107'),
                      }}>
                        {paymentStatusLabels[order.paymentStatus]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 판매 등록 모달 */}
      {showSaleModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSaleModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>판매 등록</h2>
            <form onSubmit={handleSubmitSale} style={styles.form}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>고객명 *</label>
                  <input
                    type="text"
                    value={saleFormData.customerName}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customerName: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>연락처</label>
                  <input
                    type="tel"
                    value={saleFormData.customerPhone}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customerPhone: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>이메일</label>
                  <input
                    type="email"
                    value={saleFormData.customerEmail}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customerEmail: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>배송지</label>
                  <input
                    type="text"
                    value={saleFormData.customerAddress}
                    onChange={(e) => setSaleFormData({ ...saleFormData, customerAddress: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.itemsSection}>
                <div style={styles.itemsHeader}>
                  <h4>판매 제품</h4>
                  <button type="button" style={styles.addItemButton} onClick={handleAddItem}>
                    <FiPlus /> 제품 추가
                  </button>
                </div>

                {saleFormData.items.map((item, index) => (
                  <div key={index} style={styles.itemEditRow}>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      style={{ ...styles.select, flex: 2 }}
                      required
                    >
                      <option value="">제품 선택</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({formatCurrency(product.price)})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      min="1"
                      placeholder="수량"
                      required
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handlePriceChange(index, e.target.value)}
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="단가"
                      required
                    />
                    <input
                      type="text"
                      value={formatCurrency(item.quantity * item.unitPrice)}
                      style={{ ...styles.input, flex: 1 }}
                      readOnly
                    />
                    {saleFormData.items.length > 1 && (
                      <button
                        type="button"
                        style={styles.removeItemButton}
                        onClick={() => handleRemoveItem(index)}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}

                <div style={styles.totalRow}>
                  <strong>총 판매 금액:</strong>
                  <strong style={{ color: '#2196F3' }}>{formatCurrency(saleFormData.totalAmount)}</strong>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>결제 방법 *</label>
                  <select
                    value={saleFormData.paymentMethod}
                    onChange={(e) => setSaleFormData({ ...saleFormData, paymentMethod: e.target.value })}
                    style={styles.select}
                    required
                  >
                    <option value="card">카드</option>
                    <option value="cash">현금</option>
                    <option value="transfer">계좌이체</option>
                    <option value="invoice">세금계산서</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>결제 상태 *</label>
                  <select
                    value={saleFormData.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setSaleFormData({ 
                        ...saleFormData, 
                        paymentStatus: newStatus,
                        paidAmount: newStatus === 'paid' ? saleFormData.totalAmount : (newStatus === 'pending' ? 0 : saleFormData.paidAmount)
                      });
                    }}
                    style={styles.select}
                    required
                  >
                    <option value="paid">결제완료</option>
                    <option value="pending">미결제</option>
                    <option value="partial">부분결제</option>
                  </select>
                </div>
              </div>

              {/* 부분결제 시 수금액 입력 */}
              {saleFormData.paymentStatus === 'partial' && (
                <div style={styles.partialPaymentSection}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>수금액 *</label>
                    <input
                      type="number"
                      value={saleFormData.paidAmount}
                      onChange={(e) => {
                        const paid = parseInt(e.target.value) || 0;
                        if (paid <= saleFormData.totalAmount) {
                          setSaleFormData({ ...saleFormData, paidAmount: paid });
                        }
                      }}
                      style={styles.input}
                      min="0"
                      max={saleFormData.totalAmount}
                      placeholder="수금액 입력"
                      required
                    />
                  </div>
                  <div style={styles.paymentSummary}>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>총 판매금액:</span>
                      <span style={styles.summaryValue}>{formatCurrency(saleFormData.totalAmount)}</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={styles.summaryLabel}>수금액:</span>
                      <span style={{...styles.summaryValue, color: '#4CAF50'}}>{formatCurrency(saleFormData.paidAmount)}</span>
                    </div>
                    <div style={{...styles.summaryRow, borderTop: '2px solid #e0e0e0', paddingTop: '12px', marginTop: '8px'}}>
                      <span style={{...styles.summaryLabel, fontWeight: 'bold', fontSize: '16px'}}>미수금(잔액):</span>
                      <span style={{...styles.summaryValue, fontWeight: 'bold', fontSize: '18px', color: '#F44336'}}>
                        {formatCurrency(saleFormData.totalAmount - saleFormData.paidAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>비고</label>
                <textarea
                  value={saleFormData.note}
                  onChange={(e) => setSaleFormData({ ...saleFormData, note: e.target.value })}
                  style={{ ...styles.input, minHeight: '80px' }}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowSaleModal(false)}>
                  취소
                </button>
                <button type="submit" style={styles.submitButton}>
                  판매 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// 고객 관리 탭
const CustomersTab = () => {
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
    <>
      <div style={styles.customerHeader}>
        <div style={styles.customerHeaderLeft}>
          <h2 style={styles.customerTitle}>고객 목록</h2>
          <p style={styles.customerSubtitle}>총 {customers.length}명의 고객</p>
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

              <h3 style={styles.customerNameTitle}>{customer.name}</h3>

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

      {/* 고객 추가/수정 모달 */}
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
    </>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <div style={styles.statCard}>
    <div style={{ ...styles.statIcon, backgroundColor: color + '20', color }}>
      {icon}
    </div>
    <div style={styles.statContent}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  </div>
);

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
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '2px solid #e0e0e0',
    marginBottom: '24px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    color: '#666',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  tabActive: {
    color: '#2196F3',
    borderBottom: '3px solid #2196F3',
  },
  tabContent: {
    minHeight: '500px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '20px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  rankBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2196F3',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  customerGrade: {
    fontSize: '12px',
    color: '#666',
  },
  customerAmount: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recentOrders: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '20px',
  },
  ordersTable: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #e0e0e0',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
  },
  td: {
    padding: '16px 12px',
    fontSize: '14px',
    color: '#1a1a1a',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
  },
  customerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  customerHeaderLeft: {},
  customerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  customerSubtitle: {
    fontSize: '14px',
    color: '#666',
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
  customerNameTitle: {
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
  partialPaymentSection: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '12px',
    marginTop: '16px',
    marginBottom: '16px',
    border: '2px solid #e3f2fd',
  },
  paymentSummary: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
};

export default SalesManagementIntegrated;
