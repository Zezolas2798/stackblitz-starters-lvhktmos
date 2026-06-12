'use client';

import React, { useState } from 'react';
import { useClient } from '@/lib/ClientContext';
import { Button, Menu, MenuItem, Typography, Box, Skeleton, Divider } from '@mui/material';
import { Store, KeyboardArrowDown, Check } from '@mui/icons-material';

export function ClientSelector() {
  const { 
    minhasUnidades, 
    unidadeSelecionada, 
    setUnidadeSelecionada, 
    loading,
    activeClientLogo,
    activeClientId
  } = useClient();

  // Filtra as unidades para mostrar apenas as pertencentes à empresa atual (se houver uma selecionada)
  const unidadesParaMostrar = activeClientId 
    ? minhasUnidades.filter(u => u.cliente_id === activeClientId)
    : minhasUnidades;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSelect = (unidade: any) => {
    setUnidadeSelecionada(unidade);
    handleClose();
  };

  if (loading) {
    return <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />;
  }

  if (!unidadesParaMostrar || unidadesParaMostrar.length === 0) {
    return (
      <Box sx={{ p: 1, bgcolor: '#FEF2F2', color: '#DC2626', borderRadius: 1, border: '1px solid #FECACA' }}>
        <Typography variant="caption" fontWeight="bold">Sem acesso a unidades</Typography>
      </Box>
    );
  }

  return (
    <>
      <Button
        fullWidth
        onClick={handleClick}
        variant="outlined"
        color="inherit"
        endIcon={<KeyboardArrowDown />}
        sx={{ 
          justifyContent: 'space-between', 
          textTransform: 'none', 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          '&:hover': { bgcolor: 'grey.50', borderColor: 'primary.main' }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          {activeClientLogo ? (
            <Box component="img" src={activeClientLogo} sx={{ width: 28, height: 28, borderRadius: 0.5, objectFit: 'contain' }} />
          ) : (
            <Box sx={{ 
              bgcolor: 'primary.light', 
              color: 'primary.main', 
              p: 0.5, 
              borderRadius: 1, 
              display: 'flex' 
            }}>
              <Store fontSize="small" />
            </Box>
          )}
          <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
            <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ lineHeight: 1 }}>
              {unidadeSelecionada?.cliente?.nome_fantasia || 'Cliente'}
            </Typography>
            <Typography variant="body2" fontWeight="bold" noWrap sx={{ lineHeight: 1.2 }}>
              {unidadeSelecionada?.nome_unidade || 'Selecione'}
            </Typography>
          </Box>
        </Box>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: anchorEl?.clientWidth, mt: 1 } }}
      >
        {unidadesParaMostrar.map((unidade) => (
          <MenuItem 
            key={unidade.id} 
            onClick={() => handleSelect(unidade)}
            selected={unidadeSelecionada?.id === unidade.id}
          >
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" fontWeight="medium">{unidade.nome_unidade}</Typography>
                {unidadeSelecionada?.id === unidade.id && <Check fontSize="small" color="primary" />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {unidade.cliente?.nome_fantasia}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}


