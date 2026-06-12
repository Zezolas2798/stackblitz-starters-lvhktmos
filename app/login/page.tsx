'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  CssBaseline
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Email, Security } from '@mui/icons-material';
import { useThemeContext } from '@/lib/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { mode } = useThemeContext();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados do Formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Sucesso: Redireciona para o Dashboard
      router.push('/');

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha na autenticação: Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo Zelus */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/zelus-icon-official.svg"
            alt="Zelus Logo"
            width={240}
            height={72}
            priority
            className="zelus-reveal"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Sistema de Gestão & Qualidade
        </Typography>

        <Paper
          elevation={3}
          sx={{
            mt: 4,
            p: 4,
            width: '100%',
            borderRadius: 2,
            borderTop: '4px solid',
            borderColor: 'primary.main'
          }}
        >
          <Typography component="h2" variant="h6" sx={{ mb: 3 }} fontWeight="medium">
            Acesso Restrito
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, fontSize: '0.875rem' }}>
              {errorMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="E-mail Corporativo"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, height: 48, fontWeight: 'bold' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'ENTRAR NO SISTEMA'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Acesso monitorado para fins de auditoria (21 CFR Part 11).
                <br />
                v2.1.0-GxP
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}


