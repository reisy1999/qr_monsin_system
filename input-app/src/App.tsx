import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { departmentMap } from './templates';
import type { Template, Question } from './templates';
import { encryptCsv } from '../../shared/crypto';

const App: React.FC = () => {
  const [departmentId, setDepartmentId] = useState('');
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [qrData, setQrData] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;

  const isFieldVisible = React.useCallback(
    (field: Question, data: Record<string, string | string[]>) => {
      if (field.conditional_on && field.conditional_value) {
        const val = data[field.conditional_on];
        if (Array.isArray(val)) {
          return val.some((v) => field.conditional_value?.map(String).includes(String(v)));
        }
        return field.conditional_value.map(String).includes(String(val));
      }
      return true;
    },
    []
  );

  const validateField = React.useCallback(
    (
      field: Question,
      value: string | string[],
      data: Record<string, string | string[]>
    ): string | null => {
      if (!isFieldVisible(field, data)) return null;

    if (field.required) {
      if (field.type === 'multi_select') {
        if (!Array.isArray(value) || value.length === 0) {
          return `${field.label} is required.`;
        }
      } else if (value === '' || value === undefined) {
        return `${field.label} is required.`;
      }
    }

    if (field.type === 'text') {
      if (field.maxLength !== undefined && typeof value === 'string' && value.length > field.maxLength) {
        return `${field.label} must be at most ${field.maxLength} characters.`;
      }
      if (field.validationRegex) {
        const re = new RegExp(field.validationRegex);
        if (typeof value === 'string' && value && !re.test(value)) {
          return `${field.label} is invalid.`;
        }
      }
    }

    if (field.type === 'number') {
      if (value !== '') {
        const num = Number(value);
        if (Number.isNaN(num)) {
          return `${field.label} must be a number.`;
        }
        if (field.min !== undefined && num < field.min) {
          return `${field.label} must be >= ${field.min}.`;
        }
        if (field.max !== undefined && num > field.max) {
          return `${field.label} must be <= ${field.max}.`;
        }
      }
    }

    if (field.type === 'select') {
      const options = field.options?.map((o) => String(o.id)) || [];
      if (value && !options.includes(String(value))) {
        return `${field.label} has invalid selection.`;
      }
    }

    if (field.type === 'multi_select') {
      const options = field.options?.map((o) => String(o.id)) || [];
      if (Array.isArray(value)) {
        const invalid = value.find((v) => !options.includes(String(v)));
        if (invalid) return `${field.label} has invalid selection.`;
      }
    }

    return null;
  },
    [isFieldVisible]
  );

  const validateForm = React.useCallback(
    (tmpl: Template, data: Record<string, string | string[]>) => {
      const errs: Record<string, string> = {};
      tmpl.questions.forEach((q) => {
        const err = validateField(q, data[q.id], data);
        if (err) errs[q.id] = err;
      });
      return errs;
    },
    [validateField]
  );

  useEffect(() => {
    if (!departmentId || !template) {
      setQrData('');
      setErrors({});
      return;
    }

    const errs = validateForm(template, formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
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

    const encrypted = encryptCsv(csvData, encryptionKey);

    setQrData(encrypted);
  }, [formData, departmentId, template, encryptionKey, validateForm]);

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
          if (q.type === 'multi_select') {
            initial[q.id] = Array.isArray(q.defaultValue)
              ? (q.defaultValue as string[])
              : [];
          } else {
            initial[q.id] = (q.defaultValue as string) ?? '';
          }
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
    if (!isFieldVisible(field, formData)) return null;
    const errorMsg = errors[field.id];
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
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              min={field.min}
              max={field.max}
            />
            {errorMsg && <div className="text-danger mt-1">{errorMsg}</div>}
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
            {errorMsg && <div className="text-danger mt-1">{errorMsg}</div>}
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
            {errorMsg && <div className="text-danger mt-1">{errorMsg}</div>}
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
              placeholder={field.placeholder}
            />
            {errorMsg && <div className="text-danger mt-1">{errorMsg}</div>}
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
