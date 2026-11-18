// One age-bounded source of guidance for stage cards and the routine tool.
export const guidanceLabels = {
  sleep: { en: 'Sleep in 24 hours', zh: '每 24 小时睡眠' },
  activity: { en: 'Physical activity', zh: '身体活动' },
  screen: { en: 'Sedentary screen time', zh: '久坐屏幕时间' },
};

export const dailyGuidance = [
  { id: 'sleep-0-3m', kind: 'sleep', minMonths: 0, maxMonths: 3, minimum: 14, maximum: 17,
    value: { en: '14–17 hours, including naps', zh: '14–17 小时，包含小睡' }, sources: ['who-under5-activity-sleep-2019'] },
  { id: 'sleep-4-11m', kind: 'sleep', minMonths: 4, maxMonths: 11, minimum: 12, maximum: 16,
    value: { en: '12–16 hours, including naps', zh: '12–16 小时，包含小睡' }, sources: ['who-under5-activity-sleep-2019', 'aasm-sleep-2016'] },
  { id: 'sleep-1-2y', kind: 'sleep', minMonths: 12, maxMonths: 35, minimum: 11, maximum: 14,
    value: { en: '11–14 hours, including naps', zh: '11–14 小时，包含小睡' }, sources: ['who-under5-activity-sleep-2019', 'aasm-sleep-2016'] },
  { id: 'sleep-3-5y', kind: 'sleep', minMonths: 36, maxMonths: 71, minimum: 10, maximum: 13,
    value: { en: '10–13 hours, including any naps', zh: '10–13 小时，包含小睡' }, sources: ['aasm-sleep-2016'] },
  { id: 'sleep-6-12y', kind: 'sleep', minMonths: 72, maxMonths: 155, minimum: 9, maximum: 12,
    value: { en: '9–12 hours', zh: '9–12 小时' }, sources: ['aasm-sleep-2016'] },
  { id: 'sleep-13-17y', kind: 'sleep', minMonths: 156, maxMonths: 215, minimum: 8, maximum: 10,
    value: { en: '8–10 hours', zh: '8–10 小时' }, sources: ['aasm-sleep-2016'] },
  { id: 'activity-0y', kind: 'activity', minMonths: 0, maxMonths: 11,
    value: { en: 'Active several times a day, especially through floor play. If not yet mobile, at least 30 minutes of tummy time spread through the day while awake and supervised.', zh: '每天多次活动，尤其是地面互动游戏。还不能自主移动时，在清醒且有人看护的情况下，将至少 30 分钟俯趴分散到一天中。' }, sources: ['who-under5-activity-sleep-2019'] },
  { id: 'activity-1-2y', kind: 'activity', minMonths: 12, maxMonths: 35,
    value: { en: 'At least 180 minutes of varied physical activity at any intensity, spread through the day.', zh: '每天至少 180 分钟多种形式、不同强度的身体活动，分散到一天中。' }, sources: ['who-under5-activity-sleep-2019'] },
  { id: 'activity-3-4y', kind: 'activity', minMonths: 36, maxMonths: 59,
    value: { en: 'At least 180 minutes through the day, including at least 60 minutes of moderate-to-vigorous physical activity.', zh: '每天至少 180 分钟身体活动，其中至少 60 分钟为中高强度，分散到一天中。' }, sources: ['who-under5-activity-sleep-2019'] },
  { id: 'activity-5-17y', kind: 'activity', minMonths: 60, maxMonths: 215,
    value: { en: 'An average of at least 60 minutes a day of moderate-to-vigorous activity across the week, mostly aerobic. Include vigorous activity and muscle- and bone-strengthening activity at least 3 days a week.', zh: '一周内平均每天至少 60 分钟中高强度活动，以有氧活动为主；每周至少 3 天包含高强度及增强肌肉、骨骼的活动。' }, sources: ['who-activity-2020'] },
  { id: 'screen-0-1y', kind: 'screen', minMonths: 0, maxMonths: 23,
    value: { en: 'WHO does not recommend sedentary screen time. This is WHO guidance; other organisations distinguish video calls and adult-supported viewing.', zh: 'WHO 不建议久坐看屏幕。这里采用 WHO 建议；其他机构会区分视频通话和成人陪看的情境。' }, sources: ['who-under5-activity-sleep-2019'] },
  { id: 'screen-2-4y', kind: 'screen', minMonths: 24, maxMonths: 59,
    value: { en: 'No more than 1 hour a day of sedentary screen time; less is better, according to WHO.', zh: '按 WHO 建议，每天久坐屏幕时间不超过 1 小时，越少越好。' }, sources: ['who-under5-activity-sleep-2019'] },
  { id: 'screen-5-17y', kind: 'screen', minMonths: 60, maxMonths: 215,
    value: { en: 'Limit sedentary time, especially recreational screen time. WHO gives no single hourly cap for this age group; discuss sleep, purpose, timing and family circumstances.', zh: '减少久坐时间，特别是娱乐性屏幕时间。WHO 对这个年龄段未给统一的小时上限；结合睡眠、用途、时间安排和家庭情境讨论。' }, sources: ['who-activity-2020'] },
];

export const guidanceForAge = (months) => Number.isInteger(months) && months >= 0 && months <= 215
  ? Object.fromEntries(Object.keys(guidanceLabels).map((kind) => [kind, dailyGuidance.find((rule) => rule.kind === kind && rule.minMonths <= months && rule.maxMonths >= months)]))
  : null;

export const guidanceForRange = (kind, min, max) => dailyGuidance.filter((rule) => rule.kind === kind && rule.minMonths <= max && rule.maxMonths >= min);
