import type { Lang } from '../lib/data';

export const ui = {
  en: {
    siteName: 'Edustack',
    tagline: 'Parenting resources with sources',
    nav: { home: 'Home', stages: 'By age', topics: 'Topics', educators: 'Educators', me: 'My child', library: 'Library', tools: 'Free tools' },
    langName: 'English', otherLang: '简体中文',
    type: { book: 'Classic book', guideline: 'Guideline', research: 'Research' },
    typePlural: { book: 'Classic books', guideline: 'Guidelines', research: 'Research' },
    evidence: { guideline: 'Official guideline', large: 'Large study or review', small: 'Small study', expert: 'Expert opinion' },
    evidenceLabel: 'Evidence',
    design: { 'meta-analysis': 'Meta-analysis', review: 'Review', trial: 'Randomised trial', cohort: 'Long-term cohort study', experiment: 'Experiment', observational: 'Observational study', 'cross-sectional': 'Single-time study', 'large-dataset': 'Large dataset analysis' },
    area: { social: 'Social and emotional', emotional: 'Feelings', language: 'Language', thinking: 'Thinking and learning', movement: 'Movement', identity: 'Identity', body: 'Body' },
    blocks: { develop: 'What your child is developing', together: 'What you can do together', health: 'Health and safety essentials', reading: 'Further reading', roots: 'Idea roots' },
    source: 'Source',
    behind: 'The research behind it',
    details: 'Details',
    footerTitle: 'Open source · No ads · No submissions',
    footerBody: 'Edustack writes no original advice. Every resource is chosen by our editors and links to its original source, with the author or publisher, year and the date we last checked it. For information only, not a substitute for advice from a doctor or other professional.',
    whatWeInclude: 'Why you can trust us',
    sourceCode: 'Source code on GitHub',
    updated: 'Last updated',
    checked: 'Last checked',
    reviewedBy: 'Reviewed by',
    editors: 'Edustack editors',
    seeAll: 'See all',
    free: 'Free',
  },
  zh: {
    siteName: 'Edustack',
    tagline: '有出处的家庭教育资源',
    nav: { home: '首页', stages: '按年龄', topics: '主题', educators: '教育家', me: '我的孩子', library: '资源库', tools: '免费工具' },
    langName: '简体中文', otherLang: 'English',
    type: { book: '经典著作', guideline: '权威指南', research: '学术研究' },
    typePlural: { book: '经典著作', guideline: '权威指南', research: '学术研究' },
    evidence: { guideline: '官方指南', large: '大型研究或综述', small: '小型研究', expert: '专家意见' },
    evidenceLabel: '证据等级',
    design: { 'meta-analysis': '元分析', review: '综述', trial: '随机对照试验', cohort: '长期追踪研究', experiment: '实验研究', observational: '观察研究', 'cross-sectional': '单次测量研究', 'large-dataset': '大数据分析' },
    area: { social: '社交与情绪', emotional: '情绪', language: '语言', thinking: '思维与学习', movement: '运动', identity: '自我认同', body: '身体' },
    blocks: { develop: '这个阶段孩子在发展什么', together: '你可以和孩子一起做什么', health: '健康与安全要点', reading: '延伸阅读', roots: '思想源头' },
    source: '来源',
    behind: '背后的研究',
    details: '详情',
    footerTitle: '开源 · 无广告 · 不接受投稿',
    footerBody: '本站不写原创建议。所有资源由编辑挑选，每条都链接到原始出处，并注明作者或机构、年份和最后核实日期。内容仅供参考，不能代替医生或专业人士的意见。',
    whatWeInclude: '为什么可以信任我们',
    sourceCode: 'GitHub 源代码',
    updated: '最后更新',
    checked: '最后核实',
    reviewedBy: '收录审核',
    editors: 'Edustack 编辑',
    seeAll: '查看全部',
    free: '免费',
  },
} as const;

export const t = (lang: Lang) => ui[lang];

/** Build a site URL for a language, respecting the configured base path. */
export function href(lang: Lang, path = '') {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const [rawPath, hash] = path.replace(/^\//, '').split('#');
  const p = rawPath;
  const prefix = lang === 'zh' ? '/zh' : p ? '' : '/en';
  const slash = p && !p.endsWith('/') && !p.includes('?') ? '/' : '';
  return `${base}${prefix}/${p}${slash}${hash !== undefined ? '#' + hash : ''}`;
}
/** Same page in the other language. */
export function switchLang(pathname: string, to: Lang) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  rest = rest.replace(/^\/(?:zh|en)(\/|$)/, '/');
  return to === 'zh' ? `${base}/zh${rest}` : rest === '/' ? `${base}/en/` : `${base}${rest}`;
}
export function fmtDate(iso: string, lang: Lang) {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'zh') return `${y} 年 ${m} 月 ${d} 日`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}
