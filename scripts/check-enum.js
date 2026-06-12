const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

async function run() {
    await client.connect();
    
    try {
        const res = await client.query(`
            SELECT enumlabel FROM pg_enum
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
            WHERE pg_type.typname = 'status_lote_estoque'
        `);
        console.log("STATUS ENUM:", res.rows);
    } catch(e) {
        console.error("FAIL:", e);
    }

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
