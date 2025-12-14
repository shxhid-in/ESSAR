import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { isDev } from './util.js';

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev() ? '.' : '..',
    '/dist-electron/preload.cjs'
  );
}

export function getUIPath() {
  return path.join(app.getAppPath(), '/dist-react/index.html');
}

export function getAssetPath() {
  if (isDev()) {
    // In development, assets are in src/assets relative to project root
    return path.join(app.getAppPath(), 'src', 'assets');
  } else {
    // In production, extraResources files are in resources directory
    // extraResources: ["src/assets/**"] places files at resources/src/assets/
    // Try multiple possible locations
    const possiblePaths = [
      path.join(process.resourcesPath || '', 'src', 'assets'), // Standard resources path
      path.join(path.dirname(app.getPath('exe')), 'resources', 'src', 'assets'), // Portable/development build
      path.join(app.getAppPath(), '..', 'resources', 'src', 'assets'), // Relative to app path
      path.join(app.getAppPath(), 'src', 'assets'), // Fallback to app path
    ];
    
    // Return the first path that exists, or the first one as default
    for (const assetPath of possiblePaths) {
      if (fs.existsSync(assetPath)) {
        return assetPath;
      }
    }
    
    // If none exist, return the most likely one
    return possiblePaths[0];
  }
}
