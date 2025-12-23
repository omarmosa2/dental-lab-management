/**
 * Sanitization utilities for input data
 */

/**
 * Sanitize string input by trimming and normalizing whitespace
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input) return null;
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize phone number by removing non-numeric characters except + and spaces
 */
export function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  return phone.trim().replace(/[^\d+\s()-]/g, '');
}

/**
 * Sanitize number to ensure it's non-negative
 */
export function sanitizePositiveNumber(num: number | null | undefined): number {
  if (num === null || num === undefined || num < 0) return 0;
  return num;
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(arr: string[] | null | undefined): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr
    .map(item => sanitizeString(item))
    .filter((item): item is string => item !== null && item !== '');
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
}

/**
 * Sanitize national ID (11 digits)
 */
export function sanitizeNationalId(id: string | null | undefined): string | null {
  if (!id) return null;
  const cleaned = id.replace(/\D/g, '');
  return cleaned.length === 11 ? cleaned : null;
}