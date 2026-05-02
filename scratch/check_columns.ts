
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'referencias_nutricionais' });
  
  if (error) {
    // If RPC doesn't exist, try to select one row and see keys
    const { data: oneRow, error: rowError } = await supabase
      .from('referencias_nutricionais')
      .select('*')
      .limit(1);
      
    if (rowError) {
      console.error(rowError);
    } else if (oneRow && oneRow.length > 0) {
      console.log('Colunas encontradas:', Object.keys(oneRow[0]));
    } else {
      console.log('Tabela vazia ou não encontrada.');
    }
  } else {
    console.log('Colunas via RPC:', data);
  }
}

checkColumns();
