import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const { Client } = pg;

const dbUrl = process.env.DATABASE_URL;

console.log('================================================================');
console.log('  📡 Supabase PostgreSQL Cloud Migration Tool');
console.log('  Target Endpoint: db.ldmqfkjtaqddlmduzayq.supabase.co:5432');
console.log('================================================================\n');

if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]')) {
  console.log('⚠️  DATABASE_URL in server/.env still has placeholder "[YOUR-PASSWORD]".');
  console.log('👉 To run automatic cloud migration:');
  console.log('   1. Open server/.env');
  console.log('   2. Replace [YOUR-PASSWORD] with your actual Supabase database password');
  console.log('   3. Re-run: node scripts/migrate-supabase.js');
  console.log('\n💡 Alternatively, copy the contents of supabase/migrations/20260101_init.sql');
  console.log('   directly into the Supabase Dashboard SQL Editor at:');
  console.log('   https://supabase.com/dashboard/project/ldmqfkjtaqddlmduzayq/sql/new\n');
  process.exit(0);
}

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✓ Connected successfully!');

    const sqlPath = path.resolve(__dirname, '../supabase/migrations/20260101_init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying schema migrations and Row Level Security (RLS) policies...');
    await client.query(sql);

    console.log('✓ Migration complete! All 22 tables and RLS policies created on Supabase.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
