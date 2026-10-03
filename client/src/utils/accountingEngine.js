// Centralized accounting formulas - mirrors server/utils/accountingEngine.js
// Any formula change must be made here AND on the server

export const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

export const getDefaultDenominations = () =>
  DENOMINATIONS.map(d => ({ denomination: d, count: 0, total: 0 }));

export const calculateDenomTotal = (denomination, count) =>
  denomination * (parseInt(count) || 0);

export const calculatePhysicalCash = (denominations) =>
  denominations.reduce((sum, d) => sum + d.denomination * (parseInt(d.count) || 0), 0);

export const calculateExpectedCash = ({ openingBalance, cashSales, cashExpenses, carryForwardOut = 0 }) =>
  (Number(openingBalance) || 0) + (Number(cashSales) || 0) - (Number(cashExpenses) || 0) - (Number(carryForwardOut) || 0);

export const calculateDifference = (expectedCash, actualCash) =>
  (Number(actualCash) || 0) - (Number(expectedCash) || 0);

export const getReconciliationStatus = (difference, tolerance = 1) => {
  if (Math.abs(difference) <= tolerance) return 'BALANCED';
  if (difference < 0) return 'SHORT';
  return 'EXCESS';
};

export const calculateTotalSales = ({ cashSales, creditSales, gpaySales, pcSales }) =>
  (Number(cashSales) || 0) + (Number(creditSales) || 0) + (Number(gpaySales) || 0) + (Number(pcSales) || 0);

// Local-time YYYY-MM-DD (avoids UTC shift, e.g. IST before 5:30 AM)
const toLocalDateString = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Parse 'YYYY-MM-DD' as a local date (new Date('YYYY-MM-DD') is treated as UTC)
const parseDate = (value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
};

export const formatDateString = (date) => {
  if (!date) return '';
  return toLocalDateString(parseDate(date));
};

export const formatDate = (dateString, format = 'DD/MM/YYYY') => {
  if (!dateString) return '';
  const d = parseDate(dateString);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
  if (format === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  return `${day}/${month}/${year}`;
};

export const formatCurrencyRaw = (amount, symbol = '₹') =>
  `${symbol}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const getStatusColor = (status) => {
  switch (status) {
    case 'BALANCED': return 'success';
    case 'SHORT': return 'danger';
    case 'EXCESS': return 'warning';
    default: return 'secondary';
  }
};

export const todayString = () => toLocalDateString(new Date());
export const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; };
