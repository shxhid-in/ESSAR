import { ipcMain, WebContents, WebFrameMain } from 'electron';
import { getUIPath } from './pathResolver.js';
import { pathToFileURL } from 'url';
import { Customer, Booking, Payment, Service, Currency } from './database.js';

// Helper types for better type safety
type ResponseType<T> = T extends { return: infer R } ? R : never;
type RequestType<T> = T extends { [k: string]: unknown } ? Omit<T, 'return'> : never;
type AppSettings = {
  default_currency: string;
  tax_rate: number;
  invoice_prefix: string;
};

interface EventPayloadMapping {
  // Customer operations
  'add-customer': { customer: Omit<Customer, 'id'>; return: number };
  'save-customer': { customer: Omit<Customer, 'id'> & { id?: number }; return: number };
  'get-customers': { limit?: number; offset?: number; return: Customer[] };
  'search-customers': { query: string; return: Customer[] };
  'delete-customer': { customerId: number; return: { success: boolean; message: string } };

  // Booking operations
  'get-bookings': { customerId: number; return: Booking[] };
  'add-booking': { booking: Omit<Booking, 'id'>; return: number };
  
  // Payment operations
  'get-payments': { bookingId: number; return: Payment[] };
  'add-payment': { payment: Omit<Payment, 'id'>; return: number };
  
  // Window controls
  'window-control': { action: 'minimize' | 'maximize' | 'close'; return: void };
  'navigate': { tab: string; return: void };
  
  // Invoice operations
  'create-invoice': {
    customerName: string;
    customerAddress: string;
    phone: string;
    items: Array<{
      serviceName: string;
      serviceDescription: string;
      price: number;
    }>;
    currency: string;
    discount?: number;
    return: { success: boolean; invoiceId?: number; error?: string };
  };
  
  'update-invoice': {
    id: number;
    invoiceData: {
      customerName: string;
      customerAddress: string;
      phone: string;
      items: Array<{
        serviceName: string;
        serviceDescription: string;
        price: number;
      }>;
      currency: string;
      discount?: number;
    };
    return: { success: boolean; error?: string };
  };
  
  'get-invoices': { return: any[] };
  'get-invoices-by-customer': { customerName: string; customerPhone: string; return: any[] };
  'generate-pdf': { htmlContent: string; filename: string; return: { success: boolean; filePath?: string; message?: string; error?: string } };
  'get-invoice': { id: number; return: any };
  'delete-invoice': { id: number; return: boolean };
  
  'print-invoice': {
    invoice: any;
    return: void;
  };

  'get-daily-sales': {
    date: string;
    return: Array<{
      day: string;
      total: number;
    }>;
  };

  'get-top-services': {
    limit?: number;
    return: Array<{ name: string; bookings: number; revenue: number; }>;
  };
  'get-customer-stats': {
    return: { total: number; new: number; };
  };
  'get-settings': { return: AppSettings; };
  'update-settings': { settings: Partial<AppSettings>; return: void; };
  'get-currencies': { return: Currency[]; };
  'add-currency': { currency: Omit<Currency, 'id'>; return: boolean; };
  'update-currency': { code: string; currency: Partial<Omit<Currency, 'id'>>; return: boolean; };
  'delete-currency': { code: string; return: boolean; };
  'get-services': { return: Service[]; };
  'add-service': { service: Omit<Service, 'id'>; return: number; };
  'update-service': { id: number; service: Partial<Omit<Service, 'id'>>; return: boolean; };
  'delete-service': { id: number; return: boolean; };
  
  // Analytics API
  'get-monthly-revenue': { year: string; return: any[]; };
  'get-yearly-revenue': { return: any[]; };
  'get-revenue-comparison': { period: 'day' | 'week' | 'month' | 'year'; return: any[]; };
  'get-service-trends': { serviceName: string; days?: number; return: any[]; };
  'get-service-performance': { return: any[]; };
  'get-customer-growth': { period: 'day' | 'week' | 'month'; return: any[]; };
  'get-top-customers': { limit?: number; return: any[]; };
  'get-discount-analysis': { return: any; };
  'get-currency-performance': { return: any[]; };
  'get-daily-performance': { days?: number; return: any[]; };
  'get-weekly-performance': { weeks?: number; return: any[]; };
  'get-business-kpis': { return: any; };
}


export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: RequestType<EventPayloadMapping[Key]>) => void
) {
  ipcMain.handle(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    return handler(payload as RequestType<EventPayloadMapping[Key]>);
  });
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: EventPayloadMapping[Key]) => void
) {
  ipcMain.on(key, (event, payload) => {
    validateEventFrame(event.senderFrame);
    handler(payload as EventPayloadMapping[Key]);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === 'localhost:5123') {
    return;
  }
  if (frame.url !== pathToFileURL(getUIPath()).toString()) {
    throw new Error('Malicious event');
  }
}