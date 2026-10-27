# AICTE FlowX — Supabase Configuration & Connection Guide

This guide details how **AICTE FlowX** connects to your Supabase project:
- **Project Reference:** `ldmqfkjtaqddlmduzayq`
- **Project URL:** `https://ldmqfkjtaqddlmduzayq.supabase.co`
- **REST API Endpoint:** `https://ldmqfkjtaqddlmduzayq.supabase.co/rest/v1/`
- **PostgreSQL Pooler Host:** `db.ldmqfkjtaqddlmduzayq.supabase.co:5432`

---

## 1. Zero-Setup Local Demonstration Mode

By default, AICTE FlowX includes an embedded, high-performance database (`aicte_flowx.db`) pre-seeded with:
- 18 synthetic technical institution applications across 4 routes (Routes A, B, C, D)
- 6 predefined demo personas covering all regulatory roles
- Live compliance tracking, document validity radar, and immutable audit logs

This enables **immediate local execution** without needing external internet access or credentials.

---

## 2. Connecting to Supabase Cloud PostgreSQL

### Method A: Execute SQL Migration via Supabase Web Dashboard (Recommended)
1. Navigate to your Supabase SQL Editor:
   [https://supabase.com/dashboard/project/ldmqfkjtaqddlmduzayq/sql/new](https://supabase.com/dashboard/project/ldmqfkjtaqddlmduzayq/sql/new)
2. Copy the contents of [`supabase/migrations/20260101_init.sql`](../supabase/migrations/20260101_init.sql).
3. Paste into the editor and click **Run**.
4. All 22 relational tables, indexes, and Row Level Security (RLS) policies will be provisioned in your cloud database.

### Method B: Automated CLI Migration
1. Open `server/.env`.
2. Update `DATABASE_URL` with your database password:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.ldmqfkjtaqddlmduzayq.supabase.co:5432/postgres
   ```
3. Run the migration script:
   ```bash
   node scripts/migrate-supabase.js
   ```

---

## 3. Connecting to the Supabase REST API (`/rest/v1/`)

1. Obtain your `anon` or `service_role` API key from:
   [https://supabase.com/dashboard/project/ldmqfkjtaqddlmduzayq/settings/api](https://supabase.com/dashboard/project/ldmqfkjtaqddlmduzayq/settings/api)
2. Add your key to `server/.env` and `client/.env`:
   ```env
   # server/.env
   SUPABASE_URL=https://ldmqfkjtaqddlmduzayq.supabase.co
   SUPABASE_PROJECT_REF=ldmqfkjtaqddlmduzayq
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

   # client/.env
   VITE_SUPABASE_URL=https://ldmqfkjtaqddlmduzayq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Test your REST API connection:
   ```bash
   node scripts/test-supabase-api.js
   ```

---

## 4. Supabase MCP Server Configuration

To configure the Supabase Model Context Protocol (MCP) server for Antigravity, add the following to `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "serverUrl": "https://mcp.supabase.com/mcp?project_ref=ldmqfkjtaqddlmduzayq&read_only=true&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
    }
  }
}
```

Then restart Antigravity to authenticate the OAuth session.
