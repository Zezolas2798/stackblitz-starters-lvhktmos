const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Manipuladores';
const AREA = 'Gestão da Qualidade e Segurança dos Alimentos';

const opcoesAvaliacao = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'N/A'];

const planilhas = [
    {
        titulo: 'Avaliação de Desempenho e Boas Práticas',
        frequencia: 'mensal',
        colunas: [
            { titulo: 'Colaborador Avaliado', tipo: 'COLABORADOR', ordem: 1, obrigatorio: true },
            { titulo: 'Uso correto de EPI/Uniforme?', tipo: 'SELECT', ordem: 2, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Higiene pessoal adequada?', tipo: 'SELECT', ordem: 3, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Lavagem de mãos conforme procedimento?', tipo: 'SELECT', ordem: 4, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Manipulação segura de alimentos?', tipo: 'SELECT', ordem: 5, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Pontualidade', tipo: 'SELECT', ordem: 6, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Atendimento ao cliente', tipo: 'SELECT', ordem: 7, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Conhecimento técnico', tipo: 'SELECT', ordem: 8, obrigatorio: true, opcoes: opcoesAvaliacao },
            { titulo: 'Resultado Geral', tipo: 'SELECT', ordem: 9, obrigatorio: true, opcoes: ['Conforme', 'Não Conforme', 'Parcialmente Conforme'] },
            { titulo: 'Responsável pela Avaliação', tipo: 'COLABORADOR', ordem: 10, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 11, obrigatorio: false },
            { titulo: 'Ação Corretiva', tipo: 'ACAO_CORRETIVA', ordem: 12, obrigatorio: false },
        ]
    },
    {
        titulo: 'Controle de entrega de EPI´s',
        frequencia: 'esporadica',
        colunas: [
            { titulo: 'Colaborador', tipo: 'COLABORADOR', ordem: 1, obrigatorio: true },
            { titulo: 'EPI Entregue', tipo: 'MATERIAL_EPI', ordem: 2, obrigatorio: true },
            { titulo: 'Quantidade', tipo: 'NUMBER', ordem: 3, obrigatorio: true },
            { titulo: 'Motivo da Entrega', tipo: 'SELECT', ordem: 4, obrigatorio: true, opcoes: ['Primeira Entrega', 'Substituição', 'Danificado', 'Perda'] },
            { titulo: 'Assinatura do Colaborador', tipo: 'SIGNATURE', ordem: 5, obrigatorio: true },
            { titulo: 'Responsável pela Entrega', tipo: 'COLABORADOR', ordem: 6, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 7, obrigatorio: false },
        ]
    },
    {
        titulo: 'Controle de entrega de Uniformes',
        frequencia: 'esporadica',
        colunas: [
            { titulo: 'Colaborador', tipo: 'COLABORADOR', ordem: 1, obrigatorio: true },
            { titulo: 'Uniforme Entregue', tipo: 'MATERIAL_UNIFORME', ordem: 2, obrigatorio: true },
            { titulo: 'Condição', tipo: 'SELECT', ordem: 3, obrigatorio: true, opcoes: ['Novo', 'Usado'] },
            { titulo: 'Tamanho', tipo: 'SELECT', ordem: 4, obrigatorio: true, opcoes: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
            { titulo: 'Quantidade', tipo: 'NUMBER', ordem: 5, obrigatorio: true },
            { titulo: 'Motivo da Entrega', tipo: 'SELECT', ordem: 6, obrigatorio: true, opcoes: ['Primeira Entrega', 'Substituição', 'Danificado', 'Perda'] },
            { titulo: 'Assinatura do Colaborador', tipo: 'SIGNATURE', ordem: 7, obrigatorio: true },
            { titulo: 'Responsável pela Entrega', tipo: 'COLABORADOR', ordem: 8, obrigatorio: true },
            { titulo: 'Observações', tipo: 'TEXTAREA', ordem: 9, obrigatorio: false },
        ]
    },
    {
        titulo: 'Registro de Acidentes de Trabalho',
        frequencia: 'esporadica',
        colunas: [
            { titulo: 'Colaborador Acidentado', tipo: 'COLABORADOR', ordem: 1, obrigatorio: true },
            { titulo: 'Data e Hora do Acidente', tipo: 'DATETIME', ordem: 2, obrigatorio: true },
            { titulo: 'Local do Acidente', tipo: 'LOCAL_SETOR', ordem: 3, obrigatorio: true },
            { titulo: 'Tipo de Acidente', tipo: 'SELECT', ordem: 4, obrigatorio: true, opcoes: ['Corte', 'Queimadura', 'Queda', 'Choque Elétrico', 'Intoxicação', 'Lesão por Esforço', 'Outro'] },
            { titulo: 'Descrição do Ocorrido', tipo: 'TEXTAREA', ordem: 5, obrigatorio: true },
            { titulo: 'Gravidade', tipo: 'SELECT', ordem: 6, obrigatorio: true, opcoes: ['Leve', 'Moderado', 'Grave'] },
            { titulo: 'Atendimento Médico Necessário?', tipo: 'BOOLEAN', ordem: 7, obrigatorio: true },
            { titulo: 'CAT Emitida?', tipo: 'BOOLEAN', ordem: 8, obrigatorio: true },
            { titulo: 'Testemunhas', tipo: 'TEXT', ordem: 9, obrigatorio: false },
            { titulo: 'Ações Tomadas', tipo: 'TEXTAREA', ordem: 10, obrigatorio: false },
            { titulo: 'Ação Corretiva / Prevenção', tipo: 'ACAO_CORRETIVA', ordem: 11, obrigatorio: false },
        ]
    },
    {
        titulo: 'Verificação de asseio pessoal',
        frequencia: 'diaria',
        colunas: [
            { titulo: 'Colaborador Inspecionado', tipo: 'COLABORADOR', ordem: 1, obrigatorio: true },
            { titulo: 'Uniforme limpo e adequado?', tipo: 'BOOLEAN', ordem: 2, obrigatorio: true },
            { titulo: 'Unhas cortadas e sem esmalte?', tipo: 'BOOLEAN', ordem: 3, obrigatorio: true },
            { titulo: 'Sem adornos (anéis, brincos, relógio)?', tipo: 'BOOLEAN', ordem: 4, obrigatorio: true },
            { titulo: 'Cabelo preso e protegido (touca/rede)?', tipo: 'BOOLEAN', ordem: 5, obrigatorio: true },
            { titulo: 'Barba feita ou protegida?', tipo: 'BOOLEAN', ordem: 6, obrigatorio: true },
            { titulo: 'Mãos lavadas e higienizadas?', tipo: 'BOOLEAN', ordem: 7, obrigatorio: true },
            { titulo: 'Resultado Geral', tipo: 'SELECT', ordem: 8, obrigatorio: true, opcoes: ['Conforme', 'Não Conforme'] },
            { titulo: 'Responsável pela Verificação', tipo: 'COLABORADOR', ordem: 9, obrigatorio: true },
            { titulo: 'Ação Corretiva', tipo: 'ACAO_CORRETIVA', ordem: 10, obrigatorio: false },
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
    console.log('\n🎉 Seed de Manipuladores concluído!');
}

run().catch(e => { console.error(e); process.exit(1); });
