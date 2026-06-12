/**
 * @domainspec taxonomia-materiais.EspecificacoesPorModalidade
 * @aspect domain
 *
 * Schemas Zod para validação de campos específicos por modalidade de material.
 * Cada schema corresponde a um Value Object documentado em docs/features/taxonomia-materiais/domain.md.
 *
 * Regulamentações cobertas:
 * - EMBALAGEM:           RDC 843/2024, IN 281/2024, PNRS
 * - LIMPEZA:             ABNT NBR 14725:2023 (FDS), RDC 59/2010
 * - EPI_EPC:             NR-6, Portaria MTE 11.437/2020
 * - UNIFORME:            RDC 216/2004 §4.6
 * - UTENSILIO:           RDC 216/2004 §4.1, RDC 854/2024
 * - MANUTENCAO:          RDC 216/2004 §4.1.2, NBR 5462
 * - PRIMEIROS_SOCORROS:  NR-7 (PCMSO), RDC 16/2013
 */

import * as z from 'zod';

// ─── EMBALAGEM ──────────────────────────────────────────────────────────────────

export const EspecificacoesEmbalagemSchema = z.object({
  material_base: z.enum(['PP', 'PE', 'PET', 'VIDRO', 'ALUMINIO', 'PAPEL', 'ISOPOR', 'OUTRO']),
  apropriado_alimentos: z.boolean(),
  capacidade: z.string().min(1, { message: 'Capacidade é obrigatória (ex: 500ml)' }),
  dimensoes: z.string().optional(),
  cor: z.string().optional(),
  sustentavel: z.boolean().optional(),
  reciclavel: z.boolean().optional(),
  temperatura_max_uso: z.number({ message: 'Temperatura máxima é obrigatória' }),
  certificado_contato_alimentos: z.string().min(1, { message: 'Certificado de contato com alimentos é obrigatório' }),
  tipo_fechamento: z.enum(['TAMPA_ROSCA', 'SELO', 'PRESS_CLIP', 'ENCAIXE', 'SEM_FECHAMENTO', 'OUTRO']).optional(),
});

export type EspecificacoesEmbalagem = z.infer<typeof EspecificacoesEmbalagemSchema>;

// ─── LIMPEZA ────────────────────────────────────────────────────────────────────

export const EspecificacoesLimpezaSchema = z.object({
  principio_ativo: z.string().min(1, { message: 'Princípio ativo é obrigatório' }),
  concentracao_principio_ativo: z.string().min(1, { message: 'Concentração é obrigatória (ex: 0,5%)' }),
  diluicao_recomendada: z.string().min(1, { message: 'Diluição é obrigatória (ex: 1:200)' }),
  tempo_contato_min: z.number().int().min(1, { message: 'Tempo de contato deve ser ao menos 1 minuto' }),
  registro_anvisa_ms: z.string().min(1, { message: 'Registro ANVISA/MS é obrigatório' }),
  fds_disponivel: z.boolean(),
  fds_url: z.string().optional(),
  classe_risco_ghs: z.enum([
    'CORROSIVO', 'IRRITANTE', 'TOXICO', 'INFLAMAVEL', 'OXIDANTE',
    'GAS_PRESSURIZADO', 'RISCO_SAUDE', 'RISCO_AMBIENTAL', 'NAO_CLASSIFICADO'
  ]),
  pictogramas_ghs: z.array(z.string()).optional(),
  frases_h: z.array(z.string()).optional(),
  frases_p: z.array(z.string()).optional(),
  superficies_compativeis: z.array(z.string()).optional(),
  pH: z.number().optional(),
  incompatibilidades: z.string().min(1, { message: 'Incompatibilidades é obrigatório' }),
});

export type EspecificacoesLimpeza = z.infer<typeof EspecificacoesLimpezaSchema>;

// ─── EPI / EPC ──────────────────────────────────────────────────────────────────

export const EspecificacoesEPISchema = z.object({
  numero_ca: z.string().min(1, { message: 'Número do CA é obrigatório (NR-6)' }),
  validade_ca: z.string().min(1, { message: 'Validade do CA é obrigatória' }),
  fabricante_importador: z.string().min(1, { message: 'Fabricante/Importador é obrigatório' }),
  tipo_epi: z.enum([
    'LUVA', 'BOTA', 'AVENTAL', 'OCULOS', 'PROTETOR_AURICULAR',
    'TOUCA', 'MASCARA', 'PROTETOR_FACIAL', 'MANGOTE', 'OUTRO'
  ]),
  tamanho: z.string().min(1, { message: 'Tamanho é obrigatório' }),
  material_composicao: z.string().optional(),
  nr_aplicavel: z.array(z.string()).optional(),
  riscos_protegidos: z.array(
    z.enum(['TERMICO', 'QUIMICO', 'MECANICO', 'BIOLOGICO', 'ELETRICO', 'ERGONOMICO'])
  ).optional(),
  lote_fabricacao: z.string().optional(),
  controle_individual: z.boolean(),
  descartavel: z.boolean().optional(),
  vida_util_dias: z.number().int().positive().optional(),
});

export type EspecificacoesEPI = z.infer<typeof EspecificacoesEPISchema>;

// ─── UNIFORME ───────────────────────────────────────────────────────────────────

export const EspecificacoesUniformeSchema = z.object({
  tipo_peca: z.enum([
    'DOLMA', 'CALCA', 'AVENTAL', 'TOUCA', 'SAPATO',
    'LUVA_TERMICA', 'CAMISETA', 'BERMUDA', 'OUTRO'
  ]),
  tamanho: z.string().min(1, { message: 'Tamanho é obrigatório' }),
  cor: z.string().min(1, { message: 'Cor é obrigatória (RDC 216 recomenda cor clara)' }),
  tecido_composicao: z.string().optional(),
  gramatura_gm2: z.number().positive().optional(),
  antiderrapante: z.boolean().optional(),
  impermeavel: z.boolean(),
  lavabilidade: z.enum(['MAQUINA_INDUSTRIAL', 'MAQUINA_DOMESTICA', 'MANUAL']).optional(),
  temperatura_lavagem_max: z.number().positive().optional(),
  vida_util_lavagens: z.number().int().positive().optional(),
  numero_ca: z.string().optional(),
});

export type EspecificacoesUniforme = z.infer<typeof EspecificacoesUniformeSchema>;

// ─── UTENSÍLIO ──────────────────────────────────────────────────────────────────

export const EspecificacoesUtensilioSchema = z.object({
  tipo_utensilio: z.enum([
    'TABUA_CORTE', 'FACA', 'PANELA', 'GN', 'FORMA',
    'ESPATULA', 'CONCHA', 'COLHER', 'BANDEJA', 'OUTRO'
  ]),
  material_base: z.enum([
    'INOX_304', 'INOX_316', 'POLIETILENO', 'POLIPROPILENO',
    'SILICONE', 'MADEIRA', 'VIDRO', 'ALUMINIO', 'OUTRO'
  ]),
  apropriado_alimentos: z.boolean(),
  cor_segregacao: z.enum(['VERMELHO', 'AZUL', 'VERDE', 'AMARELO', 'BRANCO', 'MARROM', 'NA']),
  termoresistencia_max_c: z.number().optional(),
  autoclavavel: z.boolean().optional(),
  vida_util_estimada: z.string().optional(),
  criterio_descarte: z.string().optional(),
  dimensoes: z.string().optional(),
});

export type EspecificacoesUtensilio = z.infer<typeof EspecificacoesUtensilioSchema>;

// ─── MANUTENÇÃO ─────────────────────────────────────────────────────────────────

export const EspecificacoesManutencaoSchema = z.object({
  tipo_item: z.enum(['PECA_REPOSICAO', 'FERRAMENTA', 'CONSUMIVEL', 'LUBRIFICANTE', 'OUTRO']),
  modelo_numero_serie: z.string().optional(),
  equipamento_compativel: z.array(z.string()).min(1, { message: 'Informe ao menos um equipamento compatível' }),
  especificacao_tecnica: z.string().optional(),
  grau_alimentar: z.boolean().optional(),
  criticidade: z.enum(['ALTA', 'MEDIA', 'BAIXA']).optional(),
  frequencia_troca: z.string().optional(),
});

export type EspecificacoesManutencao = z.infer<typeof EspecificacoesManutencaoSchema>;

// ─── PRIMEIROS SOCORROS ─────────────────────────────────────────────────────────

export const EspecificacoesPrimeirosSocorrosSchema = z.object({
  tipo_item: z.enum(['CURATIVO', 'ANTISSEPTICO', 'INSTRUMENTO', 'MEDICAMENTO_TOPICO', 'DESCARTAVEL', 'OUTRO']),
  registro_anvisa_ms: z.string().optional(),
  principio_ativo: z.string().optional(),
  esteril: z.boolean().optional(),
  descartavel: z.boolean(),
  quantidade_minima_kit: z.number().int().positive().optional(),
  frequencia_verificacao: z.enum(['MENSAL', 'TRIMESTRAL', 'SEMESTRAL']).optional(),
});

export type EspecificacoesPrimeirosSocorros = z.infer<typeof EspecificacoesPrimeirosSocorrosSchema>;

// ─── OUTROS (schema livre) ──────────────────────────────────────────────────────

export const EspecificacoesOutrosSchema = z.object({
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});

export type EspecificacoesOutros = z.infer<typeof EspecificacoesOutrosSchema>;

// ─── DISPATCHER ─────────────────────────────────────────────────────────────────

/** Mapa tipo_material → schema Zod */
const schemaMap: Record<string, z.ZodType> = {
  EMBALAGEM: EspecificacoesEmbalagemSchema,
  LIMPEZA: EspecificacoesLimpezaSchema,
  EPI_EPC: EspecificacoesEPISchema,
  UNIFORME: EspecificacoesUniformeSchema,
  UTENSILIO: EspecificacoesUtensilioSchema,
  MANUTENCAO: EspecificacoesManutencaoSchema,
  PRIMEIROS_SOCORROS: EspecificacoesPrimeirosSocorrosSchema,
  OUTROS: EspecificacoesOutrosSchema,
};

/**
 * Retorna o schema Zod correspondente ao tipo de material.
 * Se não encontrado, retorna o schema genérico OUTROS.
 */
export function getSchemaForModalidade(tipoMaterial: string): z.ZodType {
  return schemaMap[tipoMaterial] || EspecificacoesOutrosSchema;
}

/**
 * Valida um payload de especificações contra o schema da modalidade.
 * Retorna { success: true, data } ou { success: false, errors }.
 */
export function validateEspecificacoes(tipoMaterial: string, data: unknown) {
  const schema = getSchemaForModalidade(tipoMaterial);
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data, errors: null };
  }
  // Zod v4 usa result.error.issues
  const errors = result.error.issues.map((issue: any) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return { success: false as const, data: null, errors };
}

/**
 * Mapeamento categoriaPrincipal (UI) → tipo_material (DB).
 */
export const TIPO_MATERIAL_MAP: Record<string, string> = {
  EMBALAGENS: 'EMBALAGEM',
  LIMPEZA: 'LIMPEZA',
  MANUTENCAO: 'MANUTENCAO',
  UTENSILIOS: 'UTENSILIO',
  EPI_EPC: 'EPI_EPC',
  UNIFORMES: 'UNIFORME',
  PRIMEIROS_SOCORROS: 'PRIMEIROS_SOCORROS',
  OUTROS: 'OUTROS',
};

/**
 * Retorna os valores iniciais (defaults) para o formulário de especificações de uma modalidade.
 */
export function getDefaultsForModalidade(tipoMaterial: string): Record<string, any> {
  switch (tipoMaterial) {
    case 'EMBALAGEM':
      return {
        material_base: '', apropriado_alimentos: true, capacidade: '',
        dimensoes: '', cor: '', sustentavel: false, reciclavel: false,
        temperatura_max_uso: '', certificado_contato_alimentos: '',
        tipo_fechamento: '',
      };
    case 'LIMPEZA':
      return {
        principio_ativo: '', concentracao_principio_ativo: '', diluicao_recomendada: '',
        tempo_contato_min: '', registro_anvisa_ms: '', fds_disponivel: false,
        fds_url: '', classe_risco_ghs: '', pictogramas_ghs: [],
        frases_h: [], frases_p: [], superficies_compativeis: [],
        pH: '', incompatibilidades: '',
      };
    case 'EPI_EPC':
      return {
        numero_ca: '', validade_ca: '', fabricante_importador: '',
        tipo_epi: '', tamanho: '', material_composicao: '',
        nr_aplicavel: [], riscos_protegidos: [], lote_fabricacao: '',
        controle_individual: true, descartavel: false, vida_util_dias: '',
      };
    case 'UNIFORME':
      return {
        tipo_peca: '', tamanho: '', cor: '', tecido_composicao: '',
        gramatura_gm2: '', antiderrapante: false, impermeavel: false,
        lavabilidade: '', temperatura_lavagem_max: '', vida_util_lavagens: '',
        numero_ca: '',
      };
    case 'UTENSILIO':
      return {
        tipo_utensilio: '', material_base: '', apropriado_alimentos: true,
        cor_segregacao: '', termoresistencia_max_c: '', autoclavavel: false,
        vida_util_estimada: '', criterio_descarte: '', dimensoes: '',
      };
    case 'MANUTENCAO':
      return {
        tipo_item: '', modelo_numero_serie: '', equipamento_compativel: [],
        especificacao_tecnica: '', grau_alimentar: false,
        criticidade: '', frequencia_troca: '',
      };
    case 'PRIMEIROS_SOCORROS':
      return {
        tipo_item: '', registro_anvisa_ms: '', principio_ativo: '',
        esteril: false, descartavel: true, quantidade_minima_kit: '',
        frequencia_verificacao: '',
      };
    default:
      return { descricao: '', observacoes: '' };
  }
}

/**
 * Retorna o label humano por modalidade para exibição no UI.
 */
export const MODALIDADE_LABELS: Record<string, string> = {
  EMBALAGEM: 'Embalagem',
  LIMPEZA: 'Produto de Limpeza',
  EPI_EPC: 'EPI / EPC',
  UNIFORME: 'Uniforme',
  UTENSILIO: 'Utensílio',
  MANUTENCAO: 'Manutenção',
  PRIMEIROS_SOCORROS: 'Primeiros Socorros',
  OUTROS: 'Outros',
};
