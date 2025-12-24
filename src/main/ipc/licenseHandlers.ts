// licenseHandlers.ts
// IPC handlers for hardware-bound license management

import { ipcMain } from 'electron';
import { getHardwareLicenseService } from '../core/services/HardwareLicenseService';
import type { ApiResponse } from '../../shared/types/api.types';
import log from 'electron-log';

const licenseService = getHardwareLicenseService();

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
  // Get hardware ID
  ipcMain.handle('license:getHardwareId', async () => {
    log.info('IPC: license:getHardwareId');
    return wrapHandler(() => {
      return licenseService.getHardwareId();
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
        hardwareId: info.hardwareId,
        hasKey: !!info.licenseKey 
      });
      return isActivated;
    });
  });

  // Activate license with activation key
  ipcMain.handle('license:activate', async (_, activationKey: string) => {
    log.info('IPC: license:activate', { keyLength: activationKey?.length });
    return wrapHandler(async () => {
      // Activate license with activation key
      licenseService.activateLicense(activationKey);
      
      // Wait a moment for filesystem operations to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Double-check activation status
      const isActivated = licenseService.isLicenseActivated();
      log.info('License activation verification:', { isActivated });
      
      // Get full license info for debugging
      const licenseInfo = licenseService.getLicenseInfo();
      log.info('License info after activation:', licenseInfo);
      
      if (!isActivated) {
        throw new Error('License activation failed - verification check returned false');
      }
      
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

  log.info('Hardware-bound License IPC handlers registered');
}