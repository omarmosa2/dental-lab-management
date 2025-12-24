"use strict";
// licenseHandlers.ts
// IPC handlers for hardware-bound license management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLicenseHandlers = registerLicenseHandlers;
const electron_1 = require("electron");
const HardwareLicenseService_1 = require("../core/services/HardwareLicenseService");
const electron_log_1 = __importDefault(require("electron-log"));
const licenseService = (0, HardwareLicenseService_1.getHardwareLicenseService)();
// Helper to wrap handlers with error handling
function wrapHandler(handler) {
    try {
        const result = handler();
        if (result instanceof Promise) {
            return result
                .then(data => ({ ok: true, data }))
                .catch(error => {
                electron_log_1.default.error('License handler error:', error);
                return {
                    ok: false,
                    error: {
                        code: 'LICENSE_ERROR',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                };
            });
        }
        return Promise.resolve({ ok: true, data: result });
    }
    catch (error) {
        electron_log_1.default.error('License handler error:', error);
        return Promise.resolve({
            ok: false,
            error: {
                code: 'LICENSE_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        });
    }
}
function registerLicenseHandlers() {
    // Get hardware ID
    electron_1.ipcMain.handle('license:getHardwareId', async () => {
        electron_log_1.default.info('IPC: license:getHardwareId');
        return wrapHandler(() => {
            return licenseService.getHardwareId();
        });
    });
    // Get license info
    electron_1.ipcMain.handle('license:getInfo', async () => {
        electron_log_1.default.info('IPC: license:getInfo');
        return wrapHandler(() => {
            return licenseService.getLicenseInfo();
        });
    });
    // Check if license is activated
    electron_1.ipcMain.handle('license:isActivated', async () => {
        electron_log_1.default.info('IPC: license:isActivated');
        return wrapHandler(() => {
            const isActivated = licenseService.isLicenseActivated();
            const info = licenseService.getLicenseInfo();
            electron_log_1.default.info('License check result:', {
                isActivated,
                hardwareId: info.hardwareId,
                hasKey: !!info.licenseKey
            });
            return isActivated;
        });
    });
    // Activate license with activation key
    electron_1.ipcMain.handle('license:activate', async (_, activationKey) => {
        electron_log_1.default.info('IPC: license:activate', { keyLength: activationKey?.length });
        return wrapHandler(async () => {
            // Activate license with activation key
            licenseService.activateLicense(activationKey);
            // Wait a moment for filesystem operations to complete
            await new Promise(resolve => setTimeout(resolve, 200));
            // Double-check activation status
            const isActivated = licenseService.isLicenseActivated();
            electron_log_1.default.info('License activation verification:', { isActivated });
            // Get full license info for debugging
            const licenseInfo = licenseService.getLicenseInfo();
            electron_log_1.default.info('License info after activation:', licenseInfo);
            if (!isActivated) {
                throw new Error('License activation failed - verification check returned false');
            }
            return { success: true };
        });
    });
    // Deactivate license (for testing/admin purposes)
    electron_1.ipcMain.handle('license:deactivate', async () => {
        electron_log_1.default.info('IPC: license:deactivate');
        return wrapHandler(() => {
            licenseService.deactivateLicense();
            return { success: true };
        });
    });
    electron_log_1.default.info('Hardware-bound License IPC handlers registered');
}
