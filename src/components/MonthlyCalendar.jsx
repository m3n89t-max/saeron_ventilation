import React, { useState, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const MonthlyCalendar = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 해당 월의 첫날과 마지막날
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // 날짜별 거래 내역 계산
  const dailyTransactions = useMemo(() => {
    const dailyData = {};
    
    transactions.forEach((t) => {
      const date = new Date(t.date);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const day = date.getDate();
        if (!dailyData[day]) {
          dailyData[day] = { in: 0, out: 0 };
        }
        if (t.type === 'in') {
          dailyData[day].in += t.quantity;
        } else {
          dailyData[day].out += t.quantity;
        }
      }
    });
    
    return dailyData;
  }, [transactions, year, month]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (day) => {
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const renderCalendar = () => {
    const days = [];
    
    // 빈 칸 추가 (이전 달)
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} style={styles.emptyDay}></div>);
    }
    
    // 실제 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      const data = dailyTransactions[day];
      const hasTransaction = data && (data.in > 0 || data.out > 0);
      
      days.push(
        <div
          key={day}
          style={{
            ...styles.day,
            ...(isToday(day) ? styles.today : {}),
            ...(hasTransaction ? styles.hasTransaction : {}),
          }}
        >
          <div style={styles.dayNumber}>{day}</div>
          {data && (
            <div style={styles.transactionBadges}>
              {data.in > 0 && (
                <div style={styles.inBadge}>
                  <FaArrowUp style={{ fontSize: '8px' }} />
                  <span style={{ fontSize: '10px' }}>{data.in}</span>
                </div>
              )}
              {data.out > 0 && (
                <div style={styles.outBadge}>
                  <FaArrowDown style={{ fontSize: '8px' }} />
                  <span style={{ fontSize: '10px' }}>{data.out}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={prevMonth} style={styles.navButton}>
          <FaChevronLeft />
        </button>
        <h3 style={styles.title}>
          {year}년 {monthNames[month]}
        </h3>
        <button onClick={nextMonth} style={styles.navButton}>
          <FaChevronRight />
        </button>
      </div>
      
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.inBadge, padding: '4px 8px' }}>
            <FaArrowUp style={{ fontSize: '10px' }} />
            <span style={{ fontSize: '11px', marginLeft: '4px' }}>입고</span>
          </div>
        </div>
        <div style={styles.legendItem}>
          <div style={{ ...styles.outBadge, padding: '4px 8px' }}>
            <FaArrowDown style={{ fontSize: '10px' }} />
            <span style={{ fontSize: '11px', marginLeft: '4px' }}>출고</span>
          </div>
        </div>
      </div>

      <div style={styles.weekdays}>
        {dayNames.map((day, index) => (
          <div key={day} style={{
            ...styles.weekday,
            ...(index === 0 ? { color: '#F44336' } : {}),
            ...(index === 6 ? { color: '#2196F3' } : {}),
          }}>
            {day}
          </div>
        ))}
      </div>

      <div style={styles.calendar}>
        {renderCalendar()}
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2C5AA0',
    margin: 0,
  },
  navButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    padding: '8px 12px',
    fontSize: '16px',
    borderRadius: '6px',
    transition: 'all 0.2s',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
  },
  weekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '8px',
  },
  weekday: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#666',
    padding: '8px 0',
  },
  calendar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
  },
  emptyDay: {
    aspectRatio: '1',
    minHeight: '60px',
  },
  day: {
    aspectRatio: '1',
    minHeight: '60px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: 'white',
  },
  today: {
    backgroundColor: '#FFF9E6',
    border: '2px solid #FFC107',
    fontWeight: 'bold',
  },
  hasTransaction: {
    backgroundColor: '#F8FBFF',
  },
  dayNumber: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px',
  },
  transactionBadges: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '100%',
    alignItems: 'center',
  },
  inBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  outBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
};

export default MonthlyCalendar;
