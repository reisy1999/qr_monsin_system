export async function decryptQr(data: string): Promise<string> {
  const res = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });

  if (!res.ok) {
    throw new Error('decrypt failed');
  }
  const json = await res.json();
  if (!json.csv) {
    throw new Error('decrypt failed');
  }
  return json.csv as string;
}
