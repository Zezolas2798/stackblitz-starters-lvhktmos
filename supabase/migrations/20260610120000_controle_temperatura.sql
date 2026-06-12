-- 1. Create regras_temperatura
CREATE TABLE IF NOT EXISTS public.regras_temperatura (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_slug text NOT NULL UNIQUE,
  nome_exibicao text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('INGREDIENTE', 'PREPARACAO')),
  temp_resfriado_min numeric DEFAULT 0,
  temp_resfriado_max numeric NOT NULL,
  validade_resfriado_dias int NOT NULL,
  validade_congelado_excelente_dias int DEFAULT 90,
  validade_congelado_bom_dias int DEFAULT 30,
  validade_congelado_regular_dias int DEFAULT 20,
  validade_congelado_atencao_dias int DEFAULT 10,
  legislacao_referencia text DEFAULT 'RDC 216/2004 + Portaria 2619/2011',
  created_at timestamptz DEFAULT now()
);

-- 2. Create tipo_equipamento_enum
DO $$ BEGIN
    CREATE TYPE tipo_equipamento_enum AS ENUM (
        'CAMARA_FRIA_RESFRIADOS', 'CAMARA_FRIA_CONGELADOS',
        'REFRIGERADOR_COMERCIAL', 'FREEZER_VERTICAL', 'FREEZER_HORIZONTAL',
        'BALCAO_REFRIGERADO', 'VITRINE_REFRIGERADA', 'ULTRACONGELADOR',
        'PASS_THROUGH_FRIO', 'ESTUFA', 'BANHO_MARIA', 'BALCAO_AQUECIDO',
        'VITRINE_AQUECIDA', 'PASS_THROUGH_QUENTE', 'CHAPA_QUENTE',
        'FORNO_COMBINADO', 'FOGAO_INDUSTRIAL', 'FRITADEIRA', 'OUTRO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Modify equipamentos_config
ALTER TABLE public.equipamentos_config 
    ADD COLUMN IF NOT EXISTS tipo_equipamento tipo_equipamento_enum,
    ADD COLUMN IF NOT EXISTS grupos_permitidos_ids text[];

-- 4. Create grupo_regra_temperatura
CREATE TABLE IF NOT EXISTS public.grupo_regra_temperatura (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id uuid REFERENCES public.grupos_produto(id) ON DELETE CASCADE,
  subgrupo_id uuid REFERENCES public.subgrupos_produto(id) ON DELETE CASCADE,
  regra_temperatura_id uuid REFERENCES public.regras_temperatura(id) ON DELETE CASCADE NOT NULL,
  CONSTRAINT grupo_ou_subgrupo CHECK (
    (grupo_id IS NOT NULL AND subgrupo_id IS NULL) OR 
    (grupo_id IS NULL AND subgrupo_id IS NOT NULL)
  ),
  CONSTRAINT unique_grupo UNIQUE (grupo_id),
  CONSTRAINT unique_subgrupo UNIQUE (subgrupo_id)
);

-- 5. Seed regras_temperatura
INSERT INTO public.regras_temperatura (categoria_slug, nome_exibicao, tipo, temp_resfriado_min, temp_resfriado_max, validade_resfriado_dias) VALUES
('PESCADO_CRU', 'Pescados e frutos do mar (crus)', 'INGREDIENTE', 0, 2, 3),
('CARNE_CRUA', 'Carnes bovina, suína, aves (cruas)', 'INGREDIENTE', 0, 4, 3),
('EMBUTIDOS', 'Frios e embutidos', 'INGREDIENTE', 0, 4, 3),
('FLV_HIGIENIZADO', 'FLV higienizados/cortados', 'INGREDIENTE', 0, 5, 3),
('LATICINIOS', 'Leite e derivados', 'INGREDIENTE', 0, 7, 5),
('OVOS', 'Ovos', 'INGREDIENTE', 0, 10, 7),
('PREP_PESCADO', 'Preparações com pescados', 'PREPARACAO', 0, 2, 1),
('PREP_GERAL', 'Preparações gerais (pós-cocção)', 'PREPARACAO', 0, 4, 3)
ON CONFLICT (categoria_slug) DO UPDATE SET
  nome_exibicao = EXCLUDED.nome_exibicao,
  tipo = EXCLUDED.tipo,
  temp_resfriado_max = EXCLUDED.temp_resfriado_max,
  validade_resfriado_dias = EXCLUDED.validade_resfriado_dias;

-- 6. Seed mapeamento de grupos (usando DO block pois precisamos de queries)
DO $$
DECLARE
    -- Variáveis para guardar IDs das regras
    v_pescado uuid;
    v_carne uuid;
    v_embutido uuid;
    v_laticinio uuid;
    v_ovo uuid;
    v_flv uuid;
BEGIN
    SELECT id INTO v_pescado FROM public.regras_temperatura WHERE categoria_slug = 'PESCADO_CRU';
    SELECT id INTO v_carne FROM public.regras_temperatura WHERE categoria_slug = 'CARNE_CRUA';
    SELECT id INTO v_embutido FROM public.regras_temperatura WHERE categoria_slug = 'EMBUTIDOS';
    SELECT id INTO v_laticinio FROM public.regras_temperatura WHERE categoria_slug = 'LATICINIOS';
    SELECT id INTO v_ovo FROM public.regras_temperatura WHERE categoria_slug = 'OVOS';
    SELECT id INTO v_flv FROM public.regras_temperatura WHERE categoria_slug = 'FLV_HIGIENIZADO';

    -- Mapear Pescados
    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
    SELECT id, v_pescado FROM public.grupos_produto WHERE nome = 'Pescados e Frutos do Mar'
    ON CONFLICT (grupo_id) DO NOTHING;

    -- Mapear Carnes
    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
    SELECT id, v_carne FROM public.grupos_produto WHERE nome IN ('Aves', 'Carnes Bovinas', 'Carnes Suínas', 'Carnes exóticas e Outras', 'Gordura animal')
    ON CONFLICT (grupo_id) DO NOTHING;

    -- Mapear Embutidos
    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
    SELECT id, v_embutido FROM public.grupos_produto WHERE nome = 'Embutidos, Frios e Curados'
    ON CONFLICT (grupo_id) DO NOTHING;

    -- Mapear Laticinios
    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
    SELECT id, v_laticinio FROM public.grupos_produto WHERE nome IN ('Leite e Derivados', 'Queijos', 'Cremes e Manteigas', 'Fermentados e Iogurtes', 'Leites Líquido e em Pó')
    ON CONFLICT (grupo_id) DO NOTHING;

    -- Mapear Ovos
    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
    SELECT id, v_ovo FROM public.grupos_produto WHERE nome = 'Ovos'
    ON CONFLICT (grupo_id) DO NOTHING;

    -- Mapear FLV
    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
    SELECT id, v_flv FROM public.grupos_produto WHERE nome IN (
        'Hortaliças Folhosas', 'Hortaliças Florais e Hastes', 'Legumes', 'Hortaliças Fruto',
        'Raízes, Tubérculos e Bulbos', 'Fungos e Cogumelos', 'Ervas Frescas', 'Frutas',
        'Frutas Secas', 'Polpas e Frutas Congeladas'
    )
    ON CONFLICT (grupo_id) DO NOTHING;
END $$;
