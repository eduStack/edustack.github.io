export const defaultLanguage = 'en';

export const languages = {
  en: { name: 'English', tag: 'en', prefix: '', switchLabel: 'Language' },
  zh: { name: '简体中文', tag: 'zh-Hans', prefix: '/zh', switchLabel: '语言' },
} as const;

export type Lang = keyof typeof languages;
