import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load environment variables
dotenv.config();

import { getDatabase } from './db/database.js';
import { runSeed } from './db/seed.js';
import { startDeadlineJob } from './jobs/deadlineJob.js';

// Import Route Handlers
import authRouter from './routes/auth.js';
import applicationsRouter from './routes/applications.js';
import scrutinyRouter from './routes/scrutiny.js';
import documentsRouter from './routes/documents.js';
import complianceRouter from './routes/compliance.js';
import validityRouter from './routes/validity.js';
import evcRouter from './routes/evc.js';
import committeeRouter from './routes/committee.js';
import notificationsRouter from './routes/notifications.js';
import escalationsRouter from './routes/escalations.js';
import reportsRouter from './routes/reports.js';
import auditRouter from './routes/audit.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role', 'x-demo-user-id']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// System Health & Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'AICTE FlowX API Service',
    tagline: 'Intelligent Approval Workflow & Compliance Command Centre',
    disclaimer: 'STUDENT PROTOTYPE — NOT AN OFFICIAL AICTE SYSTEM',
    timestamp: new Date().toISOString()
  });
});

// API Routes Registration
app.use('/api/auth', authRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/scrutiny', scrutinyRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/compliance', complianceRouter);
app.use('/api/validity', validityRouter);
app.use('/api/evc', evcRouter);
app.use('/api/committee', committeeRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/escalations', escalationsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    disclaimer: 'STUDENT PROTOTYPE — NOT AN OFFICIAL AICTE SYSTEM'
  });
});

// Start Server
async function bootstrap() {
  try {
    await getDatabase();
    // Auto-seed if database is fresh
    await runSeed(false);

    // Launch background deadline & escalation monitoring
    startDeadlineJob();

    app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`🏛️  AICTE FlowX Backend running on http://localhost:${PORT}`);
      console.log('📢  STUDENT PROTOTYPE — NOT AN OFFICIAL AICTE SYSTEM');
      console.log(`🗄️  Database: SQLite + Supabase Schema Ready (${process.env.SUPABASE_URL})`);
      console.log('================================================================');
    });
  } catch (err: any) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

bootstrap();
