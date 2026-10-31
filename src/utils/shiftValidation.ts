import { ShiftAssignment, ShiftConflict, Employee } from '../types/index.ts';

/**
 * Converts "HH:MM" into minutes from start of day
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Calculates net working hours between startTime and endTime minus breakMinutes
 */
export function calculateShiftDurationHours(
  startTime: string,
  endTime: string,
  breakMinutes: number = 60
): number {
  let start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);

  // If end is less than or equal to start, shift crosses midnight (e.g. 22:00 to 06:00)
  if (end <= start) {
    end += 24 * 60;
  }

  const netMinutes = Math.max(0, end - start - (breakMinutes || 0));
  return Math.round((netMinutes / 60) * 10) / 10;
}

/**
 * Checks if two time intervals on the same day overlap
 */
export function checkIntervalOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  let s1 = timeToMinutes(start1);
  let e1 = timeToMinutes(end1);
  if (e1 <= s1) e1 += 24 * 60;

  let s2 = timeToMinutes(start2);
  let e2 = timeToMinutes(end2);
  if (e2 <= s2) e2 += 24 * 60;

  // Overlap condition: start of one is before end of other, and vice-versa
  return s1 < e2 && s2 < e1;
}

export interface DayInfo {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  dayNameEn: string;
  dayNameLao: string;
  dayShortEn: string;
  dayShortLao: string;
  formattedDateEn: string;
  formattedDateLao: string;
  isToday: boolean;
  isWeekend: boolean;
}

const LAO_DAY_NAMES = ['ວັນອາທິດ', 'ວັນຈັນ', 'ວັນອັງຄານ', 'ວັນພຸດ', 'ວັນພະຫັດ', 'ວັນສຸກ', 'ວັນເສົາ'];
const LAO_DAY_SHORTS = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
const EN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_DAY_SHORTS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Generates Monday-to-Sunday dates for the given anchor date
 */
export function getWeekDates(anchorDateStr: string = '2026-10-24'): DayInfo[] {
  // Parse anchor date
  const anchor = new Date(anchorDateStr + 'T00:00:00');
  const day = anchor.getDay(); // 0 is Sun, 1 is Mon...
  
  // Calculate distance to previous Monday (if Sun (0), go back 6 days; if Mon (1), go back 0)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + diffToMonday);

  const todayStr = '2026-10-24'; // System anchor current date
  const result: DayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = current.getDay();

    result.push({
      date: dateStr,
      dayOfWeek,
      dayNameEn: EN_DAY_NAMES[dayOfWeek],
      dayNameLao: LAO_DAY_NAMES[dayOfWeek],
      dayShortEn: EN_DAY_SHORTS[dayOfWeek],
      dayShortLao: LAO_DAY_SHORTS[dayOfWeek],
      formattedDateEn: `${dd}/${mm}`,
      formattedDateLao: `${dd}/${mm}`,
      isToday: dateStr === todayStr,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return result;
}

/**
 * Calculates total scheduled working hours for an employee in a given week
 */
export function calculateWeeklyHours(
  employeeId: string,
  weekDates: string[],
  assignments: ShiftAssignment[]
): number {
  const weekSet = new Set(weekDates);
  const employeeAssignments = assignments.filter(
    (a) => a.employeeId === employeeId && weekSet.has(a.date) && a.status !== 'CANCELLED'
  );

  const total = employeeAssignments.reduce((sum, a) => sum + (a.durationHours || 0), 0);
  return Math.round(total * 10) / 10;
}

/**
 * Full Real-Time Conflict Detection Engine
 * Strictly validates:
 * 1. Overlapping Shift assignments for the same employee on the same date
 * 2. Weekly maximum working hours (Lao Labor Law standard 40 hrs/week)
 */
export function detectAllShiftConflicts(
  assignments: ShiftAssignment[],
  employees: Employee[],
  weekDates: string[],
  maxWeeklyHours: number = 40.0
): ShiftConflict[] {
  const conflicts: ShiftConflict[] = [];
  const weekSet = new Set(weekDates);
  const activeAssignments = assignments.filter(
    (a) => weekSet.has(a.date) && a.status !== 'CANCELLED'
  );

  // 1. Group assignments by (employeeId + date) to find overlapping shifts
  const byEmpAndDate: { [key: string]: ShiftAssignment[] } = {};
  activeAssignments.forEach((a) => {
    const key = `${a.employeeId}_${a.date}`;
    if (!byEmpAndDate[key]) byEmpAndDate[key] = [];
    byEmpAndDate[key].push(a);
  });

  Object.entries(byEmpAndDate).forEach(([key, list]) => {
    if (list.length > 1) {
      // Check pairwise overlaps
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a1 = list[i];
          const a2 = list[j];
          if (checkIntervalOverlap(a1.startTime, a1.endTime, a2.startTime, a2.endTime)) {
            const emp = employees.find((e) => e.id === a1.employeeId);
            const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : a1.employeeId;
            const empNameLao = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : a1.employeeId;

            // Flag conflict for a1
            conflicts.push({
              id: `conflict-overlap-${a1.id}-${a2.id}`,
              type: 'OVERLAPPING_SHIFT',
              severity: 'error',
              employeeId: a1.employeeId,
              date: a1.date,
              shiftAssignmentId: a1.id,
              conflictingAssignmentId: a2.id,
              titleEn: `Overlapping Shift Conflict`,
              titleLao: `ຂໍ້ຂັດແຍ່ງ: ກະເຮັດວຽກທັບຊ້ອນກັນ`,
              detailsEn: `${empName} is assigned to overlapping shifts on ${a1.date} (${a1.startTime}-${a1.endTime} overlaps with ${a2.startTime}-${a2.endTime})`,
              detailsLao: `${empNameLao} ຖືກມອບໝາຍກະເຮັດວຽກທັບຊ້ອນກັນໃນວັນທີ ${a1.date} (${a1.startTime}-${a1.endTime} ຊ້ອນກັບ ${a2.startTime}-${a2.endTime})`,
            });

            // Flag conflict for a2
            conflicts.push({
              id: `conflict-overlap-${a2.id}-${a1.id}`,
              type: 'OVERLAPPING_SHIFT',
              severity: 'error',
              employeeId: a2.employeeId,
              date: a2.date,
              shiftAssignmentId: a2.id,
              conflictingAssignmentId: a1.id,
              titleEn: `Overlapping Shift Conflict`,
              titleLao: `ຂໍ້ຂັດແຍ່ງ: ກະເຮັດວຽກທັບຊ້ອນກັນ`,
              detailsEn: `${empName} is assigned to overlapping shifts on ${a2.date} (${a2.startTime}-${a2.endTime} overlaps with ${a1.startTime}-${a1.endTime})`,
              detailsLao: `${empNameLao} ຖືກມອບໝາຍກະເຮັດວຽກທັບຊ້ອນກັນໃນວັນທີ ${a2.date} (${a2.startTime}-${a2.endTime} ຊ້ອນກັບ ${a1.startTime}-${a1.endTime})`,
            });
          }
        }
      }
    }
  });

  // 2. Weekly maximum working hours check (Lao Labor Law strict 40h standard)
  const hoursByEmployee: { [empId: string]: number } = {};
  activeAssignments.forEach((a) => {
    hoursByEmployee[a.employeeId] = (hoursByEmployee[a.employeeId] || 0) + (a.durationHours || 0);
  });

  Object.entries(hoursByEmployee).forEach(([empId, totalHours]) => {
    const roundedTotal = Math.round(totalHours * 10) / 10;
    if (roundedTotal > maxWeeklyHours) {
      const emp = employees.find((e) => e.id === empId);
      const empName = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : empId;
      const empNameLao = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : empId;
      const excess = Math.round((roundedTotal - maxWeeklyHours) * 10) / 10;

      // Find all assignments of this employee this week and tag with weekly hours warning
      const empWeekAssignments = activeAssignments.filter((a) => a.employeeId === empId);
      empWeekAssignments.forEach((a) => {
        conflicts.push({
          id: `conflict-hours-${empId}-${a.id}`,
          type: 'WEEKLY_HOURS_EXCEEDED',
          severity: 'warning',
          employeeId: empId,
          date: a.date,
          shiftAssignmentId: a.id,
          titleEn: `Weekly Working Hours Exceeded`,
          titleLao: `ຊົ່ວໂມງເຮັດວຽກປະຈຳອາທິດເກີນກຳນົດ`,
          detailsEn: `${empName} has ${roundedTotal} scheduled hours this week, exceeding the Lao Labor standard limit (${maxWeeklyHours}h) by ${excess}h.`,
          detailsLao: `${empNameLao} ມີຊົ່ວໂມງເຮັດວຽກລວມ ${roundedTotal} ຊົ່ວໂມງໃນອາທິດນີ້, ເກີນກຳນົດກົດໝາຍແຮງງານລາວ (${maxWeeklyHours} ຊມ) ຢູ່ ${excess} ຊມ.`,
          calculatedTotalHours: roundedTotal,
          maxAllowedHours: maxWeeklyHours,
        });
      });
    }
  });

  return conflicts;
}

/**
 * Pre-validates a proposed assignment before commit
 */
export function validateProposedAssignment(
  candidate: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    excludeAssignmentId?: string;
  },
  existingAssignments: ShiftAssignment[],
  weekDates: string[],
  maxWeeklyHours: number = 40.0
): {
  hasConflict: boolean;
  overlaps: boolean;
  exceedsWeeklyHours: boolean;
  projectedWeeklyHours: number;
  conflictingAssignment?: ShiftAssignment;
  messageEn: string;
  messageLao: string;
} {
  const breakMin = candidate.breakMinutes ?? 60;
  const candidateDuration = calculateShiftDurationHours(
    candidate.startTime,
    candidate.endTime,
    breakMin
  );

  // Check overlap on the same date
  const sameDayShifts = existingAssignments.filter(
    (a) =>
      a.employeeId === candidate.employeeId &&
      a.date === candidate.date &&
      a.id !== candidate.excludeAssignmentId &&
      a.status !== 'CANCELLED'
  );

  let overlappingShift: ShiftAssignment | undefined;
  for (const shift of sameDayShifts) {
    if (checkIntervalOverlap(candidate.startTime, candidate.endTime, shift.startTime, shift.endTime)) {
      overlappingShift = shift;
      break;
    }
  }

  // Check weekly hours
  const currentWeeklyHours = calculateWeeklyHours(
    candidate.employeeId,
    weekDates,
    candidate.excludeAssignmentId
      ? existingAssignments.filter((a) => a.id !== candidate.excludeAssignmentId)
      : existingAssignments
  );
  const projectedWeeklyHours = Math.round((currentWeeklyHours + candidateDuration) * 10) / 10;
  const exceedsWeeklyHours = projectedWeeklyHours > maxWeeklyHours;

  const overlaps = Boolean(overlappingShift);
  const hasConflict = overlaps || exceedsWeeklyHours;

  let messageEn = '';
  let messageLao = '';

  if (overlaps && exceedsWeeklyHours) {
    messageEn = `Both shift overlap detected (with ${overlappingShift?.startTime}-${overlappingShift?.endTime}) AND weekly hours will reach ${projectedWeeklyHours}h (exceeding ${maxWeeklyHours}h limit).`;
    messageLao = `ພົບການທັບຊ້ອນຂອງກະເວລາ (ກັບ ${overlappingShift?.startTime}-${overlappingShift?.endTime}) ແລະ ຊົ່ວໂມງລວມຈະຮອດ ${projectedWeeklyHours} ຊມ (ເກີນກຳນົດ ${maxWeeklyHours} ຊມ).`;
  } else if (overlaps) {
    messageEn = `Shift time (${candidate.startTime}-${candidate.endTime}) overlaps with existing shift (${overlappingShift?.startTime}-${overlappingShift?.endTime}) on ${candidate.date}.`;
    messageLao = `ເວລາປະຕິບັດງານ (${candidate.startTime}-${candidate.endTime}) ທັບຊ້ອນກັບກະເດີມ (${overlappingShift?.startTime}-${overlappingShift?.endTime}) ໃນວັນທີ ${candidate.date}.`;
  } else if (exceedsWeeklyHours) {
    messageEn = `Adding this shift (${candidateDuration}h) will increase weekly hours to ${projectedWeeklyHours}h, exceeding Lao Labor 40-hour limit by ${(projectedWeeklyHours - maxWeeklyHours).toFixed(1)}h.`;
    messageLao = `ການເພີ່ມກະນີ້ (${candidateDuration} ຊມ) ຈະເຮັດໃຫ້ຊົ່ວໂມງລວມອາທິດເປັນ ${projectedWeeklyHours} ຊມ, ເກີນມາດຕະຖານແຮງງານ 40 ຊມ ຢູ່ ${(projectedWeeklyHours - maxWeeklyHours).toFixed(1)} ຊມ.`;
  }

  return {
    hasConflict,
    overlaps,
    exceedsWeeklyHours,
    projectedWeeklyHours,
    conflictingAssignment: overlappingShift,
    messageEn,
    messageLao,
  };
}
