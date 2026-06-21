/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectProvider } from './context/ProjectContext';
import { AppBootstrap } from './features/app/AppBootstrap';
import { AppShell } from './components/AppShell';
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
import Assistant from './pages/Assistant';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <AppBootstrap />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/create-project" element={<CreateProject />} />
              <Route path="/measurement" element={<Measurements />} />
              <Route path="/boq" element={<BOQ />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/rates" element={<RateAnalysis />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/labour" element={<Labour />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Router>
      </ProjectProvider>
    </QueryClientProvider>
  );
}
