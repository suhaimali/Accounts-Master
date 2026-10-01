/**
 * Centralized Accounting Engine
 * All calculation rules are defined here and can be updated without touching UI code.
 */

const DENOMINATIONS = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

/**
 * Calculate denomination totals
 */
const calculateDenominations = (denominations) => {
  return denominations.map(d => ({
    denomination: d.denomination,
    count: d.count || 0,
    total: (d.denomination) * (d.count || 0),
  }));
};

/**
 * Calculate physical cash total from denominations
 */
const calculatePhysicalCash = (denominations) => {
  return denominations.reduce((sum, d) => sum + (d.denomination * (d.count || 0)), 0);
};

/**
 * Core reconciliation formula:
 * Expected Cash = Opening Balance + Cash Sales - Cash Expenses - Carry Forward Out + Carry Forward In
 */
const calculateExpectedCash = ({ openingBalance, cashSales, cashExpenses, carryForwardOut, carryForwardIn }) => {
  return (openingBalance || 0) + (cashSales || 0) - (cashExpenses || 0) - (carryForwardOut || 0) + (carryForwardIn || 0);
};

/**
 * Calculate difference and status
 */
const calculateReconciliation = (expectedCash, actualCash) => {
  const difference = (actualCash || 0) - (expectedCash || 0);
  let status;
  if (Math.abs(difference) < 0.01) status = 'BALANCED';
  else if (difference < 0) status = 'SHORT';
  else status = 'EXCESS';
  return { difference, status };
};

/**
 * Calculate total sales
 */
const calculateTotalSales = ({ cashSales, creditSales, gpaySales, pcSales }) => {
  return (cashSales || 0) + (creditSales || 0) + (gpaySales || 0) + (pcSales || 0);
};

/**
 * Get default denominations structure
 */
const getDefaultDenominations = () => {
  return DENOMINATIONS.map(d => ({ denomination: d, count: 0, total: 0 }));
};

/**
 * Calculate carry forward (amount to keep for next day)
 */
const calculateCarryForward = (physicalCash, withdrawalAmount) => {
  return Math.max(0, (physicalCash || 0) - (withdrawalAmount || 0));
};

module.exports = {
  DENOMINATIONS,
  calculateDenominations,
  calculatePhysicalCash,
  calculateExpectedCash,
  calculateReconciliation,
  calculateTotalSales,
  getDefaultDenominations,
  calculateCarryForward,
};
