const API_BASE = '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('flowx_token');
  const demoRole = localStorage.getItem('flowx_active_role') || 'institution';
  const demoUserId = localStorage.getItem('flowx_active_user_id') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (demoRole) {
    headers['x-demo-role'] = demoRole;
  }
  if (demoUserId) {
    headers['x-demo-user-id'] = demoUserId;
  }

  // Remove Content-Type for FormData uploads so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Return json or blob based on header
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.blob() as any;
}

export const api = {
  // Auth
  getDemoAccounts: () => apiRequest('/auth/demo-accounts'),
  login: (credentials: { email: string; password?: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => apiRequest('/auth/me'),

  // Applications
  getApplications: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/applications${qs ? `?${qs}` : ''}`);
  },
  getApplicationById: (id: string) => apiRequest(`/applications/${id}`),
  createApplication: (data: any) =>
    apiRequest('/applications', { method: 'POST', body: JSON.stringify(data) }),
  submitApplication: (id: string) =>
    apiRequest(`/applications/${id}/submit`, { method: 'POST' }),
  transitionWorkflow: (id: string, actionData: { action: string; comments?: string; reason?: string }) =>
    apiRequest(`/applications/${id}/transition`, { method: 'POST', body: JSON.stringify(actionData) }),

  // Scrutiny
  getScrutinyQueue: () => apiRequest('/scrutiny/queue'),
  recordObservation: (data: any) =>
    apiRequest('/scrutiny/observation', { method: 'POST', body: JSON.stringify(data) }),
  returnForCorrection: (data: { application_id: string; reason: string; deficiencies?: any[] }) =>
    apiRequest('/scrutiny/return', { method: 'POST', body: JSON.stringify(data) }),
  resubmitApplication: (data: { application_id: string; remarks?: string; resolved_observations?: any[] }) =>
    apiRequest('/scrutiny/resubmit', { method: 'POST', body: JSON.stringify(data) }),
  passScrutiny: (data: { application_id: string; comments?: string }) =>
    apiRequest('/scrutiny/pass', { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  uploadDocument: (formData: FormData) =>
    apiRequest('/documents/upload', { method: 'POST', body: formData }),
  getDocumentExtraction: (id: string) => apiRequest(`/documents/${id}/extraction`),
  verifyDocument: (id: string, data: { verification_status: string; verification_notes?: string }) =>
    apiRequest(`/documents/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),

  // Compliance
  getCompliance: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/compliance${qs ? `?${qs}` : ''}`);
  },
  submitComplianceEvidence: (data: any) =>
    apiRequest('/compliance/evidence', { method: 'POST', body: JSON.stringify(data) }),
  verifyCompliance: (data: { compliance_item_id: string; status: string; verification_comments?: string }) =>
    apiRequest('/compliance/verify', { method: 'POST', body: JSON.stringify(data) }),

  // Validity
  getValidityRecords: (filter?: string) =>
    apiRequest(`/validity${filter ? `?filter=${filter}` : ''}`),
  sendValidityReminder: (id: string) =>
    apiRequest(`/validity/${id}/remind`, { method: 'POST' }),

  // EVC
  getEvcEvents: (status?: string) =>
    apiRequest(`/evc/events${status ? `?status=${status}` : ''}`),
  scheduleEvc: (data: any) =>
    apiRequest('/evc/schedule', { method: 'POST', body: JSON.stringify(data) }),
  submitEvcReport: (id: string, data: { report_summary: string; outcome: string }) =>
    apiRequest(`/evc/${id}/report`, { method: 'POST', body: JSON.stringify(data) }),

  // Committee
  getCommitteeReviews: (status?: string) =>
    apiRequest(`/committee/reviews${status ? `?status=${status}` : ''}`),
  scheduleCommitteeHearing: (data: any) =>
    apiRequest('/committee/schedule', { method: 'POST', body: JSON.stringify(data) }),
  recordCommitteeOutcome: (id: string, data: { recommendation: string; observations?: string }) =>
    apiRequest(`/committee/${id}/record`, { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: (unreadOnly = false) =>
    apiRequest(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  markNotificationRead: (id: string) =>
    apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'POST' }),

  // Escalations
  getEscalations: () => apiRequest('/escalations'),
  acknowledgeEscalation: (id: string) =>
    apiRequest(`/escalations/${id}/acknowledge`, { method: 'POST' }),
  resolveEscalation: (id: string, resolution_remarks: string) =>
    apiRequest(`/escalations/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution_remarks }) }),

  // Reports
  getAnalytics: () => apiRequest('/reports/analytics'),
  exportCsvUrl: () => `${API_BASE}/reports/export-csv`,

  // Audit Logs
  getAuditLogs: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/audit${qs ? `?${qs}` : ''}`);
  },

  // Admin
  getUsers: () => apiRequest('/admin/users'),
  getWorkflows: () => apiRequest('/admin/workflows'),
  resetDemoData: () => apiRequest('/admin/reset-demo', { method: 'POST' })
};
