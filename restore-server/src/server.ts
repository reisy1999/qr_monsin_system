import express from 'express';
import path from 'path';
import fs from 'fs';
import { createPrivateKey } from 'crypto';
import zlib from 'zlib';
import iconv from 'iconv-lite';
import dotenv from 'dotenv';
import pino from 'pino';
import { decryptWithKeys } from './decrypt';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();
app.use(express.json({ limit: '1mb' }));

// Logger setup
const logDir = path.join(__dirname, '../logs');
fs.mkdirSync(logDir, { recursive: true });
const logger = pino(
  { level: 'info' },
  pino.multistream([
    { stream: process.stdout },
    { stream: pino.destination(path.join(logDir, 'decrypt.log')) }
  ])
);

const keyPaths = (process.env.PRIVATE_KEY_PATHS || 'keys/current.pem')
  .split(',')
  .map(p => p.trim())
  .filter(p => p.length > 0);

const privateKeys = keyPaths.map(p => {
  const resolved = path.isAbsolute(p) ? p : path.join(__dirname, '..', p);
  const key = fs.readFileSync(resolved, 'utf8');
  return createPrivateKey(key);
});

app.use((req, _res, next) => {
  logger.info({
    ip: req.ip,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    userAgent: req.get('user-agent')
  });
  next();
});

app.post('/api/decrypt', (req, res) => {
  const data = req.body?.data;
  if (typeof data !== 'string') {
    return res.status(400).json({ error: '無効なリクエストです' });
  }

  try {
    const encrypted = Buffer.from(data, 'base64');
    const decrypted = decryptWithKeys(encrypted, privateKeys);
    const inflated = zlib.inflateSync(decrypted);
    const csv = iconv.decode(inflated, 'Shift_JIS');
    logger.info('decryption succeeded');
    res.json({ csv });
  } catch (err) {
    logger.error(err);
    let message =
      'このQRコードは読み取れません。QRコードが欠けていないか、有効なものか確認してください。';
    if ((err as any)?.code === 'ERR_OSSL_EVP_BAD_DECRYPT') {
      message =
        '復号に失敗しました。有効期間外のQRコードである可能性があります。患者様にご確認ください。';
    }
    res.status(400).json({ error: message });
  }
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  logger.info(`restore-server listening on port ${PORT}`);
});
