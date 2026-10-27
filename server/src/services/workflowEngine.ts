import { db } from '../db/database.js';
import { logAuditEvent } from './auditService.js';
import { createNotification } from './notificationService.js';
import crypto from 'node:crypto';

export interface TransitionRequest {
  applicationId: string;
  action: string; // SUBMIT, SCRUTINY_PASS, DEFICIENCY_RETURN, RESUBMIT, EVC_RECOMMEND, COMMITTEE_DECIDE, APPROVE, REJECT
  actorId: string;
  actorName: string;
  actorRole: string;
  comments?: string;
  reason?: string;
}

export interface TransitionResult {
  success: boolean;
  message: string;
  previousStage?: string;
  newStage?: string;
  newStatus?: string;
}

export class WorkflowEngine {
  // Map actions and routes to next stages and statuses
  static async transition(req: TransitionRequest): Promise<TransitionResult> {
    const app = await db.queryOne<{
      id: string;
      application_number: string;
      institution_id: string;
      workflow_code: string;
      current_stage: string;
      status: string;
      assigned_officer_id: string;
    }>('SELECT * FROM applications WHERE id = @id', { id: req.applicationId });

    if (!app) {
      return { success: false, message: 'Application not found' };
    }

    const { workflow_code, current_stage, status } = app;
    let nextStage = current_stage;
    let nextStatus = status;

    // Check Role Authority
    if (req.action === 'APPROVE' || req.action === 'REJECT') {
      if (!['regulation_bureau', 'admin'].includes(req.actorRole)) {
        return {
          success: false,
          message: 'Regulatory Rule Enforcement: Final formal decisions can ONLY be taken by the Competent Authority (Regulation Bureau / Admin).'
        };
      }
    }

    if (req.action === 'SCRUTINY_PASS' || req.action === 'DEFICIENCY_RETURN') {
      if (!['regional_officer', 'admin'].includes(req.actorRole)) {
        return {
          success: false,
          message: 'Only Regional Officers are authorized to record Scrutiny decisions.'
        };
      }
    }

    if (req.action === 'EVC_RECOMMEND') {
      if (!['evc_member', 'regional_officer', 'admin'].includes(req.actorRole)) {
        return {
          success: false,
          message: 'Only authorized EVC members or designated officers can record EVC recommendations.'
        };
      }
    }

    if (req.action === 'COMMITTEE_DECIDE') {
      if (!['committee_member', 'admin'].includes(req.actorRole)) {
        return {
          success: false,
          message: 'Only Committee Members can record Standing Committee recommendations.'
        };
      }
    }

    // Determine Stage Progression according to Route
    switch (req.action) {
      case 'SUBMIT':
        if (current_stage !== 'DRAFT') {
          return { success: false, message: 'Only draft applications can be submitted.' };
        }
        nextStage = 'PENDING_SCRUTINY';
        nextStatus = 'Pending Scrutiny';
        break;

      case 'DEFICIENCY_RETURN':
        if (!['PENDING_SCRUTINY', 'PENDING_RE_SCRUTINY', 'COMPLETENESS_CHECK'].includes(current_stage)) {
          return { success: false, message: 'Application cannot be returned for correction from current stage.' };
        }
        nextStage = 'RETURNED_FOR_CORRECTION';
        nextStatus = 'Returned for Correction';
        break;

      case 'RESUBMIT':
        if (current_stage !== 'RETURNED_FOR_CORRECTION') {
          return { success: false, message: 'Only applications returned for correction can be resubmitted.' };
        }
        nextStage = 'PENDING_RE_SCRUTINY';
        nextStatus = 'Pending Re-Scrutiny';
        break;

      case 'SCRUTINY_PASS':
        if (!['PENDING_SCRUTINY', 'PENDING_RE_SCRUTINY', 'COMPLETENESS_CHECK'].includes(current_stage)) {
          return { success: false, message: 'Invalid stage for scrutiny approval.' };
        }

        // Route A: Scrutiny -> Authority Decision (Skip EVC & Committee)
        if (workflow_code === 'ROUTE_A') {
          nextStage = 'AUTHORITY_DECISION';
          nextStatus = 'Pending Competent Authority Decision';
        }
        // Route B: Scrutiny -> EVC
        else if (workflow_code === 'ROUTE_B') {
          nextStage = 'PENDING_EVC';
          nextStatus = 'Pending EVC';
        }
        // Route C: Scrutiny -> EVC -> Committee
        else if (workflow_code === 'ROUTE_C') {
          nextStage = 'PENDING_EVC';
          nextStatus = 'Pending EVC';
        }
        // Route D: Direct EVC
        else {
          nextStage = 'AUTHORITY_DECISION';
          nextStatus = 'Pending Competent Authority Decision';
        }
        break;

      case 'EVC_RECOMMEND':
        if (current_stage !== 'PENDING_EVC') {
          return { success: false, message: 'Application is not in Pending EVC stage.' };
        }

        // Route C requires Committee Review after EVC
        if (workflow_code === 'ROUTE_C') {
          nextStage = 'COMMITTEE_REVIEW';
          nextStatus = 'Pending Committee Review';
        } else {
          // Route B and Route D proceed straight to Competent Authority Decision
          nextStage = 'AUTHORITY_DECISION';
          nextStatus = 'Pending Competent Authority Decision';
        }
        break;

      case 'COMMITTEE_DECIDE':
        if (current_stage !== 'COMMITTEE_REVIEW') {
          return { success: false, message: 'Application is not in Committee Review stage.' };
        }
        nextStage = 'AUTHORITY_DECISION';
        nextStatus = 'Pending Competent Authority Decision';
        break;

      case 'APPROVE':
        if (current_stage !== 'AUTHORITY_DECISION' && req.actorRole !== 'admin') {
          return { success: false, message: 'Final approval requires application to reach Authority Decision stage.' };
        }
        nextStage = 'APPROVED';
        nextStatus = 'Approved';
        break;

      case 'REJECT':
        nextStage = 'REJECTED';
        nextStatus = 'Rejected';
        break;

      default:
        return { success: false, message: `Unrecognized workflow action: ${req.action}` };
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update application record
    await db.run(
      `UPDATE applications SET
        current_stage = @nextStage,
        status = @nextStatus,
        updated_at = @now,
        decision_date = CASE WHEN @nextStatus IN ('Approved', 'Rejected') THEN @now ELSE decision_date END,
        decision_remarks = CASE WHEN @nextStatus IN ('Approved', 'Rejected') THEN @comments ELSE decision_remarks END,
        decision_by = CASE WHEN @nextStatus IN ('Approved', 'Rejected') THEN @actorId ELSE decision_by END
      WHERE id = @id`,
      {
        nextStage,
        nextStatus,
        now,
        comments: req.comments || null,
        actorId: req.actorId,
        id: app.id
      }
    );

    // Record immutable stage history
    await db.run(
      `INSERT INTO application_stage_history (
        id, application_id, from_stage, to_stage, action,
        actor_id, actor_name, actor_role, comments, created_at
      ) VALUES (
        @id, @appId, @fromStage, @toStage, @action,
        @actorId, @actorName, @actorRole, @comments, @now
      )`,
      {
        id: crypto.randomUUID(),
        appId: app.id,
        fromStage: current_stage,
        toStage: nextStage,
        action: req.action,
        actorId: req.actorId,
        actorName: req.actorName,
        actorRole: req.actorRole,
        comments: req.comments || req.reason || null,
        now
      }
    );

    // Record Audit Log
    await logAuditEvent({
      actorId: req.actorId,
      actorName: req.actorName,
      actorRole: req.actorRole,
      action: `WORKFLOW_${req.action}`,
      entityType: 'application',
      entityId: app.id,
      previousState: current_stage,
      newState: nextStage,
      reason: req.reason || req.comments || `Transitioned via ${req.action}`,
      metadata: {
        application_number: app.application_number,
        workflow_code,
        status: nextStatus
      }
    });

    // Generate Contextual Notifications
    if (nextStage === 'RETURNED_FOR_CORRECTION') {
      await createNotification({
        recipientRole: 'institution',
        applicationId: app.id,
        title: 'Application Returned for Correction',
        message: `${app.application_number} has been returned by Scrutiny. Deficiencies recorded: ${req.reason || req.comments || 'See review notes'}.`,
        type: 'deficiency_raised',
        severity: 'warning',
        actionUrl: `/applications/${app.id}`
      });
    } else if (nextStage === 'PENDING_RE_SCRUTINY') {
      await createNotification({
        recipientRole: 'regional_officer',
        applicationId: app.id,
        title: 'Application Resubmitted for Re-Scrutiny',
        message: `Institution resubmitted ${app.application_number} with corrected documents. Ready for re-scrutiny.`,
        type: 'resubmitted',
        severity: 'info',
        actionUrl: `/rescrutiny?app=${app.id}`
      });
    } else if (nextStage === 'APPROVED') {
      await createNotification({
        recipientRole: 'institution',
        applicationId: app.id,
        title: 'Application Approved! 🎉',
        message: `Congratulations! ${app.application_number} has received official Approval from the Competent Authority.`,
        type: 'application_approved',
        severity: 'success',
        actionUrl: `/applications/${app.id}`
      });
    } else if (nextStage === 'REJECTED') {
      await createNotification({
        recipientRole: 'institution',
        applicationId: app.id,
        title: 'Application Regulatory Decision: Not Approved',
        message: `${app.application_number} could not be approved. Reason: ${req.comments || req.reason || 'Refer to formal decision order'}.`,
        type: 'application_rejected',
        severity: 'danger',
        actionUrl: `/applications/${app.id}`
      });
    }

    return {
      success: true,
      message: `Successfully transitioned to ${nextStatus}`,
      previousStage: current_stage,
      newStage: nextStage,
      newStatus: nextStatus
    };
  }
}
