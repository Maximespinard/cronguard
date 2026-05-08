import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

dotenv.config();

const app = express();
const port = process.env['PORT'] ?? 3001;

app.use(helmet());
app.use(cors({ origin: process.env['WEB_URL'] ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

app.listen(port, () => {
  console.log(`[cronguard-api] Server running on port ${String(port)}`);
});

export default app;
