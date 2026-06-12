const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();

    // Buscar os ultimos 10 materiais adicionados
    const r1 = await client.query(`SELECT id, nome, tipo_material, created_at FROM materiais ORDER BY created_at DESC LIMIT 10`);
    console.log('--- Ultimos 10 materiais:', r1.rows);

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
