import pako from 'pako';
import * as Encoding from 'encoding-japanese';

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encodeAndEncrypt(
  csv: string,
  publicKeyPem: string
): Promise<Uint8Array> {
  const sjisArray = Encoding.convert(
    Encoding.stringToCode(csv),
    'SJIS',
    'UNICODE'
  ) as number[];

  const sjisUint8 = new Uint8Array(sjisArray);

  const compressed = pako.deflate(sjisUint8);

  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKeyPem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    cryptoKey,
    compressed
  );

  return new Uint8Array(encrypted);
}

export { pemToArrayBuffer };
