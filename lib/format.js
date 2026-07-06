export function formatPrice(value) {
  if (value == null) return '';
  return `USD ${Number(value).toLocaleString('en-US')}`;
}
