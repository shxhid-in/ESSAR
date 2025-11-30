#!/usr/bin/env node

/**
 * Clean dist folder script
 * Handles file locking issues on Windows by retrying deletions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(process.cwd(), 'dist');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function removeDir(dirPath, retries = 5) {
  if (!fs.existsSync(dirPath)) {
    console.log('✓ Dist folder does not exist, nothing to clean');
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      // Try to remove the directory
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log('✓ Successfully cleaned dist folder');
      return;
    } catch (error) {
      if (error.code === 'EBUSY' || error.code === 'ENOENT' || error.code === 'EPERM') {
        if (i < retries - 1) {
          console.log(`⚠ File locked, retrying in 1 second... (${i + 1}/${retries})`);
          await sleep(1000);
        } else {
          console.error('✗ Failed to clean dist folder after multiple attempts');
          console.error('  Please make sure:');
          console.error('  1. The application is not running');
          console.error('  2. No file explorer windows are open in the dist folder');
          console.error('  3. Antivirus is not scanning the folder');
          console.error('\n  You can manually delete the "dist" folder and try again.');
          process.exit(1);
        }
      } else {
        throw error;
      }
    }
  }
}

removeDir(distPath).catch(error => {
  console.error('✗ Error cleaning dist folder:', error.message);
  process.exit(1);
});

