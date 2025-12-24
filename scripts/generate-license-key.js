#!/usr/bin/env node
/**
 * License Key Generator Script
 * 
 * This script is used by administrators to generate activation keys
 * bound to specific hardware IDs.
 * 
 * Usage:
 *   node scripts/generate-license-key.js <hardware-id>
 * 
 * Example:
 *   node scripts/generate-license-key.js HWID-ABC123-XYZ789
 */

const crypto = require('crypto');

// Secret key - KEEP THIS SECURE AND NEVER COMMIT TO PUBLIC REPOS
// In production, this should be stored securely (env var, secure vault, etc.)
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';

/**
 * Generate activation key for a specific hardware ID
 * @param {string} hardwareId - The hardware ID to bind the key to
 * @returns {string} Activation key
 */
function generateActivationKey(hardwareId) {
  if (!hardwareId || typeof hardwareId !== 'string' || hardwareId.trim().length === 0) {
    throw new Error('Invalid hardware ID');
  }

  const normalizedHwId = hardwareId.trim().toUpperCase();
  
  // Create signature using HMAC-SHA256
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(normalizedHwId);
  const signature = hmac.digest('hex');
  
  // Take first 32 characters of signature
  const keyPart = signature.substring(0, 32).toUpperCase();
  
  // Format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const formatted = keyPart.match(/.{1,4}/g)?.join('-') || keyPart;
  
  return formatted;
}

/**
 * Verify if an activation key is valid for a hardware ID
 * @param {string} activationKey - The activation key to verify
 * @param {string} hardwareId - The hardware ID to verify against
 * @returns {boolean} True if valid
 */
function verifyActivationKey(activationKey, hardwareId) {
  try {
    const expectedKey = generateActivationKey(hardwareId);
    const normalizedInput = activationKey.replace(/-/g, '').toUpperCase();
    const normalizedExpected = expectedKey.replace(/-/g, '').toUpperCase();
    
    return normalizedInput === normalizedExpected;
  } catch (error) {
    return false;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n=== License Key Generator ===\n');
    console.log('Usage:');
    console.log('  Generate key:  node generate-license-key.js <hardware-id>');
    console.log('  Verify key:    node generate-license-key.js <hardware-id> <activation-key>');
    console.log('\nExample:');
    console.log('  node generate-license-key.js HWID-ABC123-XYZ789');
    console.log('  node generate-license-key.js HWID-ABC123-XYZ789 ABCD-1234-EFGH-5678-IJKL-9012-MNOP-3456\n');
    process.exit(1);
  }
  
  const hardwareId = args[0];
  const activationKey = args[1];
  
  try {
    if (activationKey) {
      // Verify mode
      const isValid = verifyActivationKey(activationKey, hardwareId);
      console.log('\n=== Verification Result ===');
      console.log(`Hardware ID: ${hardwareId}`);
      console.log(`Activation Key: ${activationKey}`);
      console.log(`Status: ${isValid ? '✅ VALID' : '❌ INVALID'}\n`);
      process.exit(isValid ? 0 : 1);
    } else {
      // Generate mode
      const key = generateActivationKey(hardwareId);
      console.log('\n=== Generated Activation Key ===');
      console.log(`Hardware ID: ${hardwareId}`);
      console.log(`Activation Key: ${key}`);
      console.log('\n⚠️  This key will ONLY work on the device with this Hardware ID!');
      console.log('📋 Copy the activation key and provide it to the user.\n');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

module.exports = {
  generateActivationKey,
  verifyActivationKey,
  SECRET_KEY
};