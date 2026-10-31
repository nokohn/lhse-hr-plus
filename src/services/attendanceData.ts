import { AttendanceRecord, Employee, Department, Holiday } from '../types/index.ts';

export interface DayAttendanceSummary {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  isWeekend: boolean;
  holidayName?: string;
  totalScheduled: number;
  presentCount: number;
  onTimeCount: number;
  lateCount: number;
  absentCount: number;
  onLeaveCount: number;
  attendanceRate: number; // 0 - 100 percentage
  onTimeRate: number; // 0 - 100 percentage
  intensityTier: 'PEAK' | 'HIGH' | 'MODERATE' | 'LOW' | 'OFF';
  records: AttendanceRecord[];
}

/**
 * Determine heatmap intensity tier based on present rate
 */
export function getAttendanceIntensityTier(
  attendanceRate: number,
  isWeekend: boolean,
  isHoliday: boolean,
  hasRecords: boolean
): 'PEAK' | 'HIGH' | 'MODERATE' | 'LOW' | 'OFF' {
  if (!hasRecords || (isWeekend && attendanceRate === 0) || (isHoliday && attendanceRate === 0)) {
    return 'OFF';
  }
  if (attendanceRate >= 95) return 'PEAK';
  if (attendanceRate >= 80) return 'HIGH';
  if (attendanceRate >= 65) return 'MODERATE';
  return 'LOW';
}

/**
 * Visual styling classes for each heatmap intensity level
 */
export function getIntensityColorClass(tier: 'PEAK' | 'HIGH' | 'MODERATE' | 'LOW' | 'OFF'): {
  bg: string;
  text: string;
  border: string;
  hover: string;
  dot: string;
  labelEn: string;
  labelLao: string;
} {
  switch (tier) {
    case 'PEAK':
      return {
        bg: 'bg-emerald-600 dark:bg-emerald-500',
        text: 'text-white font-bold',
        border: 'border-emerald-700 dark:border-emerald-400',
        hover: 'hover:ring-2 hover:ring-emerald-400',
        dot: 'bg-emerald-500',
        labelEn: 'Peak Attendance (95% - 100%)',
        labelLao: 'ມາເຮັດວຽກສູງສຸດ (95% - 100%)',
      };
    case 'HIGH':
      return {
        bg: 'bg-emerald-400 dark:bg-emerald-600/80',
        text: 'text-slate-900 dark:text-white font-bold',
        border: 'border-emerald-500 dark:border-emerald-600',
        hover: 'hover:ring-2 hover:ring-emerald-300',
        dot: 'bg-emerald-400',
        labelEn: 'High Attendance (80% - 94%)',
        labelLao: 'ມາເຮັດວຽກປົກກະຕິດີ (80% - 94%)',
      };
    case 'MODERATE':
      return {
        bg: 'bg-amber-300 dark:bg-amber-500/80',
        text: 'text-amber-950 dark:text-amber-100 font-bold',
        border: 'border-amber-400 dark:border-amber-600',
        hover: 'hover:ring-2 hover:ring-amber-300',
        dot: 'bg-amber-400',
        labelEn: 'Moderate Attendance (65% - 79%)',
        labelLao: 'ມາເຮັດວຽກປານກາງ (65% - 79%)',
      };
    case 'LOW':
      return {
        bg: 'bg-rose-400 dark:bg-rose-600/80',
        text: 'text-white font-bold',
        border: 'border-rose-500 dark:border-rose-700',
        hover: 'hover:ring-2 hover:ring-rose-300',
        dot: 'bg-rose-500',
        labelEn: 'Low Attendance (< 65% Alert)',
        labelLao: 'ມາເຮັດວຽກຕໍ່າ (< 65% ຄວນຕິດຕາມ)',
      };
    case 'OFF':
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800/60',
        text: 'text-slate-400 dark:text-slate-500',
        border: 'border-slate-200 dark:border-slate-700/60',
        hover: 'hover:border-slate-300 dark:hover:border-slate-600',
        dot: 'bg-slate-300 dark:bg-slate-700',
        labelEn: 'Weekend / Holiday / Off',
        labelLao: 'ວັນທ້າຍອາທິດ / ວັນພັກລັດຖະການ',
      };
  }
}

/**
 * Generates comprehensive historical attendance records covering full months (August, September, October 2026)
 * to provide a rich, visually compelling heatmap with realistic fluctuations.
 */
export function generateComprehensiveAttendance(
  employees: Employee[],
  holidays: Holiday[]
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const empList = employees.length > 0 ? employees : [
    { id: 'emp-001' }, { id: 'emp-002' }, { id: 'emp-003' }, { id: 'emp-004' }, { id: 'emp-005' },
    { id: 'emp-006' }, { id: 'emp-007' }, { id: 'emp-008' }, { id: 'emp-009' }, { id: 'emp-010' }
  ];

  const holidayMap = new Map<string, string>();
  holidays.forEach((h) => holidayMap.set(h.date, h.nameEn));

  // Loop from May 1, 2026 to Oct 31, 2026 (Past 6 Months)
  const startDate = new Date(2026, 4, 1); // May 1, 2026
  const endDate = new Date(2026, 9, 31);   // October 31, 2026

  let curr = new Date(startDate);
  let recIdx = 1;

  while (curr <= endDate) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const dayOfWeek = curr.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayMap.has(dateStr);

    if (!isWeekend && !isHoliday) {
      const dayNum = curr.getDate();
      const monthNum = curr.getMonth() + 1; // 5 to 10

      // Seasonal Base Attendance Rate across 6 Months:
      // Month 5 (May): Pre-monsoon dry season, high attendance (Base ~92%)
      // Month 6 (June): Early monsoon rains begin, transport starts to slow (Base ~88%)
      // Month 7 (July): Heavy monsoon rain peak in Laos, flood warnings near NT2 site (Base ~77%)
      // Month 8 (August): Mid monsoon continuous tropical rainfall, regional road delays (Base ~80%)
      // Month 9 (September): Late rainy season, clear skies return, dry season prep (Base ~89%)
      // Month 10 (October): Peak dry season operations, high attendance (Base ~94%)
      let monthlySeasonalBase = 0.9;
      if (monthNum === 5) monthlySeasonalBase = 0.92;
      else if (monthNum === 6) monthlySeasonalBase = 0.88;
      else if (monthNum === 7) monthlySeasonalBase = 0.77;
      else if (monthNum === 8) monthlySeasonalBase = 0.80;
      else if (monthNum === 9) monthlySeasonalBase = 0.89;
      else if (monthNum === 10) monthlySeasonalBase = 0.94;

      let targetPresentRate = monthlySeasonalBase;

      // Special seasonal events and day variances:
      if ([5, 12, 19, 26].includes(dayNum)) {
        // Routine midweek team sync days
        targetPresentRate = Math.min(1.0, monthlySeasonalBase + 0.08);
      } else if (monthNum === 7 && [8, 15, 22].includes(dayNum)) {
        // Severe tropical storm Soulik feeder bands in Central Laos: field road washouts
        targetPresentRate = 0.60;
      } else if (monthNum === 8 && [6, 19, 27].includes(dayNum)) {
        // Flash floods in Khammouane / Bolikhamxay dam catchment zones
        targetPresentRate = 0.65;
      } else if (monthNum === 9 && dayNum === 2) {
        // Post National Day weekend return
        targetPresentRate = 0.75;
      } else if (monthNum === 10 && dayNum === 16) {
        // Scheduled Nam Theun 2 powerhouse routine inspection: field team travel day
        targetPresentRate = 0.60;
      } else if ([7, 14, 21].includes(dayNum)) {
        targetPresentRate = Math.max(0.65, monthlySeasonalBase - 0.07);
      }

      empList.forEach((emp, eIdx) => {
        const empSeed = (dayNum * 13 + eIdx * 7) % 100;
        const willAttend = empSeed < targetPresentRate * 100;

        if (willAttend) {
          const isLate = (dayNum % 4 === 0 && eIdx === 2) || (dayNum === 16 && eIdx % 2 === 0);
          const checkInHour = isLate ? 8 : 7;
          const checkInMin = isLate ? Math.floor(15 + (empSeed % 25)) : Math.floor(45 + (empSeed % 15));
          const checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`;

          const checkOutHour = 17;
          const checkOutMin = Math.floor(5 + (empSeed % 25));
          const checkOutTime = `${checkOutHour}:${String(checkOutMin).padStart(2, '0')}`;

          const sources = ['BIOMETRIC_SCANNER', 'BIOMETRIC_SCANNER', 'MOBILE_GPS', 'MOBILE_APP'] as const;
          const source = sources[eIdx % sources.length];

          records.push({
            id: `att-gen-${recIdx++}`,
            employeeId: emp.id,
            date: dateStr,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            status: isLate ? 'LATE' : 'PRESENT',
            durationMinutes: isLate ? 465 : 490,
            source,
            notes: isLate ? 'Traffic congestion on Nongbone road' : undefined,
          });
        } else {
          // Employee on approved leave or absent
          const isLeave = (eIdx + dayNum) % 2 === 0;
          records.push({
            id: `att-gen-${recIdx++}`,
            employeeId: emp.id,
            date: dateStr,
            status: isLeave ? 'ON_LEAVE' : 'ABSENT',
            durationMinutes: 0,
            source: 'BIOMETRIC_SCANNER',
            notes: isLeave ? 'Approved statutory annual leave' : 'Unexcused absence',
          });
        }
      });
    }

    // Move to next day
    curr.setDate(curr.getDate() + 1);
  }

  return records;
}

/**
 * Aggregate daily summaries for a given month and department
 */
export function calculateMonthHeatmapSummaries(
  year: number,
  month: number, // 1 - 12
  attendanceRecords: AttendanceRecord[],
  employees: Employee[],
  holidays: Holiday[],
  selectedDeptId: string = 'ALL'
): DayAttendanceSummary[] {
  // Filter employees if department is selected
  const targetEmployees =
    selectedDeptId === 'ALL'
      ? employees
      : employees.filter((e) => e.departmentId === selectedDeptId);

  const targetEmpIds = new Set(targetEmployees.map((e) => e.id));
  const totalScheduled = targetEmployees.length > 0 ? targetEmployees.length : 10;

  const holidayMap = new Map<string, string>();
  holidays.forEach((h) => holidayMap.set(h.date, h.nameLao || h.nameEn));

  // Determine number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const summaries: DayAttendanceSummary[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;

    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holidayName = holidayMap.get(dateStr);

    // Records for this day matching selected department
    const dayRecords = attendanceRecords.filter(
      (r) => r.date === dateStr && targetEmpIds.has(r.employeeId)
    );

    let presentCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;

    dayRecords.forEach((r) => {
      if (r.status === 'PRESENT') {
        presentCount++;
        onTimeCount++;
      } else if (r.status === 'LATE') {
        presentCount++;
        lateCount++;
      } else if (r.status === 'ON_LEAVE') {
        onLeaveCount++;
      } else if (r.status === 'ABSENT') {
        absentCount++;
      }
    });

    const hasRecords = dayRecords.length > 0;
    const effectiveTotal = Math.max(totalScheduled, dayRecords.length);
    const attendanceRate = effectiveTotal > 0 && hasRecords
      ? Math.round((presentCount / effectiveTotal) * 100)
      : 0;

    const onTimeRate = presentCount > 0
      ? Math.round((onTimeCount / presentCount) * 100)
      : 0;

    const intensityTier = getAttendanceIntensityTier(
      attendanceRate,
      isWeekend,
      Boolean(holidayName),
      hasRecords
    );

    summaries.push({
      date: dateStr,
      dayOfWeek,
      isWeekend,
      holidayName,
      totalScheduled: effectiveTotal,
      presentCount,
      onTimeCount,
      lateCount,
      absentCount,
      onLeaveCount,
      attendanceRate,
      onTimeRate,
      intensityTier,
      records: dayRecords,
    });
  }

  return summaries;
}

export interface SixMonthDailyTrendPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // "15 May"
  monthCode: string; // "2026-05" ... "2026-10"
  monthNum: number;
  monthNameEn: string;
  monthNameLao: string;
  workdayIndex: number;
  overallRate: number; // 0 - 100
  onTimeRate: number; // 0 - 100
  totalScheduled: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  onLeaveCount: number;
  deptRates: Record<string, number>; // deptId -> attendance rate %
  seasonPhaseEn: string;
  seasonPhaseLao: string;
  notes?: string;
}

export interface SixMonthMacroSummary {
  monthCode: string; // "2026-05"
  monthNum: number;
  monthNameEn: string;
  monthNameLao: string;
  avgAttendanceRate: number;
  avgOnTimeRate: number;
  workdaysCount: number;
  peakDayDate: string;
  peakDayRate: number;
  lowestDayDate: string;
  lowestDayRate: number;
  seasonDescriptorEn: string;
  seasonDescriptorLao: string;
  status: 'PEAK' | 'STABLE' | 'MONSOON_DIP' | 'RECOVERY';
}

export interface DepartmentTrendSummary {
  deptId: string;
  nameEn: string;
  nameLao: string;
  color: string;
  overallAvg: number;
  monthlyRates: { monthCode: string; rate: number }[];
  lowestMonth: string;
  highestMonth: string;
  headcount: number;
}

export interface SixMonthAttendanceAnalytics {
  dailyPoints: SixMonthDailyTrendPoint[];
  monthlySummaries: SixMonthMacroSummary[];
  deptSummaries: DepartmentTrendSummary[];
  overallSixMonthAvg: number;
  overallOnTimeAvg: number;
  monsoonDipMonth: string;
  peakOperationsMonth: string;
  totalWorkdaysTracked: number;
}

/**
 * Calculates 6-month daily and departmental attendance trends (May 2026 – Oct 2026)
 */
export function calculateSixMonthAttendanceTrends(
  records: AttendanceRecord[],
  employees: Employee[],
  departments: Department[],
  holidays: Holiday[]
): SixMonthAttendanceAnalytics {
  const monthConfigs = [
    {
      code: '2026-05',
      monthNum: 5,
      year: 2026,
      nameEn: 'May 2026',
      nameLao: 'ພຶດສະພາ 2026',
      seasonEn: 'Early Monsoon / High Pre-Storm Operations',
      seasonLao: 'ຕົ້ນລະດູຝົນ / ໄລຍະເລັ່ງວຽກກ່ອນພາຍຸ',
      status: 'STABLE' as const,
    },
    {
      code: '2026-06',
      monthNum: 6,
      year: 2026,
      nameEn: 'June 2026',
      nameLao: 'ມິຖຸນາ 2026',
      seasonEn: 'Moderate Monsoon Rains / Hydro Field Inspections',
      seasonLao: 'ລະດູຝົນປານກາງ / ລົງກວດກາເຂື່ອນໄຟຟ້າ',
      status: 'STABLE' as const,
    },
    {
      code: '2026-07',
      monthNum: 7,
      year: 2026,
      nameEn: 'July 2026',
      nameLao: 'ກໍລະກົດ 2026',
      seasonEn: 'Peak Monsoon Floods / Central Laos Highway Delays',
      seasonLao: 'ພາຍຸຝົນຕົກໜັກສຸດ / ນ້ຳຖ້ວມເສັ້ນທາງຄົມມະນາຄົມ',
      status: 'MONSOON_DIP' as const,
    },
    {
      code: '2026-08',
      monthNum: 8,
      year: 2026,
      nameEn: 'August 2026',
      nameLao: 'ສິງຫາ 2026',
      seasonEn: 'Heavy Tropical Downpours / NT2 Dam Site Weather Alert',
      seasonLao: 'ລະດູຝົນຊຸມ / ເຕືອນໄພອຸຕຸນິຍົມເຂດນ້ຳເທີນ 2',
      status: 'MONSOON_DIP' as const,
    },
    {
      code: '2026-09',
      monthNum: 9,
      year: 2026,
      nameEn: 'September 2026',
      nameLao: 'ກັນຍາ 2026',
      seasonEn: 'Late Monsoon Recovery / Clearing Skies & Field Access',
      seasonLao: 'ທ້າຍລະດູຝົນ / ສະພາບອາກາດເລີ່ມແຈ້ງໃສ',
      status: 'RECOVERY' as const,
    },
    {
      code: '2026-10',
      monthNum: 10,
      year: 2026,
      nameEn: 'October 2026',
      nameLao: 'ຕຸລາ 2026',
      seasonEn: 'Dry Season Peak Operations / Boat Racing Festival Season',
      seasonLao: 'ຕົ້ນລະດູແລ້ງ / ປະຕິບັດງານເຕັມກຳລັງ & ບຸນຊ່ວງເຮືອ',
      status: 'PEAK' as const,
    },
  ];

  const deptColors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const holidayMap = new Map<string, string>();
  holidays.forEach((h) => holidayMap.set(h.date, h.nameLao || h.nameEn));

  const totalEmployees = employees.length > 0 ? employees.length : 10;
  const deptEmployeesMap = new Map<string, Employee[]>();
  departments.forEach((d) => {
    deptEmployeesMap.set(d.id, employees.filter((e) => e.departmentId === d.id));
  });

  const dailyPoints: SixMonthDailyTrendPoint[] = [];
  const monthlySummaries: SixMonthMacroSummary[] = [];
  let workdayCounter = 1;

  monthConfigs.forEach((cfg) => {
    const daysInMonth = new Date(cfg.year, cfg.monthNum, 0).getDate();
    const monthWorkdayPoints: SixMonthDailyTrendPoint[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, '0');
      const mStr = String(cfg.monthNum).padStart(2, '0');
      const dateStr = `${cfg.year}-${mStr}-${dStr}`;

      const dateObj = new Date(cfg.year, cfg.monthNum - 1, d);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const holidayName = holidayMap.get(dateStr);

      if (isWeekend || holidayName) {
        continue; // Only track workdays for daily average curve
      }

      const dayRecords = records.filter((r) => r.date === dateStr);
      let presentCount = 0;
      let onTimeCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let onLeaveCount = 0;

      dayRecords.forEach((r) => {
        if (r.status === 'PRESENT') {
          presentCount++;
          onTimeCount++;
        } else if (r.status === 'LATE') {
          presentCount++;
          lateCount++;
        } else if (r.status === 'ABSENT') {
          absentCount++;
        } else if (r.status === 'ON_LEAVE') {
          onLeaveCount++;
        }
      });

      const effectiveTotal = Math.max(totalEmployees, dayRecords.length);
      const overallRate =
        effectiveTotal > 0 && dayRecords.length > 0
          ? Math.round((presentCount / effectiveTotal) * 100)
          : 0;

      const onTimeRate =
        presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;

      // Departmental rates for this day
      const deptRates: Record<string, number> = {};
      departments.forEach((dept) => {
        const deptEmps = deptEmployeesMap.get(dept.id) || [];
        const deptEmpIds = new Set(deptEmps.map((e) => e.id));
        const deptDayRecords = dayRecords.filter((r) => deptEmpIds.has(r.employeeId));
        const dPresent = deptDayRecords.filter(
          (r) => r.status === 'PRESENT' || r.status === 'LATE'
        ).length;
        const dTotal = Math.max(deptEmps.length, deptDayRecords.length);
        deptRates[dept.id] = dTotal > 0 ? Math.round((dPresent / dTotal) * 100) : overallRate;
      });

      const dayLabel = `${d} ${cfg.nameEn.split(' ')[0]}`;

      const point: SixMonthDailyTrendPoint = {
        date: dateStr,
        dayLabel,
        monthCode: cfg.code,
        monthNum: cfg.monthNum,
        monthNameEn: cfg.nameEn,
        monthNameLao: cfg.nameLao,
        workdayIndex: workdayCounter++,
        overallRate,
        onTimeRate,
        totalScheduled: effectiveTotal,
        presentCount,
        lateCount,
        absentCount,
        onLeaveCount,
        deptRates,
        seasonPhaseEn: cfg.seasonEn,
        seasonPhaseLao: cfg.seasonLao,
      };

      dailyPoints.push(point);
      monthWorkdayPoints.push(point);
    }

    if (monthWorkdayPoints.length > 0) {
      const avgAtt = Math.round(
        monthWorkdayPoints.reduce((acc, p) => acc + p.overallRate, 0) /
          monthWorkdayPoints.length
      );
      const avgOnT = Math.round(
        monthWorkdayPoints.reduce((acc, p) => acc + p.onTimeRate, 0) /
          monthWorkdayPoints.length
      );

      const sortedByRate = [...monthWorkdayPoints].sort(
        (a, b) => b.overallRate - a.overallRate
      );
      const peakPoint = sortedByRate[0];
      const lowestPoint = sortedByRate[sortedByRate.length - 1];

      monthlySummaries.push({
        monthCode: cfg.code,
        monthNum: cfg.monthNum,
        monthNameEn: cfg.nameEn,
        monthNameLao: cfg.nameLao,
        avgAttendanceRate: avgAtt,
        avgOnTimeRate: avgOnT,
        workdaysCount: monthWorkdayPoints.length,
        peakDayDate: peakPoint?.date || cfg.code + '-01',
        peakDayRate: peakPoint?.overallRate || avgAtt,
        lowestDayDate: lowestPoint?.date || cfg.code + '-15',
        lowestDayRate: lowestPoint?.overallRate || avgAtt,
        seasonDescriptorEn: cfg.seasonEn,
        seasonDescriptorLao: cfg.seasonLao,
        status: cfg.status,
      });
    }
  });

  // Calculate Department Trend Summaries
  const deptSummaries: DepartmentTrendSummary[] = departments.map((dept, idx) => {
    const color = deptColors[idx % deptColors.length];
    const deptEmps = deptEmployeesMap.get(dept.id) || [];
    const monthlyRates: { monthCode: string; rate: number }[] = [];

    monthConfigs.forEach((cfg) => {
      const monthPoints = dailyPoints.filter((p) => p.monthCode === cfg.code);
      if (monthPoints.length > 0) {
        const sumRate = monthPoints.reduce((acc, p) => acc + (p.deptRates[dept.id] ?? p.overallRate), 0);
        monthlyRates.push({
          monthCode: cfg.code,
          rate: Math.round(sumRate / monthPoints.length),
        });
      }
    });

    const overallAvg =
      monthlyRates.length > 0
        ? Math.round(monthlyRates.reduce((acc, r) => acc + r.rate, 0) / monthlyRates.length)
        : 88;

    const sortedMonths = [...monthlyRates].sort((a, b) => b.rate - a.rate);
    const highestMonth = sortedMonths[0]?.monthCode || '2026-10';
    const lowestMonth = sortedMonths[sortedMonths.length - 1]?.monthCode || '2026-07';

    return {
      deptId: dept.id,
      nameEn: dept.nameEn,
      nameLao: dept.nameLao,
      color,
      overallAvg,
      monthlyRates,
      lowestMonth,
      highestMonth,
      headcount: deptEmps.length,
    };
  });

  const overallSixMonthAvg =
    monthlySummaries.length > 0
      ? Math.round(
          monthlySummaries.reduce((acc, m) => acc + m.avgAttendanceRate, 0) /
            monthlySummaries.length
        )
      : 87;

  const overallOnTimeAvg =
    monthlySummaries.length > 0
      ? Math.round(
          monthlySummaries.reduce((acc, m) => acc + m.avgOnTimeRate, 0) /
            monthlySummaries.length
        )
      : 90;

  return {
    dailyPoints,
    monthlySummaries,
    deptSummaries,
    overallSixMonthAvg,
    overallOnTimeAvg,
    monsoonDipMonth: '2026-07 (July)',
    peakOperationsMonth: '2026-10 (October)',
    totalWorkdaysTracked: dailyPoints.length,
  };
}

