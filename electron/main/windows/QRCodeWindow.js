"use strict";
// QRCodeWindow.ts
// Manages the QR Code display window for WhatsApp authentication
// Created: 2025-01-11
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQRCodeWindow = createQRCodeWindow;
exports.getQRCodeWindow = getQRCodeWindow;
exports.closeQRCodeWindow = closeQRCodeWindow;
exports.sendToQRWindow = sendToQRWindow;
exports.isQRWindowOpen = isQRWindowOpen;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
let qrWindow = null;
function createQRCodeWindow() {
    electron_log_1.default.info('Creating QR Code window...');
    // Close existing window if any
    if (qrWindow && !qrWindow.isDestroyed()) {
        qrWindow.close();
    }
    // Get primary display dimensions
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    // Create window in center of screen
    // Determine preload and entry URLs, falling back to packaged files if webpack constants are not present
    const preloadPath = typeof MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY !== 'undefined'
        ? MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
        : path_1.default.join(__dirname, 'preload.js');
    qrWindow = new electron_1.BrowserWindow({
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
        : `file://${path_1.default.join(__dirname, '../dist/index.html')}#/qr-code`;
    electron_log_1.default.info('Loading QR Code URL:', mainEntry);
    qrWindow.loadURL(mainEntry).catch(err => {
        electron_log_1.default.error('Failed to load QR Code window:', err);
    });
    // Open DevTools in development for debugging
    if (process.env.NODE_ENV === 'development') {
        qrWindow.webContents.openDevTools();
    }
    // Handle window close
    qrWindow.on('closed', () => {
        electron_log_1.default.info('QR Code window closed');
        qrWindow = null;
    });
    electron_log_1.default.info('QR Code window created successfully');
    return qrWindow;
}
function getQRCodeWindow() {
    return qrWindow;
}
function closeQRCodeWindow() {
    if (qrWindow && !qrWindow.isDestroyed()) {
        electron_log_1.default.info('Closing QR Code window...');
        qrWindow.close();
        qrWindow = null;
    }
}
function sendToQRWindow(channel, data) {
    if (qrWindow && !qrWindow.isDestroyed()) {
        qrWindow.webContents.send(channel, data);
    }
}
function isQRWindowOpen() {
    return qrWindow !== null && !qrWindow.isDestroyed();
}
