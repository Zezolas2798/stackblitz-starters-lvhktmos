const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Temperatura';

const planilhas = [
    {
        titulo: 'Controle de Temperatura de Equipamentos e Alimentos',
        colunas: [
            { titulo: 'Temperaturas Unificadas', tipo: 'TABELA_DINAMICA_TEMPERATURAS_UNIFICADA', ordem: 1, obrigatorio: true },
        ]
    },
    {
        titulo: 'Temperatura ambiente nas áreas de produção',
        colunas: [
            { titulo: 'Temperaturas Ambientes (Setor, Temperatura)', tipo: 'TABELA_DINAMICA_AMBIENTE', ordem: 1, obrigatorio: true },
        ]
    },
    {
        titulo: 'Controle de temperatura do alimento durante o resfriamento',
        colunas: [
            { titulo: 'Resfriamento (Alimento, Temp Inicial, Hora Inicial, Temp Final, Hora Final)', tipo: 'TABELA_DINAMICA_RESFRIAMENTO', ordem: 1, obrigatorio: true },
        ]
    }
];

async function run() {
    await client.connect();
    
    for (const p of planilhas) {
        // Delete old ones
        const old = await client.query(`SELECT id FROM qual_planilha_modelos WHERE titulo = $1 AND categoria = $2`, [p.titulo, CATEGORIA]);
        if (old.rows.length > 0) {
            console.log(`Deletando modelo antigo (${p.titulo})...`);
            await client.query(`DELETE FROM qual_planilha_colunas WHERE modelo_id = $1`, [old.rows[0].id]);
            await client.query(`DELETE FROM qual_planilha_modelos WHERE id = $1`, [old.rows[0].id]);
        }

        const res = await client.query(
            `INSERT INTO qual_planilha_modelos (titulo, categoria, ativo) VALUES ($1, $2, true) RETURNING id`,
            [p.titulo, CATEGORIA]
        );
        const modeloId = res.rows[0].id;
        console.log(`✅ Criada nova planilha: "${p.titulo}" (${modeloId})`);

        for (const col of p.colunas) {
            await client.query(
                `INSERT INTO qual_planilha_colunas (modelo_id, titulo, tipo, ordem, obrigatorio, opcoes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [modeloId, col.titulo, col.tipo, col.ordem, col.obrigatorio, col.opcoes ? JSON.stringify(col.opcoes) : null]
            );
        }
    }

    await client.end();
}

run().catch(e => { console.error(e); process.exit(1); });
