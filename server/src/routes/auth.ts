import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedUser } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aicte_flowx_super_secure_jwt_secret_sih2026_prototype';

// Get all demo accounts for 1-click evaluator login
router.get('/demo-accounts', async (req: Request, res: Response) => {
  try {
    const accounts = await db.queryAll<any>(`
      SELECT
        p.id, p.email, p.full_name, p.role, p.designation, p.phone,
        i.name as institution_name, r.name as region_name
      FROM profiles p
      LEFT JOIN institutions i ON p.institution_id = i.id
      LEFT JOIN regions r ON p.region_id = r.id
      ORDER BY p.role
    `);
    res.json({ accounts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login with email & password or 1-click demo email
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await db.queryOne<any>(`
      SELECT
        p.id, p.email, p.password_hash, p.full_name, p.role, p.designation,
        p.institution_id, p.region_id,
        i.name as institution_name, i.aicte_id,
        r.name as region_name, r.code as region_code
      FROM profiles p
      LEFT JOIN institutions i ON p.institution_id = i.id
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE p.email = @email AND p.is_active = 1
    `, { email: email.trim().toLowerCase() });

    if (!user) {
      res.status(401).json({ error: 'Invalid email credentials' });
      return;
    }

    // In demo mode or with password check
    if (password) {
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      if (user.password_hash !== hash && password !== 'Demo@123') {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'profile',
      entityId: user.id,
      reason: 'Authenticated successfully',
      ipAddress: req.ip || '127.0.0.1'
    });

    const { password_hash, ...safeUser } = user;
    res.json({
      token,
      user: safeUser,
      message: 'Login successful'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Current Logged-in Profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await db.queryOne<any>(`
      SELECT
        p.id, p.email, p.full_name, p.role, p.designation, p.phone,
        p.institution_id, p.region_id,
        i.name as institution_name, i.aicte_id, i.city, i.state,
        r.name as region_name, r.code as region_code
      FROM profiles p
      LEFT JOIN institutions i ON p.institution_id = i.id
      LEFT JOIN regions r ON p.region_id = r.id
      WHERE p.id = @id
    `, { id: req.user!.id });

    if (!user) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
