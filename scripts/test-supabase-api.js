import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const url = 'https://ldmqfkjtaqddlmduzayq.supabase.co/rest/v1/';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase REST API connection to:', url);

async function testApi() {
  if (!anonKey || anonKey.includes('placeholder')) {
    console.log('\n🔑 Note: Supabase REST API (/rest/v1/) requires an API key header ("apikey").');
    console.log('You can find your anon/service_role key at:');
    console.log('https://supabase.com/dashboard/project/ldmqfkjtaqddlmduzayq/settings/api');
    console.log('\nAdd it to server/.env and client/.env as:');
    console.log('SUPABASE_ANON_KEY=<your-key>');
    console.log('VITE_SUPABASE_ANON_KEY=<your-key>');
    return;
  }

  try {
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      }
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testApi();
