-- Adiciona a coluna para rastrear em qual auditoria o plano de ação foi verificado
ALTER TABLE public.acoes_corretivas ADD COLUMN IF NOT EXISTS verificado_em_auditoria_id uuid REFERENCES public.checklist_execucoes(id);

-- Cria um indice para melhorar a busca de acoes corretivas por unidade e status
CREATE INDEX IF NOT EXISTS idx_acoes_corretivas_unidade_status ON public.acoes_corretivas(unidade_id, status);
