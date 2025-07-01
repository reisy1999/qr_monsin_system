export function decryptCsv(data: string, _key: string): string {
  try {
    const decoded = atob(data);
    return decoded;
  } catch (e) {
    console.error('decryptCsv failed', e);
    return '';
  }
}

export function encryptCsv(data: string, _key: string): string {
  try {
    return btoa(data);
  } catch (e) {
    console.error('encryptCsv failed', e);
    return '';
  }
}
