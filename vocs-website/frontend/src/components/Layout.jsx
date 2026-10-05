import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, Bell, Settings, LayoutDashboard, Box, Database, Wind, BookOpen,
  X, AlertCircle, Volume2, VolumeX, ShieldAlert, AlertTriangle, Info
} from 'lucide-react';
import {
  isSoundEnabled, toggleSoundEnabled, triggerAlertSound
} from '../utils/soundAlert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Layout({ children }) {
  const location = useLocation();
  const [showMockBanner, setShowMockBanner] = useState(false);
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [toastAlert, setToastAlert] = useState(null);

  const seenAlertIds = useRef(new Set());
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (window.__VOC_MOCK_MODE && !sessionStorage.getItem('voc_mock_banner_dismissed')) {
      setShowMockBanner(true);
    }
  }, []);

  function dismissBanner() {
    sessionStorage.setItem('voc_mock_banner_dismissed', '1');
    setShowMockBanner(false);
  }

  // ซิงค์สถานะเสียงเมื่อมีการเปิด/ปิดจากหน้าอื่น
  useEffect(() => {
    const handleSoundToggle = (e) => {
      setSoundActive(e.detail.enabled);
    };
    window.addEventListener('voc_sound_toggle', handleSoundToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleSoundToggle);
  }, []);

  // Background Poller ตรวจสอบ Alert ใหม่และเล่นเสียงแจ้งเตือน
  useEffect(() => {
    let timerId;
    async function checkAlerts() {
      try {
        const res = await fetch(`${API}/api/alerts?limit=15`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const activeList = data.filter(a => a.status === 'Active');
        setActiveAlertsCount(activeList.length);

        if (isFirstRun.current) {
          // โหลดรอบแรก: บันทึก id ที่มีอยู่เดิมไว้เพื่อไม่ให้ส่งเสียงดังรบกวนตอนเปิดหน้าเว็บ
          activeList.forEach(a => seenAlertIds.current.add(a.id));
          isFirstRun.current = false;
        } else {
          // ตรวจหา Alert ใหม่ที่ยังไม่เคยพบ
          const newAlerts = activeList.filter(a => !seenAlertIds.current.has(a.id));
          if (newAlerts.length > 0) {
            // เลือก Alert ระดับสูงสุดเพื่อเล่นเสียงและแสดง Pop-up Toast
            const priorityAlert = newAlerts.find(a => a.level === 'Critical')
              || newAlerts.find(a => a.level === 'High')
              || newAlerts[0];

            newAlerts.forEach(a => seenAlertIds.current.add(a.id));
            triggerAlertSound(priorityAlert.level);
            setToastAlert(priorityAlert);
          }
        }
      } catch {
        // เงียบไว้หาก backend ยังไม่พร้อม
      }
    }

    checkAlerts();
    timerId = setInterval(checkAlerts, 6000);
    return () => clearInterval(timerId);
  }, []);

  // ปิด Toast อัตโนมัติหลัง 6 วินาที
  useEffect(() => {
    if (!toastAlert) return;
    const t = setTimeout(() => setToastAlert(null), 6000);
    return () => clearTimeout(t);
  }, [toastAlert]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginLeft: 'auto' }}>
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

            {/* ปุ่มเปิด/ปิดเสียงแจ้งเตือน */}
            <button
              onClick={() => {
                const next = toggleSoundEnabled();
                setSoundActive(next);
              }}
              title={soundActive ? 'คลิกเพื่อปิดเสียงแจ้งเตือน' : 'คลิกเพื่อเปิดเสียงแจ้งเตือน'}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.42rem 0.8rem', borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: soundActive ? '#f0fdf4' : '#f8fafc',
                color: soundActive ? '#15803d' : '#64748b',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              {soundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span>{soundActive ? 'เสียงเปิด' : 'เสียงปิด'}</span>
            </button>

            {/* ปุ่มไอคอนกระดิ่ง Alerts พร้อม Badge */}
            <Link
              to="/alerts"
              title="ดูรายการแจ้งเตือนทั้งหมด"
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '0.5rem',
                border: '1px solid var(--border-color)', backgroundColor: 'white',
                color: activeAlertsCount > 0 ? '#ef4444' : '#64748b',
                textDecoration: 'none', transition: 'all 0.2s',
              }}
            >
              <Bell size={18} />
              {activeAlertsCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  backgroundColor: '#ef4444', color: 'white',
                  fontSize: '0.65rem', fontWeight: 800, borderRadius: '999px',
                  padding: '0.1rem 0.35rem', minWidth: 16, textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                }}>
                  {activeAlertsCount}
                </span>
              )}
            </Link>

            {/* User Profile */}
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
              <span>Admin User</span>
            </div>
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

        {/* ── Floating Toast Alert Notification ── */}
        {toastAlert && (
          <div style={{
            position: 'fixed',
            top: '1.25rem',
            right: '1.25rem',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'white',
            border: `2px solid ${
              toastAlert.level === 'Critical' ? '#ef4444' :
              toastAlert.level === 'High' ? '#f59e0b' : '#3b82f6'
            }`,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxWidth: '420px',
            animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            <div style={{
              color: toastAlert.level === 'Critical' ? '#dc2626' : toastAlert.level === 'High' ? '#d97706' : '#2563eb',
              flexShrink: 0,
              marginTop: '0.15rem',
            }}>
              {toastAlert.level === 'Critical' ? <ShieldAlert size={22} /> :
               toastAlert.level === 'High' ? <AlertTriangle size={22} /> : <Info size={22} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: toastAlert.level === 'Critical' ? '#fee2e2' : toastAlert.level === 'High' ? '#fef3c7' : '#dbeafe',
                  color: toastAlert.level === 'Critical' ? '#991b1b' : toastAlert.level === 'High' ? '#92400e' : '#1e40af',
                }}>
                  {toastAlert.level} Alert
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{toastAlert.time || 'เมื่อสักครู่'}</span>
              </div>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#1e293b', fontWeight: 600 }}>
                {toastAlert.message}
              </p>
              <Link
                to="/alerts"
                onClick={() => setToastAlert(null)}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--primary-color)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                ดูรายละเอียดที่หน้า Alerts →
              </Link>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              title="ปิด"
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '0.2rem',
                borderRadius: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="page-content">
          {children}
        </div>
      </main>

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
