import React, { useState } from 'react';
import { ShiftTemplate, ShiftTemplateCategory, Employee, Department, ShiftAssignment, TaskPriority } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import { calculateShiftDurationHours, DayInfo } from '../../utils/shiftValidation.ts';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  Sparkles,
  Zap,
  Layers,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { alerts } from '../../utils/alerts.ts';

interface ShiftTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ShiftTemplate[];
  employees: Employee[];
  departments: Department[];
  weekDays: DayInfo[];
  shiftAssignments: ShiftAssignment[];
  onCreateTemplate: (tpl: Omit<ShiftTemplate, 'id'>) => void;
  onUpdateTemplate: (id: string, updates: Partial<ShiftTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onApplyTemplate: (templateId: string, employeeIds: string[], dates: string[]) => void;
  language: 'lo' | 'en';
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#0284c7', // Sky
  '#dc2626', // Red
  '#4f46e5', // Indigo
  '#0d9488', // Teal
];

export const ShiftTemplatesModal: React.FC<ShiftTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  employees,
  departments,
  weekDays,
  shiftAssignments,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onApplyTemplate,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'apply'>('browse');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameLao, setNameLao] = useState('');
  const [category, setCategory] = useState<ShiftTemplateCategory>('MORNING');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [color, setColor] = useState('#2563eb');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionLao, setDescriptionLao] = useState('');

  // 1-Click Apply state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>(weekDays.slice(0, 5).map((d) => d.date)); // Default Mon-Fri

  // Calculate duration preview
  const calculatedHours = calculateShiftDurationHours(startTime, endTime, breakMinutes);

  const resetForm = () => {
    setNameEn('');
    setNameLao('');
    setCategory('MORNING');
    setPriority('MEDIUM');
    setStartTime('08:00');
    setEndTime('17:00');
    setBreakMinutes(60);
    setColor('#2563eb');
    setDepartmentId('');
    setDescriptionEn('');
    setDescriptionLao('');
    setEditingTemplateId(null);
  };

  const handleEditClick = (tpl: ShiftTemplate) => {
    setEditingTemplateId(tpl.id);
    setNameEn(tpl.nameEn);
    setNameLao(tpl.nameLao);
    setCategory(tpl.category);
    setPriority(tpl.priority || 'MEDIUM');
    setStartTime(tpl.startTime);
    setEndTime(tpl.endTime);
    setBreakMinutes(tpl.breakMinutes);
    setColor(tpl.color);
    setDepartmentId(tpl.departmentId || '');
    setDescriptionEn(tpl.descriptionEn || '');
    setDescriptionLao(tpl.descriptionLao || '');
    setActiveTab('create');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameLao.trim()) {
      alerts.error(
        language === 'lo'
          ? 'ກະລຸນາປ້ອນຊື່ແບບແຜນກະເປັນທັງພາສາລາວ ແລະ ອັງກິດ'
          : 'Please enter both Lao and English template names'
      );
      return;
    }

    const payload: Omit<ShiftTemplate, 'id'> = {
      nameEn: nameEn.trim(),
      nameLao: nameLao.trim(),
      category,
      priority,
      startTime,
      endTime,
      breakMinutes: Number(breakMinutes),
      durationHours: calculatedHours,
      color,
      departmentId: departmentId || undefined,
      descriptionEn: descriptionEn.trim() || undefined,
      descriptionLao: descriptionLao.trim() || undefined,
    };

    if (editingTemplateId) {
      onUpdateTemplate(editingTemplateId, payload);
      alerts.success(language === 'lo' ? 'ອັບເດດແບບແຜນກະສຳເລັດ' : 'Shift template updated successfully');
    } else {
      onCreateTemplate(payload);
      alerts.success(language === 'lo' ? 'ສ້າງແບບແຜນກະໃໝ່ສຳເລັດ' : 'New shift template created successfully');
    }

    resetForm();
    setActiveTab('browse');
  };

  // Filter employees for 1-Click apply
  const filteredEmployeesForApply = employees.filter((emp) => {
    if (selectedDeptId === 'all') return true;
    return emp.departmentId === selectedDeptId;
  });

  const toggleSelectAllEmps = () => {
    if (selectedEmployeeIds.length === filteredEmployeesForApply.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployeesForApply.map((e) => e.id));
    }
  };

  const toggleSelectAllDates = () => {
    if (selectedDates.length === weekDays.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(weekDays.map((d) => d.date));
    }
  };

  const handleOneClickApply = () => {
    if (!selectedTemplateId) {
      alerts.error(language === 'lo' ? 'ກະລຸນາເລືອກແບບແຜນກະ' : 'Please select a shift template');
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      alerts.error(language === 'lo' ? 'ກະລຸນາເລືອກພະນັກງານຢ່າງໜ້ອຍ 1 ຄົນ' : 'Please select at least 1 employee');
      return;
    }
    if (selectedDates.length === 0) {
      alerts.error(language === 'lo' ? 'ກະລຸນາເລືອກວັນທີຢ່າງໜ້ອຍ 1 ວັນ' : 'Please select at least 1 date');
      return;
    }

    onApplyTemplate(selectedTemplateId, selectedEmployeeIds, selectedDates);
    const targetTpl = templates.find((t) => t.id === selectedTemplateId);
    alerts.success(
      language === 'lo'
        ? `ນຳໃຊ້ແບບແຜນ '${targetTpl?.nameLao}' ໃຫ້ກັບ ${selectedEmployeeIds.length} ພະນັກງານ ສຳເລັດ!`
        : `Successfully applied '${targetTpl?.nameEn}' to ${selectedEmployeeIds.length} employees!`
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === 'lo'
          ? 'ຄຸ້ມຄອງແບບແຜນກະເຮັດວຽກ (Shift Templates Manager)'
          : 'Shift Templates & One-Click Presets'
      }
      subtitle={
        language === 'lo'
          ? 'ສ້າງ ແລະ ນຳໃຊ້ແບບແຜນກະ (ເຊັ່ນ: ກະເຊົ້າ, ກະບ່າຍ, ກະກາງຄືນ, ທ້າຍອາທິດ) ດ້ວຍ 1-Click'
          : 'Define and apply standardized shift patterns (Morning, Night, Weekend) in one click'
      }
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{language === 'lo' ? 'ລາຍການແບບແຜນກະ' : 'Saved Templates'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 text-[10px]">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setActiveTab('create');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {editingTemplateId
                ? language === 'lo'
                  ? 'ແກ້ໄຂແບບແຜນ'
                  : 'Edit Template'
                : language === 'lo'
                ? 'ສ້າງແບບແຜນໃໝ່'
                : 'Create Template'}
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedEmployeeIds(employees.slice(0, 3).map((e) => e.id));
              setActiveTab('apply');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'apply'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>{language === 'lo' ? 'ນຳໃຊ້ 1-Click Apply' : 'One-Click Batch Apply'}</span>
          </button>
        </div>

        {/* TAB 1: BROWSE TEMPLATES */}
        {activeTab === 'browse' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                        style={{ backgroundColor: tpl.color }}
                      />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                        {tpl.category}
                      </span>
                      {tpl.priority && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase inline-flex items-center gap-0.5 ${
                            tpl.priority === 'HIGH'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : tpl.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {tpl.priority === 'HIGH' ? '🔴 High' : tpl.priority === 'MEDIUM' ? '🟡 Med' : '🟢 Low'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditClick(tpl)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {language === 'lo' ? tpl.nameLao : tpl.nameEn}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {language === 'lo' ? tpl.nameEn : tpl.nameLao}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {language === 'lo' ? 'ເວລາປະຕິບັດງານ' : 'Shift Times'}:
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {tpl.startTime} - {tpl.endTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {language === 'lo' ? 'ເວລາພັກ' : 'Break Time'}:
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {tpl.breakMinutes} {language === 'lo' ? 'ນາທີ' : 'mins'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1">
                      <span className="text-slate-400">
                        {language === 'lo' ? 'ຊົ່ວໂມງລວມ' : 'Net Duration'}:
                      </span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {tpl.durationHours} hrs
                      </span>
                    </div>
                  </div>

                  {tpl.descriptionEn && (
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {language === 'lo' && tpl.descriptionLao ? tpl.descriptionLao : tpl.descriptionEn}
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setActiveTab('apply');
                    }}
                    className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'lo' ? 'ນຳໃຊ້ແບບແຜນນີ້ (1-Click)' : 'Use This Template (1-Click)'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE / EDIT TEMPLATE */}
        {activeTab === 'create' && (
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ຊື່ແບບແຜນ (ພາສາລາວ) *' : 'Template Name (Lao) *'}
                </label>
                <input
                  type="text"
                  value={nameLao}
                  onChange={(e) => setNameLao(e.target.value)}
                  placeholder="ເຊັ່ນ: ກະເຊົ້າ ມາດຕະຖານ"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ຊື່ແບບແຜນ (English) *' : 'Template Name (English) *'}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Standard Morning Shift"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ໝວດໝູ່ກະ' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ShiftTemplateCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="MORNING">Morning (ກະເຊົ້າ)</option>
                  <option value="AFTERNOON">Afternoon (ກະບ່າຍ)</option>
                  <option value="NIGHT">Night (ກະກາງຄືນ)</option>
                  <option value="WEEKEND">Weekend (ກະທ້າຍອາທິດ)</option>
                  <option value="GENERAL">General / Flexible (ທົ່ວໄປ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ລະດັບຄວາມສຳຄັນ' : 'Priority'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                >
                  <option value="HIGH">🔴 High ({language === 'lo' ? 'ສູງ' : 'High'})</option>
                  <option value="MEDIUM">🟡 Medium ({language === 'lo' ? 'ປານກາງ' : 'Medium'})</option>
                  <option value="LOW">🟢 Low ({language === 'lo' ? 'ຕ່ຳ' : 'Low'})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ເວລາເລີ່ມຕົ້ນ' : 'Start Time'}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ເວລາສິ້ນສຸດ' : 'End Time'}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'lo' ? 'ເວລາພັກຜ່ອນ (ນາທີ)' : 'Break Duration (minutes)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  step="15"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {/* Live calculated duration indicator */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    {language === 'lo' ? 'ຊົ່ວໂມງເຮັດວຽກຕົວຈິງ' : 'Calculated Working Hours'}
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-600">
                    {calculatedHours} hrs
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  {calculatedHours <= 8.0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Lao Labor Law OK (&le; 8h/day)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      &gt; 8h Standard Daily Limit
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {language === 'lo' ? 'ສີປະຈຳກະ (Calendar Color Tag)' : 'Color Badge'}
              </label>
              <div className="flex items-center gap-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                      color === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ຄຳອະທິບາຍ (Description)' : 'Template Description'}
              </label>
              <textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={2}
                placeholder="Description of operational scope or duties..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('browse');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                {editingTemplateId
                  ? language === 'lo'
                    ? 'ບັນທຶກການແກ້ໄຂ'
                    : 'Save Changes'
                  : language === 'lo'
                  ? 'ບັນທຶກແບບແຜນກະ'
                  : 'Save Template'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ONE-CLICK BATCH APPLY */}
        {activeTab === 'apply' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <strong className="font-bold block">
                  {language === 'lo'
                    ? 'ລະບົບນຳໃຊ້ແບບແຜນກະອັດຕະໂນມັດ 1-Click:'
                    : 'One-Click Fast Shift Assignment:'}
                </strong>
                <span>
                  {language === 'lo'
                    ? 'ເລືອກແບບແຜນກະ, ວັນທີໃນອາທິດ ແລະ ພະນັກງານທີ່ຕ້ອງການມອບໝາຍ. ລະບົບຈະກວດສອບຂໍ້ຂັດແຍ່ງເວລາ ແລະ ຊົ່ວໂມງລວມແບບ Real-Time.'
                    : 'Select a saved template, target dates in the active week, and employees. The engine immediately validates for overlapping shifts and weekly hour compliance.'}
                </span>
              </div>
            </div>

            {/* Step 1: Select Template */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                1. {language === 'lo' ? 'ເລືອກແບບແຜນກະທີ່ຕ້ອງການນຳໃຊ້ *' : 'Select Shift Template *'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 rounded-2xl border text-left transition-all relative ${
                      selectedTemplateId === tpl.id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tpl.color }} />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {language === 'lo' ? tpl.nameLao : tpl.nameEn}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {tpl.startTime} - {tpl.endTime} ({tpl.durationHours}h)
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Dates in Current Week */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  2. {language === 'lo' ? 'ເລືອກວັນທີໃນອາທິດ *' : 'Select Target Days *'}
                </label>
                <button
                  type="button"
                  onClick={toggleSelectAllDates}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  {selectedDates.length === weekDays.length
                    ? language === 'lo'
                      ? 'ຍົກເລີກການເລືອກທັງໝົດ'
                      : 'Deselect All'
                    : language === 'lo'
                    ? 'ເລືອກທັງ 7 ວັນ'
                    : 'Select All 7 Days'}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((d) => {
                  const isSelected = selectedDates.includes(d.date);
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDates(selectedDates.filter((x) => x !== d.date));
                        } else {
                          setSelectedDates([...selectedDates, d.date]);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-white font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[10px] block opacity-80">
                        {language === 'lo' ? d.dayShortLao : d.dayShortEn}
                      </span>
                      <span className="text-xs font-mono font-bold block">{d.formattedDateEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Select Employees */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  3. {language === 'lo' ? 'ເລືອກພະນັກງານ *' : 'Select Employees *'}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  >
                    <option value="all">{language === 'lo' ? 'ທຸກພະແນກ' : 'All Departments'}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {language === 'lo' ? d.nameLao : d.nameEn}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={toggleSelectAllEmps}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    {selectedEmployeeIds.length === filteredEmployeesForApply.length
                      ? language === 'lo'
                        ? 'ຍົກເລີກ'
                        : 'Deselect All'
                      : language === 'lo'
                      ? 'ເລືອກທັງໝົດ'
                      : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
                {filteredEmployeesForApply.map((emp) => {
                  const isChecked = selectedEmployeeIds.includes(emp.id);
                  return (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedEmployeeIds(selectedEmployeeIds.filter((x) => x !== emp.id));
                          } else {
                            setSelectedEmployeeIds([...selectedEmployeeIds, emp.id]);
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="truncate text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {language === 'lo'
                            ? `${emp.firstNameLao} ${emp.lastNameLao}`
                            : `${emp.firstNameEn} ${emp.lastNameEn}`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {emp.employeeCode}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedEmployeeIds.length} {language === 'lo' ? 'ພະນັກງານ' : 'Employees'}
                </span>{' '}
                &times;{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedDates.length} {language === 'lo' ? 'ມື້' : 'Days'}
                </span>{' '}
                ={' '}
                <span className="font-bold font-mono text-emerald-600">
                  {selectedEmployeeIds.length * selectedDates.length}{' '}
                  {language === 'lo' ? 'ກະທັງໝົດ' : 'Total Shifts'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {language === 'lo' ? 'ກັບຄືນ' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleOneClickApply}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ຢືນຢັນ 1-Click Apply' : 'Apply Now (1-Click)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
