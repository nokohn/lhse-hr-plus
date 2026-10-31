import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Users,
  Building2,
  TrendingUp,
  UserPlus,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

const DEPT_COLORS = [
  '#2563eb', // Blue 600
  '#0284c7', // Sky 600
  '#0d9488', // Teal 600
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Violet 500
  '#ec4899', // Pink 500
  '#6366f1', // Indigo 500
  '#14b8a6', // Teal 500
  '#f97316', // Orange 500
];

export const OrganizationQuickStats: React.FC = () => {
  const { language, employees, departments, branches } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [deptViewMode, setDeptViewMode] = useState<'DONUT' | 'BAR'>('DONUT');
  const [trendRange, setTrendRange] = useState<'ALL' | 'RECENT'>('ALL');
  const [activeDeptIndex, setActiveDeptIndex] = useState<number | null>(null);

  // 1. High-level KPI metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length;
  const probationEmployees = employees.filter(
    (e) => e.employmentType === 'PROBATION' || (e.status as string) === 'PROBATION'
  ).length;
  const onLeaveEmployees = employees.filter((e) => e.status === 'ON_LEAVE').length;
  const permanentEmployees = employees.filter((e) => e.employmentType === 'PERMANENT').length;
  const permanentRate = totalEmployees > 0 ? Math.round((permanentEmployees / totalEmployees) * 100) : 0;

  const maleCount = employees.filter((e) => e.gender === 'MALE').length;
  const femaleCount = employees.filter((e) => e.gender === 'FEMALE').length;
  const femalePct = totalEmployees > 0 ? Math.round((femaleCount / totalEmployees) * 100) : 0;
  const malePct = totalEmployees > 0 ? Math.round((maleCount / totalEmployees) * 100) : 0;

  const activeDepts = departments.filter((d) => d.isActive !== false);
  const totalBranches = branches.length;
  const avgTeamSize = activeDepts.length > 0 ? (totalEmployees / activeDepts.length).toFixed(1) : '0';

  // 2. Department Breakdown Data for Recharts
  const departmentBreakdown = useMemo(() => {
    const list = departments.map((dept, index) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const count = deptEmployees.length;
      const pct = totalEmployees > 0 ? Math.round((count / totalEmployees) * 100) : 0;
      const deptName = language === 'lo' ? dept.nameLao : dept.nameEn;
      const shortName =
        language === 'lo'
          ? dept.nameLao.length > 18
            ? `${dept.nameLao.substring(0, 16)}...`
            : dept.nameLao
          : dept.nameEn.length > 18
          ? `${dept.nameEn.substring(0, 16)}...`
          : dept.nameEn;

      return {
        id: dept.id,
        code: dept.code,
        name: deptName,
        shortName,
        nameLao: dept.nameLao,
        nameEn: dept.nameEn,
        headName: dept.headName,
        budget: dept.budget,
        count,
        percentage: pct,
        color: DEPT_COLORS[index % DEPT_COLORS.length],
      };
    });

    // Also include any employees in unassigned departments if any
    const assignedIds = new Set(departments.map((d) => d.id));
    const unassignedCount = employees.filter((e) => !assignedIds.has(e.departmentId)).length;
    if (unassignedCount > 0) {
      list.push({
        id: 'unassigned',
        code: 'OTHER',
        name: language === 'lo' ? 'ພາກສ່ວນອື່ນໆ / ຍັງບໍ່ກຳນົດ' : 'Other / Unassigned',
        shortName: language === 'lo' ? 'ອື່ນໆ' : 'Other',
        nameLao: 'ພາກສ່ວນອື່ນໆ',
        nameEn: 'Other / Unassigned',
        headName: undefined,
        budget: undefined,
        count: unassignedCount,
        percentage: totalEmployees > 0 ? Math.round((unassignedCount / totalEmployees) * 100) : 0,
        color: '#94a3b8',
      });
    }

    return list.sort((a, b) => b.count - a.count);
  }, [departments, employees, language, totalEmployees]);

  // 3. Hiring Trends Data for Recharts
  const hiringTrendsData = useMemo(() => {
    if (employees.length === 0) return [];

    // Parse joining dates and sort chronologically
    const sortedEmployees = [...employees]
      .filter((e) => e.joiningDate)
      .sort((a, b) => new Date(a.joiningDate).getTime() - new Date(b.joiningDate).getTime());

    if (sortedEmployees.length === 0) return [];

    // Group by Year-Month
    const monthMap = new Map<
      string,
      { count: number; employees: { name: string; dept: string }[] }
    >();

    sortedEmployees.forEach((emp) => {
      const date = new Date(emp.joiningDate);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dept = departments.find((d) => d.id === emp.departmentId);
      const deptName = dept ? (language === 'lo' ? dept.nameLao : dept.nameEn) : '';
      const name =
        language === 'lo'
          ? `${emp.firstNameLao} ${emp.lastNameLao}`
          : `${emp.firstNameEn} ${emp.lastNameEn}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, { count: 0, employees: [] });
      }
      const record = monthMap.get(key)!;
      record.count += 1;
      record.employees.push({ name, dept: deptName });
    });

    // Build timeline points with cumulative headcount
    const sortedKeys = Array.from(monthMap.keys()).sort();
    let cumulative = 0;
    const allPoints = sortedKeys.map((key) => {
      const item = monthMap.get(key)!;
      cumulative += item.count;
      const [year, month] = key.split('-');
      const monthIndex = parseInt(month, 10) - 1;

      // English & Lao month abbreviations
      const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const laoMonths = ['ມ.ກ', 'ກ.ພ', 'ມີ.ນ', 'ເມ.ສ', 'ພ.ພ', 'ມິ.ຖ', 'ກ.ລ', 'ສ.ຫ', 'ກ.ຍ', 'ຕ.ລ', 'ພ.ຈ', 'ທ.ວ'];

      const monthLabel =
        language === 'lo'
          ? `${laoMonths[monthIndex]} ${year.substring(2)}`
          : `${enMonths[monthIndex]} '${year.substring(2)}`;

      return {
        key,
        year: parseInt(year, 10),
        period: monthLabel,
        fullPeriod: `${year}-${month}`,
        newHires: item.count,
        cumulative,
        joinedStaff: item.employees,
      };
    });

    if (trendRange === 'RECENT') {
      // Last 6 to 8 periods
      return allPoints.slice(Math.max(0, allPoints.length - 8));
    }

    return allPoints;
  }, [employees, departments, language, trendRange]);

  // Total new hires in the current displayed timeline
  const periodNewHires = useMemo(() => {
    return hiringTrendsData.reduce((acc, curr) => acc + curr.newHires, 0);
  }, [hiringTrendsData]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-300">
      {/* Top Banner & Control Ribbon */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-50/50 via-slate-50/50 to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {language === 'lo' ? 'ສະຖິຕິພາບລວມບຸກຄະລາກອນ' : 'Organization Quick Stats'}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                LHSE Live
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'lo'
                ? 'ສະຫຼຸບຈຳນວນພະນັກງານ, ການກະຈາຍຕາມພະແນກ ແລະ ທ່າອ່ຽງການຮັບຄົນໃໝ່'
                : 'Real-time overview of headcount distribution, departments & hiring trends'}
            </p>
          </div>
        </div>

        {/* Action & Toggle Controls */}
        <div className="flex items-center gap-2">
          {/* Quick inline counters visible when collapsed or expanded */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ພະນັກງານທັງໝົດ:' : 'Total Staff:'}
            </span>
            <strong className="font-mono text-blue-600 dark:text-blue-400 text-sm font-bold">
              {totalEmployees}
            </strong>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {language === 'lo' ? 'ພະແນກ:' : 'Depts:'}
            </span>
            <strong className="font-mono text-slate-700 dark:text-slate-300 font-bold">
              {activeDepts.length}
            </strong>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-xs"
            title={isExpanded ? 'Collapse Stats' : 'Expand Stats'}
          >
            <span>
              {isExpanded
                ? language === 'lo'
                  ? 'ຫຍໍ້ລົງ'
                  : 'Collapse'
                : language === 'lo'
                ? 'ເບິ່ງລາຍລະອຽດ'
                : 'Expand'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div className="p-5 lg:p-6 space-y-6">
          {/* 1. Metric KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Card 1: Total Employees */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-blue-50/30 to-transparent dark:from-blue-950/20 dark:via-slate-800/40 dark:to-transparent border border-blue-100 dark:border-blue-900/40 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === 'lo' ? 'ພະນັກງານທັງໝົດ' : 'Total Employees'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {totalEmployees}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  {activeEmployees} {language === 'lo' ? 'ປະຕິບັດງານ' : 'Active'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                {probationEmployees > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono text-[10px]">
                    {probationEmployees} {language === 'lo' ? 'ທົດລອງງານ' : 'Probation'}
                  </span>
                )}
                {onLeaveEmployees > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                    {onLeaveEmployees} {language === 'lo' ? 'ລາພັກ' : 'On Leave'}
                  </span>
                )}
                {probationEmployees === 0 && onLeaveEmployees === 0 && (
                  <span>100% {language === 'lo' ? 'ພະນັກງານປະຈຳ' : 'Full Staff'}</span>
                )}
              </div>
            </div>

            {/* Card 2: Departments & Branches */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-transparent dark:from-indigo-950/20 dark:via-slate-800/40 dark:to-transparent border border-indigo-100 dark:border-indigo-900/40 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === 'lo' ? 'ໂຄງຮ່າງພະແນກ & ສາຂາ' : 'Depts & Branches'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {activeDepts.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'lo' ? 'ພະແນກ' : 'Departments'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>
                  {language === 'lo' ? 'ສະເລ່ຍພະແນກລະ' : 'Avg / dept'}:{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-mono">
                    {avgTeamSize}
                  </strong>
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {totalBranches} {language === 'lo' ? 'ສາຂາ' : 'Branches'}
                </span>
              </div>
            </div>

            {/* Card 3: Gender / Diversity Ratio */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-emerald-50/30 to-transparent dark:from-emerald-950/20 dark:via-slate-800/40 dark:to-transparent border border-emerald-100 dark:border-emerald-900/40 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === 'lo' ? 'ອັດຕາສ່ວນຍິງ - ຊາຍ' : 'Gender Diversity'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {femalePct}%
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {language === 'lo' ? 'ເພດຍິງ' : 'Female'} ({femaleCount})
                </span>
              </div>
              {/* Ratio mini progress bar */}
              <div className="mt-2.5 space-y-1">
                <div className="w-full bg-blue-500 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${femalePct}%` }}
                    title={`Female: ${femalePct}%`}
                  />
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${malePct}%` }}
                    title={`Male: ${malePct}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>♀ {femaleCount} ({femalePct}%)</span>
                  <span>♂ {maleCount} ({malePct}%)</span>
                </div>
              </div>
            </div>

            {/* Card 4: Employment Tenure & Permanent Rate */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-amber-50/30 to-transparent dark:from-amber-950/20 dark:via-slate-800/40 dark:to-transparent border border-amber-100 dark:border-amber-900/40 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {language === 'lo' ? 'ສັນຍາຈ້າງ & ຄວາມໝັ້ນຄົງ' : 'Contract Stability'}
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                  {permanentRate}%
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  {language === 'lo' ? 'ພະນັກງານປະຈຳ' : 'Permanent'}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>
                  {language === 'lo' ? 'ບັນຈຸແລ້ວ' : 'Staff count'}:{' '}
                  <strong className="text-slate-700 dark:text-slate-200 font-mono">
                    {permanentEmployees}
                  </strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[10px] flex items-center">
                  <ArrowUpRight className="w-3 h-3" />
                  +100% {language === 'lo' ? 'ຕາມເປົ້າ' : 'On Track'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Recharts Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Chart 1: Department Breakdown (5 cols on lg) */}
            <div className="lg:col-span-5 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 lg:p-5 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <PieIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {language === 'lo' ? 'ການກະຈາຍຕາມພະແນກ' : 'Department Breakdown'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {language === 'lo'
                        ? 'ສັດສ່ວນກຳລັງຄົນໃນແຕ່ລະສາຍງານ'
                        : 'Workforce distribution across divisions'}
                    </p>
                  </div>

                  {/* Toggle View Mode: Donut vs Bar */}
                  <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setDeptViewMode('DONUT')}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        deptViewMode === 'DONUT'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Donut Chart"
                    >
                      <PieIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeptViewMode('BAR')}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                        deptViewMode === 'BAR'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                      title="Ranking Bar Chart"
                    >
                      <BarChart3 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Render Donut Chart */}
                {deptViewMode === 'DONUT' && (
                  <div className="relative min-h-[220px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 text-white dark:bg-slate-800 text-xs rounded-xl p-2.5 shadow-xl border border-slate-700 pointer-events-none">
                                <div className="font-bold flex items-center gap-1.5">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: data.color }}
                                  />
                                  <span>{data.name}</span>
                                </div>
                                <div className="mt-1 text-slate-300 flex justify-between gap-4">
                                  <span>{language === 'lo' ? 'ຈຳນວນພະນັກງານ:' : 'Staff count:'}</span>
                                  <span className="font-bold font-mono text-white">
                                    {data.count} {language === 'lo' ? 'ຄົນ' : 'members'} ({data.percentage}%)
                                  </span>
                                </div>
                                {data.headName && (
                                  <div className="mt-0.5 text-[11px] text-slate-400">
                                    {language === 'lo' ? 'ຫົວໜ້າ:' : 'Lead:'} {data.headName}
                                  </div>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Pie
                          data={departmentBreakdown}
                          dataKey="count"
                          nameKey="shortName"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          stroke="#ffffff"
                          strokeWidth={2}
                          onMouseEnter={(_, index) => setActiveDeptIndex(index)}
                          onMouseLeave={() => setActiveDeptIndex(null)}
                        >
                          {departmentBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.id}`}
                              fill={entry.color}
                              opacity={
                                activeDeptIndex === null || activeDeptIndex === index ? 1 : 0.6
                              }
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                        {totalEmployees}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {language === 'lo' ? 'ພະນັກງານ' : 'Members'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Render Bar Chart */}
                {deptViewMode === 'BAR' && (
                  <div className="min-h-[220px] w-full pt-2">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart
                        data={departmentBreakdown}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="shortName"
                          width={110}
                          tick={{ fontSize: 10, fill: '#64748b' }}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null;
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 text-white text-xs rounded-xl p-2.5 shadow-xl border border-slate-700">
                                <div className="font-bold">{data.name}</div>
                                <div className="mt-1 text-slate-300">
                                  {language === 'lo' ? 'ພະນັກງານ:' : 'Headcount:'}{' '}
                                  <strong className="text-white font-mono">{data.count}</strong> (
                                  {data.percentage}%)
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {departmentBreakdown.map((entry) => (
                            <Cell key={`bar-${entry.id}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Department Legend Badges */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {departmentBreakdown.map((dept, index) => (
                  <div
                    key={dept.id}
                    onMouseEnter={() => setActiveDeptIndex(index)}
                    onMouseLeave={() => setActiveDeptIndex(null)}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      activeDeptIndex === index
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 font-bold scale-102'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    } border border-slate-200/50 dark:border-slate-700/50`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <span className="truncate max-w-[110px]">{dept.shortName}</span>
                    <span className="font-mono font-bold text-[10px] text-slate-400">
                      {dept.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Recent Hiring Trends (7 cols on lg) */}
            <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 lg:p-5 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      {language === 'lo' ? 'ທ່າອ່ຽງການຮັບພະນັກງານໃໝ່' : 'Recent Hiring Trends'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {language === 'lo'
                        ? 'ສະຖິຕິການເຕີບໂຕ ແລະ ການເຂົ້າຮ່ວມງານຕາມໄລຍະເວລາ'
                        : 'Headcount progression and new joiners timeline'}
                    </p>
                  </div>

                  {/* Range filter buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
                      {language === 'lo' ? 'ໄລຍະເວລາ:' : 'Timeline:'}
                    </span>
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => setTrendRange('ALL')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          trendRange === 'ALL'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {language === 'lo' ? 'ທັງໝົດ' : 'All Time'}
                      </button>
                      <button
                        onClick={() => setTrendRange('RECENT')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          trendRange === 'RECENT'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {language === 'lo' ? 'ໄລຍະຫຼ້າສຸດ' : 'Recent Periods'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="min-h-[220px] w-full pt-1">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={hiringTrendsData}
                      margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#94a3b8"
                        opacity={0.15}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900/95 text-white text-xs rounded-xl p-3 shadow-2xl border border-slate-700 min-w-[200px] pointer-events-none">
                              <div className="font-bold border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                  <span>{label}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {data.fullPeriod}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-emerald-400">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                    {language === 'lo' ? 'ພະນັກງານເຂົ້າໃໝ່:' : 'New Hires:'}
                                  </span>
                                  <strong className="font-mono text-white text-sm">
                                    +{data.newHires}
                                  </strong>
                                </div>
                                <div className="flex justify-between items-center text-blue-400">
                                  <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                                    {language === 'lo' ? 'ສະສົມທັງໝົດ:' : 'Cumulative Staff:'}
                                  </span>
                                  <strong className="font-mono text-white text-sm">
                                    {data.cumulative}
                                  </strong>
                                </div>
                              </div>

                              {/* Employee names if any */}
                              {data.joinedStaff && data.joinedStaff.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                                    {language === 'lo' ? 'ລາຍຊື່ຜູ້ເຂົ້າໃໝ່:' : 'Joiners:'}
                                  </div>
                                  <div className="max-h-20 overflow-y-auto space-y-0.5 text-[11px]">
                                    {data.joinedStaff.map(
                                      (s: { name: string; dept: string }, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-slate-300"
                                        >
                                          <span>• {s.name}</span>
                                          {s.dept && (
                                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                                              {s.dept}
                                            </span>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey="cumulative"
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                        name={language === 'lo' ? 'ພະນັກງານສະສົມ' : 'Cumulative'}
                      />
                      <Bar
                        dataKey="newHires"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        name={language === 'lo' ? 'ເຂົ້າໃໝ່' : 'New Hires'}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Insight Footer */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    <span>{language === 'lo' ? 'ຈຳນວນພະນັກງານສະສົມ' : 'Cumulative Headcount'}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>{language === 'lo' ? 'ຈຳນວນຮັບເຂົ້າໃໝ່' : 'New Hires (per period)'}</span>
                  </span>
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {language === 'lo'
                      ? `ລວມເຂົ້າໃໝ່ໃນໄລຍະນີ້: ${periodNewHires} ທ່ານ`
                      : `Total joiners in scope: ${periodNewHires} members`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
