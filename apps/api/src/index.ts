import type { Server } from 'node:http';

import { clerkMiddleware } from '@clerk/express';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import { checkDbHealth, closePool } from './db/index.js';
import { alertChannelRouter, monitorChannelRouter } from './routes/alert-channels.js';
import { monitorRouter } from './routes/monitors.js';
import { pingRouter } from './routes/ping.js';
import { webhookRouter } from './routes/webhooks.js';
import { startMissDetector, stopMissDetector } from './scheduler/miss-detector.js';

dotenv.config();

const app = express();
const port = process.env['PORT'] ?? 3001;

// ─── Security ──────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env['WEB_URL'] ?? 'http://localhost:5173' }));

// ─── Webhook routes (raw body — MUST come before express.json()) ──

app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRouter);

// ─── Body parsing ──────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' }));

// ─── Public ping endpoint (before auth — minimum overhead) ───────

app.use('/api/ping', pingRouter);

// ─── Clerk auth (networkless JWT verification when CLERK_JWT_KEY is set) ──

app.use(clerkMiddleware({ jwtKey: process.env['CLERK_JWT_KEY'] }));

// ─── Health endpoint (public) ──────────────────────────────────────

app.get('/api/health', async (_req, res) => {
  try {
    const dbLatency = await checkDbHealth();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      db: { status: 'connected', latencyMs: dbLatency },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown DB error';
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      db: { status: 'disconnected', error: message },
    });
  }
});

// ─── API routes (authed) ──────────────────────────────────────────

app.use('/api/monitors', monitorRouter);
app.use('/api/alert-channels', alertChannelRouter);
app.use('/api/monitors/:monitorId/channels', monitorChannelRouter);

// ─── Start server ──────────────────────────────────────────────────

const server: Server = app.listen(port, () => {
  console.log(`[cronguard-api] Server running on port ${String(port)}`);
  startMissDetector();
});

// ─── Graceful shutdown ─────────────────────────────────────────────

function gracefulShutdown(signal: string) {
  console.log(`[cronguard-api] ${signal} received — shutting down`);
  stopMissDetector();

  server.close(() => {
    console.log('[cronguard-api] HTTP server closed');

    closePool()
      .then(() => {
        console.log('[cronguard-api] DB pool drained');
        process.exit(0);
      })
      .catch((error: unknown) => {
        console.error('[cronguard-api] Error draining DB pool:', error);
        process.exit(1);
      });
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('[cronguard-api] Forced exit after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

export default app;
