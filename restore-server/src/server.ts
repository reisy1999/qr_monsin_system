import express from 'express';
import path from 'path';
import fs from 'fs';
import { createPrivateKey, privateDecrypt, constants } from 'crypto';
import zlib from 'zlib';
import iconv from 'iconv-lite';
import dotenv from 'dotenv';
import pino from 'pino';

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
    const keyPath = path.join(__dirname, '../keys/current.pem');
    const key = fs.readFileSync(keyPath, 'utf8');
    const privateKey = createPrivateKey(key);
    const decrypted = privateDecrypt(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
      },
      encrypted
    );
    const inflated = zlib.inflateSync(decrypted);
    const csv = iconv.decode(inflated, 'Shift_JIS');
    logger.info('decryption succeeded');
    res.json({ csv });
  } catch (err) {
    logger.error(err);
    res.status(400).json({ error: '復元に失敗しました。再度お試しください。' });
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
