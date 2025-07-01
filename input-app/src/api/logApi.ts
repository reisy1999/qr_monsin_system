export async function postQrGeneratedLog(formVersion: string): Promise<void> {
  try {
    await fetch('/api/logs/qr-generated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formVersion,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('ログ送信に失敗しましたが処理は継続します', err);
  }
}
