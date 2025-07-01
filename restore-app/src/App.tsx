import React, { useState } from 'react';
import { decodeAndDecrypt } from './logic/decodeAndDecrypt';
import { parseCsv } from './utils/csvParser';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    try {
      const csv = decodeAndDecrypt(input.trim());
      const parsed = parseCsv(csv);
      setResult(parsed);
      setError('');
    } catch (e) {
      console.error(e);
      setError('QRコードの復号に失敗しました。再度読み取りをお試しください。');
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
