/** Label inclusive whole-month bounds without displaying an excluded birthday. */
export function inclusiveAgeLabel(min, max, lang) {
  const zh = lang === 'zh';
  if (max < 24) return zh ? `${min}–${max} 个月` : `${min}–${max} months`;
  if (min % 12 === 0 && max % 12 === 11) {
    const low = min / 12, high = Math.floor(max / 12);
    const range = low === high ? String(low) : `${low}–${high}`;
    return zh ? `${range} 岁` : `Ages ${range}`;
  }
  const format = (months) => {
    if (months < 24) return zh ? `${months} 个月` : `${months} months`;
    const years = Math.floor(months / 12), remainder = months % 12;
    return zh ? `${years} 岁${remainder ? ` ${remainder} 个月` : ''}` : `${years} ${years === 1 ? 'year' : 'years'}${remainder ? ` ${remainder} ${remainder === 1 ? 'month' : 'months'}` : ''}`;
  };
  // A full last year includes every month after that birthday.
  const upper = max % 12 === 11 ? Math.floor(max / 12) * 12 : max;
  return `${format(min)}–${format(upper)}`;
}
