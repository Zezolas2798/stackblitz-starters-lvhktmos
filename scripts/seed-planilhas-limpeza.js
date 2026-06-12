const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Limpeza e Higienização';
const AREA = 'Gestão da Qualidade e Segurança dos Alimentos';

const planilhas = [
    {
        titulo: 'Controle de abastecimento de produtos de higiene',
        frequencia: 'diaria',
        colunas: [
            { titulo: 'Local / Banheiro', tipo: 'LOCAL_SETOR', ordem: 1, obrigatorio: true },
            { titulo: 'Produto Reposto', tipo: 'PRODUTO_GERAL', ordem: 2, obrigatorio: true },
            { titulo: 'Quantidade Reposta', tipo: 'NUMBER', ordem: 3, obrigatorio: true },
            { titulo: 'Responsável', tipo: 'COLABORADOR', ordem: 4, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 5, obrigatorio: false },
        ]
    },
    {
        titulo: 'Controle de aplicação de desinfetantes',
        frequencia: 'diaria',
        colunas: [
            { titulo: 'Área / Superfície', tipo: 'LOCAL_SETOR', ordem: 1, obrigatorio: true },
            { titulo: 'Produto Utilizado', tipo: 'PRODUTO_GERAL', ordem: 2, obrigatorio: true },
            { titulo: 'Concentração / Diluição', tipo: 'TEXT', ordem: 3, obrigatorio: true },
            { titulo: 'Tempo de Contato', tipo: 'TEXT', ordem: 4, obrigatorio: false },
            { titulo: 'Responsável pela Aplicação', tipo: 'COLABORADOR', ordem: 5, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 6, obrigatorio: false },
        ]
    },
    {
        titulo: 'Inspeção diária de limpeza de banheiros',
        frequencia: 'diaria',
        colunas: [
            { titulo: 'Identificação do Banheiro', tipo: 'LOCAL_SETOR', ordem: 1, obrigatorio: true },
            { titulo: 'Condição Geral de Limpeza e Odor', tipo: 'SELECT', ordem: 2, obrigatorio: true, opcoes: ['Conforme', 'Não Conforme'] },
            { titulo: 'Pias, Vasos e Espelhos Limpos?', tipo: 'BOOLEAN', ordem: 3, obrigatorio: true },
            { titulo: 'Lixeiras Esvaziadas?', tipo: 'BOOLEAN', ordem: 4, obrigatorio: true },
            { titulo: 'Responsável pela Limpeza', tipo: 'COLABORADOR', ordem: 5, obrigatorio: true },
            { titulo: 'Responsável pela Inspeção', tipo: 'COLABORADOR', ordem: 6, obrigatorio: true },
            { titulo: 'Ação Corretiva', tipo: 'ACAO_CORRETIVA', ordem: 7, obrigatorio: false },
        ]
    },
    {
        titulo: 'Limpeza das instalações',
        frequencia: 'diaria',
        colunas: [
            { titulo: 'Área / Setor', tipo: 'LOCAL_SETOR', ordem: 1, obrigatorio: true },
            { titulo: 'Piso Limpo e Seco?', tipo: 'BOOLEAN', ordem: 2, obrigatorio: true },
            { titulo: 'Paredes e Teto Limpos?', tipo: 'BOOLEAN', ordem: 3, obrigatorio: true },
            { titulo: 'Ralos e Canaletas Higienizados?', tipo: 'BOOLEAN', ordem: 4, obrigatorio: true },
            { titulo: 'Portas e Janelas Limpas?', tipo: 'BOOLEAN', ordem: 5, obrigatorio: true },
            { titulo: 'Responsável pela Limpeza', tipo: 'COLABORADOR', ordem: 6, obrigatorio: true },
            { titulo: 'Ação Corretiva', tipo: 'ACAO_CORRETIVA', ordem: 7, obrigatorio: false },
        ]
    },
    {
        titulo: 'Limpeza dos equipamentos',
        frequencia: 'diaria',
        colunas: [
            { titulo: 'Equipamento', tipo: 'EQUIPAMENTO', ordem: 1, obrigatorio: true },
            { titulo: 'Condição de Limpeza', tipo: 'SELECT', ordem: 2, obrigatorio: true, opcoes: ['Conforme', 'Não Conforme'] },
            { titulo: 'Presença de Resíduos Visíveis?', tipo: 'BOOLEAN', ordem: 3, obrigatorio: true },
            { titulo: 'Produto Químico Utilizado', tipo: 'PRODUTO_GERAL', ordem: 4, obrigatorio: false },
            { titulo: 'Responsável pela Limpeza', tipo: 'COLABORADOR', ordem: 5, obrigatorio: true },
            { titulo: 'Ação Corretiva', tipo: 'ACAO_CORRETIVA', ordem: 6, obrigatorio: false },
        ]
    },
    {
        titulo: 'Verificação de eficácia de produtos de limpeza',
        frequencia: 'mensal',
        colunas: [
            { titulo: 'Produto de Limpeza / Marca', tipo: 'PRODUTO_GERAL', ordem: 1, obrigatorio: true },
            { titulo: 'Lote do Produto', tipo: 'TEXT', ordem: 2, obrigatorio: false },
            { titulo: 'Local ou Equipamento Testado', tipo: 'TEXT', ordem: 3, obrigatorio: true },
            { titulo: 'Resultado / Eficácia Observada', tipo: 'SELECT', ordem: 4, obrigatorio: true, opcoes: ['Satisfatório', 'Insatisfatório'] },
            { titulo: 'Ação Corretiva / Descarte', tipo: 'ACAO_CORRETIVA', ordem: 5, obrigatorio: false },
        ]
    },
];

async function run() {
    await client.connect();
    console.log('Conectado ao banco!');

    for (const p of planilhas) {
        // Verificar se já existe
        const existCheck = await client.query(
            `SELECT id FROM qual_planilha_modelos WHERE titulo = $1 AND categoria = $2`,
            [p.titulo, CATEGORIA]
        );
        if (existCheck.rows.length > 0) {
            console.log(`⚠️  Pulando "${p.titulo}" (já existe)`);
            continue;
        }

        // Insert modelo
        const res = await client.query(
            `INSERT INTO qual_planilha_modelos (titulo, categoria, ativo)
             VALUES ($1, $2, true) RETURNING id`,
            [p.titulo, CATEGORIA]
        );
        const modeloId = res.rows[0].id;
        console.log(`✅ Criada: "${p.titulo}" (${modeloId})`);

        // Insert colunas
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
    console.log('\n🎉 Seed de Limpeza e Higienização concluído!');
}

run().catch(e => { console.error(e); process.exit(1); });
