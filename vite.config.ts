import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { challenges, modules } from './src/content/catalog.ts';
import { validateCatalog } from './src/content/schema.ts';

validateCatalog(challenges, modules);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'social-metadata',
      transformIndexHtml(html) {
        if (!process.env.SITE_URL) return html;
        const origin = new URL(process.env.SITE_URL);
        if (origin.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS');
        return html
          .replace(
            'content="/social-preview.png"',
            `content="${new URL('/social-preview.png', origin).href}"`,
          )
          .replace('</head>', `<meta property="og:url" content="${origin.origin}/" /></head>`);
      },
    },
  ],
  build: { cssMinify: 'esbuild' },
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    fileParallelism: false,
    pool: 'threads',
  },
});
