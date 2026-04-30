import React from 'react';

const StatsCard = ({ icon, title, value, sub, color = '#2C5AA0', bgColor, onClick }) => {
  const bg = bgColor || color + '18';
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '10px',
        padding: '18px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: '15px', flexShrink: 0 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '22px', fontWeight: '800', color: '#1A202C', lineHeight: '1.2', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: '#718096', fontWeight: '500' }}>{sub}</div>}
    </div>
  );
};

export default StatsCard;
