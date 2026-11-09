import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Box, Database, Wind, BookOpen, CalendarDays,
  Settings, Bell, Wrench, Monitor, Factory, ShieldCheck, Layers,
  AlertTriangle, ShieldAlert, Info, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  isSoundEnabled, triggerAlertSound
} from '../utils/soundAlert';
import apiClient from '../services/apiClient';

import SidebarNav from './layout/SidebarNav';
import HeaderBar from './layout/HeaderBar';
import AlertBanner from './layout/AlertBanner';

export default function Layout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lang, t, isThai } = useLanguage();
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [criticalBannerAlert, setCriticalBannerAlert] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);
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
        const [alertsData, devs] = await Promise.all([
          apiClient.get('/api/alerts?limit=15').catch(() => null),
          apiClient.get('/api/devices').catch(() => null),
        ]);

        if (Array.isArray(devs)) {
          const hasOnline = devs.some((d) => (d.status || '').toUpperCase() === 'ONLINE');
          setIsDeviceOnline(hasOnline);
        }

        if (Array.isArray(alertsData)) {
          const activeList = alertsData.filter((a) => a.status === 'Active');
          setActiveAlertsCount(activeList.length);

          // Update critical alert banner
          if (activeList.length > 0) {
            const topCritical =
              activeList.find((a) => a.level === 'Critical') ||
              activeList.find((a) => a.level === 'High') ||
              activeList[0];
            setCriticalBannerAlert(topCritical);
          } else {
            setCriticalBannerAlert(null);
          }

          // ตรวจจับ Alert ใหม่เพื่อเล่นเสียง
          if (isFirstRun.current) {
            alertsData.forEach((a) => seenAlertIds.current.add(a.id));
            isFirstRun.current = false;
          } else {
            const newActiveAlerts = activeList.filter((a) => !seenAlertIds.current.has(a.id));
            if (newActiveAlerts.length > 0) {
              const highestAlert =
                newActiveAlerts.find((a) => a.level === 'Critical') ||
                newActiveAlerts.find((a) => a.level === 'High') ||
                newActiveAlerts[0];

              triggerAlertSound(highestAlert.level);
              setToastAlert(highestAlert);
              newActiveAlerts.forEach((a) => seenAlertIds.current.add(a.id));
            }
          }
        }
      } catch (err) {
        console.warn('Alert poller notice:', err);
      }
    }

    checkAlerts();
    timerId = setInterval(checkAlerts, 5000);
    return () => clearInterval(timerId);
  }, []);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastAlert) return;
    const tTimer = setTimeout(() => setToastAlert(null), 6000);
    return () => clearTimeout(tTimer);
  }, [toastAlert]);

  // RBAC Navigation items
  const userRole = user?.role || 'operator';

  const allNavItems = [
    { key: 'dashboard', name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { key: 'kiosk', name: 'Kiosk', path: '/kiosk', icon: Monitor, roles: ['admin', 'engineer', 'operator'] },
    { key: 'alerts', name: 'Alerts', path: '/alerts', icon: Bell, roles: ['admin', 'engineer', 'operator'], badge: activeAlertsCount },
    { key: 'airflow', name: 'Airflow', path: '/airflow', icon: Wind, roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { key: 'history', name: 'History', path: '/history', icon: CalendarDays, roles: ['admin', 'engineer', 'operator', 'viewer'] },
    { key: 'maintenance', name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['admin', 'engineer'] },
    { key: 'devices', name: 'Devices', path: '/devices', icon: Box, roles: ['admin', 'engineer'] },
    { key: 'dataCollection', name: 'Data Collection', path: '/data-collection', icon: Database, roles: ['admin', 'engineer'] },
    { key: 'settings', name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
    { key: 'airQualityGuide', name: 'Air Quality Guide', path: '/air-quality-guide', icon: ShieldAlert, roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { key: 'emissions', name: 'Emissions', path: '/emissions', icon: Factory, roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { key: 'userGuide', name: 'User Guide', path: '/guide', icon: BookOpen, roles: ['admin', 'engineer', 'operator', 'viewer'], isMore: true },
    { key: 'roles', name: 'Roles & Policy', path: '/roles', icon: ShieldCheck, roles: ['admin', 'engineer'], isMore: true },
    { key: 'systemStates', name: 'System States', path: '/system-states', icon: Layers, roles: ['admin', 'engineer'], isMore: true },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex">
      {/* Mobile Off-canvas Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#131b2e]/40 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-[240px] bg-white border-r border-[#e2e8f0] z-50 flex flex-col justify-between shadow-2xl lg:hidden animate-fadeIn">
            <SidebarNav
              navItems={navItems}
              user={user}
              logout={logout}
              soundActive={soundActive}
              setSoundActive={setSoundActive}
              onClose={() => setMobileMenuOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#e2e8f0] z-20 shadow-[0_1px_8px_rgba(0,0,0,0.04)] justify-between">
        <SidebarNav
          navItems={navItems}
          user={user}
          logout={logout}
          soundActive={soundActive}
          setSoundActive={setSoundActive}
        />
      </aside>

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Critical Alert Banner */}
        <AlertBanner
          criticalBannerAlert={criticalBannerAlert}
          isBannerDismissed={isBannerDismissed}
          setIsBannerDismissed={setIsBannerDismissed}
          lang={lang}
        />

        {/* Sticky Header */}
        <HeaderBar
          setMobileMenuOpen={setMobileMenuOpen}
          isDeviceOnline={isDeviceOnline}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Floating Toast Notification */}
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
                    ? '#ba1a1a'
                    : '#004ac6',
              }}
            >
              {toastAlert.level === 'Critical' || toastAlert.level === 'High' ? (
                <ShieldAlert size={20} />
              ) : toastAlert.level === 'Warning' ? (
                <AlertTriangle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  {toastAlert.level} Alert
                </span>
                <span className="text-[11px] text-[#94a3b8]">
                  {toastAlert.time || 'Now'}
                </span>
              </div>
              <p className="text-[13px] font-semibold text-[#131b2e] mt-0.5 leading-snug">
                {toastAlert.message || toastAlert.title}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToastAlert(null)}
              className="text-[#94a3b8] hover:text-[#131b2e] p-1 rounded-lg hover:bg-[#f1f5f9] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-3 xs:p-4 sm:p-6 lg:p-8 xl:p-10 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
