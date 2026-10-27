import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { runSeed } from '../db/seed.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get All Users with Roles & Boundaries
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await db.queryAll<any>(`
      SELECT
        p.id, p.email, p.full_name, p.role, p.designation, p.phone, p.is_active, p.created_at,
        i.name as institution_name, i.aicte_id,
        r.name as region_name, r.code as region_code
      FROM profiles p
      LEFT JOIN institutions i ON p.institution_id = i.id
      LEFT JOIN regions r ON p.region_id = r.id
      ORDER BY p.created_at ASC
    `);
    res.json({ users, total: users.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Workflows Configuration (Routes A, B, C, D)
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    const definitions = await db.queryAll<any>('SELECT * FROM workflow_definitions ORDER BY code ASC');
    const stages = await db.queryAll<any>(`
      SELECT s.*, v.workflow_definition_id, d.code as workflow_code
      FROM workflow_stages s
      JOIN workflow_versions v ON s.workflow_version_id = v.id
      JOIN workflow_definitions d ON v.workflow_definition_id = d.id
      ORDER BY s.sequence_order ASC
    `);

    res.json({ definitions, stages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Reset Demo Data to Pristine Baseline
router.post('/reset-demo', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    console.log('[Admin] Reset demo data requested by:', user.email);

    await runSeed(true);

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'DEMO_DATA_RESET',
      entityType: 'system',
      entityId: 'seed-baseline',
      reason: 'Administrator triggered full synthetic demo database reset'
    });

    res.json({ success: true, message: 'Database reset to baseline synthetic demonstration data successfully!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
