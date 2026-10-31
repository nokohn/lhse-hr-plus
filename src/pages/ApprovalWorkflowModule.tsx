import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { ApprovalRequest } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  GitPullRequest,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
  MessageSquare,
  ShieldCheck,
  History,
} from 'lucide-react';

export const ApprovalWorkflowModule: React.FC = () => {
  const {
    t,
    language,
    approvalRequests,
    activeSubModule,
    setActiveSubModule,
    processApproval,
    currentUser,
  } = useApp();

  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const pendingList = approvalRequests.filter((a) => a.status === 'PENDING');
  const myRequestsList = approvalRequests.filter((a) => a.requesterId === (currentUser.employeeId || 'emp-005'));
  const historyList = approvalRequests.filter((a) => a.status !== 'PENDING');

  const handleAction = async (req: ApprovalRequest, action: 'APPROVE' | 'REJECT' | 'RETURN') => {
    let comment = commentText;
    if (action !== 'APPROVE' && !comment.trim()) {
      const promptRes = await alerts.promptText(
        language === 'lo' ? 'ກະລຸນາໃສ່ເຫດຜົນ' : 'Enter Reason / Comment',
        language === 'lo' ? 'ເຫດຜົນການປະຕິເສດ ຫຼື ສົ່ງກັບແກ້ໄຂ...' : 'Explain why this request is rejected or returned...'
      );
      if (!promptRes) return;
      comment = promptRes;
    }

    await processApproval(req.id, action, comment || 'Approved in central workflow');
    setDetailModalOpen(false);
    setCommentText('');
  };

  const columns: Column<ApprovalRequest>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (a) => (
        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          {a.type}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Request Title',
      render: (a) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{a.title}</div>
          <div className="text-[11px] text-slate-400">
            {a.requesterName} • {a.departmentName}
          </div>
        </div>
      ),
    },
    {
      key: 'amountOrDays',
      header: 'Magnitude',
      render: (a) => <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{a.amountOrDays || '-'}</span>,
    },
    {
      key: 'step',
      header: 'Workflow Step',
      render: (a) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
            {a.currentStep}
          </span>
          <span className="text-slate-400">of {a.totalSteps}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (a) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            a.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : a.status === 'PENDING'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {t(a.status as any)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSelectedRequest(a);
              setDetailModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            title="Review Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {a.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleAction(a, 'APPROVE')}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs"
              >
                {t('approve')}
              </button>
              <button
                onClick={() => handleAction(a, 'REJECT')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800"
              >
                {t('reject')}
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Submodule Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubModule('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'pending'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{t('pendingApprovals')} ({pendingList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubModule('my-requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'my-requests'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          <span>{t('myRequests')} ({myRequestsList.length})</span>
        </button>
        <button
          onClick={() => setActiveSubModule('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubModule === 'history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('approvalHistory')}</span>
        </button>
      </div>

      {activeSubModule === 'pending' && (
        <DataTable
          data={pendingList}
          columns={columns}
          filename="LHSE_Pending_Approvals"
        />
      )}

      {activeSubModule === 'my-requests' && (
        <DataTable
          data={myRequestsList}
          columns={columns}
          filename="LHSE_My_Requests"
        />
      )}

      {activeSubModule === 'history' && (
        <DataTable
          data={historyList}
          columns={columns}
          filename="LHSE_Approval_History"
        />
      )}

      {/* Review Request Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedRequest?.title || 'Review Approval Request'}
        subtitle="Central Approval Engine Verification"
        maxWidth="lg"
        footer={
          selectedRequest?.status === 'PENDING' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(selectedRequest, 'RETURN')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
              >
                {t('returnCorrection')}
              </button>
              <button
                onClick={() => handleAction(selectedRequest, 'REJECT')}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
              >
                {t('reject')}
              </button>
              <button
                onClick={() => handleAction(selectedRequest, 'APPROVE')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
              >
                {t('approve')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDetailModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              {t('close')}
            </button>
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <div>
                <span className="text-slate-400 block text-[10px]">Requester:</span>
                <strong className="text-slate-900 dark:text-slate-100">{selectedRequest.requesterName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Department:</span>
                <strong className="text-slate-900 dark:text-slate-100">{selectedRequest.departmentName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Type / Magnitude:</span>
                <strong className="text-blue-600 font-mono">{selectedRequest.amountOrDays}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Submitted:</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {selectedRequest.status === 'PENDING' && (
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {language === 'lo' ? 'ຄຳເຫັນຜູ້ອະນຸມັດ (Approver Comments)' : 'Approver Comments'}
                </label>
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Optional review remarks or instructions..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            )}

            {/* Audit History Timeline */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-blue-600" />
                Workflow History Log
              </span>
              <div className="space-y-2">
                {selectedRequest.history.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 text-[11px] space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800 dark:text-slate-200">{h.actorName} ({h.actorRole})</span>
                      <span className="text-blue-600">{h.action}</span>
                    </div>
                    {h.comments && <p className="text-slate-600 dark:text-slate-400 italic">"{h.comments}"</p>}
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
