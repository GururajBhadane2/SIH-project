import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

test('AICTE FlowX API Health Verification', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ONLINE');
  assert.equal(data.system, 'AICTE FlowX API Service');
});

test('Authentication: Demo Accounts Available for All 6 Roles', async () => {
  const res = await fetch(`${BASE_URL}/auth/demo-accounts`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.accounts.length >= 6);

  const roles = data.accounts.map(a => a.role);
  assert.ok(roles.includes('institution'));
  assert.ok(roles.includes('regional_officer'));
  assert.ok(roles.includes('regulation_bureau'));
  assert.ok(roles.includes('evc_member'));
  assert.ok(roles.includes('committee_member'));
  assert.ok(roles.includes('admin'));
});

test('Role-Based Boundary: Institution Can Query Assigned Records', async () => {
  const res = await fetch(`${BASE_URL}/applications`, {
    headers: { 'x-demo-role': 'institution' }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.applications));
});

test('Workflow Engine: Unauthorized Role Cannot Approve Application', async () => {
  const res = await fetch(`${BASE_URL}/applications/app-001/transition`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-demo-role': 'institution' // Institution cannot approve
    },
    body: JSON.stringify({ action: 'APPROVE', comments: 'Attempted self-approval' })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Regulatory Rule Enforcement/);
});

test('Reports & Analytics: Dynamic KPIs Calculation from Database', async () => {
  const res = await fetch(`${BASE_URL}/reports/analytics`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.kpis.totalApplications > 0);
  assert.ok(data.charts.byStatus.length > 0);
  assert.ok(data.charts.stageProcessingTimes.length > 0);
});

test('Document Validity: Expiry Counts and Schedule Verification', async () => {
  const res = await fetch(`${BASE_URL}/validity`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.records.length > 0);
  assert.ok(data.counts.total > 0);
});

test('Immutable Audit Log: Records Stored With Timestamp and Event ID', async () => {
  const res = await fetch(`${BASE_URL}/audit?limit=5`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.logs.length > 0);
  assert.ok(data.logs[0].event_id.startsWith('EVT-'));
  assert.ok(data.logs[0].timestamp);
});
