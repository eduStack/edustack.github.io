import { manifest } from '../lib/pwa-manifest';

export const GET = () => new Response(JSON.stringify(manifest('en', import.meta.env.BASE_URL)), {
  headers: { 'Content-Type': 'application/manifest+json' },
});
