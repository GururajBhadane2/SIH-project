import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get Compliance Items
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { application_id, status } = req.query;

    let query = `
      SELECT
        ci.*,
        cr.code as requirement_code, cr.category, cr.description, cr.rule_reference,
        a.application_number, i.name as institution_name,
        p.full_name as verified_by_name
      FROM compliance_items ci
      JOIN compliance_requirements cr ON ci.requirement_id = cr.id
      JOIN applications a ON ci.application_id = a.id
      JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN profiles p ON ci.verified_by = p.id
      WHERE 1=1
    `;
    const params: Record<string, any> = {};

    if (user.role === 'institution') {
      query += ` AND a.institution_id = @instId`;
      params.instId = user.institution_id || 'inst-01';
    }

    if (application_id) {
      query += ` AND ci.application_id = @appId`;
      params.appId = application_id;
    }
    if (status) {
      query += ` AND ci.status = @status`;
      params.status = status;
    }

    query += ` ORDER BY ci.due_date ASC`;

    const items = await db.queryAll<any>(query, params);
    const requirements = await db.queryAll<any>('SELECT * FROM compliance_requirements WHERE is_active = 1');

    res.json({ items, requirements, total: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Submit Compliance Evidence / Undertaking
router.post('/evidence', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { compliance_item_id, document_id, undertaking_text, signatory_name, signatory_designation } = req.body;

    if (!compliance_item_id) {
      res.status(400).json({ error: 'compliance_item_id is required' });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      INSERT INTO compliance_evidence (
        id, compliance_item_id, document_id, undertaking_text,
        signatory_name, signatory_designation, submitted_at
      ) VALUES (
        @id, @ciId, @docId, @undertaking,
        @sigName, @sigDesig, @now
      )
    `, {
      id,
      ciId: compliance_item_id,
      docId: document_id || null,
      undertaking: undertaking_text || 'Institutional compliance undertaking submitted under solemn affirmation.',
      sigName: signatory_name || user.full_name,
      sigDesig: signatory_designation || 'Head of Institution',
      now
    });

    // Update Item status to Submitted
    await db.run(`
      UPDATE compliance_items SET
        status = 'Submitted',
        updated_at = @now
      WHERE id = @id
    `, { now, id: compliance_item_id });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'COMPLIANCE_EVIDENCE_SUBMITTED',
      entityType: 'compliance',
      entityId: compliance_item_id,
      newState: 'Submitted',
      reason: 'Undertaking evidence uploaded by institution'
    });

    res.status(201).json({ success: true, message: 'Compliance evidence submitted for verification' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Officer Verifies Compliance Item
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { compliance_item_id, status, verification_comments } = req.body;

    if (!compliance_item_id) {
      res.status(400).json({ error: 'compliance_item_id is required' });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const itemStatus = status || 'Verified';

    await db.run(`
      UPDATE compliance_items SET
        status = @itemStatus,
        verified_by = @userId,
        verified_at = @now,
        verification_comments = @comments,
        completed_at = CASE WHEN @itemStatus = 'Verified' THEN @now ELSE NULL END,
        updated_at = @now
      WHERE id = @id
    `, {
      itemStatus,
      userId: user.id,
      now,
      comments: verification_comments || 'Verified compliant with regulatory mandate.',
      id: compliance_item_id
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'COMPLIANCE_ITEM_VERIFIED',
      entityType: 'compliance',
      entityId: compliance_item_id,
      newState: itemStatus,
      reason: verification_comments || 'Compliance verified by authorized officer'
    });

    res.json({ success: true, message: `Compliance item marked as ${itemStatus}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
