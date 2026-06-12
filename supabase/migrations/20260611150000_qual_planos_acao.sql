-- 20260611150000_qual_planos_acao.sql

CREATE TABLE public.qual_planos_acao (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  unidade_id uuid NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
  origem_modulo text NOT NULL, -- Ex: 'PLANILHA_TEMPERATURA'
  origem_id text NOT NULL, -- Ex: ID do equipamento ou ID do registro
  periodo_referencia text, -- Ex: '2026-06-10 a 2026-06-12'
  causa_raiz text,
  acao_corretiva text NOT NULL,
  insights text,
  status text DEFAULT 'PENDENTE'::text,
  criado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.qual_planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver planos da sua unidade"
  ON public.qual_planos_acao FOR SELECT
  USING (
    unidade_id IN (
      SELECT cu.id FROM public.cliente_unidades cu 
      WHERE cu.cliente_id = (SELECT cliente_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Colaboradores podem criar planos na sua unidade"
  ON public.qual_planos_acao FOR INSERT
  WITH CHECK (
    unidade_id IN (
      SELECT cu.id FROM public.cliente_unidades cu 
      WHERE cu.cliente_id = (SELECT cliente_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Colaboradores podem atualizar planos da sua unidade"
  ON public.qual_planos_acao FOR UPDATE
  USING (
    unidade_id IN (
      SELECT cu.id FROM public.cliente_unidades cu 
      WHERE cu.cliente_id = (SELECT cliente_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.qual_planos_acao
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
