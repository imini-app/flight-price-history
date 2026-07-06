export function formatPrice(value) {
  if (value == null) return '';
  return `$${Number(value).toLocaleString('en-US')}`;
}
