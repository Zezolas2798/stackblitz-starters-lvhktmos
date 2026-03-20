import '@testing-library/jest-dom';
import { loadEnvConfig } from '@next/env';

// Simula as variaveis de .env local do next para dentro dos testes vitest
loadEnvConfig(process.cwd());

