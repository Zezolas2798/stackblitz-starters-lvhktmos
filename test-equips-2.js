const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: all } = await supabase.from('equipamentos_config').select('id, nome, parent_id, grupo').limit(20);
  console.log('Sample Equips:', all);
}
run();
