import React, { useState } from 'react';
import { decryptQr } from './api';
import { parseCsvValues, mapValuesToLabels } from './utils/csvParser';
import type { Question, Template } from '../shared/templates';

const validateTemplate = (tpl: Template) => {
  if (!tpl || !Array.isArray(tpl.questions)) {
    throw new Error('Invalid template: questions array is missing or not an array.');
  }
  tpl.questions.forEach((q: Question) => {
    if (
      (q.type === 'select' || q.type === 'multi_select') &&
      !Array.isArray(q.options)
    ) {
      throw new Error(`Invalid template: question ${q.id} has undefined options for select/multi_select type.`);
    }
  });
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleSubmit = async () => {
    try {
      const csv = await decryptQr(input.trim());
      const values = parseCsvValues(csv);
      const departmentId = values.shift() || '';
      const res = await fetch(`/templates/${departmentId}.json`);
      const template: Template = await res.json();
      validateTemplate(template);
      const payloadBytes = atob(input.trim()).length;
      if (
        template.max_payload_bytes &&
        payloadBytes > template.max_payload_bytes
      ) {
        setWarning('QRデータが規定サイズを超えています');
      } else {
        setWarning('');
      }
      const labeled = mapValuesToLabels(values, template, true);
      setResult(labeled);
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
      setWarning('');
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
      {warning && !error && (
        <div className="alert alert-warning mt-3">{warning}</div>
      )}
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
