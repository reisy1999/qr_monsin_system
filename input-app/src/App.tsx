import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import pako from 'pako';
import CryptoJS from 'crypto-js';
import * as Encoding from 'encoding-japanese';
import { departmentMap } from './templates';
import type { Template, Question } from './templates';

const App: React.FC = () => {
  const [departmentId, setDepartmentId] = useState('');
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [qrData, setQrData] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;

  useEffect(() => {
    if (!departmentId || !template) {
      setQrData('');
      return;
    }

    const csvData = [
      departmentId,
      ...template.questions.map((q: Question) => {
        const val = formData[q.id];
        if (q.type === 'multi_select') {
          if (q.bitflag) {
            const arr = Array.isArray(val) ? val : [];
            return arr.reduce(
              (acc, v) => acc | (1 << (parseInt(v as string, 10) - 1)),
              0
            );
          }
          return Array.isArray(val) ? val.join(';') : '';
        }
        return val ?? '';
      }),
    ].join(',');

    const sjis_array = Encoding.convert(csvData, { to: 'SJIS', type: 'arraybuffer' });
    const compressed = pako.deflate(sjis_array);
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.lib.WordArray.create(compressed),
      encryptionKey
    ).toString();

    setQrData(encrypted);
  }, [formData, departmentId, template, encryptionKey]);

  useEffect(() => {
    if (qrCanvasRef.current && qrData) {
      QRCode.toCanvas(qrCanvasRef.current, qrData, { errorCorrectionLevel: 'M', width: 256 }, function (error: unknown) {
        if (error) console.error(error);
      });
    }
  }, [qrData]);

  useEffect(() => {
    if (!departmentId) {
      setTemplate(null);
      setFormData({});
      return;
    }
    setLoading(true);
    fetch(`/templates/${departmentId}.json`)
      .then((res) => res.json())
      .then((data: Template) => {
        setTemplate(data);
        const initial: Record<string, string | string[]> = {};
        data.questions.forEach((q) => {
          initial[q.id] = q.type === 'multi_select' ? [] : '';
        });
        setFormData(initial);
      })
      .catch((err) => {
        console.error(err);
        setTemplate(null);
        setFormData({});
      })
      .finally(() => setLoading(false));
  }, [departmentId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    const current = formData[name] as string[];
    if (checked) {
      setFormData({ ...formData, [name]: [...current, value] });
    } else {
      setFormData({ ...formData, [name]: current.filter((v) => v !== value) });
    }
  };

  const renderField = (field: Question) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div className="mb-3" key={field.id}>
            <label className="form-label">{field.label}</label>
            <input
              type={field.type === 'number' ? 'number' : field.type}
              className="form-control"
              name={field.id}
              value={formData[field.id] || ''}
              onChange={handleInputChange}
              maxLength={field.id === 'freeText' ? 300 : undefined}
            />
          </div>
        );
      case 'select':
        return (
          <div className="mb-3" key={field.id}>
            <label className="form-label">{field.label}</label>
            <select
              className="form-select"
              name={field.id}
              value={formData[field.id] || ''}
              onChange={handleInputChange}
            >
              {field.options?.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      case 'multi_select':
        return (
          <div className="mb-3" key={field.id}>
            <label className="form-label">{field.label}</label>
            <div>
              {field.options?.map((opt) => (
                <div className="form-check form-check-inline" key={opt.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name={field.id}
                    value={String(opt.id)}
                    onChange={handleCheckboxChange}
                    checked={(formData[field.id] || []).includes(String(opt.id))}
                  />
                  <label className="form-check-label">{opt.label}</label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'date':
        return (
          <div className="mb-3" key={field.id}>
            <label className="form-label">{field.label}</label>
            <input
              type="date"
              className="form-control"
              name={field.id}
              value={formData[field.id] || ''}
              onChange={handleInputChange}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!departmentId) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <div>
          <h1 className="mb-3">診療科を選択してください</h1>
          <select
            className="form-select"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
      {loading && <p>Loading...</p>}
      {template && !loading && (
        <form>
          {template.questions.map((field) => renderField(field))}
        </form>
      )}
      <div className="mt-5">
        <h2>生成されたQRコード</h2>
        {qrData && <canvas ref={qrCanvasRef}></canvas>}
        {qrData && (
          <div className="mt-3">
            <h3>QRコードデータ (テスト用)</h3>
            <textarea className="form-control" rows={5} readOnly value={qrData} style={{ fontSize: '0.8em' }}></textarea>
            <small className="text-danger">※この表示はテスト用です。本番環境デプロイ前に必ず削除してください。</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
