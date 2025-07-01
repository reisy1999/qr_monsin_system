import React, { useState, useEffect } from 'react';
import { departmentMap } from './templates';
import type { Template, Question } from './templates';
import { decryptCsv } from './crypto';

const App: React.FC = () => {
  const [qrData, setQrData] = useState('');
  const [restoredData, setRestoredData] = useState<Record<string, string>>({});
  const [departmentId, setDepartmentId] = useState('');
  const [error, setError] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;

  const handleRestore = () => {
    try {
      if (!departmentId) {
        setError('診療科を選択してください');
        return;
      }
      const decoded = decryptCsv(qrData, encryptionKey);
      const parsed = decoded.split(',');
      const deptIdFromQr = parsed[0];

      if (departmentId !== deptIdFromQr) {
        setError('選択した診療科とQRコード内の診療科が一致しません');
        setRestoredData({});
        return;
      }

      if (!template) {
        setError('テンプレートの読み込みに失敗しました');
        return;
      }

      const dataPart = parsed.slice(1);
      const obj: Record<string, string> = {};
      template.questions.forEach((field: Question, idx: number) => {
        let value = dataPart[idx] || '';
        if (field.type === 'multi_select') {
          if (field.bitflag) {
            const num = parseInt(value, 10);
            const selected: string[] = [];
            field.options?.forEach((opt: { id: string | number }) => {
              const bit = 1 << (parseInt(opt.id as string, 10) - 1);
              if (num & bit) selected.push(String(opt.id));
            });
            value = selected.join(';');
          }
        }
        obj[field.id] = value;
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

  useEffect(() => {
    if (!departmentId) {
      setTemplate(null);
      setRestoredData({});
      return;
    }
    setLoading(true);
    fetch(`/templates/${departmentId}.json`)
      .then((res) => res.json())
      .then((data: Template) => {
        setTemplate(data);
        setRestoredData({});
      })
      .catch((err) => {
        console.error(err);
        setTemplate(null);
        setRestoredData({});
      })
      .finally(() => setLoading(false));
  }, [departmentId]);

  const formatValue = (field: Question, value: string) => {
    if (field.type === 'multi_select') {
      return value
        .split(';')
        .map((v) => field.options?.find((o) => String(o.id) === v)?.label || v)
        .join(', ');
    }
    if (field.type === 'select') {
      return field.options?.find((o) => String(o.id) === value)?.label || value;
    }
    return value;
  };

  const handleCopyToClipboard = () => {
    if (!template) return;
    const lines = template.questions.map(
      (f: Question) => `${f.label}: ${formatValue(f, restoredData[f.id] || '')}`
    );
    navigator.clipboard.writeText(lines.join('\n'));
    alert('Copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    if (!template) return;
    const lines = template.questions.map(
      (f: Question) => `${f.label}: ${formatValue(f, restoredData[f.id] || '')}`
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questionnaire.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!departmentId) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <div>
          <h1 className="mb-3">診療科を選択してください</h1>
          <select
            className="form-select"
            value=""
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setDepartmentId(e.target.value)
            }
          >
            <option value="">選択してください</option>
            {Object.entries(departmentMap).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1>QR問診票復元 - {departmentMap[departmentId] ?? ''}</h1>
      {loading && <p>Loading...</p>}
      <div className="mb-3">
        <label className="form-label">QRデータ</label>
        <textarea
          className="form-control"
          rows={5}
          value={qrData}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setQrData(e.target.value)
          }
        ></textarea>
      </div>
      <button className="btn btn-primary me-2" onClick={handleRestore}>
        復元
      </button>
      <button className="btn btn-secondary" onClick={handleClear}>
        クリア
      </button>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {template && Object.keys(restoredData).length > 0 && (
        <div className="mt-5">
          <h2>復元された問診データ</h2>
          <table className="table table-bordered">
            <tbody>
              {template.questions.map((field) => (
                <tr key={field.id}>
                  <th>{field.label}</th>
                  <td>{formatValue(field, restoredData[field.id] || '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-info mt-3 me-2" onClick={handleCopyToClipboard}>
            クリップボードにコピー
          </button>
          <button className="btn btn-success mt-3" onClick={handleDownloadTxt}>
            テキストをダウンロード
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
