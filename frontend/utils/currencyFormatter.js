/**
 * currencyFormatter.js
 * --------------------
 * Utility for converting and formatting job salaries between USD ($) and INR (₹).
 */

export const convertAndFormatSalary = (salaryStr, targetCurrency) => {
  if (!salaryStr) return '';
  const trimmed = salaryStr.trim();
  
  // 1. Identify source currency
  let sourceCurrency = 'USD'; // default fallback
  const lowerTrimmed = trimmed.toLowerCase();
  
  if (trimmed.includes('₹') || lowerTrimmed.includes('inr') || lowerTrimmed.includes('lpa') || lowerTrimmed.includes('lakh') || lowerTrimmed.includes('l')) {
    sourceCurrency = 'INR';
  } else if (trimmed.includes('$') || lowerTrimmed.includes('usd')) {
    sourceCurrency = 'USD';
  } else {
    // If no symbol, assume it matches the target currency to avoid unnecessary conversion
    sourceCurrency = targetCurrency;
  }
  
  // If source matches target, just clean up and return standard formatting
  if (sourceCurrency === targetCurrency) {
    if (targetCurrency === 'INR' && !trimmed.includes('₹')) {
      return `₹${trimmed}`;
    }
    if (targetCurrency === 'USD' && !trimmed.includes('$')) {
      return `$${trimmed}`;
    }
    return trimmed;
  }

  // 2. Extract numeric values
  // Find numbers (including decimals) after stripping commas
  const cleanStr = trimmed.replace(/,/g, '');
  const numberMatch = cleanStr.match(/[\d\.]+/);
  if (!numberMatch) return trimmed; // Can't parse numeric value, return original string

  let numValue = parseFloat(numberMatch[0]);

  // Adjust for "Lakh" or "LPA" or "Cr" or "K" if source is INR/USD
  let multiplier = 1;
  
  if (sourceCurrency === 'INR') {
    if (lowerTrimmed.includes('lpa') || lowerTrimmed.includes('lakh') || lowerTrimmed.includes('l')) {
      multiplier = 100000;
    } else if (lowerTrimmed.includes('cr') || lowerTrimmed.includes('crore')) {
      multiplier = 10000000;
    }
  } else if (sourceCurrency === 'USD') {
    if (lowerTrimmed.includes('k')) {
      multiplier = 1000;
    }
  }
  
  const baseValue = numValue * multiplier;
  
  // 3. Convert value using standard conversion rate (1 USD = 83 INR)
  const exchangeRate = 83;
  let convertedValue;
  if (sourceCurrency === 'USD' && targetCurrency === 'INR') {
    convertedValue = baseValue * exchangeRate;
  } else if (sourceCurrency === 'INR' && targetCurrency === 'USD') {
    convertedValue = baseValue / exchangeRate;
  } else {
    convertedValue = baseValue;
  }

  // 4. Format converted value
  const isHourly = lowerTrimmed.includes('/hr') || lowerTrimmed.includes('hour') || lowerTrimmed.includes('hr');
  
  if (targetCurrency === 'INR') {
    if (isHourly) {
      return `₹${Math.round(convertedValue).toLocaleString('en-IN')}/hr`;
    } else {
      // Format as LPA or Cr
      if (convertedValue >= 10000000) {
        return `₹${(convertedValue / 10000000).toFixed(2)} Cr/yr`;
      }
      if (convertedValue >= 100000) {
        return `₹${(convertedValue / 100000).toFixed(1)} LPA`;
      }
      return `₹${Math.round(convertedValue).toLocaleString('en-IN')}/yr`;
    }
  } else {
    // USD
    if (isHourly) {
      return `$${Math.round(convertedValue)}/hr`;
    } else {
      if (convertedValue >= 1000) {
        return `$${(convertedValue / 1000).toFixed(0)}K/yr`;
      }
      return `$${Math.round(convertedValue).toLocaleString('en-US')}/yr`;
    }
  }
};
