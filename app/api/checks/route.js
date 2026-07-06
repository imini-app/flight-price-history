import { initDb, saveCheck, getRecentChecks } from '@/lib/db';

function getIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.headers.get('x-vercel-forwarded-for')
    || '0.0.0.0';
}

export async function POST(request) {
  try {
    await initDb();
    const { routeKey, routeLabel, travelDate, checkType } = await request.json();
    const ip = getIp(request);
    await saveCheck({ ip, routeKey, routeLabel, travelDate, checkType });
    return Response.json({ ok: true });
  } catch (err) {
    console.error('Failed to save check:', err);
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await initDb();
    const type = new URL(request.url).searchParams.get('type') || undefined;
    const rows = await getRecentChecks({ type });
    return Response.json(rows);
  } catch (err) {
    console.error('Failed to fetch checks:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
