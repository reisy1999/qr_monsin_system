import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import pako from 'pako';
import CryptoJS from 'crypto-js';
import * as Encoding from 'encoding-japanese';
import { templates, departmentMap } from './templates';
import type { Field } from './templates';

const App: React.FC = () => {
  const [departmentId, setDepartmentId] = useState('');
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [qrData, setQrData] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;

  useEffect(() => {
    if (!departmentId) {
      setQrData('');
      return;
    }
    const template = templates[departmentId];
    if (!template) return;
    const csvData = [
      departmentId,
      ...template.fields.map((field: Field) => {
        const val = formData[field.name];
        if (field.type === 'checkbox') {
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
  }, [formData, departmentId]);

  useEffect(() => {
    if (qrCanvasRef.current && qrData) {
      QRCode.toCanvas(qrCanvasRef.current, qrData, { errorCorrectionLevel: 'M', width: 256 }, function (error: unknown) {
        if (error) console.error(error);
      });
    }
  }, [qrData]);

  useEffect(() => {
    if (departmentId) {
      const initial: Record<string, string | string[]> = {};
      templates[departmentId].fields.forEach((f) => {
        initial[f.name] = f.type === 'checkbox' ? [] : '';
      });
      setFormData(initial);
    } else {
      setFormData({});
    }
  }, [departmentId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const renderField = (field: Field) => {
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div className="mb-3" key={field.name}>
            <label className="form-label">{field.label}</label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              className="form-control"
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
              maxLength={field.name === 'freeText' ? 300 : undefined}
            />
          </div>
        );
      case 'select':
        return (
          <div className="mb-3" key={field.name}>
            <label className="form-label">{field.label}</label>
            <select
              className="form-select"
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleInputChange}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      case 'checkbox':
        return (
          <div className="mb-3" key={field.name}>
            <label className="form-label">{field.label}</label>
            <div>
              {field.options?.map((opt) => (
                <div className="form-check form-check-inline" key={opt.value}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name={field.name}
                    value={opt.value}
                    onChange={handleCheckboxChange}
                    checked={(formData[field.name] || []).includes(opt.value)}
                  />
                  <label className="form-check-label">{opt.label}</label>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const currentTemplate = departmentId ? templates[departmentId] : undefined;

  return (
    <div className="container mt-5">
      <h1>QR問診票入力</h1>
      <div className="mb-3">
        <label className="form-label">診療科</label>
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
      {currentTemplate && (
        <form>
          {currentTemplate.fields.map((field) => renderField(field))}
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
