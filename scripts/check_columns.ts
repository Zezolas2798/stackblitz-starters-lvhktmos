import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: ingData } = await supabase.from('ingredientes').select('*').limit(1);
  console.log('Ingredientes columns:', ingData ? Object.keys(ingData[0] || {}) : 'No data');
  
  const { data: matData } = await supabase.from('materiais').select('*').limit(1);
  console.log('Materiais columns:', matData ? Object.keys(matData[0] || {}) : 'No data');
}

main();
