import { db, getDatabase, saveDatabase } from './database.js';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, 'schema.sql');

export async function runSeed(force = true) {
  const database = await getDatabase();

  // Ensure tables exist
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    database.run(schemaSql);
  }

  const existing = await db.queryOne<{ count: number }>('SELECT count(*) as count FROM profiles');
  if (!force && existing && existing.count > 0) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding AICTE FlowX synthetic demonstration database...');

  const hashPassword = (pw: string) => crypto.createHash('sha256').update(pw).digest('hex');
  const defaultPw = hashPassword('Demo@123');

  // Clear existing
  const tables = [
    'audit_logs', 'escalation_history', 'escalation_rules', 'notifications',
    'committee_reviews', 'evc_events', 'document_validity_records',
    'compliance_evidence', 'compliance_items', 'compliance_requirements',
    'review_observations', 'document_extractions', 'application_documents',
    'application_stage_history', 'applications', 'workflow_transitions',
    'workflow_stages', 'workflow_versions', 'workflow_definitions',
    'profiles', 'institutions', 'regions'
  ];
  for (const t of tables) {
    await db.exec(`DELETE FROM ${t};`);
  }

  // 1. REGIONS
  const regions = [
    { id: 'reg-west', name: 'Western Regional Office (WRO)', code: 'WRO', headquarters: 'Mumbai, Maharashtra', states_covered: 'Maharashtra, Gujarat, Goa' },
    { id: 'reg-north', name: 'Northern Regional Office (NRO)', code: 'NRO', headquarters: 'Kanpur, Uttar Pradesh', states_covered: 'Uttar Pradesh, Uttarakhand' },
    { id: 'reg-south', name: 'Southern Regional Office (SRO)', code: 'SRO', headquarters: 'Chennai, Tamil Nadu', states_covered: 'Tamil Nadu, Puducherry' },
    { id: 'reg-east', name: 'Eastern Regional Office (ERO)', code: 'ERO', headquarters: 'Kolkata, West Bengal', states_covered: 'West Bengal, Odisha, Bihar, Jharkhand' }
  ];
  for (const r of regions) {
    await db.run('INSERT INTO regions (id, name, code, headquarters, states_covered) VALUES (@id, @name, @code, @headquarters, @states_covered)', r);
  }

  // 2. INSTITUTIONS
  const institutions = [
    { id: 'inst-01', aicte_id: '1-3329182741', name: 'Apex Institute of Technology & Management', region_id: 'reg-west', type: 'Private-Self Financed', state: 'Maharashtra', city: 'Pune', address: 'Survey No. 42, Hinjawadi Phase 2', pincode: '411057', contact_email: 'principal@apextech.edu.in', contact_phone: '+91 20 2893 4000', principal_name: 'Dr. Ramesh Sharma', established_year: 2008 },
    { id: 'inst-02', aicte_id: '1-4299102832', name: 'Vidya Vikas Engineering College', region_id: 'reg-west', type: 'Govt-Aided', state: 'Maharashtra', city: 'Nagpur', address: 'Wardha Road, South Campus', pincode: '440015', contact_email: 'director@vidyavikas.ac.in', contact_phone: '+91 712 254 1120', principal_name: 'Dr. Sunita Kulkarni', established_year: 1996 },
    { id: 'inst-03', aicte_id: '1-5120938475', name: 'Himalayan Institute of Applied Sciences', region_id: 'reg-north', type: 'University Managed', state: 'Uttarakhand', city: 'Dehradun', address: 'Rajpur Road, Doon Valley', pincode: '248001', contact_email: 'office@hias.edu.in', contact_phone: '+91 135 273 9901', principal_name: 'Prof. Arvind Bisht', established_year: 2012 },
    { id: 'inst-04', aicte_id: '1-6938472910', name: 'Kaveri Polytechnic & Technology Campus', region_id: 'reg-south', type: 'Private-Self Financed', state: 'Tamil Nadu', city: 'Coimbatore', address: 'Avinashi Road, Peelamedu', pincode: '641004', contact_email: 'dean@kaveritech.org', contact_phone: '+91 422 257 8890', principal_name: 'Dr. S. Subramanian', established_year: 2004 },
    { id: 'inst-05', aicte_id: '1-7849302194', name: 'Brahmaputra Engineering Academy', region_id: 'reg-east', type: 'Private-Self Financed', state: 'West Bengal', city: 'Kolkata', address: 'Sector V, Salt Lake', pincode: '700091', contact_email: 'contact@bea.ac.in', contact_phone: '+91 33 2357 1140', principal_name: 'Dr. Debabrata Roy', established_year: 2015 },
    { id: 'inst-06', aicte_id: '1-8930214859', name: 'Sahyadri Global Institute of Pharmacy', region_id: 'reg-west', type: 'Private-Self Financed', state: 'Maharashtra', city: 'Nashik', address: 'Gangapur Road, Campus 1', pincode: '422013', contact_email: 'principal@sahyadripharm.edu.in', contact_phone: '+91 253 230 4567', principal_name: 'Dr. Pradeep Patil', established_year: 2018 }
  ];
  for (const inst of institutions) {
    await db.run('INSERT INTO institutions (id, aicte_id, name, region_id, type, state, city, address, pincode, contact_email, contact_phone, principal_name, established_year) VALUES (@id, @aicte_id, @name, @region_id, @type, @state, @city, @address, @pincode, @contact_email, @contact_phone, @principal_name, @established_year)', inst);
  }

  // 3. PROFILES
  const profiles = [
    { id: 'usr-inst', email: 'institution@flowx.demo', password_hash: defaultPw, full_name: 'Dr. Ramesh Sharma', role: 'institution', designation: 'Principal & Authorized Representative', phone: '+91 98220 12345', institution_id: 'inst-01', region_id: 'reg-west' },
    { id: 'usr-ro', email: 'ro.western@flowx.demo', password_hash: defaultPw, full_name: 'Er. Suresh Deshmukh', role: 'regional_officer', designation: 'Regional Officer (WRO)', phone: '+91 98201 67890', institution_id: null, region_id: 'reg-west' },
    { id: 'usr-rb', email: 'rb.director@flowx.demo', password_hash: defaultPw, full_name: 'Dr. Kavita Verma', role: 'regulation_bureau', designation: 'Director, Regulation & Approval Bureau', phone: '+91 98111 23456', institution_id: null, region_id: null },
    { id: 'usr-evc', email: 'evc.lead@flowx.demo', password_hash: defaultPw, full_name: 'Prof. M. K. Iyer', role: 'evc_member', designation: 'Senior EVC Lead Expert & Academician', phone: '+91 94440 98765', institution_id: null, region_id: 'reg-west' },
    { id: 'usr-committee', email: 'committee.sac@flowx.demo', password_hash: defaultPw, full_name: 'Prof. Anita Roy', role: 'committee_member', designation: 'Member, Standing Appellate Committee (SAC)', phone: '+91 98300 54321', institution_id: null, region_id: null },
    { id: 'usr-admin', email: 'admin@flowx.demo', password_hash: defaultPw, full_name: 'Admin - System Architect', role: 'admin', designation: 'Chief Technology Officer & System Admin', phone: '+91 99999 00000', institution_id: null, region_id: null }
  ];
  for (const p of profiles) {
    await db.run('INSERT INTO profiles (id, email, password_hash, full_name, role, designation, phone, institution_id, region_id) VALUES (@id, @email, @password_hash, @full_name, @role, @designation, @phone, @institution_id, @region_id)', p);
  }

  // 4. WORKFLOW DEFINITIONS
  const workflows = [
    { id: 'wf-route-a', code: 'ROUTE_A', name: 'Route A: Scrutiny Only', description: 'Application → Scrutiny → Decision by Competent Authority. For routine Extension of Approval (EoA) without changes.' },
    { id: 'wf-route-b', code: 'ROUTE_B', name: 'Route B: Scrutiny + EVC', description: 'Application → Scrutiny → Expert Visit Committee (EVC) → Decision. For Increase in Intake, New Courses, or Infrastructure Alterations.' },
    { id: 'wf-route-c', code: 'ROUTE_C', name: 'Route C: EVC + Committee Review', description: 'Application → EVC → SAC/SHC Standing Committee → Decision. For contested compliance, new institutions, or appeals.' },
    { id: 'wf-route-d', code: 'ROUTE_D', name: 'Route D: Direct EVC Verification', description: 'Application → EVC Verification → Decision. For surprise inspections, complaints, or fast-track institutional upgrades.' }
  ];
  for (const wf of workflows) {
    await db.run('INSERT INTO workflow_definitions (id, code, name, description) VALUES (@id, @code, @name, @description)', wf);
  }

  // 5. WORKFLOW VERSIONS
  const wfVersions = [
    { id: 'wfv-a-1', workflow_definition_id: 'wf-route-a', version_number: 1, effective_from: '2026-01-01', effective_to: null, is_current: 1, notes: 'AICTE APH 2026-27 Standard Route A' },
    { id: 'wfv-b-1', workflow_definition_id: 'wf-route-b', version_number: 1, effective_from: '2026-01-01', effective_to: null, is_current: 1, notes: 'AICTE APH 2026-27 Standard Route B with EVC inspection' },
    { id: 'wfv-c-1', workflow_definition_id: 'wf-route-c', version_number: 1, effective_from: '2026-01-01', effective_to: null, is_current: 1, notes: 'AICTE APH 2026-27 Route C with Committee hearing' },
    { id: 'wfv-d-1', workflow_definition_id: 'wf-route-d', version_number: 1, effective_from: '2026-01-01', effective_to: null, is_current: 1, notes: 'AICTE APH 2026-27 Route D Direct EVC' }
  ];
  for (const wfv of wfVersions) {
    await db.run('INSERT INTO workflow_versions (id, workflow_definition_id, version_number, effective_from, effective_to, is_current, notes) VALUES (@id, @workflow_definition_id, @version_number, @effective_from, @effective_to, @is_current, @notes)', wfv);
  }

  // 6. WORKFLOW STAGES
  const stages = [
    { id: 'stg-a-1', workflow_version_id: 'wfv-a-1', code: 'COMPLETENESS_CHECK', name: 'Under Completeness Check', sequence_order: 1, responsible_role: 'regional_officer', sla_days: 3, can_return_for_correction: 1, requires_evc: 0, requires_committee: 0 },
    { id: 'stg-a-2', workflow_version_id: 'wfv-a-1', code: 'PENDING_SCRUTINY', name: 'Scrutiny Evaluation', sequence_order: 2, responsible_role: 'regional_officer', sla_days: 7, can_return_for_correction: 1, requires_evc: 0, requires_committee: 0 },
    { id: 'stg-a-3', workflow_version_id: 'wfv-a-1', code: 'AUTHORITY_DECISION', name: 'Competent Authority Decision', sequence_order: 3, responsible_role: 'regulation_bureau', sla_days: 5, can_return_for_correction: 0, requires_evc: 0, requires_committee: 0 },

    { id: 'stg-b-1', workflow_version_id: 'wfv-b-1', code: 'COMPLETENESS_CHECK', name: 'Under Completeness Check', sequence_order: 1, responsible_role: 'regional_officer', sla_days: 3, can_return_for_correction: 1, requires_evc: 0, requires_committee: 0 },
    { id: 'stg-b-2', workflow_version_id: 'wfv-b-1', code: 'PENDING_SCRUTINY', name: 'Scrutiny Evaluation', sequence_order: 2, responsible_role: 'regional_officer', sla_days: 7, can_return_for_correction: 1, requires_evc: 0, requires_committee: 0 },
    { id: 'stg-b-3', workflow_version_id: 'wfv-b-1', code: 'PENDING_EVC', name: 'Expert Visit Committee (EVC)', sequence_order: 3, responsible_role: 'evc_member', sla_days: 10, can_return_for_correction: 0, requires_evc: 1, requires_committee: 0 },
    { id: 'stg-b-4', workflow_version_id: 'wfv-b-1', code: 'AUTHORITY_DECISION', name: 'Competent Authority Decision', sequence_order: 4, responsible_role: 'regulation_bureau', sla_days: 5, can_return_for_correction: 0, requires_evc: 0, requires_committee: 0 },

    { id: 'stg-c-1', workflow_version_id: 'wfv-c-1', code: 'PENDING_EVC', name: 'Expert Visit Committee (EVC)', sequence_order: 1, responsible_role: 'evc_member', sla_days: 10, can_return_for_correction: 0, requires_evc: 1, requires_committee: 0 },
    { id: 'stg-c-2', workflow_version_id: 'wfv-c-1', code: 'COMMITTEE_REVIEW', name: 'SAC/SHC Committee Hearing', sequence_order: 2, responsible_role: 'committee_member', sla_days: 14, can_return_for_correction: 1, requires_evc: 0, requires_committee: 1 },
    { id: 'stg-c-3', workflow_version_id: 'wfv-c-1', code: 'AUTHORITY_DECISION', name: 'Competent Authority Decision', sequence_order: 3, responsible_role: 'regulation_bureau', sla_days: 5, can_return_for_correction: 0, requires_evc: 0, requires_committee: 0 }
  ];
  for (const s of stages) {
    await db.run('INSERT INTO workflow_stages (id, workflow_version_id, code, name, sequence_order, responsible_role, sla_days, can_return_for_correction, requires_evc, requires_committee) VALUES (@id, @workflow_version_id, @code, @name, @sequence_order, @responsible_role, @sla_days, @can_return_for_correction, @requires_evc, @requires_committee)', s);
  }

  // 7. COMPLIANCE REQUIREMENTS
  const complianceReqs = [
    { id: 'req-01', code: 'LAND_TITLE_DEF', category: 'Land & Infrastructure', description: 'Clear title and non-encumbrance certificate of minimum 5.0 acres contiguous educational land', rule_reference: 'AICTE APH 2026-27 Chapter 1 Cl 1.4', mandatory_for: 'All', effective_from: '2026-01-01' },
    { id: 'req-02', code: 'BUILDING_OCC_CERT', category: 'Safety & Environment', description: 'Permanent Occupancy Certificate and Structural Stability Certificate from Municipal Authority', rule_reference: 'AICTE APH 2026-27 Appendix 4', mandatory_for: 'All', effective_from: '2026-01-01' },
    { id: 'req-03', code: 'FIRE_SAFETY_NOC', category: 'Safety & Environment', description: 'Valid Fire Safety NOC from State Director General of Fire Services', rule_reference: 'National Building Code 2016 Part 4', mandatory_for: 'All', effective_from: '2026-01-01' },
    { id: 'req-04', code: 'FACULTY_CADRE_RATIO', category: 'Faculty & Cadre', description: 'Maintenance of 1:15 Cadre Ratio (Professor : Associate Prof : Asst Prof = 1:2:6)', rule_reference: 'AICTE Notification F.No.61-1/RIFD/7th CPC/2016-17', mandatory_for: 'All', effective_from: '2026-01-01' },
    { id: 'req-05', code: 'ANTI_RAGGING_UNDERTAKING', category: 'Governance & Undertakings', description: 'Online anti-ragging affidavit submission and active Anti-Ragging Committee composition', rule_reference: 'AICTE Regulation F.No.37-3/Legal/AICTE/2009', mandatory_for: 'All', effective_from: '2026-01-01' },
    { id: 'req-06', code: 'DISABLED_FRIENDLY_INFRA', category: 'Land & Infrastructure', description: 'Barrier-free environment: Lifts, ramps with handrails, and disabled-friendly toilets', rule_reference: 'Rights of Persons with Disabilities Act 2016', mandatory_for: 'All', effective_from: '2026-01-01' }
  ];
  for (const cr of complianceReqs) {
    await db.run('INSERT INTO compliance_requirements (id, code, category, description, rule_reference, mandatory_for, effective_from) VALUES (@id, @code, @category, @description, @rule_reference, @mandatory_for, @effective_from)', cr);
  }

  // 8. ESCALATION RULES
  const escRules = [
    { id: 'escr-01', name: 'Scrutiny Overdue Escalation (7 Days)', event_trigger: 'scrutiny_overdue', threshold_days: 7, escalate_to_role: 'regulation_bureau', auto_action: 'Alert Regulation Bureau Director and highlight in Regional Officer workload matrix', is_active: 1 },
    { id: 'escr-02', name: 'Deficiency Response Timeout (14 Days)', event_trigger: 'deficiency_unanswered', threshold_days: 14, escalate_to_role: 'regional_officer', auto_action: 'Issue final reminder to institution with 48h ultimatum before auto-rejection', is_active: 1 },
    { id: 'escr-03', name: 'EVC Scheduling Breach (10 Days)', event_trigger: 'evc_overdue', threshold_days: 10, escalate_to_role: 'regulation_bureau', auto_action: 'Reassign EVC Lead or dispatch Virtual EVC inspection team', is_active: 1 },
    { id: 'escr-04', name: 'Critical Document Expired (0 Days)', event_trigger: 'document_expired', threshold_days: 0, escalate_to_role: 'admin', auto_action: 'Place institutional application on conditional compliance hold', is_active: 1 }
  ];
  for (const er of escRules) {
    await db.run('INSERT INTO escalation_rules (id, name, event_trigger, threshold_days, escalate_to_role, auto_action, is_active) VALUES (@id, @name, @event_trigger, @threshold_days, @escalate_to_role, @auto_action, @is_active)', er);
  }

  // 9. APPLICATIONS (18 Applications)
  const apps = [
    { id: 'app-001', application_number: 'FLOWX-2026-0001', institution_id: 'inst-01', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'PENDING_SCRUTINY', status: 'Pending Scrutiny', submission_date: '2026-10-18 10:30:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-25 18:00:00', is_overdue: 1, days_pending: 9, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-inst', created_at: '2026-10-17 14:00:00' },
    { id: 'app-002', application_number: 'FLOWX-2026-0002', institution_id: 'inst-01', workflow_code: 'ROUTE_B', category: 'Increase in Intake (AI & Data Science)', academic_year: '2026-2027', current_stage: 'PENDING_EVC', status: 'Pending EVC', submission_date: '2026-10-10 11:15:00', assigned_officer_id: 'usr-evc', target_completion_date: '2026-10-28 17:00:00', is_overdue: 0, days_pending: 17, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-inst', created_at: '2026-10-09 09:20:00' },
    { id: 'app-003', application_number: 'FLOWX-2026-0003', institution_id: 'inst-02', workflow_code: 'ROUTE_A', category: 'Introduction of New Course (Cybersecurity)', academic_year: '2026-2027', current_stage: 'RETURNED_FOR_CORRECTION', status: 'Returned for Correction', submission_date: '2026-10-12 16:45:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-26 18:00:00', is_overdue: 1, days_pending: 15, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-inst', created_at: '2026-10-11 12:00:00' },
    { id: 'app-004', application_number: 'FLOWX-2026-0004', institution_id: 'inst-03', workflow_code: 'ROUTE_C', category: 'Establishment of New Technical Institution', academic_year: '2026-2027', current_stage: 'COMMITTEE_REVIEW', status: 'Pending Committee Review', submission_date: '2026-09-28 09:00:00', assigned_officer_id: 'usr-committee', target_completion_date: '2026-10-29 18:00:00', is_overdue: 0, days_pending: 29, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-09-27 10:00:00' },
    { id: 'app-005', application_number: 'FLOWX-2026-0005', institution_id: 'inst-04', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'APPROVED', status: 'Approved', submission_date: '2026-09-15 14:00:00', assigned_officer_id: 'usr-rb', target_completion_date: '2026-09-30 18:00:00', is_overdue: 0, days_pending: 0, decision_date: '2026-09-29 16:30:00', decision_remarks: 'Full approval granted based on flawless scrutiny audit and all compliant undertakings.', decision_by: 'usr-rb', created_by: 'usr-admin', created_at: '2026-09-14 11:00:00' },
    { id: 'app-006', application_number: 'FLOWX-2026-0006', institution_id: 'inst-05', workflow_code: 'ROUTE_B', category: 'Change of Site / Campus Relocation', academic_year: '2026-2027', current_stage: 'PENDING_RE_SCRUTINY', status: 'Pending Re-Scrutiny', submission_date: '2026-10-20 09:30:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-27 18:00:00', is_overdue: 0, days_pending: 7, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-10-05 14:00:00' },
    { id: 'app-007', application_number: 'FLOWX-2026-0007', institution_id: 'inst-06', workflow_code: 'ROUTE_D', category: 'Surprise EVC Inspection for Lab Norms', academic_year: '2026-2027', current_stage: 'PENDING_EVC', status: 'Pending EVC', submission_date: '2026-10-15 15:00:00', assigned_officer_id: 'usr-evc', target_completion_date: '2026-10-25 18:00:00', is_overdue: 1, days_pending: 12, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-10-15 10:00:00' },
    { id: 'app-008', application_number: 'FLOWX-2026-0008', institution_id: 'inst-01', workflow_code: 'ROUTE_A', category: 'Conversion of Women Institution to Co-Ed', academic_year: '2026-2027', current_stage: 'DRAFT', status: 'Draft', submission_date: null, assigned_officer_id: null, target_completion_date: null, is_overdue: 0, days_pending: 2, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-inst', created_at: '2026-10-25 11:20:00' },
    { id: 'app-009', application_number: 'FLOWX-2026-0009', institution_id: 'inst-02', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'COMPLETENESS_CHECK', status: 'Under Completeness Check', submission_date: '2026-10-26 14:10:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-29 18:00:00', is_overdue: 0, days_pending: 1, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-inst', created_at: '2026-10-26 13:00:00' },
    { id: 'app-010', application_number: 'FLOWX-2026-0010', institution_id: 'inst-03', workflow_code: 'ROUTE_B', category: 'Increase in Intake (Computer Science)', academic_year: '2026-2027', current_stage: 'AUTHORITY_DECISION', status: 'Pending Competent Authority Decision', submission_date: '2026-09-20 10:00:00', assigned_officer_id: 'usr-rb', target_completion_date: '2026-10-28 18:00:00', is_overdue: 0, days_pending: 37, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-09-18 16:00:00' },
    { id: 'app-011', application_number: 'FLOWX-2026-0011', institution_id: 'inst-04', workflow_code: 'ROUTE_A', category: 'Closure of Non-Viable Diploma Course', academic_year: '2026-2027', current_stage: 'REJECTED', status: 'Rejected', submission_date: '2026-08-10 11:00:00', assigned_officer_id: 'usr-rb', target_completion_date: '2026-08-30 18:00:00', is_overdue: 0, days_pending: 0, decision_date: '2026-08-28 15:00:00', decision_remarks: 'Rejected due to outstanding student batch obligations and lack of state government concurrence NOC.', decision_by: 'usr-rb', created_by: 'usr-admin', created_at: '2026-08-08 10:00:00' },
    { id: 'app-012', application_number: 'FLOWX-2026-0012', institution_id: 'inst-05', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'COMPLIANCE_PENDING', status: 'Compliance Pending', submission_date: '2026-09-01 12:00:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-31 18:00:00', is_overdue: 0, days_pending: 56, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-08-30 09:00:00' },
    { id: 'app-013', application_number: 'FLOWX-2026-0013', institution_id: 'inst-06', workflow_code: 'ROUTE_C', category: 'Establishment of New Pharmacy College', academic_year: '2026-2027', current_stage: 'PENDING_EVC', status: 'Pending EVC', submission_date: '2026-10-02 11:30:00', assigned_officer_id: 'usr-evc', target_completion_date: '2026-10-22 18:00:00', is_overdue: 1, days_pending: 25, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-09-30 14:00:00' },
    { id: 'app-014', application_number: 'FLOWX-2026-0014', institution_id: 'inst-01', workflow_code: 'ROUTE_B', category: 'Dual Degree Integrated M.Tech Program', academic_year: '2026-2027', current_stage: 'SUBMITTED', status: 'Submitted', submission_date: '2026-10-27 08:45:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-11-05 18:00:00', is_overdue: 0, days_pending: 0, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-inst', created_at: '2026-10-26 18:00:00' },
    { id: 'app-015', application_number: 'FLOWX-2026-0015', institution_id: 'inst-02', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'COMPLIANCE_COMPLETE', status: 'Compliance Complete', submission_date: '2026-07-20 10:00:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-08-15 18:00:00', is_overdue: 0, days_pending: 0, decision_date: '2026-08-14 11:30:00', decision_remarks: 'All post-approval undertakings verified and confirmed.', decision_by: 'usr-ro', created_by: 'usr-inst', created_at: '2026-07-18 10:00:00' },
    { id: 'app-016', application_number: 'FLOWX-2026-0016', institution_id: 'inst-03', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'PENDING_SCRUTINY', status: 'Pending Scrutiny', submission_date: '2026-10-22 15:30:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-29 18:00:00', is_overdue: 0, days_pending: 5, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-10-21 16:00:00' },
    { id: 'app-017', application_number: 'FLOWX-2026-0017', institution_id: 'inst-04', workflow_code: 'ROUTE_B', category: 'Increase in Intake (VLSI & Embedded Systems)', academic_year: '2026-2027', current_stage: 'PENDING_SCRUTINY', status: 'Pending Scrutiny', submission_date: '2026-10-19 11:00:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-26 18:00:00', is_overdue: 1, days_pending: 8, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-10-18 14:00:00' },
    { id: 'app-018', application_number: 'FLOWX-2026-0018', institution_id: 'inst-05', workflow_code: 'ROUTE_A', category: 'Extension of Approval (EoA)', academic_year: '2026-2027', current_stage: 'PENDING_SCRUTINY', status: 'Pending Scrutiny', submission_date: '2026-10-21 10:15:00', assigned_officer_id: 'usr-ro', target_completion_date: '2026-10-28 18:00:00', is_overdue: 0, days_pending: 6, decision_date: null, decision_remarks: null, decision_by: null, created_by: 'usr-admin', created_at: '2026-10-20 11:00:00' }
  ];
  for (const a of apps) {
    await db.run('INSERT INTO applications (id, application_number, institution_id, workflow_code, category, academic_year, current_stage, status, submission_date, assigned_officer_id, target_completion_date, is_overdue, days_pending, decision_date, decision_remarks, decision_by, created_by, created_at) VALUES (@id, @application_number, @institution_id, @workflow_code, @category, @academic_year, @current_stage, @status, @submission_date, @assigned_officer_id, @target_completion_date, @is_overdue, @days_pending, @decision_date, @decision_remarks, @decision_by, @created_by, @created_at)', a);
  }

  // 10. DOCUMENTS
  const docs = [
    { id: 'doc-001', application_id: 'app-001', document_type: 'Land_Documents', filename: 'Apex_Land_Registration_Deed_7_12.pdf', file_path: '/uploads/sample_land_deed.pdf', file_size_bytes: 4280192, mime_type: 'application/pdf', version: 1, status: 'Needs Review', verification_status: 'Pending', verified_by: null, verified_at: null, verification_notes: null, uploaded_by: 'usr-inst', uploaded_at: '2026-10-17 14:30:00' },
    { id: 'doc-002', application_id: 'app-001', document_type: 'Building_Plan', filename: 'PMC_Approved_Building_Plan_Sanction.pdf', file_path: '/uploads/sample_building_plan.pdf', file_size_bytes: 8192000, mime_type: 'application/pdf', version: 1, status: 'Verified', verification_status: 'Verified', verified_by: 'usr-ro', verified_at: '2026-10-19 15:00:00', verification_notes: 'Architect sanction seal and FAR calculations verified compliant with APH norms.', uploaded_by: 'usr-inst', uploaded_at: '2026-10-17 14:35:00' },
    { id: 'doc-003', application_id: 'app-001', document_type: 'Fire_Safety_NOC', filename: 'Maharashtra_Fire_Services_NOC_Renewal.pdf', file_path: '/uploads/sample_fire_noc.pdf', file_size_bytes: 1845000, mime_type: 'application/pdf', version: 1, status: 'Needs Review', verification_status: 'Deficient', verified_by: 'usr-ro', verified_at: '2026-10-19 16:30:00', verification_notes: 'Certificate validity expires within 18 days (2026-11-14). Latest renewal receipt required.', uploaded_by: 'usr-inst', uploaded_at: '2026-10-17 14:40:00' },
    { id: 'doc-004', application_id: 'app-001', document_type: 'AICTE_Affidavit', filename: 'Affidavit_General_Undertakings_StampPaper_100.pdf', file_path: '/uploads/sample_affidavit.pdf', file_size_bytes: 2450000, mime_type: 'application/pdf', version: 1, status: 'Verified', verification_status: 'Verified', verified_by: 'usr-ro', verified_at: '2026-10-19 17:00:00', verification_notes: 'Notarized on Rs. 100 non-judicial stamp paper; all required clauses 1 through 12 present.', uploaded_by: 'usr-inst', uploaded_at: '2026-10-17 14:45:00' },
    { id: 'doc-005', application_id: 'app-003', document_type: 'Faculty_List', filename: 'Faculty_Cadre_List_Cybersecurity.pdf', file_path: '/uploads/sample_faculty.pdf', file_size_bytes: 1204000, mime_type: 'application/pdf', version: 1, status: 'Needs Review', verification_status: 'Deficient', verified_by: 'usr-ro', verified_at: '2026-10-14 11:00:00', verification_notes: 'Missing Ph.D. guide endorsement certificate for candidate Professor in Cybersecurity.', uploaded_by: 'usr-inst', uploaded_at: '2026-10-12 16:50:00' }
  ];
  for (const d of docs) {
    await db.run('INSERT INTO application_documents (id, application_id, document_type, filename, file_path, file_size_bytes, mime_type, version, status, verification_status, verified_by, verified_at, verification_notes, uploaded_by, uploaded_at) VALUES (@id, @application_id, @document_type, @filename, @file_path, @file_size_bytes, @mime_type, @version, @status, @verification_status, @verified_by, @verified_at, @verification_notes, @uploaded_by, @uploaded_at)', d);
  }

  // 11. EXTRACTIONS
  const extractions = [
    {
      id: 'ext-001',
      document_id: 'doc-001',
      extracted_text: 'GOVERNMENT OF MAHARASHTRA REVENUE AND FOREST DEPARTMENT. Form VII-XII Village Hinjawadi Taluka Mulshi. Survey No: 42/1/B. Total Area: 5.24 Acres (2.12 Hectares). Registered Owner: Apex Educational Trust Pune. Encumbrance: Nil. Purpose: Educational Institution Campus.',
      ocr_engine: 'AICTE_FlowX_Vision_OCR',
      confidence_score: 0.94,
      extracted_fields_json: JSON.stringify({
        institution_name: 'Apex Educational Trust',
        survey_number: '42/1/B',
        area_acres: 5.24,
        encumbrance_status: 'Free from Encumbrances',
        registration_date: '2007-06-14',
        validity: 'Perpetual Freehold'
      }),
      detected_keywords_json: JSON.stringify(['Hinjawadi', 'Survey No 42', '5.24 Acres', 'Educational Use', 'Non-Encumbered', 'Apex Educational Trust']),
      missing_fields_json: JSON.stringify(['Tehsildar Mutation Entry No. 8941']),
      findings_json: JSON.stringify([
        { rule: 'APH Cl 1.4 Contiguous Land', status: 'PASS', note: 'Area 5.24 acres satisfies minimum requirement of 5.0 acres for Mega/Metro urban zone.' },
        { rule: 'Conversion to Educational Purpose', status: 'PASS', note: 'Explicit collector permission for non-agricultural educational use detected.' },
        { rule: 'Confidence Check', status: 'INFO', note: 'High OCR confidence (94%). Verified against state Bhulekh portal schema.' }
      ]),
      is_human_verified: 0,
      verified_by: null,
      verified_at: null
    },
    {
      id: 'ext-003',
      document_id: 'doc-003',
      extracted_text: 'MAHARASHTRA FIRE SERVICES HEADQUARTERS MUMBAI. CERTIFICATE OF PROVISIONAL FIRE SAFETY APPROVAL. Reference No: MFS/NOC/2025/8921. Inspected Building: Apex Institute Admin & Lab Block G+3. Valid until: 14th November 2026. Required fire suppression systems: Hydrant, Smoke alarms, Sprinklers installed.',
      ocr_engine: 'AICTE_FlowX_Vision_OCR',
      confidence_score: 0.88,
      extracted_fields_json: JSON.stringify({
        issuing_authority: 'Maharashtra Fire Services',
        noc_number: 'MFS/NOC/2025/8921',
        expiry_date: '2026-11-14',
        building_type: 'Educational G+3',
        hydrant_system: 'Compliant'
      }),
      detected_keywords_json: JSON.stringify(['Fire Safety Approval', 'MFS/NOC/2025/8921', 'Valid until 14 Nov 2026', 'Hydrant System', 'Compliant']),
      missing_fields_json: JSON.stringify(['Annual Third-party Audit Form B']),
      findings_json: JSON.stringify([
        { rule: 'Fire NOC Validity', status: 'WARN', note: 'Validity expires on 2026-11-14 (< 30 days). Renewal must be submitted before final approval.' },
        { rule: 'Hydrant & Sprinkler Coverage', status: 'PASS', note: 'Clear affirmation of automatic fire alarm and hose reel system.' }
      ]),
      is_human_verified: 1,
      verified_by: 'usr-ro',
      verified_at: '2026-10-19 16:30:00'
    }
  ];
  for (const e of extractions) {
    await db.run('INSERT INTO document_extractions (id, document_id, extracted_text, ocr_engine, confidence_score, extracted_fields_json, detected_keywords_json, missing_fields_json, findings_json, is_human_verified, verified_by, verified_at) VALUES (@id, @document_id, @extracted_text, @ocr_engine, @confidence_score, @extracted_fields_json, @detected_keywords_json, @missing_fields_json, @findings_json, @is_human_verified, @verified_by, @verified_at)', e);
  }

  // 12. OBSERVATIONS
  const observations = [
    { id: 'obs-001', application_id: 'app-001', stage: 'Scrutiny Evaluation', reviewer_id: 'usr-ro', observation_type: 'Deficiency', document_id: 'doc-003', clause_reference: 'APH 2026-27 Appendix 4 Cl 4.2', comments: 'Fire NOC expires in under 30 days (14-Nov-2026). Please provide receipt of renewal application submitted to Fire Services authority.', is_deficiency: 1, is_resolved: 0, institution_response: null, resolved_at: null, created_at: '2026-10-19 16:35:00' },
    { id: 'obs-002', application_id: 'app-001', stage: 'Scrutiny Evaluation', reviewer_id: 'usr-ro', observation_type: 'Compliant', document_id: 'doc-002', clause_reference: 'APH 2026-27 Chapter 1 Cl 1.5', comments: 'Building plan approved area 12,400 sq.m exceeds mandated instructional and administrative carpet area.', is_deficiency: 0, is_resolved: 1, institution_response: null, resolved_at: '2026-10-19 15:05:00', created_at: '2026-10-19 15:00:00' },
    { id: 'obs-003', application_id: 'app-003', stage: 'Scrutiny Evaluation', reviewer_id: 'usr-ro', observation_type: 'Deficiency', document_id: 'doc-005', clause_reference: 'AICTE Notification Cadre Ratio Cl 2.1', comments: 'Selected Professor profile for Cybersecurity requires University Ph.D. recognition letter. Upload within 7 days.', is_deficiency: 1, is_resolved: 0, institution_response: 'Letter requested from SPPU Pune University registrar. Will upload in 48 hours.', resolved_at: null, created_at: '2026-10-14 11:15:00' }
  ];
  for (const o of observations) {
    await db.run('INSERT INTO review_observations (id, application_id, stage, reviewer_id, observation_type, document_id, clause_reference, comments, is_deficiency, is_resolved, institution_response, resolved_at, created_at) VALUES (@id, @application_id, @stage, @reviewer_id, @observation_type, @document_id, @clause_reference, @comments, @is_deficiency, @is_resolved, @institution_response, @resolved_at, @created_at)', o);
  }

  // 13. COMPLIANCE ITEMS
  const compItems = [
    { id: 'ci-001', application_id: 'app-001', requirement_id: 'req-01', status: 'Verified', due_date: '2026-10-30', assigned_officer_id: 'usr-ro', verified_by: 'usr-ro', verified_at: '2026-10-19 15:00:00', verification_comments: 'Land deed confirmed free from encumbrances.', completed_at: '2026-10-19 15:00:00' },
    { id: 'ci-002', application_id: 'app-001', requirement_id: 'req-03', status: 'Deficient', due_date: '2026-11-05', assigned_officer_id: 'usr-ro', verified_by: null, verified_at: null, verification_comments: 'Fire NOC renewal submission pending.', completed_at: null },
    { id: 'ci-003', application_id: 'app-001', requirement_id: 'req-05', status: 'Submitted', due_date: '2026-10-31', assigned_officer_id: 'usr-ro', verified_by: null, verified_at: null, verification_comments: null, completed_at: null },
    { id: 'ci-004', application_id: 'app-002', requirement_id: 'req-04', status: 'Under Verification', due_date: '2026-11-10', assigned_officer_id: 'usr-evc', verified_by: null, verified_at: null, verification_comments: 'EVC team assigned to verify physical labs and faculty attendance logs.', completed_at: null },
    { id: 'ci-005', application_id: 'app-005', requirement_id: 'req-06', status: 'Verified', due_date: '2026-09-25', assigned_officer_id: 'usr-ro', verified_by: 'usr-ro', verified_at: '2026-09-28 14:00:00', verification_comments: 'Barrier-free ramp and automated lift inspection certified.', completed_at: '2026-09-28 14:00:00' }
  ];
  for (const ci of compItems) {
    await db.run('INSERT INTO compliance_items (id, application_id, requirement_id, status, due_date, assigned_officer_id, verified_by, verified_at, verification_comments, completed_at) VALUES (@id, @application_id, @requirement_id, @status, @due_date, @assigned_officer_id, @verified_by, @verified_at, @verification_comments, @completed_at)', ci);
  }

  // 14. VALIDITY RECORDS
  const validityRecords = [
    { id: 'val-001', institution_id: 'inst-01', application_id: 'app-001', document_title: 'State Fire Services NOC', document_type: 'Fire Safety Certificate', document_number: 'MFS/NOC/2025/8921', issuing_authority: 'Maharashtra Fire Services', issue_date: '2025-11-15', expiry_date: '2026-11-14', status: 'Expiring Soon', days_until_expiry: 18, responsible_person: 'Er. Nitin Deshpande (Safety Officer)', contact_email: 'safety@apextech.edu.in', last_reminder_sent_at: '2026-10-25 09:00:00', reminder_interval_days: 30 },
    { id: 'val-002', institution_id: 'inst-01', application_id: 'app-001', document_title: 'Campus Land Lease Deed (Sub-Registrar Pune)', document_type: 'Land Lease Deed', document_number: 'MH-PN-2008-091244', issuing_authority: 'Sub-Registrar of Assurances Pune', issue_date: '2008-04-01', expiry_date: '2038-03-31', status: 'Valid', days_until_expiry: 4172, responsible_person: 'Trust Secretary', contact_email: 'registrar@apextech.edu.in', last_reminder_sent_at: null, reminder_interval_days: 60 },
    { id: 'val-003', institution_id: 'inst-02', application_id: 'app-003', document_title: 'Pollution Control Board Consent to Operate', document_type: 'Environmental Clearance', document_number: 'MPCB/RO-NAG/CTO-8812', issuing_authority: 'Maharashtra Pollution Control Board', issue_date: '2023-10-20', expiry_date: '2026-10-20', status: 'Expired', days_until_expiry: -7, responsible_person: 'Campus Facilities Manager', contact_email: 'facilities@vidyavikas.ac.in', last_reminder_sent_at: '2026-10-26 10:00:00', reminder_interval_days: 7 },
    { id: 'val-004', institution_id: 'inst-03', application_id: 'app-004', document_title: 'Structural Stability Certificate', document_type: 'Building Stability', document_number: 'UK-STR-ENG-2021-440', issuing_authority: 'Dehradun Municipal Corporation Chartered Engineer', issue_date: '2021-11-02', expiry_date: '2026-11-01', status: 'Expiring Soon', days_until_expiry: 5, responsible_person: 'Prof. Arvind Bisht', contact_email: 'office@hias.edu.in', last_reminder_sent_at: '2026-10-26 09:30:00', reminder_interval_days: 7 },
    { id: 'val-005', institution_id: 'inst-04', application_id: 'app-005', document_title: 'Lift Safety Inspection License', document_type: 'Safety Certificate', document_number: 'TN-LIFT-LIC-2025-99', issuing_authority: 'Chief Electrical Inspectorate Tamil Nadu', issue_date: '2025-12-01', expiry_date: '2026-11-30', status: 'Expiring Soon', days_until_expiry: 34, responsible_person: 'Estate Officer', contact_email: 'estate@kaveritech.org', last_reminder_sent_at: '2026-10-20 10:00:00', reminder_interval_days: 60 }
  ];
  for (const v of validityRecords) {
    await db.run('INSERT INTO document_validity_records (id, institution_id, application_id, document_title, document_type, document_number, issuing_authority, issue_date, expiry_date, status, days_until_expiry, responsible_person, contact_email, last_reminder_sent_at, reminder_interval_days) VALUES (@id, @institution_id, @application_id, @document_title, @document_type, @document_number, @issuing_authority, @issue_date, @expiry_date, @status, @days_until_expiry, @responsible_person, @contact_email, @last_reminder_sent_at, @reminder_interval_days)', v);
  }

  // 15. EVC EVENTS
  const evcEvents = [
    { id: 'evc-001', application_id: 'app-002', institution_id: 'inst-01', event_code: 'EVC-2026-WRO-004', event_type: 'Physical EVC', status: 'Scheduled', scheduled_date: '2026-10-30', scheduled_time: '10:00 AM IST', venue: 'Apex Institute of Technology, Pune - Computer Lab 4 & Server Room', lead_expert_id: 'usr-evc', expert_members_json: JSON.stringify([{ name: 'Prof. M. K. Iyer', role: 'Chairman / Convener', org: 'IIT Bombay (Retd)' }, { name: 'Dr. Sunita Deshmukh', role: 'Member Expert (AI/Data Science)', org: 'COEP Technological University' }, { name: 'Er. Rajesh Kothari', role: 'Industry Expert', org: 'TCS Innovation Labs' }]), agenda: 'Inspection of High-Performance GPU Computing Lab, faculty cadre records, and 1 Gbps lease line connectivity for proposed AI & Data Science intake increase.', report_summary: null, outcome: null, completed_at: null },
    { id: 'evc-002', application_id: 'app-007', institution_id: 'inst-06', event_code: 'EVC-2026-WRO-009', event_type: 'Physical EVC', status: 'In Progress', scheduled_date: '2026-10-27', scheduled_time: '11:30 AM IST', venue: 'Sahyadri Global Institute of Pharmacy, Nashik', lead_expert_id: 'usr-evc', expert_members_json: JSON.stringify([{ name: 'Prof. M. K. Iyer', role: 'Chairman', org: 'ICT Mumbai' }, { name: 'Dr. V. N. Gholap', role: 'Pharmacy Council Expert', org: 'Poona College of Pharmacy' }]), agenda: 'Surprise inspection of Machine Room, Aseptic Lab, and faculty biometric attendance records.', report_summary: null, outcome: null, completed_at: null },
    { id: 'evc-003', application_id: 'app-010', institution_id: 'inst-03', event_code: 'EVC-2026-NRO-002', event_type: 'Physical EVC', status: 'Completed', scheduled_date: '2026-10-15', scheduled_time: '09:30 AM IST', venue: 'Himalayan Institute of Applied Sciences, Dehradun', lead_expert_id: 'usr-evc', expert_members_json: JSON.stringify([{ name: 'Prof. Arvind Bisht', role: 'Principal' }, { name: 'Dr. R. K. Mittal', role: 'EVC Member' }]), agenda: 'Verification of infrastructure for 60 additional seats in CSE.', report_summary: 'Infrastructure compliant. 2 additional computer laboratories equipped with 60 Core i7 PCs each.', outcome: 'Recommended', completed_at: '2026-10-16 17:00:00' }
  ];
  for (const ev of evcEvents) {
    await db.run('INSERT INTO evc_events (id, application_id, institution_id, event_code, event_type, status, scheduled_date, scheduled_time, venue, lead_expert_id, expert_members_json, agenda, report_summary, outcome, completed_at) VALUES (@id, @application_id, @institution_id, @event_code, @event_type, @status, @scheduled_date, @scheduled_time, @venue, @lead_expert_id, @expert_members_json, @agenda, @report_summary, @outcome, @completed_at)', ev);
  }

  // 16. COMMITTEE REVIEWS
  const commReviews = [
    { id: 'com-001', application_id: 'app-004', committee_type: 'Standing Appellate Committee (SAC)', hearing_date: '2026-10-29', status: 'Scheduled', quorum_members_json: JSON.stringify([{ name: 'Prof. Anita Roy', role: 'Presiding Officer' }, { name: 'Hon. Justice (Retd.) S. P. Gupta', role: 'Legal Expert' }, { name: 'Prof. C. K. Narayanan', role: 'Technical Council Nominee' }]), observations: 'Review of institutional appeal regarding municipal road width sanction for new Dehradun technical campus.', recommendation: null, recorded_by: null, recorded_at: null },
    { id: 'com-002', application_id: 'app-011', committee_type: 'Standing Hearing Committee (SHC)', hearing_date: '2026-08-25', status: 'Decision Recorded', quorum_members_json: JSON.stringify([{ name: 'Prof. Anita Roy', role: 'Chairman' }, { name: 'Dr. Kavita Verma', role: 'Member Secretary' }]), observations: 'Hearing heard regarding closure of non-viable diploma courses. Institution failed to furnish evidence of transfer arrangements for 2nd year students.', recommendation: 'Rejected', recorded_by: 'usr-committee', recorded_at: '2026-08-26 14:00:00' }
  ];
  for (const cr of commReviews) {
    await db.run('INSERT INTO committee_reviews (id, application_id, committee_type, hearing_date, status, quorum_members_json, observations, recommendation, recorded_by, recorded_at) VALUES (@id, @application_id, @committee_type, @hearing_date, @status, @quorum_members_json, @observations, @recommendation, @recorded_by, @recorded_at)', cr);
  }

  // 17. NOTIFICATIONS
  const notifs = [
    { id: 'notif-001', recipient_id: 'usr-ro', recipient_role: 'regional_officer', application_id: 'app-001', title: 'Application Overdue for Scrutiny', message: 'FLOWX-2026-0001 (Apex Institute) has been pending in your scrutiny queue for 9 days (> 7 day SLA).', type: 'overdue', severity: 'danger', is_read: 0, action_url: '/scrutiny?app=app-001', dedup_key: 'scrutiny_overdue_app-001_20261025' },
    { id: 'notif-002', recipient_id: 'usr-inst', recipient_role: 'institution', application_id: 'app-001', title: 'Deficiency Observation Recorded', message: 'Regional Officer raised deficiency for Fire NOC validity. Please upload valid receipt or renewed certificate.', type: 'deficiency_raised', severity: 'warning', is_read: 0, action_url: '/applications/app-001', dedup_key: 'deficiency_app-001_obs-001' },
    { id: 'notif-003', recipient_id: 'usr-evc', recipient_role: 'evc_member', application_id: 'app-002', title: 'Upcoming EVC Visit Scheduled', message: 'Physical EVC inspection for FLOWX-2026-0002 is scheduled on 30-Oct-2026 at Apex Institute, Pune.', type: 'evc_scheduled', severity: 'info', is_read: 0, action_url: '/evc?event=evc-001', dedup_key: 'evc_scheduled_evc-001' },
    { id: 'notif-004', recipient_id: 'usr-rb', recipient_role: 'regulation_bureau', application_id: 'app-001', title: 'Escalation: Scrutiny SLA Breach WRO', message: 'Application FLOWX-2026-0001 exceeded SLA threshold in Western Region. Supervisor attention requested.', type: 'escalated', severity: 'danger', is_read: 0, action_url: '/escalations', dedup_key: 'escalation_app-001_wro_20261025' },
    { id: 'notif-005', recipient_id: 'usr-inst', recipient_role: 'institution', application_id: 'app-001', title: 'Document Expiring Soon Alert', message: 'Fire Safety Certificate (MFS/NOC/2025/8921) will expire in 18 days (14-Nov-2026).', type: 'document_expiring', severity: 'warning', is_read: 1, action_url: '/validity', dedup_key: 'doc_expiry_val-001_30d' }
  ];
  for (const n of notifs) {
    await db.run('INSERT INTO notifications (id, recipient_id, recipient_role, application_id, title, message, type, severity, is_read, action_url, dedup_key) VALUES (@id, @recipient_id, @recipient_role, @application_id, @title, @message, @type, @severity, @is_read, @action_url, @dedup_key)', n);
  }

  // 18. ESCALATIONS
  const escHistory = [
    { id: 'esch-001', rule_id: 'escr-01', application_id: 'app-001', reason: 'Scrutiny evaluation pending beyond 7 business days without recorded extension reason.', escalated_from_role: 'regional_officer', escalated_to_role: 'regulation_bureau', target_officer_id: 'usr-rb', status: 'Active', acknowledged_at: null, resolved_at: null, resolution_remarks: null },
    { id: 'esch-002', rule_id: 'escr-04', application_id: 'app-003', reason: 'Pollution Control Board Consent expired on 2026-10-20. Institutional application auto-held.', escalated_from_role: 'regional_officer', escalated_to_role: 'admin', target_officer_id: 'usr-admin', status: 'Acknowledged', acknowledged_at: '2026-10-26 10:15:00', resolved_at: null, resolution_remarks: 'Institution submitted copy of state fee deposit receipt.' }
  ];
  for (const eh of escHistory) {
    await db.run('INSERT INTO escalation_history (id, rule_id, application_id, reason, escalated_from_role, escalated_to_role, target_officer_id, status, acknowledged_at, resolved_at, resolution_remarks) VALUES (@id, @rule_id, @application_id, @reason, @escalated_from_role, @escalated_to_role, @target_officer_id, @status, @acknowledged_at, @resolved_at, @resolution_remarks)', eh);
  }

  // 19. AUDIT LOGS
  const auditLogs = [
    { id: 'aud-001', event_id: 'EVT-2026-000101', actor_id: 'usr-inst', actor_name: 'Dr. Ramesh Sharma', actor_role: 'institution', action: 'APPLICATION_CREATED', entity_type: 'application', entity_id: 'app-001', previous_state: null, new_state: 'DRAFT', reason: 'Initial application draft initiated', ip_address: '103.21.144.12', metadata_json: JSON.stringify({ category: 'Extension of Approval', academic_year: '2026-2027' }), timestamp: '2026-10-17 14:00:00' },
    { id: 'aud-002', event_id: 'EVT-2026-000102', actor_id: 'usr-inst', actor_name: 'Dr. Ramesh Sharma', actor_role: 'institution', action: 'DOCUMENT_UPLOADED', entity_type: 'document', entity_id: 'doc-001', previous_state: null, new_state: 'Uploaded', reason: 'Uploaded 7/12 land deed', ip_address: '103.21.144.12', metadata_json: JSON.stringify({ filename: 'Apex_Land_Registration_Deed_7_12.pdf', size: 4280192 }), timestamp: '2026-10-17 14:30:00' },
    { id: 'aud-003', event_id: 'EVT-2026-000103', actor_id: 'usr-inst', actor_name: 'Dr. Ramesh Sharma', actor_role: 'institution', action: 'APPLICATION_SUBMITTED', entity_type: 'application', entity_id: 'app-001', previous_state: 'DRAFT', new_state: 'SUBMITTED', reason: 'Institutional submission finalized', ip_address: '103.21.144.12', metadata_json: JSON.stringify({ app_number: 'FLOWX-2026-0001' }), timestamp: '2026-10-18 10:30:00' },
    { id: 'aud-004', event_id: 'EVT-2026-000104', actor_id: 'usr-ro', actor_name: 'Er. Suresh Deshmukh', actor_role: 'regional_officer', action: 'DOCUMENT_VERIFIED', entity_type: 'document', entity_id: 'doc-002', previous_state: 'Needs Review', new_state: 'Verified', reason: 'Building plan FAR verified', ip_address: '14.139.112.5', metadata_json: JSON.stringify({ status: 'Verified' }), timestamp: '2026-10-19 15:00:00' },
    { id: 'aud-005', event_id: 'EVT-2026-000105', actor_id: 'usr-ro', actor_name: 'Er. Suresh Deshmukh', actor_role: 'regional_officer', action: 'DEFICIENCY_RAISED', entity_type: 'scrutiny', entity_id: 'obs-001', previous_state: null, new_state: 'Deficiency', reason: 'Fire NOC validity under 30 days', ip_address: '14.139.112.5', metadata_json: JSON.stringify({ clause: 'APH 2026-27 App 4 Cl 4.2' }), timestamp: '2026-10-19 16:35:00' },
    { id: 'aud-006', event_id: 'EVT-2026-000106', actor_id: 'system', actor_name: 'Automated Escalation Service', actor_role: 'admin', action: 'ESCALATION_TRIGGERED', entity_type: 'escalation', entity_id: 'esch-001', previous_state: 'Normal', new_state: 'Escalated', reason: 'Scrutiny SLA exceeded 7 days', ip_address: '127.0.0.1', metadata_json: JSON.stringify({ target: 'usr-rb', app: 'FLOWX-2026-0001' }), timestamp: '2026-10-25 18:00:00' }
  ];
  for (const al of auditLogs) {
    await db.run('INSERT INTO audit_logs (id, event_id, actor_id, actor_name, actor_role, action, entity_type, entity_id, previous_state, new_state, reason, ip_address, metadata_json, timestamp) VALUES (@id, @event_id, @actor_id, @actor_name, @actor_role, @action, @entity_type, @entity_id, @previous_state, @new_state, @reason, @ip_address, @metadata_json, @timestamp)', al);
  }

  saveDatabase();
  console.log('[Seed] ✓ Database successfully seeded with 18 applications, 6 demo accounts, 4 workflow routes, and all compliance data!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed(true).catch(console.error);
}
