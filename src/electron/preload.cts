const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Invoice operations
  createInvoice: (data: any) => ipcRenderer.invoke('create-invoice', data),
  updateInvoice: (id: number, invoiceData: any) => ipcRenderer.invoke('update-invoice', { id, invoiceData }),
  getInvoices: () => ipcRenderer.invoke('get-invoices'),
  getInvoicesByCustomer: (customerName: string, customerPhone: string) => ipcRenderer.invoke('get-invoices-by-customer', { customerName, customerPhone }),
  getInvoice: (id: number) => ipcRenderer.invoke('get-invoice', { id }),
  deleteInvoice: (id: number) => ipcRenderer.invoke('delete-invoice', { id }),
  printInvoice: (invoice: any) => ipcRenderer.invoke('print-invoice', { invoice }),
  generatePDF: (htmlContent: string, filename: string) => ipcRenderer.invoke('generate-pdf', { htmlContent, filename }),
  
  // Customer operations
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  searchCustomers: (query: string) => ipcRenderer.invoke('search-customers', { query }),
  saveCustomer: (customer: any) => ipcRenderer.invoke('save-customer', { customer }),
  addCustomer: (customer: any) => ipcRenderer.invoke('add-customer', { customer }),
  deleteCustomer: (customerId: number) => ipcRenderer.invoke('delete-customer', { customerId }),
  
  // Service operations
  getServices: () => ipcRenderer.invoke('get-services'),
  addService: (service: any) => ipcRenderer.invoke('add-service', { service }),
  updateService: (id: number, service: any) => ipcRenderer.invoke('update-service', { id, service }),
  deleteService: (id: number) => ipcRenderer.invoke('delete-service', { id }),
  
  // Currency operations
  getCurrencies: () => ipcRenderer.invoke('get-currencies'),
  addCurrency: (currency: any) => ipcRenderer.invoke('add-currency', { currency }),
  updateCurrency: (code: string, currency: any) => ipcRenderer.invoke('update-currency', { code, currency }),
  deleteCurrency: (code: string) => ipcRenderer.invoke('delete-currency', { code }),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', { settings }),
  
  // Report operations
  getDailySales: (date: string) => ipcRenderer.invoke('get-daily-sales', { date }),
  getTopServices: (limit?: number) => ipcRenderer.invoke('get-top-services', { limit: limit || 5 }),
  getCustomerStats: () => ipcRenderer.invoke('get-customer-stats'),
  
  // Analytics API
  getMonthlyRevenue: (year: string) => ipcRenderer.invoke('get-monthly-revenue', { year }),
  getYearlyRevenue: () => ipcRenderer.invoke('get-yearly-revenue'),
  getRevenueComparison: (period: 'day' | 'week' | 'month' | 'year') => ipcRenderer.invoke('get-revenue-comparison', { period }),
  getServiceTrends: (serviceName: string, days?: number) => ipcRenderer.invoke('get-service-trends', { serviceName, days }),
  getServicePerformance: () => ipcRenderer.invoke('get-service-performance'),
  getCustomerGrowth: (period: 'day' | 'week' | 'month') => ipcRenderer.invoke('get-customer-growth', { period }),
  getTopCustomers: (limit?: number) => ipcRenderer.invoke('get-top-customers', { limit }),
  getDiscountAnalysis: () => ipcRenderer.invoke('get-discount-analysis'),
  getCurrencyPerformance: () => ipcRenderer.invoke('get-currency-performance'),
  getDailyPerformance: (days?: number) => ipcRenderer.invoke('get-daily-performance', { days }),
  getWeeklyPerformance: (weeks?: number) => ipcRenderer.invoke('get-weekly-performance', { weeks }),
  getBusinessKPIs: () => ipcRenderer.invoke('get-business-kpis'),
  
  // Navigation
  navigateTo: (tab: string) => ipcRenderer.send('navigate', { tab }),
  onNavigate: (callback: (tab: string) => void) => {
    ipcRenderer.on('navigate', (event: any, tab: string) => callback(tab));
    return () => ipcRenderer.removeAllListeners('navigate');
  },
  
  // Window controls
  minimize: () => ipcRenderer.send('window-control', { action: 'minimize' }),
  maximize: () => ipcRenderer.send('window-control', { action: 'maximize' }),
  close: () => ipcRenderer.send('window-control', { action: 'close' })
});

