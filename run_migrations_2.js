const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to remote database.');

        await client.query(`
            ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assinatura_url text;
            ALTER TABLE public.qual_planilha_registros ADD COLUMN IF NOT EXISTS anexos_gerais jsonb DEFAULT '[]'::jsonb;
        `);
        console.log('Successfully updated schema for signatures and attachments.');

    } catch (err) {
        console.error('Error executing migrations:', err);
    } finally {
        await client.end();
    }
}

run();
