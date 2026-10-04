import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Bell, Settings, LayoutDashboard, Box, Database, Wind, BookOpen, X, AlertCircle } from 'lucide-react';

export default function Layout({ children }) {
  const location = useLocation();
  const [showMockBanner, setShowMockBanner] = useState(false);

  useEffect(() => {
    if (window.__VOC_MOCK_MODE && !sessionStorage.getItem('voc_mock_banner_dismissed')) {
      setShowMockBanner(true);
    }
  }, []);

  function dismissBanner() {
    sessionStorage.setItem('voc_mock_banner_dismissed', '1');
    setShowMockBanner(false);
  }

  const navItems = [
    { name: 'Dashboard',       path: '/',               icon: <LayoutDashboard size={20} /> },
    { name: 'Devices',         path: '/devices',        icon: <Box size={20} /> },
    { name: 'Data Collection', path: '/data-collection',icon: <Database size={20} /> },
    { name: 'Airflow Diagram', path: '/airflow',        icon: <Wind size={20} /> },
    { name: 'Alerts',          path: '/alerts',         icon: <Bell size={20} /> },
    { name: 'คู่มือการใช้งาน',  path: '/guide',          icon: <BookOpen size={20} /> },
    { name: 'Settings',        path: '/settings',       icon: <Settings size={20} /> },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Activity size={24} />
          VOC / E-Nose
        </div>
        <nav className="nav-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {window.__VOC_MOCK_MODE && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 700,
                padding: '0.2rem 0.65rem', borderRadius: '999px',
                backgroundColor: '#fef3c7', color: '#92400e',
                border: '1px solid #fcd34d',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                letterSpacing: '0.03em',
              }}>
                🟡 MOCK MODE
              </span>
            )}
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
            <span>Admin User</span>
          </div>
        </header>

        {/* ── Mock Mode Banner ── */}
        {showMockBanner && (
          <div style={{
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fcd34d',
            padding: '0.65rem 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#92400e', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>ข้อมูลจำลอง (Mock Mode)</strong> — ระบบยังไม่ได้เชื่อมต่อกับ Backend หรือ ESP32 จริง ข้อมูลที่เห็นเป็นการ simulate เท่านั้น
              </span>
              <Link
                to="/guide"
                style={{ color: '#92400e', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}
              >
                ดูคู่มือตั้งค่า →
              </Link>
            </div>
            <button
              onClick={dismissBanner}
              title="ปิดข้อความนี้ (จะกลับมาเมื่อ reload)"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', display: 'flex', alignItems: 'center', padding: '0.2rem', borderRadius: '0.25rem', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
