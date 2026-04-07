// lib/uan-constants.ts

export type RefeicaoUAN = 'Desjejum' | 'Colação' | 'Almoço' | 'Lanche da Tarde' | 'Jantar' | 'Ceia';

/**
 * Mapeamento de categorias permitidas para cada grupo de refeição
 * Conforme solicitação do usuário:
 * - Almoço/Janta: Prato Base, Prato Principal, Alternativa (2ª opção do prato principal), Opção Vegetariana, Guarnição, Saladas, Bebidas, Complemento, Sopa.
 * - Café da manhã/Colação/Lanche da tarde/Ceia: Bebida Quente, Bebida Fria, Base, Recheio, Complemento, Sobremesa, Prato Principal.
 */
export const MEAL_CATEGORY_GROUPS: Record<string, string[]> = {
  'ALMOCO_JANTAR': [
    'Prato Base', 
    'Prato Principal', 
    'Alternativa', 
    'Opção Vegetariana', 
    'Guarnição', 
    'Saladas', 
    'Bebidas', 
    'Complemento',
    'Sopa'
  ],
  'CAFE_LANCHES': [
    'Bebida Quente', 
    'Bebida Fria', 
    'Base', 
    'Recheio', 
    'Complemento', 
    'Sobremesa', 
    'Prato Principal'
  ]
};

/**
 * Mapeamento de qual refeição pertence a qual grupo
 */
export const REFEICAO_TO_GROUP: Record<string, string> = {
  'Desjejum': 'CAFE_LANCHES',
  'Colação': 'CAFE_LANCHES',
  'Almoço': 'ALMOCO_JANTAR',
  'Lanche da Tarde': 'CAFE_LANCHES',
  'Jantar': 'ALMOCO_JANTAR',
  'Ceia': 'CAFE_LANCHES'
};

/**
 * Lista completa e única de todas as categorias UAN
 */
export const ALL_UAN_CATEGORIES = Array.from(new Set([
  ...MEAL_CATEGORY_GROUPS.ALMOCO_JANTAR,
  ...MEAL_CATEGORY_GROUPS.CAFE_LANCHES
])).sort();
