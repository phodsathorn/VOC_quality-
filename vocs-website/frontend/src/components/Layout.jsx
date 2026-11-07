import { useState, useEffect, useRef, Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity, Bell, Settings, LayoutDashboard, Box, Database, Wind, BookOpen, CalendarDays,
  X, Volume2, VolumeX, ShieldAlert, AlertTriangle, Info, Wrench,
  User, LogOut, Monitor, Factory, Menu, ShieldCheck, HardHat, FileSearch,
  CheckCircle2, Radio, Layers, MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  isSoundEnabled, toggleSoundEnabled, triggerAlertSound
} from '../utils/soundAlert';
import { API } from '../config';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lang, setLang, t, isThai } = useLanguage();
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [criticalBannerAlert, setCriticalBannerAlert] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);

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
        const [res, devRes] = await Promise.all([
          fetch(`${API}/api/alerts?limit=15`).catch(() => null),
          fetch(`${API}/api/devices`).catch(() => null),
        ]);

        if (devRes && devRes.ok) {
          const devs = await devRes.json();
          if (Array.isArray(devs)) {
            const hasOnline = devs.some((d) => (d.status || '').toUpperCase() === 'ONLINE');
            setIsDeviceOnline(hasOnline);
          }
        }

        if (!res || !res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const activeList = data.filter(a => a.status === 'Active');
        setActiveAlertsCount(activeList.length);

        // Update critical alert banner matching Stitch dashboard_2 (only when active alert exists)
        if (activeList.length > 0) {
          const topCritical = activeList.find(a => a.level === 'Critical')
            || activeList.find(a => a.level === 'High')
            || activeList[0];
          setCriticalBannerAlert(topCritical);
        } else {
          setCriticalBannerAlert(null);
        }

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
            setIsBannerDismissed(false); // Reset dismiss for brand new alert
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
    { key: 'dashboard',       name: 'Dashboard',             path: '/',                icon: LayoutDashboard, roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { key: 'kiosk',           name: 'Kiosk',                 path: '/kiosk',           icon: Monitor,         roles: ['admin', 'engineer', 'operator'] },
    { key: 'alerts',          name: 'Alerts',                path: '/alerts',          icon: Bell,            roles: ['admin', 'engineer', 'operator'], badge: activeAlertsCount },
    { key: 'airflow',         name: 'Airflow',               path: '/airflow',         icon: Wind,            roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { key: 'history',         name: 'History',               path: '/history',         icon: CalendarDays,    roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { key: 'maintenance',     name: 'Maintenance',           path: '/maintenance',     icon: Wrench,          roles: ['admin', 'engineer'] },
    { key: 'devices',         name: 'Devices',               path: '/devices',         icon: Box,             roles: ['admin', 'engineer'] },
    { key: 'dataCollection',  name: 'Data Collection',       path: '/data-collection', icon: Database,        roles: ['admin', 'engineer'] },
    { key: 'settings',        name: 'Settings',              path: '/settings',        icon: Settings,        roles: ['admin'] },
    // MORE Section matching Stitch 1:1
    { key: 'airQualityGuide', name: 'Air Quality Guide',     path: '/air-quality-guide', icon: ShieldAlert,   roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { key: 'emissions',       name: 'Emissions',             path: '/emissions',       icon: Factory,         roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { key: 'userGuide',       name: 'User Guide',            path: '/guide',           icon: BookOpen,        roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { key: 'roles',           name: 'Roles & Policy',        path: '/roles',           icon: ShieldCheck,     roles: ['admin', 'engineer'], isMore: true },
    { key: 'systemStates',    name: 'System States',         path: '/system-states',   icon: Layers,          roles: ['admin', 'engineer'], isMore: true },
  ];

  // กรองเมนูเฉพาะบทบาทที่ได้รับอนุญาต
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  // ข้อมูลสไตล์บทบาทปัจจุบัน
  const roleBadges = {
    admin:    { label: t('adminView', 'ADMIN VIEW'),       bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe', icon: ShieldCheck },
    engineer: { label: t('engineerView', 'ENGINEER VIEW'), bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: Wrench },
    operator: { label: t('operatorView', 'OPERATOR VIEW'), bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', icon: HardHat },
    viewer:   { label: t('viewerView', 'VIEWER VIEW'),     bg: '#f8fafc', color: '#475569', border: '#e2e8f0', icon: FileSearch },
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

      {/* Navigation Items (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
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
                    {t('more', 'More')}
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
                  <span className="truncate">{t(item.key, item.name)}</span>
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

      {/* Bottom User Profile Card matching Stitch dashboard_2 1:1 */}
      <div className="p-3 border-t border-[#eaedff] flex items-center justify-between shrink-0 relative">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#004ac6] text-white flex items-center justify-center shrink-0">
            <User size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-[#131b2e] truncate leading-tight">
              {isThai
                ? (user?.full_name === 'System Administrator' ? 'ผู้ดูแลระบบ' : (user?.full_name || 'ผู้ดูแลระบบ'))
                : (user?.full_name || 'System Administrator')}
            </span>
            <span className="text-[11px] text-[#505f76] truncate leading-none mt-0.5">
              {isThai
                ? (user?.role === 'H&S Officer' || user?.role === 'admin' ? 'เจ้าหน้าที่ความปลอดภัย (จป.)' : (user?.role || 'เจ้าหน้าที่ความปลอดภัย (จป.)'))
                : (user?.role || 'H&S Officer')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowUserMenu(prev => !prev)}
          className="text-[#505f76] hover:text-[#131b2e] p-1.5 rounded-lg hover:bg-[#eaedff]/50 transition-colors"
          title="User settings"
        >
          <MoreVertical size={18} />
        </button>

        {/* User Context Dropdown */}
        {showUserMenu && (
          <div className="absolute bottom-14 left-2 right-2 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-3 py-2 border-b border-[#f1f5f9] mb-1">
              <p className="text-[12px] font-semibold text-[#131b2e]">
                {isThai
                  ? (user?.full_name === 'System Administrator' ? 'ผู้ดูแลระบบ' : (user?.full_name || 'E. Mitchell'))
                  : (user?.full_name || 'E. Mitchell')}
              </p>
              <p className="text-[10px] text-[#64748b]">
                {isThai ? 'โรงงานหลัก' : 'Main Plant'} • {isThai ? 'เจ้าหน้าที่ความปลอดภัย (จป.)' : 'H&S Officer'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = toggleSoundEnabled();
                setSoundActive(next);
              }}
              className="w-full px-3 py-2 text-left text-[12px] text-[#131b2e] hover:bg-[#f8fafc] rounded-lg flex items-center justify-between"
            >
              <span>{t('soundNotifications', 'Sound Notifications')}</span>
              {soundActive ? <Volume2 size={15} className="text-[#059669]" /> : <VolumeX size={15} className="text-[#64748b]" />}
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="w-full px-3 py-2 text-left text-[12px] text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-lg flex items-center gap-2 mt-1"
            >
              <LogOut size={15} />
              <span>{t('logout', 'Log out')}</span>
            </button>
          </div>
        )}
      </div>
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
        {/* Top Critical Alert Banner (Only visible when active alert exists, matching Stitch dashboard_2) */}
        {criticalBannerAlert && !isBannerDismissed && (
          <div className="h-8 bg-[#ba1a1a] text-white px-4 md:px-8 flex items-center justify-between text-[12px] font-medium shadow-xs shrink-0 z-30 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle size={15} className="shrink-0 animate-pulse text-white" />
              <span className="truncate">
                {criticalBannerAlert.message || criticalBannerAlert.title || 'TVOC above critical limit in Booth 1'}
              </span>
              <span className="opacity-75 shrink-0">|</span>
              <Link to="/alerts" className="underline font-semibold hover:opacity-90 ml-1 shrink-0">
                {lang === 'TH' ? 'ดูการแจ้งเตือน' : 'View alert'}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setIsBannerDismissed(true)}
              className="hover:opacity-80 flex items-center p-0.5 ml-2 cursor-pointer"
              aria-label="Dismiss alert banner"
            >
              <X size={15} />
            </button>
          </div>
        )}

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
                {t('location', 'Powder Coating Booth 1')}
              </span>
            </div>

            {/* Hardware Gateway Online / Offline Pill */}
            {isDeviceOnline ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]"></span>
                </span>
                <span>{isThai ? 'ออนไลน์' : 'ONLINE'}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fee2e2] text-[#991b1b] text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dc2626]"></span>
                </span>
                <span>{isThai ? 'ออฟไลน์' : 'OFFLINE'}</span>
              </div>
            )}
          </div>

          {/* Right: Updated time + Language toggle + Bell + User Avatar */}
          <div className="flex items-center gap-4">
            {/* Real-time Update indicator + TH/EN toggle matching Stitch dashboard_2 */}
            <div className="hidden sm:flex items-center gap-2.5">
              <span className="text-[12px] font-medium text-[#505f76] select-none">
                {t('updated', 'Updated')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
              <div className="flex items-center p-0.5 bg-[#eaedff] rounded-full text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setLang('TH')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    lang === 'TH'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  TH
                </button>
                <button
                  type="button"
                  onClick={() => setLang('EN')}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    lang === 'EN'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Notifications Bell */}
            <Link
              to="/alerts"
              title="Notifications"
              className="relative p-2 rounded-full hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] transition-colors flex items-center justify-center"
            >
              <Bell size={20} />
              {activeAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a]" />
              )}
            </Link>

            {/* User Profile Avatar */}
            <div
              onClick={() => setShowUserMenu(prev => !prev)}
              className="w-8 h-8 rounded-full bg-[#004ac6] flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-opacity"
              title={user?.full_name || 'E. Mitchell'}
            >
              <User size={18} />
            </div>
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
                {lang === 'TH' ? 'ดูรายละเอียดที่หน้าการแจ้งเตือน →' : 'View alert details →'}
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
