const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Matérias-primas e Embalagens';

const planilhas = [
    {
        titulo: 'Controle de amostras de matérias-primas',
        frequencia: 'diaria', // ou esporadica, dependendo de como coletam
        colunas: [
            { titulo: 'Fornecedor', tipo: 'FORNECEDOR', ordem: 1, obrigatorio: true },
            { titulo: 'Matéria-prima / Ingrediente', tipo: 'PRODUTO_GERAL', ordem: 2, obrigatorio: true },
            { titulo: 'Lote', tipo: 'TEXT', ordem: 3, obrigatorio: true },
            { titulo: 'Data de Validade', tipo: 'DATE', ordem: 4, obrigatorio: true },
            { titulo: 'Temperatura (se aplicável)', tipo: 'NUMBER', ordem: 5, obrigatorio: false },
            { titulo: 'Quantidade Coletada (g ou ml)', tipo: 'NUMBER', ordem: 6, obrigatorio: true },
            { titulo: 'Data do Descarte Previsto', tipo: 'DATE', ordem: 7, obrigatorio: true },
            { titulo: 'Responsável pela Coleta', tipo: 'COLABORADOR', ordem: 8, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 9, obrigatorio: false },
        ]
    }
];

async function run() {
    await client.connect();
    console.log('Conectado ao banco!');

    for (const p of planilhas) {
        const existCheck = await client.query(
            `SELECT id FROM qual_planilha_modelos WHERE titulo = $1 AND categoria = $2`,
            [p.titulo, CATEGORIA]
        );
        if (existCheck.rows.length > 0) {
            console.log(`⚠️  Pulando "${p.titulo}" (já existe)`);
            continue;
        }

        const res = await client.query(
            `INSERT INTO qual_planilha_modelos (titulo, categoria, ativo)
             VALUES ($1, $2, true) RETURNING id`,
            [p.titulo, CATEGORIA]
        );
        const modeloId = res.rows[0].id;
        console.log(`✅ Criada: "${p.titulo}" (${modeloId})`);

        for (const col of p.colunas) {
            await client.query(
                `INSERT INTO qual_planilha_colunas (modelo_id, titulo, tipo, ordem, obrigatorio, opcoes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [modeloId, col.titulo, col.tipo, col.ordem, col.obrigatorio, col.opcoes ? JSON.stringify(col.opcoes) : null]
            );
        }
        console.log(`   → ${p.colunas.length} colunas inseridas`);
    }

    await client.end();
    console.log('\n🎉 Seed concluído!');
}

run().catch(e => { console.error(e); process.exit(1); });
