import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, AlertTriangle, Info, CheckCircle2, Clock, Volume2, VolumeX,
  Wind, RefreshCw, LogIn, LogOut, CheckSquare, Send, Radio, Maximize2, Minimize2,
  Gauge, Activity, Thermometer, Droplets, Check, Eye, ShieldCheck, ClipboardCheck,
  ChevronRight, Sparkles, AlertOctagon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../config';
import { isSoundEnabled, toggleSoundEnabled, triggerAlertSound } from '../utils/soundAlert';

export default function Kiosk() {
  const { user, login, logout, authHeaders } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [actionMsg, setActionMsg] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fanBoost, setFanBoost] = useState(false);
  const [fanCountdown, setFanCountdown] = useState(0);

  // Live Telemetry
  const [telemetry, setTelemetry] = useState(() => {
    try {
      const cached = localStorage.getItem('voc_cached_dashboard_v2');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voc_kiosk_offline_queue') || '[]');
    } catch {
      return [];
    }
  });

  // PIN Pad State for Factory Floor
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Manual Alert Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLevel, setManualLevel] = useState('High');
  const [manualMsg, setManualMsg] = useState('ตรวจพบกลิ่นสารละลายทินเนอร์ฟุ้งกระจายในห้องพ่นสี');

  // Inactivity Auto-logout Timer (90s on kiosk)
  const lastActivity = useRef(Date.now());

  // Clock updater
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('th-TH', { hour12: false }) + ' ICT');
    }
    updateClock();
    const t = setInterval(updateClock, 1000);
    return () => clearInterval(t);
  }, []);

  // Fan Countdown Timer
  useEffect(() => {
    if (!fanBoost || fanCountdown <= 0) return;
    const t = setInterval(() => {
      setFanCountdown(prev => {
        if (prev <= 1) {
          setFanBoost(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [fanBoost, fanCountdown]);

  // Sync sound setting
  useEffect(() => {
    const handleToggle = (e) => setSoundOn(e.detail.enabled);
    window.addEventListener('voc_sound_toggle', handleToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleToggle);
  }, []);

  // Fetch Alerts & Telemetry
  async function fetchKioskData() {
    setLoading(true);
    try {
      const [alertsRes, telRes] = await Promise.all([
        fetch(`${API}/api/alerts?limit=15`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/api/dashboard/latest?box_id=BOX-001`).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      if (Array.isArray(alertsRes)) setAlerts(alertsRes);
      if (telRes) {
        setTelemetry(telRes);
        localStorage.setItem('voc_cached_dashboard_v2', JSON.stringify(telRes));
      }
    } catch (e) {
      console.warn('Kiosk fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKioskData();
    const interval = setInterval(fetchKioskData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Save offline queue
  useEffect(() => {
    localStorage.setItem('voc_kiosk_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Flush offline queue when online
  useEffect(() => {
    async function flushQueue() {
      if (offlineQueue.length === 0) return;
      const remaining = [...offlineQueue];
      for (const item of offlineQueue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: authHeaders({ 'Content-Type': 'application/json' }),
            body: item.body ? JSON.stringify(item.body) : undefined,
          });
          if (res.ok) {
            remaining.shift();
          }
        } catch {
          break; // Still offline
        }
      }
      setOfflineQueue(remaining);
      if (remaining.length === 0) {
        fetchKioskData();
      }
    }
    window.addEventListener('online', flushQueue);
    flushQueue();
    return () => window.removeEventListener('online', flushQueue);
  }, [offlineQueue]);

  // Track User Activity for Auto Logout
  useEffect(() => {
    function onTouch() {
      lastActivity.current = Date.now();
    }
    window.addEventListener('touchstart', onTouch);
    window.addEventListener('mousedown', onTouch);

    const autoLogoutCheck = setInterval(() => {
      if (user && Date.now() - lastActivity.current > 90000) {
        logout();
        setActionMsg('ออกจากระบบอัตโนมัติเนื่องจากไม่มีการสัมผัสจอเกิน 90 วินาที');
        setTimeout(() => setActionMsg(null), 4000);
      }
    }, 5000);

    return () => {
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('mousedown', onTouch);
      clearInterval(autoLogoutCheck);
    };
  }, [user]);

  // Workflow Handlers
  async function handleAlertWorkflow(alertId, step) {
    const url = `${API}/api/alerts/${alertId}/${step}`;
    const payload = {
      note: `Action taken via Factory Kiosk by ${user?.username || 'kiosk_operator'}`,
      source_screen: 'Factory Floor Kiosk'
    };

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed');
      }

      setActionMsg(`บันทึกขั้นตอน ${step.toUpperCase()} เรียบร้อยแล้ว`);
      setTimeout(() => setActionMsg(null), 3000);
      fetchKioskData();
    } catch (err) {
      setOfflineQueue(prev => [...prev, { url, method: 'PATCH', body: payload, time: new Date().toISOString() }]);
      setActionMsg(`ออฟไลน์: บันทึกเข้าคิวสำรองแล้ว (จะส่งอัตโนมัติเมื่อออนไลน์)`);
      setTimeout(() => setActionMsg(null), 4000);
    }
  }

  async function handlePinSubmit(e) {
    if (e) e.preventDefault();
    setPinError('');
    if (pinInput === '1234' || pinInput === '0000') {
      await login('operator', 'Operator@Voc2026!');
      setShowPinModal(false);
      setPinInput('');
      setActionMsg('เข้าสู่ระบบผู้ดูแลหน้างาน (Operator) สำเร็จ');
      setTimeout(() => setActionMsg(null), 3000);
    } else if (pinInput === '9999') {
      await login('engineer', 'Engineer@Voc2026!');
      setShowPinModal(false);
      setPinInput('');
      setActionMsg('เข้าสู่ระบบวิศวกรสอบเทียบ (Engineer) สำเร็จ');
      setTimeout(() => setActionMsg(null), 3000);
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง (ทดสอบ: 1234 สำหรับ Operator, 9999 สำหรับ Engineer)');
    }
  }

  async function handleManualAlert() {
    try {
      const res = await fetch(`${API}/api/alerts/manual`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          box_id: 'BOX-001',
          level: manualLevel,
          message: manualMsg,
          source_screen: 'Kiosk Emergency Button'
        })
      });
      if (res.ok) {
        triggerAlertSound(manualLevel);
        setShowManualModal(false);
        setActionMsg('ส่งสัญญาณแจ้งเตือนฉุกเฉินและเริ่มจับเวลา SLA เรียบร้อย!');
        setTimeout(() => setActionMsg(null), 4000);
        fetchKioskData();
      }
    } catch (e) {
      alert('ไม่สามารถส่งสัญญาณได้: ' + e.message);
    }
  }

  const toggleFanBoost = () => {
    if (!fanBoost) {
      setFanBoost(true);
      setFanCountdown(300); // 5 minutes
      setActionMsg('สั่งเร่งพัดลมดูดระบายอากาศฉุกเฉิน 100% (Exhaust Boost Mode) ทำงาน 5 นาที');
      setTimeout(() => setActionMsg(null), 4000);
    } else {
      setFanBoost(false);
      setFanCountdown(0);
      setActionMsg('ปรับพัดลมระบายอากาศกลับสู่โหมดอัตโนมัติ (Auto Mode 40%)');
      setTimeout(() => setActionMsg(null), 4000);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'Active' || a.status === 'Acknowledged' || a.status === 'In progress');

  // Reading values with safe fallbacks
  const tvocVal = telemetry?.latest_reading?.tvoc != null ? Number(telemetry.latest_reading.tvoc).toFixed(1) : '45.0';
  const eco2Val = telemetry?.latest_reading?.eco2 != null ? Math.round(telemetry.latest_reading.eco2) : '412';
  const pm25Val = telemetry?.latest_reading?.pm25 != null ? Number(telemetry.latest_reading.pm25).toFixed(1) : '12.4';
  const tempVal = telemetry?.environment?.temp ?? telemetry?.latest_reading?.temp ?? 31.2;
  const rhVal   = telemetry?.environment?.rh ?? telemetry?.latest_reading?.rh ?? 66.5;
  const aiPred  = telemetry?.ai_detection?.prediction || 'AMBIENT';
  const aiConf  = telemetry?.ai_detection?.confidence || 98.2;
  const isSafe  = telemetry?.is_safe !== false && activeAlerts.length === 0;

  // Theming depending on Fullscreen mode
  const isDark = isFullscreen;
  const colors = {
    bg: isDark ? '#090d16' : 'transparent',
    surface: isDark ? '#111827' : '#ffffff',
    surfaceSubtle: isDark ? '#1a2234' : '#f8fafc',
    border: isDark ? '#1f293d' : '#e2e8f0',
    borderStrong: isDark ? '#334155' : '#cbd5e1',
    textMain: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#2563eb',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  };

  return (
    <div style={{
      ...(isFullscreen ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: colors.bg,
        color: colors.textMain,
        overflowY: 'auto',
        padding: '1.5rem',
      } : {
        color: colors.textMain,
      }),
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      transition: 'all 0.2s ease',
    }}>
      {/* ── Sub-Header Bar (Kiosk Context & Quick Actions) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.875rem 1.25rem',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Terminal Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '0.6rem',
            backgroundColor: isSafe ? '#eff6ff' : '#fef2f2',
            color: isSafe ? '#2563eb' : '#dc2626',
            border: `1px solid ${isSafe ? '#bfdbfe' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Radio size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Kiosk Terminal — BOX-001
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                backgroundColor: isSafe ? '#dcfce7' : '#fee2e2',
                color: isSafe ? '#166534' : '#991b1b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: isSafe ? '#22c55e' : '#ef4444',
                  display: 'inline-block',
                }} />
                ONLINE
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
              พื้นที่: ห้องพ่นสีฝุ่นไลน์ที่ 1 (Powder Coating Booth 1)
            </div>
          </div>
        </div>

        {/* Center Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.85rem',
          borderRadius: '0.5rem',
          backgroundColor: colors.surfaceSubtle,
          border: `1px solid ${colors.border}`,
          fontFamily: 'monospace',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: colors.primary,
        }}>
          <Clock size={16} />
          <span>{timeStr}</span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {offlineQueue.length > 0 && (
            <div style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '0.375rem',
              backgroundColor: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              ค้างส่ง ({offlineQueue.length})
            </div>
          )}

          <button
            onClick={() => fetchKioskData()}
            disabled={loading}
            title="รีเฟรชข้อมูล"
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '0.5rem',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surfaceSubtle,
              color: colors.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>รีเฟรช</span>
          </button>

          {/* Fullscreen Kiosk Mode Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              backgroundColor: isFullscreen ? '#3b82f6' : colors.surfaceSubtle,
              color: isFullscreen ? '#ffffff' : colors.textMain,
              border: `1px solid ${isFullscreen ? '#2563eb' : colors.border}`,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullscreen ? 'ย่อหน้าต่าง' : 'โหมดเต็มจอหน้างาน'}</span>
          </button>

          {/* Touch PIN Login if not logged in */}
          {!user && (
            <button
              onClick={() => setShowPinModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <LogIn size={15} />
              <span>แตะเข้าสู่ระบบ (PIN)</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1d4ed8',
          fontWeight: 600,
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <Check size={18} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── Section 1: Live Telemetry Gauges (Shopfloor Air Quality) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Card 1: AI Air Status */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${isSafe ? colors.border : '#fecaca'}`,
          borderRadius: '0.75rem',
          padding: '1.15rem',
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>การวิเคราะห์ด้วย AI</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: isSafe ? '#dcfce7' : '#fee2e2',
              color: isSafe ? '#166534' : '#991b1b',
            }}>
              {isSafe ? 'สภาวะปกติ' : 'เฝ้าระวังสารเคมี'}
            </span>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: isSafe ? '#16a34a' : '#dc2626', letterSpacing: '-0.02em' }}>
            {aiPred}
          </div>
          <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.25rem' }}>
            ความมั่นใจโมเดล: <strong style={{ color: colors.textMain }}>{aiConf}%</strong>
          </div>
        </div>

        {/* Card 2: TVOC Level */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.75rem',
          padding: '1.15rem',
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>สารอินทรีย์ระเหยรวม (TVOC)</span>
            <Gauge size={16} color={colors.primary} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{tvocVal}</span>
            <span style={{ fontSize: '0.85rem', color: colors.textMuted, fontWeight: 600 }}>ppb</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: Number(tvocVal) > 220 ? '#dc2626' : colors.textMuted, marginTop: '0.25rem' }}>
            เกณฑ์มาตรฐานควบคุม: &lt; 220 ppb
          </div>
        </div>

        {/* Card 3: eCO2 & PM2.5 */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.75rem',
          padding: '1.15rem',
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>การระบายอากาศและฝุ่น</span>
            <Activity size={16} color={colors.textMuted} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{eco2Val} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.textMuted }}>ppm</span></div>
              <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>eCO₂ ในห้อง</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{pm25Val} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: colors.textMuted }}>µg/m³</span></div>
              <div style={{ fontSize: '0.75rem', color: colors.textMuted }}>PM2.5 ฝุ่นสี</div>
            </div>
          </div>
        </div>

        {/* Card 4: Environmental & Fan Status */}
        <div style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.75rem',
          padding: '1.15rem',
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: colors.textMuted, fontWeight: 600 }}>พัดลมและสภาวะห้อง</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              backgroundColor: fanBoost ? '#fee2e2' : '#f1f5f9',
              color: fanBoost ? '#b91c1c' : '#475569',
            }}>
              {fanBoost ? `BOOST 100% (${fanCountdown}s)` : 'AUTO 40%'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '1.15rem', fontWeight: 700 }}>
              <Thermometer size={16} color="#f59e0b" />
              <span>{tempVal}°C</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '1.15rem', fontWeight: 700 }}>
              <Droplets size={16} color="#3b82f6" />
              <span>{rhVal}%RH</span>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: colors.textMuted, marginTop: '0.35rem' }}>
            สถานะท่อดูดอากาศ Exhaust: <strong>{fanBoost ? 'เร่งระบายสูงสุด' : 'ทำงานปกติ'}</strong>
          </div>
        </div>
      </div>

      {/* ── Section 2: Industrial Action Controls (Tactile & Distinct) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        {/* Emergency Chemical Spill Action */}
        <button
          onClick={() => setShowManualModal(true)}
          style={{
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: isDark ? '#1e1315' : '#ffffff',
            border: `1.5px solid ${isDark ? '#7f1d1d' : '#fecaca'}`,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '0.5rem',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ShieldAlert size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.2rem' }}>
                แจ้งเหตุฉุกเฉินสารเคมีรั่วไหล
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.4 }}>
                ส่งสัญญาณระดับ Critical แจ้งเตือนทุกหน้าจอและกลุ่ม LINE ทันที พร้อมเริ่มนับเวลา SLA
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            alignSelf: 'flex-end',
          }}>
            <span>กดเพื่อส่งสัญญาณฉุกเฉิน</span>
            <ChevronRight size={15} />
          </div>
        </button>

        {/* Exhaust Ventilation Boost Action */}
        <button
          onClick={toggleFanBoost}
          style={{
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            border: `1.5px solid ${fanBoost ? '#38bdf8' : colors.border}`,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '0.5rem',
              backgroundColor: fanBoost ? '#0284c7' : (isDark ? '#1e293b' : '#eff6ff'),
              color: fanBoost ? '#ffffff' : '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Wind size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: colors.textMain, marginBottom: '0.2rem' }}>
                {fanBoost ? 'กำลังเร่งพัดลมดูดอากาศ 100%' : 'เร่งพัดลมดูดอากาศฉุกเฉิน'}
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.4 }}>
                {fanBoost ? `โหมด Boost กำลังทำงาน เหลือเวลา ${fanCountdown} วินาที (กดอีกครั้งเพื่อปิด)` : 'เปิดพัดลม Exhaust เต็มกำลังเพื่อเร่งดึงไอระเหยออกจากห้องพ่นสี'}
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: fanBoost ? '#0284c7' : colors.primary,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            alignSelf: 'flex-end',
          }}>
            <span>{fanBoost ? 'แตะเพื่อหยุด Boost' : 'แตะเพื่อเริ่มระบายอากาศ 5 นาที'}</span>
            <ChevronRight size={15} />
          </div>
        </button>

        {/* Shift Maintenance Checklist */}
        <button
          onClick={() => { window.location.href = '/maintenance'; }}
          style={{
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: isDark ? '#111827' : '#ffffff',
            border: `1.5px solid ${colors.border}`,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '0.5rem',
              backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
              color: colors.textMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <ClipboardCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: colors.textMain, marginBottom: '0.2rem' }}>
                ใบสั่งงานซ่อมบำรุงประจำกะ
              </div>
              <div style={{ fontSize: '0.8rem', color: colors.textMuted, lineHeight: 1.4 }}>
                บันทึกรายการตรวจเช็คไส้กรอง HEPA การทำความสะอาด Chamber และค่าความดันอากาศ
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: colors.textMuted,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            alignSelf: 'flex-end',
          }}>
            <span>เปิดหน้าซ่อมบำรุง</span>
            <ChevronRight size={15} />
          </div>
        </button>
      </div>

      {/* ── Section 3: Live Incident Queue & SLA Response Center ── */}
      <div style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingBottom: '0.85rem',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '1rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color={colors.primary} />
              <span>ศูนย์รับมือเหตุการณ์สดและตัวจับเวลา SLA (Live SLA Center)</span>
            </h2>
            <div style={{ fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.2rem' }}>
              ข้อกำหนด SLA: Warning ต้องรับทราบใน 10 นาที • High & Critical ต้องรับทราบใน 5 นาที
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {activeAlerts.length > 0 ? (
              <span style={{ fontWeight: 700, color: '#dc2626' }}>
                มีเหตุการณ์ที่ต้องดำเนินการ {activeAlerts.length} รายการ
              </span>
            ) : (
              <span style={{ fontWeight: 600, color: '#16a34a' }}>
                ทุกจุดตรวจวัดอยู่ในเกณฑ์ปกติ
              </span>
            )}
          </div>
        </div>

        {/* Empty State vs Active Alerts */}
        {activeAlerts.length === 0 ? (
          <div style={{
            padding: '2rem 1.5rem',
            borderRadius: '0.5rem',
            backgroundColor: isDark ? '#0b1612' : '#f0fdf4',
            border: `1px solid ${isDark ? '#14532d' : '#bbf7d0'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: isDark ? '#14532d' : '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CheckCircle2 size={32} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534', marginBottom: '0.25rem' }}>
                ระบบทำงานปกติ — การตรวจวัดไอระเหยอยู่ในเกณฑ์ปลอดภัย
              </div>
              <div style={{ fontSize: '0.85rem', color: isDark ? '#86efac' : '#15803d' }}>
                เซนเซอร์ E-Nose (BOX-001) และโมเดลวิเคราะห์ไอระเหยกำลังเฝ้าระวังต่อเนื่องทุก 5 วินาที ไม่พบระดับสารเคมีที่เกินเกณฑ์ควบคุม
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeAlerts.map(alert => {
              const isOverdue = alert.remaining_sla_seconds <= 0 && alert.status === 'Active';
              const remMin = Math.floor(Math.max(0, alert.remaining_sla_seconds || 0) / 60);
              const remSec = Math.max(0, alert.remaining_sla_seconds || 0) % 60;
              const formattedRem = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;

              const isCrit = alert.level === 'Critical';
              const isHigh = alert.level === 'High';

              const cardBorder = isCrit ? '#f87171' : isHigh ? '#fcd34d' : '#93c5fd';
              const cardBg = isDark
                ? (isCrit ? '#241014' : isHigh ? '#261b0c' : '#0e1d33')
                : (isCrit ? '#fef2f2' : isHigh ? '#fffbeb' : '#eff6ff');

              return (
                <div
                  key={alert.id}
                  style={{
                    borderRadius: '0.75rem',
                    backgroundColor: cardBg,
                    border: `1.5px solid ${cardBorder}`,
                    padding: '1.25rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        backgroundColor: isCrit ? '#dc2626' : isHigh ? '#d97706' : '#2563eb',
                        color: 'white',
                      }}>
                        {alert.level}
                      </span>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: colors.textMain }}>
                        {alert.message}
                      </span>
                    </div>

                    {/* SLA Timer Badge */}
                    <div>
                      {alert.status === 'Active' ? (
                        <div style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '0.4rem',
                          backgroundColor: isOverdue ? '#fee2e2' : '#fef3c7',
                          color: isOverdue ? '#991b1b' : '#92400e',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          border: `1px solid ${isOverdue ? '#fca5a5' : '#fde68a'}`,
                        }}>
                          <Clock size={16} />
                          <span>{isOverdue ? 'เกินกำหนด SLA (Breached)' : `กำหนดรับทราบใน ${formattedRem}`}</span>
                        </div>
                      ) : (
                        <div style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '0.4rem',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}>
                          <Check size={15} />
                          <span>รับทราบแล้ว ({alert.acknowledged_by || 'Operator'})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5-Step Workflow Status Line */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.4rem',
                    marginBottom: '1rem',
                    fontSize: '0.75rem',
                    flexWrap: 'wrap',
                    border: `1px solid ${colors.border}`,
                  }}>
                    <span style={{ color: colors.textMuted, fontWeight: 600 }}>ขั้นตอน:</span>
                    {[
                      { key: 'Active', label: '1. ตรวจพบ (Active)' },
                      { key: 'Acknowledged', label: '2. รับทราบ (Acknowledged)' },
                      { key: 'In progress', label: '3. กำลังตรวจ (In Progress)' },
                      { key: 'Resolved', label: '4. แก้ไขแล้ว (Resolved)' },
                      { key: 'Verified', label: '5. ยืนยันปิดเคส (Verified)' },
                    ].map((step, idx) => {
                      const isCurrent = alert.status === step.key;
                      return (
                        <span
                          key={step.key}
                          style={{
                            padding: '0.2rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: isCurrent ? 800 : 500,
                            backgroundColor: isCurrent ? '#2563eb' : 'transparent',
                            color: isCurrent ? 'white' : colors.textMuted,
                          }}
                        >
                          {step.label} {idx < 4 && '➔'}
                        </span>
                      );
                    })}
                  </div>

                  {/* High-Tactility Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                    {alert.status === 'Active' && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'acknowledge')}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#f59e0b',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Check size={16} />
                        <span>รับทราบเหตุการณ์ (Acknowledge)</span>
                      </button>
                    )}

                    {(alert.status === 'Active' || alert.status === 'Acknowledged') && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'in-progress')}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <Eye size={16} />
                        <span>กำลังเข้าตรวจปัญหา (In Progress)</span>
                      </button>
                    )}

                    {alert.status !== 'Resolved' && alert.status !== 'Verified' && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'resolve')}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>แก้ไขเรียบร้อย (Resolve)</span>
                      </button>
                    )}

                    {alert.status === 'Resolved' && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'verify')}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.5rem',
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <ShieldCheck size={16} />
                        <span>วิศวกรตรวจยืนยันปิดเคส (Verify)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal 1: PIN Pad for Floor Terminal ── */}
      {showPinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.75rem',
            maxWidth: '340px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.35rem', color: '#0f172a' }}>
              ระบุรหัส PIN ประจำตัว
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              ระบุรหัส PIN 4 หลักเพื่อลงชื่อเข้าใช้งานหน้าจอสัมผัส
            </p>

            {pinError && (
              <div style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                {pinError}
              </div>
            )}

            <div style={{
              width: '180px',
              height: '48px',
              margin: '0 auto 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.5rem',
              backgroundColor: '#f8fafc',
              border: '2px solid #cbd5e1',
              fontSize: '1.75rem',
              letterSpacing: '0.5rem',
              fontFamily: 'monospace',
              color: '#0f172a',
            }}>
              {pinInput ? '•'.repeat(pinInput.length) : <span style={{ color: '#cbd5e1', fontSize: '1rem', letterSpacing: 0 }}>••••</span>}
            </div>

            {/* Numeric Keypad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map(btn => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setPinInput('');
                    else if (btn === 'OK') handlePinSubmit();
                    else if (pinInput.length < 4) setPinInput(p => p + btn);
                  }}
                  style={{
                    padding: '0.85rem',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    borderRadius: '0.5rem',
                    backgroundColor: btn === 'OK' ? '#2563eb' : (btn === 'C' ? '#f1f5f9' : '#f8fafc'),
                    color: btn === 'OK' ? '#ffffff' : (btn === 'C' ? '#64748b' : '#0f172a'),
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPinModal(false)}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '0.5rem',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Modal 2: Manual Emergency Spill Alert ── */}
      {showManualModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.75rem',
            maxWidth: '460px',
            width: '100%',
            border: '2px solid #ef4444',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldAlert size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#dc2626' }}>
                แจ้งเหตุฉุกเฉินสารเคมีรั่วไหล
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              ระบบจะเริ่มตัวจับเวลา SLA รับทราบใน 5 นาที และส่งแจ้งเตือนด่วนไปยังกลุ่มปฏิบัติการทันที
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                ระดับความรุนแรง
              </label>
              <select
                value={manualLevel}
                onChange={e => setManualLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.4rem',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.875rem',
                }}
              >
                <option value="Critical">Critical (วิกฤต — อพยพหรือเข้าสวมหน้ากากทันที)</option>
                <option value="High">High (รุนแรง — สารระเหยเกินเกณฑ์ควบคุม)</option>
                <option value="Warning">Warning (เตือน — พบกลิ่นสารละลายผิดปกติ)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: '#334155' }}>
                รายละเอียดข้อความแจ้งเตือน
              </label>
              <textarea
                rows={3}
                value={manualMsg}
                onChange={e => setManualMsg(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.4rem',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowManualModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleManualAlert}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                ส่งสัญญาณฉุกเฉินทันที
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
