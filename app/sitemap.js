const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://besttimetobook.com';

export default function sitemap() {
  const now = new Date();
  const paths = [
    { path: '', priority: 1, freq: 'daily' },
    { path: '/explore', priority: 0.8, freq: 'weekly' },
  ];
  const entries = [];
  for (const p of paths) {
    entries.push({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    });
    entries.push({
      url: `${SITE_URL}${p.path}?lang=zh`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    });
  }
  return entries;
}
