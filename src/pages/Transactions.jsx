import React, { useState, useMemo } from 'react';
import { FaArrowUp, FaArrowDown, FaFilter, FaFileExport } from 'react-icons/fa';
import useInventoryStore from '../store/inventoryStore';
import { formatDate, formatNumber } from '../utils/formatters';

const Transactions = () => {
  const { transactions, products } = useInventoryStore();
  const [typeFilter, setTypeFilter] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 월별 필터
  const [selectedMonth, setSelectedMonth] = useState('전체');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const product = products.find((p) => p.id === transaction.productId);
      const matchesType = typeFilter === '전체' || transaction.type === typeFilter;
      const matchesSearch =
        !product ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 월별 필터링
      let matchesMonth = true;
      if (selectedMonth !== '전체') {
        const transactionDate = new Date(transaction.date);
        const [year, month] = selectedMonth.split('-');
        matchesMonth = 
          transactionDate.getFullYear() === parseInt(year) &&
          transactionDate.getMonth() + 1 === parseInt(month);
      }
      
      return matchesType && matchesSearch && matchesMonth;
    });
  }, [transactions, products, typeFilter, searchTerm, selectedMonth]);

  const stats = useMemo(() => {
    const inTransactions = transactions.filter((t) => t.type === 'in');
    const outTransactions = transactions.filter((t) => t.type === 'out');
    const totalIn = inTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const totalOut = outTransactions.reduce((sum, t) => sum + t.quantity, 0);

    return {
      totalIn,
      totalOut,
      inCount: inTransactions.length,
      outCount: outTransactions.length,
    };
  }, [transactions]);

  const getProductName = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : '삭제된 제품';
  };

  const getProductCode = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.code : 'N/A';
  };

  // 사용 가능한 월 목록 생성
  const availableMonths = useMemo(() => {
    const months = new Set();
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return ['전체', ...Array.from(months).sort().reverse()];
  }, [transactions]);

  const exportToCSV = () => {
    const headers = ['날짜', '구분', '제품코드', '제품명', '수량', '담당자', '비고'];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.type === 'in' ? '입고' : '출고',
      getProductCode(t.productId),
      getProductName(t.productId),
      t.quantity,
      t.user,
      t.note,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `입출고내역_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>입출고 내역</h2>
        <button onClick={exportToCSV} style={styles.exportButton}>
          <FaFileExport style={{ marginRight: '8px' }} />
          CSV 내보내기
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#4CAF5020' }}>
            <FaArrowUp style={{ color: '#4CAF50', fontSize: '28px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>총 입고</div>
            <div style={styles.statValue}>{formatNumber(stats.totalIn)}</div>
            <div style={styles.statSubtext}>{stats.inCount}건</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, backgroundColor: '#F4433620' }}>
            <FaArrowDown style={{ color: '#F44336', fontSize: '28px' }} />
          </div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>총 출고</div>
            <div style={styles.statValue}>{formatNumber(stats.totalOut)}</div>
            <div style={styles.statSubtext}>{stats.outCount}건</div>
          </div>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="제품명, 담당자, 비고로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterRow}>
          <div style={styles.typeFilters}>
            <button
              onClick={() => setTypeFilter('전체')}
              style={{
                ...styles.filterButton,
                ...(typeFilter === '전체' ? styles.filterButtonActive : {}),
              }}
            >
              전체
            </button>
            <button
              onClick={() => setTypeFilter('in')}
              style={{
                ...styles.filterButton,
                ...(typeFilter === 'in' ? styles.filterButtonActiveIn : {}),
              }}
            >
              <FaArrowUp style={{ marginRight: '6px' }} />
              입고
            </button>
            <button
              onClick={() => setTypeFilter('out')}
              style={{
                ...styles.filterButton,
                ...(typeFilter === 'out' ? styles.filterButtonActiveOut : {}),
              }}
            >
              <FaArrowDown style={{ marginRight: '6px' }} />
              출고
            </button>
          </div>
          <div style={styles.monthFilter}>
            <label style={styles.monthLabel}>기간:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.monthSelect}
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month === '전체' ? '전체 기간' : `${month.split('-')[0]}년 ${month.split('-')[1]}월`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>날짜/시간</th>
              <th style={styles.th}>구분</th>
              <th style={styles.th}>제품코드</th>
              <th style={styles.th}>제품명</th>
              <th style={styles.th}>수량</th>
              <th style={styles.th}>담당자</th>
              <th style={styles.th}>비고</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.noData}>
                  입출고 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={styles.dateCell}>{formatDate(transaction.date)}</div>
                  </td>
                  <td style={styles.td}>
                    {transaction.type === 'in' ? (
                      <span style={{ ...styles.typeBadge, backgroundColor: '#4CAF50' }}>
                        <FaArrowUp style={{ marginRight: '6px' }} />
                        입고
                      </span>
                    ) : (
                      <span style={{ ...styles.typeBadge, backgroundColor: '#F44336' }}>
                        <FaArrowDown style={{ marginRight: '6px' }} />
                        출고
                      </span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.productCode}>{getProductCode(transaction.productId)}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.productName}>{getProductName(transaction.productId)}</div>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.quantityText,
                        color: transaction.type === 'in' ? '#4CAF50' : '#F44336',
                      }}
                    >
                      {transaction.type === 'in' ? '+' : '-'}
                      {formatNumber(transaction.quantity)}
                    </span>
                  </td>
                  <td style={styles.td}>{transaction.user}</td>
                  <td style={styles.td}>
                    <div style={styles.noteText}>{transaction.note || '-'}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#2196F3',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
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
  filterBar: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  searchBox: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  typeFilters: {
    display: 'flex',
    gap: '8px',
  },
  monthFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  monthLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  monthSelect: {
    padding: '8px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '20px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  filterButtonActive: {
    backgroundColor: '#333',
    color: 'white',
    borderColor: '#333',
  },
  filterButtonActiveIn: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50',
  },
  filterButtonActiveOut: {
    backgroundColor: '#F44336',
    color: 'white',
    borderColor: '#F44336',
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
  dateCell: {
    fontSize: '14px',
    color: '#666',
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  productCode: {
    fontSize: '13px',
    color: '#666',
    fontFamily: 'monospace',
  },
  productName: {
    fontWeight: 'bold',
    color: '#333',
  },
  quantityText: {
    fontWeight: 'bold',
    fontSize: '16px',
  },
  noteText: {
    color: '#666',
    fontSize: '14px',
  },
  noData: {
    padding: '60px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
  },
};

export default Transactions;
