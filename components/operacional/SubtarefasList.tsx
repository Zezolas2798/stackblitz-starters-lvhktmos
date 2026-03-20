'use client';

import React from 'react';
import { 
  Stack, 
  Checkbox, 
  TextField, 
  IconButton, 
  Typography, 
  Box, 
  Button // <--- ADICIONADO: Importação que estava faltando
} from '@mui/material';
import { Trash2, Plus } from 'lucide-react';

interface Subtarefa {
  id?: string;
  titulo: string;
  concluida: boolean;
}

interface SubtarefasListProps {
  items: Subtarefa[];
  onChange: (items: Subtarefa[]) => void;
  isEditable?: boolean; // Se false, apenas mostra o checklist para marcar/desmarcar
}

export function SubtarefasList({ items, onChange, isEditable = true }: SubtarefasListProps) {
  
  const addSubtarefa = () => {
    // Garante que items é um array antes de espalhar
    const currentItems = Array.isArray(items) ? items : [];
    onChange([...currentItems, { titulo: '', concluida: false }]);
  };
  
  const updateSubtarefa = (index: number, field: keyof Subtarefa, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeSubtarefa = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        CHECKLIST DE EXECUÇÃO
      </Typography>
      <Stack spacing={1}>
        {Array.isArray(items) && items.map((item, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <Checkbox 
              size="small" 
              checked={item.concluida} 
              onChange={(e) => updateSubtarefa(index, 'concluida', e.target.checked)} 
              disabled={!isEditable && false} // Permite marcar mesmo se não for editável o texto (opcional)
            />
            {isEditable ? (
              <TextField
                fullWidth
                variant="standard"
                placeholder="Ex: Verificar vedação da borracha"
                value={item.titulo}
                onChange={(e) => updateSubtarefa(index, 'titulo', e.target.value)}
                sx={{ '& .MuiInput-root': { fontSize: '0.875rem' } }}
              />
            ) : (
              <Typography variant="body2" sx={{ textDecoration: item.concluida ? 'line-through' : 'none', color: item.concluida ? 'text.disabled' : 'text.primary' }}>
                {item.titulo}
              </Typography>
            )}
            {isEditable && (
              <IconButton size="small" onClick={() => removeSubtarefa(index)}>
                <Trash2 size={16} />
              </IconButton>
            )}
          </Stack>
        ))}
        
        {isEditable && (
          <Button 
            startIcon={<Plus size={16} />} 
            onClick={addSubtarefa} 
            sx={{ alignSelf: 'flex-start', mt: 1, fontSize: '0.75rem', textTransform: 'none' }}
          >
            Adicionar Item
          </Button>
        )}
      </Stack>
    </Box>
  );
}


