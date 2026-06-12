const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await c.connect();
    
    const r1 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'fichas_tecnicas' ORDER BY ordinal_position`);
    console.log('fichas_tecnicas:', r1.rows.map(r => r.column_name));
    
    const r2 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'fichas_tecnicas_uan' ORDER BY ordinal_position`);
    console.log('fichas_tecnicas_uan:', r2.rows.map(r => r.column_name));

    // Check etiquetas
    const r3 = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%etiquet%' OR table_name LIKE '%label%'`);
    console.log('etiqueta tables:', r3.rows);

    // Check modelo etiqueta
    const r4 = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%modelo%'`);
    console.log('modelo tables:', r4.rows);

    await c.end();
}

run().catch(console.error);
