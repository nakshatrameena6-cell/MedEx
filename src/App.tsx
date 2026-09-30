import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthRoleProvider } from './context/AuthRoleContext';
import { AppLayout } from './components/layout/AppLayout';
import { CaptureView } from './views/CaptureView';
import { MapView } from './views/MapView';
import { RiskView } from './views/RiskView';
import { ForecastView } from './views/ForecastView';
import { TransferView } from './views/TransferView';
import { FederationView } from './views/FederationView';
import { ScenarioView } from './views/ScenarioView';
import { AlertsView } from './views/AlertsView';
import { AuditView } from './views/AuditView';

export const App: React.FC = () => {
  return (
    <AuthRoleProvider>
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
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthRoleProvider>
  );
};

export default App;
