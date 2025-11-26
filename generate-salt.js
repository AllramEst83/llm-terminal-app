import crypto from 'crypto';

// Generate a 32-byte (256-bit) cryptographically secure random salt
const salt = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Generated API Key Encryption Salt:\n');
console.log(`API_KEY_ENCRYPTION_SALT=${salt}\n`);
console.log('Copy this to your supabase/.env.local file\n');