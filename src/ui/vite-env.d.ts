/// <reference types="vite/client" />
interface Window {
  electronAPI: {
    // Invoice operations
    createInvoice: (data: any) => Promise<any>;
    updateInvoice: (id: number, invoiceData: any) => Promise<any>;
    getInvoices: () => Promise<any[]>;
    getInvoicesByCustomer: (customerName: string, customerPhone: string) => Promise<any[]>;
    getInvoice: (id: number) => Promise<any>;
    deleteInvoice: (id: number) => Promise<boolean>;
    printInvoice: (invoice: any) => Promise<void>;
    generatePDF: (htmlContent: string, filename: string) => Promise<{ success: boolean; filePath?: string; message?: string; error?: string }>;
    
    // Customer operations
    getCustomers: () => Promise<any[]>;
    searchCustomers: (query: string) => Promise<any[]>;
    saveCustomer: (customer: any) => Promise<any>;
    addCustomer: (customer: any) => Promise<any>;
    deleteCustomer: (customerId: number) => Promise<{ success: boolean; message: string }>;
    
    // Service operations
    getServices: () => Promise<Service[]>;
    addService: (service: any) => Promise<any>;
    updateService: (id: number, service: any) => Promise<any>;
    deleteService: (id: number) => Promise<any>;
    
    // Currency operations
    getCurrencies: () => Promise<Currency[]>;
    addCurrency: (currency: any) => Promise<any>;
    updateCurrency: (code: string, currency: any) => Promise<any>;
    deleteCurrency: (code: string) => Promise<any>;
    
    // Settings operations
    getSettings: () => Promise<AppSettings>;
    updateSettings: (settings: any) => Promise<any>;
    
    // Report operations
    getDailySales: (date: string) => Promise<any[]>;
    getTopServices: (limit?: number) => Promise<Array<{
      name: string;
      bookings: number;
      revenue: number;
      avg_price: number;
      min_price: number;
      max_price: number;
    }>>;
    getCustomerStats: () => Promise<{
      total: number;
      new_last_30_days: number;
      new_last_7_days: number;
      new_today: number;
    }>;
    
    // Analytics API
    getMonthlyRevenue: (year: string) => Promise<any[]>;
    getYearlyRevenue: () => Promise<any[]>;
    getRevenueComparison: (period: 'day' | 'week' | 'month' | 'year') => Promise<any[]>;
    getServiceTrends: (serviceName: string, days?: number) => Promise<any[]>;
    getServicePerformance: () => Promise<any[]>;
    getCustomerGrowth: (period: 'day' | 'week' | 'month') => Promise<any[]>;
    getTopCustomers: (limit?: number) => Promise<any[]>;
    getDiscountAnalysis: () => Promise<any>;
    getCurrencyPerformance: () => Promise<any[]>;
    getDailyPerformance: (days?: number) => Promise<any[]>;
    getWeeklyPerformance: (weeks?: number) => Promise<any[]>;
    getBusinessKPIs: () => Promise<any>;
    
    // Navigation
    navigateTo: (tab: string) => void;
    onNavigate: (callback: (tab: string) => void) => () => void;
    
    // Window controls
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
}

interface CreateInvoiceData {
  customerName: string;
  customerAddress: string;
  phone: string;
  items: Array<{
    serviceId: number;
    quantity: number;
  }>;
  currency: string;
  total: number;
}

interface CreateInvoiceResponse {
  success: boolean;
  invoiceId?: number;
  error?: string;
}

interface AppSettings {
  default_currency: string;
  tax_rate: number;
  invoice_prefix: string;
}

type Service = {
  id: number;
  name: string;
  base_price: number;
  description?: string;
};

type Currency = {
  id: number;
  code: string;
  rate: number;
};