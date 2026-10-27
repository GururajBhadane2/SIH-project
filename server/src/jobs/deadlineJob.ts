import { db } from '../db/database.js';
import { createNotification } from '../services/notificationService.js';
import { logAuditEvent } from '../services/auditService.js';
import crypto from 'node:crypto';

export async function runDeadlineChecks() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // 1. Check Document Expiry
    const expiringDocs = await db.queryAll<any>(`
      SELECT v.*, i.name as institution_name
      FROM document_validity_records v
      JOIN institutions i ON v.institution_id = i.id
      WHERE v.status IN ('Valid', 'Expiring Soon')
    `);

    for (const doc of expiringDocs) {
      const expDate = new Date(doc.expiry_date);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 0 && doc.status !== 'Expired') {
        // Mark Expired
        await db.run('UPDATE document_validity_records SET status = "Expired", days_until_expiry = @diff WHERE id = @id', { diff: diffDays, id: doc.id });

        await createNotification({
          recipientRole: 'institution',
          applicationId: doc.application_id,
          title: `CRITICAL: Document Expired (${doc.document_title})`,
          message: `${doc.document_title} expired on ${doc.expiry_date}. Immediate renewal required to prevent application compliance hold.`,
          type: 'document_expiring',
          severity: 'danger',
          actionUrl: '/validity',
          dedupKey: `auto_expired_${doc.id}_${todayStr}`
        });
      } else if (diffDays <= 30 && diffDays > 0 && doc.status !== 'Expiring Soon') {
        await db.run('UPDATE document_validity_records SET status = "Expiring Soon", days_until_expiry = @diff WHERE id = @id', { diff: diffDays, id: doc.id });

        await createNotification({
          recipientRole: 'institution',
          applicationId: doc.application_id,
          title: `Action Required: Document Expiring Soon (${diffDays} days left)`,
          message: `${doc.document_title} will expire on ${doc.expiry_date}. Please submit renewal certificate.`,
          type: 'document_expiring',
          severity: 'warning',
          actionUrl: '/validity',
          dedupKey: `auto_expiring_soon_${doc.id}_${todayStr}`
        });
      }
    }

    // 2. Check Overdue Applications Pending Beyond SLA
    const pendingApps = await db.queryAll<any>(`
      SELECT a.*, i.name as institution_name
      FROM applications a
      JOIN institutions i ON a.institution_id = i.id
      WHERE a.status NOT IN ('Approved', 'Rejected', 'Withdrawn', 'Draft')
    `);

    for (const app of pendingApps) {
      if (app.submission_date) {
        const subDate = new Date(app.submission_date);
        const daysPending = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysPending > 7 ? 1 : 0; // Standard 7-day threshold

        await db.run(
          'UPDATE applications SET days_pending = @days, is_overdue = @isOverdue WHERE id = @id',
          { days: daysPending, isOverdue, id: app.id }
        );

        // Auto Escalation if overdue and not yet escalated today
        if (isOverdue && daysPending >= 8) {
          const rule = await db.queryOne<{ id: string }>('SELECT id FROM escalation_rules WHERE event_trigger = "scrutiny_overdue" LIMIT 1');
          if (rule) {
            const existingEsc = await db.queryOne<{ id: string }>(
              'SELECT id FROM escalation_history WHERE application_id = @appId AND rule_id = @ruleId AND status = "Active"',
              { appId: app.id, ruleId: rule.id }
            );

            if (!existingEsc) {
              const escId = crypto.randomUUID();
              await db.run(`
                INSERT INTO escalation_history (
                  id, rule_id, application_id, reason,
                  escalated_from_role, escalated_to_role, target_officer_id,
                  status, created_at
                ) VALUES (
                  @id, @ruleId, @appId, @reason,
                  'regional_officer', 'regulation_bureau', 'usr-rb',
                  'Active', datetime('now')
                )
              `, {
                id: escId,
                ruleId: rule.id,
                appId: app.id,
                reason: `Application ${app.application_number} pending for ${daysPending} days (> 7 day SLA threshold).`
              });

              await createNotification({
                recipientRole: 'regulation_bureau',
                applicationId: app.id,
                title: `Escalation: SLA Overdue (${app.application_number})`,
                message: `${app.application_number} has exceeded SLA duration. Escalated to Regulation Bureau supervision.`,
                type: 'escalated',
                severity: 'danger',
                actionUrl: '/escalations',
                dedupKey: `esc_${app.id}_overdue_${todayStr}`
              });
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Jobs] Error running deadline background check:', err.message);
  }
}

export function startDeadlineJob(intervalMs = 5 * 60 * 1000) {
  // Run on startup
  runDeadlineChecks();
  // Schedule recurring checks
  setInterval(runDeadlineChecks, intervalMs);
  console.log('[Jobs] Deadline & Escalation background monitoring job started.');
}
