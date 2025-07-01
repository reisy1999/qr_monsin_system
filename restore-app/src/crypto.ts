/* eslint-disable @typescript-eslint/no-unused-vars */
export function decryptCsv(data: string, _key: string): string {
  try {
    const binary = atob(data);
    const bytes = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
    const decoded = new TextDecoder().decode(bytes);
    return decoded;
  } catch (e) {
    console.error('decryptCsv failed', e);
    return '';
  }
}

export function encryptCsv(data: string, _key: string): string {
  try {
    const bytes = new TextEncoder().encode(data);
    const binary = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join('');
    return btoa(binary);
  } catch (e) {
    console.error('encryptCsv failed', e);
    return '';
  }
}
