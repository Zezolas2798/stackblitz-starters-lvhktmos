const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    const res = await client.query('SELECT DISTINCT categoria FROM qual_planilha_modelos');
    console.log("Categorias no banco:", res.rows.map(r => r.categoria));
    await client.end();
}

run().catch(console.error);
