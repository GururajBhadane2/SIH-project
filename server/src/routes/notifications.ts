import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Get Notifications for Current User & Role
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { unread_only } = req.query;

    let query = `
      SELECT * FROM notifications
      WHERE (recipient_id = @userId OR recipient_role = @userRole OR recipient_role IS NULL)
    `;
    const params: Record<string, any> = {
      userId: user.id,
      userRole: user.role
    };

    if (unread_only === 'true') {
      query += ` AND is_read = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const notifications = await db.queryAll<any>(query, params);
    const unreadCountRow = await db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM notifications
      WHERE (recipient_id = @userId OR recipient_role = @userRole OR recipient_role IS NULL)
        AND is_read = 0
    `, params);

    res.json({
      notifications,
      unreadCount: unreadCountRow?.count || 0,
      total: notifications.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark Notification as Read
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = @id', { id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark All Notifications as Read
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    await db.run(`
      UPDATE notifications SET is_read = 1
      WHERE recipient_id = @userId OR recipient_role = @userRole OR recipient_role IS NULL
    `, { userId: user.id, userRole: user.role });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
