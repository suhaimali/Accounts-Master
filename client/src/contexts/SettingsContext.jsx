import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../api/services';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    currency: 'INR',
    currency_symbol: '₹',
    business_name: 'Accounts Master',
    theme: 'light',
    date_format: 'DD/MM/YYYY',
    expense_categories: ['Rent', 'Salary', 'Utilities', 'Transport', 'Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'],
    denominations: [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1],
    balance_tolerance: 1,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await settingsAPI.getAll();
      setSettings(prev => ({ ...prev, ...res.data }));
      document.documentElement.setAttribute('data-theme', 'light');
    } catch (err) {
      console.error('Settings load error', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const updateSetting = async (key, value) => {
    await settingsAPI.update(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const bulkUpdate = async (data) => {
    await settingsAPI.bulkUpdate(data);
    setSettings(prev => ({ ...prev, ...data }));
  };

  const formatCurrency = (amount) => {
    const sym = settings.currency_symbol || '₹';
    return `${sym}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings, loadSettings, updateSetting, bulkUpdate, formatCurrency }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
