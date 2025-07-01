import React, { useState, useEffect, useRef } from 'react';
import { departmentMap } from '../../shared/templates';
import type { Template } from '../../shared/templates';
import StepForm from './components/StepForm';
import { buildCsv } from './utils/csvBuilder';
import { fetchPublicKey } from './utils/fetchKey';
import { encodeAndEncrypt } from './logic/encodeAndEncrypt';
import { generateQrFromEncrypted } from './logic/qrGenerator';
import { postQrGeneratedLog } from './api/logApi';
import { isVisible } from './utils/isVisible';
import ErrorBanner from './components/ErrorBanner';

const App: React.FC = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [step, setStep] = useState(0);
  const [qrGenerated, setQrGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const visibleQuestions = template
    ? template.questions.filter((q) => isVisible(q, formData))
    : [];

  useEffect(() => {
    if (!template) return;
    const currentVisible = template.questions.filter((q) =>
      isVisible(q, formData)
    );
    if (step >= currentVisible.length) {
      setStep(Math.max(0, currentVisible.length - 1));
    }
  }, [formData, template, step]);

  useEffect(() => {
    fetchPublicKey()
      .then((key) => setPublicKey(key))
      .catch(() =>
        setError(
          'サーバーとの通信に失敗しました。通信環境の良い場所でページを再読み込みしてください。'
        )
      );
  }, []);

  useEffect(() => {
    if (!departmentId) {
      setTemplate(null);
      setFormData({});
      setStep(0);
      return;
    }
    fetch(`/templates/${departmentId}.json`)
      .then((res) => res.json())
      .then((data: Template) => {
        setTemplate(data);
        const init: Record<string, string | string[]> = {};
        data.questions.forEach((q) => {
          if (q.type === 'multi_select') {
            init[q.id] = q.bitflag ? '0' : [];
          } else {
            init[q.id] = '';
          }
        });
        setFormData(init);
        setStep(0);
      })
      .catch(() =>
        setError('テンプレートの取得に失敗しました。しばらくしてから再度お試しください。')
      );
  }, [departmentId]);

  const handleChange = (id: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template || !publicKey) return;
    setError('');
    setQrGenerated(false);
    const csvStr = buildCsv(departmentId, template, formData);
    try {
      const encrypted = await encodeAndEncrypt(csvStr, publicKey);
      if (canvasRef.current) {
        await generateQrFromEncrypted(encrypted, canvasRef.current);
        await postQrGeneratedLog(template.version);
        setQrGenerated(true);
      }
    } catch (err) {
      console.error(err);
      setError(
        'QRコードの生成に失敗しました。お手数ですが、最初からやり直してください。'
      );
    }
  };

  useEffect(() => {
    if (!template) return;
    const handler = (e: BeforeUnloadEvent) => {
      const hasData = Object.values(formData).some((v) => {
        if (Array.isArray(v)) return v.length > 0;
        return v !== '' && v !== '0';
      });
      if (!hasData) return;
      e.preventDefault();
      e.returnValue =
        'Your progress will be lost. Are you sure you want to leave this page?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData, template]);

  if (error) {
    return (
      <div className="container mt-5">
        <ErrorBanner message={error} />
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
        <form onSubmit={handleSubmit} className="d-flex flex-column align-items-center">
          <StepForm template={template} data={formData} onChange={handleChange} step={step} />
          <div className="d-flex justify-content-between w-100 mt-3">
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              戻る
            </button>
            {step < visibleQuestions.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() =>
                  setStep((s) => Math.min(visibleQuestions.length - 1, s + 1))
                }
              >
                次へ
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-lg">
                確認してQR生成
              </button>
            )}
          </div>
        </form>
      )}
      {qrGenerated && <canvas ref={canvasRef} className="mt-4" />}
    </div>
  );
};

export default App;
