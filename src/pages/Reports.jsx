import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FaChartBar, FaChartLine, FaChartPie } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';
import { formatCurrency, formatNumber, formatDateShort } from '../utils/formatters';

const Reports = () => {
  const { products, transactions } = useInventoryStore();

  const categoryReport = useMemo(() => {
    const categoryMap = {};
    products.forEach((p) => {
      if (!categoryMap[p.category]) {
        categoryMap[p.category] = {
          category: p.category,
          quantity: 0,
          value: 0,
          products: 0,
        };
      }
      categoryMap[p.category].quantity += p.quantity;
      categoryMap[p.category].value += p.quantity * p.price;
      categoryMap[p.category].products += 1;
    });
    return Object.values(categoryMap);
  }, [products]);

  const transactionTrend = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const dayTransactions = transactions.filter(
        (t) => t.date.split('T')[0] === dateStr
      );

      const inQty = dayTransactions
        .filter((t) => t.type === 'in')
        .reduce((sum, t) => sum + t.quantity, 0);
      const outQty = dayTransactions
        .filter((t) => t.type === 'out')
        .reduce((sum, t) => sum + t.quantity, 0);

      return {
        date: formatDateShort(date),
        입고: inQty,
        출고: outQty,
      };
    });
  }, [transactions]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.quantity * b.price - a.quantity * a.price)
      .slice(0, 10)
      .map((p) => ({
        name: p.name,
        value: p.quantity * p.price,
        quantity: p.quantity,
      }));
  }, [products]);

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        <FaChartBar style={{ marginRight: '12px' }} />
        통계 리포트
      </h2>

      <div style={styles.section}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <FaChartBar style={{ marginRight: '8px' }} />
            카테고리별 재고 분석
          </h3>
          <div style={styles.chartGrid}>
            <div>
              <h4 style={styles.chartSubtitle}>재고 수량</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryReport}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#4CAF50" name="수량" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 style={styles.chartSubtitle}>재고 가치</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryReport}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#2196F3" name="가치 (원)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <h4 style={styles.chartSubtitle}>카테고리별 상세 정보</h4>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>카테고리</th>
                  <th style={styles.th}>제품 수</th>
                  <th style={styles.th}>총 수량</th>
                  <th style={styles.th}>총 가치</th>
                </tr>
              </thead>
              <tbody>
                {categoryReport.map((cat, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        {cat.category}
                      </div>
                    </td>
                    <td style={styles.td}>{cat.products}개</td>
                    <td style={styles.td}>{formatNumber(cat.quantity)}</td>
                    <td style={styles.td}>{formatCurrency(cat.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <FaChartLine style={{ marginRight: '8px' }} />
            입출고 추이 (최근 30일)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={transactionTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="입고"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="출고"
                stroke="#F44336"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <FaChartPie style={{ marginRight: '8px' }} />
            재고 가치 상위 10개 제품
          </h3>
          <div style={styles.topProductsContainer}>
            <div style={styles.topProductsChart}>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => `${entry.name.substring(0, 15)}...`}
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={styles.topProductsList}>
              {topProducts.map((product, index) => (
                <div key={index} style={styles.topProductItem}>
                  <div style={styles.topProductRank}>{index + 1}</div>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />
                  <div style={styles.topProductInfo}>
                    <div style={styles.topProductName}>{product.name}</div>
                    <div style={styles.topProductDetails}>
                      수량: {formatNumber(product.quantity)} | 가치:{' '}
                      {formatCurrency(product.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
    display: 'flex',
    alignItems: 'center',
  },
  section: {
    marginBottom: '24px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  chartSubtitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#666',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  tableContainer: {
    marginTop: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#333',
    borderBottom: '2px solid #e0e0e0',
  },
  tableRow: {
    transition: 'background-color 0.2s',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
  },
  topProductsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  topProductsChart: {
    display: 'flex',
    justifyContent: 'center',
  },
  topProductsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  topProductItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  topProductRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
  },
  topProductDetails: {
    fontSize: '12px',
    color: '#666',
  },
};

export default Reports;
