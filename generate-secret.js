import crypto from 'crypto';

// Generate a 32-byte (256-bit) cryptographically secure random secret
const secret = crypto.randomBytes(32).toString('hex');

console.log('\n🔐 Generated API Key Encryption Secret:\n');
console.log(`API_KEY_ENCRYPTION_SECRET=${secret}\n`);
console.log('Copy this to your supabase/.env.local file\n');
console.log('⚠️  WARNING: Keep this secret secure and never commit it to version control!\n');