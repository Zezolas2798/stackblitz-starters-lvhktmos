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
  is_artificial boolean DEFAULT false,
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
CREATE TABLE public.producao_apontamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ordem_producao_id uuid NOT NULL,
  lote_estoque_id uuid NOT NULL,
  quantidade_utilizada_g_ml numeric NOT NULL CHECK (quantidade_utilizada_g_ml > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT producao_apontamentos_pkey PRIMARY KEY (id),
  CONSTRAINT producao_apontamentos_ordem_producao_id_fkey FOREIGN KEY (ordem_producao_id) REFERENCES public.producao_ordens(id),
  CONSTRAINT producao_apontamentos_lote_estoque_id_fkey FOREIGN KEY (lote_estoque_id) REFERENCES public.estoque_lotes(id)
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
CREATE TABLE public.cardapio_dias_uan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cardapio_id uuid NOT NULL,
  data_consumo date NOT NULL,
  tipo_refeicao character varying NOT NULL,
  ficha_uan_id uuid NOT NULL,
  fator_multiplicador numeric DEFAULT 1,
  CONSTRAINT cardapio_dias_uan_pkey PRIMARY KEY (id),
  CONSTRAINT cardapio_dias_uan_cardapio_id_fkey FOREIGN KEY (cardapio_id) REFERENCES public.cardapios_uan(id),
  CONSTRAINT cardapio_dias_uan_ficha_uan_id_fkey FOREIGN KEY (ficha_uan_id) REFERENCES public.fichas_tecnicas_uan(id)
);
CREATE TABLE public.cardapios_uan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  nome_ciclo character varying NOT NULL,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  status character varying DEFAULT 'Rascunho'::character varying,
  comensais_estimados_dia integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  dias_funcionamento jsonb DEFAULT '[]'::jsonb,
  refeicoes_oferecidas jsonb DEFAULT '[]'::jsonb,
  comensais_modelo jsonb DEFAULT '{}'::jsonb,
  config_excecoes_dias jsonb DEFAULT '{}'::jsonb,
  horario_refeicoes jsonb,
  CONSTRAINT cardapios_uan_pkey PRIMARY KEY (id),
  CONSTRAINT cardapios_uan_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.categorias_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo = ANY (ARRAY['FORNECEDOR'::text, 'SERVICO'::text])),
  nome text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  ged_pasta_id uuid,
  documentos_obrigatorios jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT categorias_config_pkey PRIMARY KEY (id),
  CONSTRAINT categorias_config_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT categorias_config_ged_pasta_id_fkey FOREIGN KEY (ged_pasta_id) REFERENCES public.documentos_pastas(id)
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
  modalidade text,
  CONSTRAINT cliente_categorias_produto_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_categorias_produto_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.cliente_controle_temperatura (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  unidade_id uuid,
  local_id uuid,
  data date NOT NULL DEFAULT CURRENT_DATE,
  periodo text CHECK (periodo = ANY (ARRAY['MANHA'::text, 'TARDE'::text])),
  temp_equipamento numeric,
  temp_alimento numeric,
  status text NOT NULL DEFAULT 'LIGADO'::text CHECK (status = ANY (ARRAY['LIGADO'::text, 'DESLIGADO'::text, 'VAZIO'::text])),
  responsavel_id uuid DEFAULT auth.uid(),
  obs text,
  created_at timestamp with time zone DEFAULT now(),
  equipamento_id uuid,
  hora_afericao time without time zone,
  alimento text,
  produto_id uuid,
  receita_id uuid,
  CONSTRAINT cliente_controle_temperatura_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_controle_temperatura_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT cliente_controle_temperatura_local_id_fkey FOREIGN KEY (local_id) REFERENCES public.cliente_estoque_locais(id),
  CONSTRAINT cliente_controle_temperatura_equipamento_id_fkey FOREIGN KEY (equipamento_id) REFERENCES public.cliente_equipamentos_config(id),
  CONSTRAINT cliente_controle_temperatura_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES public.ingredientes(id),
  CONSTRAINT cliente_controle_temperatura_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id)
);
CREATE TABLE public.cliente_equipamentos_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  grupo text NOT NULL,
  nome text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  parent_id uuid,
  CONSTRAINT cliente_equipamentos_config_pkey PRIMARY KEY (id),
  CONSTRAINT cliente_equipamentos_config_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT cliente_equipamentos_config_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.cliente_equipamentos_config(id)
);
CREATE TABLE public.cliente_estoque_locais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_ambiente text CHECK (tipo_ambiente = ANY (ARRAY['CONGELADO'::text, 'REFRIGERADO'::text, 'SECO'::text, 'QUENTE'::text])),
  temp_alvo_min numeric,
  temp_alvo_max numeric,
  ativo boolean DEFAULT true,
  cliente_id uuid,
  categorias_permitidas ARRAY DEFAULT '{}'::text[],
  equipamento_config_id uuid,
  CONSTRAINT cliente_estoque_locais_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_locais_unidade_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT cliente_estoque_locais_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT cliente_estoque_locais_equipamento_config_id_fkey FOREIGN KEY (equipamento_config_id) REFERENCES public.cliente_equipamentos_config(id)
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
CREATE TABLE public.composicao_fichas_uan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ficha_uan_id uuid NOT NULL,
  ingrediente_id uuid NOT NULL,
  peso_bruto_g numeric NOT NULL,
  peso_liquido_g numeric NOT NULL,
  fator_correcao numeric NOT NULL DEFAULT 1,
  indice_coccao numeric NOT NULL DEFAULT 1,
  referencia_id uuid,
  CONSTRAINT composicao_fichas_uan_pkey PRIMARY KEY (id),
  CONSTRAINT composicao_fichas_uan_ficha_uan_id_fkey FOREIGN KEY (ficha_uan_id) REFERENCES public.fichas_tecnicas_uan(id),
  CONSTRAINT composicao_fichas_uan_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id),
  CONSTRAINT composicao_fichas_uan_referencia_id_fkey FOREIGN KEY (referencia_id) REFERENCES public.referencias_nutricionais(id)
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
CREATE TABLE public.documentos_arquivos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pasta_id uuid NOT NULL,
  nome_arquivo character varying NOT NULL,
  versao integer DEFAULT 1,
  url_storage character varying,
  tamanho_bytes bigint,
  data_emissao date,
  data_validade date,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  frequencia_verificacao character varying,
  CONSTRAINT documentos_arquivos_pkey PRIMARY KEY (id),
  CONSTRAINT documentos_arquivos_pasta_id_fkey FOREIGN KEY (pasta_id) REFERENCES public.documentos_pastas(id)
);
CREATE TABLE public.documentos_categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  nome character varying NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT documentos_categorias_pkey PRIMARY KEY (id),
  CONSTRAINT documentos_categorias_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.documentos_pastas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  categoria_id uuid,
  parent_id uuid,
  nome character varying NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT documentos_pastas_pkey PRIMARY KEY (id),
  CONSTRAINT documentos_pastas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.documentos_categorias(id),
  CONSTRAINT documentos_pastas_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.documentos_pastas(id)
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
CREATE TABLE public.estoque_inventario_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventario_id uuid NOT NULL,
  lote_id uuid NOT NULL,
  qtd_esperada_g numeric NOT NULL DEFAULT 0,
  qtd_conferida_g numeric DEFAULT 0,
  conferido boolean DEFAULT false,
  metodo text DEFAULT 'MANUAL'::text CHECK (metodo = ANY (ARRAY['MANUAL'::text, 'QR_CODE'::text])),
  divergencia_g numeric DEFAULT 0,
  ajuste_aplicado boolean DEFAULT false,
  conferido_em timestamp with time zone,
  conferido_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estoque_inventario_itens_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_inventario_itens_inventario_id_fkey FOREIGN KEY (inventario_id) REFERENCES public.estoque_inventarios(id),
  CONSTRAINT estoque_inventario_itens_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.estoque_lotes(id),
  CONSTRAINT estoque_inventario_itens_conferido_por_fkey FOREIGN KEY (conferido_por) REFERENCES auth.users(id)
);
CREATE TABLE public.estoque_inventarios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  cliente_id uuid NOT NULL,
  local_estoque_id uuid,
  responsavel_id uuid,
  responsavel_nome text,
  status text NOT NULL DEFAULT 'ABERTO'::text CHECK (status = ANY (ARRAY['ABERTO'::text, 'FINALIZADO'::text, 'CANCELADO'::text])),
  data_inicio timestamp with time zone NOT NULL DEFAULT now(),
  data_fim timestamp with time zone,
  total_esperado integer DEFAULT 0,
  total_conferido integer DEFAULT 0,
  total_divergencias integer DEFAULT 0,
  observacoes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT estoque_inventarios_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_inventarios_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT estoque_inventarios_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT estoque_inventarios_local_estoque_id_fkey FOREIGN KEY (local_estoque_id) REFERENCES public.cliente_estoque_locais(id),
  CONSTRAINT estoque_inventarios_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES auth.users(id)
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
  CONSTRAINT estoque_movimentacoes_lote_id_fkey FOREIGN KEY (lote_id) REFERENCES public.estoque_lotes(id),
  CONSTRAINT estoque_movimentacoes_estoque_lotes_fk FOREIGN KEY (lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.fichas_tecnicas_uan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  nome character varying NOT NULL,
  categoria_uan character varying NOT NULL,
  rendimento_porcoes integer NOT NULL DEFAULT 1,
  peso_porcao_g numeric NOT NULL,
  modo_preparo text,
  tempo_preparo_min integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT fichas_tecnicas_uan_pkey PRIMARY KEY (id),
  CONSTRAINT fichas_tecnicas_uan_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.fin_contas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  codigo text NOT NULL,
  nome text NOT NULL,
  tipo USER-DEFINED NOT NULL,
  subtipo_usar USER-DEFINED DEFAULT 'NAO_APLICAVEL'::fin_subtipo_usar,
  conta_pai_id uuid,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  comportamento_custo USER-DEFINED DEFAULT 'NAO_APLICAVEL'::fin_comportamento_custo,
  alocacao_custo USER-DEFINED DEFAULT 'NAO_APLICAVEL'::fin_alocacao_custo,
  CONSTRAINT fin_contas_pkey PRIMARY KEY (id),
  CONSTRAINT fin_contas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT fin_contas_conta_pai_id_fkey FOREIGN KEY (conta_pai_id) REFERENCES public.fin_contas(id)
);
CREATE TABLE public.fin_integracoes_delivery (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  unidade_id uuid,
  plataforma text NOT NULL DEFAULT 'OUTRO'::text CHECK (plataforma = ANY (ARRAY['IFOOD'::text, 'RAPPI'::text, 'UBER_EATS'::text, 'ANOTAAI'::text, '99FOOD'::text, 'OUTRO'::text])),
  nome_exibicao text NOT NULL DEFAULT 'Minha Plataforma'::text,
  client_id text,
  client_secret_encrypted text,
  merchant_id text,
  webhook_url text,
  taxa_mdr numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fin_integracoes_delivery_pkey PRIMARY KEY (id),
  CONSTRAINT fin_integracoes_delivery_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT fin_integracoes_delivery_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id)
);
CREATE TABLE public.fin_integracoes_pdv (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  unidade_id uuid,
  nome text NOT NULL DEFAULT 'Meu PDV'::text,
  tipo_pdv text NOT NULL DEFAULT 'OUTRO'::text CHECK (tipo_pdv = ANY (ARRAY['TOTVS'::text, 'STONE'::text, 'CIELO'::text, 'LINX'::text, 'OUTRO'::text])),
  api_endpoint text,
  api_key_encrypted text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fin_integracoes_pdv_pkey PRIMARY KEY (id),
  CONSTRAINT fin_integracoes_pdv_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT fin_integracoes_pdv_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id)
);
CREATE TABLE public.fin_lancamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transacao_id uuid NOT NULL,
  conta_id uuid NOT NULL,
  tipo_lancamento USER-DEFINED NOT NULL,
  valor numeric NOT NULL CHECK (valor > 0::numeric),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fin_lancamentos_pkey PRIMARY KEY (id),
  CONSTRAINT fin_lancamentos_transacao_id_fkey FOREIGN KEY (transacao_id) REFERENCES public.fin_transacoes(id),
  CONSTRAINT fin_lancamentos_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES public.fin_contas(id)
);
CREATE TABLE public.fin_transacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  descricao text NOT NULL,
  data_competencia date NOT NULL,
  data_pagamento date,
  origem_modulo USER-DEFINED NOT NULL DEFAULT 'MANUAL'::fin_modulo_origem,
  origem_id uuid,
  valor_total numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  data_vencimento date,
  comprovante_url text,
  nota_fiscal text,
  CONSTRAINT fin_transacoes_pkey PRIMARY KEY (id),
  CONSTRAINT fin_transacoes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT fin_transacoes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.fin_vendas_delivery (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  unidade_id uuid,
  integracao_id uuid NOT NULL,
  mes_ano date NOT NULL,
  receita_bruta numeric NOT NULL DEFAULT 0,
  taxa_plataforma numeric NOT NULL DEFAULT 0,
  repasse_liquido numeric NOT NULL DEFAULT 0,
  pedidos_total integer NOT NULL DEFAULT 0,
  ticket_medio numeric NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT 'MANUAL'::text CHECK (origem = ANY (ARRAY['API'::text, 'MANUAL'::text])),
  importado_em timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fin_vendas_delivery_pkey PRIMARY KEY (id),
  CONSTRAINT fin_vendas_delivery_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT fin_vendas_delivery_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT fin_vendas_delivery_integracao_id_fkey FOREIGN KEY (integracao_id) REFERENCES public.fin_integracoes_delivery(id)
);
CREATE TABLE public.fin_vendas_mensais (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  receita_id uuid NOT NULL,
  mes_ano date NOT NULL,
  quantidade_vendida numeric NOT NULL DEFAULT 0,
  preco_venda numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fin_vendas_mensais_pkey PRIMARY KEY (id),
  CONSTRAINT fin_vendas_mensais_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT fin_vendas_mensais_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id)
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
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  pasta_documentos_id uuid,
  endereco_completo text,
  telefone text,
  email text,
  cnae_principal text,
  cnaes_secundarios jsonb,
  situacao_cadastral text,
  categorias_compras ARRAY,
  tipo text DEFAULT 'FORNECEDOR'::text,
  lead_time_dias integer DEFAULT 0,
  frequencia_entrega character varying,
  CONSTRAINT fornecedores_pkey PRIMARY KEY (id),
  CONSTRAINT fornecedores_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT fornecedores_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT fornecedores_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT fornecedores_pasta_documentos_id_fkey FOREIGN KEY (pasta_documentos_id) REFERENCES public.documentos_pastas(id)
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
  peso_unitario_g numeric DEFAULT 1000,
  tipo_ingrediente text DEFAULT 'SIMPLES'::text,
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  categoria_produto_id uuid,
  grupo_estoque_id uuid,
  classificacao_nova smallint CHECK (classificacao_nova >= 1 AND classificacao_nova <= 4),
  preco_ultima_compra numeric DEFAULT 0,
  custo_medio numeric DEFAULT 0,
  is_corante_artificial boolean DEFAULT false,
  is_corante_carmim boolean DEFAULT false,
  is_transgenico boolean DEFAULT false,
  especie_transgenica character varying,
  estoque_minimo_kg numeric DEFAULT 0,
  tempo_minimo_compra_dias integer DEFAULT 0,
  referencia_nutricional_id uuid,
  referencia_id uuid,
  CONSTRAINT ingredientes_pkey PRIMARY KEY (id),
  CONSTRAINT ingredientes_cliente_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT ingredientes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT ingredientes_categoria_produto_id_fkey FOREIGN KEY (categoria_produto_id) REFERENCES public.cliente_categorias_produto(id),
  CONSTRAINT ingredientes_grupo_estoque_id_fkey FOREIGN KEY (grupo_estoque_id) REFERENCES public.ingredientes_grupos(id),
  CONSTRAINT ingredientes_referencia_nutricional_id_fkey FOREIGN KEY (referencia_nutricional_id) REFERENCES public.referencias_nutricionais(id),
  CONSTRAINT ingredientes_referencia_id_fkey FOREIGN KEY (referencia_id) REFERENCES public.referencias_nutricionais(id)
);
CREATE TABLE public.ingredientes_grupos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  nome text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  categoria_id uuid,
  CONSTRAINT ingredientes_grupos_pkey PRIMARY KEY (id),
  CONSTRAINT ingredientes_grupos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT ingredientes_grupos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.cliente_categorias_produto(id)
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
  CONSTRAINT iot_etiquetas_impressas_ordem_producao_id_fkey FOREIGN KEY (ordem_producao_id) REFERENCES public.producao_ordens(id)
);
CREATE TABLE public.listas_compras_uan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cardapio_id uuid NOT NULL,
  data_geracao timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status character varying DEFAULT 'Pendente'::character varying,
  itens_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT listas_compras_uan_pkey PRIMARY KEY (id),
  CONSTRAINT listas_compras_uan_cardapio_id_fkey FOREIGN KEY (cardapio_id) REFERENCES public.cardapios_uan(id)
);
CREATE TABLE public.estoque_lotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  ingrediente_id uuid,
  fornecedor_id uuid NOT NULL,
  numero_lote_fabricante text NOT NULL,
  nota_fiscal text,
  data_fabricacao date,
  data_validade_rotulo date,
  data_validade_interna date,
  quantidade_inicial_g_ml numeric NOT NULL CHECK (quantidade_inicial_g_ml > 0::numeric),
  quantidade_atual_g_ml numeric NOT NULL CHECK (quantidade_atual_g_ml >= 0::numeric),
  status USER-DEFINED DEFAULT 'QUARENTENA'::status_lote_estoque,
  created_at timestamp with time zone DEFAULT now(),
  registro_sif character varying,
  local_estoque_id uuid,
  categoria_produto text,
  deleted_at timestamp with time zone,
  temperatura_recebimento numeric,
  estado_produto text DEFAULT 'CONFORME'::text,
  qtd_embalagens numeric,
  peso_unitario_embalagem numeric,
  unidade_peso_embalagem text,
  observacoes text,
  valor_unitario numeric DEFAULT 0,
  valor_total numeric DEFAULT 0,
  cliente_id uuid,
  material_id uuid,
  financeiro_processado boolean DEFAULT false,
  data_vencimento_financeiro date,
  CONSTRAINT estoque_lotes_pkey PRIMARY KEY (id),
  CONSTRAINT estoque_lotes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT estoque_lotes_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id),
  CONSTRAINT estoque_lotes_fornecedor_id_fkey FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id),
  CONSTRAINT estoque_lotes_local_estoque_id_fkey FOREIGN KEY (local_estoque_id) REFERENCES public.cliente_estoque_locais(id),
  CONSTRAINT estoque_lotes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT estoque_lotes_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materiais(id)
);
CREATE TABLE public.producao_lotes_internos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  ordem_producao_id uuid NOT NULL UNIQUE,
  codigo_lote_interno text NOT NULL UNIQUE,
  data_fabricacao timestamp with time zone NOT NULL DEFAULT now(),
  data_validade timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT producao_lotes_internos_pkey PRIMARY KEY (id),
  CONSTRAINT producao_lotes_internos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT producao_lotes_internos_ordem_producao_id_fkey FOREIGN KEY (ordem_producao_id) REFERENCES public.producao_ordens(id)
);
CREATE TABLE public.materiais (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  nome text NOT NULL,
  tipo_material text NOT NULL CHECK (tipo_material = ANY (ARRAY['EMBALAGEM'::text, 'UTENSILIO'::text, 'MANUTENCAO'::text, 'LIMPEZA'::text, 'OUTROS'::text, 'EPI_EPC'::text, 'UNIFORME'::text, 'PRIMEIROS_SOCORROS'::text])),
  unidade_medida text NOT NULL,
  custo_medio numeric DEFAULT 0,
  preco_ultima_compra numeric DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  categoria_id uuid,
  ficha_tecnica jsonb,
  descricao_tecnica text,
  material_base text,
  dimensoes text,
  capacidade text,
  peso_unitario_g numeric,
  cor text,
  sustentavel boolean DEFAULT false,
  apropriado_alimentos boolean DEFAULT false,
  especificacoes_adicionais jsonb,
  marca text,
  CONSTRAINT materiais_pkey PRIMARY KEY (id),
  CONSTRAINT materiais_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT materiais_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.cliente_categorias_produto(id)
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
CREATE TABLE public.producao_ordens (
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
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT producao_ordens_pkey PRIMARY KEY (id),
  CONSTRAINT producao_registros_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT producao_registros_receita_versao_id_fkey FOREIGN KEY (receita_versao_id) REFERENCES public.receitas_versoes(id),
  CONSTRAINT producao_registros_responsavel_producao_id_fkey FOREIGN KEY (responsavel_producao_id) REFERENCES auth.users(id),
  CONSTRAINT fk_ordens_cliente FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT producao_ordens_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT producao_ordens_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
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
  CONSTRAINT producao_consumos_producao_id_fkey FOREIGN KEY (producao_id) REFERENCES public.producao_ordens(id),
  CONSTRAINT producao_consumos_estoque_lote_id_fkey FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id),
  CONSTRAINT producao_consumos_estoque_lotes_fk FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.producao_ordens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  codigo character varying NOT NULL,
  titulo character varying,
  status character varying NOT NULL DEFAULT 'PLANEJADA'::character varying,
  data_prevista date,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT producao_ordens_pkey PRIMARY KEY (id),
  CONSTRAINT producao_ordens_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT producao_ordens_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.producao_ordens_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ordem_id uuid NOT NULL,
  receita_id uuid NOT NULL,
  quantidade_planejada numeric NOT NULL CHECK (quantidade_planejada > 0::numeric),
  quantidade_produzida numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  setor_producao_id uuid,
  CONSTRAINT producao_ordens_itens_pkey PRIMARY KEY (id),
  CONSTRAINT producao_ordens_itens_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.producao_ordens(id),
  CONSTRAINT producao_ordens_itens_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id),
  CONSTRAINT producao_ordens_itens_setor_producao_id_fkey FOREIGN KEY (setor_producao_id) REFERENCES public.cliente_setores_producao(id)
);
CREATE TABLE public.producao_perdas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL,
  ordem_producao_id uuid,
  estoque_lote_id uuid,
  quantidade_perdida numeric NOT NULL,
  motivo_perda character varying NOT NULL,
  descricao_detalhada text,
  custo_estimado numeric,
  responsavel_registro_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  destino_id uuid,
  tipo_destino character varying,
  ingrediente_id uuid,
  item_ordem_id uuid,
  tipo_perda character varying,
  CONSTRAINT producao_perdas_pkey PRIMARY KEY (id),
  CONSTRAINT producao_perdas_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.cliente_unidades(id),
  CONSTRAINT producao_perdas_ordem_producao_id_fkey FOREIGN KEY (ordem_producao_id) REFERENCES public.producao_ordens(id),
  CONSTRAINT producao_perdas_estoque_lote_id_fkey FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id),
  CONSTRAINT producao_perdas_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id),
  CONSTRAINT producao_perdas_item_ordem_id_fkey FOREIGN KEY (item_ordem_id) REFERENCES public.producao_ordens_itens(id),
  CONSTRAINT producao_perdas_estoque_lotes_fk FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.producao_requisicoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ordem_id uuid NOT NULL,
  ingrediente_id uuid,
  qtd_necessaria_g numeric NOT NULL,
  qtd_separada_g numeric DEFAULT 0,
  status character varying NOT NULL DEFAULT 'PENDENTE'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  grupo_estoque_id uuid,
  CONSTRAINT producao_requisicoes_pkey PRIMARY KEY (id),
  CONSTRAINT producao_requisicoes_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.producao_ordens(id),
  CONSTRAINT producao_requisicoes_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.ingredientes(id),
  CONSTRAINT producao_requisicoes_grupo_estoque_id_fkey FOREIGN KEY (grupo_estoque_id) REFERENCES public.ingredientes_grupos(id)
);
CREATE TABLE public.producao_reservas_estoque (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  requisicao_id uuid NOT NULL,
  estoque_lote_id uuid NOT NULL,
  quantidade_reservada_g numeric NOT NULL CHECK (quantidade_reservada_g > 0::numeric),
  data_reserva timestamp with time zone DEFAULT now(),
  reservado_por uuid,
  status character varying NOT NULL DEFAULT 'RESERVADO'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT producao_reservas_estoque_pkey PRIMARY KEY (id),
  CONSTRAINT producao_reservas_estoque_requisicao_id_fkey FOREIGN KEY (requisicao_id) REFERENCES public.producao_requisicoes(id),
  CONSTRAINT producao_reservas_estoque_reservado_por_fkey FOREIGN KEY (reservado_por) REFERENCES auth.users(id),
  CONSTRAINT producao_reservas_estoque_estoque_lotes_fkey FOREIGN KEY (estoque_lote_id) REFERENCES public.estoque_lotes(id)
);
CREATE TABLE public.produtos_bombeiros (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  data_emissao date NOT NULL,
  data_validade date NOT NULL,
  status_sivisa text DEFAULT 'Aguardando Vistoria'::text CHECK (status_sivisa = ANY (ARRAY['Aprovado'::text, 'Aguardando Vistoria'::text, 'Exigência'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamp with time zone,
  CONSTRAINT produtos_bombeiros_pkey PRIMARY KEY (id),
  CONSTRAINT produtos_bombeiros_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT produtos_bombeiros_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
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
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  is_menu_item boolean DEFAULT false,
  modo_conservacao text,
  CONSTRAINT receitas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_receitas_tipo_receita FOREIGN KEY (tipo_receita_id) REFERENCES public.tipos_receita(id),
  CONSTRAINT receitas_anvisa_categoria_id_fkey FOREIGN KEY (anvisa_categoria_id) REFERENCES public.anvisa_categorias(id),
  CONSTRAINT receitas_grupo_populacional_id_fkey FOREIGN KEY (grupo_populacional_id) REFERENCES public.anvisa_grupos_populacionais(id),
  CONSTRAINT receitas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT receitas_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT receitas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
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
  modo_conservacao_snapshot text,
  CONSTRAINT receitas_versoes_pkey PRIMARY KEY (id),
  CONSTRAINT receitas_versoes_receita_id_fkey FOREIGN KEY (receita_id) REFERENCES public.receitas(id),
  CONSTRAINT receitas_versoes_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)
);
CREATE TABLE public.referencias_nutricionais (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  fonte text NOT NULL,
  codigo_externo text UNIQUE,
  categoria text,
  energia_kcal numeric DEFAULT 0,
  proteina_g numeric DEFAULT 0,
  lipideos_g numeric DEFAULT 0,
  carboidrato_g numeric DEFAULT 0,
  fibra_alimentar_g numeric DEFAULT 0,
  calcio_mg numeric DEFAULT 0,
  magnesio_mg numeric DEFAULT 0,
  ferro_mg numeric DEFAULT 0,
  sodio_mg numeric DEFAULT 0,
  potassio_mg numeric DEFAULT 0,
  zinco_mg numeric DEFAULT 0,
  vitamina_c_mg numeric DEFAULT 0,
  colesterol_mg numeric DEFAULT 0,
  gordura_saturada_g numeric DEFAULT 0,
  gordura_monoinsaturada_g numeric DEFAULT 0,
  gordura_poliinsaturada_g numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  carboidrato_disponivel_g numeric DEFAULT 0,
  CONSTRAINT referencias_nutricionais_pkey PRIMARY KEY (id)
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
