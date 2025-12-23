"use strict";
// whatsappHandlers.ts
// IPC handlers for WhatsApp integration
// Created: 2025-01-11
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWhatsAppHandlers = registerWhatsAppHandlers;
const electron_1 = require("electron");
const WhatsAppService_1 = require("../core/services/WhatsAppService");
const QRCodeWindow_1 = require("../windows/QRCodeWindow");
const electron_log_1 = __importDefault(require("electron-log"));
const whatsAppService = (0, WhatsAppService_1.getWhatsAppService)();
// Helper to wrap handlers with error handling
function wrapHandler(handler) {
    return handler()
        .then(data => ({ ok: true, data }))
        .catch(error => {
        electron_log_1.default.error('WhatsApp handler error:', error);
        return {
            ok: false,
            error: {
                code: 'WHATSAPP_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    });
}
function registerWhatsAppHandlers() {
    // ==================== Connection ====================
    electron_1.ipcMain.handle('whatsapp:connect', async () => {
        electron_log_1.default.info('IPC: whatsapp:connect');
        return wrapHandler(async () => {
            await whatsAppService.connect();
            // Don't auto-open QR window - QR will be shown in settings page
            // User can manually open window if needed via openQRWindow handler
            return { success: true };
        });
    });
    electron_1.ipcMain.handle('whatsapp:openQRWindow', async () => {
        electron_log_1.default.info('IPC: whatsapp:openQRWindow');
        return wrapHandler(async () => {
            if (!(0, QRCodeWindow_1.isQRWindowOpen)()) {
                (0, QRCodeWindow_1.createQRCodeWindow)();
            }
            return { success: true };
        });
    });
    electron_1.ipcMain.handle('whatsapp:closeQRWindow', async () => {
        electron_log_1.default.info('IPC: whatsapp:closeQRWindow');
        return wrapHandler(async () => {
            (0, QRCodeWindow_1.closeQRCodeWindow)();
            return { success: true };
        });
    });
    electron_1.ipcMain.handle('whatsapp:disconnect', async () => {
        electron_log_1.default.info('IPC: whatsapp:disconnect');
        return wrapHandler(async () => {
            await whatsAppService.disconnect();
            // Close QR window if open
            (0, QRCodeWindow_1.closeQRCodeWindow)();
            return { success: true };
        });
    });
    electron_1.ipcMain.handle('whatsapp:reset', async () => {
        electron_log_1.default.info('IPC: whatsapp:reset');
        return wrapHandler(async () => {
            await whatsAppService.resetConnection();
            // Close QR window if open
            (0, QRCodeWindow_1.closeQRCodeWindow)();
            return { success: true };
        });
    });
    electron_1.ipcMain.handle('whatsapp:getStatus', async () => {
        electron_log_1.default.info('IPC: whatsapp:getStatus');
        return wrapHandler(async () => {
            return whatsAppService.getConnectionStatus();
        });
    });
    // ==================== Messages ====================
    electron_1.ipcMain.handle('whatsapp:sendMessage', async (_, request) => {
        electron_log_1.default.info('IPC: whatsapp:sendMessage', { phoneNumber: request.phoneNumber });
        return wrapHandler(async () => {
            return whatsAppService.sendMessage(request);
        });
    });
    electron_1.ipcMain.handle('whatsapp:getMessageLogs', async (_, limit, offset) => {
        electron_log_1.default.info('IPC: whatsapp:getMessageLogs', { limit, offset });
        return wrapHandler(async () => {
            return whatsAppService.getMessageLogs(limit, offset);
        });
    });
    // ==================== Settings ====================
    electron_1.ipcMain.handle('whatsapp:getSettings', async () => {
        electron_log_1.default.info('IPC: whatsapp:getSettings');
        return wrapHandler(async () => {
            return whatsAppService.getSettings();
        });
    });
    electron_1.ipcMain.handle('whatsapp:updateSettings', async (_, updates) => {
        electron_log_1.default.info('IPC: whatsapp:updateSettings', updates);
        return wrapHandler(async () => {
            return whatsAppService.updateSettings(updates);
        });
    });
    electron_log_1.default.info('WhatsApp IPC handlers registered');
}
