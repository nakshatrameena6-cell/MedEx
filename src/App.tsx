import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthRoleProvider } from './context/AuthRoleContext';
import { ThemeProvider } from './context/ThemeContext';
import { DevModeProvider } from './context/DevModeContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
const CaptureView = lazy(() => import('./views/CaptureView').then((m) => ({ default: m.CaptureView })));
const MapView = lazy(() => import('./views/MapView').then((m) => ({ default: m.MapView })));
const RiskView = lazy(() => import('./views/RiskView').then((m) => ({ default: m.RiskView })));
const ForecastView = lazy(() => import('./views/ForecastView').then((m) => ({ default: m.ForecastView })));
const TransferView = lazy(() => import('./views/TransferView').then((m) => ({ default: m.TransferView })));
const FederationView = lazy(() => import('./views/FederationView').then((m) => ({ default: m.FederationView })));
const ScenarioView = lazy(() => import('./views/ScenarioView').then((m) => ({ default: m.ScenarioView })));
const AlertsView = lazy(() => import('./views/AlertsView').then((m) => ({ default: m.AlertsView })));
const AuditView = lazy(() => import('./views/AuditView').then((m) => ({ default: m.AuditView })));
const StyleGuideView = lazy(() => import('./views/StyleGuideView').then((m) => ({ default: m.StyleGuideView })));

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <DevModeProvider>
        <AuthRoleProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/map" replace />} />
                  <Route path="capture" element={<CaptureView />} />
                  <Route path="map" element={<MapView />} />
                  <Route path="risk" element={<RiskView />} />
                  <Route path="forecast" element={<ForecastView />} />
                  <Route path="transfers" element={<TransferView />} />
                  <Route path="federation" element={<FederationView />} />
                  <Route path="scenario" element={<ScenarioView />} />
                  <Route path="alerts" element={<AlertsView />} />
                  <Route path="audit" element={<AuditView />} />
                  <Route path="design-system" element={<StyleGuideView />} />
                  <Route path="*" element={<Navigate to="/map" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthRoleProvider>
      </DevModeProvider>
    </ThemeProvider>
  );
};

export default App;
