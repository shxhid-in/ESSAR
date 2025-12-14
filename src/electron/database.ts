import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { app } from 'electron'; // Only if running in Electron Main process
import { Interface } from 'readline';
import { validateCustomer, validateInvoice, validateService, validateCurrency, ValidationResult } from './security/validation.js';
import { encryptCustomerData, decryptCustomerData, encryptInvoiceData, decryptInvoiceData, encryptServiceData, decryptServiceData } from './security/encryption.js';

// ---------- DB Initialization ---------- //

// Create database directory path
const dbDirectory = path.join(app.getPath('userData'), 'database');
const dbPath = path.join(dbDirectory, 'travel-agency.db');

// Ensure database directory exists
if (!existsSync(dbDirectory)) {
  mkdirSync(dbDirectory, { recursive: true });
}

export const db = new Database(dbPath);

// ---------- Types ---------- //

export type Customer = {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
};

export type Service = {
  id?: number;
  name: string;
  description?: string;
};

export type Currency = {
  id?: number;
  code: string;
  name: string;
  symbol?: string;
  exchange_rate?: number;
};

export type Booking = {
  id?: number;
  customer_id: number;
  destination: string;
  package_name?: string;
  booking_date?: string;
  travel_date?: string;
  total_amount?: number;
};

export type Payment = {
  id?: number;
  booking_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method?: string;
};

export type InvoicePayment = {
  id?: number;
  invoice_id: number;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
  created_at?: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerAddress: string;
  phone: string;
  pnr?: string;
  refNo?: string;
  currency: string;
  date: string;
  items: Array<{
    serviceId: number | null;
    serviceName: string;
    serviceDescription: string;
    purchasePrice: number;
    price: number;
  }>;
  subTotal: number;
  discount: number;
  grandTotal: number;
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  amountPaid?: number;
  remainingBalance?: number;
};

// ---------- Table Setup ---------- //

function initializeTables() {
  // Create tables only if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS currencies (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT,
      exchange_rate REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_address TEXT,
      customer_phone TEXT,
      pnr TEXT,
      ref_no TEXT,
      currency TEXT NOT NULL,
      invoice_date DATETIME NOT NULL,
      sub_total REAL NOT NULL,
      discount REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      service_id INTEGER,
      service_name TEXT NOT NULL,
      service_description TEXT,
      purchase_price REAL DEFAULT 0,
      price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY,
      default_currency TEXT DEFAULT 'USD',
      tax_rate REAL DEFAULT 0,
      invoice_prefix TEXT DEFAULT '',
      base_currency TEXT DEFAULT 'INR',
      company_name TEXT DEFAULT 'Essar Travel Hub',
      company_address TEXT,
      company_phone TEXT,
      company_email TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_sequence (
      id INTEGER PRIMARY KEY,
      current_sequence INTEGER DEFAULT 0,
      last_reset_date TEXT
    );

    CREATE TABLE IF NOT EXISTS invoice_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount_paid REAL NOT NULL DEFAULT 0,
      payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT DEFAULT 'Cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);
};

// Initialize tables
initializeTables();

// Migrate existing databases
function migrateDatabase() {
  try {
    // Add exchange_rate column to currencies table if it doesn't exist
    const hasExchangeRate = db.prepare("PRAGMA table_info(currencies)").all()
      .some((col: any) => col.name === 'exchange_rate');
    
    if (!hasExchangeRate) {
      // Adding exchange_rate column to currencies table
      db.exec("ALTER TABLE currencies ADD COLUMN exchange_rate REAL DEFAULT 1.0");
    }
    
    // Add base_currency column to app_settings table if it doesn't exist
    const hasBaseCurrency = db.prepare("PRAGMA table_info(app_settings)").all()
      .some((col: any) => col.name === 'base_currency');
    
    if (!hasBaseCurrency) {
      // Adding base_currency column to app_settings table
      db.exec("ALTER TABLE app_settings ADD COLUMN base_currency TEXT DEFAULT 'INR'");
    }
    
    // Add purchase_price column to invoice_items table if it doesn't exist
    const invoiceItemsInfo = db.prepare("PRAGMA table_info(invoice_items)").all() as Array<{ name: string }>;
    const hasPurchasePrice = invoiceItemsInfo.some((col: any) => col.name === 'purchase_price');
    
    if (!hasPurchasePrice) {
      // Adding purchase_price column to invoice_items table
      db.exec("ALTER TABLE invoice_items ADD COLUMN purchase_price REAL DEFAULT 0");
    }
    
    // Add ref_no column to invoices table if it doesn't exist
    const invoicesInfo = db.prepare("PRAGMA table_info(invoices)").all() as Array<{ name: string }>;
    const hasRefNo = invoicesInfo.some((col: any) => col.name === 'ref_no');
    
    if (!hasRefNo) {
      // Adding ref_no column to invoices table
      db.exec("ALTER TABLE invoices ADD COLUMN ref_no TEXT");
    }
    
    // Migrate existing invoices: Remove INV prefix from invoice numbers
    try {
      const invoicesWithPrefix = db.prepare(`
        SELECT id, invoice_number FROM invoices WHERE invoice_number LIKE 'INV%'
      `).all() as Array<{ id: number; invoice_number: string }>;
      
      if (invoicesWithPrefix.length > 0) {
        const updateInvoice = db.prepare(`
          UPDATE invoices SET invoice_number = ? WHERE id = ?
        `);
        
        for (const invoice of invoicesWithPrefix) {
          // Remove INV prefix if present
          const newNumber = invoice.invoice_number.startsWith('INV') 
            ? invoice.invoice_number.substring(3) 
            : invoice.invoice_number;
          
          // Only update if the new number doesn't already exist
          const existing = db.prepare("SELECT id FROM invoices WHERE invoice_number = ? AND id != ?").get(newNumber, invoice.id);
          if (!existing) {
            updateInvoice.run(newNumber, invoice.id);
          }
        }
      }
    } catch (migrationError) {
      console.error('Invoice number migration failed:', migrationError);
      // Don't block app startup if migration fails
    }
  } catch (error) {
    console.error('Database migration failed:', error);
  }
}

// Run migrations
migrateDatabase();

// Insert default data
const defaultServices = [
  { name: 'Flight Booking', description: 'International flight booking service' },
  { name: 'Hotel Reservation', description: 'Hotel accommodation booking' },
  { name: 'Visa Processing', description: 'Visa application and processing' },
  { name: 'Travel Insurance', description: 'Comprehensive travel insurance' },
  { name: 'Airport Transfer', description: 'Airport pickup and drop service' }
];

const defaultCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 83.5 },
  { code: 'EUR', name: 'Euro', symbol: '€', exchange_rate: 90.2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', exchange_rate: 105.8 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', exchange_rate: 22.7 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchange_rate: 1.0 }
];

// Default customers removed for production - users will add their own customers
const defaultCustomers: any[] = [];

// Insert default services if they don't exist
defaultServices.forEach(service => {
  const existing = db.prepare("SELECT id FROM services WHERE name = ?").get(service.name);
  if (!existing) {
    db.prepare("INSERT INTO services (name, description) VALUES (?, ?)")
      .run(service.name, service.description);
  }
});

// Insert default currencies if they don't exist
defaultCurrencies.forEach(currency => {
  const existing = db.prepare("SELECT code FROM currencies WHERE code = ?").get(currency.code);
  if (!existing) {
    db.prepare("INSERT INTO currencies (code, name, symbol, exchange_rate) VALUES (?, ?, ?, ?)")
      .run(currency.code, currency.name, currency.symbol, currency.exchange_rate);
  }
});

// Insert default customers if they don't exist
defaultCustomers.forEach(customer => {
  const existing = db.prepare("SELECT id FROM customers WHERE name = ? AND phone = ?").get(customer.name, customer.phone);
  if (!existing) {
    db.prepare("INSERT INTO customers (name, phone, email, address, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(customer.name, customer.phone, customer.email, customer.address, new Date().toISOString());
  }
});

// ---------- Customer Functions ---------- //

export const customerDB = {
  // Create or update customer
  saveCustomer: (customer: Omit<Customer, 'id'> & { id?: number }) => {
    // Validate customer data
    const validation = validateCustomer(customer);
    if (!validation.isValid) {
      throw new Error(`Customer validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedCustomer = validation.sanitizedData!;
    const encryptedCustomer = encryptCustomerData(sanitizedCustomer);
    
    if (customer.id) {
      const stmt = db.prepare(`
        UPDATE customers SET 
        name = ?, phone = ?, email = ?, address = ?
        WHERE id = ?
      `);
      stmt.run(
        encryptedCustomer.name,
        encryptedCustomer.phone,
        encryptedCustomer.email,
        encryptedCustomer.address,
        customer.id
      );
      return customer.id;
    } else {
      const stmt = db.prepare(`
        INSERT INTO customers (name, phone, email, address, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        encryptedCustomer.name,
        encryptedCustomer.phone,
        encryptedCustomer.email,
        encryptedCustomer.address,
        new Date().toISOString()
      );
      return result.lastInsertRowid as number;
    }
  },

  // Get all customers (with pagination)
  getCustomers: (limit = 100, offset = 0) => {
    const customers = db.prepare(`
      SELECT * FROM customers 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset) as Customer[];
    
    // Decrypt customer data
    return customers.map(customer => decryptCustomerData(customer));
  },

  // Search customers by name/phone
  searchCustomers: (query: string) => {
    const customers = db.prepare(`
      SELECT * FROM customers 
      WHERE name LIKE ? OR phone LIKE ?
      LIMIT 50
    `).all(`%${query}%`, `%${query}%`) as Customer[];
    
    // Decrypt customer data
    return customers.map(customer => decryptCustomerData(customer));
  },

  // Delete customer by ID
  deleteCustomer: (customerId: number) => {
    try {
      
      // Validate customerId
      if (!customerId || typeof customerId !== 'number') {
        throw new Error(`Invalid customer ID: ${customerId} (type: ${typeof customerId})`);
      }
      
      // First check if customer exists
      const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customerId) as Customer;
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      
      // For now, we'll allow deletion without checking invoices
      // This is a simplified approach to avoid encryption issues
      // In a production app, you'd want to implement proper invoice checking
      
      // Delete the customer
      const stmt = db.prepare(`DELETE FROM customers WHERE id = ?`);
      const result = stmt.run(customerId);
      
      if (result.changes === 0) {
        throw new Error('Customer not found');
      }
      
      return { success: true, message: 'Customer deleted successfully' };
    } catch (error) {
      console.error('Customer deletion failed:', error);
      throw error;
    }
  }
};

export function addCustomer(customer: Customer): number {
  const stmt = db.prepare(`
    INSERT INTO customers (name, phone, email, address)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(customer.name, customer.phone, customer.email, customer.address);
  return result.lastInsertRowid as number;
}

export function getAllCustomers(): Customer[] {
  return db.prepare(`SELECT * FROM customers`).all() as Customer[];
}

// ---------- Booking Functions ---------- //

export function addBooking(booking: Booking): number {
  const stmt = db.prepare(`
    INSERT INTO bookings (customer_id, destination, package_name, booking_date, travel_date, total_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    booking.customer_id,
    booking.destination,
    booking.package_name,
    booking.booking_date,
    booking.travel_date,
    booking.total_amount
  );
  return result.lastInsertRowid as number;
}

export function getBookingsByCustomer(customerId: number): Booking[] {
  return db.prepare(`SELECT * FROM bookings WHERE customer_id = ?`).all(customerId) as Booking[];
}

// ---------- Payment Functions ---------- //

export function addPayment(payment: Payment): number {
  const stmt = db.prepare(`
    INSERT INTO payments (booking_id, amount_paid, payment_date, payment_method)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    payment.booking_id,
    payment.amount_paid,
    payment.payment_date,
    payment.payment_method
  );
  return result.lastInsertRowid as number;
}

export function getPaymentsByBooking(bookingId: number): Payment[] {
  return db.prepare(`SELECT * FROM payments WHERE booking_id = ?`).all(bookingId) as Payment[];
}

// ---------- Report Functions ---------- //

export const reportDB = {
  // Revenue Analytics
  getDailySales: (date: string) => {
    const dailyData = db.prepare(`
      SELECT strftime('%Y-%m-%d', invoice_date) as day, 
             grand_total,
             currency,
             COUNT(*) as invoice_count
      FROM invoices
      WHERE invoice_date LIKE ?
      GROUP BY day, grand_total, currency
      ORDER BY day DESC
      LIMIT 30
    `).all(`${date}%`) as Array<{ day: string; grand_total: number; currency: string; invoice_count: number }>;
    
    // Group by day and convert currencies
    const groupedData = dailyData.reduce((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = {
          day: item.day,
          total: 0,
          invoice_count: 0,
          amounts: []
        };
      }
      acc[item.day].total += convertToBaseCurrency(item.grand_total, item.currency);
      acc[item.day].invoice_count += item.invoice_count;
      acc[item.day].amounts.push(convertToBaseCurrency(item.grand_total, item.currency));
      return acc;
    }, {} as Record<string, { day: string; total: number; invoice_count: number; amounts: number[] }>);
    
    return Object.values(groupedData).map(item => ({
      day: item.day,
      total: item.total,
      invoice_count: item.invoice_count,
      avg_invoice_value: item.amounts.length > 0 ? item.total / item.amounts.length : 0
    }));
  },

  getMonthlyRevenue: (year: string) => {
    const monthlyData = db.prepare(`
      SELECT strftime('%Y-%m', invoice_date) as month,
             grand_total,
             currency
      FROM invoices
      WHERE strftime('%Y', invoice_date) = ?
      ORDER BY month DESC
    `).all(year) as Array<{ month: string; grand_total: number; currency: string }>;
    
    // Group by month and convert currencies
    const groupedData = monthlyData.reduce((acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = {
          month: item.month,
          total: 0,
          invoice_count: 0,
          amounts: []
        };
      }
      acc[item.month].total += convertToBaseCurrency(item.grand_total, item.currency);
      acc[item.month].invoice_count += 1;
      acc[item.month].amounts.push(convertToBaseCurrency(item.grand_total, item.currency));
      return acc;
    }, {} as Record<string, { month: string; total: number; invoice_count: number; amounts: number[] }>);
    
    return Object.values(groupedData).map(item => ({
      month: item.month,
      total: item.total,
      invoice_count: item.invoice_count,
      avg_invoice_value: item.amounts.length > 0 ? item.total / item.amounts.length : 0
    }));
  },

  getYearlyRevenue: () => {
    const yearlyData = db.prepare(`
      SELECT strftime('%Y', invoice_date) as year,
             grand_total,
             currency
      FROM invoices
      ORDER BY year DESC
    `).all() as Array<{ year: string; grand_total: number; currency: string }>;
    
    // Group by year and convert currencies
    const groupedData = yearlyData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = {
          year: item.year,
          total: 0,
          invoice_count: 0,
          amounts: []
        };
      }
      acc[item.year].total += convertToBaseCurrency(item.grand_total, item.currency);
      acc[item.year].invoice_count += 1;
      acc[item.year].amounts.push(convertToBaseCurrency(item.grand_total, item.currency));
      return acc;
    }, {} as Record<string, { year: string; total: number; invoice_count: number; amounts: number[] }>);
    
    return Object.values(groupedData).map(item => ({
      year: item.year,
      total: item.total,
      invoice_count: item.invoice_count,
      avg_invoice_value: item.amounts.length > 0 ? item.total / item.amounts.length : 0
    }));
  },

  getRevenueComparison: (period: 'day' | 'week' | 'month' | 'year') => {
    const dateFormat = period === 'day' ? '%Y-%m-%d' : 
                      period === 'week' ? '%Y-%W' : 
                      period === 'month' ? '%Y-%m' : '%Y';
    
    return db.prepare(`
      SELECT 
        strftime('${dateFormat}', invoice_date) as period,
        SUM(grand_total) as current_total,
        LAG(SUM(grand_total)) OVER (ORDER BY strftime('${dateFormat}', invoice_date)) as previous_total,
        COUNT(*) as invoice_count
      FROM invoices
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `).all() as Array<{ period: string; current_total: number; previous_total: number | null; invoice_count: number }>;
  },

  // Service Performance
  getTopServices: (limit = 5) => {
    return db.prepare(`
      SELECT service_name as name, 
             COUNT(*) as bookings,
             SUM(price) as revenue,
             AVG(price) as avg_price,
             MIN(price) as min_price,
             MAX(price) as max_price
      FROM invoice_items
      GROUP BY service_name
      ORDER BY revenue DESC
      LIMIT ?
    `).all(limit) as Array<{ name: string; bookings: number; revenue: number; avg_price: number; min_price: number; max_price: number }>;
  },

  getServiceTrends: (serviceName: string, days = 30) => {
    return db.prepare(`
      SELECT strftime('%Y-%m-%d', i.invoice_date) as day,
             COUNT(ii.id) as bookings,
             SUM(ii.price) as revenue
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE ii.service_name = ? 
        AND i.invoice_date >= date('now', '-${days} days')
      GROUP BY day
      ORDER BY day DESC
    `).all(serviceName) as Array<{ day: string; bookings: number; revenue: number }>;
  },

  getServicePerformance: () => {
    const results = db.prepare(`
      SELECT 
        service_name,
        COUNT(*) as total_bookings,
        SUM(price) as total_revenue,
        SUM(COALESCE(purchase_price, 0)) as total_purchase_cost,
        AVG(price) as avg_price,
        AVG(COALESCE(purchase_price, 0)) as avg_purchase_price,
        COUNT(DISTINCT invoice_id) as unique_invoices,
        MIN(i.invoice_date) as first_booking,
        MAX(i.invoice_date) as last_booking
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      GROUP BY service_name
      ORDER BY total_revenue DESC
    `).all() as Array<{ 
      service_name: string; 
      total_bookings: number; 
      total_revenue: number; 
      total_purchase_cost: number;
      avg_price: number; 
      avg_purchase_price: number;
      unique_invoices: number;
      first_booking: string;
      last_booking: string;
    }>;
    
    // Calculate profit for each service
    return results.map(item => ({
      ...item,
      total_profit: item.total_revenue - (item.total_purchase_cost || 0),
      profit_margin: item.total_revenue > 0 
        ? ((item.total_revenue - (item.total_purchase_cost || 0)) / item.total_revenue) * 100 
        : 0
    }));
  },

  // Customer Analytics
  getCustomerStats: () => {
    return db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN created_at > date('now','-30 days') THEN 1 ELSE 0 END) as new_last_30_days,
        SUM(CASE WHEN created_at > date('now','-7 days') THEN 1 ELSE 0 END) as new_last_7_days,
        SUM(CASE WHEN created_at > date('now','-1 day') THEN 1 ELSE 0 END) as new_today
      FROM customers
    `).get() as { total: number; new_last_30_days: number; new_last_7_days: number; new_today: number };
  },

  getCustomerGrowth: (period: 'day' | 'week' | 'month') => {
    const dateFormat = period === 'day' ? '%Y-%m-%d' : 
                      period === 'week' ? '%Y-%W' : '%Y-%m';
    
    return db.prepare(`
      SELECT 
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as new_customers
      FROM customers
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `).all() as Array<{ period: string; new_customers: number }>;
  },

  getTopCustomers: (limit = 10) => {
    return db.prepare(`
      SELECT 
        customer_name,
        COUNT(*) as total_invoices,
        SUM(grand_total) as total_spent,
        AVG(grand_total) as avg_invoice_value,
        MIN(invoice_date) as first_purchase,
        MAX(invoice_date) as last_purchase
      FROM invoices
      GROUP BY customer_name
      ORDER BY total_spent DESC
      LIMIT ?
    `).all(limit) as Array<{ 
      customer_name: string; 
      total_invoices: number; 
      total_spent: number; 
      avg_invoice_value: number;
      first_purchase: string;
      last_purchase: string;
    }>;
  },

  // Financial Insights
  getDiscountAnalysis: () => {
    return db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN discount > 0 THEN 1 ELSE 0 END) as discounted_invoices,
        AVG(discount) as avg_discount,
        SUM(discount) as total_discounts_given,
        AVG(grand_total) as avg_invoice_value
      FROM invoices
    `).get() as { 
      total_invoices: number; 
      discounted_invoices: number; 
      avg_discount: number; 
      total_discounts_given: number;
      avg_invoice_value: number;
    };
  },

  getCurrencyPerformance: () => {
    return db.prepare(`
      SELECT 
        currency,
        COUNT(*) as invoice_count,
        SUM(grand_total) as total_revenue,
        AVG(grand_total) as avg_invoice_value
      FROM invoices
      GROUP BY currency
      ORDER BY total_revenue DESC
    `).all() as Array<{ 
      currency: string; 
      invoice_count: number; 
      total_revenue: number; 
      avg_invoice_value: number;
    }>;
  },

  // Time-based Analysis
  getDailyPerformance: (days = 7) => {
    const results = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', i.invoice_date) as day,
        strftime('%w', i.invoice_date) as day_of_week,
        COUNT(DISTINCT i.id) as invoice_count,
        SUM(i.grand_total) as total_revenue,
        AVG(i.grand_total) as avg_invoice_value,
        SUM(i.discount) as total_discounts,
        SUM(ii.price) as total_selling_price,
        SUM(COALESCE(ii.purchase_price, 0)) as total_purchase_cost
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.invoice_date >= date('now', '-${days} days')
      GROUP BY day
      ORDER BY day DESC
    `).all() as Array<{ 
      day: string; 
      day_of_week: number; 
      invoice_count: number; 
      total_revenue: number; 
      avg_invoice_value: number;
      total_discounts: number;
      total_selling_price: number;
      total_purchase_cost: number;
    }>;
    
    // Calculate profit for each day
    return results.map(item => ({
      day: item.day,
      day_of_week: item.day_of_week,
      invoice_count: item.invoice_count,
      total_revenue: item.total_revenue,
      avg_invoice_value: item.avg_invoice_value,
      total_discounts: item.total_discounts,
      total_profit: (item.total_selling_price || 0) - (item.total_purchase_cost || 0),
      profit_margin: (item.total_selling_price || 0) > 0 
        ? (((item.total_selling_price || 0) - (item.total_purchase_cost || 0)) / (item.total_selling_price || 0)) * 100 
        : 0
    }));
  },

  getWeeklyPerformance: (weeks = 12) => {
    return db.prepare(`
      SELECT 
        strftime('%Y-%W', invoice_date) as week,
        COUNT(*) as invoice_count,
        SUM(grand_total) as total_revenue,
        AVG(grand_total) as avg_invoice_value
      FROM invoices
      WHERE invoice_date >= date('now', '-${weeks * 7} days')
      GROUP BY week
      ORDER BY week DESC
    `).all() as Array<{ 
      week: string; 
      invoice_count: number; 
      total_revenue: number; 
      avg_invoice_value: number;
    }>;
  },

  // Business KPIs
  getBusinessKPIs: () => {
    const invoices = db.prepare(`
      SELECT grand_total, currency FROM invoices
    `).all() as Array<{ grand_total: number; currency: string }>;
    
    const invoicesLast30Days = db.prepare(`
      SELECT grand_total, currency FROM invoices WHERE invoice_date >= date('now', '-30 days')
    `).all() as Array<{ grand_total: number; currency: string }>;
    
    // Get all invoice items with purchase and selling prices for profit calculation
    const allItems = db.prepare(`
      SELECT ii.purchase_price, ii.price, i.currency
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
    `).all() as Array<{ purchase_price: number; price: number; currency: string }>;
    
    const allItemsLast30Days = db.prepare(`
      SELECT ii.purchase_price, ii.price, i.currency
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE i.invoice_date >= date('now', '-30 days')
    `).all() as Array<{ purchase_price: number; price: number; currency: string }>;
    
    // Convert all amounts to base currency
    const totalRevenue = invoices.reduce((sum, invoice) => 
      sum + convertToBaseCurrency(invoice.grand_total, invoice.currency), 0);
    
    const revenueLast30Days = invoicesLast30Days.reduce((sum, invoice) => 
      sum + convertToBaseCurrency(invoice.grand_total, invoice.currency), 0);
    
    // Calculate total profit (selling price - purchase price)
    const totalProfit = allItems.reduce((sum, item) => {
      const sellingPrice = convertToBaseCurrency(item.price, item.currency);
      const purchasePrice = convertToBaseCurrency(item.purchase_price || 0, item.currency);
      return sum + (sellingPrice - purchasePrice);
    }, 0);
    
    const profitLast30Days = allItemsLast30Days.reduce((sum, item) => {
      const sellingPrice = convertToBaseCurrency(item.price, item.currency);
      const purchasePrice = convertToBaseCurrency(item.purchase_price || 0, item.currency);
      return sum + (sellingPrice - purchasePrice);
    }, 0);
    
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const avgProfit = allItems.length > 0 ? totalProfit / allItems.length : 0;
    
    const otherStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM invoices) as total_invoices,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(DISTINCT service_name) FROM invoice_items) as total_services,
        (SELECT COUNT(*) FROM invoices WHERE invoice_date >= date('now', '-30 days')) as invoices_last_30_days
    `).get() as { 
      total_invoices: number;
      total_customers: number;
      total_services: number;
      invoices_last_30_days: number;
    };
    
    return {
      ...otherStats,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      profit_last_30_days: profitLast30Days,
      avg_profit: avgProfit,
      avg_invoice_value: avgInvoiceValue,
      revenue_last_30_days: revenueLast30Days
    };
  }
};

// ---------- Currency Conversion Functions ---------- //

export function convertToBaseCurrency(amount: number, fromCurrency: string): number {
  const settings = settingsDB.getSettings();
  const baseCurrency = settings.base_currency;
  
  if (fromCurrency === baseCurrency) {
    return amount;
  }
  
  const fromRate = db.prepare("SELECT exchange_rate FROM currencies WHERE code = ?").get(fromCurrency) as { exchange_rate: number } | undefined;
  const baseRate = db.prepare("SELECT exchange_rate FROM currencies WHERE code = ?").get(baseCurrency) as { exchange_rate: number } | undefined;
  
  if (!fromRate || !baseRate) {
    return amount; // Return original amount if conversion rates not found
  }
  
  // Convert: amount * (from_rate / base_rate)
  return amount * (fromRate.exchange_rate / baseRate.exchange_rate);
}

export function getBaseCurrencySymbol(): string {
  const settings = settingsDB.getSettings();
  const baseCurrency = settings.base_currency;
  const currency = db.prepare("SELECT symbol FROM currencies WHERE code = ?").get(baseCurrency) as { symbol: string } | undefined;
  return currency?.symbol || '₹';
}

// ---------- Settings Functions ---------- //

export const settingsDB = {
  getSettings: () => {
    const settings = db.prepare("SELECT * FROM app_settings LIMIT 1").get() as {
      default_currency: string;
      tax_rate: number;
      invoice_prefix: string;
      base_currency: string;
    } | undefined;
    
    // Return default settings if none exist
    if (!settings) {
      return {
        default_currency: 'USD',
        tax_rate: 0,
        invoice_prefix: '',
        base_currency: 'INR'
      };
    }
    
    return settings;
  },
  
  updateSettings: (settings: {
    default_currency?: string;
    tax_rate?: number;
    invoice_prefix?: string;
    base_currency?: string;
  }) => {
    const current = settingsDB.getSettings();
    const merged = { ...current, ...settings };
    db.prepare(`
      INSERT OR REPLACE INTO app_settings 
      (id, default_currency, tax_rate, invoice_prefix, base_currency)
      VALUES (1, ?, ?, ?, ?)
    `).run(merged.default_currency, merged.tax_rate, merged.invoice_prefix, merged.base_currency);
  }
};

// ---------- Invoice Functions ---------- //

function generateInvoiceNumber(): string {
  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = String(today.getFullYear());
  // YYYYMMNNNNN format (4 year + 2 month + 5 serial = 11 digits total)
  const dateStr = `${yyyy}${mm}`;
  
  // Get or create global sequence (never resets)
  let sequence = db.prepare("SELECT current_sequence FROM invoice_sequence WHERE id = 1").get() as { current_sequence: number } | undefined;
  
  if (!sequence) {
    // Initialize sequence if it doesn't exist
    db.prepare("INSERT OR IGNORE INTO invoice_sequence (id, current_sequence, last_reset_date) VALUES (1, 0, NULL)").run();
    sequence = { current_sequence: 0 };
  }
  
  // Increment sequence (never resets, goes infinitely)
  const newSequence = sequence.current_sequence + 1;
  db.prepare("UPDATE invoice_sequence SET current_sequence = ? WHERE id = 1").run(newSequence);
  
  const serialNumber = String(newSequence).padStart(5, '0');
  return `${dateStr}${serialNumber}`;
}

export function createInvoice(invoiceData: {
  customerName: string;
  customerAddress: string;
  phone: string;
  currency: string;
  items: Array<{
    serviceName: string;
    serviceDescription: string;
    purchasePrice?: number;
    price: number;
  }>;
  discount?: number;
  refNo?: string;
  isFullyPaid?: boolean;
}): { success: boolean; invoiceId?: number; error?: string } {
  try {
    // Validate invoice data
    const validation = validateInvoice(invoiceData);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: `Invoice validation failed: ${validation.errors.join(', ')}` 
      };
    }
    
    const sanitizedInvoice = validation.sanitizedData!;
    const encryptedInvoice = encryptInvoiceData(sanitizedInvoice);
    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = new Date().toISOString();
    
    // Calculate totals
    let subTotal = 0;
    const itemsWithDetails = sanitizedInvoice.items.map((item: any) => {
      subTotal += item.price;
      
      return {
        serviceId: null, // No longer using service IDs
        serviceName: item.serviceName,
        serviceDescription: item.serviceDescription,
        purchasePrice: item.purchasePrice || 0,
        price: item.price
      };
    });
    
    const discount = sanitizedInvoice.discount || 0;
    const grandTotal = subTotal - discount;
    
    // Create invoice
    const invoiceResult = db.prepare(`
      INSERT INTO invoices (invoice_number, customer_name, customer_address, customer_phone, currency, invoice_date, sub_total, discount, grand_total, ref_no)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceNumber,
      encryptedInvoice.customerName,
      encryptedInvoice.customerAddress,
      encryptedInvoice.phone,
      sanitizedInvoice.currency,
      invoiceDate,
      subTotal,
      discount,
      grandTotal,
      sanitizedInvoice.refNo || null
    );
    
    const invoiceId = invoiceResult.lastInsertRowid as number;
    
    // Create invoice items
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, service_id, service_name, service_description, purchase_price, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    itemsWithDetails.forEach((item: any) => {
      insertItem.run(invoiceId, item.serviceId, item.serviceName, item.serviceDescription, item.purchasePrice, item.price);
    });
    
    // Create payment record if fully paid
    if (invoiceData.isFullyPaid) {
      addOrUpdateInvoicePayment(invoiceId, {
        amountPaid: grandTotal,
        paymentDate: invoiceDate,
        paymentMethod: 'Cash',
        notes: 'Payment received at invoice creation'
      });
    }
    
    return { success: true, invoiceId };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export function updateInvoice(invoiceId: number, invoiceData: {
  customerName: string;
  customerAddress: string;
  phone: string;
  currency: string;
  items: Array<{
    serviceName: string;
    serviceDescription: string;
    purchasePrice?: number;
    price: number;
  }>;
  discount?: number;
  refNo?: string;
}): { success: boolean; error?: string } {
  try {
    // Calculate totals
    let subTotal = 0;
    invoiceData.items.forEach(item => {
      subTotal += item.price;
    });
    
    const discount = invoiceData.discount || 0;
    const grandTotal = subTotal - discount;
    
    // Update invoice
    const updateInvoice = db.prepare(`
      UPDATE invoices SET 
        customer_name = ?, 
        customer_address = ?, 
        customer_phone = ?, 
        currency = ?, 
        sub_total = ?, 
        discount = ?, 
        grand_total = ?,
        ref_no = ?
      WHERE id = ?
    `);
    
    updateInvoice.run(
      invoiceData.customerName,
      invoiceData.customerAddress,
      invoiceData.phone,
      invoiceData.currency,
      subTotal,
      discount,
      grandTotal,
      invoiceData.refNo || null,
      invoiceId
    );
    
    // Delete existing items
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId);
    
    // Insert new items
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, service_id, service_name, service_description, purchase_price, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    invoiceData.items.forEach(item => {
      insertItem.run(invoiceId, null, item.serviceName, item.serviceDescription, item.purchasePrice || 0, item.price);
    });
    
    return { success: true };
  } catch (error) {
    console.error('Invoice update failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Helper function to calculate payment status
function calculatePaymentStatus(amountPaid: number, grandTotal: number): 'unpaid' | 'pending' | 'paid' {
  if (amountPaid === 0) return 'unpaid';
  if (amountPaid >= grandTotal) return 'paid';
  return 'pending';
}

// Helper function to get payment for invoice
function getInvoicePayment(invoiceId: number): { amountPaid: number; paymentDate: string; paymentMethod: string; notes?: string } | null {
  const payment = db.prepare(`
    SELECT amount_paid, payment_date, payment_method, notes 
    FROM invoice_payments 
    WHERE invoice_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(invoiceId) as any;
  
  if (!payment) return null;
  
  return {
    amountPaid: payment.amount_paid || 0,
    paymentDate: payment.payment_date,
    paymentMethod: payment.payment_method || 'Cash',
    notes: payment.notes
  };
}

export function getAllInvoices(): Invoice[] {
  const invoices = db.prepare(`
    SELECT * FROM invoices ORDER BY created_at DESC
  `).all() as any[];
  
  return invoices.map(invoice => {
    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `).all(invoice.id) as any[];
    
    // Decrypt invoice data
    const decryptedInvoice = decryptInvoiceData(invoice);
    
    // Get payment info
    const payment = getInvoicePayment(invoice.id);
    const amountPaid = payment?.amountPaid || 0;
    const remainingBalance = invoice.grand_total - amountPaid;
    const paymentStatus = calculatePaymentStatus(amountPaid, invoice.grand_total);
    
    return {
      id: invoice.id.toString(),
      invoiceNumber: invoice.invoice_number,
      customerName: decryptedInvoice.customer_name,
      customerAddress: decryptedInvoice.customer_address,
      phone: decryptedInvoice.customer_phone,
      pnr: invoice.pnr,
      refNo: invoice.ref_no,
      currency: invoice.currency,
      date: invoice.invoice_date,
      items: items.map(item => ({
        serviceId: item.service_id,
        serviceName: item.service_name,
        serviceDescription: item.service_description,
        purchasePrice: item.purchase_price || 0,
        price: item.price
      })),
      subTotal: invoice.sub_total,
      discount: invoice.discount,
      grandTotal: invoice.grand_total,
      paymentStatus,
      amountPaid,
      remainingBalance
    };
  });
}

export function getInvoicesByCustomer(customerName: string, customerPhone: string): Invoice[] {
  const invoices = db.prepare(`
    SELECT * FROM invoices 
    WHERE customer_name = ? AND customer_phone = ?
    ORDER BY created_at DESC
  `).all(customerName, customerPhone) as any[];
  
  return invoices.map(invoice => {
    const items = db.prepare(`
      SELECT * FROM invoice_items WHERE invoice_id = ?
    `).all(invoice.id) as any[];
    
    // Get payment info
    const payment = getInvoicePayment(invoice.id);
    const amountPaid = payment?.amountPaid || 0;
    const remainingBalance = invoice.grand_total - amountPaid;
    const paymentStatus = calculatePaymentStatus(amountPaid, invoice.grand_total);
    
    return {
      id: invoice.id.toString(),
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerAddress: invoice.customer_address,
      phone: invoice.customer_phone,
      pnr: invoice.pnr,
      refNo: invoice.ref_no,
      currency: invoice.currency,
      date: invoice.invoice_date,
      items: items.map(item => ({
        serviceId: item.service_id,
        serviceName: item.service_name,
        serviceDescription: item.service_description,
        purchasePrice: item.purchase_price || 0,
        price: item.price
      })),
      subTotal: invoice.sub_total,
      discount: invoice.discount,
      grandTotal: invoice.grand_total,
      paymentStatus,
      amountPaid,
      remainingBalance
    };
  });
}

export function getInvoiceById(id: number): Invoice | undefined {
  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id) as any;
  if (!invoice) return undefined;
  
  const items = db.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(id) as any[];
  
  // Decrypt invoice data
  const decryptedInvoice = decryptInvoiceData(invoice);
  
  // Get payment info
  const payment = getInvoicePayment(id);
  const amountPaid = payment?.amountPaid || 0;
  const remainingBalance = invoice.grand_total - amountPaid;
  const paymentStatus = calculatePaymentStatus(amountPaid, invoice.grand_total);
  
  return {
    id: invoice.id.toString(),
    invoiceNumber: invoice.invoice_number,
    customerName: decryptedInvoice.customer_name,
    customerAddress: decryptedInvoice.customer_address,
    phone: decryptedInvoice.customer_phone,
    pnr: invoice.pnr,
    refNo: invoice.ref_no,
    currency: invoice.currency,
    date: invoice.invoice_date,
    items: items.map(item => ({
      serviceId: item.service_id,
      serviceName: item.service_name,
      serviceDescription: item.service_description,
      purchasePrice: item.purchase_price || 0,
      price: item.price
    })),
    subTotal: invoice.sub_total,
    discount: invoice.discount,
    grandTotal: invoice.grand_total,
    paymentStatus,
    amountPaid,
    remainingBalance
  };
}

export function deleteInvoice(id: number): boolean {
  try {
    db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
    return true;
  } catch (error) {
    console.error('Invoice deletion failed:', error);
    return false;
  }
}

// ---------- Invoice Payment Functions ---------- //

export function addOrUpdateInvoicePayment(invoiceId: number, paymentData: {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  notes?: string;
}): boolean {
  try {
    // Validate amount - cap at grand total
    const invoice = db.prepare("SELECT grand_total FROM invoices WHERE id = ?").get(invoiceId) as any;
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    // Cap amount at grand total
    const amountPaid = Math.min(paymentData.amountPaid, invoice.grand_total);
    
    // Check if payment exists
    const existingPayment = db.prepare("SELECT id FROM invoice_payments WHERE invoice_id = ?").get(invoiceId) as any;
    
    if (existingPayment) {
      // Update existing payment
      db.prepare(`
        UPDATE invoice_payments 
        SET amount_paid = ?, payment_date = ?, payment_method = ?, notes = ?
        WHERE invoice_id = ?
      `).run(
        amountPaid,
        paymentData.paymentDate,
        paymentData.paymentMethod,
        paymentData.notes || null,
        invoiceId
      );
    } else {
      // Insert new payment
      db.prepare(`
        INSERT INTO invoice_payments (invoice_id, amount_paid, payment_date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        amountPaid,
        paymentData.paymentDate,
        paymentData.paymentMethod,
        paymentData.notes || null
      );
    }
    
    return true;
  } catch (error) {
    console.error('Payment save failed:', error);
    throw error;
  }
}

export function getInvoicePaymentData(invoiceId: number): InvoicePayment | null {
  const payment = db.prepare(`
    SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(invoiceId) as any;
  
  if (!payment) return null;
  
  return {
    id: payment.id,
    invoice_id: payment.invoice_id,
    amount_paid: payment.amount_paid,
    payment_date: payment.payment_date,
    payment_method: payment.payment_method,
    notes: payment.notes,
    created_at: payment.created_at
  };
}

// ---------- Service Functions ---------- //

export function addService(service: Omit<Service, 'id'>): number {
  // Validate service data
  const validation = validateService(service);
  if (!validation.isValid) {
    throw new Error(`Service validation failed: ${validation.errors.join(', ')}`);
  }
  
  const sanitizedService = validation.sanitizedData!;
  const encryptedService = encryptServiceData(sanitizedService);
  const stmt = db.prepare(`
    INSERT INTO services (name, description)
    VALUES (?, ?)
  `);
  const result = stmt.run(encryptedService.name, encryptedService.description);
  return result.lastInsertRowid as number;
}

export function updateService(id: number, service: Partial<Omit<Service, 'id'>>): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE services SET name = COALESCE(?, name), description = COALESCE(?, description)
      WHERE id = ?
    `);
    stmt.run(service.name, service.description, id);
    return true;
  } catch (error) {
    console.error('Service update failed:', error);
    return false;
  }
}

export function deleteService(id: number): boolean {
  try {
    db.prepare("DELETE FROM services WHERE id = ?").run(id);
    return true;
  } catch (error) {
    console.error('Service deletion failed:', error);
    return false;
  }
}

// ---------- Currency Functions ---------- //

export function addCurrency(currency: Omit<Currency, 'id'>): boolean {
  try {
    // Validate currency data
    const validation = validateCurrency(currency);
    if (!validation.isValid) {
      throw new Error(`Currency validation failed: ${validation.errors.join(', ')}`);
    }
    
    const sanitizedCurrency = validation.sanitizedData!;
    const stmt = db.prepare(`
      INSERT INTO currencies (code, name, symbol, exchange_rate)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(sanitizedCurrency.code, sanitizedCurrency.name, sanitizedCurrency.symbol, sanitizedCurrency.exchange_rate);
    return true;
  } catch (error) {
    console.error('Currency addition failed:', error);
    return false;
  }
}

export function updateCurrency(code: string, currency: Partial<Omit<Currency, 'id'>>): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE currencies SET name = COALESCE(?, name), symbol = COALESCE(?, symbol), exchange_rate = COALESCE(?, exchange_rate)
      WHERE code = ?
    `);
    stmt.run(currency.name, currency.symbol, currency.exchange_rate, code);
    return true;
  } catch (error) {
    console.error('Currency update failed:', error);
    return false;
  }
}

export function deleteCurrency(code: string): boolean {
  try {
    db.prepare("DELETE FROM currencies WHERE code = ?").run(code);
    return true;
  } catch (error) {
    console.error('Currency deletion failed:', error);
    return false;
  }
}

// ---------- Export Database Functions ---------- //
export const database = {
  addCustomer,
  getAllCustomers,
  addBooking,
  getBookingsByCustomer,
  addPayment,
  getPaymentsByBooking,
  
  // Services
  getServices: () => {
    const services = db.prepare("SELECT * FROM services ORDER BY name").all() as Service[];
    return services.map(service => decryptServiceData(service));
  },
  getServiceById: (id: number) => {
    const service = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as Service | undefined;
    return service ? decryptServiceData(service) : undefined;
  },
  addService,
  updateService,
  deleteService,
  
  // Currencies
  getCurrencies: () => db.prepare("SELECT * FROM currencies ORDER BY code").all() as Currency[],
  getCurrencyByCode: (code: string) => db.prepare("SELECT * FROM currencies WHERE code = ?").get(code) as Currency | undefined,
  addCurrency,
  updateCurrency,
  deleteCurrency,
  
  // Invoices
  createInvoice,
  getAllInvoices,
  getInvoicesByCustomer,
  getInvoiceById,
  deleteInvoice
};

export type CustomerStats = {
  total: number;
  new: number;
};
