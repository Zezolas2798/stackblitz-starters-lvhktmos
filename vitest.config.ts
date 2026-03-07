import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Carrega variáveis do arquivo .env.local se existir
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [react()],
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./vitest.setup.ts'],
            alias: {
                '@': path.resolve(__dirname, './'),
            },
            env: {
                ...env,
            }
        },
    };
});
