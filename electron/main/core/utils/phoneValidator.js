"use strict";
// phoneValidator.ts
// Phone number validation and formatting utilities
// Created: 2025-01-11
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneValidator = void 0;
class PhoneValidator {
    /**
     * Validate and format a phone number
     */
    static validate(phone, _defaultCountryCode = '963') {
        if (!phone || typeof phone !== 'string') {
            return {
                isValid: false,
                formatted: null,
                error: 'رقم الهاتف مطلوب',
                country: null
            };
        }
        // Clean the phone number
        const cleaned = phone.replace(/[\s\-().]/g, '');
        // Try Syrian format first
        const syrianResult = this.validateSyrian(cleaned);
        if (syrianResult.isValid) {
            return syrianResult;
        }
        // Try international format
        const internationalResult = this.validateInternational(cleaned);
        if (internationalResult.isValid) {
            return internationalResult;
        }
        return {
            isValid: false,
            formatted: null,
            error: 'رقم الهاتف غير صالح',
            country: null
        };
    }
    /**
     * Validate Syrian phone number
     */
    static validateSyrian(cleaned) {
        // Check mobile pattern
        if (this.SYRIAN_PATTERNS.mobile.test(cleaned)) {
            const formatted = this.formatSyrian(cleaned);
            return {
                isValid: true,
                formatted,
                error: null,
                country: 'SY'
            };
        }
        // Check landline pattern
        if (this.SYRIAN_PATTERNS.landline.test(cleaned)) {
            const formatted = this.formatSyrian(cleaned);
            return {
                isValid: true,
                formatted,
                error: null,
                country: 'SY'
            };
        }
        return {
            isValid: false,
            formatted: null,
            error: null,
            country: null
        };
    }
    /**
     * Format Syrian phone number to international format
     */
    static formatSyrian(cleaned) {
        // Remove leading zeros
        let number = cleaned.replace(/^0+/, '');
        // Remove country code if present
        if (number.startsWith('963')) {
            number = number.substring(3);
        }
        else if (number.startsWith('+963')) {
            number = number.substring(4);
        }
        // Add country code
        return '963' + number;
    }
    /**
     * Validate international phone number
     */
    static validateInternational(cleaned) {
        // Remove + if present
        const number = cleaned.replace(/^\+/, '');
        if (this.INTERNATIONAL_PATTERN.test(number)) {
            return {
                isValid: true,
                formatted: number,
                error: null,
                country: 'INTERNATIONAL'
            };
        }
        return {
            isValid: false,
            formatted: null,
            error: null,
            country: null
        };
    }
    /**
     * Format phone number for display
     */
    static formatForDisplay(phone) {
        const result = this.validate(phone);
        if (!result.isValid || !result.formatted) {
            return phone;
        }
        // Format Syrian numbers
        if (result.country === 'SY' && result.formatted.startsWith('963')) {
            const number = result.formatted.substring(3);
            if (number.length === 9) {
                // Mobile: 963 9XX XXX XXX
                return `+963 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
            }
            else {
                // Landline: 963 XX XXX XXX
                return `+963 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5)}`;
            }
        }
        // Format international numbers
        return '+' + result.formatted;
    }
    /**
     * Check if phone number is valid for WhatsApp
     */
    static isValidForWhatsApp(phone) {
        const result = this.validate(phone);
        return result.isValid && result.formatted !== null;
    }
    /**
     * Sanitize phone number for database storage
     */
    static sanitize(phone) {
        const result = this.validate(phone);
        return result.formatted || phone;
    }
}
exports.PhoneValidator = PhoneValidator;
// Syrian phone number patterns
PhoneValidator.SYRIAN_PATTERNS = {
    mobile: /^(?:\+?963|0)?9[0-9]{8}$/,
    landline: /^(?:\+?963|0)?[1-9][0-9]{6,7}$/,
};
// International format patterns
PhoneValidator.INTERNATIONAL_PATTERN = /^\+?[1-9]\d{1,14}$/;
