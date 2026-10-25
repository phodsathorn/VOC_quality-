import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Download, RefreshCw } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const PARAMETERS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: '#ea580c' },
  { key: 'tvoc', label: 'TVOC', unit: 'ppb', color: '#2563eb' },
  { key: 'eco2', label: 'eCO₂', unit: 'ppm', color: '#7c3aed' },
  { key: 'temp', label: 'อุณหภูมิ', unit: '°C', color: '#0891b2' },
  { key: 'rh', label: 'ความชื้น', unit: '%RH', color: '#16a34a' },
];
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const daysAgo = (days) => {
  const date = new Date(`${today}T12:00:00+07:00`);
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
};

function downloadCsv(rows, parameter) {
  const csv = ['date,count,min,mean,max,coverage_pct', ...rows.map(r => [r.date, r.count, r.min, r.mean, r.max, r.coverage_pct].join(','))].join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  link.download = `air-quality-${parameter}-${today}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function History() {
  const [devices, setDevices] = useState([]);
  const [boxId, setBoxId] = useState('BOX-001');
  const [parameter, setParameter] = useState('pm25');
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selected = PARAMETERS.find(p => p.key === parameter) || PARAMETERS[0];

  useEffect(() => {
    fetch(`${API}/api/devices`).then(r => r.ok ? r.json() : []).then(list => {
      if (Array.isArray(list) && list.length) {
        setDevices(list);
        setBoxId(current => list.some(d => (d.box_id || d.id) === current) ? current : (list[0].box_id || list[0].id));
      }
    }).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(`${API}/api/air-quality/daily`);
      url.searchParams.set('box_id', boxId);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      url.searchParams.set('parameter', parameter);
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.status === 404 ? 'API ประวัติรายวันยังไม่พร้อมใช้งาน' : `โหลดข้อมูลไม่สำเร็จ (${response.status})`);
      const result = await response.json();
      setRows(Array.isArray(result) ? result : result.days || []);
    } catch (e) {
      setRows([]);
      setError(e.message || 'เชื่อมต่อระบบไม่ได้');
    } finally {
      setLoading(false);
    }
  }, [boxId, from, to, parameter]);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="history-page">
      <header className="history-header">
        <div><div className="history-eyebrow"><CalendarDays size={15} /> บันทึกย้อนหลัง</div><h1>คุณภาพอากาศรายวัน</h1><p>เลือกอุปกรณ์และช่วงวันที่เพื่อดูแนวโน้ม</p></div>
        <button className="history-button" onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? 'history-spin' : ''} /> รีเฟรช</button>
      </header>

      <section className="history-filters" aria-label="ตัวกรองประวัติ">
        <label>อุปกรณ์<select value={boxId} onChange={e => setBoxId(e.target.value)}>{(devices.length ? devices : [{ box_id: boxId }]).map(d => { const id = d.box_id || d.id; return <option key={id} value={id}>{id}</option>; })}</select></label>
        <label>ค่าที่ดู<select value={parameter} onChange={e => setParameter(e.target.value)}>{PARAMETERS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select></label>
        <label>ตั้งแต่<input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></label>
        <label>ถึง<input type="date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)} /></label>
        <button className="history-button history-export" onClick={() => downloadCsv(rows, parameter)} disabled={!rows.length}><Download size={16} /> CSV</button>
      </section>

      {error && <div className="history-notice"><strong>ยังเปิดข้อมูลย้อนหลังไม่ได้</strong><span>{error} · ระบบต้องมี daily history API และนโยบายเก็บข้อมูลที่รองรับช่วงวันที่ที่เลือก</span></div>}

      <section className="history-chart-card">
        <div className="history-card-heading"><div><h2>{selected.label}</h2><span>ค่าเฉลี่ยรายวัน · {selected.unit}</span></div><span className="history-record-count">{rows.length} วัน</span></div>
        <div className="history-chart">
          {loading ? <div className="history-empty"><RefreshCw className="history-spin" size={19} /> กำลังโหลดข้อมูล</div> : rows.length ? (
            <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 12, right: 18, left: 0, bottom: 2 }}><CartesianGrid stroke="#e8edf3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} /><YAxis unit={` ${selected.unit}`} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={75} /><Tooltip formatter={(v) => [`${v} ${selected.unit}`, 'เฉลี่ย']} /><Line type="monotone" dataKey="mean" name="ค่าเฉลี่ย" stroke={selected.color} strokeWidth={3} dot={{ r: 3 }} connectNulls={false} /></LineChart></ResponsiveContainer>
          ) : <div className="history-empty">ไม่มีข้อมูลในช่วงวันที่นี้</div>}
        </div>
      </section>

      <section className="history-table-card"><div className="history-card-heading"><div><h2>สรุปรายวัน</h2><span>ข้อมูลตามเวลาประเทศไทย</span></div></div><div className="table-container"><table><thead><tr><th>วันที่</th><th>เฉลี่ย ({selected.unit})</th><th>สูงสุด</th><th>ต่ำสุด</th><th>จำนวนจุด</th><th>ข้อมูลครบ</th></tr></thead><tbody>{rows.length ? rows.map(r => <tr key={r.date}><td>{r.date}</td><td>{r.mean ?? '—'}</td><td>{r.max ?? '—'}</td><td>{r.min ?? '—'}</td><td>{r.count ?? '—'}</td><td>{r.coverage_pct == null ? '—' : `${r.coverage_pct}%`}</td></tr>) : <tr><td colSpan="6" className="history-table-empty">{error ? 'กำลังรอเปิดใช้ API ประวัติรายวัน' : 'ไม่มีข้อมูลให้แสดง'}</td></tr>}</tbody></table></div></section>
      <p className="history-footnote">ข้อมูลจากเซนเซอร์โครงการเพื่อดูแนวโน้ม · สรุปรายวันต้องพิจารณาจำนวนข้อมูลที่วัดได้ของแต่ละวัน</p>
    </main>
  );
}
