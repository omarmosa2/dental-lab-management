import { getDatabase, executeQuery, executeNonQuery, saveDatabase } from '../database/connection';
import { getHardwareIdService } from './HardwareIdService';
import log from 'electron-log';
import { BusinessRuleError, ValidationError } from '../utils/errors';
import * as crypto from 'crypto';

// Secret key - MUST match the one in generate-license-key.js
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';

export interface HardwareLicenseInfo {
  isActivated: boolean;
  hardwareId: string;
  activatedAt?: number;
  licenseKey?: string;
}

/**
 * Hardware-Bound License Service
 * 
 * This service manages license activation bound to specific hardware.
 * Each activation key works on one device only and cannot be transferred.
 */
export class HardwareLicenseService {
  private static instance: HardwareLicenseService;
  private hardwareIdService = getHardwareIdService();

  private constructor() {
    // Initialize service
  }

  static getInstance(): HardwareLicenseService {
    if (!HardwareLicenseService.instance) {
      HardwareLicenseService.instance = new HardwareLicenseService();
    }
    return HardwareLicenseService.instance;
  }

  /**
   * Get the current device's hardware ID
   */
  getHardwareId(): string {
    return this.hardwareIdService.getHardwareId();
  }

  /**
   * Verify if an activation key is valid for the current hardware
   */
  private verifyActivationKey(activationKey: string, hardwareId: string): boolean {
    try {
      const normalizedKey = activationKey.replace(/-/g, '').trim().toUpperCase();
      const normalizedHwId = hardwareId.trim().toUpperCase();
      
      // Generate expected key for this hardware ID
      const hmac = crypto.createHmac('sha256', SECRET_KEY);
      hmac.update(normalizedHwId);
      const signature = hmac.digest('hex');
      const expectedKey = signature.substring(0, 32).toUpperCase();
      
      // Compare keys
      const isValid = normalizedKey === expectedKey;
      log.info('License key verification:', { 
        hardwareId: normalizedHwId,
        isValid,
        keyLength: normalizedKey.length 
      });
      
      return isValid;
    } catch (error) {
      log.error('License key verification failed:', error);
      return false;
    }
  }

  /**
   * Check if license is activated and valid for this hardware
   */
  isLicenseActivated(): boolean {
    try {
      const currentHardwareId = this.getHardwareId();
      
      const result = executeQuery<{ 
        hardware_id: string;
        license_key: string;
        is_active: number;
      }>(
        'SELECT hardware_id, license_key, is_active FROM license WHERE id = 1',
        []
      );

      if (result.length === 0) {
        log.info('No license found in database');
        return false;
      }

      const license = result[0];
      
      // Check if active
      if (license.is_active !== 1) {
        log.info('License exists but is not active');
        return false;
      }

      // Verify hardware ID matches
      if (license.hardware_id !== currentHardwareId) {
        log.warn('Hardware ID mismatch!', {
          stored: license.hardware_id,
          current: currentHardwareId
        });
        return false;
      }

      // Verify activation key is valid for this hardware
      const isKeyValid = this.verifyActivationKey(license.license_key, currentHardwareId);
      
      if (!isKeyValid) {
        log.warn('Activation key is invalid for this hardware');
        return false;
      }

      log.info('License is activated and valid for this hardware');
      return true;
    } catch (error) {
      log.error('Failed to check license status:', error);
      return false;
    }
  }

  /**
   * Get license information
   */
  getLicenseInfo(): HardwareLicenseInfo {
    try {
      const currentHardwareId = this.getHardwareId();
      
      const result = executeQuery<{
        hardware_id: string;
        license_key: string;
        activated_at: number;
        is_active: number;
      }>(
        'SELECT hardware_id, license_key, activated_at, is_active FROM license WHERE id = 1',
        []
      );

      if (result.length === 0) {
        return {
          isActivated: false,
          hardwareId: currentHardwareId,
        };
      }

      const license = result[0];
      const hardwareMatches = license.hardware_id === currentHardwareId;
      const isKeyValid = this.verifyActivationKey(license.license_key, currentHardwareId);
      const isActivated = license.is_active === 1 && hardwareMatches && isKeyValid;

      return {
        isActivated,
        hardwareId: currentHardwareId,
        activatedAt: license.activated_at,
        licenseKey: license.license_key,
      };
    } catch (error) {
      log.error('Failed to get license info:', error);
      return {
        isActivated: false,
        hardwareId: this.getHardwareId(),
      };
    }
  }

  /**
   * Activate license with an activation key
   * The key must be valid for the current hardware ID
   */
  activateLicense(activationKey: string): void {
    try {
      const normalizedKey = activationKey.replace(/-/g, '').trim().toUpperCase();
      
      // Validate input
      if (!normalizedKey) {
        throw new ValidationError('يرجى إدخال مفتاح التفعيل');
      }

      if (normalizedKey.length !== 32) {
        throw new ValidationError('مفتاح التفعيل غير صحيح - الطول غير صحيح');
      }

      // Get current hardware ID
      const currentHardwareId = this.getHardwareId();
      log.info('Attempting activation for hardware:', currentHardwareId);

      // Verify the key is valid for this hardware
      if (!this.verifyActivationKey(normalizedKey, currentHardwareId)) {
        throw new BusinessRuleError('مفتاح التفعيل غير صالح لهذا الجهاز');
      }

      // Format key for display (XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)
      const formattedKey = normalizedKey.match(/.{1,4}/g)?.join('-') || normalizedKey;

      // Check if already activated
      const existing = executeQuery<{ id: number, hardware_id: string }>(
        'SELECT id, hardware_id FROM license WHERE id = 1',
        []
      );

      const activatedAt = Math.floor(Date.now() / 1000);

      if (existing.length > 0) {
        // Update existing license
        executeNonQuery(
          'UPDATE license SET hardware_id = ?, license_key = ?, activated_at = ?, is_active = 1 WHERE id = 1',
          [currentHardwareId, formattedKey, activatedAt]
        );
        log.info('License updated for hardware:', currentHardwareId);
      } else {
        // Insert new license with id=1
        executeNonQuery(
          'INSERT INTO license (id, hardware_id, license_key, activated_at, is_active) VALUES (1, ?, ?, ?, 1)',
          [currentHardwareId, formattedKey, activatedAt]
        );
        log.info('New license created for hardware:', currentHardwareId);
      }

      // Force save to disk immediately
      saveDatabase();
      log.info('Database saved after license activation');

      // Verify the license was saved correctly
      const verification = executeQuery<{ 
        hardware_id: string;
        license_key: string;
        is_active: number;
      }>(
        'SELECT hardware_id, license_key, is_active FROM license WHERE id = 1',
        []
      );
      
      log.info('License verification after activation:', verification);
      
      if (verification.length === 0 || verification[0].is_active !== 1) {
        throw new Error('فشل التحقق من تفعيل الترخيص في قاعدة البيانات');
      }
      
      if (verification[0].hardware_id !== currentHardwareId) {
        throw new Error('عدم تطابق معرف الجهاز بعد الحفظ');
      }

      if (verification[0].license_key !== formattedKey) {
        throw new Error('عدم تطابق مفتاح الترخيص بعد الحفظ');
      }

      log.info('License activated successfully and verified');
    } catch (error) {
      log.error('Failed to activate license:', error);
      throw error;
    }
  }

  /**
   * Deactivate license (for testing/admin purposes)
   */
  deactivateLicense(): void {
    try {
      executeNonQuery(
        'UPDATE license SET is_active = 0 WHERE id = 1',
        []
      );
      saveDatabase();
      log.info('License deactivated');
    } catch (error) {
      log.error('Failed to deactivate license:', error);
      throw error;
    }
  }
}

// Export singleton instance getter
export function getHardwareLicenseService(): HardwareLicenseService {
  return HardwareLicenseService.getInstance();
}