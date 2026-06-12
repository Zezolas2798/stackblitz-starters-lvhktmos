const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Serviços de Alimentação';

const planilhas = [
    {
        titulo: 'Controle de Amostra',
        colunas: [
            { titulo: 'Amostras Coletadas (Alimento, Temperatura, Quantidade, Condição)', tipo: 'TABELA_DINAMICA_AMOSTRAS', ordem: 1, obrigatorio: true },
            { titulo: 'Responsável', tipo: 'COLABORADOR', ordem: 2, obrigatorio: true },
            { titulo: 'Tempo p/ Descarte (horas)', tipo: 'SELECT', ordem: 3, obrigatorio: true, opcoes: ['72', '48', '96'] }
        ]
    },
    {
        titulo: 'Controle de desperdícios',
        colunas: [
            { titulo: 'Desperdícios (Alimento, Produzido, Sobra Limpa, Sobra Suja, Refeições)', tipo: 'TABELA_DINAMICA_DESPERDICIOS', ordem: 1, obrigatorio: true },
        ]
    },
    {
        titulo: 'Controle de óleos',
        colunas: [
            { titulo: 'Equipamento', tipo: 'EQUIPAMENTO', ordem: 1, obrigatorio: true },
            { titulo: 'Alteração de Cor?', tipo: 'BOOLEAN', ordem: 2, obrigatorio: true },
            { titulo: 'Alteração de Aroma?', tipo: 'BOOLEAN', ordem: 3, obrigatorio: true },
            { titulo: 'Apresenta Espuma?', tipo: 'BOOLEAN', ordem: 4, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 5, obrigatorio: false },
            { titulo: 'Plano de Ação', tipo: 'ACTION_PLAN', ordem: 6, obrigatorio: false },
        ]
    },
    {
        titulo: 'Controle de porcionamento',
        colunas: [
            { titulo: 'Porcionamentos (Alimento, Porções, Qtd)', tipo: 'TABELA_DINAMICA_PORCIONAMENTO', ordem: 1, obrigatorio: true },
        ]
    },
    {
        titulo: 'Verificação de qualidade de alimentos prontos',
        colunas: [
            { titulo: 'Avaliações (Alimento, Aparência, Sabor, Temp)', tipo: 'TABELA_DINAMICA_QUALIDADE', ordem: 1, obrigatorio: true },
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
