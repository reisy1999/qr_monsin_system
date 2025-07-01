export function encrypt(data: string): string {
  const bytes = new TextEncoder().encode(data);
  const binary = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  return btoa(binary);
}

export function decrypt(data: string): string {
  const binary = atob(data);
  const bytes = new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
  return new TextDecoder().decode(bytes);
}
