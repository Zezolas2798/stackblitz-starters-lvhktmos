// lib/offApi.ts
import { Ingrediente } from './types';

/**
 * Interface simplificada para a resposta do Open Food Facts
 */
export interface OFFProductResponse {
  code: string;
  product?: {
    product_name?: string;
    product_name_pt?: string;
    brands?: string;
    ingredients_text_pt?: string;
    allergens_tags?: string[];
    nova_group?: number;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'carbohydrates_100g'?: number;
      'sugars_100g'?: number;
      'proteins_100g'?: number;
      'fat_100g'?: number;
      'saturated-fat_100g'?: number;
      'trans-fat_100g'?: number;
      'fiber_100g'?: number;
      'sodium_100g'?: number;
      'salt_100g'?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  status: number;
  status_verbose: string;
}

/**
 * Busca um produto pelo código de barras no Open Food Facts
 */
export async function fetchProductByBarcode(barcode: string): Promise<OFFProductResponse> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  if (!response.ok) {
    throw new Error('Erro ao conectar com a API do Open Food Facts');
  }
  return response.json();
}

/**
 * Mapeia os dados do OFF para a nossa estrutura de Ingrediente
 */
export function mapOFFToIngrediente(offData: OFFProductResponse): Partial<Ingrediente> {
  if (offData.status !== 1 || !offData.product) {
    return {};
  }

  const p = offData.product;
  const n = p.nutriments || {};

  // Mapeamento básico
  const mapped: Partial<Ingrediente> = {
    nome: p.product_name_pt || p.product_name || '',
    fonte: p.brands || 'Open Food Facts',
    tipo_ingrediente: 'COMPOSTO',
    declaracao_ingredientes_fornecedor: p.ingredients_text_pt || null,
    classificacao_nova: p.nova_group || null,
    
    // Macronutrientes
    energia_kcal: n['energy-kcal_100g'] ?? null,
    carboidrato_g: n.carbohydrates_100g ?? null,
    acucar_total_g: n.sugars_100g ?? null,
    proteina_g: n.proteins_100g ?? null,
    lipideos_g: n.fat_100g ?? null,
    gordura_saturada_g: n['saturated-fat_100g'] ?? null,
    gordura_trans_g: n['trans-fat_100g'] ?? null,
    fibra_alimentar_g: n.fiber_100g ?? null,
    
    // Sódio: OFF armazena em GRAMAS, nós usamos MILIGRAMAS
    sodio_mg: n.sodium_100g ? Math.round(n.sodium_100g * 1000) : (n.salt_100g ? Math.round(n.salt_100g * 400) : null),
  };

  return mapped;
}

/**
 * Mapeia alérgenos do OFF para os nossos IDs internos (Baseado na tabela anvisa_alergenicos)
 * Nota: Isso requer uma lista de alérgenos da nossa base para fazer o "fuzzy match" ou mapeamento fixo.
 */
export function mapOFFAllergens(offTags: string[] = []): number[] {
    // Mapeamento comum de tags OFF para IDs Anvisa conhecidos (exemplo)
    // No ambiente real, idealmente faríamos uma busca por nome.
    const mapping: Record<string, number> = {
        'en:milk': 1, // Exemplo: Leite
        'en:soybeans': 2, // Soja
        'en:eggs': 3,
        'en:peanuts': 4,
        'en:nuts': 5,
        'en:wheat': 6,
        'en:fish': 7,
        'en:crustaceans': 8
    };

    return offTags
        .map(tag => mapping[tag.toLowerCase()])
        .filter(id => id !== undefined);
}
