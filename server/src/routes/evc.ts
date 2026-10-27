import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { WorkflowEngine } from '../services/workflowEngine.js';
import { logAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get EVC Events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status } = req.query;

    let query = `
      SELECT
        e.*,
        a.application_number, a.workflow_code, a.category,
        i.name as institution_name, i.aicte_id, i.city, i.state,
        p.full_name as lead_expert_name
      FROM evc_events e
      JOIN applications a ON e.application_id = a.id
      JOIN institutions i ON e.institution_id = i.id
      LEFT JOIN profiles p ON e.lead_expert_id = p.id
      WHERE 1=1
    `;
    const params: Record<string, any> = {};

    if (user.role === 'institution') {
      query += ` AND e.institution_id = @instId`;
      params.instId = user.institution_id || 'inst-01';
    } else if (user.role === 'evc_member') {
      // EVC members can see assigned visits or all visits
    }

    if (status) {
      query += ` AND e.status = @status`;
      params.status = status;
    }

    query += ` ORDER BY e.scheduled_date ASC`;

    const events = await db.queryAll<any>(query, params);
    res.json({ events, total: events.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Schedule EVC Event
router.post('/schedule', requireRole(['regional_officer', 'evc_member', 'admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      application_id, institution_id, event_type,
      scheduled_date, scheduled_time, venue,
      lead_expert_id, expert_members, agenda
    } = req.body;

    if (!application_id || !scheduled_date) {
      res.status(400).json({ error: 'application_id and scheduled_date are required' });
      return;
    }

    const app = await db.queryOne<{ institution_id: string; application_number: string }>(
      'SELECT institution_id, application_number FROM applications WHERE id = @id',
      { id: application_id }
    );

    const instId = institution_id || app?.institution_id || 'inst-01';
    const id = crypto.randomUUID();
    const eventCode = `EVC-2026-WRO-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      INSERT INTO evc_events (
        id, application_id, institution_id, event_code, event_type,
        status, scheduled_date, scheduled_time, venue,
        lead_expert_id, expert_members_json, agenda, created_at, updated_at
      ) VALUES (
        @id, @appId, @instId, @code, @evType,
        'Scheduled', @schedDate, @schedTime, @venue,
        @leadId, @membersJson, @agenda, @now, @now
      )
    `, {
      id,
      appId: application_id,
      instId,
      code: eventCode,
      evType: event_type || 'Physical EVC',
      schedDate: scheduled_date,
      schedTime: scheduled_time || '10:00 AM IST',
      venue: venue || 'Campus Premises',
      leadId: lead_expert_id || user.id,
      membersJson: expert_members ? JSON.stringify(expert_members) : '[]',
      agenda: agenda || 'On-site physical inspection of laboratories, equipment, and faculty attendance records.',
      now
    });

    // Notify institution
    await createNotification({
      recipientRole: 'institution',
      applicationId: application_id,
      title: 'EVC Visit Scheduled',
      message: `Expert Visit Committee inspection for ${app?.application_number || 'your application'} scheduled on ${scheduled_date}.`,
      type: 'evc_scheduled',
      severity: 'info',
      actionUrl: '/evc'
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'EVC_EVENT_SCHEDULED',
      entityType: 'evc',
      entityId: id,
      newState: 'Scheduled',
      reason: `EVC inspection scheduled for ${scheduled_date}`,
      metadata: { application_id, eventCode, venue }
    });

    res.status(201).json({ success: true, eventId: id, eventCode, message: 'EVC visit scheduled successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Record EVC Report Findings & Outcome
router.post('/:id/report', requireRole(['evc_member', 'regional_officer', 'admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { report_summary, outcome } = req.body;

    if (!report_summary || !outcome) {
      res.status(400).json({ error: 'report_summary and outcome are required' });
      return;
    }

    const event = await db.queryOne<{ application_id: string }>(
      'SELECT application_id FROM evc_events WHERE id = @id',
      { id }
    );

    if (!event) {
      res.status(404).json({ error: 'EVC event not found' });
      return;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      UPDATE evc_events SET
        status = 'Completed',
        report_summary = @summary,
        outcome = @outcome,
        completed_at = @now,
        updated_at = @now
      WHERE id = @id
    `, { summary: report_summary, outcome, now, id });

    // Transition application to next stage via WorkflowEngine
    await WorkflowEngine.transition({
      applicationId: event.application_id,
      action: 'EVC_RECOMMEND',
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      comments: `EVC Outcome: ${outcome}. Summary: ${report_summary}`
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'EVC_REPORT_COMPLETED',
      entityType: 'evc',
      entityId: id,
      newState: 'Completed',
      reason: `EVC report submitted: ${outcome}`,
      metadata: { outcome }
    });

    res.json({ success: true, message: 'EVC report recorded and workflow advanced' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
