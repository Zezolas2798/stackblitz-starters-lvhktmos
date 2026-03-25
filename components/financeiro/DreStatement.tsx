import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, IconButton, Collapse, Box, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export interface DreNode {
  id: string;
  name: string;
  value: number;
  percentage?: number; // Representação em relação à Receita Bruta (100%)
  isTotal?: boolean;
  children?: DreNode[];
}

interface DreStatementProps {
  data: DreNode[];
}

function DreRow({ node, level = 0 }: { node: DreNode; level?: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatPercent = (val?: number) => {
    if (val === undefined) return '';
    return `${val.toFixed(1)}%`;
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: node.isTotal ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
        <TableCell sx={{ pl: level * 4 + 2 }}>
          <Box display="flex" alignItems="center">
            {hasChildren ? (
              <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)} sx={{ mr: 1 }}>
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            ) : (
              <Box sx={{ width: 28, mr: 1 }} /> // Spacer for alignment
            )}
            <Typography variant={node.isTotal ? 'subtitle2' : 'body2'} fontWeight={node.isTotal ? 'bold' : 'normal'}>
              {node.name}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="right">
          <Typography variant={node.isTotal ? 'subtitle2' : 'body2'} fontWeight={node.isTotal ? 'bold' : 'normal'} color={node.value < 0 ? 'error.main' : 'text.primary'}>
            {formatCurrency(node.value)}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" color="text.secondary">
            {formatPercent(node.percentage)}
          </Typography>
        </TableCell>
      </TableRow>
      {hasChildren && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Table size="small" aria-label="dre-children">
                <TableBody>
                  {node.children!.map((child) => (
                    <DreRow key={child.id} node={child} level={level + 1} />
                  ))}
                </TableBody>
              </Table>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function DreStatement({ data }: DreStatementProps) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Conta (USAR)</TableCell>
          <TableCell align="right">Valor (R$)</TableCell>
          <TableCell align="right">AV (%)</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((node) => (
          <DreRow key={node.id} node={node} />
        ))}
      </TableBody>
    </Table>
  );
}
