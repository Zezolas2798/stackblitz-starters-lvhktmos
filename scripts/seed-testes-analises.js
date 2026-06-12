const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres' });

const CATEGORIA = 'Testes e Análises';

const planilhas = [
    {
        titulo: 'Cronograma de análises laboratoriais',
        colunas: [
            { titulo: 'Data', tipo: 'DATE', ordem: 1, obrigatorio: true },
            { titulo: 'Produto', tipo: 'TEXT', ordem: 2, obrigatorio: true },
            { titulo: 'Código de análises', tipo: 'TEXT', ordem: 3, obrigatorio: false },
            { titulo: 'Meses previstos para análise', tipo: 'MULTI_SELECT', ordem: 4, obrigatorio: false, opcoes: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'] }
        ]
    },
    {
        titulo: 'Testes de alizarol',
        colunas: [
            { titulo: 'Data e Hora', tipo: 'DATETIME', ordem: 1, obrigatorio: true },
            { titulo: 'Galão (Identificação)', tipo: 'TEXT', ordem: 2, obrigatorio: true },
            { titulo: 'Densidade (g/ml)', tipo: 'NUMBER', ordem: 3, obrigatorio: false },
            { titulo: 'Temperatura (°C)', tipo: 'NUMBER', ordem: 4, obrigatorio: false },
            { titulo: 'Densidade real', tipo: 'NUMBER', ordem: 5, obrigatorio: false },
            { titulo: 'Aprovado?', tipo: 'SELECT', ordem: 6, obrigatorio: true, opcoes: ['Sim', 'Não'] },
            { titulo: 'Destino do produto', tipo: 'TEXT', ordem: 7, obrigatorio: false },
            { titulo: 'Observação e Plano de Ação', tipo: 'TEXTAREA', ordem: 8, obrigatorio: false }
        ]
    },
    {
        titulo: 'Testes de fosfatase',
        colunas: [
            { titulo: 'Data e Hora', tipo: 'DATETIME', ordem: 1, obrigatorio: true },
            { titulo: 'Galão (Identificação)', tipo: 'TEXT', ordem: 2, obrigatorio: true },
            { titulo: 'Densidade (g/ml)', tipo: 'NUMBER', ordem: 3, obrigatorio: false },
            { titulo: 'Temperatura (°C)', tipo: 'NUMBER', ordem: 4, obrigatorio: false },
            { titulo: 'Densidade real', tipo: 'NUMBER', ordem: 5, obrigatorio: false },
            { titulo: 'Fosfatase', tipo: 'TEXT', ordem: 6, obrigatorio: true },
            { titulo: 'Aprovado?', tipo: 'SELECT', ordem: 7, obrigatorio: true, opcoes: ['Sim', 'Não'] },
            { titulo: 'Destino do produto', tipo: 'TEXT', ordem: 8, obrigatorio: false },
            { titulo: 'Observação e Plano de Ação', tipo: 'TEXTAREA', ordem: 9, obrigatorio: false }
        ]
    }
];

async function run() {
    await client.connect();
    console.log('Conectado ao banco!');

    // Deletar as planilhas existentes dessa categoria para poder recriar
    await client.query(`DELETE FROM qual_planilha_modelos WHERE categoria = $1`, [CATEGORIA]);
    console.log('Modelos antigos removidos.');

    for (const p of planilhas) {
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
    console.log('\\n🎉 Seed de Testes e Análises concluído!');
}

run().catch(e => { console.error(e); process.exit(1); });
