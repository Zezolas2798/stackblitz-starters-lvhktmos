-- Seed das Planilhas de Água (Bootstrapping)

DO $$ 
DECLARE
  v_modelo_1_id uuid := gen_random_uuid();
  v_modelo_2_id uuid := gen_random_uuid();
  v_modelo_3_id uuid := gen_random_uuid();
  v_modelo_4_id uuid := gen_random_uuid();
  v_modelo_5_id uuid := gen_random_uuid();
  v_modelo_6_id uuid := gen_random_uuid();
  v_modelo_7_id uuid := gen_random_uuid();
BEGIN

  -- 1. Controle da troca de elemento filtrante
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_1_id, 'Controle da troca de elemento filtrante', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio) VALUES
  (v_modelo_1_id, 1, 'Data da Troca', 'DATE', true),
  (v_modelo_1_id, 2, 'Equipamento/Filtro', 'TEXT', true),
  (v_modelo_1_id, 3, 'Motivo da Troca', 'TEXT', true),
  (v_modelo_1_id, 4, 'Próxima Troca', 'DATE', false),
  (v_modelo_1_id, 5, 'Plano de Ação', 'ACTION_PLAN', false),
  (v_modelo_1_id, 6, 'Observação', 'TEXT', false),
  (v_modelo_1_id, 7, 'Assinatura', 'SIGNATURE', true);

  -- 2. Controle de cloro residual livre (CRL) e pH do reservatório de água
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_2_id, 'Controle de cloro residual livre (CRL) e pH', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio, regras) VALUES
  (v_modelo_2_id, 1, 'Data/Hora', 'DATE', true, null),
  (v_modelo_2_id, 2, 'Nível de Cloro (mg/L)', 'NUMBER', true, '{"min": 0.2, "max": 2.0}'::jsonb),
  (v_modelo_2_id, 3, 'Nível de pH', 'NUMBER', true, '{"min": 6.0, "max": 9.0}'::jsonb),
  (v_modelo_2_id, 4, 'Temperatura da Água (°C)', 'NUMBER', true, null),
  (v_modelo_2_id, 5, 'Conformidade', 'CALCULATED', false, null),
  (v_modelo_2_id, 6, 'Observação', 'TEXT', false, null),
  (v_modelo_2_id, 7, 'Plano de Ação', 'ACTION_PLAN', false, null),
  (v_modelo_2_id, 8, 'Assinatura', 'SIGNATURE', true, null);

  -- 3. Higienização de reservatório de água
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_3_id, 'Higienização de reservatório de água', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio) VALUES
  (v_modelo_3_id, 1, 'Data da Limpeza', 'DATE', true),
  (v_modelo_3_id, 2, 'Reservatório', 'TEXT', true),
  (v_modelo_3_id, 3, 'Atendeu ao POP?', 'BOOLEAN', true),
  (v_modelo_3_id, 4, 'Empresa Terceirizada (CNPJ)', 'TEXT', false),
  (v_modelo_3_id, 5, 'Próxima Limpeza', 'DATE', true),
  (v_modelo_3_id, 6, 'Certificado (Anexo)', 'PHOTO', false),
  (v_modelo_3_id, 7, 'Observação', 'TEXT', false),
  (v_modelo_3_id, 8, 'Assinatura', 'SIGNATURE', true);

  -- 4. Monitoramento de potabilidade da água
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_4_id, 'Monitoramento de potabilidade da água', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio, opcoes) VALUES
  (v_modelo_4_id, 1, 'Data da Coleta', 'DATE', true, null),
  (v_modelo_4_id, 2, 'Laboratório', 'TEXT', true, null),
  (v_modelo_4_id, 3, 'Resultado PCA', 'SELECT', true, '["Ausente", "Presente"]'::jsonb),
  (v_modelo_4_id, 4, 'Coliformes Totais', 'SELECT', true, '["Ausente", "Presente"]'::jsonb),
  (v_modelo_4_id, 5, 'Coliformes Fecais', 'SELECT', true, '["Ausente", "Presente"]'::jsonb),
  (v_modelo_4_id, 6, 'Laudo (Anexo)', 'PHOTO', true, null),
  (v_modelo_4_id, 7, 'Resultado Final', 'CALCULATED', false, null),
  (v_modelo_4_id, 8, 'Observação', 'TEXT', false, null),
  (v_modelo_4_id, 9, 'Plano de Ação', 'ACTION_PLAN', false, null),
  (v_modelo_4_id, 10, 'Assinatura', 'SIGNATURE', true, null);

  -- 5. Controle de manutenção de sistemas de tratamento de água
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_5_id, 'Controle de manutenção de sistemas de tratamento', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio, opcoes) VALUES
  (v_modelo_5_id, 1, 'Data', 'DATE', true, null),
  (v_modelo_5_id, 2, 'Local/Setor', 'TEXT', true, null),
  (v_modelo_5_id, 3, 'Tipo de Manutenção', 'SELECT', true, '["Preventiva", "Corretiva"]'::jsonb),
  (v_modelo_5_id, 4, 'Descrição', 'TEXT', true, null),
  (v_modelo_5_id, 5, 'Próxima Data', 'DATE', true, null),
  (v_modelo_5_id, 6, 'Assinatura', 'SIGNATURE', true, null);

  -- 6. Responsáveis do sistema de controle de águas residuais
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_6_id, 'Responsáveis do sistema de controle de águas residuais', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio) VALUES
  (v_modelo_6_id, 1, 'Setor', 'TEXT', true),
  (v_modelo_6_id, 2, 'Responsável', 'TEXT', true),
  (v_modelo_6_id, 3, 'Frequência de Inspeções', 'TEXT', true),
  (v_modelo_6_id, 4, 'Assinatura', 'SIGNATURE', true);

  -- 7. Verificação de pontos de consumo de água
  INSERT INTO public.qual_planilha_modelos (id, titulo, descricao, categoria, icone)
  VALUES (v_modelo_7_id, 'Verificação de pontos de consumo de água', 'Gestão da Qualidade e Segurança dos Alimentos', 'Águas', 'Droplet');

  INSERT INTO public.qual_planilha_colunas (modelo_id, ordem, titulo, tipo, obrigatorio, opcoes) VALUES
  (v_modelo_7_id, 1, 'Local/Setor', 'TEXT', true, null),
  (v_modelo_7_id, 2, 'Condição visual', 'SELECT', true, '["Limpo", "Sujo", "Com Vazamento"]'::jsonb),
  (v_modelo_7_id, 3, 'Cloro residual (mg/L)', 'NUMBER', false, null),
  (v_modelo_7_id, 4, 'Nível de pH', 'NUMBER', false, null),
  (v_modelo_7_id, 5, 'Resultado', 'CALCULATED', false, null),
  (v_modelo_7_id, 6, 'Foto (Evidência)', 'PHOTO', false, null),
  (v_modelo_7_id, 7, 'Observação', 'TEXT', false, null),
  (v_modelo_7_id, 8, 'Plano de Ação', 'ACTION_PLAN', false, null),
  (v_modelo_7_id, 9, 'Assinatura', 'SIGNATURE', true, null);

END $$;
