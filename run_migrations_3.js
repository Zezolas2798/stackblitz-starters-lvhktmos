const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to remote database.');

        await client.query(`
            ALTER TABLE public.qual_planilha_configuracoes ADD COLUMN IF NOT EXISTS itens_monitorados jsonb DEFAULT '[]'::jsonb;
        `);
        console.log('Successfully added itens_monitorados column.');

    } catch (err) {
        console.error('Error executing migrations:', err);
    } finally {
        await client.end();
    }
}

run();
