-- AICTE FlowX - Complete Database Schema (SQLite & PostgreSQL Compatible)
-- SIH26262 Prototype

-- 1. REGIONS
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  headquarters TEXT,
  states_covered TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. INSTITUTIONS
CREATE TABLE IF NOT EXISTS institutions (
  id TEXT PRIMARY KEY,
  aicte_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region_id TEXT REFERENCES regions(id),
  type TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  pincode TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  principal_name TEXT,
  established_year INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 3. PROFILES (USERS & ROLES)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('institution', 'regional_officer', 'regulation_bureau', 'evc_member', 'committee_member', 'admin')),
  designation TEXT,
  phone TEXT,
  institution_id TEXT REFERENCES institutions(id),
  region_id TEXT REFERENCES regions(id),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. WORKFLOW DEFINITIONS
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. WORKFLOW VERSIONS
CREATE TABLE IF NOT EXISTS workflow_versions (
  id TEXT PRIMARY KEY,
  workflow_definition_id TEXT REFERENCES workflow_definitions(id),
  version_number INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  is_current INTEGER DEFAULT 1,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 6. WORKFLOW STAGES
CREATE TABLE IF NOT EXISTS workflow_stages (
  id TEXT PRIMARY KEY,
  workflow_version_id TEXT REFERENCES workflow_versions(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  responsible_role TEXT NOT NULL,
  sla_days INTEGER DEFAULT 7,
  can_return_for_correction INTEGER DEFAULT 1,
  requires_evc INTEGER DEFAULT 0,
  requires_committee INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. WORKFLOW TRANSITIONS
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id TEXT PRIMARY KEY,
  workflow_version_id TEXT REFERENCES workflow_versions(id),
  from_stage_code TEXT NOT NULL,
  to_stage_code TEXT NOT NULL,
  action_name TEXT NOT NULL,
  allowed_role TEXT NOT NULL,
  requires_reason INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 8. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  application_number TEXT UNIQUE NOT NULL,
  institution_id TEXT REFERENCES institutions(id),
  workflow_code TEXT REFERENCES workflow_definitions(code),
  category TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  status TEXT NOT NULL,
  submission_date TEXT,
  assigned_officer_id TEXT REFERENCES profiles(id),
  target_completion_date TEXT,
  is_overdue INTEGER DEFAULT 0,
  days_pending INTEGER DEFAULT 0,
  decision_date TEXT,
  decision_remarks TEXT,
  decision_by TEXT REFERENCES profiles(id),
  created_by TEXT REFERENCES profiles(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 9. APPLICATION STAGE HISTORY
CREATE TABLE IF NOT EXISTS application_stage_history (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT REFERENCES profiles(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  comments TEXT,
  duration_hours REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 10. APPLICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS application_documents (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  document_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL,
  verification_status TEXT DEFAULT 'Pending',
  verified_by TEXT REFERENCES profiles(id),
  verified_at TEXT,
  verification_notes TEXT,
  uploaded_by TEXT REFERENCES profiles(id),
  uploaded_at TEXT DEFAULT (datetime('now'))
);

-- 11. DOCUMENT EXTRACTIONS (AI / OCR)
CREATE TABLE IF NOT EXISTS document_extractions (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES application_documents(id),
  extracted_text TEXT,
  ocr_engine TEXT DEFAULT 'AICTE_FlowX_Vision_OCR',
  confidence_score REAL,
  extracted_fields_json TEXT,
  detected_keywords_json TEXT,
  missing_fields_json TEXT,
  findings_json TEXT,
  is_human_verified INTEGER DEFAULT 0,
  verified_by TEXT REFERENCES profiles(id),
  verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 12. REVIEW OBSERVATIONS & DEFICIENCIES
CREATE TABLE IF NOT EXISTS review_observations (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  stage TEXT NOT NULL,
  reviewer_id TEXT REFERENCES profiles(id),
  observation_type TEXT NOT NULL,
  document_id TEXT REFERENCES application_documents(id),
  clause_reference TEXT,
  comments TEXT NOT NULL,
  is_deficiency INTEGER DEFAULT 0,
  is_resolved INTEGER DEFAULT 0,
  institution_response TEXT,
  response_document_id TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 13. COMPLIANCE REQUIREMENTS
CREATE TABLE IF NOT EXISTS compliance_requirements (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  rule_reference TEXT NOT NULL,
  mandatory_for TEXT DEFAULT 'All',
  effective_from TEXT NOT NULL,
  is_active INTEGER DEFAULT 1
);

-- 14. COMPLIANCE ITEMS
CREATE TABLE IF NOT EXISTS compliance_items (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  requirement_id TEXT REFERENCES compliance_requirements(id),
  status TEXT NOT NULL,
  due_date TEXT,
  assigned_officer_id TEXT REFERENCES profiles(id),
  verified_by TEXT REFERENCES profiles(id),
  verified_at TEXT,
  verification_comments TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 15. COMPLIANCE EVIDENCE
CREATE TABLE IF NOT EXISTS compliance_evidence (
  id TEXT PRIMARY KEY,
  compliance_item_id TEXT REFERENCES compliance_items(id),
  document_id TEXT REFERENCES application_documents(id),
  undertaking_text TEXT,
  signatory_name TEXT,
  signatory_designation TEXT,
  submitted_at TEXT DEFAULT (datetime('now'))
);

-- 16. DOCUMENT VALIDITY RECORDS
CREATE TABLE IF NOT EXISTS document_validity_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT REFERENCES institutions(id),
  application_id TEXT REFERENCES applications(id),
  document_title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  issuing_authority TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  status TEXT NOT NULL,
  days_until_expiry INTEGER,
  responsible_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  last_reminder_sent_at TEXT,
  reminder_interval_days INTEGER DEFAULT 30,
  renewal_application_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 17. EVC EVENTS (EXPERT VISIT COMMITTEES)
CREATE TABLE IF NOT EXISTS evc_events (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  institution_id TEXT REFERENCES institutions(id),
  event_code TEXT UNIQUE NOT NULL,
  event_type TEXT DEFAULT 'Physical EVC',
  status TEXT NOT NULL,
  scheduled_date TEXT,
  scheduled_time TEXT,
  venue TEXT,
  lead_expert_id TEXT REFERENCES profiles(id),
  expert_members_json TEXT,
  agenda TEXT,
  report_summary TEXT,
  outcome TEXT,
  report_document_path TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 18. COMMITTEE REVIEWS (SAC / SHC)
CREATE TABLE IF NOT EXISTS committee_reviews (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES applications(id),
  committee_type TEXT NOT NULL,
  hearing_date TEXT,
  status TEXT NOT NULL,
  quorum_members_json TEXT,
  observations TEXT,
  recommendation TEXT,
  recorded_by TEXT REFERENCES profiles(id),
  recorded_at TEXT,
  minutes_document_path TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 19. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  recipient_id TEXT,
  recipient_role TEXT,
  application_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  action_url TEXT,
  dedup_key TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 20. ESCALATION RULES
CREATE TABLE IF NOT EXISTS escalation_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  event_trigger TEXT NOT NULL,
  threshold_days INTEGER NOT NULL,
  escalate_to_role TEXT NOT NULL,
  auto_action TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 21. ESCALATION HISTORY
CREATE TABLE IF NOT EXISTS escalation_history (
  id TEXT PRIMARY KEY,
  rule_id TEXT REFERENCES escalation_rules(id),
  application_id TEXT REFERENCES applications(id),
  reason TEXT NOT NULL,
  escalated_from_role TEXT NOT NULL,
  escalated_to_role TEXT NOT NULL,
  target_officer_id TEXT REFERENCES profiles(id),
  status TEXT NOT NULL,
  acknowledged_at TEXT,
  resolved_at TEXT,
  resolution_remarks TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 22. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  reason TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  metadata_json TEXT,
  timestamp TEXT NOT NULL
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_apps_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_apps_stage ON applications(current_stage);
CREATE INDEX IF NOT EXISTS idx_apps_inst ON applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_apps_wf ON applications(workflow_code);
CREATE INDEX IF NOT EXISTS idx_apps_officer ON applications(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_id, recipient_role, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_validity_dates ON document_validity_records(expiry_date, status);
