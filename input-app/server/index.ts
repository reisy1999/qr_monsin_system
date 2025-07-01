import express from 'express';
import path from 'path';
import fs from "fs";
import { promises as fsp } from "fs";
import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = express();

const logDir = path.join(__dirname, "logs");
fs.mkdirSync(logDir, { recursive: true });

const logger = pino(
  {
    level: 'info'
  },
  pino.multistream([
    { stream: process.stdout },
    { stream: pino.destination(path.join(logDir, 'server.log')) }
  ])
);

app.use(express.json());

app.get('/publicKey', async (_req, res) => {
  try {
    const keyPath = path.join(__dirname, '..', 'keys', 'public.pem');
    const key = await fsp.readFile(keyPath, 'utf-8');
    res.type('text/plain').send(key);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/templates/:id.json', async (req, res) => {
  const filePath = path.join(__dirname, '..', 'templates', `${req.params.id}.json`);
  try {
    const content = await fsp.readFile(filePath, 'utf-8');
    res.type('application/json').send(content);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Template not found' });
    } else {
      logger.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.post('/api/logs/qr-generated', (req, res) => {
  const { formVersion, timestamp } = req.body || {};
  if (typeof formVersion !== 'string' || typeof timestamp !== 'string') {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  logger.info({ formVersion, timestamp });
  res.json({ status: 'logged' });
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});
