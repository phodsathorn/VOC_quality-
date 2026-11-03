import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, Bell, Settings, LayoutDashboard, Box, Database, Wind, BookOpen, CalendarDays,
  X, AlertCircle, Volume2, VolumeX, ShieldAlert, AlertTriangle, Info, Wrench,
  User, LogOut, Key, ShieldCheck, CheckCircle, Monitor, Factory
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  isSoundEnabled, toggleSoundEnabled, triggerAlertSound
} from '../utils/soundAlert';

import { API } from '../config';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, token, login, logout, isAuthenticated, hasRole } = useAuth();
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [toastAlert, setToastAlert] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const seenAlertIds = useRef(new Set());
  const isFirstRun = useRef(true);

  // Auto-login to Admin as default for development demo if not logged in
  useEffect(() => {
    if (!user && !localStorage.getItem('voc_user_info')) {
      login('admin', 'Admin@Voc2026!');
    }
  }, []);

  async function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const res = await login(loginUsername, loginPassword);
    setLoginLoading(false);
    if (res.success) {
      setShowLoginModal(false);
    } else {
      setLoginError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  }

  function handleQuickLogin(role) {
    const passwords = {
      admin: 'Admin@Voc2026!',
      engineer: 'Engineer@Voc2026!',
      operator: 'Operator@Voc2026!',
      viewer: 'Viewer@Voc2026!'
    };
    login(role, passwords[role]).then(() => {
      setShowLoginModal(false);
      setShowUserMenu(false);
    });
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
    { name: 'ประวัติอากาศ',    path: '/history',         icon: <CalendarDays size={20} /> },
    { name: 'Devices',         path: '/devices',        icon: <Box size={20} /> },
    { name: 'Data Collection', path: '/data-collection',icon: <Database size={20} /> },
    { name: 'Airflow Diagram', path: '/airflow',        icon: <Wind size={20} /> },
    { name: 'Maintenance',     path: '/maintenance',    icon: <Wrench size={20} /> },
    { name: 'Kiosk หน้างาน',    path: '/kiosk',          icon: <Monitor size={20} /> },
    { name: 'รายงานมลพิษ',      path: '/emissions',      icon: <Factory size={20} /> },
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

            {/* User Profile & Role Indicator (Phase W1) */}
            {isAuthenticated ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '0.35rem 0.65rem', borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)', backgroundColor: 'white',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: user.role === 'admin' ? '#7c3aed' :
                                     user.role === 'engineer' ? '#2563eb' :
                                     user.role === 'operator' ? '#059669' : '#64748b',
                    color: 'white', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user.full_name || user.username}</div>
                    <span style={{
                      display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
                      textTransform: 'uppercase', padding: '0.05rem 0.35rem', borderRadius: '4px',
                      backgroundColor: user.role === 'admin' ? '#f5f3ff' :
                                       user.role === 'engineer' ? '#eff6ff' :
                                       user.role === 'operator' ? '#ecfdf5' : '#f1f5f9',
                      color: user.role === 'admin' ? '#7c3aed' :
                             user.role === 'engineer' ? '#2563eb' :
                             user.role === 'operator' ? '#059669' : '#64748b',
                    }}>
                      {user.role}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '240px', backgroundColor: 'white', borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid var(--border-color)',
                    padding: '0.75rem', zIndex: 1000,
                  }}>
                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username} • {user.site}</div>
                    </div>

                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                      สลับบทบาททดสอบ (Quick Switch Role):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      <button
                        onClick={() => handleQuickLogin('admin')}
                        style={{
                          padding: '0.3rem', fontSize: '0.72rem', borderRadius: '4px',
                          border: user.role === 'admin' ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
                          backgroundColor: user.role === 'admin' ? '#f5f3ff' : '#fafafa',
                          fontWeight: 600, color: '#7c3aed', cursor: 'pointer',
                        }}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => handleQuickLogin('engineer')}
                        style={{
                          padding: '0.3rem', fontSize: '0.72rem', borderRadius: '4px',
                          border: user.role === 'engineer' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          backgroundColor: user.role === 'engineer' ? '#eff6ff' : '#fafafa',
                          fontWeight: 600, color: '#2563eb', cursor: 'pointer',
                        }}
                      >
                        Engineer
                      </button>
                      <button
                        onClick={() => handleQuickLogin('operator')}
                        style={{
                          padding: '0.3rem', fontSize: '0.72rem', borderRadius: '4px',
                          border: user.role === 'operator' ? '1.5px solid #059669' : '1px solid #e2e8f0',
                          backgroundColor: user.role === 'operator' ? '#ecfdf5' : '#fafafa',
                          fontWeight: 600, color: '#059669', cursor: 'pointer',
                        }}
                      >
                        Operator
                      </button>
                      <button
                        onClick={() => handleQuickLogin('viewer')}
                        style={{
                          padding: '0.3rem', fontSize: '0.72rem', borderRadius: '4px',
                          border: user.role === 'viewer' ? '1.5px solid #64748b' : '1px solid #e2e8f0',
                          backgroundColor: user.role === 'viewer' ? '#f1f5f9' : '#fafafa',
                          fontWeight: 600, color: '#64748b', cursor: 'pointer',
                        }}
                      >
                        Viewer
                      </button>
                    </div>

                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.45rem', borderRadius: '4px', border: '1px solid #fee2e2',
                        backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.78rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <LogOut size={14} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.42rem 0.9rem', borderRadius: '0.5rem',
                  backgroundColor: '#0f172a', color: 'white',
                  border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                }}
              >
                <User size={15} /> เข้าสู่ระบบ
              </button>
            )}
          </div>
        </header>

        {/* ── Login Modal Dialog (Phase W1) ── */}
        {showLoginModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999, backdropFilter: 'blur(3px)',
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '0.75rem', width: '100%', maxWidth: '380px',
              padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>🔐 เข้าสู่ระบบ (Phase W1 Auth)</h3>
                <button
                  onClick={() => setShowLoginModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              {loginError && (
                <div style={{
                  padding: '0.5rem 0.75rem', borderRadius: '0.4rem', backgroundColor: '#fee2e2',
                  color: '#dc2626', fontSize: '0.8rem', marginBottom: '1rem',
                }}>
                  ⚠ {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="เช่น admin, engineer, operator, viewer"
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.4rem',
                      border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="รหัสผ่าน"
                    style={{
                      width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.4rem',
                      border: '1px solid #cbd5e1', fontSize: '0.875rem', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  style={{
                    width: '100%', padding: '0.6rem', borderRadius: '0.4rem',
                    backgroundColor: '#0f172a', color: 'white', border: 'none',
                    fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1rem',
                  }}
                >
                  {loginLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textAlign: 'center' }}>
                  หรือเลือกบทบาททดสอบ (Quick Login):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleQuickLogin('admin')}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, color: '#7c3aed', background: '#f5f3ff' }}
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => handleQuickLogin('engineer')}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, color: '#2563eb', background: '#eff6ff' }}
                  >
                    Engineer
                  </button>
                  <button
                    onClick={() => handleQuickLogin('operator')}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, color: '#059669', background: '#ecfdf5' }}
                  >
                    Operator
                  </button>
                  <button
                    onClick={() => handleQuickLogin('viewer')}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, color: '#64748b', background: '#f1f5f9' }}
                  >
                    Viewer
                  </button>
                </div>
              </div>
            </div>
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
