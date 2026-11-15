import { manifest } from '../../lib/pwa-manifest';

export const GET = () => new Response(JSON.stringify(manifest('zh', import.meta.env.BASE_URL)), {
  headers: { 'Content-Type': 'application/manifest+json' },
});
