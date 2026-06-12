const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();

    // 1. Grupos EPI_EPC e UNIFORMES
    const g1 = await client.query(`SELECT id, nome, modalidade FROM grupos_produto WHERE modalidade IN ('EPI_EPC', 'UNIFORMES') ORDER BY modalidade, nome`);
    console.log('=== GRUPOS EPI/UNIFORMES ===');
    console.log(g1.rows);

    // 2. Materiais EPI_EPC e UNIFORMES
    const m1 = await client.query(`SELECT id, nome, tipo_material, marca, grupo_id FROM materiais WHERE tipo_material IN ('EPI_EPC', 'UNIFORMES') AND ativo = true ORDER BY tipo_material, nome`);
    console.log('\n=== MATERIAIS EPI/UNIFORMES ===');
    console.log(m1.rows);

    // 3. Check profiles columns for health/training data
    const p1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position`);
    console.log('\n=== PROFILES COLUMNS ===');
    console.log(p1.rows.map(r => r.column_name));

    // 4. Check colaboradores table
    const c1 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'colaboradores' ORDER BY ordinal_position`);
    console.log('\n=== COLABORADORES COLUMNS ===');
    console.log(c1.rows.map(r => r.column_name));

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
