"use strict";
/**
 * Sanitization utilities for input data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeString = sanitizeString;
exports.sanitizePhone = sanitizePhone;
exports.sanitizePositiveNumber = sanitizePositiveNumber;
exports.sanitizeStringArray = sanitizeStringArray;
exports.sanitizeEmail = sanitizeEmail;
exports.sanitizeNationalId = sanitizeNationalId;
/**
 * Sanitize string input by trimming and normalizing whitespace
 */
function sanitizeString(input) {
    if (!input)
        return null;
    return input.trim().replace(/\s+/g, ' ');
}
/**
 * Sanitize phone number by removing non-numeric characters except + and spaces
 */
function sanitizePhone(phone) {
    if (!phone)
        return null;
    return phone.trim().replace(/[^\d+\s()-]/g, '');
}
/**
 * Sanitize number to ensure it's non-negative
 */
function sanitizePositiveNumber(num) {
    if (num === null || num === undefined || num < 0)
        return 0;
    return num;
}
/**
 * Sanitize array of strings
 */
function sanitizeStringArray(arr) {
    if (!arr || !Array.isArray(arr))
        return [];
    return arr
        .map(item => sanitizeString(item))
        .filter((item) => item !== null && item !== '');
}
/**
 * Validate and sanitize email
 */
function sanitizeEmail(email) {
    if (!email)
        return null;
    const trimmed = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed) ? trimmed : null;
}
/**
 * Sanitize national ID (11 digits)
 */
function sanitizeNationalId(id) {
    if (!id)
        return null;
    const cleaned = id.replace(/\D/g, '');
    return cleaned.length === 11 ? cleaned : null;
}
