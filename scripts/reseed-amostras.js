const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Matérias-primas e Embalagens';
const TITULO = 'Controle de amostras de matérias-primas';

const colunas = [
    { titulo: 'Dados da Amostra (Lote)', tipo: 'SELETOR_LOTE_AMOSTRA', ordem: 1, obrigatorio: true },
    { titulo: 'Teste Realizado', tipo: 'SELECT', ordem: 2, obrigatorio: true, opcoes: ['Físico-químicos', 'Microbiológico'] },
    { titulo: 'Responsável pela Coleta', tipo: 'COLABORADOR', ordem: 3, obrigatorio: true },
    { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 4, obrigatorio: false },
];

async function run() {
    await client.connect();
    
    // First, delete the old model if it exists
    const old = await client.query(`SELECT id FROM qual_planilha_modelos WHERE titulo = $1 AND categoria = $2`, [TITULO, CATEGORIA]);
    if (old.rows.length > 0) {
        console.log(`Deletando modelo antigo (${old.rows[0].id})...`);
        await client.query(`DELETE FROM qual_planilha_colunas WHERE modelo_id = $1`, [old.rows[0].id]);
        await client.query(`DELETE FROM qual_planilha_modelos WHERE id = $1`, [old.rows[0].id]);
    }

    // Insert new model
    const res = await client.query(
        `INSERT INTO qual_planilha_modelos (titulo, categoria, ativo) VALUES ($1, $2, true) RETURNING id`,
        [TITULO, CATEGORIA]
    );
    const modeloId = res.rows[0].id;
    console.log(`✅ Criada nova planilha: "${TITULO}" (${modeloId})`);

    // Insert columns
    for (const col of colunas) {
        await client.query(
            `INSERT INTO qual_planilha_colunas (modelo_id, titulo, tipo, ordem, obrigatorio, opcoes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [modeloId, col.titulo, col.tipo, col.ordem, col.obrigatorio, col.opcoes ? JSON.stringify(col.opcoes) : null]
        );
    }
    console.log(`   → ${colunas.length} colunas inseridas`);

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
