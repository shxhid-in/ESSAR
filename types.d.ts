// ============================================================================
// CORE BUSINESS ENTITIES
// ============================================================================

type Customer = {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
};

type Service = {
  id?: number;
  name: string;
  description?: string;
};

type Currency = {
  id?: number;
  code: string;
  name: string;
  symbol?: string;
};

type Booking = {
  id?: number;
  customer_id: number;
  destination: string;
  package_name?: string;
  booking_date?: string;
  travel_date?: string;
  total_amount?: number;
};

type Payment = {
  id?: number;
  booking_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method?: string;
};

// ============================================================================
// LEGACY/COMPATIBILITY TYPES
// ============================================================================

type Order = {
  id: number;
  customerId: number;
  date: string;
  total: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
};

// ============================================================================
// INVOICE RELATED TYPES
// ============================================================================

type InvoiceItem = {
  serviceId: number | null;
  serviceName: string;
  serviceDescription: string;
  price: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  phone: string;
  currency: string;
  date: string;
  items: Array<{
    serviceId: number | null;
    serviceName: string;
    serviceDescription: string;
    price: number;
  }>;
  grandTotal: number;
  discount?: number;
};

type InvoiceDraft = {
  customerName: string;
  customerAddress: string;
  phone: string;
  currency: string;
  items: Array<{
    serviceId: number | null;
    serviceName: string;
    serviceDescription: string;
    price: number;
  }>;
  grandTotal: number;
  discount?: number;
};

type invoiceData = {
  customerName: string;
  customerAddress: string;
  phone: string;
  items: Array<{
    serviceId: number | null;
    serviceName: string;
    serviceDescription: string;
    price: number;
  }>;
  currency: string;
  grandTotal: number;
  discount?: number;
};

// ============================================================================
// STATISTICS AND REPORTING TYPES
// ============================================================================

type Statistics = {
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  popularServices: Array<{
    name: string;
    bookings: number;
    revenue: number;
  }>;
  recentBookings: Array<{
    id: number;
    customerName: string;
    amount: number;
    date: string;
  }>;
};

type StaticData = {
  services: Service[];
  currencies: Currency[];
  settings: AppSettings;
};

type AppSettings = {
  default_currency: string;
  tax_rate: number;
  invoice_prefix: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
};

// ============================================================================
// UI AND NAVIGATION TYPES
// ============================================================================

type View = 'invoices' | 'customers' | 'reports' | 'settings';

type FrameWindowAction = {
  action: 'minimize' | 'maximize' | 'close';
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

type UnsubscribeFunction = () => void;

// ============================================================================
// ELECTRON API DEFINITIONS
// ============================================================================

type ElectronAPI = {
  // Invoice operations
  createInvoice: (data: {
    customerName: string;
    customerAddress: string;
    phone: string;
    items: Array<{ serviceName: string; serviceDescription: string; price: number }>;
    currency: string;
    discount?: number;
  }) => Promise<{ success: boolean; invoiceId?: number; error?: string }>;

  updateInvoice: (id: number, invoiceData: {
    customerName: string;
    customerAddress: string;
    phone: string;
    items: Array<{ serviceName: string; serviceDescription: string; price: number }>;
    currency: string;
    discount?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  
  getInvoices: () => Promise<any[]>;
  getInvoicesByCustomer: (customerName: string, customerPhone: string) => Promise<any[]>;
  getInvoice: (id: number) => Promise<any>;
  deleteInvoice: (id: number) => Promise<boolean>;
  
  printInvoice: (invoice: any) => Promise<void>;
  generatePDF: (htmlContent: string, filename: string) => Promise<{ success: boolean; filePath?: string; message?: string; error?: string }>;
  getSignatureBase64: () => Promise<string>;
  getLogoBase64: () => Promise<string>;
  
  // Payment operations
  addOrUpdateInvoicePayment: (invoiceId: number, paymentData: {
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    notes?: string;
  }) => Promise<boolean>;
  getInvoicePayment: (invoiceId: number) => Promise<any>;
  
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
  
  // Updated existing functions
  getCustomerStats: () => Promise<{
    total: number;
    new_last_30_days: number;
    new_last_7_days: number;
    new_today: number;
  }>;
  getTopServices: (limit?: number) => Promise<Array<{
    name: string;
    bookings: number;
    revenue: number;
    avg_price: number;
    min_price: number;
    max_price: number;
  }>>;

  // Customer operations
  getCustomers: () => Promise<Array<{
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }>>;
  
  searchCustomers: (query: string) => Promise<Array<{
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  }>>;

  saveCustomer: (customer: Omit<Customer, 'id'> & { id?: number }) => Promise<number>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<number>;
  //deleteCustomer: (customerId: number) => Promise<{ success: boolean; message: string }>;

  // Booking operations
  getBookings: (customerId: number) => Promise<Booking[]>;
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<number>;

  // Payment operations
  getPayments: (bookingId: number) => Promise<Payment[]>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<number>;

  // Currency operations
  getCurrencies: () => Promise<Array<{ code: string; name: string; symbol?: string }>>;
  addCurrency: (currency: { code: string; name: string; symbol?: string }) => Promise<boolean>;
  updateCurrency: (code: string, currency: any) => Promise<boolean>;
  deleteCurrency: (code: string) => Promise<boolean>;

  // Service operations
  getServices: () => Promise<Service[]>;
  addService: (service: Omit<Service, 'id'>) => Promise<number>;
  updateService: (id: number, service: any) => Promise<boolean>;
  deleteService: (id: number) => Promise<boolean>;

  // Settings operations
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Reports operations
  getDailySales: (params: { date: string }) => Promise<Array<{ day: string; total: number }>>;
  getTopServices: (limit?: number) => Promise<Array<{ name: string; bookings: number; revenue: number }>>;
  getCustomerStats: () => Promise<{ total: number; new: number }>;

  // Window controls
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  navigateTo: (tab: string) => void;
  onNavigate: (callback: (tab: string) => void) => void;
};

// ============================================================================
// GLOBAL WINDOW INTERFACE EXTENSIONS
// ============================================================================

interface Window {
  // Main Electron API
  electronAPI: ElectronAPI;

  // Legacy/Alternative Electron API structure
  electron: {
    navigateTo: (callback: (tab: any) => any) => unknown;
    subscribeStatistics: (
      callback: (statistics: Statistics) => void
    ) => UnsubscribeFunction;
    getStaticData: () => Promise<StaticData>;
    subscribeChangeView: (
      callback: (view: View) => void
    ) => UnsubscribeFunction;
    sendFrameAction: (payload: FrameWindowAction) => void;
  };

  // React Query DevTools
  __REACT_QUERY_CONTEXT__?: any;
}

// ============================================================================
// MODULE DECLARATIONS
// ============================================================================

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}