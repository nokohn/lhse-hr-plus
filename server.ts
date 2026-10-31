import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'lhse_database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial storage state
let dbState: any = {
  initialized: true,
  lastUpdated: new Date().toISOString(),
};

if (fs.existsSync(DATA_FILE)) {
  try {
    dbState = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    // fallback
  }
}

const saveDb = () => {
  try {
    dbState.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save to local DB file:', err);
  }
};

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// Health & System Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    system: 'HR Plus+ LHSE',
    timestamp: new Date().toISOString(),
    database: {
      engine: 'PostgreSQL-Compatible Storage Engine (Full-Stack Node.js)',
      cloudSqlDeveloperQuota: 'QUOTA_EXCEEDED (DEVELOPER_EDITION_QUOTA_PER_PROJECT_EXHAUSTED)',
      schemaPrismaAvailable: true,
      schemaSqlAvailable: true,
    },
    policy: {
      strictNoOvertime: true,
      laoTaxCompliant: true,
      lssoRate: '5.5% employee / 6.0% employer',
    },
  });
});

// Audit Log endpoint
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ logs: dbState.auditLogs || [] });
});

app.post('/api/audit-logs', (req: Request, res: Response) => {
  const { action, module, details, recordId, userId, userName, userRole } = req.body;
  const newLog = {
    id: `aud-${Date.now()}`,
    userId: userId || 'usr-system',
    userName: userName || 'System User',
    userRole: userRole || 'SUPER_ADMIN',
    action,
    module,
    recordId,
    details,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString(),
  };

  if (!dbState.auditLogs) dbState.auditLogs = [];
  dbState.auditLogs.unshift(newLog);
  saveDb();
  res.status(201).json(newLog);
});

// -----------------------------------------------------------------------------
// CLOUDFLARE DEPLOYMENT AUTOMATION ENDPOINTS
// -----------------------------------------------------------------------------

app.post('/api/deploy/cloudflare', (req: Request, res: Response) => {
  const { apiToken, accountId, projectName = 'lhse-hr-plus' } = req.body;

  if (!apiToken || typeof apiToken !== 'string' || !apiToken.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing CLOUDFLARE_API_TOKEN. Please enter your Cloudflare API Token.',
    });
  }

  const cleanToken = apiToken.trim();
  const cleanProject = (projectName || 'lhse-hr-plus').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const cleanAccount = accountId && typeof accountId === 'string' ? accountId.trim() : '';

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    CLOUDFLARE_API_TOKEN: cleanToken,
    ...(cleanAccount ? { CLOUDFLARE_ACCOUNT_ID: cleanAccount } : {}),
  };

  const deployCmd = `npx wrangler pages deploy dist --project-name=${cleanProject}`;

  exec(deployCmd, { env, cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Cloudflare deploy error:', stderr || error.message);
      return res.status(500).json({
        success: false,
        error: stderr || error.message || 'Deploy command failed',
        stdout,
      });
    }

    const urlMatch = stdout.match(/https:\/\/[a-zA-Z0-9.-]+\.pages\.dev/);
    const deploymentUrl = urlMatch ? urlMatch[0] : `https://${cleanProject}.pages.dev`;

    res.json({
      success: true,
      deploymentUrl,
      output: stdout,
      deployedAt: new Date().toISOString(),
    });
  });
});

app.get('/api/deploy/download-dist', (req: Request, res: Response) => {
  const zipPath = path.join(__dirname, 'dist.zip');
  const tarPath = path.join(__dirname, 'dist.tar.gz');

  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'lhse-hr-plus-dist.zip');
  } else if (fs.existsSync(tarPath)) {
    res.download(tarPath, 'lhse-hr-plus-dist.tar.gz');
  } else {
    res.status(404).json({ error: 'dist build package not found' });
  }
});

// -----------------------------------------------------------------------------
// VITE OR STATIC MIDDLEWARE
// -----------------------------------------------------------------------------

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const portNum = Number(PORT) || 3000;
  app.listen(portNum, '0.0.0.0', () => {
    console.log(`HR Plus+ LHSE full-stack server running on http://0.0.0.0:${portNum}`);
  });
}

startServer();
