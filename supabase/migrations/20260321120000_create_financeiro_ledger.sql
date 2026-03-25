-- Criação do Módulo Financeiro (Ledger de Partidas Dobradas e Plano de Contas USAR)

-- 1. Enums
CREATE TYPE fin_tipo_conta AS ENUM ('ATIVO', 'PASSIVO', 'RECEITA', 'DESPESA', 'PATRIMONIO_LIQUIDO');
CREATE TYPE fin_subtipo_usar AS ENUM (
    'VENDAS_ALIMENTOS', 'VENDAS_BEBIDAS', 'GORJETAS', 'IMPOSTOS_VENDAS', 
    'CMV_ALIMENTOS', 'CMV_BEBIDAS', 'CUSTO_MAO_DE_OBRA', 'CUSTO_DESPERDICIO',
    'CUSTOS_CONTROLAVEIS', 'CUSTO_OCUPACAO', 'OUTRAS_DESPESAS', 'NAO_APLICAVEL'
);
CREATE TYPE fin_tipo_lancamento AS ENUM ('DEBITO', 'CREDITO');
CREATE TYPE fin_modulo_origem AS ENUM ('PDV', 'ESTOQUE', 'PRODUCAO', 'DESPERDICIO', 'MANUAL', 'API_DELIVERY');

-- 2. Tabela: fin_contas (Plano de Contas USAR)
CREATE TABLE IF NOT EXISTS public.fin_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL, -- ex: "1.1", "4.1.1"
    nome TEXT NOT NULL,
    tipo fin_tipo_conta NOT NULL,
    subtipo_usar fin_subtipo_usar DEFAULT 'NAO_APLICAVEL',
    conta_pai_id UUID REFERENCES public.fin_contas(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cliente_id, codigo)
);

-- 3. Tabela: fin_transacoes (O cabeçalho do evento financeiro)
CREATE TABLE IF NOT EXISTS public.fin_transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    data_competencia DATE NOT NULL,
    data_pagamento DATE, -- Pode ser nulo se não foi pago ainda (Regime de Caixa vs Competência)
    origem_modulo fin_modulo_origem NOT NULL DEFAULT 'MANUAL',
    origem_id UUID, -- Referência genérica (Pode ser ID de producao_perdas, estoque_lotes, etc)
    valor_total NUMERIC NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela: fin_lancamentos (As pernas DEBITO/CREDITO do Ledger)
CREATE TABLE IF NOT EXISTS public.fin_lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transacao_id UUID NOT NULL REFERENCES public.fin_transacoes(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES public.fin_contas(id) ON DELETE RESTRICT,
    tipo_lancamento fin_tipo_lancamento NOT NULL,
    valor NUMERIC NOT NULL CHECK (valor > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS e Segurança
ALTER TABLE public.fin_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso as Contas Financeiras" ON public.fin_contas
FOR ALL USING (cliente_id IN (
    SELECT c.id FROM public.clientes c
    JOIN public.profiles p ON p.company_id = c.id
    WHERE p.id = auth.uid()
));

CREATE POLICY "Acesso as Transacoes Financeiras" ON public.fin_transacoes
FOR ALL USING (unidade_id IN (
    SELECT unidade_id FROM public.permissoes_usuario_unidade
    WHERE usuario_id = auth.uid()
));

CREATE POLICY "Acesso aos Lancamentos" ON public.fin_lancamentos
FOR ALL USING (transacao_id IN (
    SELECT id FROM public.fin_transacoes WHERE unidade_id IN (
        SELECT unidade_id FROM public.permissoes_usuario_unidade
        WHERE usuario_id = auth.uid()
    )
));

-- Trigger para Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fin_contas_modtime
BEFORE UPDATE ON public.fin_contas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_fin_transacoes_modtime
BEFORE UPDATE ON public.fin_transacoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
