import { app, BrowserWindow } from 'electron';
import { createMenu } from './menu.js';
import { createTray } from './tray.js';
import { ipcMainHandle, ipcMainOn, isDev } from './util.js';
import { getPreloadPath, getUIPath } from './pathResolver.js';
import { Invoice, database, customerDB, reportDB, settingsDB, db, Currency, Service, createInvoice, updateInvoice, getAllInvoices, getInvoicesByCustomer, getInvoiceById, deleteInvoice, addService, updateService, deleteService, addCurrency, updateCurrency, deleteCurrency } from './database.js';

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      sandbox: true,
      webSecurity: false, // Allow PDF generation and base64 images
      allowRunningInsecureContent: true
    },
    show: false
  });

  // Set secure CSP headers that allow base64 images
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    
    // Set secure CSP that allows base64 images while maintaining security
    responseHeaders['Content-Security-Policy'] = [
      "default-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "img-src 'self' data: blob:; " +
      "font-src 'self' data:; " +
      "connect-src 'self' ws: wss:;"
    ];
    
    callback({ responseHeaders });
  });

  // Load frontend
  mainWindow.loadURL(
    isDev() 
      ? 'http://localhost:5123' 
      : `file://${getUIPath()}`
  );

// Add this after creating BrowserWindow
mainWindow.webContents.on('did-finish-load', () => {
  // Frontend loaded - verifying React mount
});

createTray(mainWindow);
createMenu(mainWindow);

  // Database IPC Handlers
  //customerDB handlers
  ipcMainHandle('add-customer', (payload) => database.addCustomer(payload.customer));
  // Booking IPC Handlers
  ipcMainHandle('get-bookings', (payload) => database.getBookingsByCustomer(payload.customerId));
  ipcMainHandle('add-booking', (payload) => database.addBooking(payload.booking));
  // Payment IPC Handlers
  ipcMainHandle('get-payments', (payload) => database.getPaymentsByBooking(payload.bookingId));
  ipcMainHandle('add-payment', (payload) => database.addPayment(payload.payment));
  // Invoice IPC Handlers
  ipcMainHandle('create-invoice', async (payload) => {
    return createInvoice(payload);
  });

  ipcMainHandle('update-invoice', async (payload) => {
    return updateInvoice(payload.id, payload.invoiceData);
  });

  ipcMainHandle('get-invoices', async () => {
    return getAllInvoices();
  });

ipcMainHandle('get-invoices-by-customer', async (payload) => {
  return getInvoicesByCustomer(payload.customerName, payload.customerPhone);
});

// Analytics IPC Handlers
ipcMainHandle('get-monthly-revenue', async (payload) => {
  return reportDB.getMonthlyRevenue(payload.year);
});

ipcMainHandle('get-yearly-revenue', async () => {
  return reportDB.getYearlyRevenue();
});

ipcMainHandle('get-revenue-comparison', async (payload) => {
  return reportDB.getRevenueComparison(payload.period);
});

ipcMainHandle('get-service-trends', async (payload) => {
  return reportDB.getServiceTrends(payload.serviceName, payload.days);
});

ipcMainHandle('get-service-performance', async () => {
  return reportDB.getServicePerformance();
});

ipcMainHandle('get-customer-growth', async (payload) => {
  return reportDB.getCustomerGrowth(payload.period);
});

ipcMainHandle('get-top-customers', async (payload) => {
  return reportDB.getTopCustomers(payload.limit);
});

ipcMainHandle('get-discount-analysis', async () => {
  return reportDB.getDiscountAnalysis();
});

ipcMainHandle('get-currency-performance', async () => {
  return reportDB.getCurrencyPerformance();
});

ipcMainHandle('get-daily-performance', async (payload) => {
  return reportDB.getDailyPerformance(payload.days);
});

ipcMainHandle('get-weekly-performance', async (payload) => {
  return reportDB.getWeeklyPerformance(payload.weeks);
});

ipcMainHandle('get-business-kpis', async () => {
  return reportDB.getBusinessKPIs();
});

  ipcMainHandle('get-invoice', async (payload) => {
    return getInvoiceById(payload.id);
  });

  ipcMainHandle('delete-invoice', async (payload) => {
    return deleteInvoice(payload.id);
  });
ipcMainHandle('print-invoice', async (payload) => {
  const win = new BrowserWindow({ show: false });
  
  await win.loadURL(`data:text/html,${generateHTML(payload.invoice)}`);
  
  win.webContents.on('did-finish-load', () => {
    win.webContents.print({
      silent: true,
      printBackground: true
    }, (success) => {
      if (!success) console.error('Print failed');
      win.close();
    });
  });
});

ipcMainHandle('generate-pdf', async (payload) => {
  try {
    // PDF generation requested
    const { htmlContent, filename } = payload;
    
    // Create a hidden window for PDF generation
    const win = new BrowserWindow({ 
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    
    // Created hidden window, loading HTML content
    
    // Load the HTML content
    await win.loadURL(`data:text/html,${encodeURIComponent(htmlContent)}`);
    
    // Wait for content to load
    await new Promise<void>(resolve => {
      win.webContents.once('did-finish-load', () => {
        // HTML content loaded, generating PDF
        resolve();
      });
    });
    
    // Generate PDF
    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        marginType: 'printableArea'
      }
    });
    
    // PDF generated, saving to Downloads folder
    
    // Save to Downloads folder
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    const pdfPath = path.join(downloadsPath, `${filename}.pdf`);
    
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // PDF saved successfully
    
    // Close the window
    win.close();
    
    return { 
      success: true, 
      filePath: pdfPath,
      message: `PDF saved to: ${pdfPath}`
    };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

ipcMainHandle('save-customer', (payload) => 
  customerDB.saveCustomer(payload.customer)
);

ipcMainHandle('get-customers', (payload) => 
  customerDB.getCustomers(payload?.limit || 100, payload?.offset || 0)
);

ipcMainHandle('search-customers', (payload) => 
  customerDB.searchCustomers(payload.query)
);

ipcMainHandle('delete-customer', (payload) => {
  // The payload structure is { customerId: { customerId: 8 } }
  // So we need to extract the nested customerId
  const customerId = (payload as any).customerId.customerId;
  return customerDB.deleteCustomer(customerId);
});

ipcMainHandle('get-daily-sales', (payload) => 
  reportDB.getDailySales(payload.date)
);

ipcMainHandle('get-top-services', (payload) => 
  reportDB.getTopServices(payload.limit)
);

ipcMainHandle('get-customer-stats', () => 
  reportDB.getCustomerStats()
);

ipcMainHandle('get-settings', () => settingsDB.getSettings());

ipcMainHandle('update-settings', (payload) => 
  settingsDB.updateSettings(payload.settings)
);

ipcMainHandle('get-currencies', () => 
  database.getCurrencies()
);

ipcMainHandle('add-currency', (payload) => {
  return addCurrency(payload.currency);
});

ipcMainHandle('update-currency', (payload) => {
  return updateCurrency(payload.code, payload.currency);
});

ipcMainHandle('delete-currency', (payload) => {
  return deleteCurrency(payload.code);
});

ipcMainHandle('get-services', () => 
  database.getServices()
);

ipcMainHandle('add-service', (payload) => {
  return addService(payload.service);
});

ipcMainHandle('update-service', (payload) => {
  return updateService(payload.id, payload.service);
});

ipcMainHandle('delete-service', (payload) => {
  return deleteService(payload.id);
});

// Navigation Handler
ipcMainOn('navigate', (payload) => {
  mainWindow.webContents.send('navigate', payload.tab);
});

// Window Control Handler (fixed)
  ipcMainOn('window-control', (payload) => {
    switch (payload.action) {
      case 'minimize': 
        mainWindow.minimize();
        break;
      case 'maximize':
        mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    if (isDev()) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });
});

function generateHTML(invoice: Invoice): string {
  // URL encode the HTML content
  return encodeURIComponent(`<!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.id}</title>
      <style>
        * {
          font-family: Cambria, serif;
        }
        body { 
          margin: 0;
          padding: 20px; 
          background: white;
          line-height: 1.5;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .separator-line {
          border-top: 0.5px solid #999;
          margin: 15px 0;
        }
        .logo-section {
          margin-bottom: 15px;
        }
        .logo {
          max-width: 40%;
          height: auto;
          object-fit: contain;
        }
        .header-section {
          margin-bottom: 15px;
          line-height: 1.2;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .header-row .customer-label {
          font-size: 14px;
          color: #666;
        }
        .invoice-info-right {
          text-align: right;
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
          line-height: 1.2;
        }
        .invoice-info-label {
          font-weight: normal;
          color: #666;
          margin-right: 5px;
          font-size: 14px;
        }
        .invoice-number-value,
        .invoice-date-value,
        .invoice-ref-value {
          font-size: 14px;
          color: #000;
        }
        .customer-detail-row {
          font-size: 14px;
          line-height: 1.2;
          margin: 0;
          padding: 0;
        }
        .header-row {
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .header-row:last-child {
          margin-bottom: 0;
        }
        .customer-label {
          font-weight: normal;
          color: #666;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
        }
        th { 
          padding: 10px 8px;
          text-align: left; 
          font-weight: normal;
          font-size: 14px;
          color: #666;
          border-bottom: 0.5px solid #999;
        }
        th:last-child {
          text-align: right;
        }
        td { 
          padding: 8px; 
          font-size: 14px;
          border-bottom: 0.5px solid #ddd; 
        }
        tr:last-child td {
          border-bottom: none;
        }
        .price-cell {
          text-align: right;
        }
        .totals-section {
          margin: 15px 0 30px 0;
          text-align: right;
        }
        .total-row {
          margin-bottom: 5px;
          font-size: 14px;
        }
        .total-label {
          display: inline-block;
          min-width: 120px;
          text-align: right;
          margin-right: 10px;
          color: #666;
        }
        .total-value {
          display: inline-block;
          min-width: 100px;
          text-align: right;
        }
        .grand-total-row {
          margin-top: 10px;
          font-weight: bold;
        }
        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin: 15px 0;
        }
        .contact-section {
          margin: 15px 0;
        }
        .contact-title {
          font-size: 14px;
          font-weight: normal;
          margin-bottom: 4px;
          color: #666;
        }
        
        .contact-info {
          font-size: 14px;
          line-height: 1.2;
        }
        
        .contact-info div {
          margin-bottom: 4px;
        }
        .bottom-section {
          margin-top: 50px;
          width: 100%;
        }
        .thanks-message {
          text-align: center;
          font-size: 14px;
          font-weight: normal;
          color: #000;
          margin: 1px 0;
          padding: 1px 0;
        }
        .signatory-footer {
          text-align: right;
          margin: 15px 0 80px 0 ;
        }
        .signatory-right {
          font-size: 14px;
          color: #000;
        }
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .signature-label {
          font-size: 14px;
          font-weight: normal;
          color: #666;
        }
        .address-footer {
          text-align: center;
          font-size: 12px;
          margin-top: 8px;
          line-height: 1.4;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="logo-section">
          <h2>ESSAR TRAVEL HUB</h2>
        </div>
        
        <div class="separator-line"></div>
        
        <div class="header-section">
            <div class="header-row">
              <div class="customer-label">Customer details</div>
              <div class="invoice-info-right">
                <span class="invoice-info-label">Invoice Details</span></div>
            </div>
            <div class="header-row">
              <div class="customer-detail-row"><span class="customer-label">Name:</span> ${invoice.customerName}</div>
              <div class="invoice-info-right">
                <span class="invoice-info-label">Invoice No:</span>
                <span class="invoice-number-value">${invoice.invoiceNumber}</span>
              </div>
            </div>
            <div class="header-row">
              <div class="customer-detail-row"><span class="customer-label">Phone No:</span> ${invoice.phone}</div>
              <div class="invoice-info-right">
                <span class="invoice-info-label">Date:</span>
                <span class="invoice-date-value">${new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              </div>
            </div>
            <div class="header-row">
              <div class="customer-detail-row"><span class="customer-label">Address:</span> ${invoice.customerAddress}</div>
              <div class="invoice-info-right">
              <div class="invoice-info-right">
                ${invoice.refNo ? `<span class="invoice-info-label">Ref No:</span>
                <span class="invoice-ref-value">${invoice.refNo}</span>` : ''}
              </div>
            </div>
          </div>
        
        <div class="separator-line"></div>
        
        <table>
          <thead>
            <tr>
              <th>Sl. No</th>
              <th>Service</th>
              <th>Description</th>
              <th class="price-cell">Price</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.serviceName}</td>
                <td>${item.serviceDescription || '-'}</td>
                <td class="price-cell">${item.price.toFixed(2)} ${invoice.currency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="separator-line"></div>
        
        <div class="totals-section">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span class="total-value">${invoice.subTotal.toFixed(2)} ${invoice.currency}</span>
          </div>
          ${invoice.discount && invoice.discount > 0 ? `
            <div class="total-row">
              <span class="total-label">Discount:</span>
              <span class="total-value">-${invoice.discount.toFixed(2)} ${invoice.currency}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total-row">
            <span class="total-label">Grand Total:</span>
            <span class="total-value">${invoice.grandTotal.toFixed(2)} ${invoice.currency}</span>
          </div>
        </div>
        
        <div class="separator-line"></div>
        
        <div class="contact-section">
          <div class="contact-title">Contact Details</div>
          <div class="contact-info">
            <div>A. Samsudheen</div>
            <div>+91 9043938600</div>
            <div>essartravelhub@gmail.com</div>
          </div>
        </div>
        
        <div class="bottom-section">
          <div class="separator-line"></div>
          <div class="thanks-message">
            THANKS FOR DOING BUSINESS WITH US
          </div>
          <div class="separator-line"></div>
          
          <div class="signatory-footer">
            <div class="signatory-right">For ESSAR Travel Hub</div>
          </div>
          

          <div class="signature-row">
            <div class="signature-label">Customer Signature</div>
            <div class="signature-label">Authorised Signature</div>
          </div>
          
          <div class="separator-line"></div>
          <div class="address-footer">
            Essar Style Walk and Travel Hub, 1202, B.B. Street, Town Hall, Coimbatore, Tamil Nadu. India. Pin-641001.
          </div>
        </div>
      </div>
    </body>
    </html>`);
}

async function getServicePrice(serviceId: number): Promise<number> {
  const service = await database.getServiceById(serviceId); // Implement this in your database.ts
  return 0; // Services no longer have base_price, price is set per invoice
}