import * as XLSX from 'xlsx';
import { db, Invoice, Customer, getAllInvoices, customerDB, createInvoice } from './database.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// Maximum rows per sheet (Excel limit is 1,048,576, but we'll use 100,000 for better performance)
const MAX_ROWS_PER_SHEET = 100000;

export interface ExportOptions {
  fromDate?: string;
  toDate?: string;
  exportAll: boolean;
  exportFormat: 'single' | 'separate';
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  filePaths?: string[];
  message?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  importedInvoices: number;
  importedCustomers: number;
  errors: string[];
  message?: string;
}

// Export invoices to Excel
export function exportInvoicesToExcel(options: ExportOptions): ExportResult {
  try {
    let invoices: Invoice[] = [];
    
    if (options.exportAll) {
      invoices = getAllInvoices();
    } else if (options.fromDate && options.toDate) {
      const allInvoices = getAllInvoices();
      invoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.date);
        const fromDate = new Date(options.fromDate!);
        const toDate = new Date(options.toDate!);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        return invDate >= fromDate && invDate <= toDate;
      });
    } else {
      return {
        success: false,
        error: 'Date range is required when not exporting all data'
      };
    }
    
    if (invoices.length === 0) {
      return {
        success: false,
        error: 'No invoices found for the selected criteria'
      };
    }
    
    // Prepare invoice data for Excel (one row per invoice item)
    const invoiceRows: any[] = [];
    
    invoices.forEach(invoice => {
      if (invoice.items.length === 0) {
        // Invoice with no items - still create a row
        invoiceRows.push({
          'Invoice Number': invoice.invoiceNumber,
          'Date': new Date(invoice.date).toLocaleDateString('en-GB'),
          'Customer Name': invoice.customerName,
          'Customer Address': invoice.customerAddress,
          'Phone': invoice.phone,
          'Currency': invoice.currency,
          'Ref No': invoice.refNo || '',
          'Service Name': '',
          'Service Description': '',
          'Purchase Price': 0,
          'Selling Price': 0,
          'Subtotal': invoice.subTotal,
          'Discount': invoice.discount,
          'Grand Total': invoice.grandTotal,
          'Payment Status': invoice.paymentStatus || 'unpaid',
          'Amount Paid': invoice.amountPaid || 0,
          'Remaining Balance': invoice.remainingBalance || invoice.grandTotal
        });
      } else {
        invoice.items.forEach((item, index) => {
          invoiceRows.push({
            'Invoice Number': invoice.invoiceNumber,
            'Date': new Date(invoice.date).toLocaleDateString('en-GB'),
            'Customer Name': invoice.customerName,
            'Customer Address': invoice.customerAddress,
            'Phone': invoice.phone,
            'Currency': invoice.currency,
            'Ref No': invoice.refNo || '',
            'Service Name': item.serviceName,
            'Service Description': item.serviceDescription || '',
            'Purchase Price': item.purchasePrice || 0,
            'Selling Price': item.price,
            'Subtotal': index === 0 ? invoice.subTotal : '', // Only show subtotal on first item
            'Discount': index === 0 ? invoice.discount : '', // Only show discount on first item
            'Grand Total': index === 0 ? invoice.grandTotal : '', // Only show grand total on first item
            'Payment Status': index === 0 ? (invoice.paymentStatus || 'unpaid') : '',
            'Amount Paid': index === 0 ? (invoice.amountPaid || 0) : '',
            'Remaining Balance': index === 0 ? (invoice.remainingBalance || invoice.grandTotal) : ''
          });
        });
      }
    });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Split data into multiple sheets if needed
    let sheetIndex = 1;
    let startIndex = 0;
    
    while (startIndex < invoiceRows.length) {
      const endIndex = Math.min(startIndex + MAX_ROWS_PER_SHEET, invoiceRows.length);
      const sheetData = invoiceRows.slice(startIndex, endIndex);
      
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Invoice Number
        { wch: 12 }, // Date
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Address
        { wch: 15 }, // Phone
        { wch: 8 },  // Currency
        { wch: 15 }, // Ref No
        { wch: 25 }, // Service Name
        { wch: 30 }, // Service Description
        { wch: 15 }, // Purchase Price
        { wch: 15 }, // Selling Price
        { wch: 12 }, // Subtotal
        { wch: 12 }, // Discount
        { wch: 15 }, // Grand Total
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Amount Paid
        { wch: 18 }  // Remaining Balance
      ];
      worksheet['!cols'] = columnWidths;
      
      const sheetName = invoiceRows.length > MAX_ROWS_PER_SHEET 
        ? `Invoices_${sheetIndex}` 
        : 'Invoices';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      startIndex = endIndex;
      sheetIndex++;
    }
    
    // Save file
    const downloadsPath = path.join(app.getPath('home'), 'Downloads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `Invoices_Export_${timestamp}.xlsx`;
    const filePath = path.join(downloadsPath, fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    return {
      success: true,
      filePath,
      message: `Exported ${invoices.length} invoices to ${fileName}\nSaved to: ${downloadsPath}`
    };
  } catch (error) {
    console.error('Export invoices error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export customers to Excel
export function exportCustomersToExcel(): ExportResult {
  try {
    const customers = customerDB.getCustomers(10000, 0); // Get up to 10,000 customers
    
    if (customers.length === 0) {
      return {
        success: false,
        error: 'No customers found'
      };
    }
    
    // Prepare customer data for Excel
    const customerRows = customers.map(customer => ({
      'Name': customer.name,
      'Phone': customer.phone || '',
      'Email': customer.email || '',
      'Address': customer.address || '',
      'Created Date': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : ''
    }));
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Split data into multiple sheets if needed
    let sheetIndex = 1;
    let startIndex = 0;
    
    while (startIndex < customerRows.length) {
      const endIndex = Math.min(startIndex + MAX_ROWS_PER_SHEET, customerRows.length);
      const sheetData = customerRows.slice(startIndex, endIndex);
      
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 25 }, // Name
        { wch: 15 }, // Phone
        { wch: 30 }, // Email
        { wch: 40 }, // Address
        { wch: 12 }  // Created Date
      ];
      worksheet['!cols'] = columnWidths;
      
      const sheetName = customerRows.length > MAX_ROWS_PER_SHEET 
        ? `Customers_${sheetIndex}` 
        : 'Customers';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      startIndex = endIndex;
      sheetIndex++;
    }
    
    // Save file
    const downloadsPath = path.join(app.getPath('home'), 'Downloads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `Customers_Export_${timestamp}.xlsx`;
    const filePath = path.join(downloadsPath, fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    return {
      success: true,
      filePath,
      message: `Exported ${customers.length} customers to ${fileName}\nSaved to: ${downloadsPath}`
    };
  } catch (error) {
    console.error('Export customers error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export both invoices and customers to single Excel file
export function exportAllToSingleExcel(options: ExportOptions): ExportResult {
  try {
    // Get invoice data
    let invoices: Invoice[] = [];
    if (options.exportAll) {
      invoices = getAllInvoices();
    } else if (options.fromDate && options.toDate) {
      const allInvoices = getAllInvoices();
      invoices = allInvoices.filter(inv => {
        const invDate = new Date(inv.date);
        const fromDate = new Date(options.fromDate!);
        const toDate = new Date(options.toDate!);
        toDate.setHours(23, 59, 59, 999);
        return invDate >= fromDate && invDate <= toDate;
      });
    }
    
    // Get customer data
    const customers = customerDB.getCustomers(10000, 0);
    
    if (invoices.length === 0 && customers.length === 0) {
      return {
        success: false,
        error: 'No data to export'
      };
    }
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare and add invoice sheets
    if (invoices.length > 0) {
      const invoiceRows: any[] = [];
      
      invoices.forEach(invoice => {
        if (invoice.items.length === 0) {
          invoiceRows.push({
            'Invoice Number': invoice.invoiceNumber,
            'Date': new Date(invoice.date).toLocaleDateString('en-GB'),
            'Customer Name': invoice.customerName,
            'Customer Address': invoice.customerAddress,
            'Phone': invoice.phone,
            'Currency': invoice.currency,
            'Ref No': invoice.refNo || '',
            'Service Name': '',
            'Service Description': '',
            'Purchase Price': 0,
            'Selling Price': 0,
            'Subtotal': invoice.subTotal,
            'Discount': invoice.discount,
            'Grand Total': invoice.grandTotal,
            'Payment Status': invoice.paymentStatus || 'unpaid',
            'Amount Paid': invoice.amountPaid || 0,
            'Remaining Balance': invoice.remainingBalance || invoice.grandTotal
          });
        } else {
          invoice.items.forEach((item, index) => {
            invoiceRows.push({
              'Invoice Number': invoice.invoiceNumber,
              'Date': new Date(invoice.date).toLocaleDateString('en-GB'),
              'Customer Name': invoice.customerName,
              'Customer Address': invoice.customerAddress,
              'Phone': invoice.phone,
              'Currency': invoice.currency,
              'Ref No': invoice.refNo || '',
              'Service Name': item.serviceName,
              'Service Description': item.serviceDescription || '',
              'Purchase Price': item.purchasePrice || 0,
              'Selling Price': item.price,
              'Subtotal': index === 0 ? invoice.subTotal : '',
              'Discount': index === 0 ? invoice.discount : '',
              'Grand Total': index === 0 ? invoice.grandTotal : '',
              'Payment Status': index === 0 ? (invoice.paymentStatus || 'unpaid') : '',
              'Amount Paid': index === 0 ? (invoice.amountPaid || 0) : '',
              'Remaining Balance': index === 0 ? (invoice.remainingBalance || invoice.grandTotal) : ''
            });
          });
        }
      });
      
      // Split invoices into multiple sheets if needed
      let sheetIndex = 1;
      let startIndex = 0;
      
      while (startIndex < invoiceRows.length) {
        const endIndex = Math.min(startIndex + MAX_ROWS_PER_SHEET, invoiceRows.length);
        const sheetData = invoiceRows.slice(startIndex, endIndex);
        
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        
        // Set column widths
        const columnWidths = [
          { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
          { wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
          { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
          { wch: 15 }, { wch: 18 }
        ];
        worksheet['!cols'] = columnWidths;
        
        const sheetName = invoiceRows.length > MAX_ROWS_PER_SHEET 
          ? `Invoices_${sheetIndex}` 
          : 'Invoices';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        startIndex = endIndex;
        sheetIndex++;
      }
    }
    
    // Prepare and add customer sheets
    if (customers.length > 0) {
      const customerRows = customers.map(customer => ({
        'Name': customer.name,
        'Phone': customer.phone || '',
        'Email': customer.email || '',
        'Address': customer.address || '',
        'Created Date': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-GB') : ''
      }));
      
      // Split customers into multiple sheets if needed
      let sheetIndex = 1;
      let startIndex = 0;
      
      while (startIndex < customerRows.length) {
        const endIndex = Math.min(startIndex + MAX_ROWS_PER_SHEET, customerRows.length);
        const sheetData = customerRows.slice(startIndex, endIndex);
        
        const worksheet = XLSX.utils.json_to_sheet(sheetData);
        
        // Set column widths
        const columnWidths = [
          { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 40 }, { wch: 12 }
        ];
        worksheet['!cols'] = columnWidths;
        
        const sheetName = customerRows.length > MAX_ROWS_PER_SHEET 
          ? `Customers_${sheetIndex}` 
          : 'Customers';
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        startIndex = endIndex;
        sheetIndex++;
      }
    }
    
    // Save combined file
    const downloadsPath = path.join(app.getPath('home'), 'Downloads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `Data_Export_${timestamp}.xlsx`;
    const filePath = path.join(downloadsPath, fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    const invoiceCount = invoices.length;
    const customerCount = customers.length;
    
    return {
      success: true,
      filePath,
      message: `Exported ${invoiceCount} invoices and ${customerCount} customers to ${fileName}\nSaved to: ${downloadsPath}`
    };
  } catch (error) {
    console.error('Export all error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Import data from Excel file
export function importFromExcel(filePath: string): ImportResult {
  const errors: string[] = [];
  let importedInvoices = 0;
  let importedCustomers = 0;
  
  try {
    // Read file using fs and parse with XLSX.read instead of XLSX.readFile
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    
    // Detect file type based on filename or sheet names
    const fileName = path.basename(filePath).toLowerCase();
    const isInvoiceFile = fileName.includes('invoice') || fileName.includes('invoices');
    const isCustomerFile = fileName.includes('customer') || fileName.includes('customers');
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      // Determine if this sheet contains invoices or customers
      const isInvoiceSheet = sheetName.toLowerCase().includes('invoice') || sheetName.toLowerCase().includes('invoices');
      const isCustomerSheet = sheetName.toLowerCase().includes('customer') || sheetName.toLowerCase().includes('customers');
      
      // Process based on file name first, then sheet name
      // If file name clearly indicates type, use that; otherwise check sheet name
      let shouldProcessInvoices = false;
      let shouldProcessCustomers = false;
      
      if (isInvoiceFile && !isCustomerFile) {
        // File name indicates invoices only
        shouldProcessInvoices = isInvoiceSheet || !isCustomerSheet;
      } else if (isCustomerFile && !isInvoiceFile) {
        // File name indicates customers only
        shouldProcessCustomers = isCustomerSheet || !isInvoiceSheet;
      } else {
        // File name is ambiguous or contains both - use sheet name
        shouldProcessInvoices = isInvoiceSheet;
        shouldProcessCustomers = isCustomerSheet;
      }
      
      if (shouldProcessInvoices) {
        // Process invoices
        const invoiceMap = new Map<string, any>();
        
        for (const row of data as any[]) {
          const invoiceNumber = row['Invoice Number'] || row['invoice_number'] || row['Invoice No'];
          if (!invoiceNumber) continue;
          
          if (!invoiceMap.has(invoiceNumber)) {
            invoiceMap.set(invoiceNumber, {
              invoiceNumber: String(invoiceNumber),
              date: parseDate(row['Date']),
              customerName: row['Customer Name'] || row['customer_name'] || '',
              customerAddress: row['Customer Address'] || row['customer_address'] || '',
              phone: row['Phone'] || row['phone'] || '',
              currency: row['Currency'] || row['currency'] || 'USD',
              refNo: row['Ref No'] || row['ref_no'] || row['Ref No.'] || '',
              items: [],
              subTotal: 0,
              discount: 0,
              grandTotal: 0
            });
          }
          
          const invoice = invoiceMap.get(invoiceNumber)!;
          
          // Add item if service name exists
          if (row['Service Name'] || row['service_name']) {
            invoice.items.push({
              serviceName: row['Service Name'] || row['service_name'] || '',
              serviceDescription: row['Service Description'] || row['service_description'] || '',
              purchasePrice: parseFloat(row['Purchase Price'] || row['purchase_price'] || 0),
              price: parseFloat(row['Selling Price'] || row['Selling Price'] || row['price'] || 0)
            });
          }
          
          // Update totals from first row
          if (row['Subtotal'] || row['subtotal']) {
            invoice.subTotal = parseFloat(row['Subtotal'] || row['subtotal'] || 0);
          }
          if (row['Discount'] || row['discount']) {
            invoice.discount = parseFloat(row['Discount'] || row['discount'] || 0);
          }
          if (row['Grand Total'] || row['grand_total']) {
            invoice.grandTotal = parseFloat(row['Grand Total'] || row['grand_total'] || 0);
          }
        }
        
        // Import invoices
        for (const invoice of invoiceMap.values()) {
          try {
            // Check if invoice already exists
            const existing = db.prepare("SELECT id FROM invoices WHERE invoice_number = ?").get(invoice.invoiceNumber);
            if (existing) {
              errors.push(`Invoice ${invoice.invoiceNumber} already exists, skipped`);
              continue;
            }
            
            // Create invoice
            const result = createInvoice({
              customerName: invoice.customerName,
              customerAddress: invoice.customerAddress,
              phone: invoice.phone,
              currency: invoice.currency,
              invoiceDate: invoice.date,
              items: invoice.items,
              discount: invoice.discount,
              refNo: invoice.refNo
            });
            
            if (result.success) {
              importedInvoices++;
            } else {
              errors.push(`Failed to import invoice ${invoice.invoiceNumber}: ${result.error}`);
            }
          } catch (error) {
            errors.push(`Error importing invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } else if (shouldProcessCustomers || (isCustomerSheet && !shouldProcessInvoices)) {
        // Process customers
        for (const row of data as any[]) {
          const name = row['Name'] || row['name'];
          if (!name || !name.trim()) {
            continue; // Skip rows without a name
          }
          
          try {
            const phone = String(row['Phone'] || row['phone'] || '').trim();
            const email = String(row['Email'] || row['email'] || '').trim();
            const address = String(row['Address'] || row['address'] || '').trim();
            
            // Check if customer already exists (by name and phone)
            const existing = db.prepare("SELECT id FROM customers WHERE name = ? AND phone = ?").get(name.trim(), phone);
            if (existing) {
              errors.push(`Customer ${name} (${phone}) already exists, skipped`);
              continue;
            }
            
            // Create customer with validation
            try {
              customerDB.saveCustomer({
                name: name.trim(),
                phone: phone,
                email: email,
                address: address
              });
              
              importedCustomers++;
            } catch (validationError) {
              const errorMsg = validationError instanceof Error ? validationError.message : 'Unknown validation error';
              errors.push(`Error importing customer "${name}": ${errorMsg}`);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Error importing customer "${name}": ${errorMsg}`);
          }
        }
      }
    }
    
    return {
      success: true,
      importedInvoices,
      importedCustomers,
      errors,
      message: `Imported ${importedInvoices} invoices and ${importedCustomers} customers`
    };
  } catch (error) {
    return {
      success: false,
      importedInvoices,
      importedCustomers,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error'],
      message: 'Import failed'
    };
  }
}

// Helper function to parse dates
function parseDate(dateStr: any): string {
  if (!dateStr) return new Date().toISOString();
  
  if (typeof dateStr === 'string') {
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }
  
  return new Date().toISOString();
}

