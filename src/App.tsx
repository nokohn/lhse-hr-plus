import React, { useState } from 'react';
import { I18nProvider } from './i18n/I18nProvider.tsx';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { BreadcrumbNav } from './components/layout/BreadcrumbNav.tsx';

// 15 Modules
import { DashboardModule } from './pages/DashboardModule.tsx';
import { EmployeeModule } from './pages/EmployeeModule.tsx';
import { OrganizationModule } from './pages/OrganizationModule.tsx';
import { AttendanceModule } from './pages/AttendanceModule.tsx';
import { WorkScheduleModule } from './pages/WorkScheduleModule.tsx';
import { LeaveModule } from './pages/LeaveModule.tsx';
import { PayrollModule } from './pages/PayrollModule.tsx';
import { DisciplineModule } from './pages/DisciplineModule.tsx';
import { ExpenseModule } from './pages/ExpenseModule.tsx';
import { DevelopmentModule } from './pages/DevelopmentModule.tsx';
import { RecruitmentModule } from './pages/RecruitmentModule.tsx';
import { ApprovalWorkflowModule } from './pages/ApprovalWorkflowModule.tsx';
import { DocumentsAssetsModule } from './pages/DocumentsAssetsModule.tsx';
import { CommunicationModule } from './pages/CommunicationModule.tsx';
import { SystemAdminModule } from './pages/SystemAdminModule.tsx';
import { UserManagementModule } from './pages/UserManagementModule.tsx';
import { LoginPage } from './pages/LoginPage.tsx';

function MainLayout() {
  const { activeModule } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'module-1':
        return <DashboardModule />;
      case 'module-2':
        return <EmployeeModule />;
      case 'module-3':
        return <OrganizationModule />;
      case 'module-4':
        return <AttendanceModule />;
      case 'module-5':
        return <WorkScheduleModule />;
      case 'module-6':
        return <LeaveModule />;
      case 'module-7':
        return <PayrollModule />;
      case 'module-8':
        return <DisciplineModule />;
      case 'module-9':
        return <ExpenseModule />;
      case 'module-10':
        return <DevelopmentModule />;
      case 'module-11':
        return <RecruitmentModule />;
      case 'module-12':
        return <ApprovalWorkflowModule />;
      case 'module-13':
        return <DocumentsAssetsModule />;
      case 'module-14':
        return <CommunicationModule />;
      case 'module-15':
        return <SystemAdminModule />;
      case 'module-16':
        return <UserManagementModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col">
        <Header collapsed={collapsed} setMobileOpen={setMobileOpen} />
        <BreadcrumbNav collapsed={collapsed} />
        <main
          className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${
            collapsed ? 'lg:pl-24' : 'lg:pl-76'
          }`}
        >
          <div className="max-w-7xl mx-auto">{renderModule()}</div>
        </main>
      </div>
    </div>
  );
}

function RootApp() {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <RootApp />
      </AppProvider>
    </I18nProvider>
  );
}
