'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Box,
  Typography,
  Divider,
  Button
} from '@mui/material';
import { X, Settings, Layers, Scale } from 'lucide-react';
import PerfisCardapioTab from './PerfisCardapioTab';
import RegrasVariedadeTab from './RegrasVariedadeTab';

interface ConfiguracoesGeraisUANDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`uan-config-tabpanel-${index}`}
      aria-labelledby={`uan-config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ConfiguracoesGeraisUANDialog({ open, onClose }: ConfiguracoesGeraisUANDialogProps) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Settings size={22} />
          <Typography variant="h6" fontWeight="bold">Configurações Gerais da UAN</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="UAN configuration tabs"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                label="Perfis e Templates" 
                icon={<Layers size={18} />} 
                iconPosition="start" 
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              />
              <Tab 
                label="Regras e Restrições" 
                icon={<Scale size={18} />} 
                iconPosition="start" 
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              />
            </Tabs>
          </Box>
          
          <Box sx={{ px: 3 }}>
            <CustomTabPanel value={activeTab} index={0}>
              <PerfisCardapioTab />
            </CustomTabPanel>
            <CustomTabPanel value={activeTab} index={1}>
              <RegrasVariedadeTab />
            </CustomTabPanel>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
