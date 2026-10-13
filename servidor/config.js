// Lê o .env (só no servidor). Os tokens nunca saem daqui para o navegador.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

try {
  process.loadEnvFile(path.join(RAIZ, '.env'));
} catch {
  // Sem .env (ex.: produção com variáveis no painel do host): segue com process.env.
}

const env = process.env;

export default {
  porta: Number(env.PORT) || 3020,
  appUrl: (env.APP_URL || '').replace(/\/$/, ''),
  meta: {
    pixelId: env.META_PIXEL_ID || '',
    token: env.META_CAPI_ACCESS_TOKEN || '',
    testEventCode: env.META_TEST_EVENT_CODE || '',
    apiVersion: env.META_API_VERSION || 'v23.0',
  },
  utmify: {
    pixelId: env.UTMIFY_PIXEL_ID || '',
    token: env.UTMIFY_API_TOKEN || '',
    apiUrl: 'https://api.utmify.com.br/api-credentials/orders',
  },
};
