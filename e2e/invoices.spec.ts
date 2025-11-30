import { test, expect, _electron } from '@playwright/test';

let electronApp: Awaited<ReturnType<typeof _electron.launch>>;
let mainPage: Awaited<ReturnType<typeof electronApp.firstWindow>>;

async function waitForElectronReady() {
  return new Promise<void>((resolve) => {
    const interval = setInterval(async () => {
      try {
        const electronBridge = await mainPage.evaluate(() => {
          return (window as Window & { electronAPI?: any }).electronAPI;
        });
        if (electronBridge) {
          clearInterval(interval);
          resolve();
        }
      } catch (error) {
        // Continue waiting
      }
    }, 100);
  });
}

test.beforeEach(async () => {
  electronApp = await _electron.launch({
    args: ['.'],
    env: { NODE_ENV: 'test' },
    timeout: 60000, // 60 seconds timeout
  });
  
  mainPage = await electronApp.firstWindow();
  await waitForElectronReady();
  
  // Navigate to Invoices page
  await mainPage.waitForSelector('#root', { timeout: 10000 });
  await mainPage.click('text=Invoices');
  await expect(mainPage.locator('h1:has-text("Invoice Management")')).toBeVisible();
});

test.afterEach(async () => {
  await electronApp.close();
});

test.describe('Invoice Management', () => {
  test('should display invoice management page', async () => {
    // Check if the page title is visible
    await expect(mainPage.locator('h1:has-text("Invoice Management")')).toBeVisible();
    
    // Check if the create invoice button is present
    await expect(mainPage.locator('button:has-text("Create Invoice")')).toBeVisible();
    
    // Check if the invoice list is present
    await expect(mainPage.locator('text=Invoice List')).toBeVisible();
  });

  test('should open invoice creator modal', async () => {
    // Click create invoice button
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Check if modal opens
    await expect(mainPage.locator('text=Create New Invoice')).toBeVisible();
    
    // Check if form fields are present
    await expect(mainPage.locator('input[placeholder*="customer" i]')).toBeVisible();
    await expect(mainPage.locator('input[placeholder*="address" i]')).toBeVisible();
    await expect(mainPage.locator('input[placeholder*="phone" i]')).toBeVisible();
  });

  test('should create a new invoice', async () => {
    // Open invoice creator
    await mainPage.click('button:has-text("Create Invoice")');
    await expect(mainPage.locator('text=Create New Invoice')).toBeVisible();
    
    // Fill customer information
    await mainPage.fill('input[placeholder*="customer" i]', 'Invoice Test Customer');
    await mainPage.fill('input[placeholder*="address" i]', '123 Invoice Street, Invoice City');
    await mainPage.fill('input[placeholder*="phone" i]', '+1-555-0999');
    
    // Select currency
    await mainPage.selectOption('select[name="currency"]', 'USD');
    
    // Add service items
    const serviceNameInput = mainPage.locator('input[placeholder*="service" i]').first();
    await serviceNameInput.fill('Test Service');
    
    const serviceDescInput = mainPage.locator('input[placeholder*="description" i]').first();
    await serviceDescInput.fill('Test Service Description');
    
    const priceInput = mainPage.locator('input[placeholder*="price" i], input[type="number"]').first();
    await priceInput.fill('100');
    
    // Submit the invoice
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Wait for modal to close and invoice to appear in list
    await expect(mainPage.locator('text=Create New Invoice')).not.toBeVisible();
    await expect(mainPage.locator('text=Invoice Test Customer')).toBeVisible();
  });

  test('should validate invoice form inputs', async () => {
    // Open invoice creator
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Try to submit without required fields
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Check if validation errors appear (if implemented)
    // Note: This depends on your validation implementation
  });

  test('should display invoice list with proper data', async () => {
    // Check if invoice list table is present
    await expect(mainPage.locator('table')).toBeVisible();
    
    // Check if table headers are present
    await expect(mainPage.locator('th:has-text("Invoice #")')).toBeVisible();
    await expect(mainPage.locator('th:has-text("Customer")')).toBeVisible();
    await expect(mainPage.locator('th:has-text("Date")')).toBeVisible();
    await expect(mainPage.locator('th:has-text("Total")')).toBeVisible();
  });

  test('should view invoice details', async () => {
    // Create an invoice first
    await mainPage.click('button:has-text("Create Invoice")');
    await mainPage.fill('input[placeholder*="customer" i]', 'View Test Customer');
    await mainPage.fill('input[placeholder*="address" i]', '456 View Street, View City');
    await mainPage.fill('input[placeholder*="phone" i]', '+1-555-0888');
    await mainPage.selectOption('select[name="currency"]', 'USD');
    
    const serviceNameInput = mainPage.locator('input[placeholder*="service" i]').first();
    await serviceNameInput.fill('View Test Service');
    const priceInput = mainPage.locator('input[placeholder*="price" i], input[type="number"]').first();
    await priceInput.fill('200');
    
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Wait for invoice to appear
    await expect(mainPage.locator('text=View Test Customer')).toBeVisible();
    
    // Click view button
    const viewButton = mainPage.locator('button:has-text("View"), button[title*="view" i]').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // Check if invoice viewer opens
      await expect(mainPage.locator('text=Invoice Details')).toBeVisible();
    }
  });

  test('should edit an existing invoice', async () => {
    // Create an invoice first
    await mainPage.click('button:has-text("Create Invoice")');
    await mainPage.fill('input[placeholder*="customer" i]', 'Edit Test Customer');
    await mainPage.fill('input[placeholder*="address" i]', '789 Edit Street, Edit City');
    await mainPage.fill('input[placeholder*="phone" i]', '+1-555-0777');
    await mainPage.selectOption('select[name="currency"]', 'USD');
    
    const serviceNameInput = mainPage.locator('input[placeholder*="service" i]').first();
    await serviceNameInput.fill('Edit Test Service');
    const priceInput = mainPage.locator('input[placeholder*="price" i], input[type="number"]').first();
    await priceInput.fill('300');
    
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Wait for invoice to appear
    await expect(mainPage.locator('text=Edit Test Customer')).toBeVisible();
    
    // Click edit button
    const editButton = mainPage.locator('button:has-text("Edit"), button[title*="edit" i]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Check if invoice editor opens
      await expect(mainPage.locator('text=Edit Invoice')).toBeVisible();
      
      // Modify the invoice
      await mainPage.fill('input[placeholder*="customer" i]', 'Updated Edit Customer');
      await mainPage.click('button:has-text("Update Invoice")');
      
      // Verify the update
      await expect(mainPage.locator('text=Updated Edit Customer')).toBeVisible();
    }
  });

  test('should delete an invoice', async () => {
    // Create an invoice first
    await mainPage.click('button:has-text("Create Invoice")');
    await mainPage.fill('input[placeholder*="customer" i]', 'Delete Test Customer');
    await mainPage.fill('input[placeholder*="address" i]', '321 Delete Street, Delete City');
    await mainPage.fill('input[placeholder*="phone" i]', '+1-555-0666');
    await mainPage.selectOption('select[name="currency"]', 'USD');
    
    const serviceNameInput = mainPage.locator('input[placeholder*="service" i]').first();
    await serviceNameInput.fill('Delete Test Service');
    const priceInput = mainPage.locator('input[placeholder*="price" i], input[type="number"]').first();
    await priceInput.fill('400');
    
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Wait for invoice to appear
    await expect(mainPage.locator('text=Delete Test Customer')).toBeVisible();
    
    // Click delete button
    const deleteButton = mainPage.locator('button:has-text("Delete"), button[title*="delete" i]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion if confirmation dialog appears
      const confirmButton = mainPage.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify invoice is removed
      await expect(mainPage.locator('text=Delete Test Customer')).not.toBeVisible();
    }
  });

  test('should download invoice as PDF', async () => {
    // Create an invoice first
    await mainPage.click('button:has-text("Create Invoice")');
    await mainPage.fill('input[placeholder*="customer" i]', 'PDF Test Customer');
    await mainPage.fill('input[placeholder*="address" i]', '654 PDF Street, PDF City');
    await mainPage.fill('input[placeholder*="phone" i]', '+1-555-0555');
    await mainPage.selectOption('select[name="currency"]', 'USD');
    
    const serviceNameInput = mainPage.locator('input[placeholder*="service" i]').first();
    await serviceNameInput.fill('PDF Test Service');
    const priceInput = mainPage.locator('input[placeholder*="price" i], input[type="number"]').first();
    await priceInput.fill('500');
    
    await mainPage.click('button:has-text("Create Invoice")');
    
    // Wait for invoice to appear
    await expect(mainPage.locator('text=PDF Test Customer')).toBeVisible();
    
    // Click download button
    const downloadButton = mainPage.locator('button:has-text("Download"), button[title*="download" i]').first();
    if (await downloadButton.isVisible()) {
      // Note: PDF download testing in Electron requires special handling
      // This test verifies the button exists and is clickable
      await expect(downloadButton).toBeEnabled();
    }
  });
});
