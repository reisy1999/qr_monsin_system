import pako from 'pako';
import CryptoJS from 'crypto-js';
import * as Encoding from 'encoding-japanese';

export function encryptCsv(csvData: string, key: string): string {
  const sjisArray = Encoding.convert(csvData, { to: 'SJIS', type: 'arraybuffer' });
  const compressed = pako.deflate(sjisArray);
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.lib.WordArray.create(compressed),
    key
  ).toString();
  return encrypted;
}

export function decryptCsv(encrypted: string, key: string): string {
  const decrypted = CryptoJS.AES.decrypt(encrypted, key);
  const decryptedBytes = new Uint8Array(decrypted.words.length * 4);
  for (let i = 0; i < decrypted.words.length; i++) {
    decryptedBytes[i * 4] = (decrypted.words[i] >> 24) & 0xff;
    decryptedBytes[i * 4 + 1] = (decrypted.words[i] >> 16) & 0xff;
    decryptedBytes[i * 4 + 2] = (decrypted.words[i] >> 8) & 0xff;
    decryptedBytes[i * 4 + 3] = decrypted.words[i] & 0xff;
  }
  const trimmedBytes = decryptedBytes.slice(0, decrypted.sigBytes);
  const decompressed = pako.inflate(trimmedBytes);
  const decoded = Encoding.convert(decompressed, {
    to: 'UNICODE',
    from: 'SJIS',
    type: 'string',
  });
  return decoded as string;
}
