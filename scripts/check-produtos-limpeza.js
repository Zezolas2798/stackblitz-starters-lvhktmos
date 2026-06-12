const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();

    // 1. Todos os grupos com modalidade LIMPEZA
    const grupos = await client.query(`SELECT id, nome, modalidade FROM grupos_produto WHERE modalidade = 'LIMPEZA' ORDER BY nome`);
    console.log('=== GRUPOS LIMPEZA ===');
    console.log(grupos.rows);

    // 2. Subgrupos desses grupos
    const grupoIds = grupos.rows.map(g => g.id);
    if (grupoIds.length > 0) {
        const subgrupos = await client.query(`SELECT id, nome, grupo_id FROM subgrupos_produto WHERE grupo_id = ANY($1) ORDER BY nome`, [grupoIds]);
        console.log('\n=== SUBGRUPOS LIMPEZA ===');
        console.log(subgrupos.rows);
    }

    // 3. Materiais com tipo_material LIMPEZA
    const materiais = await client.query(`SELECT id, nome, tipo_material, grupo_id, marca FROM materiais WHERE tipo_material = 'LIMPEZA' ORDER BY nome`);
    console.log('\n=== MATERIAIS LIMPEZA ===');
    console.log(materiais.rows);

    // 4. Conferir se o cliente_id está correto
    const matAll = await client.query(`SELECT id, nome, tipo_material, grupo_id, cliente_id FROM materiais WHERE tipo_material = 'LIMPEZA'`);
    console.log('\n=== MATERIAIS COM CLIENTE_ID ===');
    console.log(matAll.rows);

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
