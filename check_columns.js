const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        
        const res = await client.query(`
            SELECT id, modelo_id, titulo 
            FROM public.qual_planilha_colunas 
            WHERE titulo ILIKE '%equipamento%' 
               OR titulo ILIKE '%reservat_rio%' 
               OR titulo ILIKE '%filtro%'
               OR titulo ILIKE '%elemento filtrante%'
               OR titulo ILIKE '%identifica__o%';
        `);
        
        console.log("Found columns:", res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
