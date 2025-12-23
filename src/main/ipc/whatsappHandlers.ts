// whatsappHandlers.ts
// IPC handlers for WhatsApp integration
// Created: 2025-01-11

import { ipcMain } from 'electron';
import { getWhatsAppService } from '../core/services/WhatsAppService';
import { createQRCodeWindow, closeQRCodeWindow, isQRWindowOpen } from '../windows/QRCodeWindow';
import type { ApiResponse } from '../../shared/types/api.types';
import type { 
  WhatsAppSettings, 
  WhatsAppConnectionStatus,
  SendMessageRequest,
  SendMessageResponse,
  WhatsAppMessageLog,
  WhatsAppSettingsUpdateDto
} from '../../shared/types/whatsapp.types';
import log from 'electron-log';

const whatsAppService = getWhatsAppService();

// Helper to wrap handlers with error handling
function wrapHandler<T>(
  handler: () => Promise<T>
): Promise<ApiResponse<T>> {
  return handler()
    .then(data => ({ ok: true, data } as ApiResponse<T>))
    .catch(error => {
      log.error('WhatsApp handler error:', error);
      return {
        ok: false,
        error: {
          code: 'WHATSAPP_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      } as ApiResponse<T>;
    });
}

export function registerWhatsAppHandlers() {
  // ==================== Connection ====================
  
  ipcMain.handle('whatsapp:connect', async () => {
    log.info('IPC: whatsapp:connect');
    return wrapHandler(async () => {
      await whatsAppService.connect();
      
      // Don't auto-open QR window - QR will be shown in settings page
      // User can manually open window if needed via openQRWindow handler
      
      return { success: true };
    });
  });

  ipcMain.handle('whatsapp:openQRWindow', async () => {
    log.info('IPC: whatsapp:openQRWindow');
    return wrapHandler(async () => {
      if (!isQRWindowOpen()) {
        createQRCodeWindow();
      }
      return { success: true };
    });
  });

  ipcMain.handle('whatsapp:closeQRWindow', async () => {
    log.info('IPC: whatsapp:closeQRWindow');
    return wrapHandler(async () => {
      closeQRCodeWindow();
      return { success: true };
    });
  });

  ipcMain.handle('whatsapp:disconnect', async () => {
    log.info('IPC: whatsapp:disconnect');
    return wrapHandler(async () => {
      await whatsAppService.disconnect();
      
      // Close QR window if open
      closeQRCodeWindow();
      
      return { success: true };
    });
  });

  ipcMain.handle('whatsapp:reset', async () => {
    log.info('IPC: whatsapp:reset');
    return wrapHandler(async () => {
      await whatsAppService.resetConnection();
      
      // Close QR window if open
      closeQRCodeWindow();
      
      return { success: true };
    });
  });

  ipcMain.handle('whatsapp:getStatus', async () => {
    log.info('IPC: whatsapp:getStatus');
    return wrapHandler<WhatsAppConnectionStatus>(async () => {
      return whatsAppService.getConnectionStatus();
    });
  });

  // ==================== Messages ====================
  
  ipcMain.handle('whatsapp:sendMessage', async (_, request: SendMessageRequest) => {
    log.info('IPC: whatsapp:sendMessage', { phoneNumber: request.phoneNumber });
    return wrapHandler<SendMessageResponse>(async () => {
      return whatsAppService.sendMessage(request);
    });
  });

  ipcMain.handle('whatsapp:getMessageLogs', async (_, limit?: number, offset?: number) => {
    log.info('IPC: whatsapp:getMessageLogs', { limit, offset });
    return wrapHandler<WhatsAppMessageLog[]>(async () => {
      return whatsAppService.getMessageLogs(limit, offset);
    });
  });

  // ==================== Settings ====================
  
  ipcMain.handle('whatsapp:getSettings', async () => {
    log.info('IPC: whatsapp:getSettings');
    return wrapHandler<WhatsAppSettings | null>(async () => {
      return whatsAppService.getSettings();
    });
  });

  ipcMain.handle('whatsapp:updateSettings', async (_, updates: WhatsAppSettingsUpdateDto) => {
    log.info('IPC: whatsapp:updateSettings', updates);
    return wrapHandler<WhatsAppSettings | null>(async () => {
      return whatsAppService.updateSettings(updates);
    });
  });

  log.info('WhatsApp IPC handlers registered');
}