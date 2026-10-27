import { db } from '../db/database.js';
import crypto from 'node:crypto';

export interface AuditEventParams {
  actorId?: string | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export async function logAuditEvent(params: AuditEventParams): Promise<string> {
  const id = crypto.randomUUID();
  const eventId = `EVT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  await db.run(
    `INSERT INTO audit_logs (
      id, event_id, actor_id, actor_name, actor_role, action,
      entity_type, entity_id, previous_state, new_state,
      reason, ip_address, metadata_json, timestamp
    ) VALUES (
      @id, @eventId, @actorId, @actorName, @actorRole, @action,
      @entityType, @entityId, @previousState, @newState,
      @reason, @ipAddress, @metadataJson, @timestamp
    )`,
    {
      id,
      eventId,
      actorId: params.actorId || null,
      actorName: params.actorName,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousState: params.previousState || null,
      newState: params.newState || null,
      reason: params.reason || null,
      ipAddress: params.ipAddress || '127.0.0.1',
      metadataJson: params.metadata ? JSON.stringify(params.metadata) : null,
      timestamp
    }
  );

  return eventId;
}
