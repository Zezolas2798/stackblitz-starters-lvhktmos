import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
async function run() {
  const { data: d3, error: e3 } = await supabase.from('colaboradores').select('*').limit(1);
  console.log('colaboradores:', e3 ? e3.message : JSON.stringify(d3));
}
run();
