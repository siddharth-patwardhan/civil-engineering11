/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './features/auth/AuthProvider';
import { AppBootstrap } from './features/app/AppBootstrap';
import { AppShell } from './components/AppShell';
import { AppErrorFallback } from './components/ErrorBoundary';
import { ProjectScopedLayout } from './features/project/ProjectScopedLayout';
import { LegacyOrScopedPage } from './features/project/LegacyProjectRedirect';
import './styles/design-system.css';

import Dashboard from './pages/DashboardNew';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProjectNew';
import Measurements from './pages/MeasurementNew';
import BOQ from './pages/BOQNew';
import RateAnalysis from './pages/RateAnalysis';
import Materials from './pages/Materials';
import Labour from './pages/Labour';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignInSetup from './pages/SignInSetup';
import Assistant from './pages/Assistant';
import { SetupGuard } from './features/auth/SetupGuard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback} onReset={() => window.location.reload()}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProjectProvider>
          <AppBootstrap />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<SignInSetup />} />
              <Route element={<SetupGuard />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/create-project" element={<CreateProject />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/alerts" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />

                {/* Legacy flat paths — redirect to scoped URL when project is active */}
                <Route path="/measurement" element={<LegacyOrScopedPage page="measurement"><Measurements /></LegacyOrScopedPage>} />
                <Route path="/boq" element={<LegacyOrScopedPage page="boq"><BOQ /></LegacyOrScopedPage>} />
                <Route path="/rates" element={<LegacyOrScopedPage page="rates"><RateAnalysis /></LegacyOrScopedPage>} />
                <Route path="/materials" element={<LegacyOrScopedPage page="materials"><Materials /></LegacyOrScopedPage>} />
                <Route path="/labour" element={<LegacyOrScopedPage page="labour"><Labour /></LegacyOrScopedPage>} />
                <Route path="/reports" element={<LegacyOrScopedPage page="reports"><Reports /></LegacyOrScopedPage>} />

                {/* Project-scoped deep links */}
                <Route path="/projects/:projectId" element={<ProjectScopedLayout />}>
                  <Route path="measurement" element={<Measurements />} />
                  <Route path="boq" element={<BOQ />} />
                  <Route path="rates" element={<RateAnalysis />} />
                  <Route path="materials" element={<Materials />} />
                  <Route path="labour" element={<Labour />} />
                  <Route path="reports" element={<Reports />} />
                </Route>
              </Route>
              </Route>
            </Routes>
          </Router>
        </ProjectProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
