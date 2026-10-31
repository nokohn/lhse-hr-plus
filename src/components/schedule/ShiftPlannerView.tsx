import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ShiftAssignment,
  ShiftTemplate,
  ShiftConflict,
  Employee,
  Department,
  TaskPriority,
} from '../../types/index.ts';
import {
  getWeekDates,
  detectAllShiftConflicts,
  calculateWeeklyHours,
  validateProposedAssignment,
  calculateShiftDurationHours,
  DayInfo,
} from '../../utils/shiftValidation.ts';
import { ShiftTemplatesModal } from './ShiftTemplatesModal.tsx';
import { ConflictInspectorModal } from './ConflictInspectorModal.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Zap,
  Layers,
  Sparkles,
  Download,
  CheckCircle2,
  User,
  Users,
  Eye,
  ArrowRight,
  Building2,
  Info,
} from 'lucide-react';
import { alerts } from '../../utils/alerts.ts';

export const ShiftPlannerView: React.FC = () => {
  const {
    language,
    employees,
    departments,
    shiftTemplates,
    shiftAssignments,
    assignShift,
    removeShiftAssignment,
    updateShiftAssignment,
    applyShiftTemplate,
    createShiftTemplate,
    updateShiftTemplate,
    deleteShiftTemplate,
    clearWeekAssignments,
  } = useApp();

  // Anchor date for calendar week (defaults to system current date 2026-10-24)
  const [anchorDateStr, setAnchorDateStr] = useState<string>('2026-10-24');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDayDate, setSelectedDayDate] = useState<string>('2026-10-24');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modals state
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState<boolean>(false);

  // Manual Add Shift Modal state
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('2026-10-24');
  const [selectedTemplateForAdd, setSelectedTemplateForAdd] = useState<string>('custom');
  const [shiftTitleEn, setShiftTitleEn] = useState<string>('Standard Morning Shift');
  const [shiftTitleLao, setShiftTitleLao] = useState<string>('ກະເຊົ້າ ມາດຕະຖານ');
  const [shiftStartTime, setShiftStartTime] = useState<string>('08:00');
  const [shiftEndTime, setShiftEndTime] = useState<string>('17:00');
  const [shiftBreakMinutes, setShiftBreakMinutes] = useState<number>(60);
  const [shiftColor, setShiftColor] = useState<string>('#2563eb');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');

  // Drag and Drop hover state
  const [dragOverCellKey, setDragOverCellKey] = useState<string | null>(null);

  // Week Dates
  const weekDays = useMemo(() => getWeekDates(anchorDateStr), [anchorDateStr]);
  const weekDateStrings = useMemo(() => weekDays.map((d) => d.date), [weekDays]);

  // Real-Time Conflict Detection Engine execution
  const allConflicts = useMemo(() => {
    return detectAllShiftConflicts(shiftAssignments, employees, weekDateStrings, 40.0);
  }, [shiftAssignments, employees, weekDateStrings]);

  // Map of conflicts by shiftAssignmentId for O(1) lookup
  const conflictMapByAssignmentId = useMemo(() => {
    const map = new Map<string, ShiftConflict[]>();
    allConflicts.forEach((c) => {
      const list = map.get(c.shiftAssignmentId) || [];
      list.push(c);
      map.set(c.shiftAssignmentId, list);
    });
    return map;
  }, [allConflicts]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (departmentFilter !== 'all' && emp.departmentId !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullEn = `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase();
        const fullLao = `${emp.firstNameLao} ${emp.lastNameLao}`.toLowerCase();
        const code = emp.employeeCode.toLowerCase();
        return fullEn.includes(query) || fullLao.includes(query) || code.includes(query);
      }
      return true;
    });
  }, [employees, departmentFilter, searchQuery]);

  // Week navigation
  const handlePrevWeek = () => {
    const curr = new Date(anchorDateStr + 'T00:00:00');
    curr.setDate(curr.getDate() - 7);
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    setAnchorDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextWeek = () => {
    const curr = new Date(anchorDateStr + 'T00:00:00');
    curr.setDate(curr.getDate() + 7);
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    setAnchorDateStr(`${yyyy}-${mm}-${dd}`);
  };

  const handleToday = () => {
    setAnchorDateStr('2026-10-24');
  };

  // Drag Handlers
  const handleDragStartEmployee = (e: React.DragEvent, empId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'EMPLOYEE', empId }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragStartShift = (e: React.DragEvent, shiftId: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'SHIFT', shiftId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverCell = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverCellKey !== cellKey) {
      setDragOverCellKey(cellKey);
    }
  };

  const handleDragLeaveCell = () => {
    setDragOverCellKey(null);
  };

  const handleDropOnCell = (e: React.DragEvent, empId: string, dateStr: string) => {
    e.preventDefault();
    setDragOverCellKey(null);

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.type === 'EMPLOYEE') {
        // Dragged employee onto slot -> Assign default template (or first template)
        const targetEmpId = data.empId || empId;
        const defaultTpl = shiftTemplates.find((t) => t.isDefault) || shiftTemplates[0];
        if (!defaultTpl) return;

        // Pre-validate for instant feedback
        const validation = validateProposedAssignment(
          {
            employeeId: targetEmpId,
            date: dateStr,
            startTime: defaultTpl.startTime,
            endTime: defaultTpl.endTime,
            breakMinutes: defaultTpl.breakMinutes,
          },
          shiftAssignments,
          weekDateStrings,
          40.0
        );

        assignShift({
          employeeId: targetEmpId,
          date: dateStr,
          templateId: defaultTpl.id,
          shiftTitleEn: defaultTpl.nameEn,
          shiftTitleLao: defaultTpl.nameLao,
          startTime: defaultTpl.startTime,
          endTime: defaultTpl.endTime,
          breakMinutes: defaultTpl.breakMinutes,
          durationHours: defaultTpl.durationHours,
          color: defaultTpl.color,
          status: 'SCHEDULED',
        });

        if (validation.hasConflict) {
          alerts.warning(
            language === 'lo'
              ? `ມອບໝາຍກະສຳເລັດ ແຕ່ພົບຂໍ້ຂັດແຍ່ງ: ${validation.messageLao}`
              : `Assigned shift with conflict warning: ${validation.messageEn}`
          );
        } else {
          alerts.success(
            language === 'lo' ? 'ມອບໝາຍກະເຮັດວຽກສຳເລັດ' : 'Shift assigned successfully'
          );
        }
      } else if (data.type === 'SHIFT') {
        // Moved existing shift to new date/employee
        const shiftId = data.shiftId;
        updateShiftAssignment(shiftId, {
          date: dateStr,
          employeeId: empId,
        });
        alerts.success(language === 'lo' ? 'ຍ້າຍກະເຮັດວຽກສຳເລັດ' : 'Shift rescheduled successfully');
      }
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  // Open manual Add Modal
  const openAddModal = (empId: string, dateStr: string) => {
    setTargetEmployeeId(empId);
    setTargetDate(dateStr);
    const defaultTpl = shiftTemplates.find((t) => t.isDefault) || shiftTemplates[0];
    if (defaultTpl) {
      setSelectedTemplateForAdd(defaultTpl.id);
      setShiftTitleEn(defaultTpl.nameEn);
      setShiftTitleLao(defaultTpl.nameLao);
      setShiftStartTime(defaultTpl.startTime);
      setShiftEndTime(defaultTpl.endTime);
      setShiftBreakMinutes(defaultTpl.breakMinutes);
      setShiftColor(defaultTpl.color);
      setTaskPriority(defaultTpl.priority || 'MEDIUM');
    } else {
      setTaskPriority('MEDIUM');
    }
    setIsAddShiftModalOpen(true);
  };

  const handleTemplateSelectionChange = (tplId: string) => {
    setSelectedTemplateForAdd(tplId);
    if (tplId === 'custom') {
      setShiftTitleEn('Custom Assigned Shift');
      setShiftTitleLao('ກະພິເສດ ກຳນົດເອງ');
    } else {
      const tpl = shiftTemplates.find((t) => t.id === tplId);
      if (tpl) {
        setShiftTitleEn(tpl.nameEn);
        setShiftTitleLao(tpl.nameLao);
        setShiftStartTime(tpl.startTime);
        setShiftEndTime(tpl.endTime);
        setShiftBreakMinutes(tpl.breakMinutes);
        setShiftColor(tpl.color);
        if (tpl.priority) {
          setTaskPriority(tpl.priority);
        }
      }
    }
  };

  // Live pre-validation in Modal
  const modalPreValidation = useMemo(() => {
    if (!targetEmployeeId || !targetDate) return null;
    return validateProposedAssignment(
      {
        employeeId: targetEmployeeId,
        date: targetDate,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        breakMinutes: shiftBreakMinutes,
      },
      shiftAssignments,
      weekDateStrings,
      40.0
    );
  }, [
    targetEmployeeId,
    targetDate,
    shiftStartTime,
    shiftEndTime,
    shiftBreakMinutes,
    shiftAssignments,
    weekDateStrings,
  ]);

  const handleSaveManualShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmployeeId) {
      alerts.error(language === 'lo' ? 'ກະລຸນາເລືອກພະນັກງານ' : 'Please select an employee');
      return;
    }

    const duration = calculateShiftDurationHours(shiftStartTime, shiftEndTime, shiftBreakMinutes);

    assignShift({
      employeeId: targetEmployeeId,
      date: targetDate,
      templateId: selectedTemplateForAdd !== 'custom' ? selectedTemplateForAdd : undefined,
      shiftTitleEn,
      shiftTitleLao,
      startTime: shiftStartTime,
      endTime: shiftEndTime,
      breakMinutes: shiftBreakMinutes,
      durationHours: duration,
      color: shiftColor,
      status: 'CONFIRMED',
      priority: taskPriority,
    });

    alerts.success(language === 'lo' ? 'ບັນທຶກກະເຮັດວຽກສຳເລັດ' : 'Shift saved successfully');
    setIsAddShiftModalOpen(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const activeWeekAssignments = shiftAssignments.filter((a) =>
      weekDateStrings.includes(a.date)
    );
    if (activeWeekAssignments.length === 0) {
      alerts.warning(
        language === 'lo' ? 'ບໍ່ມີຂໍ້ມູນກະເຮັດວຽກໃນອາທິດນີ້' : 'No shifts scheduled in this week'
      );
      return;
    }

    const headers = [
      'Date',
      'Employee Code',
      'Employee Name',
      'Department',
      'Shift Title',
      'Priority',
      'Start Time',
      'End Time',
      'Duration (Hours)',
      'Status',
    ];

    const rows = activeWeekAssignments.map((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : a.employeeId;
      const dept = departments.find((d) => d.id === emp?.departmentId);
      return [
        a.date,
        emp?.employeeCode || '',
        `"${empName}"`,
        `"${dept?.nameEn || ''}"`,
        `"${a.shiftTitleEn}"`,
        `"${a.priority || 'MEDIUM'}"`,
        a.startTime,
        a.endTime,
        a.durationHours,
        a.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LHSE_Shift_Schedule_${weekDateStrings[0]}_to_${weekDateStrings[6]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & REAL-TIME CONFLICT ALERT BANNER */}
      {allConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-linear-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-300 dark:border-rose-900/80 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  {language === 'lo'
                    ? 'ກວດພົບຂໍ້ຂັດແຍ່ງໃນຕາຕະລາງ (Real-Time Validation Alerts)'
                    : 'Real-Time Schedule Conflicts Detected'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                  {allConflicts.length} {language === 'lo' ? 'ລາຍການ' : 'issues'}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                {language === 'lo'
                  ? 'ພົບກະເຮັດວຽກທັບຊ້ອນກັນ ຫຼື ພະນັກງານມີຊົ່ວໂມງລວມເກີນມາດຕະຖານ 40 ຊົ່ວໂມງ/ອາທິດ ຂອງກົດໝາຍແຮງງານລາວ.'
                  : 'Overlapping shifts or weekly hours exceeding Lao Labor Law 40-hour limit detected.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConflictModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {language === 'lo' ? 'ກວດສອບ & ແກ້ໄຂຂໍ້ຂັດແຍ່ງ' : 'Inspect & Resolve Conflicts'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 2. TOOLBAR: Week Navigation, Filters, Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Week Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {language === 'lo' ? 'ອາທິດນີ້' : 'Current Week'}
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="ml-2 font-mono font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {weekDays[0].formattedDateEn} - {weekDays[6].formattedDateEn} (
              {new Date(weekDays[0].date).getFullYear()})
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">{language === 'lo' ? 'ທຸກພະແນກ' : 'All Departments'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'lo' ? d.nameLao : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Search Employee */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'lo' ? 'ຄົ້ນຫາພະນັກງານ...' : 'Search employee...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none w-36"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[11px]">⚡</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">{language === 'lo' ? 'ທຸກລະດັບຄວາມສຳຄັນ' : 'All Priorities'}</option>
              <option value="HIGH">🔴 High ({language === 'lo' ? 'ສູງ' : 'High'})</option>
              <option value="MEDIUM">🟡 Medium ({language === 'lo' ? 'ປານກາງ' : 'Medium'})</option>
              <option value="LOW">🟢 Low ({language === 'lo' ? 'ຕ່ຳ' : 'Low'})</option>
            </select>
          </div>

          {/* Conflict Inspector Button */}
          <button
            onClick={() => setIsConflictModalOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              allConflicts.length > 0
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {allConflicts.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {language === 'lo' ? 'ຂໍ້ຂັດແຍ່ງ' : 'Conflicts'}{' '}
              {allConflicts.length > 0 && `(${allConflicts.length})`}
            </span>
          </button>

          {/* Shift Templates Manager Button */}
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{language === 'lo' ? 'ແບບແຜນກະ (Templates)' : 'Shift Templates'}</span>
          </button>

          {/* 1-Click Apply Quick Button */}
          <button
            onClick={() => setIsTemplatesModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>{language === 'lo' ? 'ນຳໃຊ້ 1-Click' : '1-Click Apply'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: Employee Roster (Draggable) + Weekly Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SIDEBAR: Draggable Employee Roster (Col 3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ລາຍຊື່ພະນັກງານ (ລາກເພື່ອຈັດກະ)' : 'Employee Roster (Drag & Drop)'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {filteredEmployees.length} {language === 'lo' ? 'ທ່ານ' : 'staff'}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 bg-blue-50/60 dark:bg-blue-950/30 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-1">
              <span className="font-bold text-blue-800 dark:text-blue-300 block">
                💡 {language === 'lo' ? 'ວິທີຈັດຕາຕະລາງ:' : 'Drag & Drop Hint:'}
              </span>
              <span>
                {language === 'lo'
                  ? 'ລາກຊື່ພະນັກງານໄປວາງໃສ່ຊ່ອງວັນທີໃນຕາຕະລາງ. ລະບົບຈະກວດສອບການທັບຊ້ອນ ແລະ ເວລາ 40h/ອາທິດ ແບບ Real-Time.'
                  : 'Drag an employee card into any day slot on the grid. Live conflict engine checks overlap and 40h weekly limit immediately.'}
              </span>
            </div>

            {/* List of Draggable Employees */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => {
                const weeklyHours = calculateWeeklyHours(emp.id, weekDateStrings, shiftAssignments);
                const hasHoursExceeded = weeklyHours > 40.0;
                const empConflicts = allConflicts.filter((c) => c.employeeId === emp.id);

                return (
                  <div
                    key={emp.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStartEmployee(e, emp.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-md select-none ${
                      empConflicts.length > 0
                        ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/30'
                        : hasHoursExceeded
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                          {language === 'lo'
                            ? `${emp.firstNameLao} ${emp.lastNameLao}`
                            : `${emp.firstNameEn} ${emp.lastNameEn}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          {emp.employeeCode} • {emp.departmentId}
                        </span>
                      </div>

                      {empConflicts.length > 0 && (
                        <span
                          onClick={() => setIsConflictModalOpen(true)}
                          className="p-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 shrink-0 cursor-pointer"
                          title="Schedule conflict detected!"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Weekly Hours Meter with color indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">
                          {language === 'lo' ? 'ອາທິດນີ້' : 'This week'}:
                        </span>
                        <span
                          className={`font-bold ${
                            hasHoursExceeded
                              ? 'text-rose-600'
                              : weeklyHours >= 36
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {weeklyHours} / 40.0h
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            hasHoursExceeded
                              ? 'bg-rose-600'
                              : weeklyHours >= 36
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (weeklyHours / 40.0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN CALENDAR GRID (Col 9) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 lg:p-6 border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
            {/* Calendar Table Header (Monday to Sunday) */}
            <div className="min-w-[840px]">
              <div className="grid grid-cols-7 gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                {weekDays.map((d) => (
                  <div
                    key={d.date}
                    className={`p-3 rounded-2xl text-center space-y-1 ${
                      d.isToday
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-500 text-blue-900 dark:text-blue-100 shadow-xs'
                        : d.isWeekend
                        ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-bold block uppercase tracking-wider">
                      {language === 'lo' ? d.dayNameLao : d.dayNameEn}
                    </span>
                    <span className="text-sm font-mono font-black block">{d.formattedDateEn}</span>
                    {d.isToday && (
                      <span className="inline-block px-2 py-0.2 rounded-full text-[9px] font-bold bg-blue-600 text-white">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Rows Grouped by Filtered Employees */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-3 space-y-3">
                {filteredEmployees.map((emp) => {
                  const empWeeklyHours = calculateWeeklyHours(
                    emp.id,
                    weekDateStrings,
                    shiftAssignments
                  );

                  return (
                    <div key={emp.id} className="pt-3">
                      {/* Employee Row Header */}
                      <div className="flex items-center justify-between pb-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {language === 'lo'
                              ? `${emp.firstNameLao} ${emp.lastNameLao}`
                              : `${emp.firstNameEn} ${emp.lastNameEn}`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({emp.employeeCode})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-slate-400">
                            {language === 'lo' ? 'ຊົ່ວໂມງລວມ' : 'Week Total'}:
                          </span>
                          <span
                            className={`font-black ${
                              empWeeklyHours > 40.0
                                ? 'text-rose-600 font-black'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {empWeeklyHours} / 40.0 hrs
                          </span>
                          {empWeeklyHours > 40.0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              OVER LIMIT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Day Columns for this employee */}
                      <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((d) => {
                          const cellKey = `${emp.id}_${d.date}`;
                          const isDragOver = dragOverCellKey === cellKey;

                          // Shifts assigned to this employee on this date
                          const cellShifts = shiftAssignments.filter(
                            (a) =>
                              a.employeeId === emp.id &&
                              a.date === d.date &&
                              a.status !== 'CANCELLED' &&
                              (priorityFilter === 'all' || a.priority === priorityFilter)
                          );

                          return (
                            <div
                              key={d.date}
                              onDragOver={(e) => handleDragOverCell(e, cellKey)}
                              onDragLeave={handleDragLeaveCell}
                              onDrop={(e) => handleDropOnCell(e, emp.id, d.date)}
                              className={`p-2 rounded-2xl border min-h-[105px] flex flex-col justify-between transition-all ${
                                isDragOver
                                  ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-500/40'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60'
                              }`}
                            >
                              {/* Shift Cards in this cell */}
                              <div className="space-y-1.5">
                                {cellShifts.map((asg) => {
                                  const asgConflicts = conflictMapByAssignmentId.get(asg.id) || [];
                                  const hasConflict = asgConflicts.length > 0;
                                  const isOverlap = asgConflicts.some(
                                    (c) => c.type === 'OVERLAPPING_SHIFT'
                                  );

                                  return (
                                    <div
                                      key={asg.id}
                                      draggable={true}
                                      onDragStart={(e) => handleDragStartShift(e, asg.id)}
                                      className={`p-2 rounded-xl text-left border relative group select-none transition-all shadow-xs cursor-grab active:cursor-grabbing ${
                                        isOverlap
                                          ? 'border-2 border-rose-500 bg-rose-50 dark:bg-rose-950/70 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/30 animate-pulse'
                                          : hasConflict
                                          ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-100'
                                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                                      }`}
                                    >
                                      {/* Left Color Strip */}
                                      <div
                                        className="w-1 h-full absolute left-0 top-0 rounded-l-xl"
                                        style={{ backgroundColor: asg.color }}
                                      />

                                      <div className="pl-1.5 space-y-0.5">
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="font-bold text-[11px] block truncate max-w-[85px]">
                                            {language === 'lo'
                                              ? asg.shiftTitleLao
                                              : asg.shiftTitleEn}
                                          </span>

                                          {/* Delete button on hover */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeShiftAssignment(asg.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                                            title="Delete Shift"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>

                                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                          <Clock className="w-2.5 h-2.5 shrink-0" />
                                          <span>
                                            {asg.startTime}-{asg.endTime}
                                          </span>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold font-mono text-emerald-600">
                                              {asg.durationHours}h
                                            </span>
                                            {asg.priority && (
                                              <span
                                                className={`px-1 py-0.2 rounded text-[8px] font-bold uppercase inline-flex items-center ${
                                                  asg.priority === 'HIGH'
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                                                    : asg.priority === 'MEDIUM'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                                                }`}
                                                title={`Priority: ${asg.priority}`}
                                              >
                                                {asg.priority === 'HIGH' ? '🔴 High' : asg.priority === 'MEDIUM' ? '🟡 Med' : '🟢 Low'}
                                              </span>
                                            )}
                                          </div>

                                          {/* Real-time Conflict Alert Badge */}
                                          {hasConflict && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setIsConflictModalOpen(true);
                                              }}
                                              className={`flex items-center gap-0.5 px-1 py-0.2 rounded-md text-[9px] font-black uppercase ${
                                                isOverlap
                                                  ? 'bg-rose-600 text-white'
                                                  : 'bg-amber-600 text-white'
                                              }`}
                                              title={asgConflicts.map((c) => c.titleEn).join(', ')}
                                            >
                                              <AlertTriangle className="w-2.5 h-2.5" />
                                              <span>{isOverlap ? 'OVERLAP' : '>40H'}</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* + Add Shift Button */}
                              <button
                                onClick={() => openAddModal(emp.id, d.date)}
                                className="w-full mt-1.5 py-1 rounded-xl text-[10px] font-bold text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{language === 'lo' ? 'ເພີ່ມກະ' : 'Add'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODALS */}
      {/* SHIFT TEMPLATES MODAL */}
      <ShiftTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        templates={shiftTemplates}
        employees={employees}
        departments={departments}
        weekDays={weekDays}
        shiftAssignments={shiftAssignments}
        onCreateTemplate={createShiftTemplate}
        onUpdateTemplate={updateShiftTemplate}
        onDeleteTemplate={deleteShiftTemplate}
        onApplyTemplate={applyShiftTemplate}
        language={language}
      />

      {/* CONFLICT INSPECTOR MODAL */}
      <ConflictInspectorModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={allConflicts}
        employees={employees}
        shiftAssignments={shiftAssignments}
        onRemoveAssignment={removeShiftAssignment}
        language={language}
      />

      {/* MANUAL ASSIGN SHIFT MODAL WITH REAL-TIME PRE-VALIDATION */}
      <Modal
        isOpen={isAddShiftModalOpen}
        onClose={() => setIsAddShiftModalOpen(false)}
        title={language === 'lo' ? 'ມອບໝາຍກະເຮັດວຽກ' : 'Assign Employee Shift'}
        subtitle={
          language === 'lo'
            ? `ວັນທີ: ${targetDate} • ລະບົບກວດສອບຂໍ້ຂັດແຍ່ງແບບ Real-Time`
            : `Date: ${targetDate} • Real-time conflict validation enabled`
        }
        maxWidth="lg"
      >
        <form onSubmit={handleSaveManualShift} className="space-y-4">
          {/* Target Employee */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'lo' ? 'ພະນັກງານ *' : 'Employee *'}
            </label>
            <select
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employeeCode} - {emp.firstNameLao} {emp.lastNameLao} ({emp.firstNameEn} {emp.lastNameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Template Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'lo' ? 'ເລືອກຈາກແບບແຜນກະ (Template Preset)' : 'Load from Template'}
            </label>
            <select
              value={selectedTemplateForAdd}
              onChange={(e) => handleTemplateSelectionChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="custom">{language === 'lo' ? 'ກຳນົດເອງ (Custom)' : 'Custom Shift Times'}</option>
              {shiftTemplates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {language === 'lo' ? tpl.nameLao : tpl.nameEn} ({tpl.startTime} - {tpl.endTime}, {tpl.durationHours}h)
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>{language === 'lo' ? 'ລະດັບຄວາມສຳຄັນ (Priority) *' : 'Task / Shift Priority *'}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                taskPriority === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  : taskPriority === 'MEDIUM'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
              }`}>
                {taskPriority === 'HIGH' ? '🔴 HIGH' : taskPriority === 'MEDIUM' ? '🟡 MEDIUM' : '🟢 LOW'}
              </span>
            </label>
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="HIGH">🔴 High ({language === 'lo' ? 'ສູງ - ດ່ວນ/ສຳຄັນ' : 'Urgent / Critical'})</option>
              <option value="MEDIUM">🟡 Medium ({language === 'lo' ? 'ປານກາງ - ປົກກະຕິ' : 'Normal / Routine'})</option>
              <option value="LOW">🟢 Low ({language === 'lo' ? 'ຕ່ຳ - ທົ່ວໄປ/ຍືດຫຍຸ່ນ' : 'Flexible / Low Urgency'})</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'lo' ? 'ເວລາເລີ່ມຕົ້ນ' : 'Start Time'}
              </label>
              <input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
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
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* REAL-TIME PRE-VALIDATION BANNER */}
          {modalPreValidation && modalPreValidation.hasConflict && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'lo' ? 'ແຈ້ງເຕືອນຂໍ້ຂັດແຍ່ງເວລາ (Conflict Warning)' : 'Pre-Validation Conflict Warning'}
                </span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-200">
                {language === 'lo' ? modalPreValidation.messageLao : modalPreValidation.messageEn}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddShiftModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              {language === 'lo' ? 'ຢືນຢັນມອບໝາຍກະ' : 'Assign Shift'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
