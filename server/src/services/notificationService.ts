import { db } from '../db/database.js';
import crypto from 'node:crypto';

export interface CreateNotificationParams {
  recipientId?: string | null;
  recipientRole?: string | null;
  applicationId?: string | null;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  actionUrl?: string | null;
  dedupKey?: string | null;
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  const id = crypto.randomUUID();
  const dedupKey = params.dedupKey || `${params.type}_${params.applicationId || 'none'}_${Date.now()}`;

  // Check if deduplicated notification already exists
  if (params.dedupKey) {
    const existing = await db.queryOne<{ id: string }>(
      'SELECT id FROM notifications WHERE dedup_key = @dedupKey',
      { dedupKey: params.dedupKey }
    );
    if (existing) {
      return false; // Prevent duplicate notification
    }
  }

  await db.run(
    `INSERT INTO notifications (
      id, recipient_id, recipient_role, application_id,
      title, message, type, severity, is_read, action_url, dedup_key
    ) VALUES (
      @id, @recipientId, @recipientRole, @applicationId,
      @title, @message, @type, @severity, 0, @actionUrl, @dedupKey
    )`,
    {
      id,
      recipientId: params.recipientId || null,
      recipientRole: params.recipientRole || null,
      applicationId: params.applicationId || null,
      title: params.title,
      message: params.message,
      type: params.type,
      severity: params.severity,
      actionUrl: params.actionUrl || null,
      dedupKey
    }
  );

  return true;
}
