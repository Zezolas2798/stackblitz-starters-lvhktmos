const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to remote database.');

        const files = [
            'supabase/migrations/20260606100000_create_planilhas_dinamicas.sql',
            'supabase/migrations/20260606110000_seed_planilhas_aguas.sql'
        ];

        for (const file of files) {
            const sql = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
            console.log(`Executing ${file}...`);
            await client.query(sql);
            console.log(`Successfully executed ${file}.`);
        }

    } catch (err) {
        console.error('Error executing migrations:', err);
    } finally {
        await client.end();
    }
}

run();
