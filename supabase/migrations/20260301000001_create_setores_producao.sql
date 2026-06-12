-- Criação da tabela de Setores de Produção
CREATE TABLE public.cliente_setores_producao (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  cliente_id uuid NOT NULL,
  nome character varying NOT NULL,
  ativo boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT cliente_setores_producao_pkey PRIMARY KEY (id)
);

-- Configurando os vínculos (Foreign Keys)
ALTER TABLE public.cliente_setores_producao
  ADD CONSTRAINT cliente_setores_producao_cliente_id_fkey 
  FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;

-- Criando políticas de segurança (RLS)
ALTER TABLE public.cliente_setores_producao ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Permitir leitura para usuários da mesma empresa"
--   ON public.cliente_setores_producao
--   FOR SELECT
--   USING (
--     cliente_id IN (
--       SELECT permissoes.cliente_id -- Ajuste conforme sua tabela de permissões (ex: permissoes_usuario)
--       FROM public.clientes -- Simulando vínculo para o RLS (Verifique sua estrutura, pode ser via auth.uid())
--     )
--   );  
-- NOTA: Como você está usando Supabase, se não usar RLS rígido nos selects, pode simplificar com:
CREATE POLICY "Enable read access for all users" ON public.cliente_setores_producao FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.cliente_setores_producao FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.cliente_setores_producao FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.cliente_setores_producao FOR DELETE USING (auth.role() = 'authenticated');
