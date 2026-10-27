import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { WorkflowEngine } from '../services/workflowEngine.js';
import { logAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get Scrutiny Queue
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let query = `
      SELECT
        a.id, a.application_number, a.workflow_code, a.category,
        a.academic_year, a.current_stage, a.status, a.submission_date,
        a.target_completion_date, a.is_overdue, a.days_pending,
        i.name as institution_name, i.aicte_id, i.city, i.state,
        r.name as region_name, r.code as region_code,
        (SELECT COUNT(*) FROM review_observations WHERE application_id = a.id AND is_deficiency = 1 AND is_resolved = 0) as active_deficiencies_count,
        (SELECT COUNT(*) FROM application_documents WHERE application_id = a.id) as documents_count
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN regions r ON i.region_id = r.id
      WHERE a.current_stage IN ('PENDING_SCRUTINY', 'PENDING_RE_SCRUTINY', 'COMPLETENESS_CHECK')
    `;
    const params: Record<string, any> = {};

    if (user.role === 'regional_officer' && user.region_id) {
      query += ` AND i.region_id = @regId`;
      params.regId = user.region_id;
    }

    query += ` ORDER BY a.is_overdue DESC, a.submission_date ASC`;

    const queue = await db.queryAll<any>(query, params);
    res.json({ queue, total: queue.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Record Scrutiny Observation
router.post('/observation', requireRole(['regional_officer', 'admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      application_id, stage, observation_type, document_id,
      clause_reference, comments, is_deficiency
    } = req.body;

    if (!application_id || !comments) {
      res.status(400).json({ error: 'Application ID and comments are required' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const defFlag = is_deficiency ? 1 : (observation_type === 'Deficiency' ? 1 : 0);

    await db.run(`
      INSERT INTO review_observations (
        id, application_id, stage, reviewer_id, observation_type,
        document_id, clause_reference, comments, is_deficiency,
        is_resolved, created_at
      ) VALUES (
        @id, @appId, @stage, @reviewerId, @obsType,
        @docId, @clause, @comments, @defFlag,
        0, @now
      )
    `, {
      id,
      appId: application_id,
      stage: stage || 'Scrutiny Evaluation',
      reviewerId: user.id,
      obsType: observation_type || (defFlag ? 'Deficiency' : 'Compliant'),
      docId: document_id || null,
      clause: clause_reference || 'AICTE APH 2026-27 Norms',
      comments,
      defFlag,
      now
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: defFlag ? 'DEFICIENCY_RAISED' : 'OBSERVATION_RECORDED',
      entityType: 'scrutiny',
      entityId: id,
      reason: comments,
      metadata: { application_id, clause_reference, observation_type }
    });

    res.status(201).json({ success: true, observationId: id, message: 'Observation recorded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Return Application for Correction
router.post('/return', requireRole(['regional_officer', 'admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { application_id, reason, deficiencies } = req.body;

    if (!application_id || !reason) {
      res.status(400).json({ error: 'Application ID and return reason are mandatory' });
      return;
    }

    const result = await WorkflowEngine.transition({
      applicationId: application_id,
      action: 'DEFICIENCY_RETURN',
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      reason,
      comments: reason
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ success: true, message: 'Application returned for institutional correction', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Resubmit Application (Institution)
router.post('/resubmit', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { application_id, remarks, resolved_observations } = req.body;

    if (!application_id) {
      res.status(400).json({ error: 'Application ID is required' });
      return;
    }

    // Mark previous observations resolved if provided
    if (Array.isArray(resolved_observations)) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      for (const obs of resolved_observations) {
        if (obs.id) {
          await db.run(`
            UPDATE review_observations SET
              is_resolved = 1,
              institution_response = @resp,
              resolved_at = @now
            WHERE id = @id
          `, { resp: obs.response || 'Addressed with updated documentation', now, id: obs.id });
        }
      }
    }

    const result = await WorkflowEngine.transition({
      applicationId: application_id,
      action: 'RESUBMIT',
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      comments: remarks || 'Institution uploaded corrected documentation answering all listed deficiencies.'
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ success: true, message: 'Application successfully resubmitted for re-scrutiny', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Scrutiny Pass (Forward to Next Route Stage)
router.post('/pass', requireRole(['regional_officer', 'admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { application_id, comments } = req.body;

    if (!application_id) {
      res.status(400).json({ error: 'Application ID is required' });
      return;
    }

    const result = await WorkflowEngine.transition({
      applicationId: application_id,
      action: 'SCRUTINY_PASS',
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      comments: comments || 'Scrutiny passed. All mandatory documents and undertakings validated.'
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ success: true, message: 'Scrutiny passed! Application forwarded to next stage.', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
