// OPTIONAL (not deployed): Supabase Edge Function that hides the Kakao REST key server-side.
// Deploy:  supabase secrets set KAKAO_REST_KEY=...  &&  supabase functions deploy directions --no-verify-jwt
// Then set DIRECTIONS_PROXY in directions.js to https://<project>.supabase.co/functions/v1/directions
Deno.serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': 'https://hanbitguri.github.io', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const u = new URL(req.url), o = u.searchParams.get('origin'), d = u.searchParams.get('destination');
  if (!o || !d || !/^[\d.,-]+$/.test(o + d)) return new Response('bad request', { status: 400, headers: cors });
  const r = await fetch(`https://apis-navi.kakaomobility.com/v1/directions?origin=${o}&destination=${d}&priority=RECOMMEND&summary=true`,
    { headers: { Authorization: 'KakaoAK ' + Deno.env.get('KAKAO_REST_KEY') } });
  return new Response(await r.text(), { status: r.status, headers: { ...cors, 'content-type': 'application/json' } });
});
