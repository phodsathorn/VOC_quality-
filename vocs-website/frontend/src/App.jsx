import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardSkeleton from './components/DashboardSkeleton';

// Code-split route components with React.lazy
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Devices = lazy(() => import('./pages/Devices'));
const DataCollection = lazy(() => import('./pages/DataCollection'));
const Alerts = lazy(() => import('./pages/Alerts'));
const AirflowDiagram = lazy(() => import('./pages/AirflowDiagram'));
const Settings = lazy(() => import('./pages/Settings'));
const Guide = lazy(() => import('./pages/Guide'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const History = lazy(() => import('./pages/History'));
const Kiosk = lazy(() => import('./pages/Kiosk'));
const EmissionsReport = lazy(() => import('./pages/EmissionsReport'));
const AirQualityGuide = lazy(() => import('./pages/AirQualityGuide'));
const Roles = lazy(() => import('./pages/Roles'));
const SystemStates = lazy(() => import('./pages/SystemStates'));

// RBAC Guard Component สำหรับป้องกันเส้นทาง URL โดยตรง
function RoleProtectedRoute({ allowedRoles, children, fallback = "/" }) {
  const { user } = useAuth();
  const userRole = user?.role || 'operator';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}

function AppContent() {
  const { token, user } = useAuth();

  // หากยังไม่ได้ล็อกอิน ให้แสดงหน้า Login สวยงามมาตรฐานทันที (0ms Cold-Start Delay)
  if (!token || !user) {
    return <LoginPage />;
  }

  const role = user.role || 'operator';

  return (
    <Layout>
      <Suspense fallback={<DashboardSkeleton />}>
        <Routes>
          {/* หน้าที่ทุกบทบาทเข้าถึงได้ */}
          <Route path="/"                   element={<Dashboard />} />
          <Route path="/air-quality-guide"  element={<AirQualityGuide />} />
          <Route path="/aqi-info"           element={<Navigate to="/air-quality-guide" replace />} />
          <Route path="/airflow"            element={<AirflowDiagram />} />
          <Route path="/guide"              element={<Guide />} />
          <Route path="/roles"              element={<Roles />} />
          <Route path="/system-states"      element={<SystemStates />} />

          {/* หน้าสำหรับ Operator, Engineer, Admin */}
          <Route path="/kiosk" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer', 'operator']}>
              <Kiosk />
            </RoleProtectedRoute>
          } />
          <Route path="/alerts" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer', 'operator']}>
              <Alerts />
            </RoleProtectedRoute>
          } />

          {/* หน้าสำหรับ Viewer, Operator, Engineer, Admin */}
          <Route path="/history" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer', 'operator', 'viewer']}>
              <History />
            </RoleProtectedRoute>
          } />
          <Route path="/emissions" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer', 'operator', 'viewer']}>
              <EmissionsReport />
            </RoleProtectedRoute>
          } />

          {/* หน้าสำหรับ Engineer, Admin */}
          <Route path="/maintenance" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer']}>
              <Maintenance />
            </RoleProtectedRoute>
          } />
          <Route path="/devices" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer']}>
              <Devices />
            </RoleProtectedRoute>
          } />
          <Route path="/data-collection" element={
            <RoleProtectedRoute allowedRoles={['admin', 'engineer']}>
              <DataCollection />
            </RoleProtectedRoute>
          } />

          {/* หน้าเฉพาะ Admin เท่านั้น */}
          <Route path="/settings" element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </RoleProtectedRoute>
          } />

          {/* Fallback เมื่อพิมพ์ URL ที่ไม่มีหรือไม่มีสิทธิ์ */}
          <Route path="*" element={<Navigate to={role === 'operator' ? '/kiosk' : '/'} replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
