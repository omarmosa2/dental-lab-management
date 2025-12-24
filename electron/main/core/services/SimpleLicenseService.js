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
exports.SimpleLicenseService = void 0;
exports.getSimpleLicenseService = getSimpleLicenseService;
const connection_1 = require("../database/connection");
const electron_log_1 = __importDefault(require("electron-log"));
const errors_1 = require("../utils/errors");
const crypto = __importStar(require("crypto"));
const child_process_1 = require("child_process");
// Secret key for license generation
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';
/**
 * Simple License Service
 *
 * Uses Windows Machine GUID as the unique identifier.
 * Each license key is bound to a specific Machine GUID.
 */
class SimpleLicenseService {
    constructor() {
        this.cachedMachineId = null;
        // Initialize service
    }
    static getInstance() {
        if (!SimpleLicenseService.instance) {
            SimpleLicenseService.instance = new SimpleLicenseService();
        }
        return SimpleLicenseService.instance;
    }
    /**
     * Get Machine GUID from Windows Registry (most reliable method)
     */
    getMachineId() {
        if (this.cachedMachineId) {
            return this.cachedMachineId;
        }
        try {
            electron_log_1.default.info('Getting Machine GUID from Windows Registry...');
            const regCommand = 'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid';
            const regOutput = (0, child_process_1.execSync)(regCommand, {
                encoding: 'utf-8',
                timeout: 5000,
                windowsHide: true
            });
            const match = regOutput.match(/MachineGuid\s+REG_SZ\s+([A-Fa-f0-9-]+)/);
            if (match && match[1]) {
                const machineGuid = match[1].trim().toUpperCase();
                this.cachedMachineId = machineGuid;
                electron_log_1.default.info('✅ Machine GUID retrieved:', machineGuid);
                return machineGuid;
            }
            throw new Error('Could not parse Machine GUID from registry');
        }
        catch (error) {
            electron_log_1.default.error('❌ Failed to get Machine GUID:', error);
            throw new Error('فشل الحصول على معرف الجهاز. يرجى تشغيل التطبيق كمسؤول.');
        }
    }
    /**
     * Verify if a license key is valid for the current machine
     */
    verifyLicenseKey(licenseKey, machineId) {
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
            electron_log_1.default.info('License key verification:', {
                machineId: normalizedMachineId,
                isValid,
                keyLength: normalizedKey.length
            });
            return isValid;
        }
        catch (error) {
            electron_log_1.default.error('License key verification failed:', error);
            return false;
        }
    }
    /**
     * Check if license is activated and valid for this machine
     */
    isLicenseActivated() {
        try {
            const currentMachineId = this.getMachineId();
            const result = (0, connection_1.executeQuery)('SELECT machine_id, license_key, is_active FROM license WHERE id = 1', []);
            if (result.length === 0) {
                electron_log_1.default.info('No license found in database');
                return false;
            }
            const license = result[0];
            // Check if active
            if (license.is_active !== 1) {
                electron_log_1.default.info('License exists but is not active');
                return false;
            }
            // Verify machine ID matches
            if (license.machine_id !== currentMachineId) {
                electron_log_1.default.warn('Machine ID mismatch!', {
                    stored: license.machine_id,
                    current: currentMachineId
                });
                return false;
            }
            // Verify license key is valid for this machine
            const isKeyValid = this.verifyLicenseKey(license.license_key, currentMachineId);
            if (!isKeyValid) {
                electron_log_1.default.warn('License key is invalid for this machine');
                return false;
            }
            electron_log_1.default.info('✅ License is activated and valid for this machine');
            return true;
        }
        catch (error) {
            electron_log_1.default.error('Failed to check license status:', error);
            return false;
        }
    }
    /**
     * Get license information
     */
    getLicenseInfo() {
        try {
            const currentMachineId = this.getMachineId();
            const result = (0, connection_1.executeQuery)('SELECT machine_id, license_key, activated_at, is_active FROM license WHERE id = 1', []);
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
        }
        catch (error) {
            electron_log_1.default.error('Failed to get license info:', error);
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
    activateLicense(licenseKey) {
        try {
            const normalizedKey = licenseKey.replace(/-/g, '').trim().toUpperCase();
            // Validate input
            if (!normalizedKey) {
                throw new errors_1.ValidationError('يرجى إدخال مفتاح الترخيص');
            }
            if (normalizedKey.length !== 32) {
                throw new errors_1.ValidationError('مفتاح الترخيص غير صحيح - الطول غير صحيح');
            }
            // Get current machine ID
            const currentMachineId = this.getMachineId();
            electron_log_1.default.info('Attempting activation for machine:', currentMachineId);
            // Verify the key is valid for this machine
            if (!this.verifyLicenseKey(normalizedKey, currentMachineId)) {
                throw new errors_1.BusinessRuleError('مفتاح الترخيص غير صالح لهذا الجهاز');
            }
            // Format key for display
            const formattedKey = normalizedKey.match(/.{1,4}/g)?.join('-') || normalizedKey;
            // Check if already activated
            const existing = (0, connection_1.executeQuery)('SELECT id, machine_id FROM license WHERE id = 1', []);
            const activatedAt = Math.floor(Date.now() / 1000);
            if (existing.length > 0) {
                // Update existing license
                (0, connection_1.executeNonQuery)('UPDATE license SET machine_id = ?, license_key = ?, activated_at = ?, is_active = 1 WHERE id = 1', [currentMachineId, formattedKey, activatedAt]);
                electron_log_1.default.info('License updated for machine:', currentMachineId);
            }
            else {
                // Insert new license with id=1
                (0, connection_1.executeNonQuery)('INSERT INTO license (id, machine_id, license_key, activated_at, is_active) VALUES (1, ?, ?, ?, 1)', [currentMachineId, formattedKey, activatedAt]);
                electron_log_1.default.info('New license created for machine:', currentMachineId);
            }
            // Save with double save for reliability
            electron_log_1.default.info('Starting database save sequence...');
            (0, connection_1.saveDatabase)();
            electron_log_1.default.info('First save completed');
            (0, connection_1.saveDatabase)();
            electron_log_1.default.info('Second save completed');
            // Verify the license was saved correctly
            let verificationSuccess = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                electron_log_1.default.info(`Verification attempt ${attempt}/3...`);
                const verification = (0, connection_1.executeQuery)('SELECT machine_id, license_key, is_active FROM license WHERE id = 1', []);
                if (verification.length > 0 &&
                    verification[0].is_active === 1 &&
                    verification[0].machine_id === currentMachineId &&
                    verification[0].license_key === formattedKey) {
                    verificationSuccess = true;
                    electron_log_1.default.info(`✅ Verification successful on attempt ${attempt}`);
                    break;
                }
                electron_log_1.default.warn(`Attempt ${attempt} failed, verification data:`, verification);
            }
            if (!verificationSuccess) {
                throw new Error('فشل التحقق من الترخيص بعد عدة محاولات');
            }
            electron_log_1.default.info('✅ License activated successfully and verified');
        }
        catch (error) {
            electron_log_1.default.error('Failed to activate license:', error);
            throw error;
        }
    }
    /**
     * Deactivate license (for testing/admin purposes)
     */
    deactivateLicense() {
        try {
            (0, connection_1.executeNonQuery)('UPDATE license SET is_active = 0 WHERE id = 1', []);
            (0, connection_1.saveDatabase)();
            electron_log_1.default.info('License deactivated');
        }
        catch (error) {
            electron_log_1.default.error('Failed to deactivate license:', error);
            throw error;
        }
    }
    /**
     * Clear cached machine ID (for testing purposes)
     */
    clearCache() {
        this.cachedMachineId = null;
    }
}
exports.SimpleLicenseService = SimpleLicenseService;
// Export singleton instance getter
function getSimpleLicenseService() {
    return SimpleLicenseService.getInstance();
}
