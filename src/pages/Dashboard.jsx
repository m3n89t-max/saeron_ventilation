import React, { useMemo, useState } from 'react';
import { FaBox, FaPlus, FaArrowUp, FaArrowDown, FaDollarSign, FaCalendarAlt, FaMoneyBillWave, FaShoppingCart } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import useInventoryStore from '../store/inventoryStore';
import StatsCard from '../components/StatsCard';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Dashboard = () => {
  const { products, transactions, sales, getTotalValue, getTotalSales, addProduct, categories } = useInventoryStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '복합환풍기',
    quantity: 0,
    price: 0,
    supplier: '',
    date: new Date().toISOString().split('T')[0], // 오늘 날짜를 기본값으로
  });

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = getTotalValue();

    const last7DaysTransactions = transactions.filter(
      (t) => new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const inCount = last7DaysTransactions.filter((t) => t.type === 'in').length;
    const outCount = last7DaysTransactions.filter((t) => t.type === 'out').length;

    // 판매 통계
    const totalSales = getTotalSales();
    const totalSalesCount = sales.length;
    
    // 오늘 판매
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.date.split('T')[0] === today);
    const todaySalesAmount = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
    const todaySalesCount = todaySales.length;

    return {
      totalProducts,
      totalQuantity,
      totalValue,
      inCount,
      outCount,
      totalSales,
      totalSalesCount,
      todaySalesAmount,
      todaySalesCount,
    };
  }, [products, transactions, sales, getTotalValue, getTotalSales]);

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

  // 월별 매출 데이터 (최근 6개월)
  const monthlySalesData = useMemo(() => {
    const monthMap = {};
    const now = new Date();
    
    // 최근 6개월 초기화
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap[monthKey] = {
        month: `${date.getMonth() + 1}월`,
        sales: 0,
        count: 0,
      };
    }
    
    // 판매 데이터 집계
    sales.forEach((sale) => {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[monthKey]) {
        monthMap[monthKey].sales += sale.totalPrice;
        monthMap[monthKey].count += 1;
      }
    });
    
    return Object.values(monthMap);
  }, [sales]);

  // 최근 판매 현황 (카테고리별)
  const salesByCategory = useMemo(() => {
    const categoryMap = {};
    
    sales.forEach((sale) => {
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        const category = product.category;
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            sales: 0,
            count: 0,
          };
        }
        categoryMap[category].sales += sale.totalPrice;
        categoryMap[category].count += sale.quantity;
      }
    });
    
    return Object.values(categoryMap);
  }, [sales, products]);

  const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0'];

  const handleAddProduct = (e) => {
    e.preventDefault();
    // 자동으로 제품코드, 최소수량, 보관위치 생성
    const productData = {
      ...formData,
      code: `PRD-${Date.now().toString().slice(-6)}`,
      minQuantity: 10, // 기본값
      location: '미지정',
    };
    addProduct(productData);
    setShowAddModal(false);
    setFormData({
      name: '',
      category: '복합환풍기',
      quantity: 0,
      price: 0,
      supplier: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>대시보드</h2>
        <button onClick={() => setShowAddModal(true)} style={styles.addButton}>
          <FaPlus style={{ marginRight: '8px' }} />
          제품 추가
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatsCard
          icon={<FaBox />}
          title="총 제품 수"
          value={formatNumber(stats.totalProducts)}
          color="#7AB547"
          subtitle="등록된 제품"
        />
        <StatsCard
          icon={<FaBox />}
          title="총 재고 수량"
          value={formatNumber(stats.totalQuantity)}
          color="#2C5AA0"
          subtitle="전체 재고"
        />
        <StatsCard
          icon={<FaDollarSign />}
          title="총 재고 가치"
          value={formatCurrency(stats.totalValue).replace('₩', '')}
          color="#9C27B0"
          subtitle="원"
        />
        <StatsCard
          icon={<FaMoneyBillWave />}
          title="총 판매액"
          value={formatCurrency(stats.totalSales).replace('₩', '')}
          color="#4CAF50"
          subtitle={`${formatNumber(stats.totalSalesCount)}건`}
        />
        <StatsCard
          icon={<FaShoppingCart />}
          title="오늘 판매액"
          value={formatCurrency(stats.todaySalesAmount).replace('₩', '')}
          color="#FF9800"
          subtitle={`${formatNumber(stats.todaySalesCount)}건`}
        />
      </div>

      {/* 월별 매출 현황 */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <FaMoneyBillWave style={{ marginRight: '8px', color: '#4CAF50' }} />
          월별 매출 현황 (최근 6개월)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlySalesData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), '매출액']}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="sales" 
              stroke="#4CAF50" 
              fillOpacity={1} 
              fill="url(#colorSales)" 
              name="매출액"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.gridRow}>
        {/* 카테고리별 판매 현황 */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <FaShoppingCart style={{ marginRight: '8px', color: '#2196F3' }} />
            카테고리별 판매 현황
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? formatCurrency(value) : formatNumber(value),
                  name === 'sales' ? '판매액' : '판매수량'
                ]}
              />
              <Legend />
              <Bar dataKey="sales" fill="#4CAF50" name="판매액" />
              <Bar dataKey="count" fill="#2196F3" name="판매수량" />
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

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>최근 7일 입출고 현황</h3>
        <div style={styles.transactionStats}>
          <div style={styles.transactionItem}>
            <FaArrowUp style={{ color: '#4CAF50', fontSize: '32px' }} />
            <div>
              <div style={styles.transactionLabel}>입고</div>
              <div style={styles.transactionValue}>{stats.inCount}건</div>
            </div>
          </div>
          <div style={styles.transactionItem}>
            <FaArrowDown style={{ color: '#F44336', fontSize: '32px' }} />
            <div>
              <div style={styles.transactionLabel}>출고</div>
              <div style={styles.transactionValue}>{stats.outCount}건</div>
            </div>
          </div>
        </div>
      </div>

      {/* 재고 추가 모달 */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>새 제품 등록</h3>
            <form onSubmit={handleAddProduct}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>제품명 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                    required
                    placeholder="제품명 입력"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={styles.input}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>수량 *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                    style={styles.input}
                    required
                    min="0"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>단가 *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                    }
                    style={styles.input}
                    required
                    min="0"
                    placeholder="원"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>공급업체</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    style={styles.input}
                    placeholder="공급업체명"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>등록 날짜 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitButton}>
                  등록하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: '',
                      category: '복합환풍기',
                      quantity: 0,
                      price: 0,
                      supplier: '',
                    });
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
    color: '#2C5AA0',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#7AB547',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(122, 181, 71, 0.3)',
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
    marginBottom: '24px',
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
    gap: '60px',
    padding: '30px',
    justifyContent: 'center',
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  transactionLabel: {
    fontSize: '16px',
    color: '#666',
  },
  transactionValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
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
};

export default Dashboard;
