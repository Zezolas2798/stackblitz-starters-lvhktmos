const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to remote database.');

        const res = await client.query(`
            DELETE FROM public.qual_planilha_colunas 
            WHERE id IN ('f65ed0d5-3131-43d5-b229-0c91be8f3be0', '61a7da3e-f5cc-4f50-b255-fd00580746e3')
            RETURNING id, titulo;
        `);
        
        console.log("Deleted columns:", res.rows);

    } catch (err) {
        console.error('Error executing migrations:', err);
    } finally {
        await client.end();
    }
}

run();
