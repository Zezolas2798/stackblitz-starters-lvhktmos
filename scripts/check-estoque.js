const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();

    // Check tables related to lotes, compras, notas, or estoque
    const r1 = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%estoque%' OR table_name ILIKE '%lote%' OR table_name ILIKE '%compra%' OR table_name ILIKE '%recebimento%' OR table_name ILIKE '%nota%'`);
    console.log('--- TABLES:', r1.rows.map(r => r.table_name));

    // Check specific columns
    for (let table of ['estoque_entradas', 'estoque_lotes', 'movimentacoes_estoque', 'recebimentos', 'compras']) {
        try {
            const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
            if(cols.rows.length > 0) {
                console.log(`\n--- ${table.toUpperCase()} cols:`, cols.rows.map(r => r.column_name));
            }
        } catch(e) {}
    }

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
