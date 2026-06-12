const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    const res = await client.query('SELECT * FROM setores_producao');
    console.log(res.rows);
    await client.end();
}

run().catch(console.error);
