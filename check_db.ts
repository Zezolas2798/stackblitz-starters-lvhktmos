import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await (supabase as any).from('lotes_estoque').select('*');
    if (error) {
        console.error('Error fetching lotes_estoque:', error);
    } else {
        console.log(`lotes_estoque has ${data.length} rows.`);
        if (data.length > 0) {
            console.log('Sample:', data[0]);
        }
    }

    const { data: d2 } = await (supabase as any).from('estoque_lotes').select('*');
    console.log(`estoque_lotes has ${d2?.length || 0} rows.`);
}

check().catch(console.error);

