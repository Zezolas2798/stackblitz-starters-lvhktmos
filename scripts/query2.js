const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    const res = await client.query(`SELECT id, modelo_id, titulo, tipo FROM qual_planilha_colunas WHERE tipo = 'TABELA_DINAMICA_ISCAS'`);
    console.log(res.rows);
    await client.end();
}

run().catch(console.error);
