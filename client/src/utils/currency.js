// Currency utility functions
export const CURRENCIES = {
  KES: { symbol: 'KES', name: 'Kenyan Shilling', locale: 'en-KE' },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { symbol: '€', name: 'Euro', locale: 'en-EU' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
  INR: { symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  UGX: { symbol: 'UGX', name: 'Ugandan Shilling', locale: 'en-UG' },
  TZS: { symbol: 'TZS', name: 'Tanzanian Shilling', locale: 'en-TZ' },
  RWF: { symbol: 'RWF', name: 'Rwandan Franc', locale: 'en-RW' }
};

// Format currency based on business currency setting
export const formatCurrency = (amount, currency = 'KES') => {
  if (amount === null || amount === undefined) return '0';
  
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.KES;
  
  try {
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currencyInfo.symbol} ${amount.toLocaleString()}`;
  }
};

// Format currency for display (without currency symbol, just the number)
export const formatCurrencyNumber = (amount, currency = 'KES') => {
  if (amount === null || amount === undefined) return '0';
  
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    return amount.toLocaleString();
  }
};

// Get currency symbol
export const getCurrencySymbol = (currency = 'KES') => {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.KES;
  return currencyInfo.symbol;
};

// Get currency name
export const getCurrencyName = (currency = 'KES') => {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.KES;
  return currencyInfo.name;
};

// Format currency for Staffma dashboard (always KES)
export const formatCurrencyForStaffma = (amount) => {
  return formatCurrency(amount, 'KES');
}; 