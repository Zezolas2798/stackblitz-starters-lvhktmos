-- 1. Adicionar coluna tipo na tabela fornecedores
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'FORNECEDOR';

-- 2. Criar tabela de configuração de categorias e documentos
CREATE TABLE IF NOT EXISTS categorias_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES clientes(id),
  tipo text NOT NULL, -- 'FORNECEDOR' ou 'SERVICO'
  nome text NOT NULL,
  documentos_obrigatorios text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- 3. Habilitar RLS para a nova tabela
ALTER TABLE categorias_config ENABLE ROW LEVEL SECURITY;

-- Sugestão de política RLS:
-- CREATE POLICY "Categorias visíveis para membros do cliente" ON categorias_config
--   FOR ALL USING (cliente_id IN (SELECT cliente_id FROM perfis WHERE id = auth.uid()));
