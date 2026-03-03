import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
    console.error("Missing SUPABASE_URL. Make sure to run this script with .env loaded");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
    console.log('Fetching old lotes from estoque_lotes...');
    const { data: oldLotes, error: getErr } = await supabase.from('estoque_lotes').select('*');
    if (getErr) throw getErr;

    if (!oldLotes || oldLotes.length === 0) {
        console.log('No lotes to migrate.');
        return;
    }

    console.log(`Found ${oldLotes.length} items. Mapping to lotes_estoque...`);

    const newLotes = oldLotes.map((lote: any) => {
        // Converta quantidades para G ou ML
        let qtdInicialReal = lote.quantidade_inicial || 0;
        let qtdAtualReal = lote.quantidade_atual || 0;

        if (lote.unidade_medida === 'KG' || lote.unidade_medida === 'L') {
            qtdInicialReal = qtdInicialReal * 1000;
            qtdAtualReal = qtdAtualReal * 1000;
        }

        let statusFinal = lote.status_lote;
        if (statusFinal === 'ATIVO') statusFinal = 'APROVADO';
        if (statusFinal === 'BLOQUEADO' || statusFinal === 'AVARIADO') statusFinal = 'REJEITADO';

        return {
            unidade_id: lote.cliente_id, // Unidade ID was not heavily present in Phase 1, cliente_id acts as fallback
            ingrediente_id: lote.ingrediente_id,
            fornecedor_id: lote.fornecedor_id,
            numero_lote_fabricante: lote.codigo_lote_fornecedor || `INT-MIG-${lote.id.substring(0, 4)}`,
            nota_fiscal: lote.nota_fiscal || null,
            data_fabricacao: lote.data_recebimento || new Date().toISOString(),
            data_validade_rotulo: lote.data_validade_original || lote.data_validade_atual || new Date().toISOString(),
            data_validade_interna: lote.data_validade_atual || new Date().toISOString(),
            quantidade_inicial_g_ml: qtdInicialReal,
            quantidade_atual_g_ml: qtdAtualReal,
            status: statusFinal,
            created_at: lote.data_recebimento || new Date().toISOString()
        };
    });

    console.log('Sample of translated payload:', newLotes[0]);

    // Check if they already exist to avoid duplicates
    const { data: existingLotes } = await supabase.from('lotes_estoque').select('id, numero_lote_fabricante');
    const existingIds = new Set(existingLotes?.map((l: any) => l.numero_lote_fabricante) || []);

    const lotesToInsert = newLotes.filter((newLote: any) => !existingIds.has(newLote.numero_lote_fabricante));

    console.log(`Inserting ${lotesToInsert.length} new lotes...`);

    if (lotesToInsert.length > 0) {
        const { error: insertErr } = await supabase.from('lotes_estoque').insert(lotesToInsert);
        if (insertErr) {
            console.error('Failed to insert lotes:', insertErr);
        } else {
            console.log('Migration successful!');
        }
    } else {
        console.log('All lotes were already migrated.');
    }
}

migrate().catch(console.error);
