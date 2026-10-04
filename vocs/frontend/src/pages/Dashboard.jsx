import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, RefreshCw, Clock, Cpu, ChevronDown } from 'lucide-react';
import { getThresholds, getGeneral } from '../utils/settings';

const API = 'http://localhost:8000';
const REFRESH_INTERVAL_MS = 5000; // auto-refresh ทุก 5 วินาที

export default function Dashboard() {
  const [data,        setData]        = useState(null);
  const [history,     setHistory]     = useState([]);
  const [alerts,      setAlerts]      = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [timeRange,   setTimeRange]   = useState('1h');
  const [deviceList,  setDeviceList]  = useState([]);
  const [boxId,       setBoxId]       = useState(() => getGeneral().boxId || 'BOX-001');

  // อ่าน threshold จาก Settings (localStorage) ทุก render
  const thresholds = getThresholds();

  const fetchAll = useCallback(async (range = timeRange, box = boxId) => {
    setLoading(true);
    try {
      const [latestRes, historyRes, alertsRes] = await Promise.all([
        fetch(`${API}/api/dashboard/latest?box_id=${box}`).then(r => r.json()),
        fetch(`${API}/api/dashboard/history?box_id=${box}&range=${range}`).then(r => r.json()),
        fetch(`${API}/api/alerts?box_id=${box}&limit=5`).then(r => r.json()),
      ]);
      setData(latestRes);
      setHistory(historyRes);
      setAlerts(alertsRes);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, boxId]);

  // โหลด device list สำหรับ dropdown
  useEffect(() => {
    fetch(`${API}/api/devices`)
      .then(r => r.json())
      .then(d => setDeviceList(d))
      .catch(() => {});
  }, []);

  // ดึงข้อมูลครั้งแรก
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh ทุก REFRESH_INTERVAL_MS วินาที
  useEffect(() => {
    const timer = setInterval(() => fetchAll(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const handleRangeChange = (range) => {
    setTimeRange(range);
    fetchAll(range, boxId);
  };

  // เปลี่ยน Box
  const handleBoxChange = (newBox) => {
    setBoxId(newBox);
    setData(null);
    fetchAll(timeRange, newBox);
  };

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', padding: '2rem' }}>
      <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
      กำลังโหลดข้อมูล...
    </div>
  );

  const isDangerous = data.ai_detection?.prediction &&
    !['AMBIENT', null, undefined].includes(data.ai_detection.prediction);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Dashboard</h1>
          {/* Box ID selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={boxId}
              onChange={e => handleBoxChange(e.target.value)}
              style={{
                appearance: 'none', paddingRight: '1.75rem',
                padding: '0.4rem 1.75rem 0.4rem 0.75rem',
                borderRadius: '0.5rem', border: '1px solid var(--border-color)',
                backgroundColor: 'white', fontFamily: 'inherit',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                color: 'var(--primary-color)',
              }}
            >
              {deviceList.length === 0
                ? <option value={boxId}>{boxId}</option>
                : deviceList.map(d => <option key={d.id} value={d.id}>{d.id}</option>)
              }
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {lastUpdated && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Clock size={14} />
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
          <button
            onClick={() => fetchAll()}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.4rem 0.875rem', border: '1px solid var(--border-color)',
              borderRadius: '0.5rem', backgroundColor: 'white', cursor: 'pointer',
              fontSize: '0.875rem', color: 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* AI Model Status Banner */}
      {!data.ai_model_loaded && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
          backgroundColor: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e',
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
        }}>
          <Cpu size={16} />
          <span>AI Model ยังไม่ได้โหลด — ผลทำนายเป็นค่าจำลอง เทรนโมเดลก่อนเพื่อใช้งานจริง</span>
        </div>
      )}

      {/* Dangerous VOC Warning */}
      {isDangerous && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem',
          backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <AlertTriangle size={22} />
          <div>
            <div style={{ fontWeight: 700 }}>ตรวจพบสารอันตราย!</div>
            <div style={{ fontSize: '0.875rem' }}>
              AI ทำนาย: <strong>{data.ai_detection.prediction}</strong> (ความมั่นใจ {data.ai_detection.confidence}%)
            </div>
          </div>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="dashboard-grid">
        <div className={`card ${isDangerous ? '' : 'ai-card'}`}
          style={isDangerous ? { background: 'linear-gradient(135deg, #fee2e2, #fecaca)', borderColor: '#fca5a5' } : {}}>
          <div className="stat-title">AI Detection</div>
          <div className="stat-value" style={{ color: isDangerous ? '#991b1b' : undefined }}>
            {data.ai_detection?.prediction ?? '—'}
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: isDangerous ? '#b91c1c' : '#1e40af' }}>
            Confidence: <strong>{data.ai_detection?.confidence ?? '—'}%</strong>
            {!data.ai_model_loaded && <span style={{ opacity: 0.6 }}> (Mock)</span>}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-title">System Status</div>
          <div className="stat-value" style={{
            color: data.status === 'ONLINE' ? 'var(--success-color)' : 'var(--danger-color)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {data.status === 'ONLINE' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            {data.status}
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-title">Active Alerts</div>
          <div className="stat-value" style={{ color: alerts.length > 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
            {alerts.filter(a => a.status === 'Active').length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>รายการที่ยังไม่แก้ไข</div>
        </div>
      </div>

      {/* Environment */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '2rem 0 1rem' }}>Environment</h2>
      <div className="dashboard-grid">
        {[
          { label: 'Temperature', val: data.environment?.temp, unit: '°C' },
          { label: 'Humidity',    val: data.environment?.rh,   unit: '%' },
          { label: 'PM2.5', val: data.environment?.pm25, unit: 'µg/m³', warn: thresholds.pm25.warn, crit: thresholds.pm25.critical },
          { label: 'TVOC',  val: data.environment?.tvoc, unit: 'ppb',   warn: thresholds.tvoc.warn, crit: thresholds.tvoc.critical },
          { label: 'eCO2',  val: data.environment?.eco2, unit: 'ppm',   warn: thresholds.eco2.warn, crit: thresholds.eco2.critical },
        ].map(({ label, val, unit, warn, crit }) => {
          const color = crit && val >= crit ? 'var(--danger-color)'
            : warn && val >= warn ? 'var(--warning-color)'
            : 'var(--text-main)';
          return (
            <div className="card stat-card" key={label}>
              <div className="stat-title">{label}</div>
              <div><span className="stat-value" style={{ color }}>{val ?? '—'}</span>
                <span className="stat-unit">{unit}</span></div>
            </div>
          );
        })}
      </div>

      {/* E-Nose */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '2rem 0 1rem' }}>E-Nose Sensors (Raw)</h2>
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {['mq3', 'mq135', 'mq8', 'mics_co', 'no2', 'nh3'].map(key => (
          <div className="card stat-card" key={key}>
            <div className="stat-title">{key.toUpperCase()}</div>
            <div className="stat-value">{data.sensors?.[key] ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* History Chart */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '2rem 0 1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>History (TVOC & PM2.5)</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['15m', '1h', '24h'].map(r => (
            <button key={r} onClick={() => handleRangeChange(r)}
              style={{
                padding: '0.3rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer',
                border: '1px solid var(--border-color)', fontSize: '0.8rem', fontWeight: 500,
                backgroundColor: timeRange === r ? 'var(--primary-color)' : 'white',
                color: timeRange === r ? 'white' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >{r}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ height: 320 }}>
        {history.length === 0
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>ไม่มีข้อมูลในช่วงเวลานี้</div>
          : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Line yAxisId="left" type="monotone" dataKey="tvoc" stroke="var(--primary-color)" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} name="TVOC (ppb)" />
                <Line yAxisId="right" type="monotone" dataKey="pm25" stroke="var(--warning-color)" strokeWidth={2.5} dot={false} name="PM2.5 (µg)" />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Recent Alerts */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '2rem 0 1rem' }}>Recent Alerts</h2>
      <div className="card table-container">
        <table>
          <thead>
            <tr><th>เวลา</th><th>ข้อความ</th><th>ระดับ</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {alerts.length === 0
              ? <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>ไม่มีการแจ้งเตือน</td></tr>
              : alerts.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{a.time}</td>
                  <td>{a.message}</td>
                  <td><span className={`badge ${a.level === 'High' || a.level === 'Critical' ? 'offline' : 'online'}`}>{a.level}</span></td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{a.status}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Spin animation style */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
