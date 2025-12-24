"use strict";
// licenseHandlers.ts
// IPC handlers for simple license management
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLicenseHandlers = registerLicenseHandlers;
const electron_1 = require("electron");
const SimpleLicenseService_1 = require("../core/services/SimpleLicenseService");
const electron_log_1 = __importDefault(require("electron-log"));
const licenseService = (0, SimpleLicenseService_1.getSimpleLicenseService)();
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
    // Get machine ID
    electron_1.ipcMain.handle('license:getMachineId', async () => {
        electron_log_1.default.info('IPC: license:getMachineId');
        return wrapHandler(() => {
            return licenseService.getMachineId();
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
                machineId: info.machineId,
                hasKey: !!info.licenseKey
            });
            return isActivated;
        });
    });
    // Activate license with license key
    electron_1.ipcMain.handle('license:activate', async (_, licenseKey) => {
        electron_log_1.default.info('IPC: license:activate', { keyLength: licenseKey?.length });
        return wrapHandler(async () => {
            electron_log_1.default.info('========== LICENSE ACTIVATION START ==========');
            // Activate license (includes saves and verification)
            licenseService.activateLicense(licenseKey);
            electron_log_1.default.info('License service activation completed');
            // Wait for filesystem sync
            electron_log_1.default.info('Waiting 500ms for filesystem sync...');
            await new Promise(resolve => setTimeout(resolve, 500));
            // First verification check
            electron_log_1.default.info('Running first verification check...');
            let isActivated = licenseService.isLicenseActivated();
            let licenseInfo = licenseService.getLicenseInfo();
            electron_log_1.default.info('First verification result:', { isActivated, info: licenseInfo });
            if (!isActivated) {
                // Wait and try one more time
                electron_log_1.default.warn('First verification failed, waiting 300ms and retrying...');
                await new Promise(resolve => setTimeout(resolve, 300));
                isActivated = licenseService.isLicenseActivated();
                licenseInfo = licenseService.getLicenseInfo();
                electron_log_1.default.info('Second verification result:', { isActivated, info: licenseInfo });
            }
            if (!isActivated) {
                electron_log_1.default.error('========== LICENSE ACTIVATION FAILED ==========');
                electron_log_1.default.error('Final license info:', licenseInfo);
                throw new Error('فشل التحقق من تفعيل الترخيص - يرجى المحاولة مرة أخرى أو الاتصال بالدعم');
            }
            electron_log_1.default.info('========== LICENSE ACTIVATION SUCCESS ==========');
            electron_log_1.default.info('Final license info:', licenseInfo);
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
    electron_log_1.default.info('Simple License IPC handlers registered');
}
