import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Bell, ShieldAlert, Info, Volume2, VolumeX, Volume1 } from 'lucide-react';
import { isSoundEnabled, toggleSoundEnabled, triggerAlertSound } from '../utils/soundAlert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REFRESH_INTERVAL_MS = 10000;

const LEVEL_CONFIG = {
  Critical: { color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', icon: <ShieldAlert size={16} /> },
  High:     { color: '#92400e', bg: '#fef3c7', border: '#fcd34d', icon: <AlertTriangle size={16} /> },
  Warning:  { color: '#1e40af', bg: '#dbeafe', border: '#93c5fd', icon: <Info size={16} /> },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('All');
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

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

  async function resolveAlert(id) {
    await fetch(`${API}/api/alerts/${id}/resolve`, { method: 'PATCH' });
    fetchAlerts();
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
              <th>สถานะ</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  ไม่มีการแจ้งเตือนในขณะนี้
                </td>
              </tr>
            ) : (
              filtered.map(a => {
                const cfg = LEVEL_CONFIG[a.level] || LEVEL_CONFIG['Warning'];
                return (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{a.id}</td>
                    <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{a.time}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem',
                        fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                      }}>
                        {cfg.icon} {a.level}
                      </span>
                    </td>
                    <td>{a.message}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: a.status === 'Active' ? '#fee2e2' : '#d1fae5',
                        color: a.status === 'Active' ? '#991b1b' : '#065f46',
                      }}>
                        {a.status === 'Active' ? 'Active' : 'Resolved'}
                      </span>
                    </td>
                    <td>
                      {a.status === 'Active' && (
                        <button onClick={() => resolveAlert(a.id)} style={{
                          padding: '0.25rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer',
                          border: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 500,
                          backgroundColor: 'white', color: 'var(--text-muted)', transition: 'all 0.2s',
                        }}>
                          แก้ไขแล้ว
                        </button>
                      )}
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
