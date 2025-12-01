import React, { useEffect } from 'react';
import { FiShoppingCart, FiTrendingUp, FiDollarSign, FiUsers } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useSalesStore from '../store/salesStore';
import { formatCurrency, formatDate } from '../utils/formatters';

const SalesDashboard = () => {
  const { salesStats, orders, customers, updateSalesStats, getTopCustomers, getRecentOrders } = useSalesStore();

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
        <h1 style={styles.title}>판매 대시보드</h1>
        <p style={styles.subtitle}>실시간 판매 현황과 통계를 확인하세요</p>
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
};

export default SalesDashboard;
