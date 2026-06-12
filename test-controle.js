const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: res, error } = await supabase
          .from('controle_temperatura')
          .select('*, equipamento:equipamentos_config(nome, temp_ideal_min, temp_ideal_max)')
          .limit(1);
  if (error) console.log('Error from controle_temperatura:', error);
  else console.log('Data:', res);
}
run();
