import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import DataCollection from './pages/DataCollection';
import Alerts from './pages/Alerts';
import AirflowDiagram from './pages/AirflowDiagram';
import Settings from './pages/Settings';
import Guide from './pages/Guide';
import Maintenance from './pages/Maintenance';
import History from './pages/History';
import Kiosk from './pages/Kiosk';
import EmissionsReport from './pages/EmissionsReport';
import AirQualityGuide from './pages/AirQualityGuide';
import Roles from './pages/Roles';
import SystemStates from './pages/SystemStates';

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
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
