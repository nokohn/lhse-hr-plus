import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { EnterpriseDocument, DocumentVersion } from '../../types/index.ts';
import { computeLineDiff, DiffLine } from '../../services/documentData.ts';
import { Modal } from '../common/Modal.tsx';
import {
  History,
  RotateCcw,
  GitCompare,
  FileText,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  Download,
  Copy,
  Check,
  Eye,
  Calendar,
  Building,
  ShieldAlert,
  Sparkles,
  Camera,
  Layers,
} from 'lucide-react';

interface DocumentVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EnterpriseDocument | null;
  initialSelectedVersionId?: string;
  onOpenEditModal?: (doc: EnterpriseDocument) => void;
}

export const DocumentVersionHistoryModal: React.FC<DocumentVersionHistoryModalProps> = ({
  isOpen,
  onClose,
  document,
  initialSelectedVersionId,
  onOpenEditModal,
}) => {
  const { language, restoreDocumentVersion, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'timeline' | 'diff' | 'preview'>('timeline');
  const [selectedVerId, setSelectedVerId] = useState<string>('');
  const [diffVerAId, setDiffVerAId] = useState<string>('');
  const [diffVerBId, setDiffVerBId] = useState<string>('');

  // Restore confirmation dialog state
  const [restoreConfirmVer, setRestoreConfirmVer] = useState<DocumentVersion | null>(null);
  const [restoreNote, setRestoreNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [scannedPageIdx, setScannedPageIdx] = useState(0);

  // Sync selected version when document or modal opens
  React.useEffect(() => {
    if (document && document.versions.length > 0) {
      const targetId = initialSelectedVersionId || document.versions[0]?.id;
      setSelectedVerId(targetId);

      // Default diff: compare previous version with current active version
      const activeVer = document.versions.find((v) => v.status === 'ACTIVE') || document.versions[0];
      const olderVer = document.versions.find((v) => v.id !== activeVer.id) || document.versions[0];
      setDiffVerAId(olderVer.id);
      setDiffVerBId(activeVer.id);
    }
  }, [document, initialSelectedVersionId, isOpen]);

  if (!document) return null;

  const selectedVer = document.versions.find((v) => v.id === selectedVerId) || document.versions[0];
  const verA = document.versions.find((v) => v.id === diffVerAId) || document.versions[1] || document.versions[0];
  const verB = document.versions.find((v) => v.id === diffVerBId) || document.versions[0];

  // Compute diff lines between Ver A and Ver B
  const diffLines = useMemo(() => {
    if (!verA || !verB) return [];
    return computeLineDiff(verA.content, verB.content);
  }, [verA, verB]);

  const diffStats = useMemo(() => {
    let additions = 0;
    let removals = 0;
    diffLines.forEach((l) => {
      if (l.type === 'added') additions++;
      if (l.type === 'removed') removals++;
    });
    return { additions, removals };
  }, [diffLines]);

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenRestoreConfirm = (ver: DocumentVersion) => {
    setRestoreConfirmVer(ver);
    setRestoreNote(
      language === 'lo'
        ? `ກູ້ຄືນເນື້ອໃນຈາກ ${ver.version} (${new Date(ver.changedAt).toLocaleDateString()})`
        : `Reverting content back to ${ver.version} snapshot published by ${ver.changedBy}`
    );
  };

  const handleExecuteRestore = () => {
    if (!restoreConfirmVer) return;
    restoreDocumentVersion(document.id, restoreConfirmVer.id, restoreNote);
    setRestoreConfirmVer(null);
    onClose();
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString(language === 'lo' ? 'lo-LA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="5xl"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? document.titleLao : document.title}
                </span>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {document.docNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active {document.currentVersion}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                {language === 'lo'
                  ? `ລະບົບຄວບຄຸມເວີຊັນເອກະສານ • ທັງໝົດ ${document.versions.length} ເວີຊັນທີ່ບັນທຶກໄວ້`
                  : `Document Version Control System • ${document.versions.length} revisions tracked`}
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-[11px] text-slate-400">
              {language === 'lo'
                ? `ການກູ້ຄືນຈະສ້າງເວີຊັນໃໝ່ ແລະ ຮັກສາປະຫວັດເດີມທັງໝົດໄວ້`
                : `Restoring generates a new version while preserving complete audit history.`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {language === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Top Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ລາຍການເວີຊັນ' : 'Version Timeline'} ({document.versions.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('diff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'diff'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ປຽບທຽບຄວາມຕ່າງ (Diff)' : 'Compare Versions (Diff)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ເບິ່ງເນື້ອໃນເອກະສານ' : 'Document Content'}</span>
              </button>
            </div>

            {onOpenEditModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEditModal(document);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ແກ້ໄຂ & ສ້າງເວີຊັນໃໝ່' : 'Author New Version'}</span>
              </button>
            )}
          </div>

          {/* TAB 1: VERSION TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 space-y-4">
                {document.versions.map((ver, idx) => {
                  const isActive = ver.version === document.currentVersion || ver.status === 'ACTIVE';
                  const isRestored = ver.changeType === 'RESTORE' || Boolean(ver.restoredFromVersion);

                  return (
                    <div
                      key={ver.id}
                      className={`relative p-4 rounded-2xl border transition-all ${
                        isActive
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-[27px] top-5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 border-white ring-4 ring-blue-100 dark:ring-blue-950'
                            : isRestored
                            ? 'bg-purple-600 border-white'
                            : 'bg-slate-400 border-white dark:border-slate-900'
                        }`}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : isRestored
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {ver.version}
                          </span>

                          {isActive && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {language === 'lo' ? 'ເວີຊັນປັດຈຸບັນ (Active)' : 'Current Active'}
                            </span>
                          )}

                          {isRestored && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              {language === 'lo' ? `ກູ້ຄືນຈາກ ${ver.restoredFromVersion}` : `Restored from ${ver.restoredFromVersion}`}
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              ver.changeType === 'MAJOR'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : ver.changeType === 'MINOR'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : ver.changeType === 'RESTORE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {ver.changeType}
                          </span>

                          <span className="text-[11px] text-slate-400 font-mono">
                            {ver.fileSize}
                          </span>
                        </div>

                        {/* Actions for this version */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVerId(ver.id);
                              setActiveTab('preview');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Preview Content"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'lo' ? 'ເບິ່ງເນື້ອໃນ' : 'Preview'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setDiffVerAId(ver.id);
                              setDiffVerBId(document.versions[0].id);
                              setActiveTab('diff');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Compare with Current"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                            <span>{language === 'lo' ? 'ປຽບທຽບ' : 'Diff'}</span>
                          </button>

                          {/* PROMINENT RESTORE BUTTON */}
                          {!isActive && (
                            <button
                              onClick={() => handleOpenRestoreConfirm(ver)}
                              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs"
                              title={language === 'lo' ? `ກູ້ຄືນເອກະສານກັບໄປໃຊ້ເວີຊັນ ${ver.version}` : `Rollback to this version ${ver.version}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{language === 'lo' ? 'ກູ້ຄືນເວີຊັນນີ້' : 'Restore'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Version Details */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold">
                              {ver.changedBy.charAt(0)}
                            </div>
                            <span>{ver.changedBy}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({ver.changedByRole})</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateTime(ver.changedAt)}</span>
                          </div>
                        </div>

                        {/* Change Summary Callout */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                          <div className="flex items-start gap-2">
                            <Tag className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold text-[11px] text-slate-900 dark:text-slate-100 mr-1.5">
                                {language === 'lo' ? 'ບັນທຶກການປ່ຽນແປງ:' : 'Change Note:'}
                              </span>
                              <span className="font-sans">{ver.changeSummary}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VERSION COMPARISON & DIFF */}
          {activeTab === 'diff' && (
            <div className="space-y-4">
              {/* Selectors Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {language === 'lo' ? 'ເວີຊັນເກົ່າ (A):' : 'Base Version (A):'}
                    </span>
                    <select
                      value={diffVerAId}
                      onChange={(e) => setDiffVerAId(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                    >
                      {document.versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.version} - {v.changedBy} ({new Date(v.changedAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400" />

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {language === 'lo' ? 'ເວີຊັນໃໝ່ (B):' : 'Compare With (B):'}
                    </span>
                    <select
                      value={diffVerBId}
                      onChange={(e) => setDiffVerBId(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                    >
                      {document.versions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.version} {v.status === 'ACTIVE' ? '(Current Active)' : ''} - {v.changedBy}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Diff Stats & Restore Shortcut */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      +{diffStats.additions} added
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      -{diffStats.removals} removed
                    </span>
                  </div>

                  {verA && verA.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleOpenRestoreConfirm(verA)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'lo' ? `ກູ້ຄືນ ${verA.version}` : `Restore ${verA.version}`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Line-by-line Diff Visualizer */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                  <span>
                    {language === 'lo'
                      ? `ປຽບທຽບ: ${verA?.version} (ສີແດງ = ຖືກລຶບ/ແກ້ໄຂ) ↔ ${verB?.version} (ສີຂຽວ = ເພີ່ມໃໝ່)`
                      : `Diff Comparison: ${verA?.version} (Red = Removed/Modified) ↔ ${verB?.version} (Green = Added/New)`}
                  </span>
                  <span>{diffLines.length} lines analyzed</span>
                </div>

                <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                  {diffLines.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      {language === 'lo' ? 'ບໍ່ມີຄວາມແຕກຕ່າງລະຫວ່າງສອງເວີຊັນນີ້' : 'No differences found between these two versions.'}
                    </div>
                  ) : (
                    diffLines.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start px-3 py-1 transition-colors ${
                          line.type === 'added'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-l-4 border-emerald-500'
                            : line.type === 'removed'
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-l-4 border-rose-500'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="w-8 shrink-0 text-slate-400 text-right pr-2 select-none font-mono text-[10px]">
                          {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                        </span>
                        <span className="w-10 shrink-0 text-slate-400 text-right pr-3 select-none font-mono text-[10px]">
                          {line.lineNumNew || line.lineNumOld || ''}
                        </span>
                        <span className="whitespace-pre-wrap break-all leading-relaxed font-sans text-xs">
                          {line.text || ' '}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FULL CONTENT PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Preview toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {language === 'lo' ? 'ເລືອກເວີຊັນທີ່ຕ້ອງການເບິ່ງ:' : 'View Snapshot of Version:'}
                  </span>
                  <select
                    value={selectedVerId}
                    onChange={(e) => setSelectedVerId(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono"
                  >
                    {document.versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.version} {v.status === 'ACTIVE' ? '(Current Active)' : ''} - {v.changedBy} ({new Date(v.changedAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyContent(selectedVer.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (language === 'lo' ? 'ສຳເນົາແລ້ວ' : 'Copied!') : (language === 'lo' ? 'ສຳເນົາຂໍ້ຄວາມ' : 'Copy Text')}</span>
                  </button>

                  {selectedVer.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleOpenRestoreConfirm(selectedVer)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === 'lo' ? `ກູ້ຄືນເວີຊັນ ${selectedVer.version}` : `Restore ${selectedVer.version}`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Scanned Physical Pages Viewer (If Document Was Digitized via Camera) */}
              {(() => {
                const pages = (selectedVer.scannedPages && selectedVer.scannedPages.length > 0)
                  ? selectedVer.scannedPages
                  : (document.scannedPages && document.scannedPages.length > 0)
                  ? document.scannedPages
                  : (selectedVer.scannedImageUrl || document.scannedImageUrl)
                  ? [selectedVer.scannedImageUrl || document.scannedImageUrl!]
                  : [];

                if (pages.length === 0) return null;

                const safePageIdx = Math.min(scannedPageIdx, pages.length - 1);
                const activePageImg = pages[safePageIdx];

                return (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs text-slate-100">
                          {language === 'lo' ? 'ຮູບສະແກນເອກະສານຕົວຈິງ (Physical Scan)' : 'Physical Scanned Document Dossier'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                          {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Page {safePageIdx + 1} of {pages.length}
                      </span>
                    </div>

                    {/* Scanned Image Display */}
                    <div className="relative w-full max-h-[380px] bg-black/90 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800 shadow-inner">
                      <img
                        src={activePageImg}
                        alt={`Scanned Page ${safePageIdx + 1}`}
                        className="max-h-[360px] w-auto max-w-full object-contain rounded-md"
                      />
                    </div>

                    {/* Page Selector Thumbnails */}
                    {pages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                        {pages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setScannedPageIdx(idx)}
                            className={`shrink-0 w-14 h-18 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              idx === safePageIdx
                                ? 'border-emerald-400 ring-2 ring-emerald-500/30 scale-105'
                                : 'border-slate-700 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Document Paper Container */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs max-h-[500px] overflow-y-auto space-y-6">
                {/* Official Letterhead / Header */}
                <div className="border-b-2 border-slate-900 dark:border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                      {language === 'lo' ? selectedVer.titleLao : selectedVer.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-mono font-bold text-blue-600">{document.docNumber}</span>
                      <span>•</span>
                      <span>Category: {document.category}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-purple-600">Version: {selectedVer.version}</span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    <div>Promulgated: {formatDateTime(selectedVer.changedAt)}</div>
                    <div>Signee: {selectedVer.changedBy}</div>
                  </div>
                </div>

                {/* Body Content */}
                <div className="font-serif text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap space-y-4">
                  {selectedVer.content}
                </div>

                {/* Bottom Signature Section Watermark */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-8 flex items-center justify-between text-xs text-slate-400 font-sans">
                  <div>
                    Lao Holding State Enterprise (LHSE) • Confidential Concession & Corporate Document
                  </div>
                  <div className="font-mono">
                    Version Verified: {selectedVer.version} ({selectedVer.status})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* CONFIRM RESTORE MODAL */}
      {restoreConfirmVer && (
        <Modal
          isOpen={Boolean(restoreConfirmVer)}
          onClose={() => setRestoreConfirmVer(null)}
          title={
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5" />
              <span>{language === 'lo' ? 'ຢືນຢັນການກູ້ຄືນເວີຊັນເອກະສານ' : 'Confirm Version Restore'}</span>
            </div>
          }
          subtitle={
            language === 'lo'
              ? `ທ່ານກຳລັງຈະກູ້ຄືນເອກະສານ ${document.docNumber} ກັບໄປໃຊ້ເວີຊັນ ${restoreConfirmVer.version}`
              : `You are restoring document ${document.docNumber} to version ${restoreConfirmVer.version}`
          }
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                onClick={() => setRestoreConfirmVer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                onClick={handleExecuteRestore}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'lo' ? 'ຢືນຢັນກູ້ຄືນດຽວນີ້' : 'Confirm & Restore'}</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {language === 'lo'
                    ? `ກົດລະບຽບການຄວບຄຸມເວີຊັນ (Version Control Rule)`
                    : `Version Control Safety Guarantee`}
                </span>
              </div>
              <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                {language === 'lo'
                  ? `ການກູ້ຄືນຈະບໍ່ລຶບ ຫຼື ທັບຊ້ອນປະຫວັດເກົ່າ. ລະບົບຈະສ້າງເວີຊັນໃໝ່ (ເຊັ່ນ v2.2) ໂດຍດຶງເນື້ອໃນຈາກ ${restoreConfirmVer.version} ມາເປັນເວີຊັນປັດຈຸບັນ ແລະ ບັນທຶກ Audit Log ຢ່າງໂປ່ງໃສ.`
                  : `Restoring will NOT delete or overwrite existing history. A brand new version will be published holding the snapshot of ${restoreConfirmVer.version}, and all previous versions remain preserved in the audit log.`}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ເຫດຜົນການກູ້ຄືນ / ໝາຍເຫດ (Audit Log Note):' : 'Restoration Reason / Audit Note:'}
              </label>
              <textarea
                value={restoreNote}
                onChange={(e) => setRestoreNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder={
                  language === 'lo'
                    ? 'ໃສ່ເຫດຜົນເຊັ່ນ: ກູ້ຄືນເນື່ອງຈາກມີຄຳສັ່ງແນະນຳຈາກຄະນະກວດກາ...'
                    : 'e.g. Reverting to v1.2 due to regulatory review committee findings...'
                }
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
              <div>Target Version: <span className="font-bold text-slate-900 dark:text-slate-100">{restoreConfirmVer.version}</span></div>
              <div>Author: {restoreConfirmVer.changedBy}</div>
              <div>Originally Published: {formatDateTime(restoreConfirmVer.changedAt)}</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
