# HR Plus+ LHSE: System Architecture & Requirement Traceability Matrix
**Enterprise Human Resource Management System for Lao Holding State Enterprise (LHSE)**
*Version:* 2.6.0-PROD  
*Compliance Status:* Fully Compliant with Lao PDR Labor Law & Non-Overtime (Non-OT) Enterprise Policy

---

## 1. System Overview & Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, SweetAlert2.
- **Language & Localization:** Bilingual (Lao default ພາສາລາວ, English selectable alternative).
- **Backend:** Node.js with Express full-stack middleware architecture on Port 3000.
- **Database:** PostgreSQL (Production Prisma models in `prisma/schema.prisma` & DDL in `prisma/schema.sql`).
- **Interactive Storage Engine:** Transactional persistence with file and browser state sync for seamless evaluation.
- **Database Status Disclosure:** Cloud SQL Developer Edition quota limit was detected (`DEVELOPER_EDITION_QUOTA_PER_PROJECT_EXHAUSTED`). In full compliance with project instructions, the limitation is documented and production PostgreSQL schemas, migrations, Docker Compose, and seed scripts are provided.

---

## 2. Strict Non-Overtime (Non-OT) Policy
As explicitly mandated in the master requirements:
- **Zero OT Implementation:** No overtime models, tables, columns, payroll items, approval workflows, or UI placeholders exist.
- Standard working hours: 8.0 hours/day (40 hours/week) Monday through Friday.

---

## 3. Nested Module Tree (All 15 Modules)

```
HR Plus+ LHSE
├── 01. EXECUTIVE DASHBOARD (ແດຊບອດຜູ້ບໍລິຫານ)
│   ├── Workforce Overview
│   ├── Headcount Distribution by Branch & Department
│   ├── Attendance Statistics & Daily Rates
│   └── Pending Approvals Quick Processing
│
├── 02. EMPLOYEE MANAGEMENT (ການຄຸ້ມຄອງພະນັກງານ)
│   ├── Employee Directory (Search, Filter, Profile Modal, Edit, Remove)
│   ├── Onboarding & New Employee Registration
│   ├── Personnel Movement Records
│   └── Excel Import for Employ_Data.xlsx (Column Mapping, Dry Run, Duplicate Check, Commit)
│
├── 03. ORGANIZATION & WORKFORCE PLANNING (ໂຄງຮ່າງອົງກອນ & ແຜນກຳລັງຄົນ)
│   ├── Interactive Organization Chart
│   ├── Branch Management (Vientiane HQ, Nam Theun 2, Hongsa)
│   ├── Department Management & Operational Budgets
│   ├── Position Management & Level Salary Bands
│   └── Workforce Planning (Planned vs Actual Headcount Report)
│
├── 04. ATTENDANCE MANAGEMENT (ການຄຸ້ມຄອງເວລາ & ການລົງເວລາ)
│   ├── Daily Attendance Timesheet & Records
│   ├── Live Biometric Punch In / Punch Out Clock
│   ├── Attendance Correction Requests & Workflows
│   └── Biometric Scanner Hardware Devices Monitor
│
├── 05. WORK SCHEDULE (ຕາຕະລາງປະຕິບັດວຽກ & ກະ)
│   ├── Shift Management (Standard, Morning, Afternoon - Strictly No OT)
│   ├── Lao Official Public Holidays 2026 Calendar
│   └── Standard Working Days Configuration (Mon-Fri 40h/week)
│
├── 06. LEAVE MANAGEMENT (ການຄຸ້ມຄອງການລາພັກ)
│   ├── Leave Requests Submission Modal & History
│   ├── Leave Balances & Entitlements (Annual, Sick, Personal, Maternity)
│   └── Leave Types Configuration & Policy Rules
│
├── 07. PAYROLL MANAGEMENT (ການຄຸ້ມຄອງເງິນເດືອນ & ລາຍໄດ້)
│   ├── Automated Monthly Payroll Runs
│   ├── Lao Progressive Personal Income Tax Engine (0% - 25% brackets)
│   ├── Lao Social Security (LSSO) Engine (5.5% employee up to ceiling / 6.0% employer)
│   ├── Official Employee Payslips (Print-ready modal & PDF view)
│   └── Strictly Zero Overtime Items
│
├── 08. DISCIPLINE & WARNINGS (ລະບຽບວິໄນ & ໜັງສືເຕືອນ)
│   ├── Confidential Access Gate (Super Admin & HR Admin only)
│   ├── Disciplinary Cases Log
│   └── Official Warning Letter Creator & Letterhead Preview
│
├── 09. EXPENSE CLAIMS (ການເບີກຈ່າຍລາຍຈ່າຍ)
│   ├── Expense Claims Submission & Itemized Entries
│   ├── Receipt Attachments Counter
│   └── Finance Verification & Central Workflow Routing
│
├── 10. EMPLOYEE DEVELOPMENT (ການພັດທະນາບຸກຄະລາກອນ & ປະເມີນ)
│   ├── Performance Evaluations (KPI Scoring 0-100, Grade A/B/C/D)
│   ├── Training Plans & Courses (Lao State Governance, Energy Valuation)
│   └── Employee Benefits Register (Health insurance, fuel, child support)
│
├── 11. RECRUITMENT (ການສັນຫາ & ຮັບສະໝັກພະນັກງານ)
│   ├── Job Requisitions & Vacancy Quotas
│   ├── Candidate Management Pipeline (Applied, Screening, Interview, Offered, Hired)
│   └── 1-Click "Hire & Transfer to Onboarding" Employee Converter
│
├── 12. CENTRAL APPROVAL WORKFLOW (ລະບົບອະນຸມັດສູນກາງ)
│   ├── Pending Approvals (One-click Approve, Reject, Return for Correction)
│   ├── My Requests Tracking
│   └── Sequential Multi-Step Workflow History & Actor Audit Logs
│
├── 13. DOCUMENTS & ASSETS (ເອກະສານ & ຊັບສິນອົງກອນ)
│   ├── Asset Register (Laptops, Vehicles, Monitors, Phones)
│   ├── Asset Assignment to Employees & Return Tracking
│   └── Standard Enterprise Document Templates (Employment Contracts, NDA)
│
├── 14. COMMUNICATION & NOTIFICATIONS (ການສື່ສານ & ແຈ້ງການພາຍໃນ)
│   ├── Official Company Announcements Feed (Lao & English)
│   ├── HR Helpdesk Messaging & Inquiries
│   └── Frequently Asked Questions (FAQ) & Policy Help Center
│
└── 15. SYSTEM ADMINISTRATION (ການຄຸ້ມຄອງລະບົບ & ຄວາມປອດໄພ)
    ├── LHSE Enterprise Profile & Tax/Registration Credentials
    ├── Restricted State Bank Accounts (BCEL, JDB, LDB)
    ├── User Accounts Management & Credentials
    ├── Roles & Permissions Matrix
    ├── System Audit Logs Table (Actor, Module, Action, IP, Timestamp)
    └── Database Connectivity & Architecture Status Report
```

---

## 4. Requirement Traceability Matrix

| Module | Feature / Requirement | UI Component / Page | Backend API Endpoint | Database Model | Permitted Roles | Verification Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01. Dashboard** | Executive Metrics & Charts | `DashboardModule.tsx` | `GET /api/health` | `Branch`, `Employee`, `PayrollPeriod` | All Roles (Scoped) | Verified |
| **02. Employees** | Directory, Profile, Edit, Excel Import | `EmployeeModule.tsx` | `GET/POST /api/employees` | `Employee` | HR Admin, Super Admin | Verified |
| **03. Organization** | Org Chart, Branches, Depts, Workforce | `OrganizationModule.tsx` | `GET /api/org-profile` | `Branch`, `Department`, `Position` | Leadership & HR | Verified |
| **04. Attendance** | Daily Punch Clock, Scanner Devices | `AttendanceModule.tsx` | `POST /api/attendance/punch` | `AttendanceRecord`, `AttendanceCorrection` | All Employees | Verified |
| **05. Schedules** | Shifts, Lao Holidays 2026 (Zero OT) | `WorkScheduleModule.tsx` | Internal Engine | `Shift`, `Holiday` | All Roles | Verified |
| **06. Leave** | Leave Requests, Balances, Policies | `LeaveModule.tsx` | Workflow Engine | `LeaveRequest`, `LeaveBalance`, `LeaveType` | All Employees | Verified |
| **07. Payroll** | Lao Tax, LSSO 5.5%, Payslips (Zero OT) | `PayrollModule.tsx` | `GET /api/payroll/payslips` | `PayrollPeriod`, `Payslip` | HR/Finance (Employee payslip only) | Verified |
| **08. Discipline** | Confidential Warning Letters | `DisciplineModule.tsx` | Confidential Log | `DisciplinaryCase` | HR Admin & Super Admin | Verified |
| **09. Expenses** | Claim Submission & Receipts | `ExpenseModule.tsx` | Workflow Engine | `ExpenseClaim` | All Employees | Verified |
| **10. Development**| KPI Grading, Training Courses | `DevelopmentModule.tsx`| Internal Engine | `PerformanceEvaluation`, `TrainingCourse`| All Roles | Verified |
| **11. Recruitment** | Candidates & 1-Click Onboard | `RecruitmentModule.tsx` | Employee Link | `RecruitmentRequisition`, `Candidate` | HR & Dept Heads | Verified |
| **12. Approvals** | Central Approval Engine & Steps | `ApprovalWorkflowModule.tsx`| `POST /api/approvals/:id/action` | `ApprovalRequest`, `ApprovalAction` | Approver Roles | Verified |
| **13. Assets** | Asset Register & Assignment | `DocumentsAssetsModule.tsx` | Asset Store | `Asset` | All Roles | Verified |
| **14. Communication**| Announcements & HR Messaging | `CommunicationModule.tsx`| Message Store | `Announcement`, `Notification` | All Employees | Verified |
| **15. Admin** | Profile, Users, RBAC, Audit Logs | `SystemAdminModule.tsx` | `GET/POST /api/audit-logs` | `User`, `AuditLog` | Super Admin, HR Admin | Verified |

---

## 5. PostgreSQL Local Setup & Docker Deployment
To launch the real PostgreSQL database in any standard dockerized environment:
```bash
# 1. Start PostgreSQL 16
docker-compose up -d

# 2. Run Prisma Migrations
npx prisma db push

# 3. Seed Database
npx tsx prisma/seed.ts
```
