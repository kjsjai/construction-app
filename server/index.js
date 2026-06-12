import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Import Routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import phasesRoutes from './routes/phases.js';
import expensesRoutes from './routes/expenses.js';
import fundsRoutes from './routes/funds.js';
import repaymentsRoutes from './routes/repayments.js';
import reportsRoutes from './routes/reports.js';
import importRoutes from './routes/import.js';
import importsRouter from './routes/imports.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middlewares ─────────────────────────────────────────────────────

// Helmet — tightened for production
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: isProduction,
}));

// CORS — strict allowlist from environment
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true, // Required for cookies
}));

// Rate limiting — tightened in production
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// ─── Core Middlewares ─────────────────────────────────────────────────────────

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging ──────────────────────────────────────────────────────────

// morgan 'combined' for production (Apache-style), 'dev' for development
app.use(morgan(isProduction ? 'combined' : 'dev'));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/phases', phasesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/repayments', repaymentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/imports', importsRouter);

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database Auto-Backup on Startup ─────────────────────────────────────────
const dbSource = path.join(__dirname, 'db', 'construction.db');
const backupsDir = path.join(__dirname, 'db', 'backups');
if (fs.existsSync(dbSource)) {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbDest = path.join(backupsDir, `construction-backup-${timestamp}.db`);
  fs.copyFileSync(dbSource, dbDest);
  console.log(`[DB] Auto-backed up to construction-backup-${timestamp}.db`);

  // Keep last 14 backups
  const backups = fs.readdirSync(backupsDir)
    .filter(f => f.startsWith('construction-backup-'))
    .sort()
    .reverse();
  if (backups.length > 14) {
    backups.slice(14).forEach(file => fs.unlinkSync(path.join(backupsDir, file)));
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
