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
import { alpha, useTheme } from '@mui/material/styles';

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
  PointOfSale,
  CorporateFare,
  GppGood
} from '@mui/icons-material';

interface AppSidebarProps {
  width: number;
}

export function AppSidebar({ width }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mobileOpen, toggleMobileSidebar, closeMobileSidebar, desktopOpen } = useClient();
  const { mode } = useThemeContext();
  const theme = useTheme();

  // Hook de Permissões: Traz o poder de decisão para o menu
  const { can, loading: loadingPermissions } = usePermission();

  // Estado para menus aninhados
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  const toggleSubmenu = (menuLabel: string) => {
    setOpenMenus(prev => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

  // Efeito Especial: Auto-expandir ao trocar de rota, mas permitir fechar manualmente
  React.useEffect(() => {
    const newOpenMenus = { ...openMenus };
    let hasChanges = false;

    menuGroups.forEach(group => {
      if (group.subItems) {
        const isActive = group.subItems.some(sub =>
          pathname === sub.href || (sub.href && sub.href !== '/' && pathname?.startsWith(sub.href!)) ||
          (sub.subItems && sub.subItems.some((s: any) => pathname === s.href || (s.href && s.href !== '/' && pathname?.startsWith(s.href!))))
        );
        if (isActive && group.label && !openMenus[group.label as string]) {
          newOpenMenus[group.label as string] = true;
          hasChanges = true;
        }
      }
      // Checar sub-menus internos tbm
      if (group.subItems) {
        group.subItems.forEach((sub: any) => {
          if (sub.subItems) {
            const isSubActive = sub.subItems.some((s: any) => pathname === s.href || (s.href && s.href !== '/' && pathname?.startsWith(s.href!)));
            if (isSubActive && sub.label && !openMenus[sub.label as string]) {
              newOpenMenus[sub.label as string] = true;
              hasChanges = true;
            }
          }
        });
      }
    });

    if (hasChanges) {
      setOpenMenus(newOpenMenus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      closeMobileSidebar();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // DEFINIÇÃO CONSOLIDADA EM 8 DEPARTAMENTOS
  const menuGroups = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <Dashboard />,
      visible: true
    },
    {
      label: 'Financeiro',
      icon: <AccountBalance />,
      visible: can('finance.view') || can('finance.cashflow.view'),
      subItems: [
        {
          label: 'Dashboard Financeiro',
          href: '/financeiro/dashboard',
          icon: <Assessment />,
          visible: can('finance.view')
        },
        {
          label: 'Vendas & Faturamento',
          href: '/financeiro/vendas',
          icon: <PointOfSale />,
          visible: can('finance.view')
        },
        {
          label: 'Lançamento de Despesas',
          href: '/financeiro/despesas',
          icon: <Payments />,
          visible: can('finance.view')
        },
        {
          label: 'Contas a Pagar',
          href: '/financeiro/contas-pagar',
          icon: <AttachMoney />,
          visible: can('finance.view')
        },
        {
          label: 'Conciliação Bancária',
          href: '/financeiro/conciliacao',
          icon: <AccountBalance />,
          visible: can('finance.view')
        },
        {
          label: 'Valor em Estoque',
          href: '/financeiro/estoque',
          icon: <TrendingUp />,
          visible: can('finance.view')
        }
      ]
    },
    {
      label: 'Compras',
      icon: <ShoppingCart />,
      visible: can('stock.orders.manage'),
      subItems: [
        {
          label: 'Inteligência de Suprimentos',
          href: '/compras/inteligencia',
          icon: <Assessment />,
          visible: can('stock.orders.manage')
        },
        {
          label: 'Planejamento de Compras',
          href: '/compras',
          icon: <Assignment />,
          visible: can('stock.orders.manage')
        },
        {
          label: 'Orçamentos de Fornecedores',
          href: '/compras/orcamentos',
          icon: <AttachMoney />,
          visible: can('stock.orders.manage')
        },
        {
          label: 'Lançamento de Notas',
          href: '/compras/lancamentos',
          icon: <Description />,
          visible: can('stock.orders.manage')
        }
      ]
    },
    {
      label: 'Estoque',
      icon: <Inventory />,
      visible: can('stock.balance.view'),
      subItems: [
        {
          label: 'Estoque',
          href: '/estoque',
          icon: <Category />,
          visible: can('stock.balance.view')
        },
        {
          label: 'Recebimento (Entrada)',
          href: '/estoque/entrada',
          icon: <LocalShipping />,
          visible: can('stock.balance.view')
        },
        {
          label: 'Etiquetas',
          href: '/etiquetas',
          icon: <Tag />,
          visible: can('stock.balance.view')
        }
      ]
    },
    {
      label: 'Qualidade',
      icon: <VerifiedUser />,
      visible: can('nutrition.recipe.view') || can('quality.audit.perform'),
      subItems: [
        {
          label: 'Central de Consultoria',
          href: '/consultoria',
          icon: <GppGood />,
          visible: true
        },
        {
          label: 'Insumos e Materiais',
          icon: <Inventory2 />,
          visible: can('nutrition.recipe.view'),
          subItems: [
            { label: 'Ingredientes', href: '/ingredientes', visible: true },
            { label: 'Materiais e Embalagens', href: '/materiais', visible: true }
          ]
        },
        {
          label: 'Fichas Técnicas',
          icon: <RestaurantMenu />,
          visible: can('nutrition.recipe.view'),
          subItems: [
            { label: 'Módulo Industrial', href: '/receitas', visible: true },
            { label: 'Módulo UAN', href: '/uan/fichas', visible: true }
          ]
        },
        {
          label: 'Auditorias & Checklists',
          icon: <Assignment />,
          visible: can('quality.audit.perform'),
          subItems: [
            { label: 'Realizar Inspeção', href: '/qualidade', visible: true },
            { label: 'Controle de Produção', href: '/qualidade/controle-producao', visible: true },
            { label: 'Modelos de Checklist', href: '/qualidade/modelos', visible: true }
          ]
        }
      ]
    },
    {
      label: 'Documentos',
      icon: <Description />,
      visible: true,
      subItems: [
        {
          label: 'Central de Documentos',
          href: '/documentos',
          icon: <Description />,
          visible: true
        },
        {
          label: 'Relatórios & BI',
          icon: <Assessment />,
          visible: true,
          subItems: [
            { label: 'Painel Geral', href: '/relatorios', visible: true },
            { label: 'Desempenho da Equipe', href: '/relatorios/desempenho', visible: true },
            { label: 'Fichas e Impressos', href: '/relatorios/receitas', visible: true }
          ]
        },
        {
          label: 'Certificações SIVISA',
          href: '/certificacoes',
          icon: <VerifiedUser />,
          visible: true
        }
      ]
    },
    {
      label: 'Planejamento',
      icon: <EventNote />,
      visible: can('production.order.create') || can('nutrition.menu.manage'),
      subItems: [
        {
          label: '🤝 Comercial',
          icon: <BusinessCenter />,
          visible: can('production.order.create'),
          subItems: [
            { label: 'Ordens de Serviço (OP)', href: '/planejamento', visible: true }
          ]
        },
        {
          label: '🥗 UAN',
          icon: <Restaurant />,
          visible: can('nutrition.menu.manage'),
          subItems: [
            { label: 'Cardápio Mensal', href: '/uan/cardapios', visible: true },
            { label: 'Previsão de Custos', href: '/uan/lista-compras', visible: true }
          ]
        }
      ]
    },
    {
      label: 'Operação',
      icon: <Engineering />,
      visible: can('production.order.execute') || can('sys.tasks.manage'),
      subItems: [
        {
          label: 'Módulo de Produção',
          href: '/producao',
          icon: <Restaurant />,
          visible: can('production.order.execute')
        },
        {
          label: 'Gestão de Tarefas',
          href: '/operacional/tarefas',
          icon: <Assignment />,
          visible: can('sys.tasks.manage')
        },
        {
          label: 'Modelos de Tarefas',
          href: '/config/tarefas/modelos',
          icon: <ListAlt />,
          visible: can('sys.tasks.manage')
        }
      ]
    },
    {
      label: 'Sistema',
      icon: <Settings />,
      visible: true,
      subItems: [
        {
          label: 'Unidades & Filiais',
          href: '/config/unidades',
          icon: <CorporateFare />,
          visible: true
        },
        {
          label: 'Categorias do Sistema',
          href: '/config/categorias',
          icon: <Category />,
          visible: true
        },
        {
          label: 'Parâmetros de Estoque',
          href: '/config/estoque',
          icon: <Inventory2 />,
          visible: true
        },
        {
          label: 'Cadastro de Fornecedores',
          href: '/fornecedores',
          icon: <VerifiedUser />,
          visible: can('stock.suppliers.manage')
        },
        {
          label: 'Cadastro de Serviços',
          href: '/servicos',
          icon: <Engineering />,
          visible: true
        },
        {
          label: 'Cargos & Permissões',
          href: '/config/cargos',
          icon: <AdminPanelSettings />,
          visible: can('sys.roles.manage')
        },
        {
          label: 'Visualização Mobile',
          href: '/preview',
          icon: <Tag />, // Usando um ícone temporário, talvez 'Phonelink' fosse melhor se disponível
          visible: true
        }
      ]
    },
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
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1, mt: 2 }}>
        {loadingPermissions ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="40%" sx={{ mb: 1 }} />
            <Skeleton variant="rounded" height={40} />
          </Box>
        ) : (
          menuGroups.map((group) => {
            if (!group.visible) return null;

            const isMenuActive = group.href ? (pathname === group.href || (group.href !== '/' && pathname?.startsWith(group.href))) : false;

            if (group.subItems) {
              const visibleSubItems = group.subItems.filter((sub: any) => sub.visible);
              if (visibleSubItems.length === 0) return null;

              const isAnySubActive = visibleSubItems.some((sub: any) =>
                pathname === sub.href ||
                (sub.href && sub.href !== '/' && pathname?.startsWith(sub.href!)) ||
                (sub.subItems && sub.subItems.some((s: any) => pathname === s.href || (s.href && s.href !== '/' && pathname?.startsWith(s.href!))))
              );

              const isOpen = openMenus[group.label];

              return (
                <React.Fragment key={group.label}>
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => toggleSubmenu(group.label)}
                      selected={isAnySubActive}
                      sx={{
                        borderRadius: 1,
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          color: 'primary.main',
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: isAnySubActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                        {group.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={group.label}
                        primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isAnySubActive ? 700 : 500 }}
                      />
                      {isOpen ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {visibleSubItems.map((sub: any) => {
                        if (sub.subItems) {
                          // RECURSÃO PARA LEVEL 3
                          const visibleDeepItems = sub.subItems.filter((s: any) => s.visible);
                          const isDeepActive = visibleDeepItems.some((s: any) => pathname === s.href || (s.href && s.href !== '/' && pathname?.startsWith(s.href!)));
                          const isDeepOpen = openMenus[sub.label];

                          return (
                            <React.Fragment key={sub.label}>
                              <ListItem disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton onClick={() => toggleSubmenu(sub.label)} sx={{ borderRadius: 1 }}>
                                  <ListItemIcon sx={{ color: isDeepActive ? 'primary.main' : 'inherit', minWidth: 32 }}>
                                    {sub.icon}
                                  </ListItemIcon>
                                  <ListItemText primary={sub.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: isDeepActive ? 600 : 400 }} />
                                  {isDeepOpen ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                              </ListItem>
                              <Collapse in={isDeepOpen} timeout="auto" unmountOnExit>
                                <List disablePadding sx={{ pl: 3 }}>
                                  {visibleDeepItems.map((deep: any) => {
                                    const isA = pathname === deep.href || (deep.href !== '/' && pathname?.startsWith(deep.href));
                                    return (
                                      <ListItem key={deep.href} disablePadding sx={{ mb: 0.5 }}>
                                        <Link href={deep.href!} passHref style={{ width: '100%', textDecoration: 'none' }} onClick={closeMobileSidebar}>
                                          <ListItemButton selected={isA} sx={{ borderRadius: 1 }}>
                                            <ListItemText primary={deep.label} primaryTypographyProps={{ fontSize: '0.8rem', color: isA ? 'primary.main' : 'text.secondary' }} />
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

                        const isActive = pathname === sub.href || (sub.href && sub.href !== '/' && pathname?.startsWith(sub.href!));
                        return (
                          <ListItem key={sub.href || sub.label} disablePadding sx={{ mb: 0.5 }}>
                            <Link href={sub.href!} passHref style={{ width: '100%', textDecoration: 'none' }} onClick={closeMobileSidebar}>
                              <ListItemButton
                                selected={isActive}
                                sx={{
                                  borderRadius: 1,
                                  '&.Mui-selected': {
                                    bgcolor: 'transparent',
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
                                    fontSize: '0.85rem',
                                    fontWeight: isActive ? 600 : 400
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
              <ListItem key={group.href || group.label} disablePadding sx={{ mb: 0.5 }}>
                <Link href={group.href!} passHref style={{ width: '100%', textDecoration: 'none' }} onClick={closeMobileSidebar}>
                  <ListItemButton
                    selected={isMenuActive}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12) }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: isMenuActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                      {group.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={group.label}
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isMenuActive ? 700 : 500 }}
                    />
                  </ListItemButton>
                </Link>
              </ListItem>
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


