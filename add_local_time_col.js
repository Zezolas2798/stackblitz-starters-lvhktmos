const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        await client.query(`
            ALTER TABLE public.qual_planilha_registros 
            ADD COLUMN IF NOT EXISTS data_referencia_local TEXT;
        `);
        console.log("Column data_referencia_local added successfully.");

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
