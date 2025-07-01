import React, { useState, useEffect } from 'react';
import { departmentMap } from './templates';
import type { Template } from './templates';
import { FormRenderer } from './components/FormRenderer';
import { buildCsv } from './utils/csvBuilder';
import { fetchPublicKey } from './utils/fetchKey';

const App: React.FC = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [csv, setCsv] = useState('');

  useEffect(() => {
    fetchPublicKey()
      .then((key) => setPublicKey(key))
      .catch(() =>
        setError('通信に失敗しました。オフライン環境での利用はできません。')
      );
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setTemplate(null);
      setFormData({});
      return;
    }
    fetch(`/templates/${departmentId}.json`)
      .then((res) => res.json())
      .then((data: Template) => {
        setTemplate(data);
        const init: Record<string, string | string[]> = {};
        data.questions.forEach((q) => {
          init[q.id] = q.type === 'checkbox' ? [] : '';
        });
        setFormData(init);
      })
      .catch(() =>
        setError('通信に失敗しました。オフライン環境での利用はできません。')
      );
  }, [departmentId]);

  const handleChange = (id: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    const csvStr = buildCsv(departmentId, template, formData);
    setCsv(csvStr);
  };

  if (error) {
    return (
      <div className="container mt-5">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!publicKey) {
    return <div className="container mt-5">Loading...</div>;
  }

  if (!departmentId) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <div>
          <h1 className="mb-3">診療科を選択してください</h1>
          <select
            className="form-select"
            value={departmentId}
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
      <h1>QR問診票入力 - {departmentMap[departmentId]}</h1>
      {template && (
        <form onSubmit={handleSubmit}>
          <FormRenderer template={template} data={formData} onChange={handleChange} />
          <button type="submit" className="btn btn-primary mt-3">
            CSV生成
          </button>
        </form>
      )}
      {csv && (
        <div className="mt-4">
          <h2>CSV</h2>
          <textarea className="form-control" rows={5} readOnly value={csv}></textarea>
        </div>
      )}
    </div>
  );
};

export default App;
