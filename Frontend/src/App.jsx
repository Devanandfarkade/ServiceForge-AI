import React from 'react';
import { RouterProvider, useRouter, matchRoute } from './lib/router';
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

function RouterSwitch() {
  const { path } = useRouter();

  // Route matching
  if (path === '/' || path === '/dashboard') {
    return <DashboardPage />;
  }

  if (path === '/requests/new') {
    return <CreateServiceRequestPage />;
  }

  const requestDetailParams = matchRoute('/requests/:id', path);
  if (requestDetailParams) {
    return <ServiceRequestDetailPage id={requestDetailParams.id} />;
  }

  if (path === '/requests') {
    return <ServiceRequestsPage />;
  }

  const jobDetailParams = matchRoute('/jobs/:id', path);
  if (jobDetailParams) {
    return <ServiceJobDetailPage id={jobDetailParams.id} />;
  }

  if (path === '/jobs') {
    return <ServiceJobsPage />;
  }

  const techDetailParams = matchRoute('/technicians/:id', path);
  if (techDetailParams) {
    return <TechnicianDetailPage id={techDetailParams.id} />;
  }

  if (path === '/technicians') {
    return <TechniciansPage />;
  }

  if (path === '/customers') {
    return <CustomersPage />;
  }

  if (path === '/assets') {
    return <AssetsPage />;
  }

  if (path === '/reports') {
    return <ReportsPage />;
  }

  if (path === '/settings') {
    return <SettingsPage />;
  }

  // Fallback to Dashboard
  return <DashboardPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <AppLayout>
        <RouterSwitch />
      </AppLayout>
    </RouterProvider>
  );
}
