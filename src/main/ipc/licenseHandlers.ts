// licenseHandlers.ts
// IPC handlers for simple license management

import { ipcMain } from 'electron';
import { getSimpleLicenseService } from '../core/services/SimpleLicenseService';
import type { ApiResponse } from '../../shared/types/api.types';
import log from 'electron-log';

const licenseService = getSimpleLicenseService();

// Helper to wrap handlers with error handling
function wrapHandler<T>(
  handler: () => Promise<T> | T
): Promise<ApiResponse<T>> {
  try {
    const result = handler();
    if (result instanceof Promise) {
      return result
        .then(data => ({ ok: true, data } as ApiResponse<T>))
        .catch(error => {
          log.error('License handler error:', error);
          return {
            ok: false,
            error: {
              code: 'LICENSE_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          } as ApiResponse<T>;
        });
    }
    return Promise.resolve({ ok: true, data: result } as ApiResponse<T>);
  } catch (error) {
    log.error('License handler error:', error);
    return Promise.resolve({
      ok: false,
      error: {
        code: 'LICENSE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    } as ApiResponse<T>);
  }
}

export function registerLicenseHandlers() {
  // Get machine ID
  ipcMain.handle('license:getMachineId', async () => {
    log.info('IPC: license:getMachineId');
    return wrapHandler(() => {
      return licenseService.getMachineId();
    });
  });

  // Get license info
  ipcMain.handle('license:getInfo', async () => {
    log.info('IPC: license:getInfo');
    return wrapHandler(() => {
      return licenseService.getLicenseInfo();
    });
  });

  // Check if license is activated
  ipcMain.handle('license:isActivated', async () => {
    log.info('IPC: license:isActivated');
    return wrapHandler(() => {
      const isActivated = licenseService.isLicenseActivated();
      const info = licenseService.getLicenseInfo();
      log.info('License check result:', { 
        isActivated, 
        machineId: info.machineId,
        hasKey: !!info.licenseKey 
      });
      return isActivated;
    });
  });

  // Activate license with license key
  ipcMain.handle('license:activate', async (_, licenseKey: string) => {
    log.info('IPC: license:activate', { keyLength: licenseKey?.length });
    return wrapHandler(async () => {
      log.info('========== LICENSE ACTIVATION START ==========');
      
      // Activate license (includes saves and verification)
      licenseService.activateLicense(licenseKey);
      log.info('License service activation completed');
      
      // Wait for filesystem sync
      log.info('Waiting 500ms for filesystem sync...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // First verification check
      log.info('Running first verification check...');
      let isActivated = licenseService.isLicenseActivated();
      let licenseInfo = licenseService.getLicenseInfo();
      log.info('First verification result:', { isActivated, info: licenseInfo });
      
      if (!isActivated) {
        // Wait and try one more time
        log.warn('First verification failed, waiting 300ms and retrying...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        isActivated = licenseService.isLicenseActivated();
        licenseInfo = licenseService.getLicenseInfo();
        log.info('Second verification result:', { isActivated, info: licenseInfo });
      }
      
      if (!isActivated) {
        log.error('========== LICENSE ACTIVATION FAILED ==========');
        log.error('Final license info:', licenseInfo);
        throw new Error('فشل التحقق من تفعيل الترخيص - يرجى المحاولة مرة أخرى أو الاتصال بالدعم');
      }
      
      log.info('========== LICENSE ACTIVATION SUCCESS ==========');
      log.info('Final license info:', licenseInfo);
      
      return { success: true };
    });
  });

  // Deactivate license (for testing/admin purposes)
  ipcMain.handle('license:deactivate', async () => {
    log.info('IPC: license:deactivate');
    return wrapHandler(() => {
      licenseService.deactivateLicense();
      return { success: true };
    });
  });

  log.info('Simple License IPC handlers registered');
}