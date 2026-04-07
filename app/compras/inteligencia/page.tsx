"use client"

import React, { useState } from 'react'
import { Box, Typography, Container, Tabs, Tab, Paper } from '@mui/material'
import AssessmentIcon from '@mui/icons-material/Assessment'
import CalculateIcon from '@mui/icons-material/Calculate'
import KraljicMatrix from './components/KraljicMatrix'
import ParLevelSetup from './components/ParLevelSetup'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inteligencia-tabpanel-${index}`}
      aria-labelledby={`inteligencia-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `inteligencia-tab-${index}`,
    'aria-controls': `inteligencia-tabpanel-${index}`,
  }
}

export default function InteligenciaSuprimentosPage() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
          Inteligência de Suprimentos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ferramentas avançadas de gestão estratégica da matriz logística e cálculo de ressuprimento diário.
        </Typography>
      </Box>

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="tabs de inteligencia de suprimentos"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 56,
              }
            }}
          >
            <Tab 
              icon={<AssessmentIcon sx={{ mb: 0, mr: 1 }} />} 
              iconPosition="start" 
              label="Matriz Estratégica de Kraljic" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<CalculateIcon sx={{ mb: 0, mr: 1 }} />} 
              iconPosition="start" 
              label="Calculadora de Par Level" 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>

        <Box sx={{ px: 3, pb: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <KraljicMatrix />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <ParLevelSetup />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  )
}
