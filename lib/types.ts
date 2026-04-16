// lib/types.ts
// ARQUITETURA HÍBRIDA: GxP (Compliance) + NUTRIÇÃO (Legacy)
// Versão Atualizada: Suporte a Fornecedores, Versionamento e Rastreabilidade

// ==============================================================================
// 1. ESTRUTURA CORPORATIVA & SEGURANÇA (SCHEMA V2)
// ==============================================================================

export type UserRole = 'ADMIN_LOCAL' | 'OPERADOR' | 'AUDITOR' | 'NUTRICIONISTA';

export interface Cliente {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj_raiz: string;
  logo_url?: string | null;
  ativo: boolean | null;
  created_at?: string | null;
}

export interface AppModulo {
  slug: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

export interface ClienteModulo {
  id: string;
  cliente_id: string;
  modulo_slug: string;
  ativo: boolean;
  app_modulos?: AppModulo;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_id: string | null;
  role: string | null;
  cpf?: string | null;
  registro_profissional?: string | null;
  created_at?: string | null;
}


// ==============================================================================
// 8. FICHAS TÉCNICAS E CARDÁPIOS UAN (NOVO MÓDULO LOGÍSTICO)
// ==============================================================================

export type CategoriaUAN = 'Prato Base' | 'Prato Principal' | 'Alternativa' | 'Opção Vegetariana' | 'Guarnição' | 'Saladas' | 'Bebidas' | 'Complemento' | 'Sopa' | 'Bebida Quente' | 'Bebida Fria' | 'Base' | 'Recheio' | 'Sobremesa';

export interface FichaTecnicaUAN {
  id: string;
  cliente_id: string;
  nome: string;
  categoria_uan: CategoriaUAN | string;
  rendimento_porcoes: number;
  peso_porcao_g: number;
  modo_preparo: string | null;
  tempo_preparo_min: number | null;
  refeicoes?: string[];
  created_at?: string;
  updated_at?: string;
  
  // Relacionamentos Injetados via JOIN
  composicao?: ComposicaoFichaUAN[];
}

export interface ComposicaoFichaUAN {
  id: string;
  ficha_uan_id: string;
  ingrediente_id: string;
  referencia_id?: string | null;
  peso_bruto_g: number;
  peso_liquido_g: number;
  fator_correcao: number;
  indice_coccao: number;
  
  // Relacionamento Injetado via JOIN
  ingrediente?: Ingrediente;
  referencia_nutricional?: ReferenciaNutricional;
}

export interface CardapioUAN {
  id: string;
  cliente_id: string;
  unidade_id: string;
  nome_ciclo: string;
  data_inicio: string;
  data_fim: string;
  dias_funcionamento?: number[] | null;
  refeicoes_oferecidas?: string[] | null;
  status: 'Rascunho' | 'Em Planejamento' | 'Aprovado' | 'Enviado para Compras' | 'Em Execução';
  comensais_estimados_dia: number;
  comensais_modelo?: Record<string, Record<string, number>> | null;
  config_excecoes_dias?: Record<string, { funciona?: boolean, comensais?: Record<string, number>, horarios?: Record<string, { inicio: string, fim: string }> }> | null;
  horario_refeicoes?: Record<string, { inicio: string; fim: string }>;
  setor_producao_id?: string | null;
  created_at?: string;
}

export interface CardapioDiaUAN {
  id: string;
  cardapio_id: string;
  data_consumo: string;
  tipo_refeicao: 'Almoço' | 'Jantar' | 'Ceia' | 'Café da Manhã' | string;
  ficha_uan_id: string;
  fator_multiplicador: number;
  
  // Relacionamento
  ficha_uan?: FichaTecnicaUAN;
}

export interface ListaCompraUAN {
  id: string;
  cardapio_id: string;
  data_geracao: string;
  status: 'Pendente' | 'Em Cotação' | 'Comprado';
  itens_json: any; // Armazena a lista plana calculada (JSON)
}

export interface ClienteUnidade {
  id: string;
  cliente_id: string;
  nome_unidade: string;
  cnpj_completo?: string | null;
  cnae_principal?: string | null;
  endereco_completo?: string | null;
  responsavel_tecnico_nome?: string | null;
  responsavel_tecnico_registro?: string | null;
  ativo: boolean | null;
  
  // Relação Virtual (Frontend Join)
  cliente?: Cliente;
}

export interface PermissaoUsuario {
  usuario_id: string;
  unidade_id: string;
  nivel_acesso: UserRole;
  
  // Relação Virtual
  unidade?: ClienteUnidade;
}

export interface AuditLog {
  id: string;
  tabela_afetada: string;
  registro_id: string;
  operacao: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SIGNATURE';
  usuario_id: string;
  data_evento: string;
  dados_anteriores?: any;
  dados_novos?: any;
  ip_origem?: string;
  user_agent?: string; // Adicionado para rastreabilidade técnica
  acao_detalhe?: string; // Adicionado para audit trail legível
}

// ==============================================================================
// 2. GESTÃO DE FORNECEDORES (NOVO MÓDULO GxP - Portaria 2619/11)
// ==============================================================================

export type StatusHomologacao = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'SUSPENSO';

export interface Fornecedor {
  id: string;
  cliente_id: string;
  razao_social: string;
  nome_fantasia?: string | null;
  cnpj: string;
  licenca_sanitaria_numero?: string | null; // Obrigatório para Compliance
  licenca_sanitaria_validade?: string | null; // Controle de vencimento
  status_homologacao: StatusHomologacao;
  categorias_fornecidas?: string[] | null;
  categorias_compras?: string[] | null; // Novo: Categorias de compras vinculadas
  contato_qualidade_nome?: string | null;
  contato_qualidade_email?: string | null;
  contato_qualidade_telefone?: string | null;
  ativo: boolean;
  
  // Logística UAN
  lead_time_dias?: number;
  frequencia_entrega?: string | null;
  
  // Portfólio Granular (Matriz de Kraljic)
  grupos_fornecidos?: string[]; // IDs de ingredientes_grupos
  itens_fornecidos?: string[];  // IDs de ingredientes

  created_at?: string;
}

export interface OrcamentoFornecedor {
  id: string;
  cliente_id: string;
  unidade_id: string;
  fornecedor_id: string;
  ingrediente_id: string;
  data_orcamento: string;
  is_embalagem: boolean;
  unidades_por_embalagem?: number | null;
  peso_volume_por_unidade?: number | null;
  preco_embalagem?: number | null;
  preco_por_kg_l: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  
  // Joins Front-end
  fornecedor?: Fornecedor;
  ingrediente?: Ingrediente;
}
// ==============================================================================
// 3. NUTRIÇÃO & INGREDIENTES (PRESERVANDO LEGADO)
// ==============================================================================

export type TipoIngrediente = 'SIMPLES' | 'COMPOSTO' | 'ADITIVO';

export interface ReferenciaNutricional {
  id: string;
  nome: string;
  fonte: string;
  codigo_externo: string | null;
  categoria: string | null;
  energia_kcal: number | null;
  proteina_g: number | null;
  lipideos_g: number | null;
  carboidrato_g: number | null;
  carboidrato_disponivel_g: number | null;
  fibra_alimentar_g: number | null;
  calcio_mg: number | null;
  magnesio_mg: number | null;
  ferro_mg: number | null;
  sodio_mg: number | null;
  potassio_mg: number | null;
  zinco_mg: number | null;
  vitamina_c_mg: number | null;
  colesterol_mg: number | null;
  gordura_saturada_g: number | null;
  gordura_monoinsaturada_g: number | null;
  gordura_poliinsaturada_g: number | null;
}

export interface Ingrediente {
  id: string;
  cliente_id: string | null; 
  nome: string;
  tipo_ingrediente: TipoIngrediente;
  
  referencia_id?: string | null;
  referencia_nutricional?: ReferenciaNutricional | null;

  declaracao_ingredientes_fornecedor: string | null;
  funcao_aditivo: string | null;
  ins_code: string | null;
  peso_unitario_g: number | null;
  fonte: string | null;
  
  alergenicos_ids: number[] | null; 
  contem_gluten: boolean;
  
  // Macronutrientes
  energia_kcal: number | null;
  carboidrato_g: number | null;
  acucar_total_g: number | null;
  acucar_adicionado_g: number | null;
  proteina_g: number | null;
  lipideos_g: number | null;
  gordura_saturada_g: number | null;
  gordura_trans_g: number | null;
  fibra_alimentar_g: number | null;
  sodio_mg: number | null;

  // Micronutrientes
  gordura_mono_g: number | null;
  gordura_poli_g: number | null;
  colesterol_mg: number | null;
  lactose_g: number | null;
  galactose_g: number | null;
  poliois_totais_g: number | null;
  eritritol_g: number | null;
  manitol_g: number | null;
  sorbitol_g: number | null;
  xilitol_g: number | null;
  maltitol_g: number | null;
  amido_g: number | null;

  vitamina_a_mcg: number | null;
  vitamina_d_mcg: number | null;
  vitamina_e_mg: number | null;
  vitamina_k_mcg: number | null;
  vitamina_c_mg: number | null;
  vitamina_b1_mg: number | null;
  vitamina_b2_mg: number | null;
  vitamina_b3_mg: number | null;
  vitamina_b5_mg: number | null;
  vitamina_b6_mg: number | null;
  vitamina_b7_mcg: number | null;
  vitamina_b9_mcg: number | null;
  vitamina_b12_mcg: number | null;
  categoria_produto_id: string | null;

  calcio_mg: number | null;
  cloreto_mg: number | null;
  cobre_mcg: number | null;
  cromo_mcg: number | null;
  ferro_mg: number | null;
  fluor_mg: number | null;
  fosforo_mg: number | null;
  iodo_mcg: number | null;
  magnesio_mg: number | null;
  manganes_mg: number | null;
  molibdenio_mcg: number | null;
  potassio_mg: number | null;
  selenio_mcg: number | null;
  zinco_mg: number | null;

  classificacao_nova: number | null; // NOVA: 1=In Natura, 2=Culinário, 3=Processado, 4=Ultraprocessado

  grupo_estoque_id?: string | null;
  grupo_estoque?: {
    id: string;
    nome: string;
  } | null;

  is_corante_artificial: boolean;
  is_corante_carmim: boolean;
  is_tartrazina?: boolean;
  is_aspartame?: boolean;
  is_sunset_yellow?: boolean;
  is_transgenico: boolean;
  especie_transgenica?: string | null;
  especie_doadora?: string | null;
  transgenicos?: { especie: string, doadora: string }[] | null;

  // Custo & Suprimentos UAN
  preco_ultima_compra?: number;
  estoque_minimo_kg?: number;
  tempo_minimo_compra_dias?: number;

  created_at?: string;
}

export type TipoMaterial = 'EMBALAGEM' | 'UTENSILIO' | 'UTENSILIOS' | 'MANUTENCAO' | 'LIMPEZA' | 'EPI_EPC' | 'UNIFORMES' | 'PRIMEIROS_SOCORROS' | 'OUTROS';

export interface Material {
  id: string;
  cliente_id: string;
  nome: string;
  tipo_material: TipoMaterial;
  unidade_medida: string;
  custo_medio: number;
  preco_ultima_compra: number;
  categoria_id?: string | null;
  marca?: string | null;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relação Virtual
  categoria?: {
    id: string;
    nome: string;
  } | null;
}

export interface AnvisaCategoria {
  id: number;
  grupo_anvisa: string;
  nome_produto: string;
  porcao_referencia_g_ml: number;
  medida_caseira_sugerida: string;
  tipo_calculo: 'TAL_COMO_EXPOSTO' | 'PRONTO_PARA_CONSUMO';
}

export interface AnvisaGrupoPopulacional {
  id: string;
  nome: string;
  descricao: string | null;
  base_legal: string | null;
}

export interface AnvisaAlergenico {
  id: number;
  nome: string;
}

export interface TipoReceita {
  id: string;
  cliente_id: string;
  nome: string;
  descricao?: string;
}

export interface PreparoProntoConsumo {
  adicionar: {
    ingrediente_id: string;
    quantidade_g: number;
  }[];
}

// ATUALIZADO: Suporte a Versionamento e Status
export interface Receita {
  id: string;
  cliente_id: string;
  nome: string;
  
  rendimento_total_g: number;
  peso_embalagem_g: number;
  porcao_final_g_ml: number;
  modo_preparo: string | null;
  foto_url: string | null;
  estado_alimento: 'solido' | 'liquido';
  
  // NOVOS CAMPOS (Compliance)
  status?: 'RASCUNHO' | 'EM_ANALISE' | 'APROVADA' | 'OBSOLETO';
  versao_atual?: number;
  
  categoria?: string;
  
  medida_caseira_nome: string | null; 
  medida_caseira_quantidade?: number | null;
  medida_caseira_peso_g: number | null; 
  
  anvisa_categoria_id: number | null;
  grupo_populacional_id: string | null;
  instrucoes_preparo_tabela: PreparoProntoConsumo | null;
  tipo_receita_id: string | null;
  risco_contaminacao_cruzada_ids: number[] | null; 
  area_painel_principal_cm2: number | null; 
  modo_conservacao: string | null;
  is_preparo?: boolean;
  rendimento_preparado_g?: number | null;
  is_sub_receita: boolean;
  instrucoes_preparo: string | null;
  is_isento_nutricional: boolean;
  tipo_isencao: string | null;
  
  custo_total_estimado?: number;
  custo_embalagem?: number;
  custo_mao_de_obra?: number;
  outros_custos?: number;

  anvisa_categorias?: AnvisaCategoria;
  composicao_receitas?: ComposicaoReceita[];
  
  created_at?: string;
  tempo_preparo_min?: number;
}

// NOVO: Interface para Versões Congeladas (Snapshot)
export interface ReceitaVersao {
  id: string;
  receita_id: string;
  versao: number;
  nome_snapshot: string;
  modo_preparo_snapshot: string | null;
  modo_conservacao_snapshot: string | null;
  rendimento_snapshot: number;
  composicao_snapshot: any; // JSONB
  tabela_nutricional_snapshot: any; // JSONB
  data_aprovacao: string;
  aprovado_por?: string;
  motivo_alteracao?: string;
}

export interface ComposicaoReceita {
  id: string;
  receita_id: string;
  item_id: string; 
  item_type: 'ingrediente' | 'receita';
  peso_bruto_g: number;
  peso_liquido_g: number;
  fator_correcao: number;
  indice_coccao: number;
  referencia_id?: string | null;
  is_preparation_only?: boolean;
  
  ingrediente?: Ingrediente;
  receita?: Receita;
  referencia_nutricional?: ReferenciaNutricional;
  ingredientes?: Ingrediente; // Legado
  receitas?: { nome: string }; // Legado
}

// ==============================================================================
// 4. RÓTULOS (ORIGINAL)
// ==============================================================================

export interface DeclaracoesObrigatorias {
  lista_ingredientes: string | null; 
  alergenicos: string | null;
  contem_gluten: boolean;
  contem_lactose: boolean;
  modo_conservacao?: string | null;
  colorido_artificialmente?: boolean;
  colorido_carmim?: boolean;
  alerta_gmo?: string | null;
  alerta_laxativo?: string | null;
  alerta_gluten?: string | null;
  alerta_lactose?: string | null;
  alertas_especificos?: string[];
  nota_preparo?: string | null;
  isIsento?: boolean;
  tipoIsencao?: string | null;
  instrucoes_preparo?: string | null;
  is_preparo?: boolean;
  denominacao_venda?: string | null;
  fabricado_em?: string | null;
  conteudo_liquido?: string | null;
}

export interface InfoPorcao {
  porcao_g_ml: number; 
  medida_caseira_nome: string | null; 
  medida_caseira_quantidade: number | null; 
  total_porcoes_embalagem: string;
}

export type NutrientesFormatados = Record<string, string | null>;
export type PercentuaisVD = Record<string, string | null>;

export interface LupasFrontais {
  alto_em_acucar_adicionado: boolean;
  alto_em_gordura_saturada: boolean;
  alto_em_sodio: boolean;
}

export interface ResultadoCalculo {
  infoPorcao: InfoPorcao;
  por100g: NutrientesFormatados;
  porPorcao: NutrientesFormatados;
  percentualVD: PercentuaisVD;
  percentualVD100g?: PercentuaisVD;
  porcaoContexto?: string;
  lupas: LupasFrontais;
  nutrientesCondicionais: string[];
  declaracoes: DeclaracoesObrigatorias; 
  alegacoes: string[]; 
}

// ==============================================================================
// 5. ESTOQUE & RASTREABILIDADE (ATUALIZADO PARA GxP)
// ==============================================================================

export interface LocalEstoque {
  id: string;
  unidade_id: string;
  nome: string;
  tipo_ambiente: 'CONGELADO' | 'REFRIGERADO' | 'SECO' | 'QUENTE';
  temp_alvo_min?: number;
  temp_alvo_max?: number;
  ativo: boolean;
}

export interface EstoqueLote {
  id: string;
  unidade_id: string;
  local_estoque_id?: string;
  ingrediente_id?: string | null;
  material_id?: string | null;
  
  // ATUALIZADO: Relação com Fornecedor Real
  fornecedor_id?: string | null;
  is_lote_interno?: boolean;
  codigo_lote_fornecedor: string;
  
  data_validade: string;
  data_recebimento?: string;
  
  quantidade_atual: number;
  unidade_medida: string;
  preco_unitario?: number | null;
  
  status_lote: 'ATIVO' | 'BLOQUEADO_QUALIDADE' | 'VENCIDO' | 'ESGOTADO';
  
  created_at?: string;
  
  // Joins
  ingrediente?: Ingrediente;
  material?: Material; // Join Novo (Materiais)
  local_estoque?: LocalEstoque;
  fornecedor?: Fornecedor; // Join Novo
}

export interface ProducaoRegistro {
  id: string;
  unidade_id: string;
  receita_versao_id: string;
  data_inicio_producao: string;
  qtd_produzida: number;
  lote_interno: string;
  data_validade: string;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  responsavel_producao_id?: string;
}

// ==============================================================================
// 6. QUALIDADE & CHECKLISTS
// ==============================================================================

export interface NormaSanitaria {
  id: number;
  categoria_processo: string;
  item_monitorado: string;
  temp_min?: number;
  temp_max?: number;
  tempo_max_minutos?: number;
  base_legal: string;
  criticalidade: 'CRITICO' | 'MAIOR' | 'MENOR';
}

export interface ChecklistModelo {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao?: string | null;
  frequencia_sugerida?: string | null;
  versao: number | null;
  ativo: boolean | null;
  created_at?: string | null;
  created_by?: string | null;
}

export interface ChecklistItem {
  id: string;
  modelo_id: string;
  texto_pergunta: string;
  tipo_resposta: 'CONFORME_NAOCONFORME' | 'TEXTO' | 'NUMERO' | 'TEMPERATURA' | 'FOTO';
  obrigatorio: boolean;
  ordem: number;
  ajuda_texto?: string;
  norma_referencia_id?: number;
  norma?: NormaSanitaria;
}

export interface ChecklistExecucao {
  id: string;
  modelo_id: string;
  unidade_id: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADO' | 'ASSINADO';
  responsavel_id: string;
  data_inicio: string;
  data_fim?: string;
  score_obtido?: number;
  assinatura_eletronica_hash?: string;
  modelo?: ChecklistModelo;
  unidade?: ClienteUnidade;
}

export interface AcaoCorretiva {
  id: string;
  unidade_id: string;
  descricao_desvio: string;
  acao_imediata: string;
  status: 'PENDENTE' | 'EM_ANALISE' | 'CONCLUIDO';
  prazo_conclusao?: string;
  responsavel_resolucao?: string;
  created_at: string;
}

// ==============================================================================
// 7. TIPOS AUXILIARES & ENUMS
// ==============================================================================

export type TarefaStatus = 'A_FAZER' | 'EM_ANDAMENTO' | 'REVISAO' | 'CONCLUIDA' | 'CANCELADA';
export type TarefaTipo = 'ROTINA' | 'CHECKLIST' | 'POP' | 'AVULSA' | 'LIMPEZA' | 'PRODUCAO';
export type TarefaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface OperacaoTarefa {
  id: string;
  cliente_id: string;
  titulo: string;
  descricao: string | null;
  status: TarefaStatus;
  tipo: TarefaTipo;
  prioridade: TarefaPrioridade;
  vencimento: string | null;
  prazo_limite: string | null;
  requer_evidencia_foto: boolean;
  responsavel_id: string | null;
  created_at: string;
  responsavel?: {
    full_name: string | null;
    email: string | null;
  };
  subtarefas?: any[];
}

export interface Role {
  id: string;
  nome: string;
  descricao: string | null;
  is_system_role: boolean | null;
  ativo?: boolean | null;
  cliente_id?: string | null;
  created_at?: string | null;
}


