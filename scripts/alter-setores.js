const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    
    // 1. Adicionar coluna tipo
    await client.query(`ALTER TABLE setores_producao ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PRODUCAO'`);
    console.log('Coluna tipo adicionada com sucesso!');
    
    // 2. Verificar setores existentes
    const res = await client.query('SELECT id, nome, tipo FROM setores_producao LIMIT 10');
    console.log('Setores existentes:', res.rows);
    
    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
