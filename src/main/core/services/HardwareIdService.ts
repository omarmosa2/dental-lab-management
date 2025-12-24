import { execSync } from 'child_process';
import log from 'electron-log';
import * as os from 'os';
import * as crypto from 'crypto';

/**
 * Hardware ID Service
 * 
 * Generates a unique, stable hardware identifier for the current machine.
 * This ID is used to bind license keys to specific devices.
 */
export class HardwareIdService {
  private static instance: HardwareIdService;
  private cachedHardwareId: string | null = null;

  private constructor() {}

  static getInstance(): HardwareIdService {
    if (!HardwareIdService.instance) {
      HardwareIdService.instance = new HardwareIdService();
    }
    return HardwareIdService.instance;
  }

  /**
   * Get the hardware ID for this machine
   * Uses motherboard serial number on Windows, system UUID on macOS/Linux
   */
  getHardwareId(): string {
    if (this.cachedHardwareId) {
      return this.cachedHardwareId;
    }

    try {
      const platform = os.platform();
      let hardwareId: string;

      if (platform === 'win32') {
        hardwareId = this.getWindowsHardwareId();
      } else if (platform === 'darwin') {
        hardwareId = this.getMacHardwareId();
      } else {
        hardwareId = this.getLinuxHardwareId();
      }

      // Normalize and cache
      this.cachedHardwareId = hardwareId.trim().toUpperCase();
      log.info('Hardware ID retrieved:', this.cachedHardwareId);
      
      return this.cachedHardwareId;
    } catch (error) {
      log.error('Failed to get hardware ID:', error);
      // Fallback to a deterministic ID based on system info
      return this.getFallbackHardwareId();
    }
  }

  /**
   * Get Windows hardware ID using motherboard serial
   */
  private getWindowsHardwareId(): string {
    try {
      // Try to get motherboard serial number
      const command = 'wmic baseboard get serialnumber';
      const output = execSync(command, { encoding: 'utf-8', timeout: 5000 });
      const lines = output.split('\n').filter(line => line.trim() && !line.includes('SerialNumber'));
      
      if (lines.length > 0) {
        const serial = lines[0].trim();
        if (serial && serial !== 'To Be Filled By O.E.M.' && serial.length > 3) {
          return `HWID-WIN-${serial}`;
        }
      }

      // Fallback to system UUID
      const uuidCommand = 'wmic csproduct get uuid';
      const uuidOutput = execSync(uuidCommand, { encoding: 'utf-8', timeout: 5000 });
      const uuidLines = uuidOutput.split('\n').filter(line => line.trim() && !line.includes('UUID'));
      
      if (uuidLines.length > 0) {
        const uuid = uuidLines[0].trim();
        return `HWID-WIN-${uuid}`;
      }

      throw new Error('Could not retrieve Windows hardware ID');
    } catch (error) {
      log.error('Windows hardware ID retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get macOS hardware ID using system UUID
   */
  private getMacHardwareId(): string {
    try {
      const command = 'ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID';
      const output = execSync(command, { encoding: 'utf-8', timeout: 5000 });
      const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      
      if (match && match[1]) {
        return `HWID-MAC-${match[1]}`;
      }

      throw new Error('Could not retrieve macOS hardware ID');
    } catch (error) {
      log.error('macOS hardware ID retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get Linux hardware ID using machine-id
   */
  private getLinuxHardwareId(): string {
    try {
      // Try /etc/machine-id first
      const command = 'cat /etc/machine-id || cat /var/lib/dbus/machine-id';
      const output = execSync(command, { encoding: 'utf-8', timeout: 5000 });
      const machineId = output.trim();
      
      if (machineId && machineId.length > 10) {
        return `HWID-LNX-${machineId}`;
      }

      throw new Error('Could not retrieve Linux hardware ID');
    } catch (error) {
      log.error('Linux hardware ID retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Generate fallback hardware ID based on system information
   * This is less reliable but better than nothing
   */
  private getFallbackHardwareId(): string {
    try {
      const cpus = os.cpus();
      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      
      // Create a deterministic hash from available system info
      const systemInfo = `${platform}-${arch}-${hostname}-${cpus.length}-${cpus[0]?.model || ''}`;
      const hash = crypto.createHash('sha256').update(systemInfo).digest('hex');
      const shortHash = hash.substring(0, 16).toUpperCase();
      
      const fallbackId = `HWID-FB-${shortHash}`;
      log.warn('Using fallback hardware ID:', fallbackId);
      
      return fallbackId;
    } catch (error) {
      log.error('Fallback hardware ID generation failed:', error);
      // Last resort - random but stable for this session
      const randomId = crypto.randomBytes(8).toString('hex').toUpperCase();
      return `HWID-TEMP-${randomId}`;
    }
  }

  /**
   * Clear cached hardware ID (for testing purposes)
   */
  clearCache(): void {
    this.cachedHardwareId = null;
  }
}

// Export singleton instance getter
export function getHardwareIdService(): HardwareIdService {
  return HardwareIdService.getInstance();
}