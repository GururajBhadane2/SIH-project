import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { DocumentIntelligenceService } from '../services/documentIntelligence.js';
import { logAuditEvent } from '../services/auditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  }
});

// Allowed file types: PDF, DOCX, JPG, JPEG, PNG (Max 15MB)
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Supported: PDF, DOCX, JPG, PNG`));
    }
  }
});

const router = Router();
router.use(authMiddleware);

// 1. Upload Supporting Document and Run AI Document Intelligence
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const file = req.file;
    const { application_id, document_type, version } = req.body;

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (!application_id || !document_type) {
      res.status(400).json({ error: 'application_id and document_type are required' });
      return;
    }

    const docId = crypto.randomUUID();
    const filePath = `/uploads/${file.filename}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Save Document record
    await db.run(`
      INSERT INTO application_documents (
        id, application_id, document_type, filename,
        file_path, file_size_bytes, mime_type, version,
        status, verification_status, uploaded_by, uploaded_at
      ) VALUES (
        @id, @appId, @docType, @filename,
        @filePath, @size, @mime, @version,
        'Processing', 'Pending', @userId, @now
      )
    `, {
      id: docId,
      appId: application_id,
      docType: document_type,
      filename: file.originalname,
      filePath,
      size: file.size,
      mime: file.mimetype,
      version: version ? parseInt(version, 10) : 1,
      userId: user.id,
      now
    });

    // Run AI Document Intelligence (OCR, Keyword Detection, Rule Checks)
    const extraction = await DocumentIntelligenceService.analyzeDocument(
      docId,
      document_type,
      file.originalname
    );

    // Record Audit Log
    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'document',
      entityId: docId,
      newState: extraction.needsReview ? 'Needs Review' : 'Processed',
      reason: `Uploaded ${file.originalname} for ${document_type}`,
      metadata: {
        application_id,
        confidence_score: extraction.confidenceScore,
        document_type
      }
    });

    res.status(201).json({
      success: true,
      documentId: docId,
      filename: file.originalname,
      filePath,
      extraction,
      message: 'Document uploaded and analyzed with AI Intelligence'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Document Extraction Details
router.get('/:id/extraction', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await db.queryOne<any>(`
      SELECT d.*, e.*
      FROM application_documents d
      LEFT JOIN document_extractions e ON d.id = e.document_id
      WHERE d.id = @id
    `, { id });

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json({ document });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Human Reviewer Verification of Document Findings
router.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { verification_status, verification_notes, is_human_verified } = req.body;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.run(`
      UPDATE application_documents SET
        verification_status = @verStatus,
        verification_notes = @notes,
        verified_by = @userId,
        verified_at = @now,
        status = CASE WHEN @verStatus = 'Verified' THEN 'Verified' ELSE 'Needs Review' END
      WHERE id = @id
    `, {
      verStatus: verification_status || 'Verified',
      notes: verification_notes || 'Human verification confirmed extraction accuracy.',
      userId: user.id,
      now,
      id
    });

    await db.run(`
      UPDATE document_extractions SET
        is_human_verified = 1,
        verified_by = @userId,
        verified_at = @now
      WHERE document_id = @id
    `, { userId: user.id, now, id });

    await logAuditEvent({
      actorId: user.id,
      actorName: user.full_name,
      actorRole: user.role,
      action: 'DOCUMENT_VERIFIED',
      entityType: 'document',
      entityId: id,
      newState: verification_status,
      reason: verification_notes || 'Officer verified document extraction',
      metadata: { verification_status }
    });

    res.json({ success: true, message: 'Document verification updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
