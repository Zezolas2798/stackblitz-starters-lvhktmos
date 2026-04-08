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
  refreshUnidades: () => Promise<void>;
  activeClientId: string | null;
  activeClientName: string | null;
  mobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  desktopOpen: boolean;
  toggleDesktopSidebar: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [unidadeSelecionada, setUnidadeState] = useState<ClienteUnidade | null>(null);
  const [minhasUnidades, setMinhasUnidades] = useState<ClienteUnidade[]>([]);
  const [loading, setLoading] = useState(true);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
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

  const fetchUnidades = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setMinhasUnidades([]);
        setLoading(false);
        return;
      }

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

      const unidadesCarregadas: ClienteUnidade[] = data?.map((p: any) => ({
        ...p.unidade,
        _role: p.nivel_acesso
      })) || [];

      setMinhasUnidades(unidadesCarregadas);

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

  // Inicialização
  useEffect(() => {
    fetchUnidades();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUnidades();
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

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);
  const closeMobileSidebar = () => setMobileOpen(false);
  const toggleDesktopSidebar = () => setDesktopOpen(!desktopOpen);

  return (
    <ClientContext.Provider
      value={{
        unidadeSelecionada,
        unidadeId: unidadeSelecionada?.id || null,
        minhasUnidades,
        loading,
        setUnidadeSelecionada,
        refreshUnidades: fetchUnidades,
        activeClientId,
        activeClientName,
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
