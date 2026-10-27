import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout/AppLayout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { CreateApplicationPage } from './pages/CreateApplicationPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { DocumentIntelligencePage } from './pages/DocumentIntelligencePage';
import { ScrutinyPage } from './pages/ScrutinyPage';
import { ReScrutinyPage } from './pages/ReScrutinyPage';
import { EvcPage } from './pages/EvcPage';
import { CommitteePage } from './pages/CommitteePage';
import { CompliancePage } from './pages/CompliancePage';
import { DocumentValidityPage } from './pages/DocumentValidityPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { EscalationsPage } from './pages/EscalationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { WorkflowConfigPage } from './pages/WorkflowConfigPage';
import { ComplianceRulesPage } from './pages/ComplianceRulesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpPage } from './pages/HelpPage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Main Administrative Application Shell */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/new" element={<CreateApplicationPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="document-intelligence" element={<DocumentIntelligencePage />} />
        <Route path="scrutiny" element={<ScrutinyPage />} />
        <Route path="rescrutiny" element={<ReScrutinyPage />} />
        <Route path="evc" element={<EvcPage />} />
        <Route path="committee" element={<CommitteePage />} />
        <Route path="compliance" element={<CompliancePage />} />
        <Route path="validity" element={<DocumentValidityPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="escalations" element={<EscalationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="audit" element={<AuditTrailPage />} />
        <Route path="admin/users" element={<UserManagementPage />} />
        <Route path="admin/workflows" element={<WorkflowConfigPage />} />
        <Route path="admin/compliance-rules" element={<ComplianceRulesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="help" element={<HelpPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
