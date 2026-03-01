-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.acoes_corretivas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  origem_checklist_resposta_id uuid,
  unidade_id uuid NOT NULL,
  descricao_desvio text NOT NULL,
  acao_imediata text NOT NULL,
  status text DEFAULT 'PENDENTE'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT acoes_corretivas_pkey PRIMARY KEY (id),
  CONSTRAINT acoes_corretivas_origem_checklist_resposta_id_fkey FOREIGN KEY (origem_checklist_resposta_id) REFERENCES public.checklist_respostas(id),
  CONSTRAINT acoes_corretivas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id)
);
CREATE TABLE public.anvisa_aditivos (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  ins text NOT NULL UNIQUE,
  nome text NOT NULL,
  funcao_principal text,
  CONSTRAINT anvisa_aditivos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_alegacoes_criterios (
  id integer NOT NULL DEFAULT nextval('anvisa_alegacoes_criterios_id_seq'::regclass),
  nutriente text NOT NULL,
  atributo text NOT NULL,
  termo_declaracao text NOT NULL,
  base_calculo text NOT NULL CHECK (base_calculo = ANY (ARRAY['PORCAO'::text, '100G'::text, 'PORCAO_50G'::text])),
  condicao text NOT NULL CHECK (condicao = ANY (ARRAY['GTE'::text, 'LTE'::text])),
  tipo_valor text NOT NULL DEFAULT 'VDR_PERC'::text CHECK (tipo_valor = ANY (ARRAY['VDR_PERC'::text, 'UNIDADE'::text])),
  valor numeric NOT NULL,
  CONSTRAINT anvisa_alegacoes_criterios_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_alergenicos (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  nome text NOT NULL UNIQUE,
  CONSTRAINT anvisa_alergenicos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_categorias (
  id integer NOT NULL DEFAULT nextval('anvisa_categorias_id_seq'::regclass),
  grupo_anvisa text NOT NULL,
  nome_produto text NOT NULL UNIQUE,
  porcao_referencia_g_ml numeric NOT NULL,
  medida_caseira_sugerida text NOT NULL,
  tipo_calculo text NOT NULL DEFAULT 'TAL_COMO_EXPOSTO'::text,
  CONSTRAINT anvisa_categorias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_funcoes_aditivos (
  id integer NOT NULL DEFAULT nextval('anvisa_funcoes_aditivos_id_seq'::regclass),
  nome text NOT NULL UNIQUE,
  CONSTRAINT anvisa_funcoes_aditivos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_grupos_populacionais (
  id text NOT NULL,
  nome text NOT NULL,
  descricao text,
  base_legal text,
  CONSTRAINT anvisa_grupos_populacionais_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_limites_lupa (
  nutriente text NOT NULL,
  limite_solido_g numeric NOT NULL,
  limite_liquido_g numeric NOT NULL,
  CONSTRAINT anvisa_limites_lupa_pkey PRIMARY KEY (nutriente)
);
CREATE TABLE public.anvisa_medidas_caseiras (
  id integer NOT NULL DEFAULT nextval('anvisa_medidas_caseiras_id_seq'::regclass),
  nome text NOT NULL UNIQUE,
  capacidade_ml numeric NOT NULL,
  nome_singular text,
  CONSTRAINT anvisa_medidas_caseiras_pkey PRIMARY KEY (id)
);
CREATE TABLE public.anvisa_regras_tabela (
  constituinte text NOT NULL,
  unidade text NOT NULL,
  limite_nao_significativo numeric,
  expressao_nao_significativa text,
  regra_arr_menor_1 numeric,
  regra_arr_menor_10 numeric,
  regra_arr_maior_10 numeric,
  CONSTRAINT anvisa_regras_tabela_pkey PRIMARY KEY (constituinte)
);
CREATE TABLE public.anvisa_vdr (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  constituinte text NOT NULL,
  grupo_id text NOT NULL,
  valor numeric,
  unidade text NOT NULL,
  CONSTRAINT anvisa_vdr_pkey PRIMARY KEY (id),
  CONSTRAINT anvisa_vdr_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.anvisa_grupos_populacionais(id)
);
CREATE TABLE public.app_notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  link_acao text,
  lida boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_notificacoes_pkey PRIMARY KEY (id),
  CONSTRAINT app_notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);
CREATE TABLE public.app_permissions (
  slug text NOT NULL,
  descricao text NOT NULL,
  modulo text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_permissions_pkey PRIMARY KEY (slug)
);
CREATE TABLE public.app_role_permissions (
  role_id uuid NOT NULL,
  permission_slug text NOT NULL,
  CONSTRAINT app_role_permissions_pkey PRIMARY KEY (role_id, permission_slug),
  CONSTRAINT app_role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.app_roles(id),
  CONSTRAINT app_role_permissions_permission_slug_fkey FOREIGN KEY (permission_slug) REFERENCES public.app_permissions(slug)
);
CREATE TABLE public.app_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  nome text NOT NULL,
  descricao text,
  is_system_role boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_roles_pkey PRIMARY KEY (id),
  CONSTRAINT app_roles_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.app_user_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  role_id uuid NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT app_user_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT app_user_memberships_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id),
  CONSTRAINT app_user_memberships_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT app_user_memberships_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.app_roles(id),
  CONSTRAINT app_user_memberships_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.audit_logs_gxp (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tabela_afetada text NOT NULL,
  registro_id text NOT NULL,
  operacao text NOT NULL CHECK (operacao = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
  usuario_id uuid DEFAULT auth.uid(),
  data_evento timestamp with time zone DEFAULT now(),
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip_origem text,
  justify_reason text,
  transaction_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT audit_logs_gxp_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid,
  acao text NOT NULL,
  tabela text NOT NULL,
  registro_id uuid,
  dados_antigos jsonb,
  dados_novos jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_sistema_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id)
);
CREATE TABLE public.checklist_auditorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  modelo_id uuid NOT NULL,
  status text DEFAULT 'EM_ANDAMENTO'::text,
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  responsavel_id uuid,
  pontuacao_obtida numeric,
  observacoes_gerais text,
  created_at timestamp with time zone DEFAULT now(),
  titulo text,
  CONSTRAINT checklist_auditorias_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_auditorias_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT checklist_auditorias_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.checklist_modelos(id),
  CONSTRAINT checklist_auditorias_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES auth.users(id)
);
CREATE TABLE public.checklist_execucoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  status text DEFAULT 'EM_ANDAMENTO'::text,
  responsavel_id uuid,
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  assinatura_eletronica_hash text,
  score_obtido numeric,
  CONSTRAINT checklist_execucoes_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_execucoes_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.checklist_modelos(id),
  CONSTRAINT checklist_execucoes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT checklist_execucoes_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES auth.users(id)
);
CREATE TABLE public.checklist_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL,
  texto_pergunta text NOT NULL,
  tipo_resposta text NOT NULL CHECK (tipo_resposta = ANY (ARRAY['CONFORME_NAOCONFORME'::text, 'TEMPERATURA'::text, 'NUMERO'::text, 'TEXTO'::text, 'FOTO'::text])),
  obrigatorio boolean DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  ajuda_texto text,
  norma_referencia_id integer,
  secao_id uuid,
  requer_foto boolean DEFAULT false,
  CONSTRAINT checklist_itens_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_itens_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.checklist_modelos(id),
  CONSTRAINT checklist_itens_norma_referencia_id_fkey FOREIGN KEY (norma_referencia_id) REFERENCES public.normas_sanitarias_parametros(id),
  CONSTRAINT checklist_itens_secao_id_fkey FOREIGN KEY (secao_id) REFERENCES public.checklist_secoes(id)
);
CREATE TABLE public.checklist_modelos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  frequencia_sugerida text,
  versao integer DEFAULT 1,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT checklist_modelos_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_modelos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.checklist_respostas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  valor_resposta text,
  conforme boolean,
  foto_evidencia_url text,
  observacao text,
  temperatura_coletada numeric,
  fotos_urls ARRAY DEFAULT '{}'::text[],
  auditoria_id uuid NOT NULL,
  nao_se_aplica boolean DEFAULT false,
  comentario text,
  resposta_valor text,
  CONSTRAINT checklist_respostas_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_respostas_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.checklist_itens(id),
  CONSTRAINT checklist_respostas_auditoria_id_fkey FOREIGN KEY (auditoria_id) REFERENCES public.checklist_auditorias(id)
);
CREATE TABLE public.checklist_secoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL,
  titulo text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_secoes_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_secoes_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.checklist_modelos(id)
);
CREATE TABLE public.cliente_categorias_produto (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cliente_categorias_produto_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_categorias_produto_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.cliente_locais_estoque (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_ambiente text CHECK (tipo_ambiente = ANY (ARRAY['CONGELADO'::text, 'REFRIGERADO'::text, 'SECO'::text, 'QUENTE'::text])),
  temp_alvo_min numeric,
  temp_alvo_max numeric,
  ativo boolean DEFAULT true,
  cliente_id uuid,
  CONSTRAINT cliente_locais_estoque_pkey PRIMARY KEY (id),
  CONSTRAINT locais_estoque_unidade_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT cliente_locais_estoque_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.cliente_setores_producao (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  nome character varying NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cliente_setores_producao_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_setores_producao_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.cliente_unidades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  nome_unidade text NOT NULL,
  cnpj_completo text,
  cnae_principal text,
  endereco_completo text,
  responsavel_tecnico_nome text,
  responsavel_tecnico_registro text,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cliente_unidades_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_unidades_cliente_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj_raiz text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.colaboradores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  nome_completo text NOT NULL,
  funcao text NOT NULL,
  data_admissao date,
  aso_validade date,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT colaboradores_pkey PRIMARY KEY (id),
  CONSTRAINT colaboradores_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cnpj text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.composicao_receitas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  receita_id uuid NOT NULL,
  item_id uuid NOT NULL,
  item_type text DEFAULT 'ingrediente'::text,
  peso_bruto_g numeric NOT NULL DEFAULT 0,
  peso_liquido_g numeric NOT NULL DEFAULT 0,
  medida_caseira text,
  ordem integer DEFAULT 0,
  CONSTRAINT composicao_receitas_pkey PRIMARY KEY (id),
  CONSTRAINT composicao_receitas_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id)
);
CREATE TABLE public.config_modelo_subtarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  modelo_id uuid,
  titulo text NOT NULL,
  ordem integer DEFAULT 0,
  CONSTRAINT config_modelo_subtarefas_pkey PRIMARY KEY (id),
  CONSTRAINT config_modelo_subtarefas_modelo_id_fkey FOREIGN KEY (modelo_id) REFERENCES public.config_modelos_demandas(id)
);
CREATE TABLE public.config_modelos_demandas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  titulo_padrao text NOT NULL,
  descricao_padrao text,
  tipo_padrao text DEFAULT 'AVULSA'::text,
  prioridade_padrao text DEFAULT 'MEDIA'::text,
  requer_evidencia_foto boolean DEFAULT false,
  responsavel_padrao_id uuid,
  notificar_usuarios_ids ARRAY DEFAULT '{}'::uuid[],
  created_at timestamp with time zone DEFAULT now(),
  frequencia text DEFAULT 'EVENTUAL'::text,
  CONSTRAINT config_modelos_demandas_pkey PRIMARY KEY (id),
  CONSTRAINT config_modelos_demandas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT config_modelos_demandas_responsavel_padrao_id_fkey FOREIGN KEY (responsavel_padrao_id) REFERENCES auth.users(id)
);
CREATE TABLE public.estoque_inspecoes_recebimento (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  fornecedor_id uuid NOT NULL,
  ingrediente_id uuid NOT NULL,
  nota_fiscal character varying NOT NULL,
  lote_fornecedor character varying NOT NULL,
  data_fabricacao date,
  data_validade date NOT NULL,
  data_recebimento timestamp with time zone NOT NULL DEFAULT now(),
  quantidade_recebida numeric NOT NULL,
  unidade_medida character varying NOT NULL,
  temperatura_veiculo numeric,
  temperatura_produto numeric,
  veiculo_limpo boolean DEFAULT false,
  embalagem_integra boolean DEFAULT false,
  status_aprovacao character varying DEFAULT 'EM_QUARENTENA'::character varying CHECK (status_aprovacao::text = ANY (ARRAY['APROVADO'::character varying, 'REJEITADO'::character varying, 'EM_QUARENTENA'::character varying, 'APROVADO_CONDICIONAL'::character varying]::text[])),
  motivo_rejeicao text,
  responsavel_recebimento_id uuid,
  assinatura_eletronica_hash character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estoque_inspecoes_recebimento_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_inspecoes_recebimento_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT estoque_inspecoes_recebimento_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id),
  CONSTRAINT estoque_inspecoes_recebimento_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id)
);
CREATE TABLE public.estoque_lotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  local_estoque_id uuid,
  ingrediente_id uuid NOT NULL,
  codigo_lote_fornecedor text NOT NULL,
  data_validade date,
  data_recebimento timestamp with time zone DEFAULT now(),
  quantidade_atual numeric NOT NULL CHECK (quantidade_atual >= 0::numeric),
  unidade_medida text NOT NULL,
  status_lote text DEFAULT 'ATIVO'::text,
  created_at timestamp with time zone DEFAULT now(),
  fornecedor_id uuid,
  is_lote_interno boolean DEFAULT false,
  categoria_produto text,
  marca text,
  nota_fiscal text,
  fornecedor text,
  temperatura_recebimento numeric,
  estado_produto text DEFAULT 'CONFORME'::text,
  local_armazenamento text,
  unidade_peso_embalagem text,
  cliente_id uuid,
  data_validade_original date,
  data_validade_atual date,
  qtd_embalagens numeric,
  peso_unitario_embalagem numeric,
  quantidade_inicial numeric,
  valor_unitario numeric,
  CONSTRAINT estoque_lotes_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_lotes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT estoque_lotes_local_estoque_id_fkey FOREIGN KEY (local_estoque_id) REFERENCES public.cliente_locais_estoque(id),
  CONSTRAINT estoque_lotes_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id),
  CONSTRAINT estoque_lotes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.estoque_movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL,
  tipo_movimento text NOT NULL,
  quantidade_movimentada numeric NOT NULL,
  quantidade_nova numeric NOT NULL,
  data_movimento timestamp with time zone DEFAULT now(),
  justificativa text,
  responsavel_id uuid,
  fornecedor_id uuid,
  CONSTRAINT estoque_movimentacoes_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_movimentacoes_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id),
  CONSTRAINT estoque_movimentacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.fornecedores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text NOT NULL,
  licenca_sanitaria_numero text,
  licenca_sanitaria_validade date,
  status_homologacao text DEFAULT 'PENDENTE'::text,
  contato_qualidade_nome text,
  contato_qualidade_email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fornecedores_pkey PRIMARY KEY (id),
  CONSTRAINT fornecedores_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.ingrediente_alergenicos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ingrediente_id uuid NOT NULL,
  anvisa_alergenico_id integer NOT NULL,
  nivel_contato character varying NOT NULL DEFAULT 'DIRETO'::character varying CHECK (nivel_contato::text = ANY (ARRAY['DIRETO'::character varying, 'TRACOS_CRUZADOS'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ingrediente_alergenicos_pkey PRIMARY KEY (id),
  CONSTRAINT ingrediente_alergenicos_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id),
  CONSTRAINT ingrediente_alergenicos_anvisa_alergenico_id_fkey FOREIGN KEY (anvisa_alergenico_id) REFERENCES public.anvisa_alergenicos(id)
);
CREATE TABLE public.ingredientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  nome text NOT NULL,
  energia_kcal numeric DEFAULT 0,
  proteina_g numeric DEFAULT 0,
  carboidrato_g numeric DEFAULT 0,
  lipideos_g numeric DEFAULT 0,
  sodio_mg numeric DEFAULT 0,
  alergenicos_ids ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  acucar_total_g numeric,
  acucar_adicionado_g numeric,
  lactose_g numeric,
  galactose_g numeric,
  amido_g numeric,
  poliois_totais_g numeric,
  eritritol_g numeric,
  xilitol_g numeric,
  sorbitol_g numeric,
  maltitol_g numeric,
  manitol_g numeric,
  gordura_mono_g numeric,
  gordura_poli_g numeric,
  colesterol_mg numeric,
  vitamina_k_mcg numeric,
  vitamina_b1_mg numeric,
  vitamina_b2_mg numeric,
  vitamina_b3_mg numeric,
  vitamina_b5_mg numeric,
  vitamina_b6_mg numeric,
  vitamina_b7_mcg numeric,
  vitamina_b9_mcg numeric,
  vitamina_b12_mcg numeric,
  magnesio_mg numeric,
  fosforo_mg numeric,
  potassio_mg numeric,
  zinco_mg numeric,
  cobre_mcg numeric,
  selenio_mcg numeric,
  iodo_mcg numeric,
  manganes_mg numeric,
  fluor_mg numeric,
  cromo_mcg numeric,
  molibdenio_mcg numeric,
  cloreto_mg numeric,
  fibra_alimentar_g numeric,
  gordura_saturada_g numeric,
  gordura_trans_g numeric,
  calcio_mg numeric,
  ferro_mg numeric,
  vitamina_a_mcg numeric,
  vitamina_d_mcg numeric,
  vitamina_e_mg numeric,
  vitamina_c_mg numeric,
  contem_gluten boolean DEFAULT false,
  declaracao_ingredientes_fornecedor text,
  funcao_aditivo text,
  ins_code text,
  fonte text,
  peso_unitario_g numeric,
  tipo_ingrediente text DEFAULT 'SIMPLES'::text,
  CONSTRAINT ingredientes_pkey PRIMARY KEY (id),
  CONSTRAINT ingredientes_cliente_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL,
  name text NOT NULL,
  quantity numeric DEFAULT 0,
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id)
);
CREATE TABLE public.iot_etiquetas_impressas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  ordem_producao_id uuid,
  impressora_mac_address character varying,
  template_utilizado character varying,
  zpl_payload text,
  qtd_impressa integer NOT NULL,
  qtd_utilizada integer,
  qtd_descartada integer,
  reconciliacao_fechada boolean DEFAULT false,
  usuario_id uuid,
  data_impressao timestamp with time zone DEFAULT now(),
  CONSTRAINT iot_etiquetas_impressas_pkey PRIMARY KEY (id),
  CONSTRAINT iot_etiquetas_impressas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT iot_etiquetas_impressas_ordem_producao_id_fkey FOREIGN KEY (ordem_producao_id) REFERENCES public.ordens_producao(id)
);
CREATE TABLE public.normas_sanitarias_parametros (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  categoria_processo text NOT NULL,
  item_monitorado text NOT NULL,
  temp_min numeric,
  temp_max numeric,
  tempo_max_minutos integer,
  base_legal text NOT NULL,
  criticalidade text DEFAULT 'CRITICO'::text,
  CONSTRAINT normas_sanitarias_parametros_pkey PRIMARY KEY (id)
);
CREATE TABLE public.operacao_comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarefa_id uuid,
  usuario_id uuid,
  texto text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT operacao_comentarios_pkey PRIMARY KEY (id),
  CONSTRAINT operacao_comentarios_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.profiles(id),
  CONSTRAINT operacao_comentarios_tarefa_id_fkey FOREIGN KEY (tarefa_id) REFERENCES public.operacao_tarefas(id)
);
CREATE TABLE public.operacao_subtarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tarefa_id uuid,
  titulo text NOT NULL,
  concluida boolean DEFAULT false,
  ordem integer DEFAULT 0,
  CONSTRAINT operacao_subtarefas_pkey PRIMARY KEY (id),
  CONSTRAINT operacao_subtarefas_tarefa_id_fkey FOREIGN KEY (tarefa_id) REFERENCES public.operacao_tarefas(id)
);
CREATE TABLE public.operacao_tarefas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  tipo text DEFAULT 'AVULSA'::text CHECK (tipo = ANY (ARRAY['POP'::text, 'MANUTENCAO'::text, 'PRODUCAO'::text, 'LIMPEZA'::text, 'AVULSA'::text])),
  status text DEFAULT 'A_FAZER'::text CHECK (status = ANY (ARRAY['A_FAZER'::text, 'EM_ANDAMENTO'::text, 'REVISAO'::text, 'CONCLUIDA'::text])),
  prioridade text DEFAULT 'MEDIA'::text CHECK (prioridade = ANY (ARRAY['BAIXA'::text, 'MEDIA'::text, 'ALTA'::text, 'CRITICA'::text])),
  responsavel_id uuid,
  criado_por uuid DEFAULT auth.uid(),
  notificar_usuarios ARRAY DEFAULT '{}'::uuid[],
  is_recorrente boolean DEFAULT false,
  cron_expressao text,
  requer_evidencia_foto boolean DEFAULT false,
  assinatura_obrigatoria_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  prazo_limite timestamp with time zone,
  concluida_em timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT operacao_tarefas_pkey PRIMARY KEY (id),
  CONSTRAINT operacao_tarefas_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.profiles(id),
  CONSTRAINT operacao_tarefas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT operacao_tarefas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT operacao_tarefas_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES auth.users(id),
  CONSTRAINT operacao_tarefas_assinatura_obrigatoria_id_fkey FOREIGN KEY (assinatura_obrigatoria_id) REFERENCES public.app_roles(id)
);
CREATE TABLE public.ordens_producao (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  receita_versao_id uuid NOT NULL,
  data_inicio_producao timestamp with time zone DEFAULT now(),
  data_fim_producao timestamp with time zone,
  qtd_produzida numeric NOT NULL,
  lote_interno text NOT NULL,
  data_validade date NOT NULL,
  responsavel_producao_id uuid,
  status text DEFAULT 'EM_ANDAMENTO'::text,
  cliente_id uuid,
  CONSTRAINT ordens_producao_pkey PRIMARY KEY (id),
  CONSTRAINT producao_registros_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT producao_registros_receita_versao_id_fkey FOREIGN KEY (receita_versao_id) REFERENCES public.receitas_versoes(id),
  CONSTRAINT producao_registros_responsavel_producao_id_fkey FOREIGN KEY (responsavel_producao_id) REFERENCES auth.users(id),
  CONSTRAINT fk_ordens_cliente FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.permissoes_usuario_unidade (
  usuario_id uuid NOT NULL,
  unidade_id uuid NOT NULL,
  nivel_acesso text CHECK (nivel_acesso = ANY (ARRAY['ADMIN_LOCAL'::text, 'OPERADOR'::text, 'AUDITOR'::text, 'NUTRICIONISTA'::text])),
  CONSTRAINT permissoes_usuario_unidade_pkey PRIMARY KEY (usuario_id, unidade_id),
  CONSTRAINT permissoes_usuario_unidade_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id),
  CONSTRAINT permissoes_usuario_unidade_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id)
);
CREATE TABLE public.producao_consumos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producao_id uuid NOT NULL,
  estoque_lote_id uuid NOT NULL,
  quantidade_utilizada numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT producao_consumos_pkey PRIMARY KEY (id),
  CONSTRAINT producao_consumos_producao_id_fkey FOREIGN KEY (producao_id) REFERENCES public.ordens_producao(id),
  CONSTRAINT producao_consumos_estoque_lote_id_fkey FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.producao_perdas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  ordem_producao_id uuid,
  estoque_lote_id uuid,
  quantidade_perdida numeric NOT NULL,
  motivo_perda character varying NOT NULL CHECK (motivo_perda::text = ANY (ARRAY['CONTAMINACAO'::character varying, 'PRAZO_VALIDADE'::character varying, 'QUEDA'::character varying, 'ERRO_PRODUCAO'::character varying, 'EQUIPAMENTO_FALHA'::character varying, 'OUTROS'::character varying]::text[])),
  descricao_detalhada text,
  custo_estimado numeric,
  responsavel_registro_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT producao_perdas_pkey PRIMARY KEY (id),
  CONSTRAINT producao_perdas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT producao_perdas_ordem_producao_id_fkey FOREIGN KEY (ordem_producao_id) REFERENCES public.ordens_producao(id),
  CONSTRAINT producao_perdas_estoque_lote_id_fkey FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  company_id uuid,
  role text NOT NULL CHECK (role = ANY (ARRAY['super_admin'::text, 'company_owner'::text, 'manager'::text, 'employee'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.receitas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  nome text NOT NULL,
  rendimento_total_g numeric NOT NULL DEFAULT 1000,
  peso_embalagem_g numeric NOT NULL DEFAULT 100,
  modo_preparo text,
  created_at timestamp with time zone DEFAULT now(),
  anvisa_categoria_id integer,
  grupo_populacional_id text DEFAULT 'GERAL'::text,
  tipo_receita_id uuid,
  status text DEFAULT 'RASCUNHO'::text,
  porcao_final_g_ml numeric,
  estado_alimento text DEFAULT 'solido'::text,
  medida_caseira_nome text,
  medida_caseira_peso_g numeric,
  risco_contaminacao_cruzada_ids ARRAY,
  area_painel_principal_cm2 numeric,
  foto_url text,
  versao_atual integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT receitas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_receitas_tipo_receita FOREIGN KEY (tipo_receita_id) REFERENCES public.tipos_receita(id),
  CONSTRAINT receitas_anvisa_categoria_id_fkey FOREIGN KEY (anvisa_categoria_id) REFERENCES public.anvisa_categorias(id),
  CONSTRAINT receitas_grupo_populacional_id_fkey FOREIGN KEY (grupo_populacional_id) REFERENCES public.anvisa_grupos_populacionais(id),
  CONSTRAINT receitas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.receitas_versoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receita_id uuid NOT NULL,
  versao integer NOT NULL,
  nome_snapshot text NOT NULL,
  modo_preparo_snapshot text,
  rendimento_snapshot numeric,
  composicao_snapshot jsonb NOT NULL,
  tabela_nutricional_snapshot jsonb,
  data_aprovacao timestamp with time zone DEFAULT now(),
  aprovado_por uuid,
  motivo_alteracao text,
  CONSTRAINT receitas_versoes_pkey PRIMARY KEY (id),
  CONSTRAINT receitas_versoes_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id),
  CONSTRAINT receitas_versoes_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)
);
CREATE TABLE public.regras_validade_sanitaria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  categoria_alimento text NOT NULL,
  descricao_regra text NOT NULL,
  temp_min numeric NOT NULL DEFAULT 0,
  temp_max numeric NOT NULL,
  tipo_embalagem text CHECK (tipo_embalagem = ANY (ARRAY['FECHADO'::text, 'ABERTO'::text, 'MANIPULADO'::text])),
  dias_validade integer NOT NULL DEFAULT 0,
  horas_validade integer DEFAULT 0,
  fonte_legal text NOT NULL,
  ambito text DEFAULT 'MUNICIPAL_SP'::text,
  prioridade integer DEFAULT 1,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT regras_validade_sanitaria_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tipos_receita (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  nome text NOT NULL,
  cliente_id uuid,
  CONSTRAINT tipos_receita_pkey PRIMARY KEY (id)
);
CREATE TABLE public.units (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.user_units (
  user_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  CONSTRAINT user_units_pkey PRIMARY KEY (user_id, unit_id),
  CONSTRAINT user_units_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_units_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id)
);