import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: equips } = await supabase.from('equipamentos_config').select('id, nome, parent_id, grupo').eq('grupo', 'Temperaturas').not('parent_id', 'is', null);
  console.log('Equips with parent_id != null:', equips);
  
  const { data: all } = await supabase.from('equipamentos_config').select('id, nome, parent_id, grupo').eq('grupo', 'Temperaturas');
  console.log('All Equips:', all);
}
run();
