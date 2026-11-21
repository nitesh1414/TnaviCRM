const crypto = require('crypto');
const PREFIX = 'enc:v1:';
function key() {
  const value = process.env.SETTINGS_ENCRYPTION_KEY || '';
  if (!/^[0-9a-fA-F]{64}$/.test(value)) throw new Error('SETTINGS_ENCRYPTION_KEY must be 64 hexadecimal characters.');
  return Buffer.from(value, 'hex');
}
function encrypt(value) {
  if (!value || value.startsWith(PREFIX)) return value;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return PREFIX + Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}
function decrypt(value) {
  if (!value || !value.startsWith(PREFIX)) return value; // Legacy plaintext remains readable until settings are saved.
  const payload = Buffer.from(value.slice(PREFIX.length), 'base64');
  if (payload.length < 29) throw new Error('Invalid encrypted settings secret');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8');
}
module.exports = { encrypt, decrypt };
