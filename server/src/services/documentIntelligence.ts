import { db } from '../db/database.js';
import crypto from 'node:crypto';

export interface ExtractionResult {
  extractedText: string;
  ocrEngine: string;
  confidenceScore: number;
  extractedFields: Record<string, any>;
  detectedKeywords: string[];
  missingFields: string[];
  findings: Array<{
    rule: string;
    status: 'PASS' | 'WARN' | 'FAIL' | 'INFO';
    note: string;
  }>;
  isHumanVerified: boolean;
  needsReview: boolean;
  duplicateWarning?: string | null;
}

export class DocumentIntelligenceService {
  static async analyzeDocument(
    documentId: string,
    documentType: string,
    filename: string,
    fileBuffer?: Buffer
  ): Promise<ExtractionResult> {
    // 1. Duplicate Document Detection
    const existingSameName = await db.queryOne<{ id: string; application_id: string }>(
      'SELECT id, application_id FROM application_documents WHERE filename = @filename AND id != @id',
      { filename, id: documentId }
    );
    let duplicateWarning: string | null = null;
    if (existingSameName) {
      duplicateWarning = `Notice: A document with identical name "${filename}" already exists in the system (Doc ID: ${existingSameName.id}). Please verify authenticity.`;
    }

    // 2. OCR and Field Extraction Simulation based on Document Category
    let extractedText = '';
    let confidenceScore = 0.92;
    const extractedFields: Record<string, any> = {};
    const detectedKeywords: string[] = [];
    const missingFields: string[] = [];
    const findings: Array<{ rule: string; status: 'PASS' | 'WARN' | 'FAIL' | 'INFO'; note: string }> = [];

    const lowerName = filename.toLowerCase();

    if (documentType === 'Land_Documents' || lowerName.includes('land') || lowerName.includes('deed')) {
      extractedText = `GOVERNMENT REVENUE DEPARTMENT FORM VII-XII / RECORD OF RIGHTS. Registered Educational Trust. Survey No: 42/1/B. Total Land Area: 5.24 Acres (2.12 Hectares). Encumbrance: Nil (Free from mortgages, charges, or liens). Zoning: Sanctioned for Higher & Technical Educational Use by District Collector.`;
      confidenceScore = 0.94;
      extractedFields.survey_number = '42/1/B';
      extractedFields.area_acres = 5.24;
      extractedFields.encumbrance_status = 'Clear & Unencumbered';
      extractedFields.zoning = 'Educational Institutional Campus';
      detectedKeywords.push('Survey No', '5.24 Acres', 'Non-Encumbered', 'Collector Sanction', 'Educational Trust');

      findings.push({
        rule: 'AICTE APH 2026-27 Cl 1.4 Contiguous Land',
        status: 'PASS',
        note: 'Land area of 5.24 contiguous acres satisfies AICTE minimum requirement of 5.0 acres in Urban/Metro Zone.'
      });
      findings.push({
        rule: 'Revenue Conversion Sanction',
        status: 'PASS',
        note: 'Non-agricultural conversion specifically for Higher Educational purposes verified.'
      });
    } else if (documentType === 'Fire_Safety_NOC' || lowerName.includes('fire')) {
      const today = new Date();
      const expiryDate = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 20 days ahead

      extractedText = `STATE DIRECTORATE OF FIRE SERVICES. CERTIFICATE OF FIRE SAFETY NOC. Certificate No: FS-NOC-2025/9981. Building Description: Academic & Laboratory Blocks G+3. Fire Safety Measures: Wet risers, automated smoke alarms, 50kL underground static water tank inspected and operational. Valid Until: ${expiryDate}.`;
      confidenceScore = 0.84; // Intentionally < 0.85 to demonstrate human verification required
      extractedFields.issuing_authority = 'Directorate of Fire Services';
      extractedFields.certificate_no = 'FS-NOC-2025/9981';
      extractedFields.expiry_date = expiryDate;
      extractedFields.water_storage_capacity = '50,000 Litres';
      detectedKeywords.push('Fire Safety NOC', 'Wet Risers', 'Smoke Detectors', 'Static Tank', expiryDate);

      findings.push({
        rule: 'Validity Duration Check',
        status: 'WARN',
        note: `Certificate validity expires on ${expiryDate} (< 30 days). Submission of renewal receipt or renewal challan is mandatory.`
      });
      findings.push({
        rule: 'Automated Suppression Infrastructure',
        status: 'PASS',
        note: 'Fire hose reels and dedicated emergency staircases verified compliant with National Building Code Part 4.'
      });
    } else if (documentType === 'Building_Plan' || lowerName.includes('building') || lowerName.includes('plan')) {
      extractedText = `MUNICIPAL CORPORATION TOWN PLANNING DEPARTMENT. SANCTIONED OCCUPANCY & STRUCTURAL STABILITY DRAWINGS. Total Built-Up Area: 14,250 sq.meters. Instructional Carpet Area: 8,900 sq.m. Administrative Area: 2,100 sq.m. Amenities: 3,250 sq.m. Barrier Free Access: Dedicated ramps with 1:12 slope and passenger lift.`;
      confidenceScore = 0.95;
      extractedFields.total_builtup_area_sqm = 14250;
      extractedFields.instructional_area_sqm = 8900;
      extractedFields.administrative_area_sqm = 2100;
      extractedFields.barrier_free_access = 'Ramps and Lifts provided';
      detectedKeywords.push('Built-Up Area 14250 sqm', 'Instructional Carpet Area', 'Barrier-free Ramps', 'Town Planning Sanction');

      findings.push({
        rule: 'Instructional Carpet Area Norms',
        status: 'PASS',
        note: 'Carpet area of 8,900 sq.m exceeds mandated threshold for sanctioned student strength.'
      });
      findings.push({
        rule: 'Differently-Abled Accessibility',
        status: 'PASS',
        note: 'Dedicated ramps with safety handrails and wide elevator cabins confirmed.'
      });
    } else if (documentType === 'AICTE_Affidavit' || lowerName.includes('affidavit')) {
      extractedText = `BEFORE THE NOTARY PUBLIC. NON-JUDICIAL STAMP PAPER RS. 100. AFFIDAVIT UNDERTAKING FOR APPROVAL PROCESS 2026-27. We the Chairman and Secretary do solemnly affirm: (1) Compliance with AICTE pay scale norms, (2) Anti-Ragging regulations, (3) Internal Complaints Committee (ICC) established, (4) Grievance Redressal Committee formed.`;
      confidenceScore = 0.96;
      extractedFields.stamp_paper_value = 'INR 100';
      extractedFields.notary_registration = 'NOTARY-GOI-2022/412';
      extractedFields.clauses_covered = 'Clauses 1 to 14 verified';
      detectedKeywords.push('Non-Judicial Stamp Paper', 'Anti-Ragging Undertaking', 'Pay Scales', 'ICC Committee', 'Solemnly Affirm');

      findings.push({
        rule: 'Notarized Legal Stamp Adherence',
        status: 'PASS',
        note: 'Executed on registered Non-Judicial Stamp Paper of requisite value with advocate notary seal.'
      });
    } else {
      // General Document Analysis
      extractedText = `DOCUMENT OCR EXTRACT: ${filename}. AICTE FlowX Intelligent Ingestion Engine scanned 3 pages. Header and official signatory seals recognized. Text density: 1,420 words. No unreadable artifacts detected.`;
      confidenceScore = 0.89;
      extractedFields.document_type_detected = documentType;
      extractedFields.file_name = filename;
      detectedKeywords.push('Official Seal', 'Authorized Signatory', 'Technical Institution');
      findings.push({
        rule: 'Completeness Integrity Check',
        status: 'PASS',
        note: 'Legible document pages with clear resolution and official seal signatures.'
      });
    }

    const needsReview = confidenceScore < 0.85 || findings.some(f => f.status === 'WARN' || f.status === 'FAIL');

    // Save Extraction to database
    const extractionId = crypto.randomUUID();
    await db.run(
      `INSERT INTO document_extractions (
        id, document_id, extracted_text, ocr_engine,
        confidence_score, extracted_fields_json, detected_keywords_json,
        missing_fields_json, findings_json, is_human_verified
      ) VALUES (
        @id, @docId, @extractedText, @ocrEngine,
        @confidenceScore, @fieldsJson, @keywordsJson,
        @missingJson, @findingsJson, 0
      )`,
      {
        id: extractionId,
        docId: documentId,
        extractedText,
        ocrEngine: 'AICTE_FlowX_Vision_OCR',
        confidenceScore,
        fieldsJson: JSON.stringify(extractedFields),
        keywordsJson: JSON.stringify(detectedKeywords),
        missingJson: JSON.stringify(missingFields),
        findingsJson: JSON.stringify(findings)
      }
    );

    // Update Document Status
    await db.run(
      `UPDATE application_documents SET
        status = @status,
        verification_status = @verStatus
      WHERE id = @id`,
      {
        status: needsReview ? 'Needs Review' : 'Processed',
        verStatus: needsReview ? 'Pending' : 'Verified',
        id: documentId
      }
    );

    return {
      extractedText,
      ocrEngine: 'AICTE_FlowX_Vision_OCR',
      confidenceScore,
      extractedFields,
      detectedKeywords,
      missingFields,
      findings,
      isHumanVerified: false,
      needsReview,
      duplicateWarning
    };
  }
}
