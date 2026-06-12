const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();

    // Check fornecedores
    const r1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'fornecedores' ORDER BY ordinal_position`);
    if(r1.rows.length > 0) {
        console.log('--- FORNECEDORES cols:', r1.rows.map(r => r.column_name));
    } else {
        console.log('--- No fornecedores table found.');
    }

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
