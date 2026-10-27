export type UserRole =
  | 'institution'
  | 'regional_officer'
  | 'regulation_bureau'
  | 'evc_member'
  | 'committee_member'
  | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  designation?: string;
  phone?: string;
  institution_id?: string | null;
  institution_name?: string;
  aicte_id?: string;
  region_id?: string | null;
  region_name?: string;
  region_code?: string;
}

export interface Application {
  id: string;
  application_number: string;
  institution_id: string;
  institution_name: string;
  aicte_id: string;
  state: string;
  city: string;
  region_id?: string | null;
  region_name?: string;
  region_code?: string;
  workflow_code: string;
  workflow_name?: string;
  category: string;
  academic_year: string;
  current_stage: string;
  status: string;
  submission_date?: string | null;
  assigned_officer_id?: string | null;
  assigned_officer_name?: string | null;
  target_completion_date?: string | null;
  is_overdue: number;
  days_pending: number;
  decision_date?: string | null;
  decision_remarks?: string | null;
  decision_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  filename: string;
  file_path: string;
  file_size_bytes?: number;
  mime_type?: string;
  version: number;
  status: string;
  verification_status: string;
  verified_by?: string | null;
  verified_at?: string | null;
  verification_notes?: string | null;
  uploaded_at: string;
  // Extractions joined
  extracted_text?: string;
  ocr_engine?: string;
  confidence_score?: number;
  extracted_fields_json?: string;
  detected_keywords_json?: string;
  missing_fields_json?: string;
  findings_json?: string;
  is_human_verified?: number;
}

export interface ReviewObservation {
  id: string;
  application_id: string;
  stage: string;
  reviewer_id?: string;
  reviewer_name?: string;
  reviewer_role?: string;
  observation_type: string;
  document_id?: string | null;
  clause_reference?: string;
  comments: string;
  is_deficiency: number;
  is_resolved: number;
  institution_response?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface ComplianceItem {
  id: string;
  application_id: string;
  application_number?: string;
  institution_name?: string;
  requirement_id: string;
  requirement_code: string;
  category: string;
  description: string;
  rule_reference: string;
  status: string;
  due_date?: string;
  assigned_officer_id?: string;
  verified_by_name?: string;
  verified_at?: string;
  verification_comments?: string;
  completed_at?: string;
}

export interface DocumentValidity {
  id: string;
  institution_id: string;
  institution_name: string;
  aicte_id: string;
  application_id?: string;
  application_number?: string;
  document_title: string;
  document_type: string;
  document_number: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  days_until_expiry: number;
  responsible_person: string;
  contact_email: string;
  last_reminder_sent_at?: string;
  reminder_interval_days: number;
  is_urgent?: boolean;
}

export interface EvcEvent {
  id: string;
  application_id: string;
  application_number: string;
  institution_id: string;
  institution_name: string;
  event_code: string;
  event_type: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  venue: string;
  lead_expert_id?: string;
  lead_expert_name?: string;
  expert_members_json?: string;
  agenda: string;
  report_summary?: string;
  outcome?: string;
  completed_at?: string;
}

export interface CommitteeReview {
  id: string;
  application_id: string;
  application_number: string;
  institution_name: string;
  committee_type: string;
  hearing_date: string;
  status: string;
  quorum_members_json?: string;
  observations?: string;
  recommendation?: string;
  recorded_by_name?: string;
  recorded_at?: string;
}

export interface NotificationItem {
  id: string;
  recipient_id?: string;
  recipient_role?: string;
  application_id?: string;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  is_read: number;
  action_url?: string;
  created_at: string;
}

export interface EscalationItem {
  id: string;
  rule_id: string;
  rule_name: string;
  event_trigger: string;
  threshold_days: number;
  auto_action?: string;
  application_id: string;
  application_number: string;
  category: string;
  current_stage: string;
  institution_name: string;
  reason: string;
  escalated_from_role: string;
  escalated_to_role: string;
  target_officer_name?: string;
  status: string;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_remarks?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  event_id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state?: string;
  new_state?: string;
  reason?: string;
  ip_address: string;
  metadata_json?: string;
  timestamp: string;
}
