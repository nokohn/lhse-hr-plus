import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import {
  Trophy,
  TrendingUp,
  BarChart3,
  Award,
  Users,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export const DepartmentKPIChartSection: React.FC = () => {
  const { language, employees, departments, employeeKPIs } = useApp();

  const [chartView, setChartView] = useState<'COMPLETION_RATE' | 'STATUS_STACKED'>('COMPLETION_RATE');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  // Compute departmental statistics
  const deptPerformanceData = useMemo(() => {
    const list = departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.departmentId === dept.id);
      const empIds = new Set(deptEmployees.map((e) => e.id));
      const deptKPIs = employeeKPIs.filter((k) => empIds.has(k.employeeId));

      let totalWeightedPct = 0;
      let totalWeight = 0;
      let completedCount = 0;
      let onTrackCount = 0;
      let inProgressCount = 0;
      let atRiskCount = 0;

      deptKPIs.forEach((kpi) => {
        const pct = kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0;
        const weight = kpi.weight || 20;
        totalWeightedPct += pct * weight;
        totalWeight += weight;

        if (kpi.status === 'COMPLETED') completedCount++;
        else if (kpi.status === 'ON_TRACK') onTrackCount++;
        else if (kpi.status === 'IN_PROGRESS') inProgressCount++;
        else if (kpi.status === 'AT_RISK') atRiskCount++;
      });

      const avgCompletionRate = totalWeight > 0 ? Math.round(totalWeightedPct / totalWeight) : 0;

      // Top contributor in this department
      let topEmployee = deptEmployees[0] || null;
      let highestEmpScore = -1;
      deptEmployees.forEach((emp) => {
        const empKPIs = deptKPIs.filter((k) => k.employeeId === emp.id);
        if (empKPIs.length > 0) {
          const empScore = Math.round(
            empKPIs.reduce((sum, k) => sum + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) /
              empKPIs.length
          );
          if (empScore > highestEmpScore) {
            highestEmpScore = empScore;
            topEmployee = emp;
          }
        }
      });

      return {
        id: dept.id,
        nameLao: dept.nameLao,
        nameEn: dept.nameEn,
        displayName: language === 'lo' ? dept.nameLao.replace('ພະແນກ ', '') : dept.nameEn.replace('Department', '').trim(),
        employeeCount: deptEmployees.length,
        totalKPIs: deptKPIs.length,
        avgCompletionRate,
        completedCount,
        onTrackCount,
        inProgressCount,
        atRiskCount,
        onTrackPercentage: deptKPIs.length > 0 ? Math.round(((completedCount + onTrackCount) / deptKPIs.length) * 100) : 0,
        topEmployee,
        highestEmpScore: Math.max(0, highestEmpScore),
      };
    });

    // Sort by completion rate descending
    return list.sort((a, b) => b.avgCompletionRate - a.avgCompletionRate);
  }, [departments, employees, employeeKPIs, language]);

  // Overall statistics
  const topTeam = deptPerformanceData[0] || null;
  const orgAverageCompletion = useMemo(() => {
    if (deptPerformanceData.length === 0) return 0;
    const sum = deptPerformanceData.reduce((acc, d) => acc + d.avgCompletionRate, 0);
    return Math.round(sum / deptPerformanceData.length);
  }, [deptPerformanceData]);

  // Color mapper based on performance score
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981'; // emerald-500
    if (score >= 80) return '#3b82f6'; // blue-500
    if (score >= 70) return '#f59e0b'; // amber-500
    return '#f43f5e'; // rose-500
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-56 font-sans">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <span className="font-bold text-slate-100 text-sm">{data.nameLao}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono text-white"
              style={{ backgroundColor: getScoreColor(data.avgCompletionRate) }}
            >
              {data.avgCompletionRate}%
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'lo' ? 'ພະນັກງານ' : 'Employees'}:</span>
              <span className="font-bold text-white">{data.employeeCount} ຄົນ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'lo' ? 'ເປົ້າໝາຍທັງໝົດ' : 'Total KPIs'}:</span>
              <span className="font-bold text-white">{data.totalKPIs} ລາຍການ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{language === 'lo' ? 'ຕາມແຜນ / ສຳເລັດ' : 'On-Track / Done'}:</span>
              <span className="font-bold text-emerald-400">{data.completedCount + data.onTrackCount} ເປົ້າໝາຍ</span>
            </div>
            {data.atRiskCount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>{language === 'lo' ? 'ມີຄວາມສ່ຽງ' : 'At Risk'}:</span>
                <span className="font-bold">{data.atRiskCount} ເປົ້າໝາຍ</span>
              </div>
            )}
            {data.topEmployee && (
              <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">{language === 'lo' ? 'ຜູ້ມີຜົນງານດີເດັ່ນ' : 'Top Contributor'}:</span>
                <span className="font-bold text-blue-300">
                  {data.topEmployee.firstNameLao} ({data.highestEmpScore}%)
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="department-kpi-analytics" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      {/* 1. Header with Title & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {language === 'lo'
                  ? 'ອັດຕາຄວາມສຳເລັດ KPI ຕາມພະແນກ (Department Completion Rates)'
                  : 'KPI Completion Rates by Department'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'lo'
                ? 'ສະແດງພາບລວມຜົນງານຕົວຊີ້ວັດແຍກຕາມພະແນກ ເພື່ອຊີ້ບອກ ແລະ ຍ້ອງຍໍທີມງານທີ່ມີຜົນງານດີເດັ່ນ (High-Performing Teams)'
                : 'Data visualization of employee KPI progress across departments to quickly identify top-performing teams'}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setChartView('COMPLETION_RATE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartView === 'COMPLETION_RATE'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ອັດຕາບັນລຸຜົນ (%)' : 'Completion Rate (%)'}
            </button>
            <button
              onClick={() => setChartView('STATUS_STACKED')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartView === 'STATUS_STACKED'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {language === 'lo' ? 'ແຍກຕາມສະຖານະ' : 'Status Breakdown'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Highlight Cards: Top Performing Team & Organization Target Benchmark */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Performing Team Banner Card */}
        {topTeam && (
          <div className="md:col-span-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    🏆 {language === 'lo' ? 'ທີມງານດີເດັ່ນອັນດັບ 1 (Top Performing Team)' : 'Top Performing Team #1'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {topTeam.avgCompletionRate}% {language === 'lo' ? 'ສຳເລັດ' : 'Achieved'}
                  </span>
                </div>
                <h4 className="font-black text-base text-slate-900 dark:text-slate-100 mt-0.5">
                  {topTeam.nameLao} ({topTeam.nameEn})
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {topTeam.employeeCount} {language === 'lo' ? 'ພະນັກງານ' : 'Employees'} • {topTeam.totalKPIs} {language === 'lo' ? 'ເປົ້າໝາຍ' : 'KPI Targets'} • {language === 'lo' ? 'ຕາມແຜນ 100%' : '100% on track'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {topTeam.avgCompletionRate}%
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {language === 'lo' ? 'ສູງກວ່າຄ່າສະເລ່ຍອົງກອນ' : 'Above benchmark'}: +{topTeam.avgCompletionRate - orgAverageCompletion}%
              </span>
            </div>
          </div>
        )}

        {/* Organization Average Benchmark Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block">
              {language === 'lo' ? 'ຄ່າສະເລ່ຍອົງກອນ (Org Average)' : 'Company Benchmark'}
            </span>
            <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
              {orgAverageCompletion}%
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Target Benchmark: 80%
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recharts Bar Chart */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>
              {chartView === 'COMPLETION_RATE'
                ? (language === 'lo' ? 'ກຣາບປຽບທຽບອັດຕາຄວາມສຳເລັດ (%) ຕາມພະແນກ' : 'Department KPI Completion Rates (%)')
                : (language === 'lo' ? 'ກຣາບແບ່ງຕາມສະຖານະເປົ້າໝາຍ (KPI Status by Department)' : 'Target Count by Status')}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Benchmark: 80% (ເສັ້ນແດງ)
            </span>
          </div>

          <div className="w-full h-72 sm:h-80 bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl p-3 sm:p-4 border border-slate-200/70 dark:border-slate-800 flex items-center justify-center">
            {chartView === 'COMPLETION_RATE' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptPerformanceData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={80}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target 80%',
                      fill: '#f43f5e',
                      fontSize: 10,
                      position: 'top',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar
                    dataKey="avgCompletionRate"
                    name={language === 'lo' ? 'ອັດຕາຄວາມສຳເລັດ' : 'Completion Rate'}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={55}
                    onClick={(entry: any) => setSelectedDeptId(entry?.id || null)}
                  >
                    {deptPerformanceData.map((entry) => (
                      <Cell
                        key={`cell-${entry.id}`}
                        fill={getScoreColor(entry.avgCompletionRate)}
                        className="cursor-pointer hover:opacity-85 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptPerformanceData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '16px',
                      color: '#fff',
                      fontSize: '12px',
                      border: '1px solid #334155',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="completedCount"
                    name={language === 'lo' ? 'ສຳເລັດ (Completed)' : 'Completed'}
                    fill="#10b981"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="onTrackCount"
                    name={language === 'lo' ? 'ຕາມແຜນ (On Track)' : 'On Track'}
                    fill="#3b82f6"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="inProgressCount"
                    name={language === 'lo' ? 'ກຳລັງດຳເນີນການ (In Progress)' : 'In Progress'}
                    fill="#f59e0b"
                    stackId="a"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="atRiskCount"
                    name={language === 'lo' ? 'ມີຄວາມສ່ຽງ (At Risk)' : 'At Risk'}
                    fill="#f43f5e"
                    stackId="a"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1 Col: Department Ranking Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>{language === 'lo' ? 'ຈັດອັນດັບປະສິດທິພາບທີມງານ' : 'Team Performance Ranking'}</span>
            <span className="text-[10px] text-slate-400 font-mono">5 Departments</span>
          </div>

          <div className="space-y-2.5">
            {deptPerformanceData.map((dept, idx) => {
              const medalStyles = [
                'border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
                'border-slate-300 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
                'border-orange-300 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300',
              ];

              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id === selectedDeptId ? null : dept.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedDeptId === dept.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border ${
                          medalStyles[idx] || 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {dept.nameLao}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {dept.employeeCount} {language === 'lo' ? 'ຄົນ' : 'staff'} • {dept.totalKPIs} KPIs
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className="font-black font-mono text-sm"
                        style={{ color: getScoreColor(dept.avgCompletionRate) }}
                      >
                        {dept.avgCompletionRate}%
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {dept.onTrackPercentage}% on track
                      </span>
                    </div>
                  </div>

                  {/* Progress bar inside each card */}
                  <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(3, dept.avgCompletionRate))}%`,
                        backgroundColor: getScoreColor(dept.avgCompletionRate),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
