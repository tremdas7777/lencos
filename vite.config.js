import { defineConfig } from 'vite';

// Site estático: css/, js/, img/ e video/ ficam em public/ e são copiados como estão.
export default defineConfig({
  server: { host: '::', port: 8080 },
  build: {
    rollupOptions: { input: { index: 'index.html', checkout: 'checkout.html' } },
  },
});
