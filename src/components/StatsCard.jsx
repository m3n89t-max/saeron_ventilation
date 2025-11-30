import React from 'react';

const StatsCard = ({ icon, title, value, color, subtitle }) => {
  return (
    <div style={styles.card}>
      <div style={{ ...styles.iconContainer, backgroundColor: color + '20' }}>
        <div style={{ ...styles.icon, color }}>{icon}</div>
      </div>
      <div style={styles.content}>
        <div style={styles.title}>{title}</div>
        <div style={styles.value}>{value}</div>
        {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '32px',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px',
  },
  value: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px',
  },
};

export default StatsCard;
