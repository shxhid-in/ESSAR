import { BrowserWindow, Menu, Tray, app } from 'electron';
import { getAssetPath } from './pathResolver.js';
import path from 'path';

export function createTray(mainWindow: BrowserWindow) {
  const tray = new Tray(
    path.join(
      getAssetPath(),
      process.platform === 'darwin' ? 'trayIconTemplate.png' : 'trayIcon.png'
    )
  );

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { 
      label: 'New Invoice', 
      click: () => mainWindow.webContents.send('navigate', 'invoice') 
    },
      {
        label: 'Quit',
        click: () => app.quit(),
      },
    ])
  );
}
