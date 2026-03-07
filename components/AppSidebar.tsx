'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClient } from '@/lib/ClientContext';
import { supabase } from '@/lib/supabaseClient';
import { ClientSelector } from './ClientSelector';
// IMPORTANTE: Conectando o cérebro de permissões
import { usePermission } from '@/hooks/usePermission';
import Image from 'next/image';
import { useThemeContext } from '@/lib/ThemeContext';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
  Button,
  Skeleton,
  Toolbar
} from '@mui/material';

// Ícones Material UI
import {
  Dashboard,
  RestaurantMenu,
  Inventory,
  Assignment,
  VerifiedUser,
  Description,
  Settings,
  Close,
  TrendingUp,
  ExitToApp,
  LocalShipping,
  AdminPanelSettings
} from '@mui/icons-material';

interface AppSidebarProps {
  width: number;
}

export function AppSidebar({ width }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, toggleMobileSidebar, closeMobileSidebar, desktopOpen } = useClient();
  const { mode } = useThemeContext();

  // Hook de Permissões: Traz o poder de decisão para o menu
  const { can, loading: loadingPermissions } = usePermission();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      closeMobileSidebar();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // DEFINIÇÃO INTELIGENTE DO MENU
  // Cada item agora pergunta: "Eu sou visível para este usuário?"
  const menuGroups = [
    {
      title: 'OPERACIONAL',
      items: [
        {
          label: 'Dashboard',
          href: '/',
          icon: <Dashboard />,
          visible: true // Público
        },
        {
          label: 'Produção',
          href: '/producao',
          icon: <TrendingUp />,
          // Visível se puder criar OP (Nutri) OU ver separação (Estoque/Chef)
          visible: can('production.order.create') || can('production.picking.view')
        },
        {
          label: 'Recebimento de Entrada',
          href: '/estoque/entrada',
          icon: <LocalShipping />,
          visible: can('stock.balance.view') // Permissão de estoque mantida
        },
        {
          label: 'Estoque e Prazos',
          href: '/estoque',
          icon: <Inventory />,
          visible: can('stock.balance.view')
        },
        {
          label: 'Documentos e GED',
          href: '/documentos',
          icon: <Description />,
          visible: can('stock.suppliers.manage') // Pode ser refeito p/ admin depois
        },
        {
          label: 'Gestão de Tarefas',
          href: '/operacional/tarefas',
          icon: <Assignment />,
          visible: can('production.picking.view') || can('quality.checklist.execute')
        },
      ]
    },
    {
      title: 'TÉCNICO & P&D',
      items: [
        {
          label: 'Receitas',
          href: '/receitas',
          icon: <RestaurantMenu />,
          visible: can('nutrition.recipe.view')
        },
        {
          label: 'Ingredientes',
          href: '/ingredientes',
          icon: <Description />,
          visible: can('nutrition.ingredient.view')
        },
      ]
    },
    {
      title: 'QUALIDADE (GxP)',
      items: [
        {
          label: 'Certificações (SIVISA)',
          href: '/certificacoes',
          icon: <VerifiedUser />,
          visible: can('quality.audit.perform') || can('quality.action_plan.manage')
        },
        {
          label: 'Auditorias',
          href: '/qualidade',
          icon: <Assignment />,
          // Visível se puder auditar (Nutri) OU preencher checklist (Chef)
          visible: can('quality.audit.perform') || can('quality.checklist.execute')
        },
        {
          label: 'Modelos',
          href: '/qualidade/modelos',
          icon: <VerifiedUser />,
          visible: can('quality.action_plan.manage') // Geralmente Nutri/Gestor
        },
        {
          label: 'Relatórios',
          href: '/relatorios',
          icon: <Description />,
          visible: can('quality.audit.perform')
        },
      ]
    },
    {
      title: 'SISTEMA',
      items: [
        {
          label: 'Configurações',
          href: '/config',
          icon: <Settings />,
          visible: true // Configs básicas (perfil) liberadas
        },
        {
          label: 'Cargos & Acessos',
          href: '/config/cargos',
          icon: <AdminPanelSettings />,
          // A PROVA DE FOGO: Só Gestor vê isso agora!
          visible: can('sys.roles.manage')
        },
        {
          label: 'Modelos de Tarefa',
          href: '/config/tarefas/modelos',
          icon: <Settings />,
          visible: can('sys.roles.manage')
        },
      ]
    }
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Spacer para Desktop (compensar Header fixo) e Fechar Mobile */}
      <Toolbar sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end', px: 1 }}>
        <IconButton onClick={closeMobileSidebar}>
          <Close />
        </IconButton>
      </Toolbar>
      <Toolbar sx={{ display: { xs: 'none', md: 'flex' } }} />
      <Divider />

      {/* Seletor de Unidade */}
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <ClientSelector />
      </Box>
      <Divider />

      {/* Menu Principal com Skeleton Loading */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
        {loadingPermissions ? (
          // Efeito visual enquanto carrega as permissões (evita "pulo" na tela)
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={40} />
          </Box>
        ) : (
          menuGroups.map((group, idx) => {
            // Filtra os itens visíveis
            const visibleItems = group.items.filter(item => item.visible);

            // Se o grupo ficar vazio (ex: Estoquista não vê nada de 'TÉCNICO'), esconde o título também
            if (visibleItems.length === 0) return null;

            return (
              <Box key={idx} sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 'bold', display: 'block', letterSpacing: 1 }}>
                  {group.title}
                </Typography>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

                  return (
                    <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                      <Link href={item.href} passHref style={{ width: '100%', textDecoration: 'none' }} onClick={closeMobileSidebar}>
                        <ListItemButton
                          selected={isActive}
                          sx={{
                            borderRadius: 1,
                            '&.Mui-selected': {
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.light' }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isActive ? 600 : 400 }}
                          />
                        </ListItemButton>
                      </Link>
                    </ListItem>
                  );
                })}
              </Box>
            );
          })
        )}
      </List>

      {/* Rodapé */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<ExitToApp />}
          onClick={handleLogout}
          sx={{ mb: 1, textTransform: 'none', fontWeight: 'bold' }}
        >
          Sair do Sistema
        </Button>
        <Typography variant="caption" display="block" align="center" color="text.secondary">
          Versão 4.0 (RBAC Ativo)
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{
      width: { md: desktopOpen ? width : 0 },
      flexShrink: { md: 0 },
      overflowX: 'hidden',
      transition: 'width 0.225s cubic-bezier(0.4, 0, 0.6, 1) 0ms'
    }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleMobileSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: width },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="persistent"
        open={desktopOpen}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
            borderRight: '1px solid #e0e0e0',
            transition: 'transform 0.225s cubic-bezier(0.4, 0, 0.6, 1) 0ms'
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}