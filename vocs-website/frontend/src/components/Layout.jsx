import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, Bell, Settings, LayoutDashboard, Box, Database, Wind, BookOpen, CalendarDays,
  X, Volume2, VolumeX, ShieldAlert, AlertTriangle, Info, Wrench,
  User, LogOut, Monitor, Factory, Menu, ShieldCheck, HardHat, FileSearch
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  isSoundEnabled, toggleSoundEnabled, triggerAlertSound
} from '../utils/soundAlert';

import { API } from '../config';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [toastAlert, setToastAlert] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const seenAlertIds = useRef(new Set());
  const isFirstRun = useRef(true);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
          activeList.forEach(a => seenAlertIds.current.add(a.id));
          isFirstRun.current = false;
        } else {
          const newAlerts = activeList.filter(a => !seenAlertIds.current.has(a.id));
          if (newAlerts.length > 0) {
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

  // สิทธิ์การเข้าถึงแต่ละเมนูตามบทบาท (RBAC Phase W1)
  const userRole = user?.role || 'operator';

  const allNavItems = [
    { name: 'Dashboard',       path: '/',                icon: <LayoutDashboard size={20} />, roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { name: 'Kiosk หน้างาน',    path: '/kiosk',           icon: <Monitor size={20} />,         roles: ['admin', 'engineer', 'operator'] },
    { name: 'Alerts',          path: '/alerts',          icon: <Bell size={20} />,            roles: ['admin', 'engineer', 'operator'] },
    { name: 'Airflow Diagram', path: '/airflow',         icon: <Wind size={20} />,            roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { name: 'ประวัติอากาศ',    path: '/history',         icon: <CalendarDays size={20} />,    roles: ['admin', 'engineer', 'viewer'] },
    { name: 'รายงานมลพิษ',      path: '/emissions',       icon: <Factory size={20} />,         roles: ['admin', 'engineer', 'viewer'] },
    { name: 'Maintenance',     path: '/maintenance',     icon: <Wrench size={20} />,          roles: ['admin', 'engineer'] },
    { name: 'Devices',         path: '/devices',         icon: <Box size={20} />,             roles: ['admin', 'engineer'] },
    { name: 'Data Collection', path: '/data-collection', icon: <Database size={20} />,        roles: ['admin', 'engineer'] },
    { name: 'Settings',        path: '/settings',        icon: <Settings size={20} />,        roles: ['admin'] },
    { name: 'คู่มือการใช้งาน',  path: '/guide',           icon: <BookOpen size={20} />,        roles: ['admin', 'engineer', 'operator', 'viewer'] },
  ];

  // กรองเมนูเฉพาะบทบาทที่ได้รับอนุญาต
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  // ข้อมูลสไตล์บทบาทปัจจุบัน
  const roleBadges = {
    admin:    { label: 'ADMIN VIEW',    bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', icon: ShieldCheck },
    engineer: { label: 'ENGINEER VIEW', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: Wrench },
    operator: { label: 'OPERATOR VIEW', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: HardHat },
    viewer:   { label: 'VIEWER VIEW',   bg: '#f8fafc', color: '#475569', border: '#e2e8f0', icon: FileSearch },
  };
  const activeRoleBadge = roleBadges[userRole] || roleBadges.operator;
  const RoleIcon = activeRoleBadge.icon;

  return (
    <div className="app-container">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '1.25rem 1.25rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(37,99,235,0.25)'
              }}>
                <Activity size={18} color="#ffffff" />
              </div>
              <span>VOC / E-Nose</span>
            </div>
            {mobileMenuOpen && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                aria-label="ปิดเมนู"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Active Role Indicator under Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.04em', padding: '0.2rem 0.55rem', borderRadius: '999px',
              backgroundColor: activeRoleBadge.bg,
              color: activeRoleBadge.color,
              border: `1px solid ${activeRoleBadge.border}`
            }}>
              <RoleIcon size={12} />
              {activeRoleBadge.label}
            </span>
          </div>
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

        {/* Sidebar Footer with current user summary */}
        {user && (
          <div style={{
            marginTop: 'auto',
            padding: '0.85rem 1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#0f172a', display: 'block' }}>{user.full_name || user.username}</strong>
              <span>{user.site || 'Main Plant'}</span>
            </div>
            <button
              onClick={() => logout()}
              title="ออกจากระบบ"
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '0.35rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      <main className="main-content">
        <header className="topbar">
          {/* Mobile Menu Hamburger Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            title="เปิดเมนูนำทาง"
            aria-label="Toggle Navigation Menu"
          >
            <Menu size={22} />
          </button>

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
              <span className="sound-toggle-text">{soundActive ? 'เสียงเปิด' : 'เสียงปิด'}</span>
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

            {/* User Profile & Role Indicator */}
            {user && (
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
                    backgroundColor: activeRoleBadge.color,
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
                      backgroundColor: activeRoleBadge.bg,
                      color: activeRoleBadge.color,
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
                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.65rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username} • {user.site}</div>
                      <span style={{
                        display: 'inline-block', marginTop: '0.3rem',
                        fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                        padding: '0.15rem 0.45rem', borderRadius: '4px',
                        backgroundColor: activeRoleBadge.bg, color: activeRoleBadge.color,
                      }}>
                        {user.role}
                      </span>
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
            )}
          </div>
        </header>

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
