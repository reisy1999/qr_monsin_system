export async function fetchPublicKey(): Promise<string> {
  const res = await fetch('/publicKey');
  if (!res.ok) throw new Error('公開鍵取得に失敗しました');
  return await res.text();
}
