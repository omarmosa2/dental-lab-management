"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const connection_1 = require("./main/core/database/connection");
const migrationRunner_1 = require("./main/core/database/migrationRunner");
const handlers_1 = require("./main/ipc/handlers");
const BackupService_1 = require("./main/core/services/BackupService");
const WhatsAppService_1 = require("./main/core/services/WhatsAppService");
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    electron_1.app.quit();
}
// Configure logging
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.transports.console.level = 'debug';
const createWindow = () => {
    const path = require('path');
    const isDev = process.env.NODE_ENV === 'development';
    // Use the webpack-provided preload path in dev *if* it's available, otherwise fall back to packaged preload
    const preloadPath = isDev && typeof MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY !== 'undefined'
        ? MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
        : path.join(__dirname, 'preload.js');
    // Debugging: log which preload path will be used
    electron_log_1.default.info('Using preload path:', preloadPath);
    // Determine correct icon path for both development and production
    const iconPath = electron_1.app.isPackaged
        ? path.join(process.resourcesPath, 'assets', 'icon.ico')
        : path.join(__dirname, '..', 'assets', 'icon.ico');
    electron_log_1.default.info('Using icon path:', iconPath);
    // Create the browser window.
    const mainWindow = new electron_1.BrowserWindow({
        height: 800,
        width: 1200,
        icon: iconPath,
        title: 'AgorraLab',
        // Hide the menu bar automatically (useful for Windows builds)
        autoHideMenuBar: true,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Ensure the menu bar is not visible
    mainWindow.setMenuBarVisibility(false);
    // Set Content Security Policy
    // Note: 'unsafe-eval' is required for sql.js WASM to work properly
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': process.env.NODE_ENV === 'development'
                    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
                    : "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';"
            }
        });
    });
    // and load the index.html of the app.
    // In development, prefer the webpack-provided entry if available, otherwise use Vite dev server
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    const loadUrl = isDev
        ? (typeof MAIN_WINDOW_WEBPACK_ENTRY !== 'undefined' ? MAIN_WINDOW_WEBPACK_ENTRY : devServerUrl)
        : `file://${path.join(__dirname, '../dist/index.html')}`;
    electron_log_1.default.info('Loading renderer URL:', loadUrl);
    mainWindow.loadURL(loadUrl);
    // Open the DevTools.
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
};
// Initialize database and migrations before creating window
async function initializeApp() {
    try {
        electron_log_1.default.info('Initializing application...');
        // Initialize database
        await (0, connection_1.initDatabase)();
        electron_log_1.default.info('Database initialized');
        // Run migrations
        await (0, migrationRunner_1.runMigrations)();
        electron_log_1.default.info('Migrations completed');
        // Register IPC handlers
        (0, handlers_1.registerIpcHandlers)();
        electron_log_1.default.info('IPC handlers registered');
        // Initialize auto backup if enabled
        const backupService = new BackupService_1.BackupService();
        await backupService.checkAndRunAutoBackup();
        electron_log_1.default.info('Auto backup initialized');
        // Initialize WhatsApp service (will auto-restore session if exists)
        const whatsAppService = (0, WhatsAppService_1.getWhatsAppService)();
        await whatsAppService.initialize();
        electron_log_1.default.info('WhatsApp service initialized');
        // Create window
        createWindow();
        electron_log_1.default.info('Application initialized successfully');
    }
    catch (error) {
        electron_log_1.default.error('Failed to initialize application:', error);
        electron_1.app.quit();
    }
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', initializeApp);
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        (0, connection_1.closeDatabase)();
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Save database before quitting
electron_1.app.on('before-quit', () => {
    electron_log_1.default.info('Application quitting, closing database...');
    (0, connection_1.closeDatabase)();
});
