import { format, parseISO } from 'date-fns';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

export function formatPrice(value, locale) {
  if (value == null) return '';
  const loc = locale === 'zh' ? 'zh-CN' : 'en-US';
  return `$${Number(value).toLocaleString(loc)}`;
}

export function formatRelativeTime(dateStr, t, locale) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minutesAgo', { m: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('time.hoursAgo', { h: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('time.daysAgo', { d: days });
  return format(parseISO(dateStr), locale === 'zh' ? 'M月d日' : 'MMM d', { locale: dateFnsLocales[locale] });
}
