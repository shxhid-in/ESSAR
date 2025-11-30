import { test, expect } from '@playwright/test';

// Test configuration and utilities
export const TEST_CONFIG = {
  // Test data
  testCustomer: {
    name: 'E2E Test Customer',
    phone: '+1-555-0123',
    email: 'e2e@test.com',
    address: '123 E2E Test Street, Test City'
  },
  
  testInvoice: {
    customerName: 'E2E Invoice Customer',
    customerAddress: '456 E2E Invoice Street, Invoice City',
    phone: '+1-555-0456',
    currency: 'USD',
    items: [
      {
        serviceName: 'E2E Test Service',
        serviceDescription: 'E2E Test Service Description',
        price: 100
      }
    ],
    discount: 0
  },
  
  testService: {
    name: 'E2E Test Service',
    description: 'E2E Test Service Description'
  },
  
  testCurrency: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    exchange_rate: 60.5
  },
  
  // Timeouts
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000
  }
};

// Helper functions for common test operations
export class TestHelpers {
  static async waitForElement(page: any, selector: string, timeout: number = TEST_CONFIG.timeouts.medium) {
    return await page.waitForSelector(selector, { timeout });
  }
  
  static async clickAndWait(page: any, selector: string, waitSelector?: string) {
    await page.click(selector);
    if (waitSelector) {
      await this.waitForElement(page, waitSelector);
    }
  }
  
  static async fillForm(page: any, formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`;
      await page.fill(selector, value);
    }
  }
  
  static async clearForm(page: any, formData: Record<string, string>) {
    for (const field of Object.keys(formData)) {
      const selector = `input[name="${field}"], textarea[name="${field}"]`;
      await page.fill(selector, '');
    }
  }
  
  static async takeScreenshot(page: any, name: string) {
    await page.screenshot({ path: `test-screenshots/${name}.png` });
  }
  
  static async waitForApiResponse(page: any, apiCall: string) {
    // Wait for specific API calls to complete
    await page.waitForResponse(response => 
      response.url().includes(apiCall) && response.status() === 200
    );
  }
}

// Test data cleanup utilities
export class TestCleanup {
  static async cleanupTestData(page: any) {
    // This would clean up test data after tests
    // Implementation depends on your API structure
    try {
      // Example: Delete test customers, invoices, etc.
      console.log('Cleaning up test data...');
    } catch (error) {
      console.warn('Failed to cleanup test data:', error);
    }
  }
}

// Test assertions
export class TestAssertions {
  static async assertElementVisible(page: any, selector: string, message?: string) {
    await expect(page.locator(selector)).toBeVisible();
  }
  
  static async assertElementNotVisible(page: any, selector: string, message?: string) {
    await expect(page.locator(selector)).not.toBeVisible();
  }
  
  static async assertTextContent(page: any, selector: string, expectedText: string) {
    await expect(page.locator(selector)).toContainText(expectedText);
  }
  
  static async assertFormValidation(page: any, field: string, expectedError?: string) {
    const errorSelector = `[data-testid="${field}-error"], .error, .validation-error`;
    if (expectedError) {
      await expect(page.locator(errorSelector)).toContainText(expectedError);
    } else {
      await expect(page.locator(errorSelector)).toBeVisible();
    }
  }
}

// Test suite configuration
export const TEST_SUITES = {
  smoke: ['app.spec.ts'],
  regression: [
    'app.spec.ts',
    'customers.spec.ts',
    'invoices.spec.ts',
    'reports.spec.ts',
    'settings.spec.ts'
  ],
  critical: ['app.spec.ts', 'invoices.spec.ts'],
  full: [
    'app.spec.ts',
    'customers.spec.ts',
    'invoices.spec.ts',
    'reports.spec.ts',
    'settings.spec.ts'
  ]
};

// Test environment setup
export const setupTestEnvironment = async (page: any) => {
  // Set up test environment
  await page.addInitScript(() => {
    // Mock any external dependencies if needed
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
};

// Test reporting utilities
export class TestReporter {
  static generateTestReport(results: any) {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: results.filter((r: any) => r.status === 'passed').length,
      failed: results.filter((r: any) => r.status === 'failed').length,
      skipped: results.filter((r: any) => r.status === 'skipped').length,
      duration: results.reduce((sum: number, r: any) => sum + (r.duration || 0), 0),
      results: results
    };
    
    console.log('Test Report:', JSON.stringify(report, null, 2));
    return report;
  }
}
