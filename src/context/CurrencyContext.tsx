import React, { createContext, useContext, useState, useEffect } from 'react';

interface CurrencyContextType {
  exchangeRate: number; // renamed to match your Tenants.tsx usage
  currency: "UGX" | "USD";
  loading: boolean;
  toggleCurrency: () => void;
  formatUgx: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchangeRate, setExchangeRate] = useState<number>(3700); 
  const [currency, setCurrency] = useState<"UGX" | "USD">("USD");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data.rates && data.rates.UGX) {
          setExchangeRate(data.rates.UGX);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate, using fallback.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRate();
  }, []);

  const toggleCurrency = () => {
    setCurrency(prev => prev === "UGX" ? "USD" : "UGX");
  };

  // This is the fix! We force "UGX" or "$" labels manually.
  // Input 'amount' is now assumed to be USD
  const formatUgx = (amount: number) => {
    if (currency === "USD") {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2 
      }).format(amount);
    } else {
      // Convert USD to UGX
      const ugxAmount = Math.floor(amount * exchangeRate);
      return `UGX ${ugxAmount.toLocaleString()}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      exchangeRate, 
      currency, 
      loading, 
      toggleCurrency, 
      formatUgx 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within a CurrencyProvider");
  return context;
};