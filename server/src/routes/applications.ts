import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { WorkflowEngine } from '../services/workflowEngine.js';
import { logAuditEvent } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();
router.use(authMiddleware);

// 1. Get Applications with Filter, Search, and Role Data Boundaries
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { status, category, stage, search, overdue } = req.query;

    let query = `
      SELECT
        a.id, a.application_number, a.institution_id, a.workflow_code,
        a.category, a.academic_year, a.current_stage, a.status,
        a.submission_date, a.target_completion_date, a.is_overdue,
        a.days_pending, a.created_at,
        i.name as institution_name, i.aicte_id, i.state, i.city,
        r.name as region_name, r.code as region_code,
        p.full_name as assigned_officer_name,
        wf.name as workflow_name
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN regions r ON i.region_id = r.id
      LEFT JOIN profiles p ON a.assigned_officer_id = p.id
      LEFT JOIN workflow_definitions wf ON a.workflow_code = wf.code
      WHERE 1=1
    `;
    const params: Record<string, any> = {};

    // Role-based boundary enforcement
    if (user.role === 'institution') {
      query += ` AND a.institution_id = @userInstId`;
      params.userInstId = user.institution_id || 'inst-01';
    } else if (user.role === 'regional_officer' && user.region_id) {
      query += ` AND i.region_id = @userRegId`;
      params.userRegId = user.region_id;
    } else if (user.role === 'evc_member') {
      // EVC members see applications with EVC requirements
      query += ` AND (a.current_stage = 'PENDING_EVC' OR a.workflow_code IN ('ROUTE_B', 'ROUTE_C', 'ROUTE_D'))`;
    } else if (user.role === 'committee_member') {
      // Committee members see applications with Committee requirements
      query += ` AND (a.current_stage = 'COMMITTEE_REVIEW' OR a.workflow_code = 'ROUTE_C')`;
    }

    if (status) {
      query += ` AND a.status = @status`;
      params.status = status;
    }
    if (category) {
      query += ` AND a.category = @category`;
      params.category = category;
    }
    if (stage) {
      query += ` AND a.current_stage = @stage`;
      params.stage = stage;
    }
    if (overdue === 'true') {
      query += ` AND a.is_overdue = 1`;
    }
    if (search) {
      query += ` AND (a.application_number LIKE @search OR i.name LIKE @search OR i.aicte_id LIKE @search)`;
      params.search = `%${search}%`;
    }

    query += ` ORDER BY a.is_overdue DESC, a.created_at DESC`;

    const applications = await db.queryAll<any>(query, params);
    res.json({ applications, total: applications.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Single Application with Full Details & Related Data
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const application = await db.queryOne<any>(`
      SELECT
        a.*,
        i.name as institution_name, i.aicte_id, i.type as institution_type,
        i.state, i.city, i.address, i.pincode, i.contact_email, i.contact_phone,
        i.principal_name, i.established_year,
        r.name as region_name, r.code as region_code,
        p.full_name as assigned_officer_name, p.role as assigned_officer_role,
        wf.name as workflow_name, wf.description as workflow_description
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      LEFT JOIN regions r ON i.region_id = r.id
      LEFT JOIN profiles p ON a.assigned_officer_id = p.id
      LEFT JOIN workflow_definitions wf ON a.workflow_code = wf.code
      WHERE a.id = @id OR a.application_number = @id
    `, { id });

    if (!application) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Fetch Documents & Extractions
    const documents = await db.queryAll<any>(`
      SELECT
        d.*,
        e.extracted_text, e.ocr_engine, e.confidence_score,
        e.extracted_fields_json, e.detected_keywords_json,
        e.missing_fields_json, e.findings_json, e.is_human_verified
      FROM application_documents d
      LEFT JOIN document_extractions e ON d.id = e.document_id
      WHERE d.application_id = @appId
      ORDER BY d.uploaded_at DESC
    `, { appId: application.id });

    // Fetch Review Observations
    const observations = await db.queryAll<any>(`
      SELECT
        o.*,
        p.full_name as reviewer_name, p.role as reviewer_role
      FROM review_observations o
      LEFT JOIN profiles p ON o.reviewer_id = p.id
      WHERE o.application_id = @appId
      ORDER BY o.created_at DESC
    `, { appId: application.id });

    // Fetch Stage History
    const stageHistory = await db.queryAll<any>(`
      SELECT * FROM application_stage_history
      WHERE application_id = @appId
      ORDER BY created_at ASC
    `, { appId: application.id });

    // Fetch Compliance Items
    const complianceItems = await db.queryAll<any>(`
      SELECT
        ci.*,
        cr.code as requirement_code, cr.category, cr.description, cr.rule_reference
      FROM compliance_items ci
      JOIN compliance_requirements cr ON ci.requirement_id = cr.id
      WHERE ci.application_id = @appId
      ORDER BY ci.created_at DESC
    `, { appId: application.id });

    // Fetch EVC Events
    const evcEvents = await db.queryAll<any>(`
      SELECT e.*, p.full_name as lead_expert_name
      FROM evc_events e
      LEFT JOIN profiles p ON e.lead_expert_id = p.id
      WHERE e.application_id = @appId
    `, { appId: application.id });

    // Fetch Committee Reviews
    const committeeReviews = await db.queryAll<any>(`
      SELECT * FROM committee_reviews
      WHERE application_id = @appId
    `, { appId: application.id });

    // Fetch Audit Trail for this application
    const auditLogs = await db.queryAll<any>(`
      SELECT * FROM audit_logs
      WHERE entity_id = @appId OR metadata_json LIKE @appNumLike
      ORDER BY timestamp DESC
    `, { appId: application.id, appNumLike: `%${application.application_number}%` });

    res.json({
      application,
      documents,
      observations,
      stageHistory,
      complianceItems,
      evcEvents,
      committeeReviews,
      auditLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Create New Application
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { institution_id, workflow_code, category, academic_year } = req.body;

    const instId = institution_id || user.institution_id || 'inst-01';
    const wfCode = workflow_code || 'ROUTE_A';
    const cat = category || 'Extension of Approval (EoA)';
    const ay = academic_year || '2026-2027';

    // Generate unique reference number: FLOWX-2026-XXXX
    const countRow = await db.queryOne<{ total: number }>('SELECT count(*) as total FROM applications');
    const seq = ((countRow?.total || 18) + 1).toString().padStart(4, '0');
    const applicationNumber = `FLOWX-2026-${seq}`;

    const id = crypto.randomUUID();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      INSERT INTO applications (
        id, application_number, institution_id, workflow_code,
        category, academic_year, current_stage, status,
        is_overdue, days_pending, created_by, created_at, updated_at
      ) VALUES (
        @id, @appNumber, @instId, @wfCode,
        @cat, @ay, 'DRAFT', 'Draft',
        0, 0, @userId, @now, @now
      )
    `, {
      id,
      appNumber: applicationNumber,
      instId,
      wfCode,
      cat,
      ay,
      userId: user.id,
      now
    });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'APPLICATION_CREATED',
      entityType: 'application',
      entityId: id,
      newState: 'DRAFT',
      reason: 'Draft application created',
      metadata: { application_number: applicationNumber, category: cat }
    });

    res.status(201).json({
      success: true,
      applicationId: id,
      applicationNumber,
      message: 'Application draft created successfully'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Submit Application
router.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const result = await WorkflowEngine.transition({
      applicationId: id,
      action: 'SUBMIT',
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      comments: 'Application formal submission finalized with verified undertakings.'
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    // Set submission date
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await db.run('UPDATE applications SET submission_date = @now WHERE id = @id', { now, id });

    // Notify Regional Officer
    await createNotification({
      recipientRole: 'regional_officer',
      applicationId: id,
      title: 'New Application Ingested into Scrutiny Queue',
      message: `Application submitted and assigned to Regional Scrutiny Queue. Action required.`,
      type: 'application_assigned',
      severity: 'info',
      actionUrl: `/scrutiny?app=${id}`
    });

    res.json({ success: true, message: 'Application submitted successfully', result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Workflow Stage Transition
router.post('/:id/transition', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { action, comments, reason } = req.body;

    if (!action) {
      res.status(400).json({ error: 'Action parameter is required' });
      return;
    }

    const result = await WorkflowEngine.transition({
      applicationId: id,
      action,
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      comments,
      reason
    });

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
