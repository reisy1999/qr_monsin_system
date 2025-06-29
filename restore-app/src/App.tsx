import React, { useState } from 'react';
import pako from 'pako';
import CryptoJS from 'crypto-js';
import * as encoding from 'encoding-japanese'; // encoding-japaneseライブラリ全体をインポート

// --- DEBUG START: DO NOT DEPLOY TO PRODUCTION ---
// このコードは、ブラウザのコンソールからCryptoJS, pako, encoding-japaneseにアクセスできるように、
// グローバルなwindowオブジェクトにライブラリを露出させます。
// 本番環境にデプロイする前に、必ずこのブロックを削除してください。
declare global {
  interface Window {
    CryptoJS: typeof CryptoJS;
    pako: typeof pako;
    encoding: typeof encoding;
  }
}
window.CryptoJS = CryptoJS;
window.pako = pako;
window.encoding = encoding;
// --- DEBUG END ---

const App: React.FC = () => {
  const [qrData, setQrData] = useState('');
  const [restoredData, setRestoredData] = useState<string[]>([]);
  const [error, setError] = useState('');

  // IDとラベルのマッピング
  const genderMap: { [key: string]: string } = {
    '1': '男性',
    '2': '女性',
    '3': 'その他',
  };

  const symptomMap: { [key: string]: string } = {
    '3': '頭痛',
    '4': '腹痛',
    '6': '発熱',
  };

  const durationMap: { [key: string]: string } = {
    '1': '1日以内',
    '2': '2-3日',
    '3': '1週間以上',
  };

  const historyMap: { [key: string]: string } = {
    '8': '高血圧',
    '1': '糖尿病',
    '2': '心臓病',
  };

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY; // 環境変数から読み込み

  const handleRestore = () => {
    console.log("handleRestore called.");
    console.log("Input qrData:", qrData);
    try {
      // 1. Base64 decode (CryptoJS does this automatically)
      const decrypted = CryptoJS.AES.decrypt(qrData, encryptionKey);
      console.log("Decrypted sigBytes:", decrypted.sigBytes);

      // Convert WordArray to Uint8Array
      const decryptedBytes = new Uint8Array(decrypted.words.length * 4);
      for (let i = 0; i < decrypted.words.length; i++) {
        decryptedBytes[i * 4] = (decrypted.words[i] >> 24) & 0xff;
        decryptedBytes[i * 4 + 1] = (decrypted.words[i] >> 16) & 0xff;
        decryptedBytes[i * 4 + 2] = (decrypted.words[i] >> 8) & 0xff;
        decryptedBytes[i * 4 + 3] = decrypted.words[i] & 0xff;
      }

      // Trim padding
      const trimmedBytes = decryptedBytes.slice(0, decrypted.sigBytes);
      console.log("Trimmed bytes length:", trimmedBytes.length);

      // 2. zlib decompression
      const decompressed = pako.inflate(trimmedBytes);
      console.log("Decompressed data:", decompressed);

      // 3. Decode from Shift_JIS
      const decoded = encoding.convert(decompressed, {
        to: 'UNICODE', // UTF-8に相当
        from: 'SJIS',
        type: 'string'
      });
      console.log("Decoded string:", decoded);

      // 4. CSV parsing
      const parsedData = decoded.split(',');
      console.log("Parsed data:", parsedData);

      setRestoredData(parsedData);
      setError('');

    } catch (e) {
      console.error("Error during restore process:", e);
      setError('Failed to restore data. Please check the QR code and try again.');
      setRestoredData([]);
    }
  };

  const handleClear = () => {
    setQrData('');
    setRestoredData([]);
    setError('');
  };

  const handleCopyToClipboard = () => {
    const formattedText = `
Name: ${restoredData[0]}
Date of Birth: ${restoredData[1]}-${restoredData[2]}-${restoredData[3]}
Age: ${restoredData[4]}
Sex: ${restoredData[5] === '1' ? 'Male' : restoredData[5] === '2' ? 'Female' : 'Other'}
Symptoms: ${restoredData[6]}
Duration: ${restoredData[7]}
History: ${restoredData[8]}
Free Text: ${restoredData[9]}
`;
    navigator.clipboard.writeText(formattedText);
    alert('Copied to clipboard!');
  };

  return (
    <div className="container mt-5">
      <h1>QR問診票復元</h1>
      <div className="mb-3">
        <label className="form-label">QRデータ</label>
        <textarea
          className="form-control"
          rows={5}
          value={qrData}
          onChange={(e) => setQrData(e.target.value)}
        ></textarea>
      </div>
      <button className="btn btn-primary me-2" onClick={handleRestore}>
        復元
      </button>
      <button className="btn btn-secondary" onClick={handleClear}>
        クリア
      </button>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {restoredData.length > 0 && (
        <div className="mt-5">
          <h2>復元された問診データ</h2>
          <table className="table table-bordered">
            <tbody>
              <tr>
                <th>氏名</th>
                <td>{restoredData[0]}</td>
              </tr>
              <tr>
                <th>生年月日</th>
                <td>{`${restoredData[1]}年${restoredData[2]}月${restoredData[3]}日`}</td>
              </tr>
              <tr>
                <th>年齢</th>
                <td>{restoredData[4]}</td>
              </tr>
              <tr>
                <th>性別</th>
                <td>{genderMap[restoredData[5]] || restoredData[5]}</td>
              </tr>
              <tr>
                <th>症状</th>
                <td>{restoredData[6].split(';').map(id => symptomMap[id] || id).join(', ')}</td>
              </tr>
              <tr>
                <th>症状の期間</th>
                <td>{durationMap[restoredData[7]] || restoredData[7]}</td>
              </tr>
              <tr>
                <th>既往歴</th>
                <td>{restoredData[8].split(';').map(id => historyMap[id] || id).join(', ')}</td>
              </tr>
              <tr>
                <th>自由記述</th>
                <td>{restoredData[9]}</td>
              </tr>
            </tbody>
          </table>
          <button className="btn btn-info mt-3" onClick={handleCopyToClipboard}>
            クリップボードにコピー
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
