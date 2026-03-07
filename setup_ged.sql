-- =========================================================================
-- MÓDULO GED: GESTÃO ELETRÔNICA DE DOCUMENTOS (TABELAS E SEED)
-- =========================================================================

-- 1. TABELA DE CATEGORIAS ROOT
CREATE TABLE IF NOT EXISTS public.documentos_categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.documentos_categorias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura total autenticada" ON public.documentos_categorias;
DROP POLICY IF EXISTS "Permitir inserção autenticada" ON public.documentos_categorias;
DROP POLICY IF EXISTS "Permitir atualização autenticada" ON public.documentos_categorias;
DROP POLICY IF EXISTS "Permitir deleção autenticada" ON public.documentos_categorias;
CREATE POLICY "Permitir leitura total autenticada" ON public.documentos_categorias FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção autenticada" ON public.documentos_categorias FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização autenticada" ON public.documentos_categorias FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção autenticada" ON public.documentos_categorias FOR DELETE USING (auth.role() = 'authenticated');

-- 2. TABELA DE PASTAS E SUBPASTAS INFINITAS
CREATE TABLE IF NOT EXISTS public.documentos_pastas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES public.documentos_categorias(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.documentos_pastas(id) ON DELETE CASCADE, -- Suporte a árvore
    nome VARCHAR(255) NOT NULL,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.documentos_pastas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura total autenticada" ON public.documentos_pastas;
DROP POLICY IF EXISTS "Permitir inserção autenticada" ON public.documentos_pastas;
DROP POLICY IF EXISTS "Permitir atualização autenticada" ON public.documentos_pastas;
DROP POLICY IF EXISTS "Permitir deleção autenticada" ON public.documentos_pastas;
CREATE POLICY "Permitir leitura total autenticada" ON public.documentos_pastas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção autenticada" ON public.documentos_pastas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização autenticada" ON public.documentos_pastas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção autenticada" ON public.documentos_pastas FOR DELETE USING (auth.role() = 'authenticated');

-- 3. TABELA DE ARQUIVOS / DOCUMENTOS
CREATE TABLE IF NOT EXISTS public.documentos_arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pasta_id UUID REFERENCES public.documentos_pastas(id) ON DELETE CASCADE NOT NULL,
    nome_arquivo VARCHAR(255) NOT NULL,
    versao INTEGER DEFAULT 1,
    url_storage VARCHAR(1024), -- Ex: bucket/cliente_id/uuid.pdf
    tamanho_bytes BIGINT,
    data_emissao DATE,
    data_validade DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.documentos_arquivos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura total autenticada" ON public.documentos_arquivos;
DROP POLICY IF EXISTS "Permitir inserção autenticada" ON public.documentos_arquivos;
DROP POLICY IF EXISTS "Permitir atualização autenticada" ON public.documentos_arquivos;
DROP POLICY IF EXISTS "Permitir deleção autenticada" ON public.documentos_arquivos;
CREATE POLICY "Permitir leitura total autenticada" ON public.documentos_arquivos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir inserção autenticada" ON public.documentos_arquivos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Permitir atualização autenticada" ON public.documentos_arquivos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir deleção autenticada" ON public.documentos_arquivos FOR DELETE USING (auth.role() = 'authenticated');

-- =========================================================================
-- SEED DE DADOS: INJETANDO A ESTRUTURA REQUISITADA PELA CLIENTE
-- =========================================================================

-- Função DO block para injetar numa cliente_id default caso a cliente queira testar rápido (Assumindo id do primeiro cliente cadastrado)
DO $$
DECLARE
    v_cliente_id UUID;
    v_cat_empresa_id UUID;
    v_cat_saude_id UUID;
    v_cat_nutri_id UUID;
    v_pasta_compras_id UUID;
    v_pasta_pragas_id UUID;
    v_pasta_residuos_id UUID;
    v_pasta_oleo_id UUID;
    v_pasta_potabilidade_id UUID;
    v_pasta_exaustao_id UUID;
    v_pasta_qualidade_id UUID;
BEGIN
    SELECT id INTO v_cliente_id FROM public.clientes ORDER BY created_at ASC LIMIT 1;
    
    IF v_cliente_id IS NOT NULL THEN
        -- Limpa categorias anteriores para não duplicar dados semente ao rodar o script novamente
        DELETE FROM public.documentos_categorias WHERE cliente_id = v_cliente_id;
        
        -- 1. Criação das Categorias Físicas
        INSERT INTO public.documentos_categorias (cliente_id, nome, ordem) VALUES (v_cliente_id, '1. DOCUMENTOS DA EMPRESA', 1) RETURNING id INTO v_cat_empresa_id;
        INSERT INTO public.documentos_categorias (cliente_id, nome, ordem) VALUES (v_cliente_id, '2. SAÚDE OCUPACIONAL', 2) RETURNING id INTO v_cat_saude_id;
        INSERT INTO public.documentos_categorias (cliente_id, nome, ordem) VALUES (v_cliente_id, '3. NUTRIÇÃO', 3) RETURNING id INTO v_cat_nutri_id;

        -- 2. Pastas Filhas da Categoria 1 (Empresa)
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_empresa_id, NULL, '1.1 Cartão do CNPJ', 1),
            (v_cat_empresa_id, NULL, '1.2 Contrato Social', 2),
            (v_cat_empresa_id, NULL, '1.3 CCM', 3),
            (v_cat_empresa_id, NULL, '1.4 AVCB-CLCB', 4),
            (v_cat_empresa_id, NULL, '1.5 CMVS', 5),
            (v_cat_empresa_id, NULL, '1.6 Alvará de Funcionamento de Prefeitura', 6),
            (v_cat_empresa_id, NULL, '1.7 Contrato Consultoria', 7);

        -- 3. Pastas Filhas da Categoria 2 (Saúde)
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_saude_id, NULL, '2.1 PCMSO', 1),
            (v_cat_saude_id, NULL, '2.2 PGR', 2),
            (v_cat_saude_id, NULL, '2.3 Treinamentos BPM e descritos no PCMSO e PGR', 3),
            (v_cat_saude_id, NULL, '2.4 LTCAT', 4),
            (v_cat_saude_id, NULL, '2.5 AET', 5),
            (v_cat_saude_id, NULL, '2.6 ASOs', 6),
            (v_cat_saude_id, NULL, '2.7 Planilha de Controle de Exames Periódicos', 7),
            (v_cat_saude_id, NULL, '2.8 Planilha de Controle de Entrega de Uniformes-EPI-EPC', 8),
            (v_cat_saude_id, NULL, '2.9 Termo de Uniforme', 9),
            (v_cat_saude_id, NULL, '2.10 Termo de EPI-EPC', 10),
            (v_cat_saude_id, NULL, '2.11 Certificado de Treinamento em Boas Práticas', 11);

        -- 4. Pastas Filhas da Categoria 3 (Nutrição)
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.1 COMPRAS', 1) RETURNING id INTO v_pasta_compras_id;
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.2 CONTROLE DE VETORES E PRAGAS', 2) RETURNING id INTO v_pasta_pragas_id;
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.3 RESÍDUOS SÓLIDOS', 3) RETURNING id INTO v_pasta_residuos_id;
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.4 ÓLEO', 4) RETURNING id INTO v_pasta_oleo_id;
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.5 POTABILIDADE DA ÁGUA', 5) RETURNING id INTO v_pasta_potabilidade_id;
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.6 SISTEMA DE EXAUSTÃO', 6) RETURNING id INTO v_pasta_exaustao_id;
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES (v_cat_nutri_id, NULL, '3.7 GESTÃO DA QUALIDADE', 7) RETURNING id INTO v_pasta_qualidade_id;

        -- Subpastas de 3.1 COMPRAS
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_compras_id, '3.1.1 Controle da Homologação dos Fornecedores', 1),
            (v_cat_nutri_id, v_pasta_compras_id, '3.1.2 Laudos de Migração de Embalagem', 2);

        -- Subpastas de 3.2 PRAGAS
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_pragas_id, '3.2.1 Contrato entre a Empresa de Controle de Pragas e Vetores', 1),
            (v_cat_nutri_id, v_pasta_pragas_id, '3.2.2 Alvará de Funcionamento da Empresa de Controle de Pragas', 2),
            (v_cat_nutri_id, v_pasta_pragas_id, '3.2.3 CMVS da Empresa de Controle de Pragas', 3),
            (v_cat_nutri_id, v_pasta_pragas_id, '3.2.4 Certificado de Controle de Pragas', 4),
            (v_cat_nutri_id, v_pasta_pragas_id, '3.2.5 Relatório de Medidas para Controle de Pragas e Vetores', 5);

        -- Subpastas de 3.3 RESÍDUOS
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_residuos_id, '3.3.1 Cadastro na SP Regula', 1),
            (v_cat_nutri_id, v_pasta_residuos_id, '3.3.2 Contrato da Empresa de Coleta de Resíduos Sólidos', 2),
            (v_cat_nutri_id, v_pasta_residuos_id, '3.3.3 Extrato do manifesto de carga mensal', 3),
            (v_cat_nutri_id, v_pasta_residuos_id, '3.3.4 Certificado de limpeza da caixa de gordura', 4);

        -- Subpastas 3.4 ÓLEO
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_oleo_id, '3.4.1 Contrato da Empresa de Coleta de Óleo', 1),
            (v_cat_nutri_id, v_pasta_oleo_id, '3.4.2 Alvará da Empresa de Coleta de Óleo', 2),
            (v_cat_nutri_id, v_pasta_oleo_id, '3.4.3 Cadastro da empresa de Coleta de Óleo na CETESB', 3),
            (v_cat_nutri_id, v_pasta_oleo_id, '3.4.4 Recibo da Coleta de Óleo', 4);

        -- Subpastas 3.5 POTABILIDADE
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_potabilidade_id, '3.5.1 Certificado de Higienização de Reservatórios de Água com procedimento descritivo', 1),
            (v_cat_nutri_id, v_pasta_potabilidade_id, '3.5.2 Laudo de Potabilidade da Água', 2),
            (v_cat_nutri_id, v_pasta_potabilidade_id, '3.5.3 Certificado de Higienização de Filtros de Água', 3),
            (v_cat_nutri_id, v_pasta_potabilidade_id, '3.5.4 Laudo de Potabilidade do Gelo (Interno e externo)', 4);
            
         -- Subpastas 3.6 EXAUSTÃO
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_exaustao_id, '3.6.1 Certificado de Hihienização da Tubulação das Coifas', 1),
            (v_cat_nutri_id, v_pasta_exaustao_id, '3.6.2 PMOC', 2);

        -- Subpastas 3.7 QUALIDADE
        INSERT INTO public.documentos_pastas (categoria_id, parent_id, nome, ordem) VALUES
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.1 Calibração balança', 1),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.2 Calibração termômetro', 2),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.3 Plano de manutenção preventiva', 3),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.4 Comprovante de manutenção preventiva e-ou corretiva de equipamentos', 4),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.5 FDS', 5),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.7 Análise Sensorial dos Alimentos (Shelf life)', 6),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.8 Análise Microbiológica dos Alimentos', 7),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.9 Planilha de higienização', 8),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.10 Planilha de notificação de pragas e vetores', 9),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.11 Planilha de recebimento', 10),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.12 Planilha de temperatura dos equipamentos', 11),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.13 Planilha de temperatura de cocção', 12),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.14 Planilha de controle do óleo', 13),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.15 Planilha de temperatura de distribuição', 14),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.16 Planilha de Controle de Produção e Lote', 15),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.17 Ordem de Protocolo de SAC', 16),
            (v_cat_nutri_id, v_pasta_qualidade_id, '3.7.18 Outras planilhas', 17);

    END IF;
END $$;

-- ==========================================
-- BUCKET DE ARMAZENAMENTO (STORAGE) - GED
-- ==========================================
-- Inicia o Bucket Público de Documentos 
INSERT INTO storage.buckets (id, name, public)
VALUES ('ged_documentos', 'ged_documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas Flexíveis no Bucket Local para Desenvolvimento / Upload Direto no GED
-- Permite leitura de arquivos a qualquer visitante do GED
DROP POLICY IF EXISTS "Permitir Leitura Pública de GED" ON storage.objects;
CREATE POLICY "Permitir Leitura Pública de GED"
ON storage.objects FOR SELECT
USING (bucket_id = 'ged_documentos');

-- Permite upload (insert) de PDFs para o Bucket do GED para usuários autenticados (ou todos no DB local)
DROP POLICY IF EXISTS "Permitir Upload para GED" ON storage.objects;
CREATE POLICY "Permitir Upload para GED"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ged_documentos');

-- Permite Deletar Ficheiros no Bucket (Caso dê erro no DB insert)
DROP POLICY IF EXISTS "Permitir Delete para GED" ON storage.objects;
CREATE POLICY "Permitir Delete para GED"
ON storage.objects FOR DELETE
USING (bucket_id = 'ged_documentos');
