export const formatCurrency = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(v);
};

export const formatNumber = (v) => {
  if (v === null || v === undefined || isNaN(v)) return '-';
  return new Intl.NumberFormat('ko-KR').format(v);
};

export const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

export const formatShortDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
};

export const formatDateTime = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export const getPaymentStatusLabel = (s) => ({ paid: '완납', partial: '부분수금', pending: '미수금' }[s] || s);
export const getPaymentStatusClass = (s) => ({ paid: 'badge-paid', partial: 'badge-partial', pending: 'badge-danger' }[s] || 'badge-gray');

export const getOrderStatusLabel = (s) => ({ pending: '대기', processing: '처리중', shipped: '배송중', delivered: '납품완료', cancelled: '취소', ordered: '발주', received: '입고완료' }[s] || s);
export const getOrderStatusClass = (s) => ({ pending: 'badge-pending', processing: 'badge-purple', shipped: 'badge-partial', delivered: 'badge-gray', cancelled: 'badge-danger', ordered: 'badge-pending', received: 'badge-paid' }[s] || 'badge-gray');

export const getQuoteStatusLabel = (s) => ({ pending: '검토중', accepted: '수주성사', rejected: '거절', draft: '초안' }[s] || s);
export const getQuoteStatusClass = (s) => ({ pending: 'badge-pending', accepted: 'badge-paid', rejected: 'badge-danger', draft: 'badge-gray' }[s] || 'badge-gray');

export const getStockStatusLabel = (qty, min) => qty === 0 ? '품절' : qty <= min ? '부족' : '정상';
export const getStockStatusClass = (qty, min) => qty === 0 ? 'badge-danger' : qty <= min ? 'badge-pending' : 'badge-paid';
