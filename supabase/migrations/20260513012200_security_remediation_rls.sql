-- Security Remediation: Enable RLS on all 33 tables previously identified as vulnerable
-- Restricts access to authenticated users and service roles.

DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'anvisa_aditivos', 'producao_consumos', 'receitas_versoes', 'colaboradores', 
        'app_notificacoes', 'composicao_fichas_uan', 'cardapios_uan', 'config_modelo_subtarefas', 
        'config_modelos_demandas', 'cardapio_dias_uan', 'anvisa_alergenicos', 'app_roles', 
        'anvisa_funcoes_aditivos', 'anvisa_alegacoes_criterios', 'anvisa_grupos_populacionais', 
        'anvisa_vdr', 'app_role_permissions', 'app_permissions', 'app_user_memberships', 
        'profiles', 'normas_sanitarias_parametros', 'listas_compras_uan', 'materiais', 
        'regras_validade_sanitaria', 'acoes_corretivas', 'referencias_nutricionais', 
        'app_user_permissions', 'cardapio_regras_variedade', 'app_modulos', 'perfil_cardapio_slots', 
        'perfis_cardapio', 'fichas_tecnicas_uan', 'cardapio_perfis_refeicao'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Habilita RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Remove policy se já existir para evitar erro
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated access" ON public.%I;', t);
        
        -- Cria policy permitindo apenas usuários autenticados
        EXECUTE format('CREATE POLICY "Allow authenticated access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;
