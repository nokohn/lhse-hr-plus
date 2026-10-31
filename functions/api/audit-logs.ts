// Cloudflare Pages Function: /api/audit-logs
// Handles GET and POST audit logging on Cloudflare Edge

// Global edge memory buffer for audit logs
const edgeAuditLogs: any[] = [];

export async function onRequest(context: { request: Request; env: any }) {
  const { request } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // GET /api/audit-logs
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ logs: edgeAuditLogs }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // POST /api/audit-logs
  if (request.method === 'POST') {
    try {
      const body = await request.json() as any;
      const clientIp = request.headers.get('cf-connecting-ip') || '127.0.0.1';
      const country = request.headers.get('cf-ipcountry') || 'LA';

      const newLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: body.userId || 'usr-system',
        userName: body.userName || 'System User',
        userRole: body.userRole || 'SUPER_ADMIN',
        action: body.action || 'AUDIT_EVENT',
        module: body.module || 'SYSTEM',
        recordId: body.recordId || null,
        details: body.details || '',
        ipAddress: `${clientIp} (${country})`,
        timestamp: new Date().toISOString(),
        edgePlatform: 'Cloudflare Pages',
      };

      edgeAuditLogs.unshift(newLog);

      // Keep up to 200 logs in edge memory
      if (edgeAuditLogs.length > 200) {
        edgeAuditLogs.pop();
      }

      return new Response(JSON.stringify(newLog), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
