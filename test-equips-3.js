const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: equip } = await supabase.from('equipamentos_config').select('*').ilike('nome', '%Freezer Horizontal%');
  console.log('Equipments:', equip);
  const { data: all_grupos } = await supabase.from('equipamentos_config').select('id, nome, grupo, parent_id').limit(10);
  console.log('Sample gruops:', all_grupos);
}
run();
