import type { Lang } from '../lib/data';
import { languages } from './languages';

export const ui = {
  en: {
    siteName: 'eduStack',
    tagline: 'Parenting resources with sources',
    nav: { home: 'Home', stages: 'By age', topics: 'Topics', educators: 'Educators', me: 'My child', library: 'Library', tools: 'Tools', activities: 'Activities' },
    langName: 'English', otherLang: '简体中文',
    type: { book: 'Classic book', classic: 'Classic reading', guide: 'Practical resource', guideline: 'Guideline', research: 'Research' },
    typePlural: { book: 'Classic books', classic: 'Classic readings', guide: 'Practical resources', guideline: 'Guidelines', research: 'Research' },
    evidence: { guideline: 'Official guideline', large: 'Large study or review', small: 'Small study', expert: 'Expert opinion' },
    evidenceLabel: 'Evidence type',
    evidenceHelp: 'These labels describe the source, not a reliability ranking. Study size or type alone does not establish the quality of the evidence.',
    design: { 'meta-analysis': 'Meta-analysis', review: 'Review', trial: 'Randomised trial', cohort: 'Long-term cohort study', experiment: 'Experiment', observational: 'Observational study', 'cross-sectional': 'Cross-sectional study', 'large-dataset': 'Large dataset analysis' },
    designNote: {
      'meta-analysis': 'Statistically combines results from several studies; conclusions depend on the quality and comparability of the included studies.',
      review: 'Brings together previous research; check how studies were selected and how their quality was assessed.',
      trial: 'Randomly assigns participants to groups to compare an intervention with a control; implementation and measurement still affect the findings.',
      cohort: 'Follows a group over time to examine how experiences relate to later outcomes; this alone does not establish cause and effect.',
      experiment: 'Changes a condition and compares responses; check the controls, participants and what was actually measured.',
      observational: 'Records what happens without assigning an intervention; an association alone does not establish cause and effect.',
      'cross-sectional': 'Examines measurements from one period in time; an association alone does not establish cause and effect.',
      'large-dataset': 'Analyses a large set of records; a large sample does not remove bias or establish cause and effect.',
    },
    area: { social: 'Social and emotional', emotional: 'Feelings', language: 'Language', thinking: 'Thinking and learning', movement: 'Movement', identity: 'Identity', body: 'Body' },
    blocks: { develop: 'What your child is developing', together: 'What you can do together', health: 'Health and safety essentials', reading: 'Further reading', roots: 'Idea roots' },
    source: 'Source',
    behind: 'The research behind it',
    details: 'Details',
    footerTitle: 'Ad-free · Source-backed · Human-curated',
    footerBody: 'eduStack provides source-based introductions, not individual professional advice. Each resource links to its source and shows the author or organisation, publication information and when it was checked. For information only, not a substitute for advice from a doctor or other professional.',
    whatWeInclude: 'Why you can trust us',
    designReference: 'Original design reference',
    updated: 'Last updated',
    checked: 'Last checked',
    reviewedBy: 'Reviewed by',
    editors: 'eduStack editors',
    seeAll: 'See all',
    free: 'Free',
  },
  zh: {
    siteName: 'eduStack',
    tagline: '有出处的家庭教育资源',
    nav: { home: '首页', stages: '按年龄', topics: '主题', educators: '教育家', me: '我的孩子', library: '资源库', tools: '工具', activities: '活动' },
    langName: '简体中文', otherLang: 'English',
    type: { book: '经典著作', classic: '经典导读', guide: '实用资源', guideline: '权威指南', research: '学术研究' },
    typePlural: { book: '经典著作', classic: '经典导读', guide: '实用资源', guideline: '权威指南', research: '学术研究' },
    evidence: { guideline: '官方指南', large: '大型研究或综述', small: '小型研究', expert: '专家意见' },
    evidenceLabel: '依据类型',
    evidenceHelp: '这些标签说明资料依据，不代表可靠性排名。仅凭研究规模或类型，不能判断证据质量。',
    design: { 'meta-analysis': '元分析', review: '综述', trial: '随机对照试验', cohort: '长期追踪研究', experiment: '实验研究', observational: '观察研究', 'cross-sectional': '横断面研究', 'large-dataset': '大数据分析' },
    designNote: {
      'meta-analysis': '用统计方法合并多项研究的结果；结论取决于纳入研究的质量，以及这些研究是否适合合并。',
      review: '汇集已有研究；需查看如何选择研究、如何评估研究质量。',
      trial: '将参与者随机分组，比较干预与对照的结果；实施和测量方式仍会影响结论。',
      cohort: '持续跟踪一组人，观察经历与后续结果的关系；仅凭这种关系不能确定因果。',
      experiment: '改变某个条件并比较反应；需查看对照方式、参与人群和实际测量的内容。',
      observational: '不安排干预，记录实际发生的情况；发现关联不等于确定因果。',
      'cross-sectional': '观察同一时期的测量结果；发现关联不等于确定因果。',
      'large-dataset': '分析大量记录；样本量大仍可能存在偏差，也不自动说明因果关系。',
    },
    area: { social: '社交与情绪', emotional: '情绪', language: '语言', thinking: '思维与学习', movement: '运动', identity: '自我认同', body: '身体' },
    blocks: { develop: '这个阶段孩子在发展什么', together: '你可以和孩子一起做什么', health: '健康与安全要点', reading: '延伸阅读', roots: '思想源头' },
    source: '来源',
    behind: '背后的研究',
    details: '详情',
    footerTitle: '无广告 · 有据可查 · 人工精选',
    footerBody: '本站依据原始资料撰写导读，不提供个体化专业建议。每条资源都链接到出处，注明作者或机构、发表信息和核验日期。内容仅供参考，不能代替医生或专业人士的意见。',
    whatWeInclude: '为什么可以信任我们',
    designReference: '原版设计参考',
    updated: '最后更新',
    checked: '最后核实',
    reviewedBy: '收录审核',
    editors: 'eduStack 编辑',
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
  const prefix = languages[lang].prefix;
  const slash = p && !p.endsWith('/') && !p.includes('?') ? '/' : '';
  return `${base}${prefix}/${p}${slash}${hash !== undefined ? '#' + hash : ''}`;
}
/** Same page in a supported language; English uses unprefixed URLs. */
export function switchLang(pathname: string, to: Lang) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const prefixes = Object.keys(languages).join('|');
  rest = rest.replace(new RegExp(`^/(?:${prefixes})(/|$)`), '/');
  return `${base}${languages[to].prefix}${rest || '/'}`;
}
export function fmtDate(iso: string, lang: Lang) {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'zh') return `${y} 年 ${m} 月 ${d} 日`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
}
