// Cloudflare Pages Function: /api/health
export async function onRequest(context: { request: Request; env: any }) {
  const { request } = context;

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const responsePayload = {
    status: 'HEALTHY',
    system: 'HR Plus+ LHSE Enterprise (Cloudflare Edge)',
    platform: 'Cloudflare Pages & Workers',
    timestamp: new Date().toISOString(),
    edgeLocation: request.headers.get('cf-ipcountry') || 'GLOBAL',
    rayId: request.headers.get('cf-ray') || 'local-edge',
    database: {
      engine: 'Cloudflare Edge + Hybrid Storage Engine',
      edgeOptimized: true,
      schemaPrismaAvailable: true,
      schemaSqlAvailable: true,
    },
    policy: {
      strictNoOvertime: true,
      laoTaxCompliant: true,
      lssoRate: '5.5% employee / 6.0% employer',
      laborLawVersion: 'Lao PDR Labor Law Amended 2024',
    },
  };

  return new Response(JSON.stringify(responsePayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}
