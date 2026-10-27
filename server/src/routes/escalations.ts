import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get Escalations & Active Rules
router.get('/', async (req: Request, res: Response) => {
  try {
    const escalations = await db.queryAll<any>(`
      SELECT
        eh.*,
        er.name as rule_name, er.event_trigger, er.threshold_days, er.auto_action,
        a.application_number, a.category, a.current_stage,
        i.name as institution_name,
        p.full_name as target_officer_name
      FROM escalation_history eh
      JOIN escalation_rules er ON eh.rule_id = er.id
      JOIN applications a ON eh.application_id = a.id
      JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN profiles p ON eh.target_officer_id = p.id
      ORDER BY CASE WHEN eh.status = 'Active' THEN 0 WHEN eh.status = 'Acknowledged' THEN 1 ELSE 2 END, eh.created_at DESC
    `);

    const rules = await db.queryAll<any>('SELECT * FROM escalation_rules WHERE is_active = 1 ORDER BY threshold_days ASC');

    res.json({ escalations, rules, total: escalations.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Acknowledge Escalation
router.post('/:id/acknowledge', requireRole(['regulation_bureau', 'admin', 'regional_officer']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      UPDATE escalation_history SET
        status = 'Acknowledged',
        acknowledged_at = @now
      WHERE id = @id
    `, { now, id });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'ESCALATION_ACKNOWLEDGED',
      entityType: 'escalation',
      entityId: id,
      newState: 'Acknowledged',
      reason: 'Supervisor acknowledged pending escalation'
    });

    res.json({ success: true, message: 'Escalation acknowledged' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Resolve Escalation
router.post('/:id/resolve', requireRole(['regulation_bureau', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { resolution_remarks } = req.body;

    if (!resolution_remarks) {
      res.status(400).json({ error: 'resolution_remarks is required' });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      UPDATE escalation_history SET
        status = 'Resolved',
        resolved_at = @now,
        resolution_remarks = @remarks
      WHERE id = @id
    `, { now, remarks: resolution_remarks, id });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'ESCALATION_RESOLVED',
      entityType: 'escalation',
      entityId: id,
      newState: 'Resolved',
      reason: resolution_remarks
    });

    res.json({ success: true, message: 'Escalation marked as resolved' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
