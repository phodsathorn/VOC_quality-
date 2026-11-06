import { useState, useEffect, useRef, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, Bell, Settings, LayoutDashboard, Box, Database, Wind, BookOpen, CalendarDays,
  X, Volume2, VolumeX, ShieldAlert, AlertTriangle, Info, Wrench,
  User, LogOut, Monitor, Factory, Menu, ShieldCheck, HardHat, FileSearch,
  CheckCircle2, Radio, Layers
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
    { name: 'Dashboard',             path: '/',                icon: LayoutDashboard, roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { name: 'Kiosk',                 path: '/kiosk',           icon: Monitor,         roles: ['admin', 'engineer', 'operator'] },
    { name: 'Alerts',                path: '/alerts',          icon: Bell,            roles: ['admin', 'engineer', 'operator'], badge: activeAlertsCount },
    { name: 'Airflow',               path: '/airflow',         icon: Wind,            roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { name: 'History',               path: '/history',         icon: CalendarDays,    roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { name: 'Maintenance',           path: '/maintenance',     icon: Wrench,          roles: ['admin', 'engineer'] },
    { name: 'Devices',               path: '/devices',         icon: Box,             roles: ['admin', 'engineer'] },
    { name: 'Data Collection',       path: '/data-collection', icon: Database,        roles: ['admin', 'engineer'] },
    { name: 'Settings',              path: '/settings',        icon: Settings,        roles: ['admin'] },
    // MORE Section matching Stitch 1:1
    { name: 'Air Quality Guide',     path: '/air-quality-guide', icon: ShieldAlert,   roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { name: 'Emissions',             path: '/emissions',       icon: Factory,         roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { name: 'User Guide',            path: '/guide',           icon: BookOpen,        roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { name: 'Roles & Policy',        path: '/roles',           icon: ShieldCheck,     roles: ['admin', 'engineer'], isMore: true },
    { name: 'System States',         path: '/system-states',   icon: Layers,          roles: ['admin', 'engineer'], isMore: true },
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

  const renderSidebarContent = (onClose) => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#f1f5f9] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center text-white shadow-sm">
            <Activity size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold tracking-tight text-[#131b2e] leading-tight">
              VOC / E-Nose
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b]">
              Telemetry System
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-[#64748b] hover:bg-[#f1f5f9]"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Role Pill under Brand */}
      <div className="px-4 pt-3 pb-1">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase"
          style={{
            backgroundColor: activeRoleBadge.bg,
            color: activeRoleBadge.color,
            border: `1px solid ${activeRoleBadge.border}`,
          }}
        >
          <RoleIcon size={12} />
          {activeRoleBadge.label}
        </span>
      </div>

      {/* Navigation Items (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-0.5">
        {navItems.map((item, idx) => {
          const prevItem = navItems[idx - 1];
          const showMoreHeader = item.isMore && (!prevItem || !prevItem.isMore);
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Fragment key={item.path}>
              {showMoreHeader && (
                <div className="pt-3 pb-1 px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                    More
                  </span>
                </div>
              )}
              <Link
                to={item.path}
                onClick={onClose ? onClose : undefined}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#e2e7ff] text-[#004ac6] font-semibold shadow-xs'
                    : 'text-[#434655] hover:bg-[#eaedff]/60 hover:text-[#131b2e]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon size={18} className={isActive ? 'text-[#004ac6]' : 'text-[#64748b]'} />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            </Fragment>
          );
        })}
      </nav>

      {/* Bottom User Profile Card */}
      {user && (
        <div className="p-3 border-t border-[#e2e8f0] bg-[#faf8ff] shrink-0">
          <div className="p-2 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-[#131b2e] truncate leading-tight">
                  {user.full_name || user.username}
                </span>
                <span className="text-[10px] text-[#64748b] truncate leading-tight">
                  {user.site || 'Main Plant'} • {user.role}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              title="ออกจากระบบ"
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex">
      {/* Mobile Drawer (Backdrop + Off-canvas panel) */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-[#e2e8f0] z-50 flex flex-col justify-between shadow-2xl lg:hidden animate-fadeIn">
            {renderSidebarContent(() => setMobileMenuOpen(false))}
          </aside>
        </>
      )}

      {/* Desktop Sidebar (In-flow flex child, Sticky, Always takes 240px, NEVER overlaps!) */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#e2e8f0] z-20 shadow-[0_1px_8px_rgba(0,0,0,0.04)] justify-between">
        {renderSidebarContent(null)}
      </aside>

      {/* Main Canvas Viewport (Takes remaining space smoothly) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header Bar (64px) */}
        <header className="sticky top-0 z-10 h-16 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] px-4 md:px-8 flex items-center justify-between shadow-xs">
          {/* Left: Mobile Toggle + Location & Gateway Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#131b2e] hover:bg-[#f1f5f9]"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            {/* Location Pill */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#e2e8f0] shadow-xs">
              <Activity size={16} className="text-[#004ac6]" />
              <span className="text-[13px] font-medium text-[#131b2e]">
                Powder Coating Booth 1
              </span>
            </div>

            {/* Hardware Gateway Online Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]"></span>
              </span>
              <span>ONLINE</span>
            </div>
          </div>

          {/* Right: Sound Toggle + Alert Bell + User Menu */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = toggleSoundEnabled();
                setSoundActive(next);
              }}
              title={soundActive ? 'คลิกเพื่อปิดเสียงแจ้งเตือน' : 'คลิกเพื่อเปิดเสียงแจ้งเตือน'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all ${
                soundActive
                  ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#059669]'
                  : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
              }`}
            >
              {soundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="hidden md:inline">{soundActive ? 'เสียงเปิด' : 'เสียงปิด'}</span>
            </button>

            {/* Alerts Bell */}
            <Link
              to="/alerts"
              title="ดูรายการแจ้งเตือนทั้งหมด"
              className="relative p-2 rounded-xl text-[#64748b] hover:text-[#131b2e] hover:bg-[#f8fafc] border border-[#e2e8f0] transition-colors"
            >
              <Bell size={18} />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {activeAlertsCount}
                </span>
              )}
            </Link>

            {/* User Profile dropdown */}
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#004ac6] text-white flex items-center justify-center text-[12px] font-bold">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline text-[13px] font-medium text-[#131b2e] max-w-[100px] truncate">
                    {user.username}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-[#e2e8f0] shadow-xl p-3 z-50 animate-fadeIn">
                    <div className="pb-2 border-b border-[#f1f5f9] mb-2">
                      <div className="text-[13px] font-semibold text-[#131b2e]">
                        {user.full_name || user.username}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        @{user.username} • {user.role}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-[#ba1a1a] bg-[#ffdad6]/30 hover:bg-[#ffdad6]/60 transition-colors"
                    >
                      <LogOut size={14} /> ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Global Floating Toast Notification ── */}
        {toastAlert && (
          <div
            className="fixed top-20 right-6 z-50 max-w-md w-full bg-white rounded-2xl border-2 shadow-2xl p-4 flex items-start gap-3 animate-slideInRight"
            style={{
              borderColor:
                toastAlert.level === 'Critical'
                  ? '#ba1a1a'
                  : toastAlert.level === 'High'
                  ? '#FF7E00'
                  : '#2563eb',
            }}
          >
            <div
              className="p-2 rounded-xl shrink-0"
              style={{
                backgroundColor:
                  toastAlert.level === 'Critical'
                    ? '#ffdad6'
                    : toastAlert.level === 'High'
                    ? '#ffede6'
                    : '#eaedff',
                color:
                  toastAlert.level === 'Critical'
                    ? '#ba1a1a'
                    : toastAlert.level === 'High'
                    ? '#943700'
                    : '#004ac6',
              }}
            >
              {toastAlert.level === 'Critical' ? (
                <ShieldAlert size={20} />
              ) : toastAlert.level === 'High' ? (
                <AlertTriangle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#eaedff] text-[#004ac6]">
                  {toastAlert.level} ALERT
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {toastAlert.time || 'เมื่อสักครู่'}
                </span>
              </div>
              <p className="text-[13px] font-semibold text-[#131b2e] leading-snug line-clamp-2">
                {toastAlert.message}
              </p>
              <Link
                to="/alerts"
                onClick={() => setToastAlert(null)}
                className="inline-block mt-2 text-[12px] font-semibold text-[#004ac6] hover:underline"
              >
                ดูรายละเอียดที่หน้า Alerts →
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setToastAlert(null)}
              className="text-[#64748b] hover:text-[#131b2e] p-1 rounded-lg"
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Main Page Content Canvas ── */}
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
