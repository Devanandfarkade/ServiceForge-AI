import React from 'react';
import { RouterProvider, useRouter, matchRoute } from './lib/router';
import { ThemeProvider } from './lib/theme';
import { NotificationProvider } from './lib/notifications';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { AppLayout } from './layouts/AppLayout';

import { DashboardPage } from './pages/DashboardPage';
import { ServiceRequestsPage } from './pages/ServiceRequestsPage';
import { CreateServiceRequestPage } from './pages/CreateServiceRequestPage';
import { ServiceRequestDetailPage } from './pages/ServiceRequestDetailPage';
import { ServiceJobsPage } from './pages/ServiceJobsPage';
import { ServiceJobDetailPage } from './pages/ServiceJobDetailPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { TechnicianDetailPage } from './pages/TechnicianDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { AssetsPage } from './pages/AssetsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';

/**
 * RouterSwitch — only rendered when user is authenticated.
 * AppContent handles the auth gate above this.
 */
function RouterSwitch() {
  const { path } = useRouter();

  if (path === '/' || path === '/dashboard') return <DashboardPage />;
  if (path === '/profile') return <ProfilePage />;
  if (path === '/requests/new') return <CreateServiceRequestPage />;

  const requestDetailParams = matchRoute('/requests/:id', path);
  if (requestDetailParams) return <ServiceRequestDetailPage id={requestDetailParams.id} />;

  if (path === '/requests') return <ServiceRequestsPage />;

  const jobDetailParams = matchRoute('/jobs/:id', path);
  if (jobDetailParams) return <ServiceJobDetailPage id={jobDetailParams.id} />;

  if (path === '/jobs') return <ServiceJobsPage />;

  const techDetailParams = matchRoute('/technicians/:id', path);
  if (techDetailParams) return <TechnicianDetailPage id={techDetailParams.id} />;

  if (path === '/technicians') return <TechniciansPage />;
  if (path === '/customers') return <CustomersPage />;
  if (path === '/assets') return <AssetsPage />;
  if (path === '/reports') return <ReportsPage />;
  if (path === '/settings') return <SettingsPage />;

  return <DashboardPage />;
}

/**
 * AppContent — auth gate.
 * Renders LoginPage (full-screen, no app chrome) when not authenticated.
 * Renders AppLayout + RouterSwitch when authenticated.
 */
function AppContent() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <RouterProvider>
      <AppLayout>
        <RouterSwitch />
      </AppLayout>
    </RouterProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

