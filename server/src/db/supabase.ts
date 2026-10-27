import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ldmqfkjtaqddlmduzayq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo_placeholder_until_key_provided';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('applications').select('count').limit(1);
    if (error) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Connected to Supabase PostgreSQL cloud instance successfully!' };
  } catch (err: any) {
    return { connected: false, message: err.message };
  }
}

export default supabase;
