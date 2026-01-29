export const PAYMENT_CONFIG = {
  SUBSCRIPTION_PRICE: 200000, // Cambia el precio si quieres
  CURRENCY: 'COP',
  SUBSCRIPTION_DURATION_DAYS: 365,
  
  NEQUI: {
    NUMBER: import.meta.env.VITE_NEQUI_NUMBER || '',
    HOLDER: import.meta.env.VITE_NEQUI_HOLDER || '',
  },
  
  DAVIPLATA: {
    NUMBER: import.meta.env.VITE_DAVIPLATA_NUMBER || '',
    HOLDER: import.meta.env.VITE_DAVIPLATA_HOLDER || '',
  },
  
  BANCOLOMBIA: {
    NUMBER: import.meta.env.VITE_BANCOLOMBIA_NUMBER || '',
    HOLDER: import.meta.env.VITE_BANCOLOMBIA_HOLDER || '',
  },
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};