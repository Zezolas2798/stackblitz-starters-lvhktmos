'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ClienteUnidade } from './types';

// Tipagem do Contexto
interface ClientContextType {
  // --- GESTÃO DE ACESSO (CORE GxP) ---
  unidadeSelecionada: ClienteUnidade | null; // A unidade física onde o usuário está trabalhando
  unidadeId: string | null; // Atalho rápido para ID

  // Lista de todas as unidades que este usuário tem permissão de acessar
  minhasUnidades: ClienteUnidade[];
  loading: boolean;

  // --- AÇÕES ---
  setUnidadeSelecionada: (unidade: ClienteUnidade | null) => void;
  refreshUnidades: () => Promise<void>;

  // --- COMPATIBILIDADE (LAYOUT & LEGADO) ---
  // Mantemos 'activeClientId' para não quebrar componentes antigos que dependem disso
  activeClientId: string | null;
  activeClientName: string | null;

  // Controle do Sidebar Mobile (Preservado do original)
  mobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  // Controle do Sidebar Desktop (Retrátil)
  desktopOpen: boolean;
  toggleDesktopSidebar: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  // 1. Estados de Dados
  const [unidadeSelecionada, setUnidadeState] = useState<ClienteUnidade | null>(null);
  const [minhasUnidades, setMinhasUnidades] = useState<ClienteUnidade[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Estados de UI (Sidebar)
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const unidadeSelecionadaRef = React.useRef<ClienteUnidade | null>(null);

  // Sync ref with state
  useEffect(() => {
    unidadeSelecionadaRef.current = unidadeSelecionada;
  }, [unidadeSelecionada]);

  // 8. Derivação de Dados (Helpers de Compatibilidade) - Moved up to avoid TDZ
  const activeClientId = unidadeSelecionada?.cliente_id || null;
  const activeClientName = unidadeSelecionada?.cliente
    ? (unidadeSelecionada.cliente.nome_fantasia || unidadeSelecionada.cliente.razao_social)
    : null;

  // 3. Função Core: Buscar Permissões e Unidades no Supabase
  const fetchUnidades = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMinhasUnidades([]);
        setLoading(false);
        return;
      }

      // Query GxP: Busca na tabela de permissões fazendo JOIN com Unidades e Clientes
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
              nome_fantasia
            )
          )
        `);

      if (error) {
        console.error('Erro ao buscar unidades:', error);
        setLoading(false);
        return;
      }

      // Mapeamento para limpar a estrutura
      const unidadesCarregadas: ClienteUnidade[] = data?.map((p: any) => ({
        ...p.unidade,
        _role: p.nivel_acesso
      })) || [];

      setMinhasUnidades(unidadesCarregadas);

      // 4. Lógica de Persistência Inteligente
      const lastUnitId = localStorage.getItem('nutridev_last_unit_id');

      if (lastUnitId) {
        const found = unidadesCarregadas.find(u => u.id === lastUnitId);
        if (found && found.id !== unidadeSelecionadaRef.current?.id) {
          setUnidadeState(found);
        } else if (!found && unidadesCarregadas.length > 0 && unidadesCarregadas[0].id !== unidadeSelecionadaRef.current?.id) {
          setUnidadeState(unidadesCarregadas[0]);
          localStorage.setItem('nutridev_last_unit_id', unidadesCarregadas[0].id);
        }
      } else if (unidadesCarregadas.length > 0 && !unidadeSelecionadaRef.current) {
        setUnidadeState(unidadesCarregadas[0]);
        localStorage.setItem('nutridev_last_unit_id', unidadesCarregadas[0].id);
      }

    } catch (err) {
      console.error('Erro crítico no ClientContext:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove unidadeSelecionada dependency

  // 5. Inicialização
  useEffect(() => {
    fetchUnidades();

    // Recarrega se o usuário fizer logout/login em outra aba
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUnidades();
    });

    return () => { subscription.unsubscribe(); };
  }, [fetchUnidades]);

  // 6. Wrapper para troca de unidade com persistência
  const setUnidadeSelecionada = (unidade: ClienteUnidade | null) => {
    setUnidadeState(unidade);
    if (unidade) {
      localStorage.setItem('nutridev_last_unit_id', unidade.id);
    } else {
      localStorage.removeItem('nutridev_last_unit_id');
    }
  };

  // 7. Funções de Layout (Mobile & Desktop)
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleDesktopSidebar = () => setDesktopOpen(!desktopOpen);

  return (
    <ClientContext.Provider
      value={{
        // Estado Principal
        unidadeSelecionada,
        unidadeId: unidadeSelecionada?.id || null,
        minhasUnidades,
        loading,
        setUnidadeSelecionada,
        refreshUnidades: fetchUnidades,

        // Compatibilidade Legado
        activeClientId,
        activeClientName,

        // Layout
        mobileOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
        desktopOpen,
        toggleDesktopSidebar
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


