'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('[Error Boundary Root]', error);
    }, [error]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 3,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 6,
                    maxWidth: 500,
                    textAlign: 'center',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ color: 'error.main', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <AlertTriangle size={64} strokeWidth={1.5} />
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Oops! Algo deu errado
                </Typography>
                <Typography color="text.secondary" paragraph sx={{ mb: 4 }}>
                    Não conseguimos carregar essa página ou ocorreu uma falha instável no sistema.
                    Nossa equipe já registrou o alerta.
                </Typography>

                <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={<RefreshCcw size={20} />}
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
                >
                    Tentar novamente
                </Button>
            </Paper>
        </Box>
    );
}



