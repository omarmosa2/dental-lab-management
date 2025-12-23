/**
 * License Key Generator Script
 * Usage: node scripts/generate-license.js <hardware-id>
 * 
 * This script generates a license key for a given hardware ID.
 * It uses the same algorithm as LicenseService.
 */

const crypto = require('crypto');

// Secret key - MUST match the one in LicenseService
// In production, this should be stored securely
const SECRET_KEY = process.env.LICENSE_SECRET_KEY || 'dental-lab-license-secret-key-2025-change-in-production';

function generateLicenseKey(hardwareId) {
  if (!hardwareId || hardwareId.length < 20) {
    throw new Error('Invalid hardware ID');
  }

  // Create a signature using the hardware ID and secret key
  const data = `${hardwareId}-${SECRET_KEY}`;
  const signature = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 24)
    .toUpperCase();

  // Format as LICENSE-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const formattedKey = `LICENSE-${signature.match(/.{1,4}/g).join('-')}`;
  
  return formattedKey;
}

// Get hardware ID from command line arguments
const hardwareId = process.argv[2];

if (!hardwareId) {
  console.error('❌ Error: Hardware ID is required');
  console.log('\nUsage:');
  console.log('  node scripts/generate-license.js <hardware-id>');
  console.log('\nExample:');
  console.log('  node scripts/generate-license.js ABCD-1234-EFGH-5678-IJKL-9012-MNOP-3456');
  process.exit(1);
}

try {
  const licenseKey = generateLicenseKey(hardwareId);
  
  console.log('\n✅ License Key Generated Successfully!\n');
  console.log('Hardware ID:');
  console.log(`  ${hardwareId}\n`);
  console.log('License Key:');
  console.log(`  ${licenseKey}\n`);
  console.log('─'.repeat(50));
  console.log('Send this license key to the customer.');
  console.log('─'.repeat(50));
} catch (error) {
  console.error('❌ Error generating license key:', error.message);
  process.exit(1);
}

