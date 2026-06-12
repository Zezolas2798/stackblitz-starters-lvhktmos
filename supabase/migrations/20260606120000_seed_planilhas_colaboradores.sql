-- Migration para inserir modelos, colunas e configurações para a categoria "Colaboradores"

-- 1. Inserir Modelos
INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone, ativo) VALUES
('b1a00000-0000-0000-0000-000000000001', 'Controle de férias', 'Registro e controle de férias dos colaboradores', 'Colaboradores', 'Calendar', true),
('b1a00000-0000-0000-0000-000000000002', 'Controle de jornada extraordinária', 'Registro de horas extras e justificativas', 'Colaboradores', 'Clock', true),
('b1a00000-0000-0000-0000-000000000003', 'Controle de licenças', 'Acompanhamento de atestados e afastamentos, incluindo DTA', 'Colaboradores', 'Thermometer', true),
('b1a00000-0000-0000-0000-000000000004', 'Programação diária de atividades', 'Planejamento semanal/diário de tarefas por colaborador', 'Colaboradores', 'ClipboardList', true),
('b1a00000-0000-0000-0000-000000000005', 'Registro de reclamações internas', 'Registro e tratativa de reclamações entre setores', 'Colaboradores', 'AlertCircle', true);

-- 2. Inserir Colunas

-- Controle de férias
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 1, 'Colaborador', 'COLABORADOR', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 2, 'Período Aquisitivo', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 3, 'Data de Início', 'DATE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 4, 'Data de Retorno', 'DATE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 5, 'Assinatura do Colaborador', 'SIGNATURE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 6, 'Assinatura do Gestor', 'SIGNATURE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000001', 7, 'Observações', 'TEXT', null, false);

-- Controle de jornada extraordinária
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 1, 'Colaborador', 'COLABORADOR', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 2, 'Data da Jornada', 'DATE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 3, 'Hora de Início', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 4, 'Hora de Término', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 5, 'Motivo / Justificativa', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 6, 'Assinatura do Colaborador', 'SIGNATURE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000002', 7, 'Assinatura do Gestor', 'SIGNATURE', null, true);

-- Controle de licenças
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 1, 'Colaborador', 'COLABORADOR', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 2, 'Tipo de Licença', 'SELECT', '["Médica", "Maternidade", "Paternidade", "Óbito", "Casamento", "Doença Grave", "Decisão Judicial", "Acompanhamento de Familiar Doente", "Eleitoral", "Exercício de Mandato Classista", "Força Maior", "Luto", "Motivos Familiares", "Motivo de Morte na Família", "Não Remunerada", "Participação em Treinamentos ou Cursos", "Por Acidente de Trabalho", "Transferência de Local", "Questões Religiosas", "Serviço Militar", "Prêmio", "Remunerada", "Sabática", "Tratamento de Saúde", "Viagem Prolongada", "Voluntária", "Outros"]', true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 3, 'Doença Transmissível por Alimentos (DTA)?', 'SELECT', '["Sim", "Não", "Não se aplica"]', true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 4, 'Data de Início do Afastamento', 'DATE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 5, 'Data de Retorno Prevista', 'DATE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 6, 'Atestado / Comprovante Entregue?', 'SELECT', '["Sim", "Não"]', true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000003', 7, 'Observações', 'TEXT', null, false);

-- Programação diária de atividades
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 1, 'Colaborador', 'COLABORADOR', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 2, 'Semana Referência', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 3, 'Segunda-feira', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 4, 'Terça-feira', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 5, 'Quarta-feira', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 6, 'Quinta-feira', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 7, 'Sexta-feira', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 8, 'Sábado', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 9, 'Domingo', 'TEXT', null, false),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000004', 10, 'Visto do Supervisor', 'SIGNATURE', null, true);

-- Registro de reclamações internas
INSERT INTO public.qual_planilha_colunas (id, modelo_id, ordem, titulo, tipo, opcoes, obrigatorio) VALUES
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 1, 'Data do Registro', 'DATE', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 2, 'Setor Envolvido', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 3, 'Descrição da Reclamação / Ocorrência', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 4, 'Ação Corretiva Imediata Tomada', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 5, 'Responsável pela Ação', 'TEXT', null, true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 6, 'Status da Resolução', 'SELECT', '["Em Aberto", "Em Andamento", "Resolvido"]', true),
(gen_random_uuid(), 'b1a00000-0000-0000-0000-000000000005', 7, 'Visto do Responsável Técnico', 'SIGNATURE', null, true);


