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
exports.HardwareLicenseService = void 0;
exports.getHardwareLicenseService = getHardwareLicenseService;
const connection_1 = require("../database/connection");
const HardwareIdService_1 = require("./HardwareIdService");
const electron_log_1 = __importDefault(require("electron-log"));
const errors_1 = require("../utils/errors");
const crypto = __importStar(require("crypto"));
// Secret key - MUST match the one in generate-license-key.js
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';
/**
 * Hardware-Bound License Service
 *
 * This service manages license activation bound to specific hardware.
 * Each activation key works on one device only and cannot be transferred.
 */
class HardwareLicenseService {
    constructor() {
        this.hardwareIdService = (0, HardwareIdService_1.getHardwareIdService)();
        // Initialize service
    }
    static getInstance() {
        if (!HardwareLicenseService.instance) {
            HardwareLicenseService.instance = new HardwareLicenseService();
        }
        return HardwareLicenseService.instance;
    }
    /**
     * Get the current device's hardware ID
     */
    getHardwareId() {
        return this.hardwareIdService.getHardwareId();
    }
    /**
     * Verify if an activation key is valid for the current hardware
     */
    verifyActivationKey(activationKey, hardwareId) {
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
            electron_log_1.default.info('License key verification:', {
                hardwareId: normalizedHwId,
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
     * Check if license is activated and valid for this hardware
     */
    isLicenseActivated() {
        try {
            const currentHardwareId = this.getHardwareId();
            const result = (0, connection_1.executeQuery)('SELECT hardware_id, license_key, is_active FROM license WHERE id = 1', []);
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
            // Verify hardware ID matches
            if (license.hardware_id !== currentHardwareId) {
                electron_log_1.default.warn('Hardware ID mismatch!', {
                    stored: license.hardware_id,
                    current: currentHardwareId
                });
                return false;
            }
            // Verify activation key is valid for this hardware
            const isKeyValid = this.verifyActivationKey(license.license_key, currentHardwareId);
            if (!isKeyValid) {
                electron_log_1.default.warn('Activation key is invalid for this hardware');
                return false;
            }
            electron_log_1.default.info('License is activated and valid for this hardware');
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
            const currentHardwareId = this.getHardwareId();
            const result = (0, connection_1.executeQuery)('SELECT hardware_id, license_key, activated_at, is_active FROM license WHERE id = 1', []);
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
        }
        catch (error) {
            electron_log_1.default.error('Failed to get license info:', error);
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
    activateLicense(activationKey) {
        try {
            const normalizedKey = activationKey.replace(/-/g, '').trim().toUpperCase();
            // Validate input
            if (!normalizedKey) {
                throw new errors_1.ValidationError('يرجى إدخال مفتاح التفعيل');
            }
            if (normalizedKey.length !== 32) {
                throw new errors_1.ValidationError('مفتاح التفعيل غير صحيح - الطول غير صحيح');
            }
            // Get current hardware ID
            const currentHardwareId = this.getHardwareId();
            electron_log_1.default.info('Attempting activation for hardware:', currentHardwareId);
            // Verify the key is valid for this hardware
            if (!this.verifyActivationKey(normalizedKey, currentHardwareId)) {
                throw new errors_1.BusinessRuleError('مفتاح التفعيل غير صالح لهذا الجهاز');
            }
            // Format key for display (XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)
            const formattedKey = normalizedKey.match(/.{1,4}/g)?.join('-') || normalizedKey;
            // Check if already activated
            const existing = (0, connection_1.executeQuery)('SELECT id, hardware_id FROM license WHERE id = 1', []);
            const activatedAt = Math.floor(Date.now() / 1000);
            if (existing.length > 0) {
                // Update existing license
                (0, connection_1.executeNonQuery)('UPDATE license SET hardware_id = ?, license_key = ?, activated_at = ?, is_active = 1 WHERE id = 1', [currentHardwareId, formattedKey, activatedAt]);
                electron_log_1.default.info('License updated for hardware:', currentHardwareId);
            }
            else {
                // Insert new license with id=1
                (0, connection_1.executeNonQuery)('INSERT INTO license (id, hardware_id, license_key, activated_at, is_active) VALUES (1, ?, ?, ?, 1)', [currentHardwareId, formattedKey, activatedAt]);
                electron_log_1.default.info('New license created for hardware:', currentHardwareId);
            }
            // Force save to disk immediately
            (0, connection_1.saveDatabase)();
            electron_log_1.default.info('Database saved after license activation');
            // Verify the license was saved correctly
            const verification = (0, connection_1.executeQuery)('SELECT hardware_id, license_key, is_active FROM license WHERE id = 1', []);
            electron_log_1.default.info('License verification after activation:', verification);
            if (verification.length === 0 || verification[0].is_active !== 1) {
                throw new Error('فشل التحقق من تفعيل الترخيص في قاعدة البيانات');
            }
            if (verification[0].hardware_id !== currentHardwareId) {
                throw new Error('عدم تطابق معرف الجهاز بعد الحفظ');
            }
            if (verification[0].license_key !== formattedKey) {
                throw new Error('عدم تطابق مفتاح الترخيص بعد الحفظ');
            }
            electron_log_1.default.info('License activated successfully and verified');
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
}
exports.HardwareLicenseService = HardwareLicenseService;
// Export singleton instance getter
function getHardwareLicenseService() {
    return HardwareLicenseService.getInstance();
}
