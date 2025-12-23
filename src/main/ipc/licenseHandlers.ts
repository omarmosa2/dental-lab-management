// licenseHandlers.ts
// IPC handlers for license management
// Created: 2025-01-11

import { ipcMain } from 'electron';
import { getLicenseService } from '../core/services/LicenseService';
import type { ApiResponse } from '../../shared/types/api.types';
import log from 'electron-log';

const licenseService = getLicenseService();

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
      log.info('License check result:', { isActivated, hardwareId: info.hardwareId, hasKey: !!info.licenseKey });
      return isActivated;
    });
  });

  // Activate license
  ipcMain.handle('license:activate', async (_, licenseKey: string) => {
    log.info('IPC: license:activate', { licenseKey: licenseKey.substring(0, 15) + '...' });
    return wrapHandler(async () => {
      // Activate license
      licenseService.activateLicense(licenseKey);
      
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

  // Generate license key (for developer/admin use)
  ipcMain.handle('license:generateKey', async (_, hardwareId: string) => {
    log.info('IPC: license:generateKey');
    return wrapHandler(() => {
      return licenseService.generateLicenseKey(hardwareId);
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

  log.info('License IPC handlers registered');
}

