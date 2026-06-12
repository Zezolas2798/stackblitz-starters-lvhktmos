/**
 * Utilitários para parsing e matching de cotações de fornecedores.
 */

export interface CotacaoItemParsed {
  descricao_original: string;
  marca: string;
  unidade: string;
  quantidade_embalagem: number;
  peso_liquido_kg: number;
  preco_unitario: number;
  preco_por_kg: number;
  sugestao_subgrupo: string;
}

export interface CotacaoParsed {
  fornecedor_nome: string;
  fornecedor_cnpj: string | null;
  data_cotacao: string;
  itens: CotacaoItemParsed[];
}

/**
 * Calcula o preço normalizado por Kg/L.
 * Exemplo: CX 12 x 1kg por R$60 → R$5,00/Kg
 */
export function calcularPrecoPorKg(
  precoUnitario: number,
  pesoLiquidoKg: number,
  quantidadeEmbalagem: number = 1
): number {
  const pesoTotal = quantidadeEmbalagem * pesoLiquidoKg;
  if (pesoTotal <= 0) return 0;
  return Number((precoUnitario / pesoTotal).toFixed(4));
}

/**
 * Calcula a similaridade entre duas strings usando distância de Levenshtein normalizada.
 * Retorna valor de 0 a 1 (1 = idênticas).
 */
function similaridade(a: string, b: string): number {
  const sa = a.toLowerCase().trim();
  const sb = b.toLowerCase().trim();

  if (sa === sb) return 1;
  if (sa.length === 0 || sb.length === 0) return 0;

  const maxLen = Math.max(sa.length, sb.length);

  // Otimização: se uma string contém a outra, alta similaridade
  if (sa.includes(sb) || sb.includes(sa)) {
    return Math.min(sa.length, sb.length) / maxLen;
  }

  // Levenshtein simplificado
  const matrix: number[][] = [];
  for (let i = 0; i <= sa.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= sb.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= sa.length; i++) {
    for (let j = 1; j <= sb.length; j++) {
      const cost = sa[i - 1] === sb[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const dist = matrix[sa.length][sb.length];
  return 1 - dist / maxLen;
}

/**
 * Calcula score de matching usando múltiplas heurísticas:
 * - Similaridade textual (Levenshtein)
 * - Palavras-chave em comum
 * - Correspondência de subgrupo sugerido pela IA
 */
function calcularScore(
  descricaoFornecedor: string,
  sugestaoSubgrupo: string,
  ingredienteNome: string,
  subgrupoNome: string
): number {
  const desc = descricaoFornecedor.toLowerCase();
  const sugestao = sugestaoSubgrupo.toLowerCase();
  const ingNome = ingredienteNome.toLowerCase();
  const subNome = subgrupoNome.toLowerCase();

  // Score 1: Similaridade entre sugestão da IA e o nome do ingrediente
  const simSugestaoIng = similaridade(sugestao, ingNome);

  // Score 2: Similaridade entre sugestão da IA e o nome do subgrupo
  const simSugestaoSub = similaridade(sugestao, subNome);

  // Score 3: Palavras-chave da descrição presentes no nome do ingrediente
  const palavrasDesc = desc.split(/\s+/).filter((p) => p.length > 2);
  const matchPalavras =
    palavrasDesc.length > 0
      ? palavrasDesc.filter((p) => ingNome.includes(p) || subNome.includes(p)).length /
        palavrasDesc.length
      : 0;

  // Score 4: Similaridade direta descrição vs ingrediente
  const simDireta = similaridade(desc, ingNome);

  // Peso ponderado: prioriza a sugestão da IA + palavras-chave
  return simSugestaoIng * 0.35 + simSugestaoSub * 0.25 + matchPalavras * 0.25 + simDireta * 0.15;
}

export interface MatchResult {
  ingrediente_id: string;
  ingrediente_nome: string;
  subgrupo_id: string;
  subgrupo_nome: string;
  score: number;
}

/**
 * Encontra os melhores matches para um item da cotação entre os ingredientes cadastrados.
 * Retorna os top N matches ordenados por score decrescente.
 */
export function fuzzyMatchIngrediente(
  descricaoFornecedor: string,
  sugestaoSubgrupo: string,
  ingredientes: { id: string; nome: string; subgrupo_id: string }[],
  subgrupos: { id: string; nome: string }[],
  topN: number = 5
): MatchResult[] {
  const subgrupoMap = new Map(subgrupos.map((s) => [s.id, s.nome]));

  const scored = ingredientes
    .map((ing) => {
      const subNome = subgrupoMap.get(ing.subgrupo_id) || '';
      const score = calcularScore(descricaoFornecedor, sugestaoSubgrupo, ing.nome, subNome);
      return {
        ingrediente_id: ing.id,
        ingrediente_nome: ing.nome,
        subgrupo_id: ing.subgrupo_id,
        subgrupo_nome: subNome,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

/**
 * Encontra o fornecedor mais parecido pelo nome ou CNPJ.
 */
export function matchFornecedor(
  nomeParsed: string,
  cnpjParsed: string | null,
  fornecedores: { id: string; razao_social: string; cnpj?: string }[]
): { id: string; razao_social: string; score: number } | null {
  // Match exato por CNPJ
  if (cnpjParsed) {
    const cnpjLimpo = cnpjParsed.replace(/\D/g, '');
    const matchCnpj = fornecedores.find(
      (f) => f.cnpj && f.cnpj.replace(/\D/g, '') === cnpjLimpo
    );
    if (matchCnpj) return { ...matchCnpj, score: 1 };
  }

  // Match por similaridade de nome
  const scored = fornecedores
    .map((f) => ({
      ...f,
      score: similaridade(nomeParsed, f.razao_social),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 && scored[0].score > 0.3 ? scored[0] : null;
}

/**
 * Processa o upload de um arquivo de cotação.
 */
export async function parseCotacaoFile(file: File): Promise<CotacaoParsed | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-cotacao', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Erro na API de IA');
    }

    return (await response.json()) as CotacaoParsed;
  } catch (err) {
    console.error('Erro no parseCotacaoFile:', err);
    return null;
  }
}
