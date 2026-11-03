import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Bell, ShieldAlert, Info, Volume2, VolumeX, Volume1, Clock, AlertOctagon } from 'lucide-react';
import { isSoundEnabled, toggleSoundEnabled, triggerAlertSound } from '../utils/soundAlert';
import { useAuth } from '../context/AuthContext';
import { API } from '../config';
const REFRESH_INTERVAL_MS = 10000;

const LEVEL_CONFIG = {
  Critical: { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', icon: <ShieldAlert size={16} /> },
  High:     { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', icon: <AlertTriangle size={16} /> },
  Warning:  { color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', icon: <Info size={16} /> },
};

export default function Alerts() {
  const { user, authHeaders } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('All');
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const handleToggle = (e) => setSoundOn(e.detail.enabled);
    window.addEventListener('voc_sound_toggle', handleToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleToggle);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/alerts?limit=100`).then(r => r.json()),
        fetch(`${API}/api/alerts/summary`).then(r => r.json()),
      ]);
      setAlerts(alertsRes);
      setSummary(summaryRes);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => {
    const t = setInterval(fetchAlerts, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchAlerts]);

  async function handleWorkflow(id, step) {
    if (user && user.role === 'viewer') {
      setErrorMsg('🔒 สิทธิ์ไม่เพียงพอ: บทบาท Viewer ดูข้อมูลได้อย่างเดียว');
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }
    try {
      const res = await fetch(`${API}/api/alerts/${id}/${step}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ note: `Updated by ${user?.username || 'operator'}` })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed');
      }
      fetchAlerts();
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  }

  async function resolveAlert(id, level) {
    handleWorkflow(id, 'resolve');
  }

  const filtered = filter === 'All' ? alerts : alerts.filter(a => a.status === filter);
  const activeCount = alerts.filter(a => a.status === 'Active').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={24} />
          Alerts
          {activeCount > 0 && (
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem',
              borderRadius: '999px', backgroundColor: 'var(--danger-color)', color: 'white',
            }}>{activeCount}</span>
          )}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {lastUpdated && <span>อัปเดต {lastUpdated.toLocaleTimeString('th-TH')}</span>}
          <button onClick={fetchAlerts} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.4rem 0.875rem', border: '1px solid var(--border-color)',
            borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.875rem',
          }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            รีเฟรช
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600,
          marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <ShieldAlert size={18} /> {errorMsg}
        </div>
      )}

      {/* Sound Settings & Test Bar */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              const next = toggleSoundEnabled();
              setSoundOn(next);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.9rem', borderRadius: '0.5rem',
              border: `1px solid ${soundOn ? '#86efac' : '#cbd5e1'}`,
              backgroundColor: soundOn ? '#dcfce7' : '#f1f5f9',
              color: soundOn ? '#166534' : '#475569',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {soundOn ? 'เสียงแจ้งเตือน: เปิดอยู่' : 'เสียงแจ้งเตือน: ปิดอยู่'}
          </button>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            เสียงจะดังอัตโนมัติเมื่อตรวจพบ Alert ใหม่ (มี Cooldown 10 วิ ป้องกันเสียงดังรัว)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>ทดสอบเสียง:</span>
          <button
            onClick={() => triggerAlertSound('Warning', true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.35rem 0.75rem', borderRadius: '0.375rem',
              border: '1px solid #93c5fd', backgroundColor: '#eff6ff',
              color: '#1d4ed8', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Volume1 size={14} /> โทน Warning
          </button>
          <button
            onClick={() => triggerAlertSound('Critical', true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.35rem 0.75rem', borderRadius: '0.375rem',
              border: '1px solid #fca5a5', backgroundColor: '#fef2f2',
              color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ShieldAlert size={14} /> โทน Critical
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => (
          <div className="card" key={level} style={{ borderColor: cfg.border, backgroundColor: cfg.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cfg.color, marginBottom: '0.5rem' }}>
              {cfg.icon}
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{level}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: cfg.color }}>
              {summary[level] ?? 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: cfg.color, opacity: 0.8 }}>รายการที่ยังเปิดอยู่</div>
          </div>
        ))}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', marginBottom: '0.5rem' }}>
            <CheckCircle size={16} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Resolved</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-color)' }}>
            {alerts.filter(a => a.status === 'Resolved').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>แก้ไขแล้ว</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['All', 'Active', 'Resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500,
            border: '1px solid var(--border-color)', fontSize: '0.875rem', transition: 'all 0.2s',
            backgroundColor: filter === f ? 'var(--primary-color)' : 'white',
            color: filter === f ? 'white' : 'var(--text-muted)',
          }}>{f} {f === 'Active' && activeCount > 0 ? `(${activeCount})` : ''}</button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>เวลา</th>
              <th>ระดับ</th>
              <th>ข้อความแจ้งเตือน</th>
              <th>กำหนดเวลา SLA</th>
              <th>สถานะขั้นตอน (5-Step)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  ไม่มีการแจ้งเตือนในขณะนี้
                </td>
              </tr>
            ) : (
              filtered.map(a => {
                const cfg = LEVEL_CONFIG[a.level] || LEVEL_CONFIG['Warning'];
                const isOverdue = (a.remaining_sla_seconds <= 0 || a.is_sla_breached) && a.status === 'Active';
                const remMin = Math.floor(Math.max(0, a.remaining_sla_seconds || 0) / 60);
                const remSec = Math.max(0, a.remaining_sla_seconds || 0) % 60;
                const formattedRem = `${String(remMin).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;

                return (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{a.id}</td>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{a.time}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem',
                        fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      }}>
                        {cfg.icon} {a.level}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{a.message}</td>
                    <td>
                      {a.status === 'Active' ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                          backgroundColor: isOverdue ? '#fee2e2' : '#fef3c7',
                          color: isOverdue ? '#dc2626' : '#b45309',
                          fontFamily: 'monospace'
                        }}>
                          {isOverdue ? <AlertOctagon size={13} /> : <Clock size={13} />}
                          <span>{isOverdue ? 'เกินกำหนด SLA' : formattedRem}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          รับทราบแล้ว
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                        backgroundColor: a.status === 'Active' ? '#fee2e2' :
                                         a.status === 'Acknowledged' ? '#fef3c7' :
                                         a.status === 'In progress' ? '#eff6ff' :
                                         a.status === 'Resolved' ? '#ccfbf1' : '#dcfce7',
                        color: a.status === 'Active' ? '#dc2626' :
                               a.status === 'Acknowledged' ? '#b45309' :
                               a.status === 'In progress' ? '#2563eb' :
                               a.status === 'Resolved' ? '#0f766e' : '#15803d',
                      }}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {a.status === 'Active' && (
                          <button
                            onClick={() => handleWorkflow(a.id, 'acknowledge')}
                            style={{
                              padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer',
                              border: '1px solid #f59e0b', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: '#fffbeb', color: '#b45309'
                            }}
                          >
                            รับทราบ
                          </button>
                        )}
                        {(a.status === 'Active' || a.status === 'Acknowledged') && (
                          <button
                            onClick={() => handleWorkflow(a.id, 'in-progress')}
                            style={{
                              padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer',
                              border: '1px solid #3b82f6', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: '#eff6ff', color: '#1d4ed8'
                            }}
                          >
                            เริ่มตรวจ
                          </button>
                        )}
                        {a.status !== 'Resolved' && a.status !== 'Verified' && (
                          <button
                            onClick={() => handleWorkflow(a.id, 'resolve')}
                            style={{
                              padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer',
                              border: '1px solid #10b981', fontSize: '0.75rem', fontWeight: 600,
                              backgroundColor: '#ecfdf5', color: '#047857'
                            }}
                          >
                            แก้ไขแล้ว
                          </button>
                        )}
                        {a.status === 'Resolved' && (
                          <button
                            onClick={() => handleWorkflow(a.id, 'verify')}
                            style={{
                              padding: '0.25rem 0.6rem', borderRadius: '4px', cursor: 'pointer',
                              border: '1px solid #8b5cf6', fontSize: '0.75rem', fontWeight: 700,
                              backgroundColor: '#f5f3ff', color: '#6d28d9'
                            }}
                          >
                            วิศวกรยืนยัน
                          </button>
                        )}
                        {a.status === 'Verified' && (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                            ✓ ปิดสมบูรณ์
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
