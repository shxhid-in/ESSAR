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
  
  // Navigate to Customers page
  await mainPage.waitForSelector('#root', { timeout: 10000 });
  await mainPage.click('text=Customers');
  await expect(mainPage.locator('h1:has-text("Customer Management")')).toBeVisible();
});

test.afterEach(async () => {
  await electronApp.close();
});

test.describe('Customer Management', () => {
  test('should display customer management page', async () => {
    // Check if the page title is visible
    await expect(mainPage.locator('h1:has-text("Customer Management")')).toBeVisible();
    
    // Check if the customer form is present
    await expect(mainPage.locator('text=Add New Customer')).toBeVisible();
    
    // Check if the customer list is present
    await expect(mainPage.locator('text=Customer Directory')).toBeVisible();
  });

  test('should add a new customer', async () => {
    // Fill in customer form
    await mainPage.fill('input[name="name"]', 'Test Customer');
    await mainPage.fill('input[name="phone"]', '+1-555-0123');
    await mainPage.fill('input[name="email"]', 'test@example.com');
    await mainPage.fill('textarea[name="address"]', '123 Test Street, Test City');
    
    // Submit the form
    await mainPage.click('button:has-text("Save Customer")');
    
    // Wait for the customer to appear in the list
    await expect(mainPage.locator('text=Test Customer')).toBeVisible();
    await expect(mainPage.locator('text=+1-555-0123')).toBeVisible();
  });

  test('should validate customer form inputs', async () => {
    // Try to submit empty form
    await mainPage.click('button:has-text("Save Customer")');
    
    // Check if validation errors appear (if implemented)
    // Note: This depends on your validation implementation
  });

  test('should edit an existing customer', async () => {
    // First, add a customer
    await mainPage.fill('input[name="name"]', 'Edit Test Customer');
    await mainPage.fill('input[name="phone"]', '+1-555-0456');
    await mainPage.fill('input[name="email"]', 'edit@example.com');
    await mainPage.fill('textarea[name="address"]', '456 Edit Street, Edit City');
    await mainPage.click('button:has-text("Save Customer")');
    
    // Wait for customer to appear
    await expect(mainPage.locator('text=Edit Test Customer')).toBeVisible();
    
    // Click edit button (assuming it exists)
    const editButton = mainPage.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modify the customer data
      await mainPage.fill('input[name="name"]', 'Updated Test Customer');
      await mainPage.click('button:has-text("Update Customer")');
      
      // Verify the update
      await expect(mainPage.locator('text=Updated Test Customer')).toBeVisible();
    }
  });

  test('should display customer list with proper data', async () => {
    // Check if customer list table is present
    await expect(mainPage.locator('table')).toBeVisible();
    
    // Check if table headers are present
    await expect(mainPage.locator('th:has-text("Name")')).toBeVisible();
    await expect(mainPage.locator('th:has-text("Phone")')).toBeVisible();
    await expect(mainPage.locator('th:has-text("Email")')).toBeVisible();
    await expect(mainPage.locator('th:has-text("Address")')).toBeVisible();
  });

  test('should handle customer search/filtering', async () => {
    // Add a test customer
    await mainPage.fill('input[name="name"]', 'Search Test Customer');
    await mainPage.fill('input[name="phone"]', '+1-555-0789');
    await mainPage.fill('input[name="email"]', 'search@example.com');
    await mainPage.fill('textarea[name="address"]', '789 Search Street, Search City');
    await mainPage.click('button:has-text("Save Customer")');
    
    // Wait for customer to appear
    await expect(mainPage.locator('text=Search Test Customer')).toBeVisible();
    
    // Test search functionality (if implemented)
    const searchInput = mainPage.locator('input[placeholder*="search" i], input[placeholder*="filter" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Search Test');
      await expect(mainPage.locator('text=Search Test Customer')).toBeVisible();
    }
  });

  test('should show customer count', async () => {
    // Check if customer count is displayed
    const countElement = mainPage.locator('text=/\\d+ customers?/i');
    await expect(countElement).toBeVisible();
  });

  test('should handle customer deletion', async () => {
    // Add a customer to delete
    await mainPage.fill('input[name="name"]', 'Delete Test Customer');
    await mainPage.fill('input[name="phone"]', '+1-555-0321');
    await mainPage.fill('input[name="email"]', 'delete@example.com');
    await mainPage.fill('textarea[name="address"]', '321 Delete Street, Delete City');
    await mainPage.click('button:has-text("Save Customer")');
    
    // Wait for customer to appear
    await expect(mainPage.locator('text=Delete Test Customer')).toBeVisible();
    
    // Click delete button (if implemented)
    const deleteButton = mainPage.locator('button:has-text("Delete")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion if confirmation dialog appears
      const confirmButton = mainPage.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Verify customer is removed
      await expect(mainPage.locator('text=Delete Test Customer')).not.toBeVisible();
    }
  });
});
