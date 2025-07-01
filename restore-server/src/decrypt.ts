import { KeyObject, privateDecrypt, constants } from 'crypto';

export function decryptWithKeys(encrypted: Buffer, keys: KeyObject[]): Buffer {
  let lastError: unknown;
  for (const key of keys) {
    try {
      const decrypted = privateDecrypt(
        {
          key,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        encrypted
      );
      return decrypted;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Decryption failed');
}
