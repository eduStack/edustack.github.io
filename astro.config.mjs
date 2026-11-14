import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = { ...loadEnv(process.env.NODE_ENV || 'development', process.cwd(), ''), ...process.env };

// For GitHub Pages project sites set SITE_URL and BASE_PATH in the deploy workflow,
// e.g. SITE_URL=https://<user>.github.io BASE_PATH=/edustack
export default defineConfig({
  output: 'static',
  site: env.SITE_URL || 'http://localhost:4321',
  base: env.BASE_PATH || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
