import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get Immutable Audit Trail with Filters & Pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { entity_type, action, actor_role, search, limit = '50', offset = '0' } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: Record<string, any> = {};

    if (entity_type) {
      query += ' AND entity_type = @entityType';
      params.entityType = entity_type;
    }
    if (action) {
      query += ' AND action = @action';
      params.action = action;
    }
    if (actor_role) {
      query += ' AND actor_role = @actorRole';
      params.actorRole = actor_role;
    }
    if (search) {
      query += ' AND (actor_name LIKE @search OR reason LIKE @search OR event_id LIKE @search OR entity_id LIKE @search)';
      params.search = `%${search}%`;
    }

    query += ' ORDER BY timestamp DESC LIMIT @limit OFFSET @offset';
    params.limit = parseInt(limit as string, 10);
    params.offset = parseInt(offset as string, 10);

    const logs = await db.queryAll<any>(query, params);
    const countRow = await db.queryOne<{ total: number }>('SELECT COUNT(*) as total FROM audit_logs');

    res.json({ logs, total: countRow?.total || 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
