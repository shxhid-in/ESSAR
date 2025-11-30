# E2E Testing with Playwright

This directory contains comprehensive End-to-End (E2E) tests for the Essar Travel Billing application using Playwright.

## 🧪 What is E2E Testing?

E2E testing simulates real user interactions with your application:
- **Opens your app** in a real browser environment
- **Clicks buttons, fills forms, navigates pages** just like a real user
- **Verifies functionality** works as expected
- **Tests complete user journeys** from start to finish
- **Catches integration bugs** that unit tests miss

## 📁 Test Structure

```
e2e/
├── app.spec.ts          # Application launch and navigation tests
├── customers.spec.ts    # Customer management functionality tests
├── invoices.spec.ts     # Invoice creation, editing, and management tests
├── reports.spec.ts      # Reports and analytics functionality tests
├── settings.spec.ts     # Settings and configuration tests
├── test-runner.ts       # Test utilities and helpers
└── README.md           # This file
```

## 🚀 Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug
```

### Specific Test Suites

```bash
# Run only smoke tests (critical functionality)
npm run test:e2e:smoke

# Run critical business logic tests
npm run test:e2e:critical

# Run full test suite
npm run test:e2e:full
```

### Test Reports

After running tests, you'll find:
- **HTML Report**: `playwright-report/index.html` - Interactive test results
- **JSON Report**: `test-results.json` - Machine-readable results
- **JUnit Report**: `test-results.xml` - CI/CD integration
- **Screenshots**: `test-results/` - Screenshots of failures
- **Videos**: `test-results/` - Video recordings of test runs

## 🧩 Test Categories

### 1. Application Launch (`app.spec.ts`)
- ✅ App launches successfully
- ✅ Window controls work (minimize, maximize, close)
- ✅ Navigation between pages
- ✅ Menu system functionality

### 2. Customer Management (`customers.spec.ts`)
- ✅ Add new customers
- ✅ Edit existing customers
- ✅ Delete customers
- ✅ Customer form validation
- ✅ Customer list display
- ✅ Search and filtering

### 3. Invoice Management (`invoices.spec.ts`)
- ✅ Create new invoices
- ✅ Edit existing invoices
- ✅ Delete invoices
- ✅ View invoice details
- ✅ Download invoices as PDF
- ✅ Invoice form validation
- ✅ Service item management

### 4. Reports & Analytics (`reports.spec.ts`)
- ✅ All report tabs navigation
- ✅ Business KPIs display
- ✅ Revenue analytics
- ✅ Service performance metrics
- ✅ Customer analytics
- ✅ Financial insights
- ✅ Time-based analysis
- ✅ Currency display (INR)

### 5. Settings Management (`settings.spec.ts`)
- ✅ Services management (add, edit, delete)
- ✅ Currency management (add, edit, delete)
- ✅ Preferences configuration
- ✅ Form validation
- ✅ Default data display

## 🔧 Test Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,        // Disabled for Electron apps
  workers: 1,                  // Single worker for stability
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  }
});
```

### Test Environment

- **Electron App**: Tests run against the actual Electron application
- **Database**: Uses test database (separate from production)
- **Environment**: `NODE_ENV=test` for test-specific behavior
- **Timeouts**: Configured for Electron app responsiveness

## 🛠️ Test Utilities

### Test Helpers (`test-runner.ts`)

```typescript
// Wait for elements
await TestHelpers.waitForElement(page, 'selector');

// Click and wait for response
await TestHelpers.clickAndWait(page, 'button', 'response-selector');

// Fill forms
await TestHelpers.fillForm(page, { name: 'John', email: 'john@test.com' });

// Take screenshots
await TestHelpers.takeScreenshot(page, 'test-name');
```

### Test Data

```typescript
const TEST_CONFIG = {
  testCustomer: {
    name: 'E2E Test Customer',
    phone: '+1-555-0123',
    email: 'e2e@test.com',
    address: '123 E2E Test Street, Test City'
  },
  // ... more test data
};
```

## 🐛 Debugging Tests

### 1. Run in Debug Mode
```bash
npm run test:e2e:debug
```

### 2. Run in Headed Mode
```bash
npm run test:e2e:headed
```

### 3. Run Specific Test
```bash
npx playwright test e2e/customers.spec.ts --headed
```

### 4. Run with UI
```bash
npm run test:e2e:ui
```

## 📊 Test Results

### Success Indicators
- ✅ All tests pass
- ✅ No console errors
- ✅ Screenshots match expected behavior
- ✅ Performance within acceptable limits

### Failure Analysis
- 🔍 Check HTML report for detailed failure information
- 📸 Review failure screenshots
- 🎥 Watch failure videos
- 📝 Check console logs for errors

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    npm install
    npm run test:e2e
  env:
    NODE_ENV: test
```

### Test Reports in CI
- Upload `playwright-report/` as build artifacts
- Parse `test-results.json` for test metrics
- Use `test-results.xml` for JUnit integration

## 🎯 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Keep tests independent and isolated

### 2. Test Data
- Use consistent test data
- Clean up after tests
- Avoid hardcoded values

### 3. Assertions
- Use specific assertions
- Check both positive and negative cases
- Verify UI state changes

### 4. Performance
- Use appropriate timeouts
- Wait for elements to be ready
- Avoid unnecessary delays

## 🚨 Troubleshooting

### Common Issues

1. **Tests timeout**
   - Increase timeout values
   - Check if app is loading properly
   - Verify Electron is launching correctly

2. **Elements not found**
   - Check selector accuracy
   - Wait for elements to load
   - Verify page navigation

3. **Database issues**
   - Ensure test database is separate
   - Check data cleanup between tests
   - Verify database initialization

4. **PDF generation fails**
   - Check if PDF generation is working in manual testing
   - Verify file permissions
   - Check for missing dependencies

### Getting Help

1. Check the HTML report for detailed error information
2. Review the test videos and screenshots
3. Run tests in debug mode to step through issues
4. Check the console logs for additional error details

## 📈 Test Coverage

Current test coverage includes:
- ✅ Application launch and navigation
- ✅ Customer CRUD operations
- ✅ Invoice CRUD operations
- ✅ Reports and analytics
- ✅ Settings management
- ✅ Form validation
- ✅ PDF generation
- ✅ Multi-currency support

## 🔮 Future Enhancements

- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] Load testing with multiple users
- [ ] Visual regression testing
- [ ] API testing integration
