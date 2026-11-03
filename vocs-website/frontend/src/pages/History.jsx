import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Download, RefreshCw, Clock, Filter, FileSpreadsheet } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AqiScaleBar, AqiBadge, Button, Card } from '../components/ui';
import { API } from '../config';

const PARAMETERS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', color: '#FF7E00' },
  { key: 'tvoc', label: 'TVOC', unit: 'ppb', color: '#2563eb' },
  { key: 'eco2', label: 'eCO₂', unit: 'ppm', color: '#7c3aed' },
  { key: 'temp', label: 'อุณหภูมิ', unit: '°C', color: '#0891b2' },
  { key: 'rh', label: 'ความชื้น', unit: '%RH', color: '#00CC66' },
];

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const daysAgo = (days) => {
  const date = new Date(`${today}T12:00:00+07:00`);
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
};

function downloadCsv(rows, parameter) {
  const csv = [
    'date,count,min,mean,max,coverage_pct',
    ...rows.map((r) => [r.date, r.count, r.min, r.mean, r.max, r.coverage_pct].join(',')),
  ].join('\n');
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
  const selected = PARAMETERS.find((p) => p.key === parameter) || PARAMETERS[0];

  useEffect(() => {
    fetch(`${API}/api/devices`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          setDevices(list);
          setBoxId((current) =>
            list.some((d) => (d.box_id || d.id) === current) ? current : list[0].box_id || list[0].id
          );
        }
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const base = API.startsWith('http') ? API : window.location.origin + API;
      const url = new URL(`${base}/api/air-quality/daily`);
      url.searchParams.set('box_id', boxId);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      url.searchParams.set('parameter', parameter);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? 'API ประวัติรายวันยังไม่พร้อมใช้งาน'
            : `โหลดข้อมูลไม่สำเร็จ (${response.status})`
        );
      }
      const result = await response.json();
      const dataRows = Array.isArray(result) ? result : result.days || [];
      setRows(dataRows);
      if (dataRows.length > 0) {
        localStorage.setItem(`voc_history_${boxId}_${parameter}`, JSON.stringify(dataRows));
      }
    } catch (e) {
      console.warn('History load error:', e);
      const cached = localStorage.getItem(`voc_history_${boxId}_${parameter}`);
      if (cached) {
        try {
          setRows(JSON.parse(cached));
          setError('');
          return;
        } catch {}
      }
      setRows([]);
      setError(e.message || 'เชื่อมต่อระบบไม่ได้');
    } finally {
      setLoading(false);
    }
  }, [boxId, from, to, parameter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#131b2e] tracking-tight flex items-center gap-2">
            <CalendarDays size={26} className="text-[#004ac6]" />
            ประวัติอากาศและสถิติรายวัน (Air Quality History)
          </h1>
          <p className="text-[13px] text-[#64748b] mt-0.5">
            สืบค้นข้อมูลย้อนหลัง ตรวจสอบแนวโน้มสารเคมี และดาวน์โหลดรายงานสรุปประจำช่วงเวลา
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={load}
            loading={loading}
            iconLeft={<RefreshCw size={14} />}
            size="sm"
          >
            รีเฟรช
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(rows, parameter)}
            disabled={!rows.length}
            iconLeft={<Download size={14} />}
          >
            ส่งออก CSV
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              อุปกรณ์ (Device)
            </label>
            <select
              value={boxId}
              onChange={(e) => setBoxId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[13px] font-semibold text-[#131b2e] outline-none focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
            >
              {(devices.length ? devices : [{ box_id: boxId }]).map((d) => {
                const id = d.box_id || d.id;
                return (
                  <option key={id} value={id}>
                    {id}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              พารามิเตอร์ (Parameter)
            </label>
            <select
              value={parameter}
              onChange={(e) => setParameter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[13px] font-semibold text-[#131b2e] outline-none focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
            >
              {PARAMETERS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              ตั้งแต่วันที่ (From)
            </label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[13px] font-semibold text-[#131b2e] outline-none focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              ถึงวันที่ (To)
            </label>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-[13px] font-semibold text-[#131b2e] outline-none focus:bg-white focus:ring-2 focus:ring-[#2563eb]/20"
            />
          </div>
        </div>
      </Card>

      {/* Air4Thai PCD Standard Scale Bar for PM2.5 */}
      {parameter === 'pm25' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span className="text-[13px] font-bold text-[#131b2e]">
              เกณฑ์เปรียบเทียบมาตรฐาน PM2.5 ตามระดับ Air4Thai (กรมควบคุมมลพิษ)
            </span>
            <span className="text-[11px] text-[#64748b]">
              มาตรฐานค่าเฉลี่ย 24 ชม. ของไทย ไม่เกิน 37.5 µg/m³
            </span>
          </div>
          <AqiScaleBar showLabels={true} compact={false} />
        </Card>
      )}

      {/* History Trend Chart Card */}
      <Card
        title={`${selected.label} — กราฟแนวโน้มรายวัน`}
        subtitle={`หน่วยวัด: ${selected.unit} · ช่วงเวลา ${from} ถึง ${to}`}
        action={
          <span className="px-2.5 py-1 rounded-full bg-[#eaedff] text-[#004ac6] text-[11px] font-semibold">
            {rows.length} วันที่บันทึก
          </span>
        }
      >
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-full text-[#64748b] text-[13px] gap-2">
              <RefreshCw size={18} className="animate-spin" />
              <span>กำลังโหลดข้อมูลย้อนหลัง...</span>
            </div>
          ) : rows.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit={` ${selected.unit}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  }}
                  formatter={(v) => [`${v} ${selected.unit}`, 'ค่าเฉลี่ย']}
                />
                <Line
                  type="monotone"
                  dataKey="mean"
                  name="ค่าเฉลี่ย"
                  stroke={selected.color}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[#64748b] text-[13px]">
              ไม่มีข้อมูลในช่วงวันที่ที่เลือก
            </div>
          )}
        </div>
      </Card>

      {/* History Data Table */}
      <Card
        title="ตารางสรุปสถิติรายวัน (Daily Aggregated Summary)"
        subtitle="คำนวณค่าต่ำสุด สูงสุด ค่าเฉลี่ย และเปอร์เซ็นต์ความสมบูรณ์ของข้อมูล"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">วันที่ (Date)</th>
                <th className="py-3 px-4 text-right">ค่าเฉลี่ย ({selected.unit})</th>
                <th className="py-3 px-4 text-right">สูงสุด (Max)</th>
                <th className="py-3 px-4 text-right">ต่ำสุด (Min)</th>
                <th className="py-3 px-4 text-center">จำนวนข้อมูล (Count)</th>
                <th className="py-3 px-4 text-center">ความสมบูรณ์ (Coverage)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.date} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#131b2e] whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#004ac6] tabular-nums">
                      {r.mean != null ? r.mean : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#ba1a1a] tabular-nums">
                      {r.max != null ? r.max : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#059669] tabular-nums">
                      {r.min != null ? r.min : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-[#64748b] tabular-nums">
                      {r.count != null ? r.count : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#059669]">
                        {r.coverage_pct != null ? `${r.coverage_pct}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#64748b]">
                    {error ? 'กำลังรอเปิดใช้ API ประวัติรายวัน' : 'ไม่มีข้อมูลให้แสดง'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
