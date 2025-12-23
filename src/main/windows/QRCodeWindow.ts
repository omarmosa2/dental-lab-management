// QRCodeWindow.ts
// Manages the QR Code display window for WhatsApp authentication
// Created: 2025-01-11

import { BrowserWindow, screen } from 'electron';
import path from 'path';
import log from 'electron-log';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let qrWindow: BrowserWindow | null = null;

export function createQRCodeWindow(): BrowserWindow {
  log.info('Creating QR Code window...');

  // Close existing window if any
  if (qrWindow && !qrWindow.isDestroyed()) {
    qrWindow.close();
  }

  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create window in center of screen
  // Determine preload and entry URLs, falling back to packaged files if webpack constants are not present
  const preloadPath = typeof MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY !== 'undefined'
    ? MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    : path.join(__dirname, 'preload.js');

  qrWindow = new BrowserWindow({
    width: 450,
    height: 600,
    x: Math.floor((width - 450) / 2),
    y: Math.floor((height - 600) / 2),
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    title: 'الاتصال بـ WhatsApp',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // Load the QR code page with hash routing. Fallback to packaged index.html if not available.
  const mainEntry = typeof MAIN_WINDOW_WEBPACK_ENTRY !== 'undefined'
    ? `${MAIN_WINDOW_WEBPACK_ENTRY}#/qr-code`
    : `file://${path.join(__dirname, '../dist/index.html')}#/qr-code`;

  log.info('Loading QR Code URL:', mainEntry);
  
  qrWindow.loadURL(mainEntry).catch(err => {
    log.error('Failed to load QR Code window:', err);
  });
  
  // Open DevTools in development for debugging
  if (process.env.NODE_ENV === 'development') {
    qrWindow.webContents.openDevTools();
  }

  // Handle window close
  qrWindow.on('closed', () => {
    log.info('QR Code window closed');
    qrWindow = null;
  });

  log.info('QR Code window created successfully');
  return qrWindow;
}

export function getQRCodeWindow(): BrowserWindow | null {
  return qrWindow;
}

export function closeQRCodeWindow(): void {
  if (qrWindow && !qrWindow.isDestroyed()) {
    log.info('Closing QR Code window...');
    qrWindow.close();
    qrWindow = null;
  }
}

export function sendToQRWindow(channel: string, data: any): void {
  if (qrWindow && !qrWindow.isDestroyed()) {
    qrWindow.webContents.send(channel, data);
  }
}

export function isQRWindowOpen(): boolean {
  return qrWindow !== null && !qrWindow.isDestroyed();
}