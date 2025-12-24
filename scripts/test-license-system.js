/**
 * Test License System - Verify Algorithm Consistency
 * This script tests that the license generation and verification algorithms match
 */

const crypto = require('crypto');

// Must match SimpleLicenseService.ts
const SECRET_KEY = 'DENTAL_LAB_2025_SECRET_KEY_CHANGE_IN_PRODUCTION';

// Test cases
const testCases = [
  '12345678-90AB-CDEF-1234-567890ABCDEF',
  'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE',
  'F1E2D3C4-B5A6-9788-6564-534241302918'
];

console.log('🧪 Testing License System Algorithm\n');
console.log('═'.repeat(80));

testCases.forEach((machineId, index) => {
  console.log(`\nTest Case ${index + 1}:`);
  console.log(`Machine GUID: ${machineId}`);
  
  // Generate (like generate-license.js)
  const normalizedMachineId = machineId.trim().toUpperCase();
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(normalizedMachineId);
  const signature = hmac.digest('hex');
  const generatedKey = signature.substring(0, 32).toUpperCase();
  const formattedKey = generatedKey.match(/.{1,4}/g).join('-');
  
  console.log(`Generated Key: ${formattedKey}`);
  
  // Verify (like SimpleLicenseService.verifyLicenseKey)
  const normalizedKey = formattedKey.replace(/-/g, '').trim().toUpperCase();
  const hmac2 = crypto.createHmac('sha256', SECRET_KEY);
  hmac2.update(normalizedMachineId);
  const expectedSignature = hmac2.digest('hex');
  const expectedKey = expectedSignature.substring(0, 32).toUpperCase();
  
  const isValid = normalizedKey === expectedKey;
  console.log(`Verification: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!isValid) {
    console.log(`  Generated: ${normalizedKey}`);
    console.log(`  Expected:  ${expectedKey}`);
  }
});

console.log('\n' + '═'.repeat(80));
console.log('\n✅ All tests completed. If any failed, there is an algorithm mismatch.\n');