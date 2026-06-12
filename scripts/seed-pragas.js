const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Pragas e Vetores';

const planilhas = [
    {
        titulo: 'Controle de aplicação de iscas e armadilhas',
        colunas: [
            { titulo: 'Aplicações (Setor, Isca, Qtd)', tipo: 'TABELA_DINAMICA_ISCAS', ordem: 1, obrigatorio: true },
            { titulo: 'Empresa Responsável', tipo: 'FORNECEDOR', ordem: 2, obrigatorio: false },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 3, obrigatorio: false },
        ]
    },
    {
        titulo: 'Controle diário de pragas e vetores',
        colunas: [
            { titulo: 'Inspeções Diárias (Setor, Pragas, Ações)', tipo: 'TABELA_DINAMICA_DIARIO_PRAGAS', ordem: 1, obrigatorio: true },
            { titulo: 'Responsável pela Inspeção', tipo: 'COLABORADOR', ordem: 2, obrigatorio: true },
        ]
    },
    {
        titulo: 'Inspeção de ralos e drenos',
        colunas: [
            { titulo: 'Inspeções de Ralos (Setor, Limpeza, Tampas, Pragas, Ações)', tipo: 'TABELA_DINAMICA_RALOS', ordem: 1, obrigatorio: true },
            { titulo: 'Responsável', tipo: 'COLABORADOR', ordem: 2, obrigatorio: true },
        ]
    },
    {
        titulo: 'Verificação de armadilhas para pragas',
        colunas: [
            { titulo: 'Verificações (Local, Praga, Quantidade, Observações)', tipo: 'TABELA_DINAMICA_ARMADILHAS', ordem: 1, obrigatorio: true },
            { titulo: 'Responsável', tipo: 'COLABORADOR', ordem: 2, obrigatorio: true },
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
