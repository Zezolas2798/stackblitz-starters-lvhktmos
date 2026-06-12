const { Client } = require('pg');
const connectionString = 'postgresql://postgres:demolidorg1@db.ircjgepumexoqslljtql.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to remote database.');

        // 1. Tabela regras_temperatura
        await client.query(`
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
        `);
        console.log('Tabela regras_temperatura verificada.');

        // 2. ENUM tipo_equipamento_enum
        await client.query(`
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
        `);
        console.log('ENUM tipo_equipamento_enum verificado.');

        // 3. Alterar equipamentos_config
        await client.query(`
            ALTER TABLE public.equipamentos_config 
                ADD COLUMN IF NOT EXISTS tipo_equipamento tipo_equipamento_enum,
                ADD COLUMN IF NOT EXISTS grupos_permitidos_ids text[];
        `);
        console.log('Tabela equipamentos_config alterada.');

        // 4. Tabela grupo_regra_temperatura
        await client.query(`
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
        `);
        console.log('Tabela grupo_regra_temperatura verificada.');

        // 5. SEED regras_temperatura
        await client.query(`
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
        `);
        console.log('Seed regras_temperatura executado.');

        // 6. MAPEAR GRUPOS (SEED grupo_regra_temperatura)
        // Busca os UUIDs das regras
        const { rows: regras } = await client.query('SELECT id, categoria_slug FROM public.regras_temperatura');
        const regrasMap = {};
        regras.forEach(r => regrasMap[r.categoria_slug] = r.id);

        // Define mapping
        const mapping = {
            'PESCADO_CRU': ['Pescados e Frutos do Mar'],
            'CARNE_CRUA': ['Aves', 'Carnes Bovinas', 'Carnes Suínas', 'Carnes exóticas e Outras', 'Gordura animal'],
            'EMBUTIDOS': ['Embutidos, Frios e Curados'],
            'LATICINIOS': ['Leite e Derivados', 'Queijos', 'Cremes e Manteigas', 'Fermentados e Iogurtes', 'Leites Líquido e em Pó'],
            'OVOS': ['Ovos'],
            'FLV_HIGIENIZADO': [
                'Hortaliças Folhosas', 'Hortaliças Florais e Hastes', 'Legumes', 'Hortaliças Fruto',
                'Raízes, Tubérculos e Bulbos', 'Fungos e Cogumelos', 'Ervas Frescas', 'Frutas',
                'Frutas Secas', 'Polpas e Frutas Congeladas'
            ]
        };

        let insertedMappings = 0;
        for (const [slug, nomes] of Object.entries(mapping)) {
            const regraId = regrasMap[slug];
            if (!regraId) continue;

            const { rows: grupos } = await client.query('SELECT id FROM public.grupos_produto WHERE nome = ANY($1)', [nomes]);
            
            for (const grupo of grupos) {
                await client.query(`
                    INSERT INTO public.grupo_regra_temperatura (grupo_id, regra_temperatura_id)
                    VALUES ($1, $2)
                    ON CONFLICT (grupo_id) DO UPDATE SET regra_temperatura_id = EXCLUDED.regra_temperatura_id
                `, [grupo.id, regraId]);
                insertedMappings++;
            }
        }
        console.log('Seed grupo_regra_temperatura executado. ' + insertedMappings + ' grupos mapeados.');

        console.log('✅ Todas as migrations concluídas com sucesso!');

    } catch (err) {
        console.error('Error executing migrations:', err);
    } finally {
        await client.end();
    }
}

run();
