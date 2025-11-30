import { test, expect, _electron } from '@playwright/test';

let electronApp: Awaited<ReturnType<typeof _electron.launch>>;
let mainPage: Awaited<ReturnType<typeof electronApp.firstWindow>>;

// Helper function to wait for Electron to be ready
async function waitForElectronReady() {
  return new Promise<void>((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds max wait
    
    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(interval);
        reject(new Error('Electron API not ready after 10 seconds'));
        return;
      }
      
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
  // Launch Electron app
  electronApp = await _electron.launch({
    args: ['dist-electron/main.js'], // Point to the compiled main.js
    env: { 
      NODE_ENV: 'development',
      ELECTRON_IS_DEV: '1'
    },
    timeout: 120000, // 2 minutes timeout
  });
  
  mainPage = await electronApp.firstWindow();
  await mainPage.waitForLoadState('domcontentloaded');
  await waitForElectronReady();
});

test.afterEach(async () => {
  await electronApp.close();
});

test.describe('Application Launch', () => {
  test('should launch the application successfully', async () => {
    // Check if the main window is visible
    const isVisible = await electronApp.evaluate((electron) => {
      return electron.BrowserWindow.getAllWindows()[0].isVisible();
    });
    expect(isVisible).toBeTruthy();
  });

  test('should have the correct title', async () => {
    const title = await mainPage.title();
    expect(title).toBe('Essar Travel - Billing');
  });

  test('should load the main application interface', async () => {
    // Wait for the main app to load
    await mainPage.waitForSelector('#root', { timeout: 10000 });
    
    // Check if the main navigation is present
    await expect(mainPage.locator('nav')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between different pages', async () => {
    // Wait for the app to load
    await mainPage.waitForSelector('#root', { timeout: 10000 });
    
    // Test navigation to Invoices page
    await mainPage.click('text=Invoices');
    await expect(mainPage.locator('h1:has-text("Invoice Management")')).toBeVisible();
    
    // Test navigation to Customers page
    await mainPage.click('text=Customers');
    await expect(mainPage.locator('h1:has-text("Customer Management")')).toBeVisible();
    
    // Test navigation to Reports page
    await mainPage.click('text=Reports');
    await expect(mainPage.locator('h1:has-text("Business Analytics")')).toBeVisible();
    
    // Test navigation to Settings page
    await mainPage.click('text=Settings');
    await expect(mainPage.locator('h1:has-text("Application Settings")')).toBeVisible();
  });
});

test.describe('Window Controls', () => {
  test('should minimize the window', async () => {
    // Use Electron API to minimize the window
    await electronApp.evaluate((electron) => {
      electron.BrowserWindow.getAllWindows()[0].minimize();
    });
    
    const isMinimized = await electronApp.evaluate((electron) => {
      return electron.BrowserWindow.getAllWindows()[0].isMinimized();
    });
    expect(isMinimized).toBeTruthy();
  });

  test('should maximize/restore the window', async () => {
    // First maximize
    await electronApp.evaluate((electron) => {
      electron.BrowserWindow.getAllWindows()[0].maximize();
    });
    
    const isMaximized = await electronApp.evaluate((electron) => {
      return electron.BrowserWindow.getAllWindows()[0].isMaximized();
    });
    expect(isMaximized).toBeTruthy();
    
    // Then restore
    await electronApp.evaluate((electron) => {
      electron.BrowserWindow.getAllWindows()[0].unmaximize();
    });
    
    const isRestored = await electronApp.evaluate((electron) => {
      return !electron.BrowserWindow.getAllWindows()[0].isMaximized();
    });
    expect(isRestored).toBeTruthy();
  });

  test('should close the application', async () => {
    // This test will close the app, so we need to handle it differently
    const closePromise = electronApp.evaluate((electron) => {
      return new Promise((resolve) => {
        electron.app.on('before-quit', () => {
          resolve(true);
        });
      });
    });
    
    // Use Electron API to close the window
    await electronApp.evaluate((electron) => {
      electron.BrowserWindow.getAllWindows()[0].close();
    });
    
    // Wait for the close event
    await expect(closePromise).resolves.toBeTruthy();
  });
});

test.describe('Menu System', () => {
  test('should have application menu', async () => {
    const menu = await electronApp.evaluate((electron) => {
      return electron.Menu.getApplicationMenu();
    });
    expect(menu).not.toBeNull();
    expect(menu?.items).toHaveLength(4);
  });

  test('should have Invoices menu with correct items', async () => {
    const menu = await electronApp.evaluate((electron) => {
      return electron.Menu.getApplicationMenu();
    });
    
    const invoicesMenu = menu?.items[0];
    expect(invoicesMenu?.label).toBe('Invoices');
    expect(invoicesMenu?.submenu).toBeNull(); // No submenu for Invoices
  });

  test('should have Options menu with correct items', async () => {
    const menu = await electronApp.evaluate((electron) => {
      return electron.Menu.getApplicationMenu();
    });
    
    const optionsMenu = menu?.items[3]; // Options is the 4th item (index 3)
    expect(optionsMenu?.label).toBe('Options');
    expect(optionsMenu?.submenu?.items).toHaveLength(3); // Quit, DevTools, Settings
  });
});
