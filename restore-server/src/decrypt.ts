import { KeyObject, privateDecrypt, constants } from 'crypto';

/**
 * 現在は単一の秘密鍵のみを使用して復号しているが、
 * このロジックは将来的な鍵ローテーション（例：年次更新）への対応を見越して設計されている。
 * 例えば、6月1日〜7月1日の移行期間中に新旧2つの鍵で復号を試行するなどの運用を想定している。
 */
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
