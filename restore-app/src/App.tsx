import React, { useState } from 'react';
import pako from 'pako';
import CryptoJS from 'crypto-js';
import * as encoding from 'encoding-japanese';
import { templates, departmentMap } from './templates';
import type { Field } from './templates';

const App: React.FC = () => {
  const [qrData, setQrData] = useState('');
  const [restoredData, setRestoredData] = useState<Record<string, string>>({});
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;

  const handleRestore = () => {
    try {
      const decrypted = CryptoJS.AES.decrypt(qrData, encryptionKey);
      const decryptedBytes = new Uint8Array(decrypted.words.length * 4);
      for (let i = 0; i < decrypted.words.length; i++) {
        decryptedBytes[i * 4] = (decrypted.words[i] >> 24) & 0xff;
        decryptedBytes[i * 4 + 1] = (decrypted.words[i] >> 16) & 0xff;
        decryptedBytes[i * 4 + 2] = (decrypted.words[i] >> 8) & 0xff;
        decryptedBytes[i * 4 + 3] = decrypted.words[i] & 0xff;
      }
      const trimmedBytes = decryptedBytes.slice(0, decrypted.sigBytes);
      const decompressed = pako.inflate(trimmedBytes);
      const decoded = encoding.convert(decompressed, {
        to: 'UNICODE',
        from: 'SJIS',
        type: 'string',
      });
      const parsed = decoded.split(',');
      const deptIdFromQr = parsed[0];

      if (departmentId && departmentId !== deptIdFromQr) {
        setError('選択した診療科とQRコード内の診療科が一致しません');
        setRestoredData({});
        return;
      }
      setDepartmentId(deptIdFromQr);

      const template = templates[deptIdFromQr];
      if (!template) {
        setError('未知の診療科IDです');
        return;
      }

      const dataPart = parsed.slice(1);
      const obj: Record<string, string> = {};
      template.fields.forEach((field, idx) => {
        obj[field.name] = dataPart[idx] || '';
      });
      setRestoredData(obj);
      setError('');
    } catch (e) {
      console.error('Error during restore process:', e);
      setError('復元に失敗しました');
      setRestoredData({});
    }
  };

  const handleClear = () => {
    setQrData('');
    setRestoredData({});
    setError('');
  };

  const formatValue = (field: Field, value: string) => {
    if (field.type === 'checkbox') {
      return value
        .split(';')
        .map((v) => field.options?.find((o) => o.value === v)?.label || v)
        .join(', ');
    }
    if (field.type === 'select') {
      return field.options?.find((o) => o.value === value)?.label || value;
    }
    return value;
  };

  const currentTemplate = departmentId ? templates[departmentId] : undefined;

  const handleCopyToClipboard = () => {
    if (!currentTemplate) return;
    const lines = currentTemplate.fields.map((f) => `${f.label}: ${formatValue(f, restoredData[f.name] || '')}`);
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Copied to clipboard!');
  };

  return (
    <div className="container mt-5">
      <h1>QR問診票復元</h1>
      <div className="mb-3">
        <label className="form-label">診療科</label>
        <select className="form-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">選択してください</option>
          {Object.entries(departmentMap).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">QRデータ</label>
        <textarea className="form-control" rows={5} value={qrData} onChange={(e) => setQrData(e.target.value)}></textarea>
      </div>
      <button className="btn btn-primary me-2" onClick={handleRestore}>
        復元
      </button>
      <button className="btn btn-secondary" onClick={handleClear}>
        クリア
      </button>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {currentTemplate && Object.keys(restoredData).length > 0 && (
        <div className="mt-5">
          <h2>復元された問診データ</h2>
          <table className="table table-bordered">
            <tbody>
              {currentTemplate.fields.map((field) => (
                <tr key={field.name}>
                  <th>{field.label}</th>
                  <td>{formatValue(field, restoredData[field.name] || '')}</td>
                </tr>
              ))}
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
