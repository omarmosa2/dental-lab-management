/**
 * License Key Generator Script for Simple License System
 * Usage: node scripts/generate-license.js <machine-guid>
 * 
 * This script generates a license key for a given Windows Machine GUID.
 * The algorithm MUST match SimpleLicenseService.ts exactly.
 * 
 * ⚠️ IMPORTANT: This file uses the SAME algorithm as SimpleLicenseService.ts
 */

const crypto = require('crypto');

// ✅ Secret key - MUST match the one in SimpleLicenseService.ts EXACTLY
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';

/**
 * Generate license key using HMAC-SHA256
 * This matches the algorithm in SimpleLicenseService.verifyLicenseKey()
 */
function generateLicenseKey(machineId) {
  if (!machineId || machineId.trim().length < 10) {
    throw new Error('Invalid Machine GUID');
  }

  // Normalize machine ID (same as service)
  const normalizedMachineId = machineId.trim().toUpperCase();

  // ✅ Generate signature using HMAC-SHA256 (same as SimpleLicenseService)
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(normalizedMachineId);
  const signature = hmac.digest('hex');
  
  // ✅ Take first 32 characters (same as SimpleLicenseService)
  const licenseKey = signature.substring(0, 32).toUpperCase();
  
  // ✅ Format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const formattedKey = licenseKey.match(/.{1,4}/g).join('-');
  
  return formattedKey;
}

/**
 * Verify that a license key is valid for a machine ID
 * This is for testing purposes
 */
function verifyLicenseKey(licenseKey, machineId) {
  const normalizedKey = licenseKey.replace(/-/g, '').trim().toUpperCase();
  const expectedKey = generateLicenseKey(machineId).replace(/-/g, '');
  return normalizedKey === expectedKey;
}

// Get machine ID from command line arguments
const machineId = process.argv[2];

if (!machineId) {
  console.error('❌ Error: Machine GUID is required');
  console.log('\n📖 Usage:');
  console.log('  node scripts/generate-license.js <machine-guid>');
  console.log('\n📝 Example:');
  console.log('  node scripts/generate-license.js 12345678-90AB-CDEF-1234-567890ABCDEF');
  console.log('\n💡 To get Machine GUID on Windows:');
  console.log('  reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid');
  process.exit(1);
}

try {
  const licenseKey = generateLicenseKey(machineId);
  
  console.log('\n✅ License Key Generated Successfully!\n');
  console.log('═'.repeat(60));
  console.log('Machine GUID (Input):');
  console.log(`  ${machineId.toUpperCase()}`);
  console.log('\nGenerated License Key:');
  console.log(`  ${licenseKey}`);
  console.log('═'.repeat(60));
  console.log('\n📋 Instructions:');
  console.log('  1. Copy the license key above');
  console.log('  2. Send it to the customer');
  console.log('  3. Customer enters it in the activation screen');
  console.log('  4. License will be bound to this machine only');
  console.log('\n⚠️  Important Notes:');
  console.log('  - This key works ONLY on the machine with this GUID');
  console.log('  - Each machine needs its own unique key');
  console.log('  - Keep a record of: Machine GUID → License Key → Customer');
  console.log('═'.repeat(60));
  
  // Self-test verification
  const isValid = verifyLicenseKey(licenseKey, machineId);
  console.log(`\n🧪 Self-Test: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
  if (!isValid) {
    console.error('\n⚠️  WARNING: Self-verification failed! Algorithm mismatch detected.');
    process.exit(1);
  }
  console.log('');
} catch (error) {
  console.error('\n❌ Error generating license key:', error.message);
  process.exit(1);
}