import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get Document Validity Records with Live Remaining Days & Expiry Status
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status, filter } = req.query;

    let query = `
      SELECT
        v.*,
        i.name as institution_name, i.aicte_id,
        a.application_number
      FROM document_validity_records v
      JOIN institutions i ON v.institution_id = i.id
      LEFT JOIN applications a ON v.application_id = a.id
      WHERE 1=1
    `;
    const params: Record<string, any> = {};

    if (user.role === 'institution') {
      query += ` AND v.institution_id = @instId`;
      params.instId = user.institution_id || 'inst-01';
    }

    if (status) {
      query += ` AND v.status = @status`;
      params.status = status;
    }

    const records = await db.queryAll<any>(query, params);

    // Calculate live days until expiry and update statuses dynamically
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enriched = records.map(r => {
      const expDate = new Date(r.expiry_date);
      expDate.setHours(0, 0, 0, 0);
      const diffMs = expDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let calculatedStatus = 'Valid';
      if (daysUntilExpiry < 0) {
        calculatedStatus = 'Expired';
      } else if (daysUntilExpiry <= 30) {
        calculatedStatus = 'Expiring Soon';
      }

      return {
        ...r,
        days_until_expiry: daysUntilExpiry,
        status: calculatedStatus,
        is_urgent: daysUntilExpiry <= 7
      };
    });

    // Apply specific filter if requested (e.g. 'expired', '30d', '7d')
    let filtered = enriched;
    if (filter === 'expired') {
      filtered = enriched.filter(r => r.days_until_expiry < 0);
    } else if (filter === '7d') {
      filtered = enriched.filter(r => r.days_until_expiry >= 0 && r.days_until_expiry <= 7);
    } else if (filter === '30d') {
      filtered = enriched.filter(r => r.days_until_expiry >= 0 && r.days_until_expiry <= 30);
    } else if (filter === '60d') {
      filtered = enriched.filter(r => r.days_until_expiry >= 0 && r.days_until_expiry <= 60);
    }

    res.json({
      records: filtered,
      total: filtered.length,
      counts: {
        total: enriched.length,
        expired: enriched.filter(r => r.days_until_expiry < 0).length,
        expiringSoon: enriched.filter(r => r.days_until_expiry >= 0 && r.days_until_expiry <= 30).length,
        valid: enriched.filter(r => r.days_until_expiry > 30).length
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Trigger Document Renewal Reminder
router.post('/:id/remind', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const doc = await db.queryOne<any>(`
      SELECT v.*, i.name as institution_name
      FROM document_validity_records v
      JOIN institutions i ON v.institution_id = i.id
      WHERE v.id = @id
    `, { id });

    if (!doc) {
      res.status(404).json({ error: 'Validity record not found' });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const dedupKey = `remind_${doc.id}_${new Date().toISOString().slice(0, 10)}`;

    const notified = await createNotification({
      recipientRole: 'institution',
      applicationId: doc.application_id,
      title: `Renewal Reminder: ${doc.document_title}`,
      message: `Document "${doc.document_title}" (${doc.document_number}) expires on ${doc.expiry_date}. Please initiate renewal immediately.`,
      type: 'document_expiring',
      severity: doc.days_until_expiry < 0 ? 'danger' : 'warning',
      actionUrl: '/validity',
      dedupKey
    });

    await db.run('UPDATE document_validity_records SET last_reminder_sent_at = @now WHERE id = @id', { now, id });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'RENEWAL_REMINDER_SENT',
      entityType: 'validity',
      entityId: id,
      reason: `Manual/Automated renewal reminder dispatched for ${doc.document_title}`,
      metadata: { expiry_date: doc.expiry_date, days_until_expiry: doc.days_until_expiry }
    });

    res.json({
      success: true,
      message: notified ? 'Renewal reminder sent successfully' : 'Reminder already sent today (deduplicated)'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
