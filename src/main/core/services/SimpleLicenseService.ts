import { getDatabase, executeQuery, executeNonQuery, saveDatabase } from '../database/connection';
import log from 'electron-log';
import { BusinessRuleError, ValidationError } from '../utils/errors';
import * as crypto from 'crypto';
import { execSync } from 'child_process';

// Secret key for license generation
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';

export interface SimpleLicenseInfo {
  isActivated: boolean;
  machineId: string;
  activatedAt?: number;
  licenseKey?: string;
}

/**
 * Simple License Service
 * 
 * Uses Windows Machine GUID as the unique identifier.
 * Each license key is bound to a specific Machine GUID.
 */
export class SimpleLicenseService {
  private static instance: SimpleLicenseService;
  private cachedMachineId: string | null = null;

  private constructor() {
    // Initialize service
  }

  static getInstance(): SimpleLicenseService {
    if (!SimpleLicenseService.instance) {
      SimpleLicenseService.instance = new SimpleLicenseService();
    }
    return SimpleLicenseService.instance;
  }

  /**
   * Get Machine GUID from Windows Registry (most reliable method)
   */
  getMachineId(): string {
    if (this.cachedMachineId) {
      return this.cachedMachineId;
    }

    try {
      log.info('Getting Machine GUID from Windows Registry...');
      
      const regCommand = 'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid';
      const regOutput = execSync(regCommand, { 
        encoding: 'utf-8', 
        timeout: 5000,
        windowsHide: true 
      });
      
      const match = regOutput.match(/MachineGuid\s+REG_SZ\s+([A-Fa-f0-9-]+)/);
      
      if (match && match[1]) {
        const machineGuid = match[1].trim().toUpperCase();
        this.cachedMachineId = machineGuid;
        log.info('✅ Machine GUID retrieved:', machineGuid);
        return machineGuid;
      }
      
      throw new Error('Could not parse Machine GUID from registry');
    } catch (error) {
      log.error('❌ Failed to get Machine GUID:', error);
      throw new Error('فشل الحصول على معرف الجهاز. يرجى تشغيل التطبيق كمسؤول.');
    }
  }

  /**
   * Verify if a license key is valid for the current machine
   */
  private verifyLicenseKey(licenseKey: string, machineId: string): boolean {
    try {
      const normalizedKey = licenseKey.replace(/-/g, '').trim().toUpperCase();
      const normalizedMachineId = machineId.trim().toUpperCase();
      
      // Generate expected key for this machine ID
      const hmac = crypto.createHmac('sha256', SECRET_KEY);
      hmac.update(normalizedMachineId);
      const signature = hmac.digest('hex');
      const expectedKey = signature.substring(0, 32).toUpperCase();
      
      // Compare keys
      const isValid = normalizedKey === expectedKey;
      log.info('License key verification:', { 
        machineId: normalizedMachineId,
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
   * Check if license is activated and valid for this machine
   */
  isLicenseActivated(): boolean {
    try {
      const currentMachineId = this.getMachineId();
      
      const result = executeQuery<{ 
        machine_id: string;
        license_key: string;
        is_active: number;
      }>(
        'SELECT machine_id, license_key, is_active FROM license WHERE id = 1',
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

      // Verify machine ID matches
      if (license.machine_id !== currentMachineId) {
        log.warn('Machine ID mismatch!', {
          stored: license.machine_id,
          current: currentMachineId
        });
        return false;
      }

      // Verify license key is valid for this machine
      const isKeyValid = this.verifyLicenseKey(license.license_key, currentMachineId);
      
      if (!isKeyValid) {
        log.warn('License key is invalid for this machine');
        return false;
      }

      log.info('✅ License is activated and valid for this machine');
      return true;
    } catch (error) {
      log.error('Failed to check license status:', error);
      return false;
    }
  }

  /**
   * Get license information
   */
  getLicenseInfo(): SimpleLicenseInfo {
    try {
      const currentMachineId = this.getMachineId();
      
      const result = executeQuery<{
        machine_id: string;
        license_key: string;
        activated_at: number;
        is_active: number;
      }>(
        'SELECT machine_id, license_key, activated_at, is_active FROM license WHERE id = 1',
        []
      );

      if (result.length === 0) {
        return {
          isActivated: false,
          machineId: currentMachineId,
        };
      }

      const license = result[0];
      const machineMatches = license.machine_id === currentMachineId;
      const isKeyValid = this.verifyLicenseKey(license.license_key, currentMachineId);
      const isActivated = license.is_active === 1 && machineMatches && isKeyValid;

      return {
        isActivated,
        machineId: currentMachineId,
        activatedAt: license.activated_at,
        licenseKey: license.license_key,
      };
    } catch (error) {
      log.error('Failed to get license info:', error);
      return {
        isActivated: false,
        machineId: this.getMachineId(),
      };
    }
  }

  /**
   * Activate license with a license key
   * The key must be valid for the current machine ID
   */
  activateLicense(licenseKey: string): void {
    try {
      const normalizedKey = licenseKey.replace(/-/g, '').trim().toUpperCase();
      
      // Validate input
      if (!normalizedKey) {
        throw new ValidationError('يرجى إدخال مفتاح الترخيص');
      }

      if (normalizedKey.length !== 32) {
        throw new ValidationError('مفتاح الترخيص غير صحيح - الطول غير صحيح');
      }

      // Get current machine ID
      const currentMachineId = this.getMachineId();
      log.info('Attempting activation for machine:', currentMachineId);

      // Verify the key is valid for this machine
      if (!this.verifyLicenseKey(normalizedKey, currentMachineId)) {
        throw new BusinessRuleError('مفتاح الترخيص غير صالح لهذا الجهاز');
      }

      // Format key for display
      const formattedKey = normalizedKey.match(/.{1,4}/g)?.join('-') || normalizedKey;

      // Check if already activated
      const existing = executeQuery<{ id: number, machine_id: string }>(
        'SELECT id, machine_id FROM license WHERE id = 1',
        []
      );

      const activatedAt = Math.floor(Date.now() / 1000);

      if (existing.length > 0) {
        // Update existing license
        executeNonQuery(
          'UPDATE license SET machine_id = ?, license_key = ?, activated_at = ?, is_active = 1 WHERE id = 1',
          [currentMachineId, formattedKey, activatedAt]
        );
        log.info('License updated for machine:', currentMachineId);
      } else {
        // Insert new license with id=1
        executeNonQuery(
          'INSERT INTO license (id, machine_id, license_key, activated_at, is_active) VALUES (1, ?, ?, ?, 1)',
          [currentMachineId, formattedKey, activatedAt]
        );
        log.info('New license created for machine:', currentMachineId);
      }

      // Save with double save for reliability
      log.info('Starting database save sequence...');
      saveDatabase();
      log.info('First save completed');
      
      saveDatabase();
      log.info('Second save completed');

      // Verify the license was saved correctly
      let verificationSuccess = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        log.info(`Verification attempt ${attempt}/3...`);
        
        const verification = executeQuery<{ 
          machine_id: string;
          license_key: string;
          is_active: number;
        }>(
          'SELECT machine_id, license_key, is_active FROM license WHERE id = 1',
          []
        );
        
        if (verification.length > 0 && 
            verification[0].is_active === 1 &&
            verification[0].machine_id === currentMachineId &&
            verification[0].license_key === formattedKey) {
          verificationSuccess = true;
          log.info(`✅ Verification successful on attempt ${attempt}`);
          break;
        }
        
        log.warn(`Attempt ${attempt} failed, verification data:`, verification);
      }

      if (!verificationSuccess) {
        throw new Error('فشل التحقق من الترخيص بعد عدة محاولات');
      }

      log.info('✅ License activated successfully and verified');
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

  /**
   * Clear cached machine ID (for testing purposes)
   */
  clearCache(): void {
    this.cachedMachineId = null;
  }
}

// Export singleton instance getter
export function getSimpleLicenseService(): SimpleLicenseService {
  return SimpleLicenseService.getInstance();
}