export async function decryptQr(data: string): Promise<string> {
  const res = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = typeof json.error === 'string' ? json.error : 'decrypt failed';
    throw new Error(msg);
  }

  if (!json.csv) {
    throw new Error('decrypt failed');
  }

  return json.csv as string;
}
