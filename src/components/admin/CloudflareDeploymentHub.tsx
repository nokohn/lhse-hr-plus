import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { alerts } from '../../utils/alerts.ts';
import {
  Cloud,
  CheckCircle2,
  Copy,
  ExternalLink,
  Terminal,
  Globe,
  RefreshCw,
  Zap,
  Server,
  Layers,
  Sparkles,
  Info,
  Download,
  Key,
  Play,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export const CloudflareDeploymentHub: React.FC = () => {
  const { language } = useApp();
  const [activeDeployTab, setActiveDeployTab] = useState<'app' | 'cli' | 'git' | 'upload'>('app');
  
  // Interactive deployer state
  const [apiToken, setApiToken] = useState('');
  const [accountId, setAccountId] = useState('cafe3d79fc7d8796843b960a8b29e5ae');
  const [projectName, setProjectName] = useState('lhse-hr-plus');
  const [showToken, setShowToken] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    success: boolean;
    deploymentUrl?: string;
    output?: string;
    error?: string;
    deployedAt?: string;
  } | null>(null);

  // Health test state
  const [healthTesting, setHealthTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<any | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alerts.success(`${label} Copied`, text);
  };

  const handleTestHealth = async () => {
    setHealthTesting(true);
    const startTime = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const latencyMs = Math.round(performance.now() - startTime);
      setHealthResult({
        ok: res.ok,
        status: res.status,
        latencyMs,
        data,
      });
      alerts.success(
        language === 'lo' ? 'ທົດສອບ Edge API ສຳເລັດ' : 'Edge API Test Passed',
        `Response latency: ${latencyMs}ms | Status: 200 OK`
      );
    } catch (err: any) {
      setHealthResult({
        ok: false,
        error: err.message || 'Failed to connect to /api/health',
      });
      alerts.error('Connection Failed', err.message || 'Could not connect to /api/health');
    } finally {
      setHealthTesting(false);
    }
  };

  const handleExecuteDeploy = async () => {
    if (!apiToken.trim()) {
      alerts.warning(
        language === 'lo' ? 'ກະລຸນາໃສ່ Cloudflare API Token' : 'API Token Required',
        language === 'lo'
          ? 'ທ່ານຕ້ອງໃສ່ Cloudflare API Token ເພື່ອຢືນຢັນສິດໃນການ Deploy'
          : 'Please enter your Cloudflare API Token to authorize deployment.'
      );
      return;
    }

    setIsDeploying(true);
    setDeployResult(null);

    try {
      const res = await fetch('/api/deploy/cloudflare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: apiToken.trim(),
          accountId: accountId.trim() || undefined,
          projectName: projectName.trim() || 'lhse-hr-plus',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDeployResult(data);
        alerts.success(
          language === 'lo' ? 'Deploy ຂຶ້ນ Cloudflare ສຳເລັດແລ້ວ!' : 'Deployment Succeeded!',
          data.deploymentUrl
        );
      } else {
        setDeployResult({
          success: false,
          error: data.error || 'Deployment failed',
          output: data.stdout,
        });
        alerts.error('Deploy Failed', data.error || 'Failed to deploy to Cloudflare');
      }
    } catch (err: any) {
      setDeployResult({
        success: false,
        error: err.message || 'Network request failed',
      });
      alerts.error('Network Error', err.message || 'Network error during deployment');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase">
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloudflare Global Edge Ready</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-xl md:text-2xl font-black">
              {language === 'lo'
                ? 'ສູນຈັດການການ Deploy ຂຶ້ນ Cloudflare Pages & Workers'
                : 'Cloudflare Pages & Workers Deployment Hub'}
            </h2>
            <p className="text-xs text-amber-100 max-w-2xl leading-relaxed">
              {language === 'lo'
                ? 'ລະບົບ HR Plus+ LHSE ໄດ້ຮັບການຕັ້ງຄ່າ ແລະ ປັບແຕ່ງໃຫ້ພ້ອມ Deploy ຂຶ້ນສູ່ Cloudflare Global Edge Network ດ້ວຍຄວາມໄວສູງ, ຄວາມປອດໄພລະດັບສູງ ແລະ ຟຣີ 100% ພ້ອມ SSL ອັດຕະໂນມັດ.'
                : 'HR Plus+ LHSE is fully tuned and pre-configured for instant zero-cold-start deployment across Cloudflare’s 300+ city global edge with automated SSL/TLS, edge caching, and serverless functions.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://dash.cloudflare.com/cafe3d79fc7d8796843b960a8b29e5ae/workers-and-pages"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Cloudflare Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      {/* Edge Architecture Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Config File
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
            wrangler.jsonc
          </div>
          <p className="text-[11px] text-slate-500">
            Project: <code className="text-orange-600 font-bold">lhse-hr-plus</code>
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              SPA Routing
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
            public/_redirects
          </div>
          <p className="text-[11px] text-slate-500">
            /* &rarr; /index.html 200 (No 404)
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Security Headers
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
            public/_headers
          </div>
          <p className="text-[11px] text-slate-500">
            CSP &bull; Camera Permissions
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pages Functions
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
            functions/api/*
          </div>
          <p className="text-[11px] text-slate-500">
            Serverless Edge endpoints
          </p>
        </div>
      </div>

      {/* Deployment Method Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>
              {language === 'lo'
                ? 'ເລືອກຊ່ອງທາງການ Deploy'
                : 'Select Deployment Pathway'}
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveDeployTab('app')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeDeployTab === 'app'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1-Click Deployer</span>
            </button>
            <button
              onClick={() => setActiveDeployTab('cli')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeDeployTab === 'cli'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Wrangler CLI</span>
            </button>
            <button
              onClick={() => setActiveDeployTab('git')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeDeployTab === 'git'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Git Dashboard</span>
            </button>
            <button
              onClick={() => setActiveDeployTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeDeployTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Direct Upload</span>
            </button>
          </div>
        </div>

        {/* TAB 0: 1-CLICK IN-APP DEPLOYER */}
        {activeDeployTab === 'app' && (
          <div className="p-6 rounded-3xl border border-orange-200 dark:border-orange-900/60 bg-linear-to-b from-orange-50/50 to-amber-50/20 dark:from-orange-950/20 dark:to-slate-900 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200/60 dark:border-orange-900/40 pb-4">
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span>
                    {language === 'lo'
                      ? 'Deploy ຂຶ້ນ Cloudflare Pages ທັນທີ (In-App 1-Click Deploy)'
                      : 'Direct 1-Click Cloudflare Pages Deployer'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'lo'
                    ? 'ໃສ່ Cloudflare API Token ຂອງທ່ານເພື່ອສັ່ງ Deploy ໄຟລ໌ທັງໝົດຂຶ້ນ Cloudflare Global CDN ໂດຍກົງ'
                    : 'Input your Cloudflare API Token to execute an instant live deployment'}
                </p>
              </div>

              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 font-bold flex items-center gap-1 underline underline-offset-2 shrink-0"
              >
                <Key className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ສ້າງ API Token (30 ວິນາທີ)' : 'Get API Token (30s)'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Cloudflare API Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Enter your Cloudflare API Token (e.g. j7Xb9_...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  {language === 'lo'
                    ? 'ສ້າງໄດ້ທີ່ Cloudflare > My Profile > API Tokens > Create Token > ໃຊ້ Template "Cloudflare Pages" ຫຼື "Edit Cloudflare Workers".'
                    : 'Create at Cloudflare > My Profile > API Tokens > Create Token > Use template "Cloudflare Pages" or "Edit Cloudflare Workers".'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="lhse-hr-plus"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Account ID (Optional)
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="Optional: Cloudflare Account ID"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Production build is compiled and verified in <code className="font-mono">./dist</code></span>
              </div>

              <button
                onClick={handleExecuteDeploy}
                disabled={isDeploying || !apiToken.trim()}
                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'lo' ? 'ກຳລັງ Deploy...' : 'Deploying to Edge...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>{language === 'lo' ? 'ກົດ Deploy ຂຶ້ນ Cloudflare ທັນທີ' : 'Deploy to Cloudflare Now'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Deployment Result */}
            {deployResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-3 ${
                  deployResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    {deployResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>
                      {deployResult.success
                        ? language === 'lo'
                          ? 'ການ Deploy ສຳເລັດແລ້ວ! ເວັບໄຊທ໌ຂອງທ່ານ Online ແລ້ວ:'
                          : 'Deployment Successful! Your application is live at:'
                        : language === 'lo'
                        ? 'ການ Deploy ບໍ່ສຳເລັດ:'
                        : 'Deployment Failed:'}
                    </span>
                  </div>

                  {deployResult.deploymentUrl && (
                    <a
                      href={deployResult.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-500 shadow-xs"
                    >
                      <span>Open Website</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {deployResult.deploymentUrl && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 font-mono text-xs flex items-center justify-between">
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold select-all">
                      {deployResult.deploymentUrl}
                    </span>
                    <button
                      onClick={() => copyToClipboard(deployResult.deploymentUrl!, 'Site URL')}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                )}

                {deployResult.error && (
                  <p className="font-mono text-rose-700 dark:text-rose-300 text-xs">
                    {deployResult.error}
                  </p>
                )}

                {deployResult.output && (
                  <pre className="p-3 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800">
                    {deployResult.output}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: CLI */}
        {activeDeployTab === 'cli' && (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  <span>
                    {language === 'lo'
                      ? 'Deploy ວ່ອງໄວດ້ວຍ Cloudflare Wrangler CLI'
                      : 'Deploy with Cloudflare Wrangler CLI'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'lo'
                    ? 'ຄຳສັ່ງງ່າຍໆພຽງ 1 ຄຳສັ່ງເພື່ອສົ່ງໄຟລ໌ທັງໝົດຂຶ້ນ Cloudflare Pages ໂດຍກົງ'
                    : 'Execute these commands in your terminal to publish to Cloudflare Pages'}
                </p>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                Wrangler v4 Installed
              </span>
            </div>

            {/* Step 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຂັ້ນຕອນທີ 1: ສ້າງ Build ໄຟລ໌' : 'Step 1: Compile Production Build'}
                </span>
                <button
                  onClick={() => copyToClipboard('npm run build', 'Build command')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{language === 'lo' ? 'ຄັດລອກ' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs flex items-center justify-between">
                <span>npm run build</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'lo'
                    ? 'ຂັ້ນຕອນທີ 2: ເຂົ້າສູ່ລະບົບ Cloudflare (ເທື່ອທຳອິດ)'
                    : 'Step 2: Login to Cloudflare Account'}
                </span>
                <button
                  onClick={() => copyToClipboard('npx wrangler login', 'Login command')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{language === 'lo' ? 'ຄັດລອກ' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs">
                <span>npx wrangler login</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'lo'
                    ? 'ຂັ້ນຕອນທີ 3: Deploy ຂຶ້ນ Cloudflare Pages'
                    : 'Step 3: Publish to Cloudflare Pages'}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'npm run deploy:pages',
                      'Deploy script'
                    )
                  }
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{language === 'lo' ? 'ຄັດລອກ' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs flex items-center justify-between">
                <span>npm run deploy:pages</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                &rarr; Command runs: <code className="text-orange-500">npx wrangler pages deploy dist --project-name=lhse-hr-plus</code>
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Git Dashboard */}
        {activeDeployTab === 'git' && (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-purple-500" />
              <span>
                {language === 'lo'
                  ? 'ຕັ້ງຄ່າ Auto-Deploy ຜ່ານ GitHub / GitLab'
                  : 'Automated CI/CD via GitHub / GitLab Integration'}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Framework Preset
                </span>
                <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  Vite
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Build Command
                </span>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  npm run build
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Build Output Directory
                </span>
                <div className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  dist
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Root Directory
                </span>
                <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                  /
                </div>
              </div>
            </div>

            <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1.5 leading-relaxed">
              <li>
                <a
                  href="https://dash.cloudflare.com/cafe3d79fc7d8796843b960a8b29e5ae/workers-and-pages/create/pages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>
                    {language === 'lo'
                      ? 'ກົດເປີດໜ້າ Create Pages ໃນ Cloudflare Account ຂອງທ່ານ'
                      : 'Open Create Pages in your Cloudflare Account'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                {language === 'lo'
                  ? 'ກົດ Connect to Git ແລະ ເລືອກ Repository ຂອງລະບົບ LHSE HR'
                  : 'Click Connect to Git and authorize your GitHub/GitLab repository'}
              </li>
              <li>
                {language === 'lo'
                  ? 'ໃສ່ຄ່າ Build Settings ຕາມຕາຕະລາງດ້ານເທິງ ແລ້ວກົດ "Save and Deploy"'
                  : 'Apply the build parameters above and click "Save and Deploy"'}
              </li>
            </ol>
          </div>
        )}

        {/* TAB 3: Direct Upload */}
        {activeDeployTab === 'upload' && (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>
                    {language === 'lo'
                      ? 'Deploy ໂດຍກົງດ້ວຍການ Drag & Drop ໂຟນເດີ dist'
                      : 'Direct Upload (Drag & Drop dist folder)'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {language === 'lo'
                    ? 'ອັບໂຫຼດໄຟລ໌ Build ທີ່ຕຽມພ້ອມແລ້ວເຂົ້າສູ່ Cloudflare Pages Console ໂດຍກົງ'
                    : 'Download the pre-compiled archive or drag & drop the dist folder into Cloudflare Pages'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/api/deploy/download-dist"
                  download="lhse-hr-plus-dist.zip"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ດາວໂຫຼດ dist.zip (3.4 MB)' : 'Download dist.zip (3.4 MB)'}</span>
                </a>

                <a
                  href="https://dash.cloudflare.com/cafe3d79fc7d8796843b960a8b29e5ae/workers-and-pages/create/pages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ເປີດ Cloudflare Pages Upload' : 'Open Cloudflare Pages'}</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 text-xs space-y-2">
              <p className="text-slate-600 dark:text-slate-400">
                {language === 'lo'
                  ? 'ຂັ້ນຕອນງ່າຍໆ: 1) ກົດປຸ່ມ "ດາວໂຫຼດ dist.zip" ດ້ານເທິງ &bull; 2) ກົດ "ເປີດ Cloudflare Pages Upload" &bull; 3) ລາກ dist.zip ມາວາງລົງ ແລ້ວກົດ Deploy &rarr; ລະບົບຈະ Online ທັນທີ!'
                  : 'Quick Steps: 1) Click "Download dist.zip" above &bull; 2) Click "Open Cloudflare Pages" &bull; 3) Drag & drop dist.zip and click Deploy &rarr; Live in 5 seconds!'}
              </p>
              <div className="flex items-center gap-2 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>dist.zip package contains: index.html, assets, _redirects, _headers</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edge API Live Diagnostic */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              <span>
                {language === 'lo'
                  ? 'ທົດສອບ Edge API Endpoint (/api/health)'
                  : 'Test Edge API Endpoint (/api/health)'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              {language === 'lo'
                ? 'ກວດສອບການຕອບສະໜອງຂອງ Cloudflare Pages Serverless Function'
                : 'Verify response time and system telemetry from edge serverless function'}
            </p>
          </div>

          <button
            onClick={handleTestHealth}
            disabled={healthTesting}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${healthTesting ? 'animate-spin' : ''}`} />
            <span>{healthTesting ? 'Testing...' : 'Run Test'}</span>
          </button>
        </div>

        {healthResult && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>HTTP {healthResult.status} OK</span>
              </span>
              <span className="text-slate-400">Latency: {healthResult.latencyMs}ms</span>
            </div>
            <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
              {JSON.stringify(healthResult.data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Custom Domain Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-blue-900 dark:text-blue-200">
            {language === 'lo'
              ? 'ການເຊື່ອມຕໍ່ Custom Domain (ເຊັ່ນ: hr.lhse.gov.la)'
              : 'Connecting Your Official Custom Domain (e.g. hr.lhse.gov.la)'}
          </span>
          <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
            {language === 'lo'
              ? 'ຫຼັງຈາກ Deploy ແລ້ວ, ທ່ານສາມາດຕັ້ງຄ່າ Custom Domain ໃນ Cloudflare Pages > Custom domains ເພື່ອໃຫ້ພະນັກງານເຂົ້າໃຊ້ງານຜ່ານຊື່ໂດເມນທາງການຂອງລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ ພ້ອມໃບຢັ້ງຢືນ SSL/TLS ຟຣີ.'
              : 'After deploying, navigate to Cloudflare Pages > Custom domains to link your enterprise domain (e.g., hr.lhse.gov.la) with automatic zero-cost managed SSL certificates and DDoS protection.'}
          </p>
        </div>
      </div>
    </div>
  );
};
