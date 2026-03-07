import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading() {
    // You can add any UI inside Loading, including a Skeleton.
    return (
        <Box
            sx={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
            }}
        >
            <CircularProgress size={48} thickness={4} sx={{ color: 'primary.main', mb: 3 }} />
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, animation: 'pulse 1.5s infinite' }}>
                Carregando recursos...
            </Typography>

            <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
        </Box>
    );
}
