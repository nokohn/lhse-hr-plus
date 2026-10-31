import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { DataTable, Column } from '../components/common/DataTable.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { ExpenseClaim } from '../types/index.ts';
import { alerts } from '../utils/alerts.ts';
import {
  Receipt,
  Plus,
  FileCheck,
  Paperclip,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useFormAutoSave } from '../hooks/useFormAutoSave.ts';
import { FormAutoSaveIndicator } from '../components/common/FormAutoSaveIndicator.tsx';

export const ExpenseModule: React.FC = () => {
  const {
    t,
    language,
    employees,
    expenseClaims,
    activeSubModule,
    setActiveSubModule,
    submitExpenseClaim,
    currentUser,
  } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'TRAVEL' | 'SUPPLIES' | 'MEALS' | 'REPRESENTATION' | 'OTHER'>('TRAVEL');
  const [totalAmount, setTotalAmount] = useState(2500000);
  const [receiptsCount, setReceiptsCount] = useState(2);

  const initialExpenseDraft = {
    title: '',
    category: 'TRAVEL' as const,
    totalAmount: 2500000,
    receiptsCount: 2,
  };

  const expenseAutoSave = useFormAutoSave({
    formId: 'expense_claim_submission',
    formData: { title, category, totalAmount, receiptsCount },
    setFormData: (val: any) => {
      const data = typeof val === 'function' ? val({ title, category, totalAmount, receiptsCount }) : val;
      if (data.title !== undefined) setTitle(data.title);
      if (data.category) setCategory(data.category);
      if (data.totalAmount !== undefined) setTotalAmount(data.totalAmount);
      if (data.receiptsCount !== undefined) setReceiptsCount(data.receiptsCount);
    },
    initialData: initialExpenseDraft,
    isOpen: createModalOpen,
  });

  const handleSubmit = () => {
    if (!title.trim() || totalAmount <= 0) {
      alerts.error(
        language === 'lo' ? 'ຂໍ້ມູນບໍ່ຄົບຖ້ວນ' : 'Invalid Submission',
        language === 'lo' ? 'ກະລຸນາໃສ່ຫົວຂໍ້ ແລະ ຈຳນວນເງິນ' : 'Please provide title and positive claim amount.'
      );
      return;
    }
    submitExpenseClaim(title, category, totalAmount, receiptsCount);
    expenseAutoSave.clearDraft();
    setCreateModalOpen(false);
    setTitle('');
  };

  const columns: Column<ExpenseClaim>[] = [
    {
      key: 'claimNumber',
      header: 'Claim #',
      render: (c) => <span className="font-mono font-bold text-blue-600">{c.claimNumber}</span>,
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
    { key: 'title', header: language === 'lo' ? 'ຫົວຂໍ້ລາຍຈ່າຍ' : 'Title' },
    { key: 'category', header: 'Category' },
    {
      key: 'totalAmount',
      header: language === 'lo' ? 'ຈຳນວນເງິນ (LAK)' : 'Total Amount',
      render: (c) => (
        <span className="font-mono font-black text-slate-900 dark:text-slate-100">
          {c.totalAmount.toLocaleString()} LAK
        </span>
      ),
    },
    {
      key: 'receiptsCount',
      header: language === 'lo' ? 'ໃບຮັບເງິນ' : 'Receipts',
      render: (c) => (
        <span className="flex items-center gap-1 text-slate-500 font-semibold text-xs">
          <Paperclip className="w-3.5 h-3.5" />
          {c.receiptsCount} files
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (c) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            c.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : c.status === 'PENDING'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {t(c.status as any)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={expenseClaims}
        columns={columns}
        filename="LHSE_Expense_Claims"
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('submitExpense')}</span>
          </button>
        }
      />

      {/* Submit Claim Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('submitExpense')}
        subtitle="Submit official enterprise expense reimbursement request"
        maxWidth="md"
        footer={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              {t('submit')}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          {/* Draft Auto-Save Feedback */}
          <FormAutoSaveIndicator
            isSaving={expenseAutoSave.isSaving}
            lastSaved={expenseAutoSave.lastSaved}
            isRestored={expenseAutoSave.isRestored}
            onDiscard={() => {
              expenseAutoSave.discardDraft();
              setTitle(initialExpenseDraft.title);
              setCategory(initialExpenseDraft.category);
              setTotalAmount(initialExpenseDraft.totalAmount);
              setReceiptsCount(initialExpenseDraft.receiptsCount);
            }}
            language={language}
          />

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຫົວຂໍ້ການເບີກຈ່າຍ *' : 'Claim Title *'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fuel and road toll for Vientiane - Khammouane trip"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ໝວດໝູ່' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="TRAVEL">Business Travel</option>
                <option value="SUPPLIES">Office Supplies</option>
                <option value="MEALS">Official Meals</option>
                <option value="REPRESENTATION">Representation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຈຳນວນເງິນ (LAK) *' : 'Total Amount (LAK) *'}
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              {language === 'lo' ? 'ຈຳນວນເອກະສານໃບຮັບເງິນທີ່ແນບມານຳ' : 'Receipt Attachments Count'}
            </label>
            <input
              type="number"
              min={1}
              value={receiptsCount}
              onChange={(e) => setReceiptsCount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
