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
  Toolbar,
  Collapse
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
  AdminPanelSettings,
  ShoppingCart,
  Restaurant,
  EventNote,
  Tag,
  AccountBalance,
  Payments,
  Assessment,
  AttachMoney,
  Inventory2,
  Engineering,
  Category,
  BusinessCenter,
  ExpandLess,
  ExpandMore,
  ListAlt,
  MenuBook,
  PointOfSale
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
  
  // Estado para menus aninhados
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleSubmenu = (menuLabel: string) => {
    setOpenMenus(prev => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

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
          label: 'Planejamento',
          icon: <EventNote />,
          visible: can('production.order.create') || can('nutrition.recipe.view'),
          subItems: [
            {
              label: 'Ordens de Serviço',
              href: '/planejamento',
              icon: <Assignment />,
              visible: can('production.order.create')
            },
            {
              label: 'Gestão de Cardápios (UAN)',
              href: '/uan',
              icon: <MenuBook />,
              visible: can('nutrition.recipe.view'),
              isGroup: true
            },
            {
              label: 'Planejamento Mensal',
              href: '/uan/cardapios',
              icon: <EventNote />,
              visible: can('nutrition.recipe.view')
            },
            {
              label: 'Logística e Compra',
              href: '/uan/lista-compras',
              icon: <LocalShipping />,
              visible: can('nutrition.recipe.view')
            },
            {
              label: 'Relatório de Custos',
              href: '/uan/custos',
              icon: <AttachMoney />,
              visible: can('nutrition.recipe.view')
            }
          ]
        },
        {
          label: 'Produção',
          href: '/producao',
          icon: <Restaurant />,
          // Visível se puder ver separação (Cozinha) ou criar OP
          visible: can('production.picking.view') || can('production.order.create')
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
          label: 'Compras',
          href: '/compras',
          icon: <ShoppingCart />,
          visible: can('stock.balance.view') || can('production.order.create') || can('production.picking.view')
        },
        {
          label: 'Documentos e GED',
          href: '/documentos',
          icon: <Description />,
          visible: can('stock.suppliers.manage')
        },
        {
          label: 'Gestão de Tarefas',
          href: '/operacional/tarefas',
          icon: <Assignment />,
          visible: can('production.picking.view') || can('quality.checklist.execute')
        },
        {
          label: 'Etiquetas',
          href: '/etiquetas',
          icon: <Tag />,
          visible: can('production.picking.view') || can('stock.balance.view')
        },
      ]
    },
    {
      title: 'FORNECEDORES E SERVIÇOS',
      items: [
        {
          label: 'Fornecedores',
          href: '/fornecedores',
          icon: <VerifiedUser />,
          visible: can('stock.suppliers.manage')
        },
        {
          label: 'Serviços',
          href: '/servicos',
          icon: <Engineering />,
          visible: can('stock.suppliers.manage')
        },
      ]
    },
    {
      title: 'GESTÃO FINANCEIRA',
      items: [
        {
          label: 'Dashboard Executivo',
          href: '/financeiro/dashboard',
          icon: <Assessment />,
          visible: can('quality.audit.perform') || can('sys.roles.manage')
        },
        {
          label: 'Vendas e Matriz BCG',
          href: '/financeiro/vendas',
          icon: <AccountBalance />,
          visible: can('quality.audit.perform') || can('sys.roles.manage')
        },
        {
          label: 'Conciliação e Taxas',
          href: '/financeiro/conciliacao',
          icon: <AttachMoney />,
          visible: can('quality.audit.perform') || can('sys.roles.manage')
        },
        {
          label: 'Lançamento de Despesas',
          href: '/financeiro/despesas',
          icon: <Payments />,
          visible: can('quality.audit.perform') || can('sys.roles.manage')
        },
        {
          label: 'Contas a pagar e Vencimentos',
          href: '/financeiro/contas-pagar',
          icon: <EventNote />,
          visible: can('quality.audit.perform') || can('sys.roles.manage')
        },
        {
          label: 'Análise Financeira Estoque',
          href: '/financeiro/estoque',
          icon: <Inventory />,
          visible: can('quality.audit.perform') || can('sys.roles.manage')
        },
      ]
    },
    {
      title: 'TÉCNICO & P&D',
      items: [
        {
          label: 'Receitas & Fichas',
          icon: <RestaurantMenu />,
          visible: can('nutrition.recipe.view'),
          subItems: [
            {
              label: 'Cardápio Ordens de Produção (Indústria)',
              href: '/receitas',
              icon: <ListAlt />,
              visible: can('nutrition.recipe.view')
            },
            {
              label: 'Cardápios UAN (Fichas Técnicas)',
              href: '/uan/fichas',
              icon: <MenuBook />,
              visible: can('nutrition.recipe.view')
            }
          ]
        },
        {
          label: 'Ingredientes',
          href: '/ingredientes',
          icon: <Description />,
          visible: can('nutrition.ingredient.view')
        },
        {
          label: 'Materiais (Embalagem)',
          href: '/materiais',
          icon: <Inventory2 />,
          visible: can('stock.balance.view') // Aproveitando visão de estoque
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
          label: 'Controle Produção',
          href: '/qualidade/controle-producao',
          icon: <Assignment />,
          visible: can('quality.checklist.execute') || can('quality.audit.perform')
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
                  const isMenuActive = item.href ? (pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))) : false;
                  
                  if (item.subItems) {
                    const visibleSubItems = item.subItems.filter((sub: any) => sub.visible);
                    if (visibleSubItems.length === 0) return null;
                    const isSubMenuActive = visibleSubItems.some((sub: any) => pathname === sub.href || (sub.href !== '/' && pathname?.startsWith(sub.href)));
                    const isOpen = openMenus[item.label] || isSubMenuActive;

                    return (
                      <React.Fragment key={item.label}>
                        <ListItem disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => toggleSubmenu(item.label)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon sx={{ color: isSubMenuActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isSubMenuActive ? 600 : 400 }}
                            />
                            {isOpen ? <ExpandLess /> : <ExpandMore />}
                          </ListItemButton>
                        </ListItem>
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding>
                            {visibleSubItems.map((sub: any) => {
                              const isActive = pathname === sub.href || (sub.href !== '/' && pathname?.startsWith(sub.href));
                              return (
                                <ListItem key={sub.href} disablePadding sx={{ mb: 0.5, pl: 3 }}>
                                  <Link href={sub.href} passHref style={{ width: '100%', textDecoration: 'none' }} onClick={closeMobileSidebar}>
                                    <ListItemButton
                                      selected={isActive}
                                      sx={{
                                        borderRadius: 1,
                                        '&.Mui-selected': {
                                          bgcolor: 'primary.light',
                                          color: 'primary.main',
                                        }
                                      }}
                                    >
                                      {sub.icon && (
                                        <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit', minWidth: 32 }}>
                                          {sub.icon}
                                        </ListItemIcon>
                                      )}
                                      <ListItemText
                                        primary={sub.label}
                                        primaryTypographyProps={{ 
                                          fontSize: '0.8rem', 
                                          fontWeight: isActive ? 600 : 400,
                                          color: sub.isGroup ? 'text.secondary' : 'inherit',
                                          textTransform: sub.isGroup ? 'uppercase' : 'none',
                                          letterSpacing: sub.isGroup ? 0.5 : 0
                                        }}
                                      />
                                    </ListItemButton>
                                  </Link>
                                </ListItem>
                              );
                            })}
                          </List>
                        </Collapse>
                      </React.Fragment>
                    );
                  }

                  return (
                    <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
                      <Link href={item.href!} passHref style={{ width: '100%', textDecoration: 'none' }} onClick={closeMobileSidebar}>
                        <ListItemButton
                          selected={isMenuActive}
                          sx={{
                            borderRadius: 1,
                            '&.Mui-selected': {
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.light' }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ color: isMenuActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: isMenuActive ? 600 : 400 }}
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


