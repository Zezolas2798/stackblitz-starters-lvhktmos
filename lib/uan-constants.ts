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

export const COLORS_AQPC = ['Branco', 'Verde', 'Amarelo', 'Laranja', 'Vermelho', 'Rosa', 'Roxo', 'Marrom', 'Bege', 'Preto', 'Misto'];

export const METHODS_AQPC = [
  { id: 'Cru', label: 'Cru/Natural' },
  { id: 'Cozido_Agua', label: 'Cozido em Água' },
  { id: 'Cozido_Vapor', label: 'Cozido ao Vapor' },
  { id: 'Assado', label: 'Assado ao Forno' },
  { id: 'Grelhado', label: 'Grelhado/Chapa' },
  { id: 'Frito_Imersao', label: 'Frito (Imersão)' },
  { id: 'Salteado', label: 'Salteado' },
  { id: 'Refogado', label: 'Refogado' },
  { id: 'Brasado', label: 'Brasado (Panela)' }
];

export const TEXTURES_AQPC = [
  { id: 'Crocante', label: 'Crocante' },
  { id: 'Macio', label: 'Macio' },
  { id: 'Cremoso', label: 'Cremoso/Pastoso' },
  { id: 'Firme', label: 'Firme/Elástico' },
  { id: 'Gelatinoso', label: 'Gelatinoso' },
  { id: 'Líquido', label: 'Líquido' }
];
