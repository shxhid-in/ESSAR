import { BrowserWindow, Menu, app } from 'electron';
import { isDev } from './util.js';

export function createMenu(mainWindow: BrowserWindow) {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate(
      [
      {
        label: 'Invoices',
        click: () => {
          mainWindow.webContents.send('navigate', 'invoices'); }
      },
      {
        label: 'Customers',
        click: () => {
          mainWindow.webContents.send('navigate', 'customers');}
      },
      {
        label: 'Incentives',
        click: () => {
          mainWindow.webContents.send('navigate', 'incentives');
        }
      },
      {
        label: 'Analytics',
        click: () => {
          mainWindow.webContents.send('navigate', 'reports');
        }
      },
      {
        label: process.platform === 'darwin' ? undefined : 'Options',
        type: 'submenu',
        submenu: [
          {
            label: 'Import/Export',
            click: () => {
              mainWindow.webContents.send('open-import-export-modal');
            }
          },
          {
            label: 'Settings',
            click: () => { mainWindow.webContents.send('navigate', 'settings'); }
          },
          {
            type: 'separator'
          },
          {
            label: 'DevTools',
            click: () => mainWindow.webContents.openDevTools(),
            visible: isDev(),
          },
          {
            label: 'Quit',
            click: app.quit,
          }
        ],
      }
      ]
    )
  );
}
