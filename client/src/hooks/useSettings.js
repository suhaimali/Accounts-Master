export const useSettings = () => ({
  settings: {
    currency: 'INR',
    currency_symbol: '₹',
    business_name: 'Accounts Master',
    theme: 'light',
    date_format: 'DD/MM/YYYY',
    expense_categories: ['Rent', 'Salary', 'Utilities', 'Transport', 'Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'],
    denominations: [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
    balance_tolerance: 1,
  },
  loadingSettings: false,
  loadSettings: async () => {},
  updateSetting: async () => {},
  bulkUpdate: async () => {},
  formatCurrency: (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
});
