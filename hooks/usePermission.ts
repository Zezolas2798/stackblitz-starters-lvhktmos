import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Mantemos os tipos para compatibilidade com o 'profiles' existente
type LegacyRole = 'super_admin' | 'company_owner' | 'manager' | 'employee' | null;

export function usePermission() {
  const [role, setRole] = useState<LegacyRole>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Carrega perfil e permissões ao montar
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setPermissions(new Set());
        setLoading(false);
        return;
      }

      // 1. Busca o perfil legado (para saber se é Super Admin/Dono)
      const { data: profile, error: profileError } = await (supabase as any).from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const userRole = profile?.role as LegacyRole;
      setRole(userRole);

      // 2. Se for 'super_admin' ou 'company_owner', não precisa buscar permissões detalhadas
      // Eles têm "God Mode" (acesso total) na função can() abaixo.
      if (userRole === 'super_admin' || userRole === 'company_owner') {
        setLoading(false);
        return;
      }

      // 3. Para mortais (Managers, Employees, Nutricionistas, etc.), buscamos as permissões granulares
      // Chamando a RPC que criamos no Passo 1
      const { data: userPerms, error: rpcError } = await supabase.rpc('get_user_permissions');

      if (rpcError) {
        console.error('Erro ao buscar permissões granulares (RPC):', rpcError);
      }

      // Transformamos array de objetos [{permission_slug: 'x'}, ...] em um Set de strings
      const permsSet = new Set<string>();
      if (userPerms && Array.isArray(userPerms)) {
        userPerms.forEach((p: any) => permsSet.add(p.permission_slug));
      }
      
      setPermissions(permsSet);

    } catch (err) {
      console.error('Erro inesperado no usePermission:', err);
    } finally {
      setLoading(false);
    }
  };

  // A FUNÇÃO MÁGICA: "CAN"
  // Agora híbrida: Suporta o Legado (God Mode) e o Novo Sistema (Granular)
  const can = useCallback((permission: string) => {
    if (loading) return false;
    
    // 1. REGRA DE OURO: Super Admin e Dono acessam TUDO
    if (role === 'super_admin' || role === 'company_owner') {
      return true;
    }

    // 2. REGRA GRANULAR: Verifica se a string da permissão existe no Set carregado do banco
    return permissions.has(permission);

  }, [role, permissions, loading]);

  return { 
    role, // Retorna para quem ainda usa (ex: exibir label "Gerente")
    loading, 
    can,
    isSuperAdmin: role === 'super_admin'
  };
}

