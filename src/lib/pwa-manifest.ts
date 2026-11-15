import type { Lang } from '../i18n/languages';

export function manifest(lang: Lang, baseUrl: string) {
  const base = baseUrl.replace(/\/$/, '');
  return {
    id: `${base}/`,
    name: 'eduStack',
    short_name: 'eduStack',
    description: lang === 'zh' ? '有出处的家庭教育阅读与实用工具。' : 'Thoughtful parenting reading and practical tools, with sources.',
    lang: lang === 'zh' ? 'zh-Hans' : 'en',
    start_url: `${base}/${lang === 'zh' ? 'zh/' : ''}`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#faf7f0',
    theme_color: '#faf7f0',
    icons: [192, 512].map((size) => ({
      src: `${base}/icons/app-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any maskable',
    })),
  };
}
