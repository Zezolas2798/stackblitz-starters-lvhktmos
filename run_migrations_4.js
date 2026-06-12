const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to remote database.');

        await client.query(`
            ALTER TABLE public.qual_planilha_registros ADD COLUMN IF NOT EXISTS item_monitorado text;
        `);
        console.log('Successfully added item_monitorado column to registros.');

    } catch (err) {
        console.error('Error executing migrations:', err);
    } finally {
        await client.end();
    }
}

run();
