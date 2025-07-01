import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import iconv from 'iconv-lite';
import { createPrivateKey, privateDecrypt, constants } from 'crypto';

export function decodeAndDecrypt(base64Str: string): string {
  const encryptedBuffer = Buffer.from(base64Str, 'base64');

  const keyPaths = [
    path.resolve(__dirname, '../../keys/current.pem'),
    path.resolve(__dirname, '../../keys/previous.pem')
  ];

  let decryptedBuffer: Buffer | null = null;

  for (const keyPath of keyPaths) {
    try {
      const privateKey = createPrivateKey(fs.readFileSync(keyPath, 'utf8'));

      decryptedBuffer = privateDecrypt(
        {
          key: privateKey,
          padding: constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256'
        },
        encryptedBuffer
      );
      break;
    } catch {
      continue;
    }
  }

  if (!decryptedBuffer) throw new Error('復号に失敗しました');

  const decompressed = zlib.inflateSync(decryptedBuffer);
  const utf8Str = iconv.decode(decompressed, 'Shift_JIS');
  return utf8Str;
}
