"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardwareIdService = void 0;
exports.getHardwareIdService = getHardwareIdService;
const child_process_1 = require("child_process");
const electron_log_1 = __importDefault(require("electron-log"));
const os = __importStar(require("os"));
const crypto = __importStar(require("crypto"));
/**
 * Hardware ID Service
 *
 * Generates a unique, stable hardware identifier for the current machine.
 * This ID is used to bind license keys to specific devices.
 */
class HardwareIdService {
    constructor() {
        this.cachedHardwareId = null;
    }
    static getInstance() {
        if (!HardwareIdService.instance) {
            HardwareIdService.instance = new HardwareIdService();
        }
        return HardwareIdService.instance;
    }
    /**
     * Get the hardware ID for this machine
     * Uses motherboard serial number on Windows, system UUID on macOS/Linux
     */
    getHardwareId() {
        if (this.cachedHardwareId) {
            return this.cachedHardwareId;
        }
        try {
            const platform = os.platform();
            let hardwareId;
            if (platform === 'win32') {
                hardwareId = this.getWindowsHardwareId();
            }
            else if (platform === 'darwin') {
                hardwareId = this.getMacHardwareId();
            }
            else {
                hardwareId = this.getLinuxHardwareId();
            }
            // Normalize and cache
            this.cachedHardwareId = hardwareId.trim().toUpperCase();
            electron_log_1.default.info('Hardware ID retrieved:', this.cachedHardwareId);
            return this.cachedHardwareId;
        }
        catch (error) {
            electron_log_1.default.error('Failed to get hardware ID:', error);
            // Fallback to a deterministic ID based on system info
            return this.getFallbackHardwareId();
        }
    }
    /**
     * Get Windows hardware ID using motherboard serial
     */
    getWindowsHardwareId() {
        try {
            // Try to get motherboard serial number
            const command = 'wmic baseboard get serialnumber';
            const output = (0, child_process_1.execSync)(command, { encoding: 'utf-8', timeout: 5000 });
            const lines = output.split('\n').filter(line => line.trim() && !line.includes('SerialNumber'));
            if (lines.length > 0) {
                const serial = lines[0].trim();
                if (serial && serial !== 'To Be Filled By O.E.M.' && serial.length > 3) {
                    return `HWID-WIN-${serial}`;
                }
            }
            // Fallback to system UUID
            const uuidCommand = 'wmic csproduct get uuid';
            const uuidOutput = (0, child_process_1.execSync)(uuidCommand, { encoding: 'utf-8', timeout: 5000 });
            const uuidLines = uuidOutput.split('\n').filter(line => line.trim() && !line.includes('UUID'));
            if (uuidLines.length > 0) {
                const uuid = uuidLines[0].trim();
                return `HWID-WIN-${uuid}`;
            }
            throw new Error('Could not retrieve Windows hardware ID');
        }
        catch (error) {
            electron_log_1.default.error('Windows hardware ID retrieval failed:', error);
            throw error;
        }
    }
    /**
     * Get macOS hardware ID using system UUID
     */
    getMacHardwareId() {
        try {
            const command = 'ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID';
            const output = (0, child_process_1.execSync)(command, { encoding: 'utf-8', timeout: 5000 });
            const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
            if (match && match[1]) {
                return `HWID-MAC-${match[1]}`;
            }
            throw new Error('Could not retrieve macOS hardware ID');
        }
        catch (error) {
            electron_log_1.default.error('macOS hardware ID retrieval failed:', error);
            throw error;
        }
    }
    /**
     * Get Linux hardware ID using machine-id
     */
    getLinuxHardwareId() {
        try {
            // Try /etc/machine-id first
            const command = 'cat /etc/machine-id || cat /var/lib/dbus/machine-id';
            const output = (0, child_process_1.execSync)(command, { encoding: 'utf-8', timeout: 5000 });
            const machineId = output.trim();
            if (machineId && machineId.length > 10) {
                return `HWID-LNX-${machineId}`;
            }
            throw new Error('Could not retrieve Linux hardware ID');
        }
        catch (error) {
            electron_log_1.default.error('Linux hardware ID retrieval failed:', error);
            throw error;
        }
    }
    /**
     * Generate fallback hardware ID based on system information
     * This is less reliable but better than nothing
     */
    getFallbackHardwareId() {
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
            electron_log_1.default.warn('Using fallback hardware ID:', fallbackId);
            return fallbackId;
        }
        catch (error) {
            electron_log_1.default.error('Fallback hardware ID generation failed:', error);
            // Last resort - random but stable for this session
            const randomId = crypto.randomBytes(8).toString('hex').toUpperCase();
            return `HWID-TEMP-${randomId}`;
        }
    }
    /**
     * Clear cached hardware ID (for testing purposes)
     */
    clearCache() {
        this.cachedHardwareId = null;
    }
}
exports.HardwareIdService = HardwareIdService;
// Export singleton instance getter
function getHardwareIdService() {
    return HardwareIdService.getInstance();
}
