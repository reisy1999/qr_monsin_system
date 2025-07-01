import React, { useState } from 'react';
import { decryptQr } from './api';
import { parseCsv } from './utils/csvParser';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      const csv = await decryptQr(input.trim());
      const parsed = parseCsv(csv);
      setResult(parsed);
      setError('');
    } catch (e) {
      console.error(e);
      if (e instanceof Error && e.message) {
        setError(e.message);
      } else {
        setError(
          '復号に失敗しました。有効期間外のQRコードである可能性があります。患者様にご確認ください。'
        );
      }
      setResult([]);
    }
  };

  return (
    <div className="container mt-5">
      <h1>QR問診票復元</h1>
      <div className="mb-3">
        <label className="form-label">QRデータ</label>
        <textarea
          className="form-control"
          rows={5}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInput(e.target.value)
          }
        ></textarea>
      </div>
      <button className="btn btn-primary" onClick={handleSubmit}>
        復元
      </button>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {result.length > 0 && (
        <table className="table table-bordered mt-3">
          <tbody>
            {result.map((r) => (
              <tr key={r.label}>
                <th>{r.label}</th>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default App;
