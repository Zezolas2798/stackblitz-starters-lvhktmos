const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: equip } = await supabase.from('equipamentos_config').select('id, nome').ilike('nome', '%Freezer Horizontal%');
  console.log('Equipments:', equip);
  if (equip && equip.length > 0) {
    for (const eq of equip) {
      const { data: counts } = await supabase.from('controle_temperatura').select('periodo').eq('equipamento_id', eq.id);
      const periods = counts.map(c => c.periodo);
      console.log('Periods for ' + eq.nome + ':', [...new Set(periods)]);
    }
  }
  process.exit(0);
}
run();
