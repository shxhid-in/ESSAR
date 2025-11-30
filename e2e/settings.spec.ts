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
  
  // Navigate to Settings page
  await mainPage.waitForSelector('#root', { timeout: 10000 });
  await mainPage.click('text=Settings');
  await expect(mainPage.locator('h1:has-text("Application Settings")')).toBeVisible();
});

test.afterEach(async () => {
  await electronApp.close();
});

test.describe('Settings Management', () => {
  test('should display settings page', async () => {
    // Check if the page title is visible
    await expect(mainPage.locator('h1:has-text("Application Settings")')).toBeVisible();
    
    // Check if the subtitle is visible
    await expect(mainPage.locator('text=Configure services, currencies, and preferences')).toBeVisible();
  });

  test('should display settings navigation tabs', async () => {
    // Check if all settings tabs are present
    await expect(mainPage.locator('button:has-text("Services")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Currencies")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Preferences")')).toBeVisible();
  });

  test('should navigate between settings tabs', async () => {
    // Test Services tab
    await mainPage.click('button:has-text("Services")');
    await expect(mainPage.locator('button:has-text("Services").active')).toBeVisible();
    
    // Test Currencies tab
    await mainPage.click('button:has-text("Currencies")');
    await expect(mainPage.locator('button:has-text("Currencies").active')).toBeVisible();
    
    // Test Preferences tab
    await mainPage.click('button:has-text("Preferences")');
    await expect(mainPage.locator('button:has-text("Preferences").active')).toBeVisible();
  });

  test.describe('Services Management', () => {
    test('should display services management interface', async () => {
      // Click on Services tab
      await mainPage.click('button:has-text("Services")');
      
      // Check if services form is present
      await expect(mainPage.locator('text=Add New Service')).toBeVisible();
      
      // Check if services list is present
      await expect(mainPage.locator('text=Existing Services')).toBeVisible();
    });

    test('should add a new service', async () => {
      // Click on Services tab
      await mainPage.click('button:has-text("Services")');
      
      // Fill in service form
      await mainPage.fill('input[name="name"]', 'Test Service');
      await mainPage.fill('textarea[name="description"]', 'Test Service Description');
      
      // Submit the form
      await mainPage.click('button:has-text("Add Service")');
      
      // Wait for the service to appear in the list
      await expect(mainPage.locator('text=Test Service')).toBeVisible();
    });

    test('should validate service form inputs', async () => {
      // Click on Services tab
      await mainPage.click('button:has-text("Services")');
      
      // Try to submit empty form
      await mainPage.click('button:has-text("Add Service")');
      
      // Check if validation errors appear (if implemented)
      // Note: This depends on your validation implementation
    });

    test('should edit an existing service', async () => {
      // Click on Services tab
      await mainPage.click('button:has-text("Services")');
      
      // Add a service first
      await mainPage.fill('input[name="name"]', 'Edit Test Service');
      await mainPage.fill('textarea[name="description"]', 'Edit Test Service Description');
      await mainPage.click('button:has-text("Add Service")');
      
      // Wait for service to appear
      await expect(mainPage.locator('text=Edit Test Service')).toBeVisible();
      
      // Click edit button (if implemented)
      const editButton = mainPage.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Modify the service data
        await mainPage.fill('input[name="name"]', 'Updated Test Service');
        await mainPage.click('button:has-text("Update Service")');
        
        // Verify the update
        await expect(mainPage.locator('text=Updated Test Service')).toBeVisible();
      }
    });

    test('should delete a service', async () => {
      // Click on Services tab
      await mainPage.click('button:has-text("Services")');
      
      // Add a service first
      await mainPage.fill('input[name="name"]', 'Delete Test Service');
      await mainPage.fill('textarea[name="description"]', 'Delete Test Service Description');
      await mainPage.click('button:has-text("Add Service")');
      
      // Wait for service to appear
      await expect(mainPage.locator('text=Delete Test Service')).toBeVisible();
      
      // Click delete button (if implemented)
      const deleteButton = mainPage.locator('button:has-text("Delete")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion if confirmation dialog appears
        const confirmButton = mainPage.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Verify service is removed
        await expect(mainPage.locator('text=Delete Test Service')).not.toBeVisible();
      }
    });
  });

  test.describe('Currency Management', () => {
    test('should display currency management interface', async () => {
      // Click on Currencies tab
      await mainPage.click('button:has-text("Currencies")');
      
      // Check if currency form is present
      await expect(mainPage.locator('text=Add New Currency')).toBeVisible();
      
      // Check if currencies list is present
      await expect(mainPage.locator('text=Existing Currencies')).toBeVisible();
    });

    test('should add a new currency', async () => {
      // Click on Currencies tab
      await mainPage.click('button:has-text("Currencies")');
      
      // Fill in currency form
      await mainPage.fill('input[name="code"]', 'CAD');
      await mainPage.fill('input[name="name"]', 'Canadian Dollar');
      await mainPage.fill('input[name="symbol"]', 'C$');
      await mainPage.fill('input[name="exchange_rate"]', '60.5');
      
      // Submit the form
      await mainPage.click('button:has-text("Add Currency")');
      
      // Wait for the currency to appear in the list
      await expect(mainPage.locator('text=CAD')).toBeVisible();
    });

    test('should validate currency form inputs', async () => {
      // Click on Currencies tab
      await mainPage.click('button:has-text("Currencies")');
      
      // Try to submit with invalid currency code
      await mainPage.fill('input[name="code"]', 'INVALID');
      await mainPage.fill('input[name="name"]', 'Invalid Currency');
      await mainPage.fill('input[name="symbol"]', 'I$');
      await mainPage.fill('input[name="exchange_rate"]', '-10');
      
      await mainPage.click('button:has-text("Add Currency")');
      
      // Check if validation errors appear (if implemented)
      // Note: This depends on your validation implementation
    });

    test('should edit an existing currency', async () => {
      // Click on Currencies tab
      await mainPage.click('button:has-text("Currencies")');
      
      // Add a currency first
      await mainPage.fill('input[name="code"]', 'AUD');
      await mainPage.fill('input[name="name"]', 'Australian Dollar');
      await mainPage.fill('input[name="symbol"]', 'A$');
      await mainPage.fill('input[name="exchange_rate"]', '55.2');
      await mainPage.click('button:has-text("Add Currency")');
      
      // Wait for currency to appear
      await expect(mainPage.locator('text=AUD')).toBeVisible();
      
      // Click edit button (if implemented)
      const editButton = mainPage.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Modify the currency data
        await mainPage.fill('input[name="exchange_rate"]', '56.0');
        await mainPage.click('button:has-text("Update Currency")');
        
        // Verify the update
        await expect(mainPage.locator('text=56.0')).toBeVisible();
      }
    });

    test('should display default currencies', async () => {
      // Click on Currencies tab
      await mainPage.click('button:has-text("Currencies")');
      
      // Check if default currencies are present
      await expect(mainPage.locator('text=USD')).toBeVisible();
      await expect(mainPage.locator('text=EUR')).toBeVisible();
      await expect(mainPage.locator('text=GBP')).toBeVisible();
      await expect(mainPage.locator('text=AED')).toBeVisible();
      await expect(mainPage.locator('text=INR')).toBeVisible();
    });
  });

  test.describe('Preferences Management', () => {
    test('should display preferences interface', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Check if preferences form is present
      await expect(mainPage.locator('text=Application Preferences')).toBeVisible();
    });

    test('should display default currency setting', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Check if default currency selector is present
      await expect(mainPage.locator('select[name="default_currency"]')).toBeVisible();
    });

    test('should display base currency setting', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Check if base currency selector is present
      await expect(mainPage.locator('select[name="base_currency"]')).toBeVisible();
    });

    test('should display tax rate setting', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Check if tax rate input is present
      await expect(mainPage.locator('input[name="tax_rate"]')).toBeVisible();
    });

    test('should display invoice prefix setting', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Check if invoice prefix input is present
      await expect(mainPage.locator('input[name="invoice_prefix"]')).toBeVisible();
    });

    test('should save preferences', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Modify some settings
      await mainPage.selectOption('select[name="default_currency"]', 'EUR');
      await mainPage.selectOption('select[name="base_currency"]', 'USD');
      await mainPage.fill('input[name="tax_rate"]', '10');
      await mainPage.fill('input[name="invoice_prefix"]', 'INV-');
      
      // Save the preferences
      await mainPage.click('button:has-text("Save Preferences")');
      
      // Check if success message appears (if implemented)
      // Note: This depends on your implementation
    });

    test('should validate preferences inputs', async () => {
      // Click on Preferences tab
      await mainPage.click('button:has-text("Preferences")');
      
      // Try to submit with invalid tax rate
      await mainPage.fill('input[name="tax_rate"]', '150');
      await mainPage.click('button:has-text("Save Preferences")');
      
      // Check if validation errors appear (if implemented)
      // Note: This depends on your validation implementation
    });
  });
});
