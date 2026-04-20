-- Migrations para estruturação da Taxonomia de Produtos (Level 1, 2, 3)

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidade_produto_enum') THEN
        CREATE TYPE modalidade_produto_enum AS ENUM (
          'ALIMENTOS', 
          'EMBALAGENS', 
          'EPI_EPC', 
          'LIMPEZA', 
          'MANUTENCAO', 
          'UTENSILIOS', 
          'UNIFORMES', 
          'PRIMEIROS_SOCORROS',
          'OUTROS'
        );
    END IF;
END
$$;

-- Rename das tabelas principais
ALTER TABLE IF EXISTS public.cliente_categorias_produto RENAME TO grupos_produto;
ALTER TABLE IF EXISTS public.ingredientes_grupos RENAME TO subgrupos_produto;

-- Rename das colunas dependentes para se referir corretamente aos novos domínios
ALTER TABLE public.subgrupos_produto RENAME COLUMN categoria_id TO grupo_id;

ALTER TABLE public.materiais RENAME COLUMN categoria_id TO grupo_id;
ALTER TABLE public.ingredientes RENAME COLUMN categoria_produto_id TO grupo_id;
ALTER TABLE public.ingredientes RENAME COLUMN grupo_estoque_id TO subgrupo_id;
ALTER TABLE public.producao_requisicoes RENAME COLUMN grupo_estoque_id TO subgrupo_id;

-- Cast da coluna antiga de texto para o ENUM 
ALTER TABLE public.grupos_produto 
  ALTER COLUMN modalidade TYPE modalidade_produto_enum 
  USING (UPPER(modalidade)::modalidade_produto_enum);

-- Atualização cosmética do nome das constraints
ALTER TABLE public.grupos_produto RENAME CONSTRAINT cliente_categorias_produto_pkey TO grupos_produto_pkey;
ALTER TABLE public.grupos_produto RENAME CONSTRAINT cliente_categorias_produto_cliente_id_fkey TO grupos_produto_cliente_id_fkey;

ALTER TABLE public.subgrupos_produto RENAME CONSTRAINT ingredientes_grupos_pkey TO subgrupos_produto_pkey;
ALTER TABLE public.subgrupos_produto RENAME CONSTRAINT ingredientes_grupos_cliente_id_fkey TO subgrupos_produto_cliente_id_fkey;
ALTER TABLE public.subgrupos_produto RENAME CONSTRAINT ingredientes_grupos_categoria_id_fkey TO subgrupos_produto_grupo_id_fkey;

ALTER TABLE public.materiais RENAME CONSTRAINT materiais_categoria_id_fkey TO materiais_grupo_id_fkey;
ALTER TABLE public.ingredientes RENAME CONSTRAINT ingredientes_categoria_produto_id_fkey TO ingredientes_grupo_id_fkey;
ALTER TABLE public.ingredientes RENAME CONSTRAINT ingredientes_grupo_estoque_id_fkey TO ingredientes_subgrupo_id_fkey;
ALTER TABLE public.producao_requisicoes RENAME CONSTRAINT producao_requisicoes_grupo_estoque_id_fkey TO producao_requisicoes_subgrupo_id_fkey;
