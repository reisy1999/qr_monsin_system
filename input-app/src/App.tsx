import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import pako from 'pako';
import CryptoJS from 'crypto-js';
import * as Encoding from 'encoding-japanese'; // encoding-japaneseライブラリ全体をインポート

const App: React.FC = () => {
  const [formData, setFormData] = useState({
    name: 'サトウタロウ',
    birthYear: '1979',
    birthMonth: '03',
    birthDay: '25',
    age: '30',
    gender: '1',
    symptoms: ['3', '4', '6'],
    duration: '2',
    history: ['8', '1', '2'],
    freeText: '今すぐ受診させてほしい',
  });

  const [qrData, setQrData] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY; // 環境変数から読み込み

  useEffect(() => {
    const generateQrData = () => {
      const csvData = [
        formData.name,
        formData.birthYear,
        formData.birthMonth,
        formData.birthDay,
        formData.age,
        formData.gender,
        formData.symptoms.join(';'),
        formData.duration,
        formData.history.join(';'),
        formData.freeText,
      ].join(',');

      // 1. Convert to Shift_JIS
      const sjis_array = Encoding.convert(csvData, { to: 'SJIS', type: 'arraybuffer' });

      // 2. zlib compression
      const compressed = pako.deflate(sjis_array);

      // 3. AES encryption
      const encrypted = CryptoJS.AES.encrypt(
        CryptoJS.lib.WordArray.create(compressed),
        encryptionKey
      ).toString();

      // 4. Base64 encode (already done by CryptoJS)
      setQrData(encrypted);
    };

    generateQrData();
  }, [formData]);

  useEffect(() => {
    if (qrCanvasRef.current && qrData) {
      QRCode.toCanvas(qrCanvasRef.current, qrData, { errorCorrectionLevel: 'M', width: 256 }, function (error: any) {
        if (error) console.error(error);
      });
    }
  }, [qrData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    const currentValues = formData[name as keyof typeof formData] as string[];
    if (checked) {
      setFormData({ ...formData, [name]: [...currentValues, value] });
    } else {
      setFormData({ ...formData, [name]: currentValues.filter((v) => v !== value) });
    }
  };

  return (
    <div className="container mt-5">
      <h1>QR問診票入力</h1>
      <form>
        <div className="mb-3">
          <label className="form-label">氏名</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>
        <div className="row mb-3">
          <div className="col">
            <label className="form-label">生年月日（年）</label>
            <input
              type="number"
              className="form-control"
              name="birthYear"
              value={formData.birthYear}
              onChange={handleInputChange}
            />
          </div>
          <div className="col">
            <label className="form-label">月</label>
            <input
              type="number"
              className="form-control"
              name="birthMonth"
              value={formData.birthMonth}
              onChange={handleInputChange}
            />
          </div>
          <div className="col">
            <label className="form-label">日</label>
            <input
              type="number"
              className="form-control"
              name="birthDay"
              value={formData.birthDay}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">年齢</label>
          <input
            type="number"
            className="form-control"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">性別</label>
          <select
            className="form-select"
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
          >
            <option value="1">男性</option>
            <option value="2">女性</option>
            <option value="3">その他</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">症状</label>
          <div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="checkbox" name="symptoms" value="3" onChange={handleCheckboxChange} checked={formData.symptoms.includes('3')} />
              <label className="form-check-label">頭痛</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="checkbox" name="symptoms" value="4" onChange={handleCheckboxChange} checked={formData.symptoms.includes('4')} />
              <label className="form-check-label">腹痛</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="checkbox" name="symptoms" value="6" onChange={handleCheckboxChange} checked={formData.symptoms.includes('6')} />
              <label className="form-check-label">発熱</label>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">症状の期間</label>
          <select
            className="form-select"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
          >
            <option value="1">1日以内</option>
            <option value="2">2-3日</option>
            <option value="3">1週間以上</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">既往歴</label>
          <div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="checkbox" name="history" value="8" onChange={handleCheckboxChange} checked={formData.history.includes('8')} />
              <label className="form-check-label">高血圧</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="checkbox" name="history" value="1" onChange={handleCheckboxChange} checked={formData.history.includes('1')} />
              <label className="form-check-label">糖尿病</label>
            </div>
            <div className="form-check form-check-inline">
              <input className="form-check-input" type="checkbox" name="history" value="2" onChange={handleCheckboxChange} checked={formData.history.includes('2')} />
              <label className="form-check-label">心臓病</label>
            </div>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">自由記述</label>
          <input
            type="text"
            className="form-control"
            name="freeText"
            value={formData.freeText}
            onChange={handleInputChange}
            maxLength={300}
          />
        </div>
      </form>

      <div className="mt-5">
        <h2>生成されたQRコード</h2>
        {qrData && (
          <canvas ref={qrCanvasRef}></canvas>
        )}

        {/* --- テスト用: 本番環境デプロイ前に必ず削除すること --- */}
        {qrData && (
          <div className="mt-3">
            <h3>QRコードデータ (テスト用)</h3>
            <textarea
              className="form-control"
              rows={5}
              readOnly
              value={qrData}
              style={{ fontSize: '0.8em' }}
            ></textarea>
            <small className="text-danger">※この表示はテスト用です。本番環境デプロイ前に必ず削除してください。</small>
          </div>
        )}
        {/* --- テスト用ここまで --- */}
      </div>
    </div>
  );
};

export default App;

