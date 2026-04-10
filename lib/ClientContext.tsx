'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClienteUnidade } from './types';

// Tipagem do Contexto
interface ClientContextType {
  unidadeSelecionada: ClienteUnidade | null;
  unidadeId: string | null;
  minhasUnidades: ClienteUnidade[];
  loading: boolean;
  setUnidadeSelecionada: (unidade: ClienteUnidade | null) => void;
  setClient: (clientId: string) => Promise<void>;
  setUnit: (unitId: string) => void;
  refreshUnidades: () => Promise<void>;
  activeClientId: string | null;
  activeClientName: string | null;
  activeClientLogo: string | null;
  activeModules: string[];
  mobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  desktopOpen: boolean;
  toggleDesktopSidebar: () => void;
  isSystemMode: boolean;
  setSystemMode: (active: boolean) => void;
  exitClientMode: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [unidadeSelecionada, setUnidadeState] = useState<ClienteUnidade | null>(null);
  const [minhasUnidades, setMinhasUnidades] = useState<ClienteUnidade[]>([]);
  const [loading, setLoading] = useState(true);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const unidadeSelecionadaRef = React.useRef<ClienteUnidade | null>(null);

  // Sync ref with state
  useEffect(() => {
    unidadeSelecionadaRef.current = unidadeSelecionada;
  }, [unidadeSelecionada]);

  // Derivação de Dados
  const activeClientId = unidadeSelecionada?.cliente_id || null;
  const activeClientName = unidadeSelecionada?.cliente
    ? (unidadeSelecionada.cliente.nome_fantasia || unidadeSelecionada.cliente.razao_social)
    : null;
  const activeClientLogo = (unidadeSelecionada?.cliente as any)?.logo_url || null;

  // Efeito para carregar módulos do cliente ativo
  useEffect(() => {
    if (activeClientId) {
      (supabase as any)
        .from('cliente_modulos')
        .select('modulo_slug')
        .eq('cliente_id', activeClientId)
        .eq('ativo', true)
        .then(({ data }: { data: any[] | null }) => {
          setActiveModules(data?.map((m: any) => m.modulo_slug) || []);
        });
    } else {
      setActiveModules([]);
    }
  }, [activeClientId]);

  const fetchUnidades = useCallback(async (isFreshLogin = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMinhasUnidades([]);
        setLoading(false);
        return;
      }

      // 1. Verificar se o usuário é Super Admin (legacy role no profiles)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isSoftwareAdmin = profile?.role === 'super_admin';
      const isCompanyOwner = profile?.role === 'company_owner';
      const isAdminGroup = isSoftwareAdmin || isCompanyOwner;

      let unidadesCarregadas: ClienteUnidade[] = [];

      if (isAdminGroup) {
        // Se for Admin (Global ou de Empresa), busca TODAS as unidades de TODOS os clientes 
        // Nota: Company Owner tecnicamente deveria ver só um cliente, mas mantemos o poder de Admin aqui
        // se o sistema permitir múltiplos. Caso contrário, a query de perfil filtraria.
        const { data: allUnits, error: unitError } = await (supabase as any)
          .from('cliente_unidades')
          .select(`
            id,
            nome_unidade,
            ativo,
            cnae_principal,
            cnpj_completo,
            cliente_id,
            cliente:clientes (
              id,
              razao_social,
              nome_fantasia,
              logo_url
            )
          `);
        
        if (unitError) throw unitError;
        unidadesCarregadas = (allUnits || []).map((u: any) => ({ ...u, _role: 'ADMIN' }));
      } else {
        // Para usuários normais, mantém a lógica de permissões específicas
        const { data, error } = await (supabase as any).from('permissoes_usuario_unidade')
          .select(`
            nivel_acesso,
            unidade:cliente_unidades (
              id,
              nome_unidade,
              ativo,
              cnae_principal,
              cnpj_completo,
              cliente_id,
              cliente:clientes (
                id,
                razao_social,
                nome_fantasia,
                logo_url
              )
            )
          `);

        if (error) throw error;
        unidadesCarregadas = data?.map((p: any) => ({
          ...p.unidade,
          _role: p.nivel_acesso
        })) || [];
      }

      setMinhasUnidades(unidadesCarregadas);
      
      const lastUnitId = localStorage.getItem('nutridev_last_unit_id');

      // LÓGICA DE RESET NO LOGIN: Exclusivo para Super Admin
      // Se for um login fresco, limpa a unidade anterior para iniciar na Central de Controle
      if (isFreshLogin && isSoftwareAdmin) {
        localStorage.removeItem('nutridev_last_unit_id');
        setUnidadeState(null);
        setLoading(false);
        return;
      }

      if (lastUnitId) { // Removida restrição !isSoftwareAdmin para permitir persistência de contexto em Super Admins
        const found = unidadesCarregadas.find((u: ClienteUnidade) => u.id === lastUnitId);
        if (found && found.id !== unidadeSelecionadaRef.current?.id) {
          setUnidadeState(found);
        } else if (!found && unidadesCarregadas.length > 0 && unidadesCarregadas[0].id !== unidadeSelecionadaRef.current?.id && !isSoftwareAdmin) {
          // Para usuários normais, se a unidade anterior não existe, seleciona a primeira.
          // Para Super Admin, se a unidade não existe (ex: trocou de cliente), não força a primeira para evitar saltos inesperados.
          setUnidadeState(unidadesCarregadas[0]);
          localStorage.setItem('nutridev_last_unit_id', unidadesCarregadas[0].id);
        }
      } else if (unidadesCarregadas.length > 0 && !unidadeSelecionadaRef.current && !isSoftwareAdmin) {
        setUnidadeState(unidadesCarregadas[0]);
        localStorage.setItem('nutridev_last_unit_id', unidadesCarregadas[0].id);
      }

    } catch (err) {
      console.error('Erro crítico no ClientContext:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove unidadeSelecionada dependency

  // Inicialização
  useEffect(() => {
    fetchUnidades();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Dispara fetchUnidades e sinaliza se for um evento de LOGIN
      fetchUnidades(event === 'SIGNED_IN');
    });

    return () => { subscription.unsubscribe(); };
  }, [fetchUnidades]);

  const setUnidadeSelecionada = (unidade: ClienteUnidade | null) => {
    setUnidadeState(unidade);
    if (unidade) {
      localStorage.setItem('nutridev_last_unit_id', unidade.id);
    } else {
      localStorage.removeItem('nutridev_last_unit_id');
    }
  };

  const setClient = async (clientId: string) => {
     // Força recarga das unidades do cliente selecionado
     await fetchUnidades();
  };

  const setUnit = (unitId: string) => {
    const found = minhasUnidades.find(u => u.id === unitId);
    if (found) setUnidadeSelecionada(found);
  };

  const exitClientMode = () => {
    setUnidadeState(null);
    localStorage.removeItem('nutridev_last_unit_id');
  };

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleDesktopSidebar = () => setDesktopOpen(!desktopOpen);

  // Modo Sistema é quando o ADMIN não tem unidade selecionada
  const isSystemMode = !unidadeSelecionada;

  return (
    <ClientContext.Provider
      value={{
        unidadeSelecionada,
        unidadeId: unidadeSelecionada?.id || null,
        minhasUnidades,
        loading,
        setUnidadeSelecionada,
        setClient,
        setUnit,
        refreshUnidades: fetchUnidades,
        activeClientId,
        activeClientName,
        activeClientLogo,
        activeModules,
        mobileOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
        desktopOpen,
        toggleDesktopSidebar,
        isSystemMode,
        setSystemMode: (active: boolean) => active ? exitClientMode() : null, // Simplificado para o modo sistema ser o estado sem unidade
        exitClientMode
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient deve ser usado dentro de um ClientProvider');
  }
  return context;
}
