const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('controle_temperatura').upsert([{ 
    cliente_id: '123', 
    unidade_id: '123', 
    equipamento_id: '123', 
    data: '2026-06-11', 
    periodo: 'MANHA'
  }], { onConflict: 'equipamento_id, periodo, data' });
  console.log('Error:', error);
}
run();
