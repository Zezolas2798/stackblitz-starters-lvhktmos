const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres'
});

const sql = `
-- 1. Inserir Modelos
INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone, ativo) VALUES
('e2b00000-0000-0000-0000-000000000001', 'Controle de calibração de equipamentos', 'Registro de calibrações realizadas', 'Equipamentos', 'Settings', true),
('e2b00000-0000-0000-0000-000000000002', 'Controle de manutenção preventiva', 'Acompanhamento de manutenções programadas', 'Equipamentos', 'Wrench', true),
('e2b00000-0000-0000-0000-000000000003', 'Controle de troca de peças para equipamentos', 'Registro de substituição de peças e motivos', 'Equipamentos', 'Tool', true),
('e2b00000-0000-0000-0000-000000000004', 'Controle de verificação de termômetro', 'Aferição de termômetros contra padrão', 'Equipamentos', 'Thermometer', true),
('e2b00000-0000-0000-0000-000000000005', 'Inspeção periódica de equipamentos críticos', 'Inspeção de funcionamento e condições gerais', 'Equipamentos', 'Activity', true),
('e2b00000-0000-0000-0000-000000000006', 'Instrumentos de medição', 'Controle geral de instrumentos de medição', 'Equipamentos', 'Ruler', true)
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, ativo = true;

-- Limpar colunas antigas se houver
DELETE FROM public.qual_planilha_colunas WHERE modelo_id IN (
  'e2b00000-0000-0000-0000-000000000001',
  'e2b00000-0000-0000-0000-000000000002',
  'e2b00000-0000-0000-0000-000000000003',
  'e2b00000-0000-0000-0000-000000000004',
  'e2b00000-0000-0000-0000-000000000005',
  'e2b00000-0000-0000-0000-000000000006'
);

-- 2. Inserir Colunas

-- Controle de calibração de equipamentos
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 1, 'Equipamento / Instrumento', 'EQUIPAMENTO', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 2, 'Data da Calibração', 'DATE', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 3, 'Certificado / Anexo', 'FILE', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 4, 'Data da Próxima Calibração', 'DATE', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 5, 'Empresa/Responsável Técnico', 'TEXT', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 6, 'Situação', 'SELECT', '["Aprovado", "Reprovado", "Aprovado com restrições"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000001', 7, 'Ação Corretiva / Observações', 'TEXT', null, false);

-- Controle de manutenção preventiva
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 1, 'Equipamento', 'EQUIPAMENTO', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 2, 'Data da Manutenção', 'DATE', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 3, 'Tipo de Manutenção', 'SELECT', '["Preventiva", "Corretiva", "Preditiva"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 4, 'Descrição do Serviço / Peças Trocadas', 'TEXT', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 5, 'Empresa/Responsável', 'TEXT', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 6, 'Data da Próxima Manutenção', 'DATE', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000002', 7, 'Observações', 'TEXT', null, false);

-- Controle de troca de peças para equipamentos
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000003', 1, 'Equipamento', 'EQUIPAMENTO', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000003', 2, 'Peça Substituída', 'TEXT', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000003', 3, 'Motivo da Troca', 'SELECT', '["Desgaste natural", "Quebra acidental", "Defeito de fabricação", "Troca preventiva"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000003', 4, 'Data da Troca', 'DATE', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000003', 5, 'Responsável pela Troca', 'TEXT', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000003', 6, 'Observações', 'TEXT', null, false);

-- Controle de verificação de termômetro
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000004', 1, 'Identificação do Termômetro', 'EQUIPAMENTO', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000004', 2, 'Temperatura Padrão / Referência (°C)', 'NUMBER', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000004', 3, 'Temperatura Lida no Termômetro (°C)', 'NUMBER', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000004', 4, 'Situação (Desvio Aceitável?)', 'SELECT', '["Conforme", "Não Conforme"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000004', 5, 'Ação Corretiva', 'TEXT', null, false);

-- Inspeção periódica de equipamentos críticos
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000005', 1, 'Equipamento Crítico', 'EQUIPAMENTO', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000005', 2, 'Condição Geral e de Funcionamento', 'SELECT', '["Conforme", "Não Conforme"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000005', 3, 'Apresenta Ruído Anormal?', 'SELECT', '["Sim", "Não"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000005', 4, 'Apresenta Vazamento (óleo, água, etc.)?', 'SELECT', '["Sim", "Não"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000005', 5, 'Apresenta Vibração Anormal?', 'SELECT', '["Sim", "Não"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000005', 6, 'Ação Corretiva', 'TEXT', null, false);

-- Instrumentos de medição
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000006', 1, 'Instrumento de Medição', 'EQUIPAMENTO', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000006', 2, 'Condição de Limpeza e Conservação', 'SELECT', '["Conforme", "Não Conforme"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000006', 3, 'Leitura / Teste de Verificação', 'NUMBER', null, true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000006', 4, 'Foi necessário ajuste/tara?', 'SELECT', '["Sim", "Não"]', true),
(gen_random_uuid(), 'e2b00000-0000-0000-0000-000000000006', 5, 'Ação Corretiva', 'TEXT', null, false);
`;

async function seed() {
  try {
    await client.connect();
    console.log('Executando seed de Equipamentos...');
    await client.query(sql);
    console.log('Seed finalizado com sucesso!');
  } catch (error) {
    console.error('Erro no seed:', error);
  } finally {
    await client.end();
  }
}

seed();
