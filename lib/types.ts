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
  ativo: boolean | null;
  created_at?: string | null;
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
  ativo: boolean;
  
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
  contato_qualidade_nome?: string | null;
  contato_qualidade_email?: string | null;
  contato_qualidade_telefone?: string | null;
  ativo: boolean;
  created_at?: string;
}

// ==============================================================================
// 3. NUTRIÇÃO & INGREDIENTES (PRESERVANDO LEGADO)
// ==============================================================================

export type TipoIngrediente = 'SIMPLES' | 'COMPOSTO' | 'ADITIVO';

export interface Ingrediente {
  id: string;
  cliente_id: string | null; 
  nome: string;
  tipo_ingrediente: TipoIngrediente;
  
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
  
  ingrediente?: Ingrediente;
  receita?: Receita;
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


