/** @type {Record<string, { en: string, zh: string }>} */
export const resourceTopics = {
  sleep: { en: 'Sleep', zh: '睡眠' },
  activity: { en: 'Physical activity', zh: '运动' },
  'screen-time': { en: 'Screen time', zh: '屏幕时间' },
  'social-media': { en: 'Social media', zh: '社交媒体' },
  'mental-health': { en: 'Mental health', zh: '心理健康' },
  nutrition: { en: 'Nutrition', zh: '营养' },
  development: { en: 'Development', zh: '儿童发展' },
  language: { en: 'Language', zh: '语言' },
  emotions: { en: 'Emotions', zh: '情绪' },
  communication: { en: 'Talking together', zh: '亲子沟通' },
  discipline: { en: 'Discipline', zh: '管教' },
  learning: { en: 'Learning', zh: '学习' },
  safety: { en: 'Safety', zh: '安全' },
  puberty: { en: 'Puberty', zh: '青春期' },
  'responsive-care': { en: 'Responsive care', zh: '回应式照护' },
  'self-regulation': { en: 'Self-regulation', zh: '自我调节' },
  play: { en: 'Play', zh: '游戏' },
  attachment: { en: 'Attachment', zh: '依恋' },
};

export const developmentAreas = ['social', 'emotional', 'language', 'thinking', 'movement', 'identity', 'body'];

export const primaryStages = [
  { id: 'babies', minMonths: 0, maxMonths: 11 },
  { id: 'toddlers', minMonths: 12, maxMonths: 35 },
  { id: 'preschoolers', minMonths: 36, maxMonths: 71 },
  { id: 'school-age', minMonths: 72, maxMonths: 143 },
  { id: 'teens', minMonths: 144, maxMonths: 215 },
];
