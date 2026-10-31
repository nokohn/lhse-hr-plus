import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ApprovalRequest, Announcement, NotificationItem } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import {
  Bell,
  CheckCheck,
  Check,
  X,
  Clock,
  Calendar,
  CalendarX,
  FileCheck,
  AlertCircle,
  AlertTriangle,
  Megaphone,
  Sparkles,
  Search,
  ArrowRight,
  ExternalLink,
  Flame,
  Building2,
  DollarSign,
  User,
  UserCheck,
  ShieldCheck,
  Send,
  Eye,
  CheckCircle2,
  Server,
  Database,
  Key,
  ShieldAlert,
  Cpu,
  Award,
  TrendingUp,
  RefreshCw,
  XCircle,
  RotateCcw,
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export type NotificationTabType =
  | 'ALL'
  | 'SYSTEM_ALERTS'
  | 'APPROVAL_UPDATES'
  | 'HR_DEADLINES'
  | 'ANNOUNCEMENTS';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const {
    language,
    notifications,
    announcements,
    approvalRequests,
    leaveBalances,
    employees,
    departments,
    positions,
    currentUser,
    markNotificationRead,
    markAllNotificationsRead,
    processApproval,
    setActiveModule,
    setActiveSubModule,
    auditLogs,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);

  // Active filter tab & search query
  const [activeTab, setActiveTab] = useState<NotificationTabType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  // Modal view for announcement details
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Quick Approval Modal
  const [quickApproveItem, setQuickApproveItem] = useState<ApprovalRequest | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated current reference date for Q4 2026: 23 October 2026
  const referenceDateStr = '2026-10-23';
  const referenceYear = 2026;
  const yearEndDate = new Date('2026-12-31');
  const today = new Date(referenceDateStr);
  const daysUntilYearEnd = Math.max(0, Math.ceil((yearEndDate.getTime() - today.getTime()) / (1000 * 3600 * 24)));

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ==========================================
  // PILLAR 1: SYSTEM ALERTS
  // ==========================================
  const systemAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      titleLao: string;
      titleEn: string;
      messageLao: string;
      messageEn: string;
      category: 'DATABASE' | 'SECURITY' | 'BIOMETRIC' | 'AUDIT';
      status: 'NORMAL' | 'WARNING' | 'CRITICAL';
      metricBadge?: string;
      timestamp: string;
      isRead: boolean;
      actionModule?: string;
      actionSubModule?: string;
    }> = [
      {
        id: 'sys-cloudsql-snapshot',
        titleLao: 'ການສຳຮອງຖານຂໍ້ມູນ Cloud SQL PostgreSQL ສຳເລັດ',
        titleEn: 'Automated Cloud SQL Database Snapshot Healthy',
        messageLao: 'ລະບົບໄດ້ສຳຮອງຂໍ້ມູນອັດຕະໂນມັດປະຈຳວັນເວລາ 02:00 ໂມງ. ຄວາມສົມບູນ 100% (ຂະໜາດ 1.48 GB, ຖານຂໍ້ມູນ LHSE Production).',
        messageEn: 'Daily automated Cloud SQL snapshot verified with 100% data integrity. Size: 1.48 GB, State: HEALTHY.',
        category: 'DATABASE',
        status: 'NORMAL',
        metricBadge: 'Backup 100%',
        timestamp: '2026-10-23T02:00:00Z',
        isRead: false,
        actionModule: 'module-15',
        actionSubModule: 'system-status',
      },
      {
        id: 'sys-tls-cert',
        titleLao: 'ໃບຢັ້ງຢືນຄວາມປອດໄພ Wildcard TLS/SSL ໃຊ້ງານໄດ້ປົກກະຕິ',
        titleEn: 'Wildcard TLS/SSL Certificate Valid (*.lhse.gov.la)',
        messageLao: 'ໃບຢັ້ງຢືນຄວາມປອດໄພ TLS 1.3 ມີອາຍຸເຫຼືອ 280 ວັນ (ໝົດອາຍຸ: 30/07/2027). ການເຂົ້າລະຫັດ HTTPS/TLS ເຮັດວຽກສົມບູນ.',
        messageEn: 'TLS 1.3 Wildcard SSL certificate active with 280 days remaining before auto-renewal scheduled on 30 Jul 2027.',
        category: 'SECURITY',
        status: 'NORMAL',
        metricBadge: '280 Days Left',
        timestamp: '2026-10-22T06:00:00Z',
        isRead: true,
        actionModule: 'module-15',
        actionSubModule: 'security-keys',
      },
      {
        id: 'sys-biometrics-sync',
        titleLao: 'ປະຕູສະແກນນິ້ວມື & ໃບໜ້າ ຊິງຄ໌ຂໍ້ມູນສຳເລັດ 4/4 ຈຸດ',
        titleEn: 'Biometric Attendance Terminals Synced (4/4 Gateways)',
        messageLao: 'ເຄື່ອງບັນທຶກເວລາເຂົ້າ-ອອກວຽກທຸກຈຸດ (ສຳນັກງານໃຫຍ່ ແລະ ພາກສະໜາມ) ເຊື່ອມຕໍ່ປົກກະຕິ 100% ບໍ່ມີຂໍ້ມູນຕົກຄ້າງ.',
        messageEn: 'All 4 optical & facial biometric gateways across HQ and substation control hubs are online and synchronized.',
        category: 'BIOMETRIC',
        status: 'NORMAL',
        metricBadge: '4/4 Online',
        timestamp: '2026-10-23T07:30:00Z',
        isRead: true,
        actionModule: 'module-4',
        actionSubModule: 'devices',
      },
      {
        id: 'sys-audit-policy',
        titleLao: 'ແຈ້ງເຕືອນຄວາມປອດໄພ: ນະໂຍບາຍ Session & 2FA ຖືກປັບປຸງ',
        titleEn: 'Security Alert: Session & 2FA Enforcement Policy Active',
        messageLao: 'ລະບົບໄດ້ບັງຄັບໃຊ້ນະໂຍບາຍໝົດເວລາ Session 30 ນາທີ ແລະ ເປີດໃຊ້ການຢືນຢັນຕົວຕົນ 2FA ສຳລັບທຸກບັນຊີແອດມິນ.',
        messageEn: 'Enforced global 30-minute idle session timeout and mandatory two-factor authentication (2FA) for administrators.',
        category: 'AUDIT',
        status: 'NORMAL',
        metricBadge: '2FA Enforced',
        timestamp: '2026-10-23T04:15:00Z',
        isRead: false,
        actionModule: 'module-15',
        actionSubModule: 'audit-logs',
      },
    ];

    // Append any system notifications from mock data
    notifications
      .filter((n) => n.type === 'SYSTEM' && !list.some((item) => item.id === n.id))
      .forEach((n) => {
        list.push({
          id: n.id,
          titleLao: n.titleLao,
          titleEn: n.titleEn,
          messageLao: n.messageLao,
          messageEn: n.messageEn,
          category: 'SECURITY',
          status: 'NORMAL',
          metricBadge: 'Notice',
          timestamp: n.createdAt,
          isRead: n.isRead,
          actionModule: 'module-15',
          actionSubModule: 'system-status',
        });
      });

    return list;
  }, [notifications]);

  // ==========================================
  // PILLAR 2: APPROVAL STATUS UPDATES
  // ==========================================
  const pendingApprovals = useMemo(() => {
    return approvalRequests.filter((a) => a.status === 'PENDING');
  }, [approvalRequests]);

  const approvalStatusUpdates = useMemo(() => {
    // Shows recently resolved requests (APPROVED, RETURNED, REJECTED)
    return approvalRequests.filter(
      (a) => a.status === 'APPROVED' || a.status === 'RETURNED' || a.status === 'REJECTED'
    );
  }, [approvalRequests]);

  // ==========================================
  // PILLAR 3: UPCOMING HR DEADLINES
  // ==========================================
  // 1. Contract & Probation Expirations (30, 60, 90 days)
  const contractDeadlines = useMemo(() => {
    const list: Array<{
      id: string;
      employeeId: string;
      employeeCode: string;
      employeeNameEn: string;
      employeeNameLao: string;
      departmentNameEn: string;
      departmentNameLao: string;
      positionTitleEn: string;
      positionTitleLao: string;
      contractEndDate: string;
      employmentType: string;
      daysRemaining: number;
      isUrgent: boolean;
      titleLao: string;
      titleEn: string;
      messageLao: string;
      messageEn: string;
    }> = [];

    employees.forEach((emp) => {
      if (emp.status !== 'ACTIVE') return;
      if (!emp.contractEndDate && emp.employmentType !== 'CONTRACT' && emp.employmentType !== 'PROBATION') return;

      const endDateStr = emp.contractEndDate || (emp.employmentType === 'PROBATION' ? '2026-11-10' : '2026-11-20');
      const endDate = new Date(endDateStr);
      const diffMs = endDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 3600 * 24));

      if (daysLeft <= 90) {
        const isUrgent = daysLeft <= 30;
        const dept = departments.find((d) => d.id === emp.departmentId);
        const pos = positions.find((p) => p.id === emp.positionId);
        const empTypeLabel = emp.employmentType === 'PROBATION' ? 'ໄລຍະທົດລອງງານ (Probation)' : 'ສັນຍາຈ້າງກຳນົດເວລາ (Fixed-Term Contract)';
        const empTypeLabelEn = emp.employmentType === 'PROBATION' ? 'Probation Period' : 'Fixed-Term Contract';

        list.push({
          id: `contract-exp-${emp.id}`,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeNameEn: `${emp.firstNameEn} ${emp.lastNameEn}`,
          employeeNameLao: `${emp.firstNameLao} ${emp.lastNameLao}`,
          departmentNameEn: dept?.nameEn || 'Administration',
          departmentNameLao: dept?.nameLao || 'ບໍລິຫານ',
          positionTitleEn: pos?.titleEn || 'Officer',
          positionTitleLao: pos?.titleLao || 'ວິຊາການ',
          contractEndDate: endDateStr,
          employmentType: emp.employmentType,
          daysRemaining: daysLeft,
          isUrgent,
          titleLao: `${emp.employmentType === 'PROBATION' ? 'ຄົບກຳນົດທົດລອງງານ' : 'ສັນຍາຈ້າງໃກ້ຄົບກຳນົດ'}: ${emp.firstNameLao} ${emp.lastNameLao} (${daysLeft > 0 ? `ເຫຼືອ ${daysLeft} ວັນ` : 'ຄົບກຳນົດແລ້ວ'})`,
          titleEn: `${empTypeLabelEn} Renewal: ${emp.firstNameEn} ${emp.lastNameEn} (${daysLeft > 0 ? `${daysLeft} Days Left` : 'Due Today'})`,
          messageLao: `ພະນັກງານລະຫັດ ${emp.employeeCode} (${dept?.nameLao || ''}) ສັນຍາປະເພດ ${empTypeLabel} ຈະຄົບກຳນົດໃນວັນທີ ${endDateStr}. ກະລຸນາກວດສອບຜົນງານ ແລະ ດຳເນີນການຕໍ່ສັນຍາ ຫຼື ບັນຈຸເປັນພະນັກງານສົມບູນ.`,
          messageEn: `Employee ${emp.employeeCode} (${dept?.nameEn || ''}) ${empTypeLabelEn} expires on ${endDateStr}. Please review performance appraisals to process contract extension or permanent conversion per HR regulations.`,
        });
      }
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [employees, departments, positions, today]);

  // 2. Leave Quota Expiry (Lao Labor Law Art. 57)
  const leaveExpirationAlerts = useMemo(() => {
    const alertsList: Array<{
      id: string;
      titleLao: string;
      titleEn: string;
      messageLao: string;
      messageEn: string;
      daysRemaining: number;
      atRiskDays: number;
      isUrgent: boolean;
      expiryDate: string;
      type: 'COMPANY_WIDE' | 'PERSONAL' | 'TEAM';
    }> = [];

    // Alert A: Organization-wide Year-End Annual Leave Expiry Notice (Dec 31, 2026)
    alertsList.push({
      id: 'leave-exp-org-2026',
      titleLao: `ໂຄຕ້າລາພັກປະຈຳປີ 2026 ໃກ້ໝົດອາຍຸ (ເຫຼືອ ${daysUntilYearEnd} ວັນ)`,
      titleEn: `2026 Annual Leave Quota Expiring in ${daysUntilYearEnd} Days`,
      messageLao: `ຕາມກົດໝາຍແຮງງານລາວ (ມາດຕາ 57) ສາມາດຍົກຍອດວັນພັກປະຈຳປີໄປປີ 2027 ໄດ້ສູງສຸດບໍ່ເກີນ 5 ວັນ. ວັນລາທີ່ເກີນ 5 ວັນ ຈະໝົດອາຍຸໃນວັນທີ 31/12/2026. ກະລຸນາວາງແຜນລາພັກລ່ວງໜ້າ.`,
      messageEn: `Per Lao Labor Law (Article 57), maximum 5 unused annual leave days can be carried forward to 2027. Balances exceeding 5 days expire on 31 Dec 2026. Please schedule leaves in advance.`,
      daysRemaining: daysUntilYearEnd,
      atRiskDays: 5,
      isUrgent: daysUntilYearEnd <= 90,
      expiryDate: '2026-12-31',
      type: 'COMPANY_WIDE',
    });

    // Alert B: Current User's Personal Leave Expiry
    const userEmpId = currentUser.employeeId || 'emp-001';
    const userBalance = leaveBalances.find((b) => b.employeeId === userEmpId && b.year === referenceYear && b.leaveTypeId === 'lt-1');
    if (userBalance && userBalance.remaining > 0) {
      const atRisk = Math.max(0, userBalance.remaining - 5);
      alertsList.push({
        id: `leave-exp-user-${userEmpId}`,
        titleLao: `ວັນພັກປະຈຳປີຂອງທ່ານເຫຼືອ ${userBalance.remaining} ວັນ (${atRisk > 0 ? `ສ່ຽງໝົດອາຍຸ ${atRisk} ວັນ` : 'ຢູ່ໃນເກນປອດໄພ'})`,
        titleEn: `Your Remaining Annual Leave: ${userBalance.remaining} Days (${atRisk > 0 ? `${atRisk} Days at Risk` : 'Within safe limit'})`,
        messageLao: `ທ່ານຍັງມີໂຄຕ້າລາພັກປະຈຳປີ 2026 ເຫຼືອ ${userBalance.remaining} ວັນ. ຫາກບໍ່ຕ້ອງການເສຍສິດວັນລາທີ່ເກີນໂຄຕ້າຍົກຍອດ (${atRisk} ວັນ), ກະລຸນາຍື່ນຄຳຮ້ອງລາພັກກ່ອນວັນທີ 31 ທັນວາ 2026.`,
        messageEn: `You have ${userBalance.remaining} annual leave days remaining for 2026. To prevent forfeiture of days beyond the 5-day rollover threshold (${atRisk} days), please plan your leave.`,
        daysRemaining: daysUntilYearEnd,
        atRiskDays: atRisk,
        isUrgent: atRisk > 0,
        expiryDate: '2026-12-31',
        type: 'PERSONAL',
      });
    }

    return alertsList;
  }, [leaveBalances, currentUser, daysUntilYearEnd, referenceYear]);

  // 3. Operational Performance & Payroll Cutoff Deadlines
  const operationalDeadlines = useMemo(() => {
    return [
      {
        id: 'deadline-kpi-q4-2026',
        titleLao: 'ກຳນົດສົ່ງແບບປະເມີນ KPI & ຜົນງານ Q4 2026 (ເຫຼືອ 23 ວັນ)',
        titleEn: 'Upcoming Deadline: Q4 2026 KPI & Performance Appraisals',
        messageLao: 'ກຳນົດເວລາສຸດທ້າຍໃນການຍື່ນແບບປະເມີນ KPI ປະຈຳໄຕມາດ 4 ແມ່ນວັນທີ 15 ພະຈິກ 2026. ກະລຸນາສຳເລັດການປະເມີນໃຫ້ທັນກຳນົດ.',
        messageEn: 'Final deadline for Q4 2026 Employee KPI & Performance Appraisal submissions is 15 November 2026 (23 days remaining).',
        dueDate: '2026-11-15',
        daysRemaining: 23,
        isUrgent: false,
        category: 'PERFORMANCE' as const,
        actionModule: 'module-2',
        actionSubModule: 'performance',
      },
      {
        id: 'deadline-payroll-sso-oct',
        titleLao: 'ກຳນົດປິດຮອບເງິນເດືອນ & ສົ່ງປະກັນສັງຄົມ (SSO) ວັນທີ 25',
        titleEn: 'Upcoming Deadline: Monthly Payroll & SSO Cutoff (25th)',
        messageLao: 'ຮອບປິດເວລາເຮັດວຽກ, ຄ່າລ່ວງເວລາ (OT) ແລະ ການແຈ້ງຫັກປະກັນສັງຄົມ 5.5% ປະຈຳເດືອນຕຸລາ ຈະປິດໃນວັນທີ 25/10/2026 ເວລາ 17:00 ໂມງ.',
        messageEn: 'October attendance cut-off, overtime claims, and Social Security (SSO) 5.5% declaration deadline is 25 Oct 2026 at 17:00 (2 days left).',
        dueDate: '2026-10-25',
        daysRemaining: 2,
        isUrgent: true,
        category: 'PAYROLL' as const,
        actionModule: 'module-7',
        actionSubModule: 'periods',
      },
    ];
  }, []);

  // Overall unread & actionable count
  const unreadCount = useMemo(() => {
    const unreadStandard = notifications.filter((n) => !n.isRead).length;
    const pendingApprCount = pendingApprovals.length;
    const urgentContractCount = contractDeadlines.filter((c) => c.isUrgent).length;
    const urgentLeaveCount = leaveExpirationAlerts.filter((l) => l.isUrgent).length;
    const urgentOpCount = operationalDeadlines.filter((o) => o.isUrgent).length;
    return unreadStandard + pendingApprCount + urgentContractCount + urgentLeaveCount + urgentOpCount;
  }, [notifications, pendingApprovals, contractDeadlines, leaveExpirationAlerts, operationalDeadlines]);

  // Unified items list based on active tab and search
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // 1. System Alert Items
    const systemItems = systemAlerts.map((sys) => ({
      key: `sys-${sys.id}`,
      pillar: 'SYSTEM_ALERTS' as const,
      id: sys.id,
      titleLao: sys.titleLao,
      titleEn: sys.titleEn,
      descriptionLao: sys.messageLao,
      descriptionEn: sys.messageEn,
      timestamp: sys.timestamp,
      isRead: sys.isRead,
      status: sys.status,
      metricBadge: sys.metricBadge,
      category: sys.category,
      actionModule: sys.actionModule,
      actionSubModule: sys.actionSubModule,
      rawSystem: sys,
    }));

    // 2. Pending Approval Items
    const pendingApprovalItems = pendingApprovals.map((appr) => ({
      key: `appr-pend-${appr.id}`,
      pillar: 'APPROVAL_UPDATES' as const,
      subType: 'PENDING' as const,
      id: appr.id,
      titleLao: `ຄຳຮ້ອງ ${appr.type === 'LEAVE' ? 'ລາພັກ' : appr.type === 'EXPENSE' ? 'ເບີກຈ່າຍ' : appr.type === 'ATTENDANCE_CORRECTION' ? 'ດັດແກ້ເວລາສະແກນ' : 'ອະນຸມັດ'} ລໍຖ້າກວດສອບ`,
      titleEn: `Pending ${appr.type.replace('_', ' ')}: ${appr.requesterName}`,
      descriptionLao: `${appr.requesterName} (${appr.departmentName}) • ${appr.title} • ຈຳນວນ: ${appr.amountOrDays || '-'}`,
      descriptionEn: `${appr.requesterName} (${appr.departmentName}) • ${appr.title} • Quantity: ${appr.amountOrDays || '-'}`,
      timestamp: appr.createdAt,
      isRead: false,
      rawApproval: appr,
    }));

    // 3. Approval Status Updates (Approved, Returned, Rejected)
    const statusUpdateItems = approvalStatusUpdates.map((appr) => {
      const lastHistory = appr.history && appr.history.length > 0 ? appr.history[appr.history.length - 1] : null;
      const statusLabelLao =
        appr.status === 'APPROVED' ? 'ອະນຸມັດແລ້ວ' : appr.status === 'RETURNED' ? 'ສົ່ງກັບແກ້ໄຂ' : 'ປະຕິເສດແລ້ວ';
      const statusLabelEn =
        appr.status === 'APPROVED' ? 'Approved' : appr.status === 'RETURNED' ? 'Returned' : 'Rejected';

      return {
        key: `appr-stat-${appr.id}`,
        pillar: 'APPROVAL_UPDATES' as const,
        subType: 'STATUS_UPDATE' as const,
        id: appr.id,
        status: appr.status,
        titleLao: `ສະຖານະ: ${statusLabelLao} - ${appr.title}`,
        titleEn: `Status Update: ${statusLabelEn} - ${appr.title}`,
        descriptionLao: `${appr.requesterName} • ຜົນ: ${statusLabelLao} ${lastHistory?.actorName ? `ໂດຍ ${lastHistory.actorName}` : ''}${lastHistory?.comments ? ` ("${lastHistory.comments}")` : ''}`,
        descriptionEn: `${appr.requesterName} • Result: ${statusLabelEn} ${lastHistory?.actorName ? `by ${lastHistory.actorName}` : ''}${lastHistory?.comments ? ` ("${lastHistory.comments}")` : ''}`,
        timestamp: lastHistory?.timestamp || appr.createdAt,
        isRead: false,
        rawApproval: appr,
      };
    });

    // 4. Contract Renewal Deadlines
    const contractItems = contractDeadlines.map((contract) => ({
      key: `dl-contract-${contract.id}`,
      pillar: 'HR_DEADLINES' as const,
      subType: 'CONTRACT' as const,
      id: contract.id,
      titleLao: contract.titleLao,
      titleEn: contract.titleEn,
      descriptionLao: contract.messageLao,
      descriptionEn: contract.messageEn,
      timestamp: contract.contractEndDate,
      isRead: false,
      isUrgent: contract.isUrgent,
      daysRemaining: contract.daysRemaining,
      rawContract: contract,
    }));

    // 5. Leave Expiry Deadlines
    const leaveItems = leaveExpirationAlerts.map((leave) => ({
      key: `dl-leave-${leave.id}`,
      pillar: 'HR_DEADLINES' as const,
      subType: 'LEAVE_EXPIRY' as const,
      id: leave.id,
      titleLao: leave.titleLao,
      titleEn: leave.titleEn,
      descriptionLao: leave.messageLao,
      descriptionEn: leave.messageEn,
      timestamp: leave.expiryDate,
      isRead: false,
      isUrgent: leave.isUrgent,
      daysRemaining: leave.daysRemaining,
      rawLeave: leave,
    }));

    // 6. Operational Deadlines (KPI & Payroll)
    const operationalItems = operationalDeadlines.map((op) => ({
      key: `dl-op-${op.id}`,
      pillar: 'HR_DEADLINES' as const,
      subType: 'OPERATIONAL' as const,
      id: op.id,
      titleLao: op.titleLao,
      titleEn: op.titleEn,
      descriptionLao: op.messageLao,
      descriptionEn: op.messageEn,
      timestamp: op.dueDate,
      isRead: false,
      isUrgent: op.isUrgent,
      daysRemaining: op.daysRemaining,
      category: op.category,
      actionModule: op.actionModule,
      actionSubModule: op.actionSubModule,
    }));

    // 7. Announcements Items
    const announcementItems = announcements.map((ann) => ({
      key: `ann-${ann.id}`,
      pillar: 'ANNOUNCEMENTS' as const,
      subType: 'ANNOUNCEMENT' as const,
      id: ann.id,
      titleLao: ann.titleLao,
      titleEn: ann.titleEn,
      descriptionLao: ann.contentLao,
      descriptionEn: ann.contentEn,
      timestamp: ann.publishedAt,
      isRead: false,
      isImportant: ann.isImportant,
      rawAnnouncement: ann,
    }));

    // Combine pool according to active tab
    type UnifiedItem =
      | (typeof systemItems)[number]
      | (typeof pendingApprovalItems)[number]
      | (typeof statusUpdateItems)[number]
      | (typeof contractItems)[number]
      | (typeof leaveItems)[number]
      | (typeof operationalItems)[number]
      | (typeof announcementItems)[number];

    let pool: UnifiedItem[] = [];
    if (activeTab === 'ALL') {
      pool = [
        ...pendingApprovalItems,
        ...contractItems,
        ...systemItems,
        ...statusUpdateItems,
        ...operationalItems,
        ...leaveItems,
        ...announcementItems,
      ];
    } else if (activeTab === 'SYSTEM_ALERTS') {
      pool = systemItems;
    } else if (activeTab === 'APPROVAL_UPDATES') {
      pool = [...pendingApprovalItems, ...statusUpdateItems];
    } else if (activeTab === 'HR_DEADLINES') {
      pool = [...contractItems, ...operationalItems, ...leaveItems];
    } else if (activeTab === 'ANNOUNCEMENTS') {
      pool = announcementItems;
    }

    // Apply Unread filter
    if (onlyUnread) {
      pool = pool.filter((item) => !item.isRead);
    }

    // Apply Search Query filter
    if (query) {
      pool = pool.filter(
        (item) =>
          item.titleLao.toLowerCase().includes(query) ||
          item.titleEn.toLowerCase().includes(query) ||
          item.descriptionLao.toLowerCase().includes(query) ||
          item.descriptionEn.toLowerCase().includes(query)
      );
    }

    return pool;
  }, [
    activeTab,
    systemAlerts,
    pendingApprovals,
    approvalStatusUpdates,
    contractDeadlines,
    leaveExpirationAlerts,
    operationalDeadlines,
    announcements,
    onlyUnread,
    searchQuery,
  ]);

  // Execute Quick Approval from Notification Center
  const handleQuickApprove = async () => {
    if (!quickApproveItem) return;
    setIsProcessing(true);
    try {
      await processApproval(quickApproveItem.id, 'APPROVE', approveComment || 'Quick approved via Notification Center');
      alerts.success(
        language === 'lo' ? 'ອະນຸມັດຄຳຮ້ອງສຳເລັດ' : 'Request Approved',
        language === 'lo'
          ? `ຄຳຮ້ອງຂອງ ${quickApproveItem.requesterName} ໄດ້ຮັບການອະນຸມັດຮຽບຮ້ອຍແລ້ວ`
          : `Approved request for ${quickApproveItem.requesterName}.`
      );
      setQuickApproveItem(null);
      setApproveComment('');
    } catch {
      alerts.error(language === 'lo' ? 'ການອະນຸມັດຜິດພາດ' : 'Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick reject
  const handleQuickReject = async (requestId: string) => {
    setIsProcessing(true);
    try {
      await processApproval(requestId, 'REJECT', 'Rejected via Notification Center');
      alerts.info(
        language === 'lo' ? 'ປະຕິເສດຄຳຮ້ອງ' : 'Request Rejected',
        language === 'lo' ? 'ຄຳຮ້ອງໄດ້ຖືກປະຕິເສດແລ້ວ' : 'The request has been rejected.'
      );
    } catch {
      alerts.error(language === 'lo' ? 'ເກີດຂໍ້ຜິດພາດ' : 'Error rejecting request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format time helper
  const formatTimeAgo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = today.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return language === 'lo' ? `${diffDays} ມື້ກ່ອນ` : `${diffDays}d ago`;
      }
      if (diffHours > 0) {
        return language === 'lo' ? `${diffHours} ຊົ່ວໂມງກ່ອນ` : `${diffHours}h ago`;
      }
      return language === 'lo' ? 'ມື້ນີ້' : 'Today';
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* 1. Header Trigger Bell Button */}
      <button
        onClick={onToggle}
        className={`relative p-2.5 rounded-2xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={
          language === 'lo'
            ? `ສູນການແຈ້ງເຕືອນ HR (${unreadCount} ລາຍການ)`
            : `HR Notification Center (${unreadCount} pending)`
        }
        aria-label="HR Alerts and Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Counter Badge with Pulse for Urgent Items */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black font-mono shadow-sm border-2 border-white dark:border-slate-900 animate-in fade-in zoom-in-75">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping -z-10" />
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Notification Center Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 sm:w-[500px] max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Decorative ambient gradients */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Panel Top Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{language === 'lo' ? 'ສູນການແຈ້ງເຕືອນ HR' : 'HR Notification Center'}</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                        {unreadCount} {language === 'lo' ? 'ລໍຖ້າດຳເນີນການ' : 'Actionable'}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'lo'
                      ? 'ຕິດຕາມແຈ້ງເຕືອນລະບົບ, ສະຖານະການອະນຸມັດ ແລະ ກຳນົດເວລາ HR'
                      : 'System alerts, approval status updates & upcoming HR deadlines'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="p-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition-colors font-medium flex items-center gap-1 cursor-pointer"
                    title={language === 'lo' ? 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ' : 'Mark all read'}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline text-[11px]">
                      {language === 'lo' ? 'ອ່ານໝົດແລ້ວ' : 'Mark Read'}
                    </span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* THREE PILLAR STATUS SUMMARY WIDGET */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-sans">
              {/* System Alerts Metric */}
              <button
                type="button"
                onClick={() => setActiveTab('SYSTEM_ALERTS')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'SYSTEM_ALERTS'
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 ring-1 ring-blue-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Server className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
                  {language === 'lo' ? 'ແຈ້ງເຕືອນລະບົບ' : 'System Alerts'}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {systemAlerts.length} {language === 'lo' ? 'ລາຍການ' : 'Active'}
                </div>
              </button>

              {/* Approval Status Updates Metric */}
              <button
                type="button"
                onClick={() => setActiveTab('APPROVAL_UPDATES')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'APPROVAL_UPDATES'
                    ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-1 ring-amber-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FileCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {pendingApprovals.length > 0 && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded-sm bg-amber-500 text-white">
                      {pendingApprovals.length}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
                  {language === 'lo' ? 'ສະຖານະອະນຸມັດ' : 'Approvals'}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {pendingApprovals.length} {language === 'lo' ? 'ລໍຖ້າ' : 'Pend'} • {approvalStatusUpdates.length} {language === 'lo' ? 'ອັບເດດ' : 'Upd'}
                </div>
              </button>

              {/* Upcoming HR Deadlines Metric */}
              <button
                type="button"
                onClick={() => setActiveTab('HR_DEADLINES')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'HR_DEADLINES'
                    ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 ring-1 ring-rose-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CalendarX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-[9px] font-mono font-bold px-1 rounded-sm bg-rose-500 text-white">
                    {contractDeadlines.filter((c) => c.isUrgent).length + leaveExpirationAlerts.filter((l) => l.isUrgent).length}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">
                  {language === 'lo' ? 'ກຳນົດເວລາ HR' : 'HR Deadlines'}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {contractDeadlines.length + leaveExpirationAlerts.length + operationalDeadlines.length} {language === 'lo' ? 'ໃກ້ຄົບ' : 'Due Soon'}
                </div>
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'lo'
                    ? 'ຄົ້ນຫາແຈ້ງເຕືອນລະບົບ, ຄຳຮ້ອງອະນຸມັດ, ຫຼື ກຳນົດເວລາ...'
                    : 'Search alerts, approvals, deadlines, or topics...'
                }
                className="w-full pl-8.5 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Category Tabs (The 3 Functional Pillars + All + Announcements) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
              {/* All */}
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{language === 'lo' ? 'ທັງໝົດ' : 'All'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                  {systemAlerts.length + pendingApprovals.length + approvalStatusUpdates.length + contractDeadlines.length + leaveExpirationAlerts.length + operationalDeadlines.length + announcements.length}
                </span>
              </button>

              {/* Pillar 1: System Alerts */}
              <button
                onClick={() => setActiveTab('SYSTEM_ALERTS')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'SYSTEM_ALERTS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100'
                }`}
              >
                <Server className="w-3 h-3" />
                <span>{language === 'lo' ? 'ແຈ້ງເຕືອນລະບົບ' : 'System Alerts'}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                  {systemAlerts.length}
                </span>
              </button>

              {/* Pillar 2: Approval Status Updates */}
              <button
                onClick={() => setActiveTab('APPROVAL_UPDATES')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'APPROVAL_UPDATES'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100'
                }`}
              >
                <FileCheck className="w-3 h-3" />
                <span>{language === 'lo' ? 'ສະຖານະການອະນຸມັດ' : 'Approval Updates'}</span>
                {(pendingApprovals.length > 0 || approvalStatusUpdates.length > 0) && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                    {pendingApprovals.length + approvalStatusUpdates.length}
                  </span>
                )}
              </button>

              {/* Pillar 3: Upcoming HR Deadlines */}
              <button
                onClick={() => setActiveTab('HR_DEADLINES')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'HR_DEADLINES'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100'
                }`}
              >
                <CalendarX className="w-3 h-3" />
                <span>{language === 'lo' ? 'ກຳນົດເວລາ HR' : 'HR Deadlines'}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100">
                  {contractDeadlines.length + leaveExpirationAlerts.length + operationalDeadlines.length}
                </span>
              </button>

              {/* Announcements */}
              <button
                onClick={() => setActiveTab('ANNOUNCEMENTS')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ANNOUNCEMENTS'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100'
                }`}
              >
                <Megaphone className="w-3 h-3" />
                <span>{language === 'lo' ? 'ແຈ້ງການ' : 'Notices'}</span>
                {announcements.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100">
                    {announcements.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 3. Notification Center Scrollable List Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {language === 'lo' ? 'ບໍ່ມີການແຈ້ງເຕືອນ' : 'All Caught Up!'}
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {language === 'lo'
                    ? 'ທ່ານໄດ້ກວດກາ ແລະ ດຳເນີນການທຸກຄຳຮ້ອງ, ລະບົບ ແລະ ກຳນົດເວລາໝົດແລ້ວ.'
                    : 'No pending alerts or notifications match your current filter.'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                // ==========================================
                // CARD 1: SYSTEM ALERTS PILLAR
                // ==========================================
                if (item.pillar === 'SYSTEM_ALERTS') {
                  const sys = (item as any).rawSystem;
                  return (
                    <div
                      key={item.key}
                      className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/90 dark:border-blue-900/50 space-y-2.5 hover:border-blue-400 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                            {sys.category === 'DATABASE' ? (
                              <Database className="w-4 h-4" />
                            ) : sys.category === 'BIOMETRIC' ? (
                              <Cpu className="w-4 h-4" />
                            ) : (
                              <ShieldCheck className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-200/80 dark:bg-blue-900 text-blue-900 dark:text-blue-100 uppercase">
                                {sys.category}
                              </span>
                              {sys.metricBadge && (
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {sys.metricBadge}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                {language === 'lo' ? 'ສະຖານະປົກກະຕິ' : 'Operational'}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                              {language === 'lo' ? item.titleLao : item.titleEn}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                              {language === 'lo' ? item.descriptionLao : item.descriptionEn}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      {/* Action buttons inside System alert */}
                      <div className="flex items-center justify-between pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                        <span className="text-[10px] text-slate-400 font-mono">
                          LHSE System Integrity & Security
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setActiveModule(sys.actionModule || 'module-15');
                            if (sys.actionSubModule) {
                              setActiveSubModule(sys.actionSubModule);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{language === 'lo' ? 'ກວດສອບລະບົບ' : 'View System'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // ==========================================
                // CARD 2: APPROVAL STATUS UPDATES PILLAR
                // ==========================================
                if (item.pillar === 'APPROVAL_UPDATES') {
                  const appr = (item as any).rawApproval as ApprovalRequest;

                  // 2A. PENDING APPROVAL REQUIRING ACTION
                  if ((item as any).subType === 'PENDING') {
                    return (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/90 dark:border-amber-900/50 space-y-2.5 hover:border-amber-400 transition-all shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                              <FileCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                  {appr.type === 'LEAVE'
                                    ? 'LEAVE'
                                    : appr.type === 'EXPENSE'
                                    ? 'EXPENSE'
                                    : appr.type === 'ATTENDANCE_CORRECTION'
                                    ? 'PUNCH_ADJUST'
                                    : appr.type}
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 font-mono px-1 rounded-sm bg-amber-100 dark:bg-amber-900/40">
                                  {language === 'lo' ? 'ລໍຖ້າອະນຸມັດ' : 'PENDING ACTION'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 font-mono">
                                  Step {appr.currentStep}/{appr.totalSteps}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                                {appr.requesterName}
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                                {appr.title}
                              </p>
                              {appr.amountOrDays && (
                                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-mono font-bold mt-0.5">
                                  {appr.amountOrDays}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatTimeAgo(appr.createdAt)}
                          </span>
                        </div>

                        {/* Action buttons inside Pending Approval */}
                        <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {appr.departmentName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setQuickApproveItem(appr)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>{language === 'lo' ? 'ອະນຸມັດດ່ວນ' : 'Quick Approve'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickReject(appr.id)}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-900"
                            >
                              <X className="w-3 h-3" />
                              <span>{language === 'lo' ? 'ປະຕິເສດ' : 'Reject'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                setActiveModule('module-12');
                                setActiveSubModule('pending');
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>{language === 'lo' ? 'ກວດສອບ' : 'Review'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 2B. STATUS UPDATE (APPROVED, RETURNED, REJECTED)
                  const isApproved = appr.status === 'APPROVED';
                  const isReturned = appr.status === 'RETURNED';
                  const isRejected = appr.status === 'REJECTED';

                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-2xl border space-y-2 transition-all shadow-2xs ${
                        isApproved
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50 hover:border-emerald-400'
                          : isReturned
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50 hover:border-amber-400'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50 hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 text-white ${
                              isApproved
                                ? 'bg-emerald-600'
                                : isReturned
                                ? 'bg-amber-600'
                                : 'bg-rose-600'
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isReturned ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                                  isApproved
                                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                                    : isReturned
                                    ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                                    : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                                }`}
                              >
                                {isApproved
                                  ? (language === 'lo' ? 'ອະນຸມັດແລ້ວ' : 'APPROVED')
                                  : isReturned
                                  ? (language === 'lo' ? 'ສົ່ງກັບແກ້ໄຂ' : 'RETURNED')
                                  : (language === 'lo' ? 'ປະຕິເສດແລ້ວ' : 'REJECTED')}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-bold">
                                {appr.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                              {appr.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                              {language === 'lo' ? item.descriptionLao : item.descriptionEn}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-400">
                        <span>{appr.requesterName} ({appr.departmentName})</span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setActiveModule('module-12');
                            setActiveSubModule('history');
                          }}
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{language === 'lo' ? 'ຕິດຕາມຄຳຮ້ອງ' : 'Track Request'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // ==========================================
                // CARD 3: UPCOMING HR DEADLINES PILLAR
                // ==========================================
                if (item.pillar === 'HR_DEADLINES') {
                  const subType = (item as any).subType;

                  // 3A. CONTRACT RENEWALS & PROBATION
                  if (subType === 'CONTRACT') {
                    const contract = (item as any).rawContract;
                    return (
                      <div
                        key={item.key}
                        className={`p-3.5 rounded-2xl border space-y-2.5 transition-all shadow-2xs ${
                          contract.isUrgent
                            ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                            : 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/50 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                                contract.isUrgent ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                              }`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                                    contract.isUrgent
                                      ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                                      : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                                  }`}
                                >
                                  {contract.employmentType === 'PROBATION' ? 'PROBATION' : 'CONTRACT'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {contract.employeeCode}
                                </span>
                                <span
                                  className={`text-[10px] font-bold font-mono ${
                                    contract.isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                                  }`}
                                >
                                  {contract.daysRemaining > 0
                                    ? `${contract.daysRemaining} ${language === 'lo' ? 'ມື້ທີ່ເຫຼືອ' : 'days left'}`
                                    : language === 'lo' ? 'ຄົບກຳນົດແລ້ວ' : 'Due Today'}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                                {language === 'lo' ? contract.employeeNameLao : contract.employeeNameEn}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {language === 'lo' ? contract.positionTitleLao : contract.positionTitleEn} • {language === 'lo' ? contract.departmentNameLao : contract.departmentNameEn}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                {language === 'lo' ? item.descriptionLao : item.descriptionEn}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {contract.contractEndDate}
                          </span>
                        </div>

                        {/* Action buttons inside Contract Renewal Alert */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {language === 'lo' ? 'ສິ້ນສຸດ:' : 'Expires:'} {contract.contractEndDate}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                setActiveModule('module-2');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <User className="w-3 h-3" />
                              <span>{language === 'lo' ? 'ໂປຣໄຟລ໌' : 'Profile'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                alerts.success(
                                  language === 'lo' ? 'ເລີ່ມຂະບວນການຕໍ່ສັນຍາ' : 'Renewal Initiated',
                                  language === 'lo'
                                    ? `ເປີດແບບຟອມຕໍ່ສັນຍາສຳລັບ ${contract.employeeNameLao} ຮຽບຮ້ອຍແລ້ວ`
                                    : `Renewal notice workflow opened for ${contract.employeeNameEn}.`
                                );
                                onClose();
                                setActiveModule('module-13');
                                setActiveSubModule('contracts');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>{language === 'lo' ? 'ດຳເນີນການຕໍ່ສັນຍາ' : 'Process Renewal'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 3B. LEAVE QUOTA EXPIRY
                  if (subType === 'LEAVE_EXPIRY') {
                    const leave = (item as any).rawLeave;
                    return (
                      <div
                        key={item.key}
                        className={`p-3.5 rounded-2xl border space-y-2.5 transition-all shadow-2xs ${
                          leave.isUrgent
                            ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                            : 'bg-blue-50/70 dark:bg-blue-950/25 border-blue-200 dark:border-blue-900/50 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                                leave.isUrgent ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'
                              }`}
                            >
                              <CalendarX className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    leave.isUrgent
                                      ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                                      : 'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                                  }`}
                                >
                                  {language === 'lo' ? 'ໝົດອາຍຸ 31/12/2026' : 'Expires 31/12/2026'}
                                </span>
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                                  {leave.daysRemaining} {language === 'lo' ? 'ວັນທີ່ເຫຼືອ' : 'days left'}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                                {language === 'lo' ? item.titleLao : item.titleEn}
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                {language === 'lo' ? item.descriptionLao : item.descriptionEn}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons inside Leave Expiry alert */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Lao Labor Law Art. 57 (Max 5d carry-over)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              setActiveModule('module-6');
                              setActiveSubModule('requests');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{language === 'lo' ? 'ວາງແຜນລາພັກ' : 'Plan Leave'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // 3C. OPERATIONAL DEADLINES (KPI / PAYROLL)
                  const op = item as any;
                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-2xl border space-y-2.5 transition-all shadow-2xs ${
                        op.isUrgent
                          ? 'bg-rose-50/70 dark:bg-rose-950/25 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                          : 'bg-indigo-50/70 dark:bg-indigo-950/25 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 text-white ${
                              op.isUrgent ? 'bg-rose-600' : 'bg-indigo-600'
                            }`}
                          >
                            {op.category === 'PERFORMANCE' ? (
                              <Award className="w-4 h-4" />
                            ) : (
                              <DollarSign className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono ${
                                  op.isUrgent
                                    ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                                    : 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
                                }`}
                              >
                                {op.category === 'PERFORMANCE' ? 'Q4 APPRAISAL' : 'PAYROLL CUTOFF'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                                {op.daysRemaining} {language === 'lo' ? 'ວັນທີ່ເຫຼືອ' : 'days left'}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1">
                              {language === 'lo' ? item.titleLao : item.titleEn}
                            </h4>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                              {language === 'lo' ? item.descriptionLao : item.descriptionEn}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {op.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {language === 'lo' ? 'ກຳນົດສົ່ງ:' : 'Cut-off:'} {op.timestamp}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            setActiveModule(op.actionModule || 'module-2');
                            if (op.actionSubModule) {
                              setActiveSubModule(op.actionSubModule);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <span>{language === 'lo' ? 'ດຳເນີນການ' : 'Open Module'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                }

                // ==========================================
                // CARD 4: CORPORATE ANNOUNCEMENTS PILLAR
                // ==========================================
                const ann = (item as any).rawAnnouncement as Announcement;
                return (
                  <div
                    key={item.key}
                    onClick={() => setSelectedAnnouncement(ann)}
                    className={`p-3.5 rounded-2xl border space-y-2 cursor-pointer transition-all shadow-2xs ${
                      ann?.isImportant
                        ? 'bg-purple-50/70 dark:bg-purple-950/25 border-purple-200 dark:border-purple-900/50 hover:border-purple-400'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 text-white ${
                            ann?.isImportant ? 'bg-purple-600' : 'bg-slate-700'
                          }`}
                        >
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {ann?.isImportant && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                {language === 'lo' ? 'ສຳຄັນ' : 'Important'}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                              {ann?.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                            {language === 'lo' ? ann?.titleLao : ann?.titleEn}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {language === 'lo' ? ann?.contentLao : ann?.contentEn}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatTimeAgo(ann?.publishedAt || '')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-400">
                      <span>By {ann?.publishedBy}</span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                        <span>{language === 'lo' ? 'ອ່ານເພີ່ມເຕີມ' : 'Read Notice'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 4. Panel Footer: Quick Navigation Shortcuts */}
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveModule('module-15');
                  setActiveSubModule('system-status');
                }}
                className="hover:text-blue-600 font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {language === 'lo' ? 'ລະບົບໄອທີ' : 'System'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveModule('module-12');
                  setActiveSubModule('pending');
                }}
                className="hover:text-blue-600 font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {language === 'lo' ? 'ລະບົບອະນຸມັດ' : 'Approvals'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveModule('module-2');
                  setActiveSubModule('performance');
                }}
                className="hover:text-blue-600 font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {language === 'lo' ? 'ປະເມີນ KPI' : 'KPI & Review'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveModule('module-6');
                  setActiveSubModule('balances');
                }}
                className="hover:text-blue-600 font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {language === 'lo' ? 'ໂຄຕ້າລາພັກ' : 'Leave'}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setActiveModule('module-7');
                }}
                className="hover:text-blue-600 font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {language === 'lo' ? 'ເງິນເດືອນ' : 'Payroll'}
              </button>
            </div>

            <span className="text-[10px] text-slate-400 font-mono shrink-0 pl-2">
              LHSE HR Plus+
            </span>
          </div>
        </div>
      )}

      {/* 5. ANNOUNCEMENT DETAIL MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    {selectedAnnouncement.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {language === 'lo' ? selectedAnnouncement.titleLao : selectedAnnouncement.titleEn}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-3">
              <p className="font-medium">
                {language === 'lo' ? selectedAnnouncement.contentLao : selectedAnnouncement.contentEn}
              </p>
              {language === 'lo' && selectedAnnouncement.contentEn && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 italic">
                  <strong>English Summary:</strong> {selectedAnnouncement.contentEn}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Published by: {selectedAnnouncement.publishedBy}</span>
              <span>{new Date(selectedAnnouncement.publishedAt).toLocaleDateString()}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'lo' ? 'ປິດ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QUICK APPROVAL MODAL */}
      {quickApproveItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    {language === 'lo' ? 'ຢືນຢັນການອະນຸມັດດ່ວນ' : 'Quick Approve Request'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {quickApproveItem.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickApproveItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{language === 'lo' ? 'ຜູ້ຍື່ນຄຳຮ້ອງ:' : 'Requester:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{quickApproveItem.requesterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{language === 'lo' ? 'ພະແນກ:' : 'Department:'}</span>
                <span className="text-slate-800 dark:text-slate-200">{quickApproveItem.departmentName}</span>
              </div>
              {quickApproveItem.amountOrDays && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{language === 'lo' ? 'ຈຳນວນ / ມູນຄ່າ:' : 'Amount/Days:'}</span>
                  <span className="font-bold text-emerald-600">{quickApproveItem.amountOrDays}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'lo' ? 'ຄວາມເຫັນຂອງຜູ້ອະນຸມັດ (ທາງເລືອກ):' : 'Approver Comments (Optional):'}
              </label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder={language === 'lo' ? 'ປ້ອນຄຳເຫັນ ຫຼື ເຫດຜົນການອະນຸມັດ...' : 'Enter approval notes or remarks...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-emerald-500 h-20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickApproveItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleQuickApprove}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {isProcessing
                    ? (language === 'lo' ? 'ກຳລັງອະນຸມັດ...' : 'Approving...')
                    : (language === 'lo' ? 'ຢືນຢັນອະນຸມັດ' : 'Approve')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
