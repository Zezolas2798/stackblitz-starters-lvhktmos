CREATE TABLE IF NOT EXISTS public.compras_campanhas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    unidade_id UUID NOT NULL REFERENCES public.cliente_unidades(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'RASCUNHO',
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    itens_cesta JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.compras_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage suas campanhas" ON public.compras_campanhas
    USING (cliente_id IN ( SELECT r.cliente_id FROM app_roles r JOIN app_user_memberships m ON m.role_id = r.id WHERE m.usuario_id = auth.uid() ));


CREATE TABLE IF NOT EXISTS public.compras_campanha_fornecedor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campanha_id UUID NOT NULL REFERENCES public.compras_campanhas(id) ON DELETE CASCADE,
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
    token_acesso UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'AGUARDANDO',
    itens_solicitados JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_envio TIMESTAMPTZ,
    data_resposta TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.compras_campanha_fornecedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage campanhas_fornecedor" ON public.compras_campanha_fornecedor
    USING (
        campanha_id IN (SELECT id FROM public.compras_campanhas WHERE cliente_id IN ( SELECT r.cliente_id FROM app_roles r JOIN app_user_memberships m ON m.role_id = r.id WHERE m.usuario_id = auth.uid() ))
    );


-- RPC Functions Seguras para o Portal do Fornecedor (Acesso sem Login)

CREATE OR REPLACE FUNCTION public.processar_resposta_cotacao(
    p_token UUID,
    p_precos JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    v_campanha_forn_id UUID;
    v_campanha_id UUID;
    v_cliente_id UUID;
    v_unidade_id UUID;
    v_fornecedor_id UUID;
    v_status VARCHAR;
    v_itens_solicitados JSONB;
    v_item JSONB;
    v_preco NUMERIC;
    v_ingrediente_id UUID;
BEGIN
    SELECT id, campanha_id, fornecedor_id, status, itens_solicitados 
    INTO v_campanha_forn_id, v_campanha_id, v_fornecedor_id, v_status, v_itens_solicitados
    FROM public.compras_campanha_fornecedor
    WHERE token_acesso = p_token;

    IF v_campanha_forn_id IS NULL THEN
        RAISE EXCEPTION 'Token inválido ou não encontrado.';
    END IF;

    IF v_status != 'AGUARDANDO' THEN
        RAISE EXCEPTION 'Esta cotação já foi respondida ou está expirada.';
    END IF;

    SELECT cliente_id, unidade_id INTO v_cliente_id, v_unidade_id
    FROM public.compras_campanhas WHERE id = v_campanha_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_precos)
    LOOP
        v_ingrediente_id := (v_item->>'ingrediente_id')::UUID;
        v_preco := (v_item->>'preco_por_kg_l')::NUMERIC;
        
        IF (SELECT count(*) > 0 FROM jsonb_array_elements(v_itens_solicitados) AS elem WHERE (elem->>'id')::UUID = v_ingrediente_id) THEN
            INSERT INTO public.compras_orcamentos (
                cliente_id, unidade_id, fornecedor_id, ingrediente_id, 
                preco_por_kg_l, data_orcamento
            ) VALUES (
                v_cliente_id, v_unidade_id, v_fornecedor_id, v_ingrediente_id, 
                v_preco, CURRENT_DATE
            );
        END IF;
    END LOOP;

    UPDATE public.compras_campanha_fornecedor
    SET status = 'RESPONDIDO', data_resposta = now()
    WHERE id = v_campanha_forn_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.processar_resposta_cotacao(UUID, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.processar_resposta_cotacao(UUID, JSONB) TO authenticated;


CREATE OR REPLACE FUNCTION public.obter_dados_portal_fornecedor(p_token UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'fornecedor_nome', f.razao_social,
        'status', ccf.status,
        'itens_solicitados', ccf.itens_solicitados
    ) INTO v_result
    FROM public.compras_campanha_fornecedor ccf
    JOIN public.fornecedores f ON f.id = ccf.fornecedor_id
    WHERE ccf.token_acesso = p_token;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Token inválido ou não encontrado.';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.obter_dados_portal_fornecedor(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.obter_dados_portal_fornecedor(UUID) TO authenticated;
