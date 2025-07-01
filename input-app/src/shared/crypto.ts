export function encrypt(data: string): string {
  return btoa(data);
}

export function decrypt(data: string): string {
  return atob(data);
}
