import React from 'react';
import { ShiftConflict, Employee, ShiftAssignment } from '../../types/index.ts';
import { Modal } from '../common/Modal.tsx';
import {
  AlertTriangle,
  Clock,
  Trash2,
  Calendar,
  User,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface ConflictInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ShiftConflict[];
  employees: Employee[];
  shiftAssignments: ShiftAssignment[];
  onRemoveAssignment: (assignmentId: string) => void;
  language: 'lo' | 'en';
}

export const ConflictInspectorModal: React.FC<ConflictInspectorModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  employees,
  shiftAssignments,
  onRemoveAssignment,
  language,
}) => {
  // Deduplicate overlap pairs for display
  const overlapPairs: {
    conflict1: ShiftConflict;
    conflict2?: ShiftConflict;
    assignment1?: ShiftAssignment;
    assignment2?: ShiftAssignment;
    emp?: Employee;
  }[] = [];

  const seenAssignmentIds = new Set<string>();

  const overlapConflicts = conflicts.filter((c) => c.type === 'OVERLAPPING_SHIFT');
  overlapConflicts.forEach((c) => {
    if (!seenAssignmentIds.has(c.shiftAssignmentId)) {
      const related = overlapConflicts.find(
        (o) =>
          o.shiftAssignmentId === c.conflictingAssignmentId &&
          o.conflictingAssignmentId === c.shiftAssignmentId
      );
      if (related) {
        seenAssignmentIds.add(c.shiftAssignmentId);
        seenAssignmentIds.add(related.shiftAssignmentId);
        overlapPairs.push({
          conflict1: c,
          conflict2: related,
          assignment1: shiftAssignments.find((a) => a.id === c.shiftAssignmentId),
          assignment2: shiftAssignments.find((a) => a.id === related.shiftAssignmentId),
          emp: employees.find((e) => e.id === c.employeeId),
        });
      } else {
        seenAssignmentIds.add(c.shiftAssignmentId);
        overlapPairs.push({
          conflict1: c,
          assignment1: shiftAssignments.find((a) => a.id === c.shiftAssignmentId),
          assignment2: c.conflictingAssignmentId
            ? shiftAssignments.find((a) => a.id === c.conflictingAssignmentId)
            : undefined,
          emp: employees.find((e) => e.id === c.employeeId),
        });
      }
    }
  });

  // Group weekly hours conflicts by employee
  const hoursConflicts = conflicts.filter((c) => c.type === 'WEEKLY_HOURS_EXCEEDED');
  const hoursByEmp: { [empId: string]: ShiftConflict[] } = {};
  hoursConflicts.forEach((c) => {
    if (!hoursByEmp[c.employeeId]) hoursByEmp[c.employeeId] = [];
    hoursByEmp[c.employeeId].push(c);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        language === 'lo'
          ? 'ລາຍການກວດສອບຂໍ້ຂັດແຍ່ງໃນຕາຕະລາງ (Real-Time Schedule Conflicts)'
          : 'Real-Time Schedule Conflicts Inspector'
      }
      subtitle={
        language === 'lo'
          ? `ກວດພົບ ${conflicts.length} ລາຍການທີ່ບໍ່ສອດຄ່ອງກັບນະໂຍບາຍກົດໝາຍແຮງງານ`
          : `Detected ${conflicts.length} policy or overlapping schedule violations`
      }
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {conflicts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {language === 'lo' ? 'ບໍ່ມີຂໍ້ຂັດແຍ່ງໃນຕາຕະລາງ' : 'Zero Schedule Conflicts'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {language === 'lo'
                ? 'ຕາຕະລາງປະຕິບັດງານທັງໝົດສອດຄ່ອງກັບມາດຕະຖານ 40 ຊົ່ວໂມງ/ອາທິດ ຂອງກົດໝາຍແຮງງານລາວ ແລະ ບໍ່ມີກະເຮັດວຽກທັບຊ້ອນກັນ.'
                : 'All shift assignments strictly adhere to the 40-hour weekly Lao Labor Law limit without any overlapping shifts.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Overlapping Shifts Section */}
            {overlapPairs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {language === 'lo'
                      ? `ກະເຮັດວຽກທັບຊ້ອນກັນ (${overlapPairs.length} ກໍລະນີ)`
                      : `Overlapping Shift Conflicts (${overlapPairs.length} Instances)`}
                  </h4>
                </div>

                <div className="space-y-3">
                  {overlapPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border-2 border-rose-300 dark:border-rose-900/80 bg-rose-50/70 dark:bg-rose-950/30 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-900/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 flex items-center justify-center text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                              {pair.emp
                                ? `${pair.emp.firstNameLao} ${pair.emp.lastNameLao} (${pair.emp.firstNameEn} ${pair.emp.lastNameEn})`
                                : pair.conflict1.employeeId}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {pair.emp?.employeeCode} • {pair.conflict1.date}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                          CRITICAL OVERLAP
                        </span>
                      </div>

                      {/* Display the two overlapping shifts side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {pair.assignment1 && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Shift A
                              </span>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {language === 'lo'
                                  ? pair.assignment1.shiftTitleLao
                                  : pair.assignment1.shiftTitleEn}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-rose-600 font-bold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {pair.assignment1.startTime} - {pair.assignment1.endTime} (
                                  {pair.assignment1.durationHours}h)
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveAssignment(pair.assignment1!.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1"
                              title="Delete this shift to resolve conflict"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'lo' ? 'ລຶບກະນີ້' : 'Remove'}</span>
                            </button>
                          </div>
                        )}

                        {pair.assignment2 && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Shift B
                              </span>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {language === 'lo'
                                  ? pair.assignment2.shiftTitleLao
                                  : pair.assignment2.shiftTitleEn}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-rose-600 font-bold">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {pair.assignment2.startTime} - {pair.assignment2.endTime} (
                                  {pair.assignment2.durationHours}h)
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onRemoveAssignment(pair.assignment2!.id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1"
                              title="Delete this shift to resolve conflict"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{language === 'lo' ? 'ລຶບກະນີ້' : 'Remove'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Weekly Working Hours Exceeded Section */}
            {Object.keys(hoursByEmp).length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {language === 'lo'
                      ? `ຊົ່ວໂມງເຮັດວຽກປະຈຳອາທິດເກີນກຳນົດ (${Object.keys(hoursByEmp).length} ພະນັກງານ)`
                      : `Weekly Maximum Hours Exceeded (${Object.keys(hoursByEmp).length} Employees)`}
                  </h4>
                </div>

                <div className="space-y-3">
                  {Object.entries(hoursByEmp).map(([empId, cList]) => {
                    const emp = employees.find((e) => e.id === empId);
                    const sample = cList[0];
                    const totalHours = sample.calculatedTotalHours || 0;
                    const maxAllowed = sample.maxAllowedHours || 40.0;
                    const excess = Math.max(0, totalHours - maxAllowed);

                    const empAssignments = shiftAssignments.filter(
                      (a) => a.employeeId === empId && a.status !== 'CANCELLED'
                    );

                    return (
                      <div
                        key={empId}
                        className="p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-900/80 bg-amber-50/70 dark:bg-amber-950/30 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 dark:border-amber-900/50 pb-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                              {emp
                                ? `${emp.firstNameLao} ${emp.lastNameLao} (${emp.firstNameEn} ${emp.lastNameEn})`
                                : empId}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {emp?.employeeCode} • {emp?.departmentId}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-amber-800 dark:text-amber-200 bg-amber-200/80 dark:bg-amber-900/60 px-2.5 py-1 rounded-xl">
                              {totalHours} hrs / 40.0 hrs (+{excess.toFixed(1)}h over limit)
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-amber-900 dark:text-amber-200">
                          {language === 'lo'
                            ? `ຕາມກົດໝາຍແຮງງານລາວ, ກຳນົດເວລາເຮັດວຽກບໍ່ໃຫ້ເກີນ 40 ຊົ່ວໂມງ/ອາທິດ (8 ຊມ/ມື້ x 5 ວັນ). ກະລຸນາປັບຫຼຸດ ຫຼື ລຶບກະອອກເພື່ອໃຫ້ສອດຄ່ອງ.`
                            : `Under Lao Labor Law, standard working hours must not exceed 40 hours per week. Remove or adjust shifts below to resolve compliance.`}
                        </p>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {language === 'lo' ? 'ກະເຮັດວຽກໃນອາທິດນີ້' : 'Assigned Shifts This Week'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {empAssignments.map((asg) => (
                              <div
                                key={asg.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 block font-bold">
                                    {asg.date}
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 block truncate max-w-[120px]">
                                    {language === 'lo' ? asg.shiftTitleLao : asg.shiftTitleEn}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {asg.startTime}-{asg.endTime} ({asg.durationHours}h)
                                  </span>
                                </div>
                                <button
                                  onClick={() => onRemoveAssignment(asg.id)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  title="Remove shift to reduce weekly hours"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90 transition-opacity"
          >
            {language === 'lo' ? 'ປິດໜ້າຕ່າງ' : 'Close Inspector'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
