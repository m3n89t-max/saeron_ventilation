import React, { useEffect, useState } from 'react';
import { FiShoppingCart, FiTrendingUp, FiDollarSign, FiUsers, FiPlus } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useSalesStore from '../store/salesStore';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const SalesDashboard = () => {
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
    paymentStatus: 'paid',
    paymentMethod: 'card',
    note: '',
  });

  useEffect(() => {
    updateSalesStats();
  }, [updateSalesStats]);

  const topCustomers = getTopCustomers(5);
  const recentOrders = getRecentOrders(5);

  // 제품 추가
  const handleAddItem = () => {
    setSaleFormData({
      ...saleFormData,
      items: [
        ...saleFormData.items,
        { productId: '', productName: '', quantity: 1, unitPrice: 0 },
      ],
    });
  };

  // 제품 제거
  const handleRemoveItem = (index) => {
    const newItems = saleFormData.items.filter((_, i) => i !== index);
    setSaleFormData({
      ...saleFormData,
      items: newItems,
    });
    calculateTotal(newItems);
  };

  // 제품 선택
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
      setSaleFormData({
        ...saleFormData,
        items: newItems,
      });
      calculateTotal(newItems);
    }
  };

  // 수량 변경
  const handleQuantityChange = (index, quantity) => {
    const newItems = [...saleFormData.items];
    newItems[index].quantity = parseInt(quantity) || 1;
    setSaleFormData({
      ...saleFormData,
      items: newItems,
    });
    calculateTotal(newItems);
  };

  // 단가 변경
  const handlePriceChange = (index, price) => {
    const newItems = [...saleFormData.items];
    newItems[index].unitPrice = parseInt(price) || 0;
    setSaleFormData({
      ...saleFormData,
      items: newItems,
    });
    calculateTotal(newItems);
  };

  // 총액 계산
  const calculateTotal = (items) => {
    const total = items.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
      0
    );
    setSaleFormData((prev) => ({
      ...prev,
      totalAmount: total,
    }));
  };

  // 고객 선택
  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c.id === parseInt(customerId));
    if (customer) {
      setSaleFormData({
        ...saleFormData,
        customerId: customer.id,
        customerName: customer.name,
      });
    }
  };

  // 판매 등록
  const handleSaleSubmit = (e) => {
    e.preventDefault();
    
    // 제품이 선택되었는지 확인
    const hasValidItems = saleFormData.items.some(item => item.productId !== '');
    if (!hasValidItems) {
      alert('최소 1개 이상의 제품을 선택해주세요.');
      return;
    }

    // 고객 선택 확인
    if (!saleFormData.customerId && !saleFormData.customerName) {
      alert('고객을 선택하거나 고객명을 입력해주세요.');
      return;
    }

    let finalCustomerId = saleFormData.customerId;
    let finalCustomerName = saleFormData.customerName;

    // 고객을 직접 입력한 경우 (기존 고객이 아닌 경우)
    if (!saleFormData.customerId && saleFormData.customerName) {
      // 새 고객 자동 등록
      const newCustomer = addCustomer({
        name: saleFormData.customerName,
        company: saleFormData.customerCompany || '',
        contact: saleFormData.customerPhone || '',
        email: saleFormData.customerEmail || '',
        address: saleFormData.customerAddress || '',
        manager: saleFormData.customerName,
        managerPhone: saleFormData.customerPhone || '',
        grade: '일반',
      });
      
      finalCustomerId = newCustomer.id;
      finalCustomerName = newCustomer.name;
      
      alert(`신규 고객 "${newCustomer.name}"이(가) 고객관리에 등록되었습니다!`);
    }

    // 주문 데이터 생성
    const orderData = {
      orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      items: saleFormData.items.filter(item => item.productId !== ''),
      totalAmount: saleFormData.totalAmount,
      orderDate: new Date().toISOString(),
      status: 'delivered', // 판매 완료
      paymentStatus: saleFormData.paymentStatus,
      paymentMethod: saleFormData.paymentMethod,
      deliveryAddress: saleFormData.customerAddress || '',
      note: saleFormData.note,
    };

    addOrder(orderData);
    alert('판매가 등록되었습니다!');
    setShowSaleModal(false);
    resetForm();
    updateSalesStats();
  };

  // 폼 초기화
  const resetForm = () => {
    setSaleFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
      customerCompany: '',
      items: [{ productId: '', productName: '', quantity: 1, unitPrice: 0 }],
      totalAmount: 0,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      note: '',
    });
  };

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
      sales: dayTotal / 1000000, // 백만원 단위
    });
  }

  // 고객 등급별 분포
  const gradeDistribution = ['VIP', 'Gold', 'Silver', 'Bronze', '일반'].map((grade) => ({
    name: grade,
    count: customers.filter((c) => c.grade === grade).length,
  }));

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
          <h1 style={styles.title}>판매 대시보드</h1>
          <p style={styles.subtitle}>실시간 판매 현황과 통계를 확인하세요</p>
        </div>
        <button
          onClick={() => setShowSaleModal(true)}
          style={styles.addButton}
        >
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
                <th style={styles.th}>상태</th>
                <th style={styles.th}>결제상태</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={styles.tableRow}>
                  <td style={styles.td}>{order.orderNumber}</td>
                  <td style={styles.td}>{order.customerName}</td>
                  <td style={styles.td}>{formatDate(order.orderDate)}</td>
                  <td style={styles.td}>{formatCurrency(order.totalAmount)}</td>
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
                      backgroundColor: order.paymentStatus === 'paid' ? '#4CAF5020' : '#FFC10720',
                      color: order.paymentStatus === 'paid' ? '#4CAF50' : '#FFC107',
                    }}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 판매 등록 모달 */}
      {showSaleModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSaleModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>판매 등록</h3>
            <form onSubmit={handleSaleSubmit}>
              {/* 고객 정보 */}
              <div style={styles.sectionTitle}>고객 정보</div>
              <div style={styles.formGroup}>
                <label style={styles.label}>기존 고객 선택</label>
                <select
                  value={saleFormData.customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  style={styles.input}
                >
                  <option value="">신규 고객 (아래에 직접 입력)</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company || '개인'}) - {customer.contact}
                    </option>
                  ))}
                </select>
              </div>

              {!saleFormData.customerId && (
                <>
                  <div style={styles.newCustomerNote}>
                    💡 신규 고객 정보를 입력하면 자동으로 고객관리에 등록됩니다.
                  </div>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>고객명 *</label>
                      <input
                        type="text"
                        value={saleFormData.customerName}
                        onChange={(e) =>
                          setSaleFormData({ ...saleFormData, customerName: e.target.value })
                        }
                        style={styles.input}
                        placeholder="고객명 입력"
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>회사명</label>
                      <input
                        type="text"
                        value={saleFormData.customerCompany}
                        onChange={(e) =>
                          setSaleFormData({ ...saleFormData, customerCompany: e.target.value })
                        }
                        style={styles.input}
                        placeholder="회사명 입력"
                      />
                    </div>
                  </div>

                  <div style={styles.formGrid}>
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

                    <div style={styles.formGroup}>
                      <label style={styles.label}>이메일</label>
                      <input
                        type="email"
                        value={saleFormData.customerEmail}
                        onChange={(e) =>
                          setSaleFormData({ ...saleFormData, customerEmail: e.target.value })
                        }
                        style={styles.input}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>주소</label>
                    <input
                      type="text"
                      value={saleFormData.customerAddress}
                      onChange={(e) =>
                        setSaleFormData({ ...saleFormData, customerAddress: e.target.value })
                      }
                      style={styles.input}
                      placeholder="주소 입력"
                    />
                  </div>
                </>
              )}

              {/* 제품 정보 */}
              <div style={styles.sectionTitle}>
                판매 제품
                <button
                  type="button"
                  onClick={handleAddItem}
                  style={styles.addItemButton}
                >
                  <FiPlus style={{ marginRight: '4px' }} />
                  제품 추가
                </button>
              </div>

              {saleFormData.items.map((item, index) => (
                <div key={index} style={styles.itemRow}>
                  <div style={styles.itemGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>제품 선택 *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        style={styles.input}
                        required
                      >
                        <option value="">제품을 선택하세요</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} - {formatCurrency(p.price)} (재고: {p.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>수량</label>
                      <input
                        type="number"
                        value={item.quantity}
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
                        value={item.unitPrice}
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
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                  </div>

                  {saleFormData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      style={styles.removeItemButton}
                      title="제품 제거"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}

              {/* 총 판매금액 */}
              <div style={styles.totalAmountBox}>
                <div style={styles.totalAmountLabel}>총 판매금액</div>
                <div style={styles.totalAmount}>
                  {formatCurrency(saleFormData.totalAmount)}
                </div>
              </div>

              {/* 결제 정보 */}
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>결제 상태</label>
                  <select
                    value={saleFormData.paymentStatus}
                    onChange={(e) =>
                      setSaleFormData({ ...saleFormData, paymentStatus: e.target.value })
                    }
                    style={styles.input}
                    required
                  >
                    <option value="paid">결제완료</option>
                    <option value="pending">미결제</option>
                    <option value="partial">부분결제</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>결제 방법</label>
                  <select
                    value={saleFormData.paymentMethod}
                    onChange={(e) =>
                      setSaleFormData({ ...saleFormData, paymentMethod: e.target.value })
                    }
                    style={styles.input}
                    required
                  >
                    <option value="card">카드</option>
                    <option value="cash">현금</option>
                    <option value="transfer">계좌이체</option>
                  </select>
                </div>
              </div>

              {/* 비고 */}
              <div style={styles.formGroup}>
                <label style={styles.label}>비고</label>
                <textarea
                  value={saleFormData.note}
                  onChange={(e) =>
                    setSaleFormData({ ...saleFormData, note: e.target.value })
                  }
                  style={{ ...styles.input, minHeight: '80px' }}
                  placeholder="특이사항을 입력하세요"
                />
              </div>

              {/* 버튼 */}
              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton}>
                  등록
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
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
    transition: 'background-color 0.2s',
    cursor: 'pointer',
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
  newCustomerNote: {
    backgroundColor: '#E3F2FD',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    color: '#1976D2',
    border: '1px solid #2196F3',
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
  addItemButton: {
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
  itemRow: {
    position: 'relative',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  itemGrid: {
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
  removeItemButton: {
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
};

export default SalesDashboard;
