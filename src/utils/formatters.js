import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export const formatDate = (date) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: ko });
};

export const formatDateShort = (date) => {
  return format(new Date(date), 'MM/dd', { locale: ko });
};
