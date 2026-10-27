import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aicte_flowx_super_secure_jwt_secret_sih2026_prototype';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  role: 'institution' | 'regional_officer' | 'regulation_bureau' | 'evc_member' | 'committee_member' | 'admin';
  institution_id?: string | null;
  region_id?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Check for Demo Header (convenient for instant evaluator testing)
    const demoRole = req.headers['x-demo-role'] as string;
    const demoUserId = req.headers['x-demo-user-id'] as string;

    if (demoRole || demoUserId) {
      let profile: AuthenticatedUser | null = null;
      if (demoUserId) {
        profile = await db.queryOne<AuthenticatedUser>(
          'SELECT id, email, full_name, role, institution_id, region_id FROM profiles WHERE id = @id',
          { id: demoUserId }
        );
      } else if (demoRole) {
        profile = await db.queryOne<AuthenticatedUser>(
          'SELECT id, email, full_name, role, institution_id, region_id FROM profiles WHERE role = @role LIMIT 1',
          { role: demoRole }
        );
      }

      if (profile) {
        req.user = profile;
        return next();
      }
    }

    // 2. Check for Authorization Bearer Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const profile = await db.queryOne<AuthenticatedUser>(
          'SELECT id, email, full_name, role, institution_id, region_id FROM profiles WHERE id = @id AND is_active = 1',
          { id: decoded.id }
        );
        if (profile) {
          req.user = profile;
          return next();
        }
      } catch (tokenErr) {
        // Fall through to fallback
      }
    }

    // Default development fallback: Dr. Ramesh Sharma (Institution User)
    const fallback = await db.queryOne<AuthenticatedUser>(
      'SELECT id, email, full_name, role, institution_id, region_id FROM profiles WHERE email = "institution@flowx.demo"'
    );
    if (fallback) {
      req.user = fallback;
      return next();
    }

    res.status(401).json({ error: 'Unauthorized: Authentication required' });
  } catch (err: any) {
    res.status(500).json({ error: 'Authentication internal error', details: err.message });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Please log in' });
      return;
    }

    if (req.user.role === 'admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      error: 'Forbidden: Insufficient permissions for your role',
      requiredRoles: allowedRoles,
      yourRole: req.user.role
    });
  };
}
