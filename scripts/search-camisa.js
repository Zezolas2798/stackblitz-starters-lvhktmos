const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();

    // Procurar por camisa em qualquer lugar
    const r1 = await client.query(`SELECT id, nome, tipo_material, ativo FROM materiais WHERE nome ILIKE '%camisa%'`);
    console.log('--- Busca em materiais por "camisa":', r1.rows);

    const r2 = await client.query(`SELECT id, nome FROM ingredientes WHERE nome ILIKE '%camisa%'`);
    console.log('--- Busca em ingredientes por "camisa":', r2.rows);

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
