export function formatPrice(value, locale) {
  if (value == null) return '';
  const loc = locale === 'zh' ? 'zh-CN' : 'en-US';
  return `$${Number(value).toLocaleString(loc)}`;
}
