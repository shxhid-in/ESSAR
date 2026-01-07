import { app, BrowserWindow } from 'electron';
import { createMenu } from './menu.js';
import { createTray } from './tray.js';
import { ipcMainHandle, ipcMainOn, isDev } from './util.js';
import { getPreloadPath, getUIPath, getAssetPath } from './pathResolver.js';
import { Invoice, database, customerDB, reportDB, settingsDB, db, Currency, Service, createInvoice, updateInvoice, getAllInvoices, getInvoicesByCustomer, getInvoiceById, deleteInvoice, addService, updateService, deleteService, addCurrency, updateCurrency, deleteCurrency, addOrUpdateInvoicePayment, getInvoicePaymentData, getInvoicePaymentHistory, deleteInvoicePayment, createIncentive, getAllIncentives, getIncentiveById, updateIncentive, deleteIncentive } from './database.js';
import { exportInvoicesToExcel, exportCustomersToExcel, exportAllToSingleExcel, importFromExcel, ExportOptions } from './excelUtils.js';
import { dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Migrate existing images from old location (resources/assets/logos) to new location (userData/assets/logos)
function migrateImagesToUserData() {
  try {
    const settings = settingsDB.getSettings();
    const userDataPath = app.getPath('userData');
    const newLogosDir = path.join(userDataPath, 'assets', 'logos');
    
    // Ensure new directory exists
    if (!fs.existsSync(newLogosDir)) {
      fs.mkdirSync(newLogosDir, { recursive: true });
    }
    
    // Migrate primary logo
    if (settings.primary_logo_path && fs.existsSync(settings.primary_logo_path)) {
      const oldPath = settings.primary_logo_path;
      // Check if it's in the old location (resources/assets/logos)
      const assetPath = getAssetPath();
      const oldLogosDir = path.join(assetPath, 'logos');
      
      if (oldPath.startsWith(oldLogosDir) || oldPath.includes('resources')) {
        const fileName = path.basename(oldPath);
        const newPath = path.join(newLogosDir, fileName);
        
        // Only migrate if new path doesn't exist
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(oldPath, newPath);
          settingsDB.updateSettings({ primary_logo_path: newPath });
        }
      }
    }
    
    // Migrate secondary logo
    if (settings.secondary_logo_path && fs.existsSync(settings.secondary_logo_path)) {
      const oldPath = settings.secondary_logo_path;
      const assetPath = getAssetPath();
      const oldLogosDir = path.join(assetPath, 'logos');
      
      if (oldPath.startsWith(oldLogosDir) || oldPath.includes('resources')) {
        const fileName = path.basename(oldPath);
        const newPath = path.join(newLogosDir, fileName);
        
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(oldPath, newPath);
          settingsDB.updateSettings({ secondary_logo_path: newPath });
        }
      }
    }
    
    // Migrate seal photo
    if (settings.seal_photo_path && fs.existsSync(settings.seal_photo_path)) {
      const oldPath = settings.seal_photo_path;
      const assetPath = getAssetPath();
      const oldLogosDir = path.join(assetPath, 'logos');
      
      if (oldPath.startsWith(oldLogosDir) || oldPath.includes('resources')) {
        const fileName = path.basename(oldPath);
        const newPath = path.join(newLogosDir, fileName);
        
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(oldPath, newPath);
          settingsDB.updateSettings({ seal_photo_path: newPath });
        }
      }
    }
  } catch (error) {
    console.error('Error migrating images to user data directory:', error);
    // Don't throw - migration failure shouldn't prevent app from starting
  }
}

// Run image migration on app startup
migrateImagesToUserData();

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

// Payment IPC Handlers
ipcMainHandle('add-or-update-invoice-payment', async (payload) => {
  return addOrUpdateInvoicePayment(payload.invoiceId, payload.paymentData);
});

ipcMainHandle('get-invoice-payment', async (payload) => {
  return getInvoicePaymentData(payload.invoiceId);
});

ipcMainHandle('get-invoice-payment-history', async (payload) => {
  return getInvoicePaymentHistory(payload.invoiceId);
});

ipcMainHandle('delete-invoice-payment', async (payload) => {
  return deleteInvoicePayment(payload.paymentId);
});

ipcMainHandle('get-signature-base64', async () => {
  return getSignatureAsBase64();
});

ipcMainHandle('get-logo-base64', async () => {
  return getPNGLogoAsBase64();
});

ipcMainHandle('print-invoice', async (payload) => {
  const win = new BrowserWindow({ show: false });
  
  const htmlContent = await generateHTML(payload.invoice);
  await win.loadURL(`data:text/html,${htmlContent}`);
  
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

ipcMainHandle('update-settings', (payload) => {
  const result = settingsDB.updateSettings(payload.settings);
  return result;
});

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

// Incentive IPC Handlers
ipcMainHandle('create-incentive', async (payload) => {
  return createIncentive(payload.incentive);
});

ipcMainHandle('get-incentives', async () => {
  return getAllIncentives();
});

ipcMainHandle('get-incentive', async (payload) => {
  return getIncentiveById(payload.id);
});

ipcMainHandle('update-incentive', async (payload) => {
  return updateIncentive(payload.id, payload.incentive);
});

ipcMainHandle('delete-incentive', async (payload) => {
  return deleteIncentive(payload.id);
});

// Excel Import/Export IPC Handlers
ipcMainHandle('export-data', async (payload) => {
  const { options } = payload;
  
  if (options.exportFormat === 'single') {
    return exportAllToSingleExcel(options);
  } else {
    // Export separately
    const invoiceResult = exportInvoicesToExcel(options);
    const customerResult = exportCustomersToExcel();
    
    const messages: string[] = [];
    const errors: string[] = [];
    
    if (invoiceResult.success && invoiceResult.message) {
      messages.push(invoiceResult.message);
    } else if (invoiceResult.error && invoiceResult.error !== 'No invoices found for the selected criteria') {
      errors.push(`Invoices: ${invoiceResult.error}`);
    }
    
    if (customerResult.success && customerResult.message) {
      messages.push(customerResult.message);
    } else if (customerResult.error && customerResult.error !== 'No customers found') {
      errors.push(`Customers: ${customerResult.error}`);
    }
    
    const downloadsPath = path.join(app.getPath('home'), 'Downloads');
    
    // If we have at least one successful export, consider it a success
    const hasSuccess = invoiceResult.success || customerResult.success;
    
    let finalMessage = '';
    if (messages.length > 0) {
      finalMessage = messages.join('\n') + `\n\nFiles saved to: ${downloadsPath}`;
    }
    if (errors.length > 0) {
      finalMessage += (finalMessage ? '\n\n' : '') + 'Errors:\n' + errors.join('\n');
    }
    if (!finalMessage) {
      finalMessage = 'No data found to export';
    }
    
    return {
      success: hasSuccess,
      filePaths: [
        invoiceResult.filePath,
        customerResult.filePath
      ].filter(Boolean),
      message: finalMessage,
      error: hasSuccess ? undefined : (invoiceResult.error || customerResult.error || 'No data to export')
    };
  }
});

ipcMainHandle('import-data', async (payload: { filePath?: string; filePaths?: string[] }) => {
  try {
    // Support both single file and multiple files
    const filePaths = payload.filePaths || (payload.filePath ? [payload.filePath] : []);
    
    if (filePaths.length === 0) {
      return {
        success: false,
        importedInvoices: 0,
        importedCustomers: 0,
        errors: ['No files selected'],
        message: 'Import failed: No files selected'
      };
    }
    
    // Process all files and combine results
    let totalImportedInvoices = 0;
    let totalImportedCustomers = 0;
    const allErrors: string[] = [];
    let hasSuccess = false;
    
    for (const filePath of filePaths) {
      try {
        const result = importFromExcel(filePath);
        if (result.success) {
          hasSuccess = true;
          totalImportedInvoices += result.importedInvoices;
          totalImportedCustomers += result.importedCustomers;
        }
        if (result.errors && result.errors.length > 0) {
          allErrors.push(...result.errors);
        }
      } catch (error) {
        allErrors.push(`Error processing file ${path.basename(filePath)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      success: hasSuccess,
      importedInvoices: totalImportedInvoices,
      importedCustomers: totalImportedCustomers,
      errors: allErrors,
      message: `Imported ${totalImportedInvoices} invoices and ${totalImportedCustomers} customers from ${filePaths.length} file(s)`
    };
  } catch (error) {
    return {
      success: false,
      importedInvoices: 0,
      importedCustomers: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      message: 'Import failed'
    };
  }
});

ipcMainHandle('select-import-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Excel file(s) to import',
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  });
  
  if (result.canceled) {
    return { canceled: true, filePaths: [] };
  }
  
  return { canceled: false, filePaths: result.filePaths };
});

// Logo Upload IPC Handlers
ipcMainHandle('upload-logo', async (payload: { logoType: 'primary' | 'secondary', filePath: string }) => {
  try {
    const { logoType, filePath } = payload;
    
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    
    // Get file info
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Validate file size (800KB for primary, 500KB for secondary)
    const maxSize = logoType === 'primary' ? 0.8 : 0.5;
    if (fileSizeInMB > maxSize) {
      return { 
        success: false, 
        error: `File size exceeds ${maxSize}MB limit. Current size: ${fileSizeInMB.toFixed(2)}MB` 
      };
    }
    
    // Validate image dimensions (optional - we'll do basic validation)
    // For now, we'll just check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.svg'].includes(ext)) {
      return { success: false, error: 'Invalid file format. Please use PNG, JPG, or SVG' };
    }
    
    // Create logos directory in user data directory (writable, persists across updates)
    const userDataPath = app.getPath('userData');
    const logosDir = path.join(userDataPath, 'assets', 'logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }
    
    // Copy file to user data/assets/logos directory
    const fileName = `${logoType}-logo${ext}`;
    const destPath = path.join(logosDir, fileName);
    
    fs.copyFileSync(filePath, destPath);
    
    // Update settings with logo path
    const settings = settingsDB.getSettings();
    const logoPathKey = logoType === 'primary' ? 'primary_logo_path' : 'secondary_logo_path';
    settingsDB.updateSettings({
      ...settings,
      [logoPathKey]: destPath
    });
    
    return { success: true, filePath: destPath };
  } catch (error) {
    console.error('Logo upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

ipcMainHandle('select-logo-file', async (payload: { logoType: 'primary' | 'secondary' }) => {
  const result = await dialog.showOpenDialog({
    title: `Select ${payload.logoType === 'primary' ? 'Primary' : 'Secondary'} Logo`,
    filters: [
      { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'svg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  
  if (result.canceled) {
    return { canceled: true, filePath: null };
  }
  
  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMainHandle('select-seal-photo-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Seal Photo',
    filters: [
      { name: 'Image Files', extensions: ['png', 'jpg', 'jpeg', 'svg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  
  if (result.canceled) {
    return { canceled: true, filePath: null };
  }
  
  return { canceled: false, filePath: result.filePaths[0] };
});

ipcMainHandle('get-primary-logo-base64', async () => {
  try {
    const settings = settingsDB.getSettings();
    if (!settings.primary_logo_path || !fs.existsSync(settings.primary_logo_path)) {
      return '';
    }
    
    const ext = path.extname(settings.primary_logo_path).toLowerCase();
    const imageBuffer = fs.readFileSync(settings.primary_logo_path);
    const base64 = imageBuffer.toString('base64');
    
    if (ext === '.svg') {
      return `data:image/svg+xml;base64,${base64}`;
    } else {
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading primary logo:', error);
    return '';
  }
});

ipcMainHandle('get-secondary-logo-base64', async () => {
  try {
    const settings = settingsDB.getSettings();
    if (!settings.secondary_logo_path || !fs.existsSync(settings.secondary_logo_path)) {
      return '';
    }
    
    const ext = path.extname(settings.secondary_logo_path).toLowerCase();
    const imageBuffer = fs.readFileSync(settings.secondary_logo_path);
    const base64 = imageBuffer.toString('base64');
    
    if (ext === '.svg') {
      return `data:image/svg+xml;base64,${base64}`;
    } else {
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading secondary logo:', error);
    return '';
  }
});

ipcMainHandle('upload-seal-photo', async (payload: { filePath: string }) => {
  try {
    const { filePath } = payload;
    
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    
    // Get file info
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    
    // Validate file size (900KB for seal photo)
    const maxSize = 0.9;
    if (fileSizeInMB > maxSize) {
      return { 
        success: false, 
        error: `File size exceeds ${maxSize}MB limit. Current size: ${fileSizeInMB.toFixed(2)}MB` 
      };
    }
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg'];
    if (!allowedExtensions.includes(ext)) {
      return { success: false, error: 'Invalid file type. Allowed: PNG, JPG, JPEG, SVG' };
    }
    
    // Create logos directory in user data directory (writable, persists across updates)
    const userDataPath = app.getPath('userData');
    const logosDir = path.join(userDataPath, 'assets', 'logos');
    if (!fs.existsSync(logosDir)) {
      fs.mkdirSync(logosDir, { recursive: true });
    }
    
    // Copy file to user data/assets/logos directory
    const fileName = `seal-photo${ext}`;
    const destPath = path.join(logosDir, fileName);
    fs.copyFileSync(filePath, destPath);
    
    // Update settings with new logo path
    settingsDB.updateSettings({ seal_photo_path: destPath });
    
    return { success: true, filePath: destPath };
  } catch (error) {
    console.error('Error uploading seal photo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMainHandle('get-seal-photo-base64', async () => {
  try {
    const settings = settingsDB.getSettings();
    if (!settings.seal_photo_path || !fs.existsSync(settings.seal_photo_path)) {
      return '';
    }
    
    const ext = path.extname(settings.seal_photo_path).toLowerCase();
    const imageBuffer = fs.readFileSync(settings.seal_photo_path);
    const base64 = imageBuffer.toString('base64');
    
    if (ext === '.svg') {
      return `data:image/svg+xml;base64,${base64}`;
    } else {
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading seal photo:', error);
    return '';
  }
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

// Function to get signature as base64
function getSignatureAsBase64(): string {
  try {
    const assetPath = getAssetPath();
    const signaturePath = path.join(assetPath, 'seal&signature.svg');
   
    if (!fs.existsSync(signaturePath)) {
      console.error('Signature file not found at:', signaturePath);
      // Try alternative paths
      const altPath1 = path.join(app.getAppPath(), 'src', 'assets', 'seal&signature.svg');
      const altPath2 = path.join(path.dirname(app.getPath('exe')), 'resources', 'src', 'assets', 'seal&signature.svg');
      return '';
    }
    
    const svg = fs.readFileSync(signaturePath, 'utf8');
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.error('Error loading signature:', error);
    return ''; // Return empty string if signature can't be loaded
  }
}

async function getSealPhotoAsBase64(): Promise<string> {
  try {
    const settings = settingsDB.getSettings();
    if (settings.seal_photo_path && fs.existsSync(settings.seal_photo_path)) {
      const ext = path.extname(settings.seal_photo_path).toLowerCase();
      const imageBuffer = fs.readFileSync(settings.seal_photo_path);
      const base64 = imageBuffer.toString('base64');
      
      if (ext === '.svg') {
        return `data:image/svg+xml;base64,${base64}`;
      } else {
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${base64}`;
      }
    }
    // Return empty string if seal photo is not available (no fallback)
    return '';
  } catch (error) {
    console.error('Error loading seal photo:', error);
    return '';
  }
}

// Function to get PNG logo as base64 (legacy - kept for backward compatibility)
function getPNGLogoAsBase64(): string {
  try {
    const assetPath = getAssetPath();
    const logoPath = path.join(assetPath, 'letterpadIcon.png');

    if (!fs.existsSync(logoPath)) {
      console.error('Logo file not found at:', logoPath);
      // Try alternative paths
      const altPath1 = path.join(app.getAppPath(), 'src', 'assets', 'letterpadIcon.png');
      const altPath2 = path.join(path.dirname(app.getPath('exe')), 'resources', 'src', 'assets', 'letterpadIcon.png');
      return '';
    }
    
    const pngBuffer = fs.readFileSync(logoPath);
    const base64 = pngBuffer.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    return ''; // Return empty string if logo can't be loaded
  }
}

// Function to get primary logo as base64
async function getPrimaryLogoAsBase64(): Promise<string> {
  try {
    const settings = settingsDB.getSettings();
    if (!settings.primary_logo_path || !fs.existsSync(settings.primary_logo_path)) {
      return '';
    }
    
    const ext = path.extname(settings.primary_logo_path).toLowerCase();
    const imageBuffer = fs.readFileSync(settings.primary_logo_path);
    const base64 = imageBuffer.toString('base64');
    
    if (ext === '.svg') {
      return `data:image/svg+xml;base64,${base64}`;
    } else {
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Error loading primary logo:', error);
    return '';
  }
}

async function generateHTML(invoice: Invoice): Promise<string> {
  // Get company details and logo
  const settings = settingsDB.getSettings();
  const companyName = settings.company_name || 'ESSAR TRAVEL HUB';
  const contactDetails = settings.company_contact_details || '';
  const companyAddress = settings.company_address || '';
  const thankYouNote = settings.thank_you_note || 'THANKS FOR DOING BUSINESS WITH US';
  const primaryLogoBase64 = await getPrimaryLogoAsBase64();
  const sealPhotoBase64 = await getSealPhotoAsBase64();
  
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
          margin: 15px 0 5px 0;
        }
        .signatory-right {
          font-size: 14px;
          color: #000;
          margin-bottom: 5px;
        }
        .signature-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
        }
        .signature-label {
          font-size: 14px;
          font-weight: normal;
          color: #666;
        }
        .signature-image {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          margin: 5px 0;
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
          ${primaryLogoBase64 ? `<img src="${primaryLogoBase64}" alt="Company Logo" class="logo" />` : `<h2>${companyName}</h2>`}
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
          ${contactDetails ? `
          <div class="contact-title">Contact Details</div>
          <div class="contact-info">
            ${contactDetails.split('\n').map((line: string) => `<div>${line}</div>`).join('')}
          </div>
          ` : ''}
        </div>
        
        <div class="bottom-section">
          <div class="separator-line"></div>
          <div class="thanks-message">
            ${thankYouNote}
          </div>
          <div class="separator-line"></div>
          
          <div class="signatory-footer">
            <div></div>
            <div style="text-align: right;">
              <div class="signatory-right">For ${companyName}</div>
              ${sealPhotoBase64 ? `<img src="${sealPhotoBase64}" alt="Authorised Signature" class="signature-image" />` : '<div style="height: 60px;"></div>'}
            </div>
          </div>
          
          <div class="signature-row">
            <div class="signature-label">Customer Signature</div>
            <div style="text-align: right;">
              <div class="signature-label">Authorised Signature</div>
            </div>
          </div>
          
          ${companyAddress ? `
          <div class="separator-line"></div>
            ${companyAddress}
          <div class="address-footer">
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>`);
}

async function getServicePrice(serviceId: number): Promise<number> {
  const service = await database.getServiceById(serviceId); // Implement this in your database.ts
  return 0; // Services no longer have base_price, price is set per invoice
}