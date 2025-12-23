import * as os from 'os';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getDatabase, executeQuery, executeNonQuery, saveDatabase } from '../database/connection';
import log from 'electron-log';
import { BusinessRuleError, ValidationError } from '../utils/errors';

export interface LicenseInfo {
  hardwareId: string;
  isActivated: boolean;
  activatedAt?: number;
  licenseKey?: string;
}

/**
 * License Service
 * Manages license activation and validation
 */
export class LicenseService {
  private static instance: LicenseService;
  private hardwareId: string | null = null;
  private secretKey: string; // Secret key for generating license keys (should be kept secret)

  private constructor() {
    // In production, this should be stored securely or retrieved from a server
    // For now, using a hardcoded secret (in production, use environment variable or secure storage)
    this.secretKey = process.env.LICENSE_SECRET_KEY || 'dental-lab-license-secret-key-2025-change-in-production';
  }

  static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  /**
   * Get hardware ID based on machine characteristics
   */
  getHardwareId(): string {
    if (this.hardwareId) {
      return this.hardwareId;
    }

    try {
      // Collect machine-specific information
      const machineInfo = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().map(cpu => cpu.model).join(','),
        totalmem: os.totalmem().toString(),
        networkInterfaces: this.getNetworkInterfaces(),
      };

      // Create a unique string from machine info
      const machineString = JSON.stringify(machineInfo);
      
      // Generate SHA256 hash as hardware ID
      this.hardwareId = crypto
        .createHash('sha256')
        .update(machineString)
        .digest('hex')
        .substring(0, 32) // Use first 32 characters
        .toUpperCase()
        .match(/.{1,4}/g)?.join('-') || ''; // Format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX

      log.info('Hardware ID generated:', this.hardwareId);
      return this.hardwareId;
    } catch (error) {
      log.error('Failed to generate hardware ID:', error);
      // Fallback: use a combination of hostname and platform
      const fallbackId = crypto
        .createHash('sha256')
        .update(`${os.hostname()}-${os.platform()}-${Date.now()}`)
        .digest('hex')
        .substring(0, 32)
        .toUpperCase()
        .match(/.{1,4}/g)?.join('-') || 'UNKNOWN';
      
      this.hardwareId = fallbackId;
      return fallbackId;
    }
  }

  /**
   * Get network interfaces MAC addresses
   */
  private getNetworkInterfaces(): string {
    const interfaces = os.networkInterfaces();
    const macAddresses: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const nets = interfaces[name];
      if (nets) {
        for (const net of nets) {
          if (net.mac && net.mac !== '00:00:00:00:00:00') {
            macAddresses.push(net.mac);
          }
        }
      }
    }

    return macAddresses.sort().join(',');
  }

  /**
   * Generate license key for a given hardware ID
   * This function should be used by the developer/admin to generate keys
   */
  generateLicenseKey(hardwareId: string): string {
    try {
      // Validate hardware ID format
      if (!hardwareId || hardwareId.length < 20) {
        throw new ValidationError('Invalid hardware ID');
      }

      // Create a signature using the hardware ID and secret key
      const data = `${hardwareId}-${this.secretKey}`;
      const signature = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
        .substring(0, 24)
        .toUpperCase();

      // Format as LICENSE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
      const formattedKey = `LICENSE-${signature.match(/.{1,4}/g)?.join('-') || signature}`;
      
      log.info(`License key generated for hardware ID: ${hardwareId}`);
      return formattedKey;
    } catch (error) {
      log.error('Failed to generate license key:', error);
      throw error;
    }
  }

  /**
   * Validate license key format
   */
  private validateLicenseKeyFormat(licenseKey: string): boolean {
    // Format: LICENSE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    const pattern = /^LICENSE-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
    return pattern.test(licenseKey.toUpperCase());
  }

  /**
   * Verify license key matches hardware ID
   */
  verifyLicenseKey(licenseKey: string, hardwareId: string): boolean {
    try {
      if (!this.validateLicenseKeyFormat(licenseKey)) {
        log.warn('Invalid license key format:', licenseKey);
        return false;
      }

      // Generate expected license key for this hardware ID
      const expectedKey = this.generateLicenseKey(hardwareId);
      
      log.info('License verification debug:', {
        inputKey: licenseKey.toUpperCase(),
        expectedKey: expectedKey.toUpperCase(),
        hardwareId,
        secretKey: this.secretKey.substring(0, 20) + '...',
      });
      
      // Compare (case-insensitive)
      const isValid = licenseKey.toUpperCase() === expectedKey.toUpperCase();
      
      if (!isValid) {
        log.warn('License key mismatch:', {
          provided: licenseKey.toUpperCase(),
          expected: expectedKey.toUpperCase(),
        });
      }
      
      return isValid;
    } catch (error) {
      log.error('Failed to verify license key:', error);
      return false;
    }
  }

  /**
   * Check if license is activated
   */
  isLicenseActivated(): boolean {
    try {
      const hardwareId = this.getHardwareId();
      const result = executeQuery<{ is_active: number }>(
        'SELECT is_active FROM license WHERE hardware_id = ? AND is_active = 1',
        [hardwareId]
      );

      return result.length > 0 && result[0].is_active === 1;
    } catch (error) {
      log.error('Failed to check license status:', error);
      return false;
    }
  }

  /**
   * Get license information
   */
  getLicenseInfo(): LicenseInfo {
    try {
      const hardwareId = this.getHardwareId();
      const result = executeQuery<{
        license_key: string;
        activated_at: number;
        is_active: number;
      }>(
        'SELECT license_key, activated_at, is_active FROM license WHERE hardware_id = ?',
        [hardwareId]
      );

      if (result.length === 0) {
        return {
          hardwareId,
          isActivated: false,
        };
      }

      const license = result[0];
      return {
        hardwareId,
        isActivated: license.is_active === 1,
        activatedAt: license.activated_at,
        licenseKey: license.license_key,
      };
    } catch (error) {
      log.error('Failed to get license info:', error);
      return {
        hardwareId: this.getHardwareId(),
        isActivated: false,
      };
    }
  }

  /**
   * Activate license with a license key
   */
  activateLicense(licenseKey: string): void {
    try {
      const hardwareId = this.getHardwareId();

      // Validate format
      if (!this.validateLicenseKeyFormat(licenseKey)) {
        throw new ValidationError('صيغة كود التفعيل غير صحيحة');
      }

      // Verify license key matches hardware ID
      if (!this.verifyLicenseKey(licenseKey, hardwareId)) {
        throw new BusinessRuleError('كود التفعيل غير صالح لهذا الجهاز');
      }

      // Check if already activated
      const existing = executeQuery<{ id: number }>(
        'SELECT id FROM license WHERE hardware_id = ?',
        [hardwareId]
      );

      const activatedAt = Math.floor(Date.now() / 1000);

      if (existing.length > 0) {
        // Update existing license
        executeNonQuery(
          'UPDATE license SET license_key = ?, activated_at = ?, is_active = 1, updated_at = ? WHERE hardware_id = ?',
          [licenseKey.toUpperCase(), activatedAt, activatedAt, hardwareId]
        );
        log.info(`License updated for hardware ID: ${hardwareId}`);
      } else {
        // Insert new license
        executeNonQuery(
          'INSERT INTO license (hardware_id, license_key, activated_at, is_active) VALUES (?, ?, ?, 1)',
          [hardwareId, licenseKey.toUpperCase(), activatedAt]
        );
        log.info(`New license inserted for hardware ID: ${hardwareId}`);
      }

      // Force save to disk immediately after license operation
      saveDatabase();
      log.info('Database saved after license operation');

      // Wait a tiny bit to ensure filesystem has flushed (especially on Windows)
      // This is a workaround for potential async filesystem operations
      const waitPromise = new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the license was saved in memory
      const verification = executeQuery<{ is_active: number, license_key: string }>(
        'SELECT is_active, license_key FROM license WHERE hardware_id = ?',
        [hardwareId]
      );
      
      log.info('License verification query result:', verification);
      
      if (verification.length === 0 || verification[0].is_active !== 1) {
        throw new Error('Failed to verify license activation in database memory');
      }
      
      if (verification[0].license_key.toUpperCase() !== licenseKey.toUpperCase()) {
        throw new Error('License key mismatch after save');
      }

      log.info(`License activated and verified successfully for hardware ID: ${hardwareId}`);
      
      // Wait for filesystem to complete (non-blocking for the user)
      waitPromise.then(() => {
        log.info('Filesystem flush wait completed');
      });
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
      const hardwareId = this.getHardwareId();
      executeNonQuery(
        'UPDATE license SET is_active = 0, updated_at = ? WHERE hardware_id = ?',
        [Math.floor(Date.now() / 1000), hardwareId]
      );
      saveDatabase();
      log.info(`License deactivated for hardware ID: ${hardwareId}`);
    } catch (error) {
      log.error('Failed to deactivate license:', error);
      throw error;
    }
  }
}

// Export singleton instance getter
export function getLicenseService(): LicenseService {
  return LicenseService.getInstance();
}

