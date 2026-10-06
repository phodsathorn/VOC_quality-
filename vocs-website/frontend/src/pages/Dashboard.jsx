import { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CheckCircle, RefreshCw, Clock, Cpu, ChevronDown, Info } from 'lucide-react';
import { getThresholds, getGeneral } from '../utils/settings';
import { convertAllToPpm, formatPpm, getUnitMode, setUnitMode } from '../utils/ppmConverter';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
  const [unitMode,    setUnitModeState] = useState(() => getUnitMode());

  const handleUnitToggle = (mode) => {
    setUnitModeState(mode);
    setUnitMode(mode);
  };

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
      <div style={{ margin: '2rem 0 1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>สภาพแวดล้อมทั่วไป (Environment)</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ตรวจวัดอุณหภูมิ ความชื้น ปริมาณฝุ่นละออง และก๊าซพื้นฐานในห้องพ่นสี
        </p>
      </div>

      <div className="dashboard-grid">
        {[
          { 
            key: 'temp', 
            title: 'Temperature', 
            thName: 'อุณหภูมิห้อง', 
            desc: 'สภาวะความร้อนภายในห้อง', 
            val: data.environment?.temp, 
            unit: '°C' 
          },
          { 
            key: 'rh', 
            title: 'Humidity', 
            thName: 'ความชื้นสัมพัทธ์', 
            desc: 'ความชื้นในบรรยากาศ', 
            val: data.environment?.rh, 
            unit: '%RH' 
          },
          { 
            key: 'pm25', 
            title: 'PM2.5', 
            thName: 'ฝุ่นละอองขนาดเล็ก', 
            desc: 'ฝุ่นละอองและละอองผงสี', 
            val: data.environment?.pm25, 
            unit: 'µg/m³', 
            warn: thresholds.pm25.warn, 
            crit: thresholds.pm25.critical 
          },
          { 
            key: 'tvoc', 
            title: 'TVOC (CCS811)', 
            thName: 'สารอินทรีย์ระเหยรวม', 
            desc: 'ไอระเหยทินเนอร์ สี สารทำละลาย', 
            val: unitMode === 'ppm'
              ? (data.environment?.tvoc != null ? (data.environment.tvoc / 1000 >= 10 ? (data.environment.tvoc / 1000).toFixed(1) : (data.environment.tvoc / 1000).toFixed(3)) : '—')
              : data.environment?.tvoc, 
            unit: unitMode === 'ppm' ? 'ppm' : 'ppb', 
            warn: unitMode === 'ppm' ? (thresholds.tvoc.warn / 1000) : thresholds.tvoc.warn, 
            crit: unitMode === 'ppm' ? (thresholds.tvoc.critical / 1000) : thresholds.tvoc.critical 
          },
          { 
            key: 'eco2', 
            title: 'eCO₂ (CCS811)', 
            thName: 'คาร์บอนไดออกไซด์เทียบเท่า', 
            desc: 'ก๊าซจากการหายใจ/การถ่ายเทอากาศ', 
            val: data.environment?.eco2, 
            unit: 'ppm', 
            warn: thresholds.eco2.warn, 
            crit: thresholds.eco2.critical 
          },
        ].map(({ key, title, thName, desc, val, unit, warn, crit }) => {
          const color = crit && val >= crit ? 'var(--danger-color)'
            : warn && val >= warn ? 'var(--warning-color)'
            : 'var(--text-main)';
          return (
            <div className="card stat-card" key={key} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="stat-title" style={{ fontWeight: 600 }}>{title}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 500 }}>{thName}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{desc}</div>
              </div>
              <div style={{ marginTop: '0.25rem' }}>
                <span className="stat-value" style={{ color }}>{val ?? '—'}</span>
                <span className="stat-unit" style={{ marginLeft: '0.25rem', fontSize: '0.85rem' }}>{unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* E-Nose */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', margin: '2rem 0 1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>โครงข่ายจมูกอิเล็กทรอนิกส์ (E-Nose Sensor Array)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            เซนเซอร์ตรวจจับกลิ่นและจำแนกกลุ่มก๊าซมลพิษเฉพาะทาง สำหรับส่งให้โมเดล AI ประมวลผล
          </p>
        </div>

        {/* Unit Selector Toggle */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: '#f1f5f9',
          padding: '3px',
          borderRadius: '0.5rem',
          border: '1px solid var(--border-color)',
        }}>
          <button
            type="button"
            onClick={() => handleUnitToggle('raw')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: unitMode === 'raw' ? 'white' : 'transparent',
              color: unitMode === 'raw' ? 'var(--primary-color)' : 'var(--text-muted)',
              boxShadow: unitMode === 'raw' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ADC / mV (Raw)
          </button>
          <button
            type="button"
            onClick={() => handleUnitToggle('ppm')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              backgroundColor: unitMode === 'ppm' ? 'var(--primary-color)' : 'transparent',
              color: unitMode === 'ppm' ? 'white' : 'var(--text-muted)',
              boxShadow: unitMode === 'ppm' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ~ppm (ความเข้มข้น)
          </button>
        </div>
      </div>

      {unitMode === 'ppm' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 0.85rem', marginBottom: '1.25rem',
          borderRadius: '0.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#166534', fontSize: '0.8rem'
        }}>
          <Info size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>โหมดแปลงค่า (~ppm):</strong> คำนวณจาก Power-Law Curve ตาม Datasheet เทียบกับจุดอ้างอิง Clean Air Baseline (R₀) | เป็นค่าประมาณการตามก๊าซอ้างอิงเพื่อดูแนวโน้ม
          </span>
        </div>
      )}

      {(() => {
        const ppmData = convertAllToPpm(data?.sensors);
        const isPpm = unitMode === 'ppm';

        return (
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {[
              { key: 'mq2', title: 'MQ-2', target: 'ควันและก๊าซไวไฟ', sub: 'Smoke / LPG / Propane' },
              { key: 'mq3', title: 'MQ-3', target: 'ไอแอลกอฮอล์ / ทินเนอร์', sub: 'Alcohol / Solvent Vapors' },
              { key: 'mq135', title: 'MQ-135', target: 'คุณภาพอากาศ / เบนซีน', sub: 'Air Quality / Benzene / NH₃' },
              { key: 'mq8', title: 'MQ-8', target: 'ก๊าซไฮโดรเจน', sub: 'Hydrogen Gas (H₂)' },
              { key: 'mics_co', title: 'MiCS-6814 (CO)', target: 'คาร์บอนมอนอกไซด์', sub: 'Carbon Monoxide (เผาไหม้)' },
              { key: 'no2', title: 'MiCS-6814 (NO₂)', target: 'ไนโตรเจนไดออกไซด์', sub: 'Nitrogen Dioxide (ไอเสีย/เตาอบ)' },
              { key: 'nh3', title: 'MiCS-6814 (NH₃)', target: 'แอมโมเนียและกลิ่นฉุน', sub: 'Ammonia Gas' },
            ].map(({ key, title, target, sub }) => {
              const rawVal = data.sensors?.[key];
              const conv = ppmData[key] || {};
              const displayVal = isPpm ? formatPpm(conv.ppm, conv.unit) : (rawVal ?? '—');
              const displayUnit = isPpm ? conv.unit : conv.rawUnit;

              return (
                <div className="card stat-card" key={key} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-color)' }}>{title}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px',
                        backgroundColor: isPpm ? '#ecfdf5' : '#f1f5f9',
                        color: isPpm ? '#059669' : '#475569',
                        fontWeight: 600,
                      }}>
                        {isPpm ? `${conv.refGas}` : displayUnit}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {isPpm ? (conv.gasLabelTh || target) : target}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {sub}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <div className="stat-value" style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: isPpm && conv.ppm > 0 ? '#047857' : 'inherit'
                      }}>
                        {displayVal}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{displayUnit}</span>
                    </div>
                    {isPpm && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        ดิบ: <strong>{rawVal ?? '—'}</strong> {conv.rawUnit} {conv.ratio ? `· Rs/R₀: ${conv.ratio}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

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
