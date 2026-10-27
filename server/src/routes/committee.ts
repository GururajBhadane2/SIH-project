import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { WorkflowEngine } from '../services/workflowEngine.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get Committee Reviews
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;
    let query = `
      SELECT
        c.*,
        a.application_number, a.workflow_code, a.category,
        i.name as institution_name, i.aicte_id, i.city, i.state,
        p.full_name as recorded_by_name
      FROM committee_reviews c
      JOIN applications a ON c.application_id = a.id
      JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN profiles p ON c.recorded_by = p.id
      WHERE 1=1
    `;
    const params: Record<string, any> = {};

    if (status) {
      query += ` AND c.status = @status`;
      params.status = status;
    }
    if (type) {
      query += ` AND c.committee_type = @type`;
      params.type = type;
    }

    query += ` ORDER BY c.hearing_date DESC`;

    const reviews = await db.queryAll<any>(query, params);
    res.json({ reviews, total: reviews.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Schedule Committee Hearing
router.post('/schedule', requireRole(['committee_member', 'regulation_bureau', 'admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { application_id, committee_type, hearing_date, quorum_members, observations } = req.body;

    if (!application_id || !hearing_date) {
      res.status(400).json({ error: 'application_id and hearing_date are required' });
      return;
    }

    const id = crypto.randomUUID();
    await db.run(`
      INSERT INTO committee_reviews (
        id, application_id, committee_type, hearing_date,
        status, quorum_members_json, observations, created_at
      ) VALUES (
        @id, @appId, @commType, @hearingDate,
        'Scheduled', @quorumJson, @obs, datetime('now')
      )
    `, {
      id,
      appId: application_id,
      commType: committee_type || 'Standing Appellate Committee (SAC)',
      hearingDate: hearing_date,
      quorumJson: quorum_members ? JSON.stringify(quorum_members) : '[]',
      obs: observations || 'Scheduled for formal hearing and document appraisal.'
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'COMMITTEE_HEARING_SCHEDULED',
      entityType: 'committee',
      entityId: id,
      newState: 'Scheduled',
      reason: `Hearing scheduled on ${hearing_date}`
    });

    res.status(201).json({ success: true, reviewId: id, message: 'Committee hearing scheduled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Record Official Committee Outcome
router.post('/:id/record', requireRole(['committee_member', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { recommendation, observations } = req.body;

    if (!recommendation) {
      res.status(400).json({ error: 'recommendation is required' });
      return;
    }

    const review = await db.queryOne<{ application_id: string }>(
      'SELECT application_id FROM committee_reviews WHERE id = @id',
      { id }
    );

    if (!review) {
      res.status(404).json({ error: 'Committee review not found' });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      UPDATE committee_reviews SET
        status = 'Decision Recorded',
        recommendation = @recommendation,
        observations = @obs,
        recorded_by = @userId,
        recorded_at = @now
      WHERE id = @id
    `, { recommendation, obs: observations || '', userId: user.id, now, id });

    // Transition workflow
    await WorkflowEngine.transition({
      applicationId: review.application_id,
      action: 'COMMITTEE_DECIDE',
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      comments: `Committee Decision: ${recommendation}. Observations: ${observations || 'None'}`
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'COMMITTEE_DECISION_RECORDED',
      entityType: 'committee',
      entityId: id,
      newState: 'Decision Recorded',
      reason: `Outcome: ${recommendation}`,
      metadata: { recommendation }
    });

    res.json({ success: true, message: 'Committee outcome recorded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
