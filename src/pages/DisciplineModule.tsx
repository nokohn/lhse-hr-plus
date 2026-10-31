import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { DisciplinaryCase } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  ShieldAlert,
  Lock,
  Plus,
  FileWarning,
  Eye,
  Printer,
  AlertTriangle,
} from 'lucide-react';
import { useFormAutoSave } from '../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../components/common/FormAutoSaveIndicator.tsx';

export const DisciplineModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    disciplinaryCases,
    activeSubModule,
    setActiveSubModule,
    createDisciplinaryCase,
    currentUser,
  } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Confidentiality gate: Only HR Admin, Super Admin, and Executive
  const isAuthorized = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HR_ADMIN' || currentUser.role === 'EXECUTIVE';

  const [empId, setEmpId] = useState(employees[0]?.id || 'emp-005');
  const [category, setCategory] = useState<'ATTENDANCE' | 'MISCONDUCT' | 'POLICY_VIOLATION' | 'CONFIDENTIALITY' | 'OTHER'>('ATTENDANCE');
  const [severity, setSeverity] = useState<'VERBAL_WARNING' | 'FIRST_WRITTEN_WARNING' | 'SECOND_WRITTEN_WARNING' | 'FINAL_WARNING'>('FIRST_WRITTEN_WARNING');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const initialDisciplineDraft = {
    empId: employees[0]?.id || 'emp-005',
    category: 'ATTENDANCE' as const,
    severity: 'FIRST_WRITTEN_WARNING' as const,
    incidentDate: new Date().toISOString().split('T')[0],
    description: '',
    actionTaken: '',
  };

  const disciplineAutoSave = useFormAutoSave({
    formId: 'discipline_case_submission',
    formData: { empId, category, severity, incidentDate, description, actionTaken },
    setFormData: (val: any) => {
      const d = typeof val === 'function' ? val({ empId, category, severity, incidentDate, description, actionTaken }) : val;
      if (d.empId) setEmpId(d.empId);
      if (d.category) setCategory(d.category);
      if (d.severity) setSeverity(d.severity);
      if (d.incidentDate) setIncidentDate(d.incidentDate);
      if (d.description !== undefined) setDescription(d.description);
      if (d.actionTaken !== undefined) setActionTaken(d.actionTaken);
    },
    initialData: initialDisciplineDraft,
    isOpen: createModalOpen,
  });

  if (!isAuthorized) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <Lock className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
          {language === 'lo' ? 'ຂໍ້ມູນຄວາມລັບສະເພາະ (Restricted Access)' : 'Confidential Access Restricted'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {language === 'lo'
            ? 'ໂມດູນບັນທຶກລະບຽບວິໄນ ແລະ ໜັງສືເຕືອນ ແມ່ນສະຫງວນໄວ້ສະເພາະ ຫົວໜ້າພະແນກບຸກຄະລາກອນ ແລະ ຄະນະຜູ້ອຳນວຍການເທົ່ານັ້ນ.'
            : 'Disciplinary cases and warning records are strictly restricted to HR Administration and Executive leadership.'}
        </p>
      </div>
    );
  }

  const handleCreate = () => {
    if (!description.trim()) {
      alerts.error(
        language === 'lo' ? 'ກະລຸນາໃສ່ລາຍລະອຽດ' : 'Missing Description',
        language === 'lo' ? 'ກະລຸນາໃສ່ລາຍລະອຽດເຫດການ' : 'Please provide incident details.'
      );
      return;
    }

    const caseNumber = `LHSE-DC-2026-${String(disciplinaryCases.length + 1).padStart(3, '0')}`;
    createDisciplinaryCase({
      caseNumber,
      employeeId: empId,
      incidentDate,
      category,
      severity,
      description,
      actionTaken: actionTaken || 'Formal warning issued and recorded in employee personnel file.',
      status: 'OPEN',
      issuedBy: currentUser.fullName,
      isConfidential: true,
    });

    disciplineAutoSave.clearDraft();
    setCreateModalOpen(false);
  };

  const columns: Column<DisciplinaryCase>[] = [
    {
      key: 'caseNumber',
      header: 'Case #',
      render: (c) => <span className="font-mono font-bold text-rose-600">{c.caseNumber}</span>,
    },
    {
      key: 'employeeId',
      header: t('employee'),
      render: (c) => {
        const emp = employees.find((e) => e.id === c.employeeId);
        return (
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {emp ? (language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`) : c.employeeId}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">{emp?.employeeCode}</div>
          </div>
        );
      },
    },
    { key: 'category', header: 'Category' },
    {
      key: 'severity',
      header: 'Severity',
      render: (c) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          {c.severity.replace(/_/g, ' ')}
        </span>
      ),
    },
    { key: 'incidentDate', header: 'Incident Date' },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (c) => (
        <button
          onClick={() => {
            setSelectedCase(c);
            setViewModalOpen(true);
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
          title="View Case Letter"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <strong className="font-bold">{t('confidentialNotice')}</strong>
        </div>
      </div>

      <DataTable
        data={disciplinaryCases}
        columns={columns}
        filename="LHSE_Disciplinary_Records"
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('warningLetters')}</span>
          </button>
        }
      />

      {/* Warning Letter Preview Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedCase ? `Warning Notice: ${selectedCase.caseNumber}` : ''}
        subtitle="Confidential Employee Disciplinary Document"
        maxWidth="2xl"
        footer={
          <button
            onClick={() => alerts.success(language === 'lo' ? 'ພິມໜັງສືເຕືອນສຳເລັດ' : 'Warning letter exported to print')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print')}</span>
          </button>
        }
      >
        {selectedCase && (
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs font-sans">
            <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800 space-y-1">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-slate-100">
                Lao Holding State Enterprise (LHSE)
              </h3>
              <p className="font-semibold text-rose-600 tracking-wider">
                OFFICIAL WARNING LETTER ({selectedCase.severity.replace(/_/g, ' ')})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[10px]">Case Reference:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedCase.caseNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Incident Date:</span>
                <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedCase.incidentDate}</strong>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Incident Description:</span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                {selectedCase.description}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">Corrective Action Mandate:</span>
              <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                {selectedCase.actionTaken}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between text-[11px] text-slate-500">
              <span>Issued By: {selectedCase.issuedBy}</span>
              <span>Status: {selectedCase.status}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Warning Letter Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('warningLetters')}
        subtitle="Issue official disciplinary record and action plan"
        maxWidth="lg"
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs"
            >
              {t('save')}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          {/* Draft Auto-Save Feedback */}
          <FormAutoSaveIndicator
            isSaving={disciplineAutoSave.isSaving}
            lastSaved={disciplineAutoSave.lastSaved}
            isRestored={disciplineAutoSave.isRestored}
            onDiscard={() => {
              disciplineAutoSave.discardDraft();
              setEmpId(initialDisciplineDraft.empId);
              setCategory(initialDisciplineDraft.category);
              setSeverity(initialDisciplineDraft.severity);
              setIncidentDate(initialDisciplineDraft.incidentDate);
              setDescription('');
              setActionTaken('');
            }}
            language={language}
          />

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">{t('employee')}</label>
            <select
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.employeeCode} - {e.firstNameLao} {e.lastNameLao} ({e.firstNameEn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="ATTENDANCE">Attendance & Lateness</option>
                <option value="MISCONDUCT">General Misconduct</option>
                <option value="POLICY_VIOLATION">State Enterprise Policy</option>
                <option value="CONFIDENTIALITY">Confidentiality Breach</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="VERBAL_WARNING">Verbal Warning</option>
                <option value="FIRST_WRITTEN_WARNING">First Written Warning</option>
                <option value="SECOND_WRITTEN_WARNING">Second Written Warning</option>
                <option value="FINAL_WARNING">Final Warning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Incident Date</label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Incident Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the observed violation and factual details..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Required Corrective Action
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Employee counseling and written commitment"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
