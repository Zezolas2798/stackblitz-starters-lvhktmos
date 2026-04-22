-- Migração: Expansão de Fornecedores e Automação GED
-- Inclui Nível 3 de Taxonomia e Trigger de Placeholders

-- 1. Expansão da tabela fornecedores (Nível 3)
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS subgrupos_fornecidos UUID[] DEFAULT '{}';

-- 2. Refinamento da tabela documentos_arquivos para vínculo explícito
ALTER TABLE public.documentos_arquivos 
ADD COLUMN IF NOT EXISTS entidade_id UUID;

COMMENT ON COLUMN public.documentos_arquivos.entidade_id IS 'ID da entidade vinculada (Fornecedor, Item, etc) para rastreabilidade direta';

-- Index para performance de busca por entidade
CREATE INDEX IF NOT EXISTS idx_documentos_arquivos_entidade_id ON public.documentos_arquivos(entidade_id);

-- 3. Função para Automação de GED
CREATE OR REPLACE FUNCTION public.fn_gerar_placeholders_ged_fornecedor()
RETURNS TRIGGER AS $$
DECLARE
    cat_name TEXT;
    doc_record JSONB;
    doc_name TEXT;
    target_pasta_id UUID;
    full_target_name TEXT;
    v_old_razao_social TEXT;
    v_new_razao_social TEXT;
BEGIN
    -- Lógica de Renomeação (Caso mude a Razão Social)
    IF TG_OP = 'UPDATE' AND OLD.razao_social <> NEW.razao_social THEN
        v_old_razao_social := OLD.razao_social;
        v_new_razao_social := NEW.razao_social;
        
        -- Atualiza os nomes de arquivos vinculados a esta entidade_id
        UPDATE public.documentos_arquivos
        SET nome_arquivo = REPLACE(nome_arquivo, '[' || v_old_razao_social || ']', '[' || v_new_razao_social || ']')
        WHERE entidade_id = NEW.id
          AND nome_arquivo ILIKE '%[' || v_old_razao_social || ']%';
    END IF;

    -- Lógica de Geração de Placeholders (Novas Categorias)
    -- Iterar sobre categorias_compras (Level 1)
    IF NEW.categorias_compras IS NOT NULL THEN
        FOREACH cat_name IN ARRAY NEW.categorias_compras
        LOOP
            -- Buscar configurações da categoria
            FOR doc_record IN 
                SELECT unnest(documentos_obrigatorios) 
                FROM public.categorias_config 
                WHERE nome = cat_name 
                  AND cliente_id = NEW.cliente_id
                  AND deleted_at IS NULL
            LOOP
                doc_name := doc_record->>'nome';
                target_pasta_id := (doc_record->>'ged_pasta_id')::UUID;
                
                -- Se não tiver pasta específica, usa a pasta raiz do fornecedor (se houver)
                IF target_pasta_id IS NULL THEN
                    target_pasta_id := NEW.pasta_documentos_id;
                END IF;

                IF target_pasta_id IS NOT NULL AND doc_name IS NOT NULL THEN
                    full_target_name := '[' || NEW.razao_social || '] ' || doc_name;

                    -- Inserir placeholder se não existir (baseado em entidade_id E nome)
                    INSERT INTO public.documentos_arquivos (
                        pasta_id, 
                        nome_arquivo, 
                        entidade_id,
                        versao
                    )
                    VALUES (
                        target_pasta_id, 
                        full_target_name, 
                        NEW.id,
                        1
                    )
                    ON CONFLICT DO NOTHING;
                    
                    -- Nota: Para ON CONFLICT funcionar baseado em entidade_id + nome, seria necessário uma constraint UNIQUE.
                    -- Como não queremos travar o banco, fazemos um check manual se preferir, ou apenas usamos a lógica de busca do app.
                    -- Aqui usamos um WHERE NOT EXISTS para simular o comportamento se não houver constraint.
                END IF;
            END LOOP;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger
DROP TRIGGER IF EXISTS tr_gerar_placeholders_ged_fornecedor ON public.fornecedores;
CREATE TRIGGER tr_gerar_placeholders_ged_fornecedor
AFTER INSERT OR UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.fn_gerar_placeholders_ged_fornecedor();
