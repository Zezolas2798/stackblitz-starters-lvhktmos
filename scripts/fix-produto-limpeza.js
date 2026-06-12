const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    
    // Get all modelo_ids from Limpeza e Higienização
    const modelos = await client.query(
        `SELECT id, titulo FROM qual_planilha_modelos WHERE categoria = 'Limpeza e Higienização'`
    );
    console.log('Modelos encontrados:', modelos.rows.map(r => r.titulo));

    const modeloIds = modelos.rows.map(r => r.id);

    // Update PRODUTO_GERAL -> PRODUTO_LIMPEZA for these modelos
    const upd = await client.query(
        `UPDATE qual_planilha_colunas SET tipo = 'PRODUTO_LIMPEZA' WHERE tipo = 'PRODUTO_GERAL' AND modelo_id = ANY($1) RETURNING id, titulo, tipo`,
        [modeloIds]
    );
    console.log(`\n✅ ${upd.rowCount} colunas atualizadas de PRODUTO_GERAL -> PRODUTO_LIMPEZA:`);
    upd.rows.forEach(r => console.log(`   - ${r.titulo}`));

    await client.end();
    console.log('\nConcluído!');
}

run().catch(e => { console.error(e); process.exit(1); });
