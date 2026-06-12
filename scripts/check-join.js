const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    
    try {
        const res = await client.query(`
            SELECT el.id, el.numero_lote_fabricante,
                   el.ingrediente_id, m.nome as ingrediente_nome,
                   el.fornecedor_id, f.nome_fantasia as fornecedor_nome
            FROM estoque_lotes el
            LEFT JOIN materiais m ON el.ingrediente_id = m.id
            LEFT JOIN fornecedores f ON el.fornecedor_id = f.id
            WHERE el.status = 'ATIVO' AND el.quantidade_atual_g_ml > 0
            LIMIT 5
        `);
        console.log("LOTES JOIN WORKED:", res.rows);
    } catch(e) {
        console.error("FAIL:", e);
    }

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
