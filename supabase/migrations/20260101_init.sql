-- AICTE FlowX - Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Smart India Hackathon 2026 (SIH26262 Prototype)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. REGIONS
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  headquarters TEXT,
  states_covered TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INSTITUTIONS
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aicte_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  pincode TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  principal_name TEXT,
  established_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('institution', 'regional_officer', 'regulation_bureau', 'evc_member', 'committee_member', 'admin')),
  designation TEXT,
  phone TEXT,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKFLOW DEFINITIONS
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORKFLOW VERSIONS
CREATE TABLE IF NOT EXISTS public.workflow_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_definition_id UUID REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_current BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WORKFLOW STAGES
CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_version_id UUID REFERENCES public.workflow_versions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  responsible_role TEXT NOT NULL,
  sla_days INTEGER DEFAULT 7,
  can_return_for_correction BOOLEAN DEFAULT TRUE,
  requires_evc BOOLEAN DEFAULT FALSE,
  requires_committee BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WORKFLOW TRANSITIONS
CREATE TABLE IF NOT EXISTS public.workflow_transitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_version_id UUID REFERENCES public.workflow_versions(id) ON DELETE CASCADE,
  from_stage_code TEXT NOT NULL,
  to_stage_code TEXT NOT NULL,
  action_name TEXT NOT NULL,
  allowed_role TEXT NOT NULL,
  requires_reason BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. APPLICATIONS
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number TEXT UNIQUE NOT NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE RESTRICT,
  workflow_code TEXT REFERENCES public.workflow_definitions(code),
  category TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  current_stage TEXT NOT NULL,
  status TEXT NOT NULL,
  submission_date TIMESTAMPTZ,
  assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_completion_date TIMESTAMPTZ,
  is_overdue BOOLEAN DEFAULT FALSE,
  days_pending INTEGER DEFAULT 0,
  decision_date TIMESTAMPTZ,
  decision_remarks TEXT,
  decision_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. APPLICATION STAGE HISTORY
CREATE TABLE IF NOT EXISTS public.application_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  comments TEXT,
  duration_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. APPLICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL,
  verification_status TEXT DEFAULT 'Pending',
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DOCUMENT EXTRACTIONS (AI OCR)
CREATE TABLE IF NOT EXISTS public.document_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES public.application_documents(id) ON DELETE CASCADE,
  extracted_text TEXT,
  ocr_engine TEXT DEFAULT 'AICTE_FlowX_Vision_OCR',
  confidence_score NUMERIC,
  extracted_fields_json JSONB,
  detected_keywords_json JSONB,
  missing_fields_json JSONB,
  findings_json JSONB,
  is_human_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REVIEW OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.review_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id),
  observation_type TEXT NOT NULL,
  document_id UUID REFERENCES public.application_documents(id),
  clause_reference TEXT,
  comments TEXT NOT NULL,
  is_deficiency BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  institution_response TEXT,
  response_document_id UUID REFERENCES public.application_documents(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. COMPLIANCE REQUIREMENTS
CREATE TABLE IF NOT EXISTS public.compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  rule_reference TEXT NOT NULL,
  mandatory_for TEXT DEFAULT 'All',
  effective_from DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- 14. COMPLIANCE ITEMS
CREATE TABLE IF NOT EXISTS public.compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.compliance_requirements(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  assigned_officer_id UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  verification_comments TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. COMPLIANCE EVIDENCE
CREATE TABLE IF NOT EXISTS public.compliance_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compliance_item_id UUID REFERENCES public.compliance_items(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.application_documents(id),
  undertaking_text TEXT,
  signatory_name TEXT,
  signatory_designation TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. DOCUMENT VALIDITY RECORDS
CREATE TABLE IF NOT EXISTS public.document_validity_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  document_title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  issuing_authority TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL,
  days_until_expiry INTEGER,
  responsible_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_interval_days INTEGER DEFAULT 30,
  renewal_application_id UUID REFERENCES public.applications(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. EVC EVENTS
CREATE TABLE IF NOT EXISTS public.evc_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  event_code TEXT UNIQUE NOT NULL,
  event_type TEXT DEFAULT 'Physical EVC',
  status TEXT NOT NULL,
  scheduled_date DATE,
  scheduled_time TEXT,
  venue TEXT,
  lead_expert_id UUID REFERENCES public.profiles(id),
  expert_members_json JSONB,
  agenda TEXT,
  report_summary TEXT,
  outcome TEXT,
  report_document_path TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. COMMITTEE REVIEWS
CREATE TABLE IF NOT EXISTS public.committee_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  committee_type TEXT NOT NULL,
  hearing_date DATE,
  status TEXT NOT NULL,
  quorum_members_json JSONB,
  observations TEXT,
  recommendation TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  recorded_at TIMESTAMPTZ,
  minutes_document_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_role TEXT,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  dedup_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. ESCALATION RULES
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_trigger TEXT NOT NULL,
  threshold_days INTEGER NOT NULL,
  escalate_to_role TEXT NOT NULL,
  auto_action TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. ESCALATION HISTORY
CREATE TABLE IF NOT EXISTS public.escalation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES public.escalation_rules(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  escalated_from_role TEXT NOT NULL,
  escalated_to_role TEXT NOT NULL,
  target_officer_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  actor_id UUID,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_state TEXT,
  new_state TEXT,
  reason TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  metadata_json JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Applications policy: Institution can only view their own; Officers/Admin view all or within region
CREATE POLICY "Institutions view own applications" ON public.applications
  FOR SELECT USING (
    auth.uid() = created_by OR
    institution_id IN (SELECT institution_id FROM public.profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('regional_officer', 'regulation_bureau', 'evc_member', 'committee_member', 'admin'))
  );

-- Audit logs policy: Read-only for authenticated, insert only by system triggers or auth users, NO UPDATE OR DELETE
CREATE POLICY "Audit logs immutable read" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Audit logs insert only" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
