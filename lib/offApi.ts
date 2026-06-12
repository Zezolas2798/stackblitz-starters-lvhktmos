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
    ingredients_text?: string;
    allergens_tags?: string[];
    allergens_from_ingredients?: string;
    nova_group?: number;
    nutrition_data_per?: '100g' | 'portion';
    serving_quantity?: number;
    nutriments?: {
      [key: string]: any;
    };
    [key: string]: any;
  };
  status: number;
  status_verbose: string;
}

/**
 * Mapeia os dados do OFF para a nossa estrutura de Ingrediente com normalização
 */
export function mapOFFToIngrediente(offData: OFFProductResponse): Partial<Ingrediente> & { _alergenos_detectados?: any[] } {
  if (offData.status !== 1 || !offData.product) {
    return {};
  }

  const p = offData.product;
  const n = p.nutriments || {};
  
  // Determinar fator de escala para 100g/ml
  let scale = 1.0;
  if (p.nutrition_data_per === 'portion' && p.serving_quantity && p.serving_quantity > 0) {
    scale = 100 / p.serving_quantity;
  }

  // Função auxiliar para pegar valor 100g ou calcular da porção
  const getVal = (key: string): number | null => {
    const val100 = n[`${key}_100g`];
    if (val100 !== undefined && val100 !== null) return Number(val100);
    
    const valServing = n[`${key}_serving`];
    if (valServing !== undefined && valServing !== null) {
      return Number(valServing) * scale;
    }
    return null;
  };

  // Mapeamento básico
  const mapped: Partial<Ingrediente> & { _alergenos_detectados?: any[] } = {
    nome: p.product_name_pt || p.product_name || '',
    marca: p.brands || 'Open Food Facts',
    tipo_ingrediente: 'COMPOSTO',
    declaracao_ingredientes_fornecedor: p.ingredients_text_pt || p.ingredients_text || null,
    classificacao_nova: p.nova_group || null,
    
    // Macronutrientes (Normalizados)
    energia_kcal: getVal('energy-kcal'),
    carboidrato_g: getVal('carbohydrates'),
    acucar_total_g: getVal('sugars'),
    proteina_g: getVal('proteins'),
    lipideos_g: getVal('fat'),
    gordura_saturada_g: getVal('saturated-fat'),
    gordura_trans_g: getVal('trans-fat'),
    fibra_alimentar_g: getVal('fiber'),
    
    // Sódio: OFF armazena em GRAMAS, nós usamos MILIGRAMAS
    sodio_mg: n.sodium_100g ? Math.round(Number(n.sodium_100g) * 1000) : 
             (n.sodium_serving ? Math.round(Number(n.sodium_serving) * scale * 1000) : 
             (n.salt_100g ? Math.round(Number(n.salt_100g) * 400) : null)),
  };

  // Lógica de Alérgenos Detalhada
  const detectedAllergens: any[] = [];
  const allergensText = (p.allergens_from_ingredients || '').toLowerCase();
  const ingredientsText = (p.ingredients_text_pt || p.ingredients_text || '').toLowerCase();
  
  const commonMappings: Record<string, string[]> = {
    'en:milk': ['leite', 'soro de leite', 'caseína', 'lactose'],
    'en:soybeans': ['soja', 'lecitina de soja'],
    'en:eggs': ['ovo', 'albumina'],
    'en:peanuts': ['amendoim'],
    'en:wheat': ['trigo', 'glúten', 'farinha de trigo'],
    'en:nuts': ['nozes', 'castanha', 'amêndoa', 'avelã', 'pistache'],
    'en:fish': ['peixe'],
    'en:crustaceans': ['crustáceos', 'camarão', 'caranguejo']
  };

  (p.allergens_tags || []).forEach(tag => {
    const keywords = commonMappings[tag];
    if (keywords) {
      let isDerivado = false;
      let isContem = false;

      // Se a tag do OFF reporta, é porque contém o grupo.
      // Tentamos refinar se é o alimento base ou derivado via texto.
      const hasBaseFood = keywords[0]; // ex: 'leite'
      
      // Procura no texto de alérgenos ou ingredientes
      if (allergensText.includes(`contém ${hasBaseFood}`) || allergensText.includes(`${hasBaseFood}`)) {
        isContem = true;
      }
      if (ingredientsText.includes(`derivado`) || allergensText.includes(`derivado`) || ingredientsText.includes(`soro`) || ingredientsText.includes(`lecitina`)) {
        isDerivado = true;
      }

      // Fallback: Se não detectou nenhum mas a tag existe, marca "Contém" por segurança
      if (!isContem && !isDerivado) isContem = true;

      detectedAllergens.push({
        tag: tag,
        searchName: hasBaseFood,
        contem: isContem,
        derivado: isDerivado
      });
    }
  });

  mapped._alergenos_detectados = detectedAllergens;

  return mapped;
}
