import React, { useMemo } from 'react';
import { FaBox, FaExclamationTriangle, FaArrowUp, FaArrowDown, FaDollarSign } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useInventoryStore from '../store/inventoryStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Dashboard = () => {
  const { products, transactions, getLowStockProducts, getTotalValue } = useInventoryStore();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockCount = getLowStockProducts().length;
    const totalValue = getTotalValue();

    const last7DaysTransactions = transactions.filter(
      (t) => new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const inCount = last7DaysTransactions.filter((t) => t.type === 'in').length;
    const outCount = last7DaysTransactions.filter((t) => t.type === 'out').length;

    return {
      totalProducts,
      totalQuantity,
      lowStockCount,
      totalValue,
      inCount,
      outCount,
    };
  }, [products, transactions, getLowStockProducts, getTotalValue]);

  const categoryData = useMemo(() => {
    const categoryMap = {};
    products.forEach((p) => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = { category: p.category, count: 0, value: 0 };
      }
      categoryMap[p.category].count += p.quantity;
      categoryMap[p.category].value += p.quantity * p.price;
    });
    return Object.values(categoryMap);
  }, [products]);

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];

  const lowStockProducts = getLowStockProducts();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>대시보드</h2>

      <div style={styles.statsGrid}>
        <StatsCard
          icon={<FaBox />}
          title="총 제품 수"
          value={formatNumber(stats.totalProducts)}
          color="#4CAF50"
          subtitle="등록된 제품"
        />
        <StatsCard
          icon={<FaBox />}
          title="총 재고 수량"
          value={formatNumber(stats.totalQuantity)}
          color="#2196F3"
          subtitle="전체 재고"
        />
        <StatsCard
          icon={<FaExclamationTriangle />}
          title="부족 재고"
          value={formatNumber(stats.lowStockCount)}
          color="#FF9800"
          subtitle="주문 필요"
        />
        <StatsCard
          icon={<FaDollarSign />}
          title="총 재고 가치"
          value={formatCurrency(stats.totalValue).replace('₩', '')}
          color="#9C27B0"
          subtitle="원"
        />
      </div>

      <div style={styles.gridRow}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>카테고리별 재고 수량</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4CAF50" name="수량" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>카테고리별 재고 가치</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.category}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.gridRow}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>최근 7일 입출고 현황</h3>
          <div style={styles.transactionStats}>
            <div style={styles.transactionItem}>
              <FaArrowUp style={{ color: '#4CAF50', fontSize: '24px' }} />
              <div>
                <div style={styles.transactionLabel}>입고</div>
                <div style={styles.transactionValue}>{stats.inCount}건</div>
              </div>
            </div>
            <div style={styles.transactionItem}>
              <FaArrowDown style={{ color: '#F44336', fontSize: '24px' }} />
              <div>
                <div style={styles.transactionLabel}>출고</div>
                <div style={styles.transactionValue}>{stats.outCount}건</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <FaExclamationTriangle style={{ color: '#FF9800', marginRight: '8px' }} />
            부족 재고 알림
          </h3>
          <div style={styles.alertList}>
            {lowStockProducts.length === 0 ? (
              <p style={styles.noAlert}>부족 재고가 없습니다.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} style={styles.alertItem}>
                  <div style={styles.alertInfo}>
                    <div style={styles.alertName}>{product.name}</div>
                    <div style={styles.alertDetails}>
                      현재: {product.quantity} / 최소: {product.minQuantity}
                    </div>
                  </div>
                  <div style={styles.alertBadge}>
                    {product.quantity === 0 ? '품절' : '부족'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
    color: '#333',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  transactionStats: {
    display: 'flex',
    gap: '40px',
    padding: '20px',
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  transactionLabel: {
    fontSize: '14px',
    color: '#666',
  },
  transactionValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  alertList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  noAlert: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
  },
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #eee',
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
  },
  alertDetails: {
    fontSize: '12px',
    color: '#666',
  },
  alertBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: '#FF9800',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
};

export default Dashboard;
