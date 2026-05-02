
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFonte() {
  const { data, error } = await supabase
    .from('referencias_nutricionais')
    .select('fonte');
    
  if (error) {
    console.error(error);
  } else {
    const fontes = Array.from(new Set(data.map(d => d.fonte)));
    console.log('Fontes encontradas:', fontes);
  }
}

checkFonte();
