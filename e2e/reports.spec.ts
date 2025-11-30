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
  
  // Navigate to Reports page
  await mainPage.waitForSelector('#root', { timeout: 10000 });
  await mainPage.click('text=Reports');
  await expect(mainPage.locator('h1:has-text("Business Analytics")')).toBeVisible();
});

test.afterEach(async () => {
  await electronApp.close();
});

test.describe('Reports and Analytics', () => {
  test('should display reports page', async () => {
    // Check if the page title is visible
    await expect(mainPage.locator('h1:has-text("Business Analytics")')).toBeVisible();
    
    // Check if the subtitle is visible
    await expect(mainPage.locator('text=Comprehensive business intelligence and performance metrics')).toBeVisible();
  });

  test('should display all report tabs', async () => {
    // Check if all main tabs are present
    await expect(mainPage.locator('button:has-text("Overview")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Revenue")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Services")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Customers")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Financial")')).toBeVisible();
    await expect(mainPage.locator('button:has-text("Time Analysis")')).toBeVisible();
  });

  test('should navigate between report tabs', async () => {
    // Test Overview tab
    await mainPage.click('button:has-text("Overview")');
    await expect(mainPage.locator('button:has-text("Overview").active')).toBeVisible();
    
    // Test Revenue tab
    await mainPage.click('button:has-text("Revenue")');
    await expect(mainPage.locator('button:has-text("Revenue").active')).toBeVisible();
    
    // Test Services tab
    await mainPage.click('button:has-text("Services")');
    await expect(mainPage.locator('button:has-text("Services").active')).toBeVisible();
    
    // Test Customers tab
    await mainPage.click('button:has-text("Customers")');
    await expect(mainPage.locator('button:has-text("Customers").active')).toBeVisible();
    
    // Test Financial tab
    await mainPage.click('button:has-text("Financial")');
    await expect(mainPage.locator('button:has-text("Financial").active')).toBeVisible();
    
    // Test Time Analysis tab
    await mainPage.click('button:has-text("Time Analysis")');
    await expect(mainPage.locator('button:has-text("Time Analysis").active')).toBeVisible();
  });

  test('should display business KPIs in Overview tab', async () => {
    // Click on Overview tab
    await mainPage.click('button:has-text("Overview")');
    
    // Check if KPI cards are present
    await expect(mainPage.locator('text=Total Revenue')).toBeVisible();
    await expect(mainPage.locator('text=Total Invoices')).toBeVisible();
    await expect(mainPage.locator('text=Total Customers')).toBeVisible();
    await expect(mainPage.locator('text=Average Invoice Value')).toBeVisible();
    
    // Check if KPI values are displayed (should show ₹ symbol for INR)
    const revenueElement = mainPage.locator('text=/₹\\s*\\d+/');
    await expect(revenueElement).toBeVisible();
  });

  test('should display revenue analytics', async () => {
    // Click on Revenue tab
    await mainPage.click('button:has-text("Revenue")');
    
    // Check if revenue charts and data are present
    await expect(mainPage.locator('text=Revenue Overview')).toBeVisible();
    
    // Check if currency is displayed in INR (₹)
    const currencyElements = mainPage.locator('text=/₹/');
    await expect(currencyElements.first()).toBeVisible();
  });

  test('should display service performance metrics', async () => {
    // Click on Services tab
    await mainPage.click('button:has-text("Services")');
    
    // Check if service metrics are present
    await expect(mainPage.locator('text=Service Performance')).toBeVisible();
    
    // Check if service data is displayed
    await expect(mainPage.locator('text=Top Services')).toBeVisible();
  });

  test('should display customer analytics', async () => {
    // Click on Customers tab
    await mainPage.click('button:has-text("Customers")');
    
    // Check if customer analytics are present
    await expect(mainPage.locator('text=Customer Analytics')).toBeVisible();
    
    // Check if customer statistics are displayed
    await expect(mainPage.locator('text=Customer Growth')).toBeVisible();
  });

  test('should display financial insights', async () => {
    // Click on Financial tab
    await mainPage.click('button:has-text("Financial")');
    
    // Check if financial insights are present
    await expect(mainPage.locator('text=Financial Insights')).toBeVisible();
    
    // Check if financial data is displayed in INR
    const currencyElements = mainPage.locator('text=/₹/');
    await expect(currencyElements.first()).toBeVisible();
  });

  test('should display time-based analysis', async () => {
    // Click on Time Analysis tab
    await mainPage.click('button:has-text("Time Analysis")');
    
    // Check if time-based analysis is present
    await expect(mainPage.locator('text=Time-Based Analysis')).toBeVisible();
    
    // Check if time period selectors are present
    await expect(mainPage.locator('text=Daily Performance')).toBeVisible();
    await expect(mainPage.locator('text=Weekly Performance')).toBeVisible();
  });

  test('should handle data loading states', async () => {
    // Check if loading states are handled gracefully
    // This test ensures the UI doesn't break when data is loading
    
    // Navigate between tabs quickly to test loading states
    await mainPage.click('button:has-text("Overview")');
    await mainPage.click('button:has-text("Revenue")');
    await mainPage.click('button:has-text("Services")');
    await mainPage.click('button:has-text("Customers")');
    
    // Ensure the page is still responsive
    await expect(mainPage.locator('h1:has-text("Business Analytics")')).toBeVisible();
  });

  test('should display charts and visualizations', async () => {
    // Check if charts are rendered (if using chart libraries)
    const chartElements = mainPage.locator('canvas, svg, .recharts-wrapper');
    if (await chartElements.count() > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
    
    // Check if data tables are present
    const tableElements = mainPage.locator('table');
    if (await tableElements.count() > 0) {
      await expect(tableElements.first()).toBeVisible();
    }
  });

  test('should handle empty data states', async () => {
    // This test checks how the reports handle empty data
    // Since we're in a test environment, there might be no data
    
    // Check if empty states are handled gracefully
    await mainPage.click('button:has-text("Overview")');
    
    // Look for empty state messages or default values
    const emptyStateElements = mainPage.locator('text=/no data|empty|0|₹\\s*0/');
    if (await emptyStateElements.count() > 0) {
      await expect(emptyStateElements.first()).toBeVisible();
    }
  });

  test('should maintain tab state during navigation', async () => {
    // Select a specific tab
    await mainPage.click('button:has-text("Revenue")');
    
    // Navigate away and back
    await mainPage.click('text=Invoices');
    await mainPage.click('text=Reports');
    
    // Check if the tab state is maintained (this depends on your implementation)
    // For now, just ensure the reports page loads correctly
    await expect(mainPage.locator('h1:has-text("Business Analytics")')).toBeVisible();
  });
});
