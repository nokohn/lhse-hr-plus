import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { auditService } from '../../services/auditService.ts';
import {
  History,
  ShieldAlert,
  ArrowRight,
  Download,
  User,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Settings,
  Cpu,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { alerts } from '../../utils/alerts.ts';

export const ComplianceAuditStreamWidget: React.FC = () => {
  const { language, auditLogs, setActiveModule, setActiveSubModule } = useApp();

  const latestLogs = auditLogs.slice(0, 5);

  const stats = {
    total: auditLogs.length,
    creates: auditLogs.filter((l) => l.actionType === 'CREATE').length,
    updates: auditLogs.filter((l) => l.actionType === 'UPDATE').length,
    approvals: auditLogs.filter((l) => l.actionType === 'APPROVE').length,
    security: auditLogs.filter((l) => l.action.includes('BIOMETRIC') || l.action.includes('ROLE_SWITCH') || l.action.includes('PIN')).length,
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (auditLogs.length === 0) {
      alerts.warning(
        language === 'lo' ? 'ບໍ່ມີຂໍ້ມູນສຳລັບສົ່ງອອກ' : 'No logs to export',
        language === 'lo' ? 'ກະລຸນາລອງໃໝ່ພາຍຫຼັງ' : 'No records logged yet.'
      );
      return;
    }
    auditService.exportLogsToExcel(auditLogs);
    alerts.success(
      language === 'lo' ? 'ສົ່ງອອກບັນທຶກລະບົບສຳເລັດ' : 'Audit Logs Exported',
      language === 'lo' ? `ສົ່ງອອກແລ້ວ ${auditLogs.length} ລາຍການ` : `Exported ${auditLogs.length} records to Excel.`
    );
  };

  const handleOpenAuditModule = () => {
    setActiveModule('module-15');
    setActiveSubModule('audit-logs');
  };

  const renderBadge = (actionType?: string) => {
    switch (actionType) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <PlusCircle className="w-2.5 h-2.5" />
            <span>CREATE</span>
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Edit3 className="w-2.5 h-2.5" />
            <span>UPDATE</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <Trash2 className="w-2.5 h-2.5" />
            <span>DELETE</span>
          </span>
        );
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>APPROVE</span>
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300">
            <XCircle className="w-2.5 h-2.5" />
            <span>REJECT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <Settings className="w-2.5 h-2.5" />
            <span>SYSTEM</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                {language === 'lo'
                  ? 'ບັນທຶກການເຄື່ອນໄຫວລະບົບ & ມາດຕະຖານການກວດສອບ (System Audit)'
                  : 'System Audit & Compliance Activity Stream'}
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LIVE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {language === 'lo'
                ? 'ຕິດຕາມທຸກການກະທຳຂອງຜູ້ໃຊ້ຂ້າມໂມດູນ ເພື່ອຄວາມໂປ່ງໃສ ແລະ ຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ LHSE'
                : 'Real-time accountability tracking for employee movements, payroll runs, approvals, and security'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
            title="Export Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleOpenAuditModule}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>{language === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'Full Audit Trail'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mini Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">
            {language === 'lo' ? 'ບັນທຶກທັງໝົດ' : 'Total Events'}
          </span>
          <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
            {stats.total.toLocaleString()}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs">
          <span className="text-[10px] text-emerald-600 font-bold uppercase block">
            {language === 'lo' ? 'ສ້າງໃໝ່ (Creates)' : 'New Records'}
          </span>
          <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
            {stats.creates}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs">
          <span className="text-[10px] text-amber-600 font-bold uppercase block">
            {language === 'lo' ? 'ແກ້ໄຂ (Updates)' : 'Modifications'}
          </span>
          <span className="text-lg font-black font-mono text-amber-700 dark:text-amber-400">
            {stats.updates}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 text-xs">
          <span className="text-[10px] text-blue-600 font-bold uppercase block">
            {language === 'lo' ? 'ອະນຸມັດ / ຄວາມປອດໄພ' : 'Approvals & Auth'}
          </span>
          <span className="text-lg font-black font-mono text-blue-700 dark:text-blue-400">
            {stats.approvals + stats.security}
          </span>
        </div>
      </div>

      {/* Stream of Latest Events */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-xs">
        {latestLogs.map((log) => {
          const isSys = log.userId.startsWith('system') || log.actionType === 'SYSTEM';
          return (
            <div
              key={log.id}
              onClick={handleOpenAuditModule}
              className="p-3 sm:px-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {renderBadge(log.actionType)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <span className="truncate">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({log.userRole})</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px] truncate">
                      {log.module}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs truncate mt-0.5">
                    {log.details}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 font-mono self-end sm:self-auto">
                {log.entityName && (
                  <span className="hidden md:inline px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] truncate max-w-[140px]">
                    {log.entityName}
                  </span>
                )}
                <span>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
