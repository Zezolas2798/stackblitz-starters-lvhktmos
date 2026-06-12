const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await c.connect();
    
    const r1 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'iot_etiquetas_impressas' ORDER BY ordinal_position`);
    console.log('iot_etiquetas_impressas:', r1.rows.map(r => r.column_name));

    // Check receitas table 
    const r2 = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'receitas' ORDER BY ordinal_position`);
    console.log('receitas:', r2.rows.map(r => r.column_name));

    // Sample data from etiquetas
    const r3 = await c.query(`SELECT * FROM iot_etiquetas_impressas LIMIT 3`);
    console.log('sample etiquetas:', r3.rows);

    await c.end();
}

run().catch(console.error);
