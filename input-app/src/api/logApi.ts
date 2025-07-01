export async function postQrGeneratedLog(formVersion: string): Promise<void> {
  try {
    const response = await fetch('/api/logs/qr-generated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formVersion,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      console.warn(`ログ送信に失敗しました (HTTP Status: ${response.status}, ${response.statusText})。処理は継続します。`);
    }
  } catch (err) {
    console.warn('ログ送信に失敗しました (ネットワークエラー)。処理は継続します。', err);
  }
}
