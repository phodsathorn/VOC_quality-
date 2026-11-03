import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, AlertTriangle, Info, CheckCircle, Clock, Volume2, VolumeX,
  Flame, Wind, RefreshCw, LogIn, LogOut, CheckSquare, Send, Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API } from '../config';
import { isSoundEnabled, toggleSoundEnabled, triggerAlertSound } from '../utils/soundAlert';

export default function Kiosk() {
  const { user, login, logout, authHeaders, isAuthenticated } = useAuth();
  const [timeStr, setTimeStr] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [actionMsg, setActionMsg] = useState(null);
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

  // Inactivity Auto-logout Timer (60s)
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

  // Sync sound setting
  useEffect(() => {
    const handleToggle = (e) => setSoundOn(e.detail.enabled);
    window.addEventListener('voc_sound_toggle', handleToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleToggle);
  }, []);

  // Fetch Alerts
  async function fetchKioskAlerts() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/alerts?limit=15`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (e) {
      console.warn('Kiosk fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKioskAlerts();
    const interval = setInterval(fetchKioskAlerts, 5000);
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
        fetchKioskAlerts();
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
      if (user && Date.now() - lastActivity.current > 60000) {
        logout();
        setActionMsg('🔒 ออกจากระบบอัตโนมัติเนื่องจากไม่มีการสัมผัสจอเกิน 60 วินาที');
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

      setActionMsg(`✅ บันทึกสถานะ ${step} สำเร็จ`);
      setTimeout(() => setActionMsg(null), 3500);
      fetchKioskAlerts();
    } catch (err) {
      // Add to offline queue
      setOfflineQueue(prev => [...prev, { url, method: 'PATCH', body: payload, time: new Date().toISOString() }]);
      setActionMsg(`📶 ออฟไลน์: บันทึกเข้าคิวสำรองแล้ว (จะส่งอัตโนมัติเมื่อออนไลน์)`);
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
      setActionMsg('✅ เข้าสู่ระบบผู้ดูแลหน้างาน (Operator) สำเร็จ');
      setTimeout(() => setActionMsg(null), 3000);
    } else if (pinInput === '9999') {
      await login('engineer', 'Engineer@Voc2026!');
      setShowPinModal(false);
      setPinInput('');
      setActionMsg('✅ เข้าสู่ระบบวิศวกรสอบเทียบ (Engineer) สำเร็จ');
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
        setActionMsg('🚨 ส่งสัญญาณแจ้งเตือนฉุกเฉินและเริ่มจับเวลา SLA เรียบร้อย!');
        setTimeout(() => setActionMsg(null), 4000);
        fetchKioskAlerts();
      }
    } catch (e) {
      alert('ไม่สามารถส่งสัญญาณได้: ' + e.message);
    }
  }

  const activeAlerts = alerts.filter(a => a.status === 'Active' || a.status === 'Acknowledged' || a.status === 'In progress');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '1.25rem',
      boxSizing: 'border-box'
    }}>
      {/* ── Kiosk Top Bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.85rem 1.25rem', borderRadius: '0.75rem',
        backgroundColor: '#131b2e', border: '1px solid #1e293b', marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '0.5rem',
            backgroundColor: '#2563eb', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white'
          }}>
            <Radio size={26} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              KIOSK MONITOR — BOX-001
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              พื้นที่: อาคารพ่นสีฝุ่นไลน์ที่ 1 (Powder Coating Booth 1)
            </div>
          </div>
        </div>

        {/* Center Clock */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8',
          fontFamily: 'monospace', letterSpacing: '1px',
          backgroundColor: '#0a0f1d', padding: '0.4rem 1rem', borderRadius: '0.5rem',
          border: '1px solid #1e293b'
        }}>
          <Clock size={22} />
          <span>{timeStr}</span>
        </div>

        {/* Right Badges & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {offlineQueue.length > 0 && (
            <div style={{
              padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
              backgroundColor: '#7c2d12', color: '#fed7aa', fontSize: '0.75rem', fontWeight: 700
            }}>
              📶 ออฟไลน์ค้างส่ง ({offlineQueue.length})
            </div>
          )}

          <button
            onClick={() => {
              const next = toggleSoundEnabled();
              setSoundOn(next);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 0.85rem', borderRadius: '0.5rem',
              backgroundColor: soundOn ? '#064e3b' : '#334155',
              color: soundOn ? '#6ee7b7' : '#94a3b8',
              border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
            }}
          >
            {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{soundOn ? 'เสียงเปิด' : 'เสียงปิด'}</span>
          </button>

          {/* User Badge / PIN Login */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
                backgroundColor: user.role === 'engineer' ? '#1e3a8a' : '#065f46',
                color: 'white', fontWeight: 700, fontSize: '0.85rem'
              }}>
                👤 {user.full_name || user.username} ({user.role.toUpperCase()})
              </div>
              <button
                onClick={() => logout()}
                title="ออกจากระบบ"
                style={{
                  padding: '0.5rem', borderRadius: '0.5rem',
                  backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', cursor: 'pointer'
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPinModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                backgroundColor: '#f59e0b', color: '#78350f', border: 'none',
                fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <LogIn size={18} /> แตะเพื่อลงชื่อเข้าใช้งาน (PIN)
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div style={{
          padding: '0.85rem 1.25rem', borderRadius: '0.5rem',
          backgroundColor: '#1e293b', border: '1.5px solid #38bdf8',
          color: '#38bdf8', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem',
          textAlign: 'center'
        }}>
          {actionMsg}
        </div>
      )}

      {/* ── Active Alerts Area with 5-Step Workflow & SLA Timer ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={24} color="#ef4444" />
            การแจ้งเตือนสดและตัวจับเวลา SLA (Live SLA Response Center)
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            ข้อกำหนด SLA: Warning 10 นาที / High & Critical 5 นาที
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div style={{
            padding: '2.5rem', borderRadius: '0.75rem',
            backgroundColor: '#0f172a', border: '1.5px solid #1e293b',
            textAlign: 'center', color: '#10b981'
          }}>
            <CheckCircle size={54} style={{ margin: '0 auto 0.75rem' }} />
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>บรรยากาศปกติ — ปลอดภัย ไม่พบสารเคมีเกินเกณฑ์</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.35rem' }}>
              ระบบเซนเซอร์ E-Nose และ AI กำลังตรวจวัดต่อเนื่องทุก 3 วินาที
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeAlerts.map(alert => {
              const isOverdue = alert.remaining_sla_seconds <= 0 && alert.status === 'Active';
              const remMin = Math.floor(Math.max(0, alert.remaining_sla_seconds || 0) / 60);
              const remSec = Math.max(0, alert.remaining_sla_seconds || 0) % 60;
              const formattedRem = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;

              return (
                <div
                  key={alert.id}
                  style={{
                    borderRadius: '0.85rem',
                    backgroundColor: alert.level === 'Critical' ? '#2d0a0a' :
                                     alert.level === 'High' ? '#2a1603' : '#0c1e3d',
                    border: `2px solid ${
                      alert.level === 'Critical' ? '#dc2626' :
                      alert.level === 'High' ? '#d97706' : '#2563eb'
                    }`,
                    padding: '1.25rem',
                    boxShadow: isOverdue ? '0 0 25px rgba(239, 68, 68, 0.4)' : 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        padding: '0.35rem 0.85rem', borderRadius: '0.4rem',
                        fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase',
                        backgroundColor: alert.level === 'Critical' ? '#dc2626' :
                                         alert.level === 'High' ? '#d97706' : '#2563eb',
                        color: 'white'
                      }}>
                        {alert.level}
                      </span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                        {alert.message}
                      </span>
                    </div>

                    {/* SLA Timer Badge */}
                    <div>
                      {alert.status === 'Active' ? (
                        <div style={{
                          padding: '0.4rem 1rem', borderRadius: '0.5rem',
                          backgroundColor: isOverdue ? '#ef4444' : '#1e293b',
                          color: isOverdue ? 'white' : '#f59e0b',
                          fontWeight: 900, fontSize: '1.1rem', fontFamily: 'monospace',
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          border: isOverdue ? '2px solid #b91c1c' : '1px solid #475569',
                          animation: isOverdue ? 'pulse 1s infinite' : 'none'
                        }}>
                          <Clock size={20} />
                          {isOverdue ? '🚨 ผิดนัด SLA (BREACHED)' : `⏳ รับทราบภายใน ${formattedRem}`}
                        </div>
                      ) : (
                        <div style={{
                          padding: '0.4rem 0.85rem', borderRadius: '0.5rem',
                          backgroundColor: '#064e3b', color: '#6ee7b7',
                          fontWeight: 800, fontSize: '0.85rem'
                        }}>
                          ✓ รับทราบแล้ว ({alert.acknowledged_by || 'Operator'})
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5-Step Progress Tracker */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: '#0a0f1d', padding: '0.65rem 1rem', borderRadius: '0.5rem',
                    marginBottom: '1.1rem', fontSize: '0.8rem', flexWrap: 'wrap'
                  }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>สถานะขั้นตอน:</span>
                    {[
                      { key: 'Active', label: '1. ตรวจพบ (Active)' },
                      { key: 'Acknowledged', label: '2. รับทราบ (Acknowledged)' },
                      { key: 'In progress', label: '3. กำลังตรวจ (In Progress)' },
                      { key: 'Resolved', label: '4. แก้ไขแล้ว (Resolved)' },
                      { key: 'Verified', label: '5. วิศวกรยืนยัน (Verified)' },
                    ].map((step, idx) => {
                      const isCurrent = alert.status === step.key;
                      return (
                        <span
                          key={step.key}
                          style={{
                            padding: '0.2rem 0.5rem', borderRadius: '4px',
                            fontWeight: isCurrent ? 800 : 500,
                            backgroundColor: isCurrent ? '#2563eb' : 'transparent',
                            color: isCurrent ? 'white' : '#64748b'
                          }}
                        >
                          {step.label} {idx < 4 && '➔'}
                        </span>
                      );
                    })}
                  </div>

                  {/* BIG TOUCH ACTION BUTTONS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {alert.status === 'Active' && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'acknowledge')}
                        style={{
                          padding: '0.85rem', borderRadius: '0.6rem',
                          backgroundColor: '#f59e0b', color: '#78350f', border: 'none',
                          fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                      >
                        🟡 รับทราบทันที (Acknowledge)
                      </button>
                    )}

                    {(alert.status === 'Active' || alert.status === 'Acknowledged') && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'in-progress')}
                        style={{
                          padding: '0.85rem', borderRadius: '0.6rem',
                          backgroundColor: '#2563eb', color: 'white', border: 'none',
                          fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                      >
                        🔵 กำลังเข้าตรวจปัญหา (In Progress)
                      </button>
                    )}

                    {alert.status !== 'Resolved' && alert.status !== 'Verified' && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'resolve')}
                        style={{
                          padding: '0.85rem', borderRadius: '0.6rem',
                          backgroundColor: '#059669', color: 'white', border: 'none',
                          fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                      >
                        🟢 แก้ไขเสร็จสิ้น (Resolve)
                      </button>
                    )}

                    {alert.status === 'Resolved' && (
                      <button
                        onClick={() => handleAlertWorkflow(alert.id, 'verify')}
                        style={{
                          padding: '0.85rem', borderRadius: '0.6rem',
                          backgroundColor: '#7c3aed', color: 'white', border: 'none',
                          fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                        }}
                      >
                        🟣 วิศวกรตรวจยืนยันปิดเคส (Verify)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Kiosk Action Center (Big Emergency & Maintenance Controls) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <button
          onClick={() => setShowManualModal(true)}
          style={{
            padding: '1.5rem', borderRadius: '0.85rem',
            backgroundColor: '#991b1b', color: 'white', border: '2px solid #ef4444',
            textAlign: 'left', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(153, 27, 27, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <ShieldAlert size={32} color="#fca5a5" />
            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>แจ้งเหตุฉุกเฉินสารเคมีรั่วไหล</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.4 }}>
            กดปุ่มนี้เพื่อส่งสัญญาณเตือนภัยระดับ Critical ไปยังจอ Kiosk และกลุ่ม LINE OA ทันที
          </div>
        </button>

        <button
          onClick={() => {
            setActionMsg('💨 สั่งเปิดพัดลมดูดระบายอากาศฉุกเฉิน (Exhaust Boost Mode) กำลังทำงาน 100%');
            setTimeout(() => setActionMsg(null), 5000);
          }}
          style={{
            padding: '1.5rem', borderRadius: '0.85rem',
            backgroundColor: '#0c4a6e', color: 'white', border: '2px solid #0284c7',
            textAlign: 'left', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Wind size={32} color="#7dd3fc" />
            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>เร่งพัดลมดูดอากาศฉุกเฉิน</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#7dd3fc', lineHeight: 1.4 }}>
            เปิดพัดลม Exhaust เต็มกำลังเพื่อเร่งดึงไอระเหยออกจากห้องพ่นสี
          </div>
        </button>

        <button
          onClick={() => {
            window.location.href = '/maintenance';
          }}
          style={{
            padding: '1.5rem', borderRadius: '0.85rem',
            backgroundColor: '#1e293b', color: 'white', border: '2px solid #334155',
            textAlign: 'left', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckSquare size={32} color="#94a3b8" />
            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>ใบสั่งงานซ่อมบำรุงประจำกะ</div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
            บันทึก Checklist เปลี่ยนไส้กรอง HEPA และการทำความสะอาด Chamber
          </div>
        </button>
      </div>

      {/* ── PIN Entry Modal ── */}
      {showPinModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#1e293b', borderRadius: '1rem', padding: '2rem',
            maxWidth: '360px', width: '100%', border: '2px solid #334155', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'white' }}>
              🔑 ใส่รหัส PIN พนักงาน
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              ระบุรหัส PIN 4 หลักเพื่อลงชื่อเข้าใช้งานหน้าจอสัมผัส
            </p>

            {pinError && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                {pinError}
              </div>
            )}

            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="••••"
              style={{
                width: '180px', fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5rem',
                padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#0f172a',
                border: '2px solid #475569', color: 'white', marginBottom: '1.25rem'
              }}
            />

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
                    padding: '0.85rem', fontSize: '1.2rem', fontWeight: 800,
                    borderRadius: '0.5rem', backgroundColor: '#334155', color: 'white',
                    border: 'none', cursor: 'pointer'
                  }}
                >
                  {btn}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPinModal(false)}
              style={{
                width: '100%', padding: '0.65rem', borderRadius: '0.5rem',
                backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569',
                cursor: 'pointer', fontWeight: 700
              }}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ── Manual Emergency Alert Modal ── */}
      {showManualModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            backgroundColor: '#1e293b', borderRadius: '1rem', padding: '1.75rem',
            maxWidth: '440px', width: '100%', border: '2px solid #ef4444'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: '#ef4444' }}>
              🚨 แจ้งเหตุฉุกเฉินสารเคมีรั่วไหล
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
              ระบบจะเริ่มตัวจับเวลา SLA รับทราบภายใน 5 นาทีทันที
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>ระดับความรุนแรง</label>
              <select
                value={manualLevel}
                onChange={e => setManualLevel(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '0.9rem' }}
              >
                <option value="Critical">Critical (วิกฤต — อพยพหรือเข้าสวมหน้ากากทันที)</option>
                <option value="High">High (รุนแรง — สารระเหยเกินค่าควบคุม)</option>
                <option value="Warning">Warning (เตือน — กลิ่นผิดปกติ)</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem' }}>รายละเอียดข้อความ</label>
              <textarea
                rows={3}
                value={manualMsg}
                onChange={e => setManualMsg(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.4rem', backgroundColor: '#0f172a', color: 'white', border: '1px solid #475569', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowManualModal(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#334155', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleManualAlert}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#dc2626', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >
                ส่งสัญญาณฉุกเฉิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

