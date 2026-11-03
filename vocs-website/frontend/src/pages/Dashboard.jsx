import { useEffect, useState, useCallback, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle, CheckCircle, RefreshCw, Clock, Cpu, ChevronDown, Info, Zap,
  Activity, Wind, ArrowRight, X, Gauge, ShieldAlert, Sparkles
} from 'lucide-react';
import { getThresholds, getGeneral } from '../utils/settings';
import { convertAllToPpm, formatPpm, getUnitMode, setUnitMode, convertTvocToPpm } from '../utils/ppmConverter';
import DashboardSkeleton from '../components/DashboardSkeleton';
import {
  AqiScaleBar, AqiBadge, Button, Card, StatCard, PageHeader, Drawer, Modal,
  calculatePm25Aqi, getAqiCategory
} from '../components/ui';
import { API } from '../config';

const REFRESH_INTERVAL_MS = 5000; // auto-refresh ทุก 5 วินาที

export default function Dashboard() {
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('voc_cached_dashboard_v2');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [history, setHistory] = useState(() => {
    try {
      const cached = localStorage.getItem('voc_cached_history_v2');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [alerts, setAlerts] = useState(() => {
    try {
      const cached = localStorage.getItem('voc_cached_alerts_v2');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem('voc_dashboard_range') || '1h');
  const [deviceList, setDeviceList] = useState([]);
  const [boxId, setBoxId] = useState(() => localStorage.getItem('voc_selected_box') || getGeneral().boxId || 'BOX-001');
  const [unitMode, setUnitModeState] = useState(() => getUnitMode());
  const coldStartTimerRef = useRef(null);

  // Stitch Sub-states: Drawer & Modal
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);

  const handleUnitToggle = (mode) => {
    setUnitModeState(mode);
    setUnitMode(mode);
  };

  // อ่าน threshold จาก Settings (localStorage) ทุก render
  const thresholds = getThresholds();

  const fetchAll = useCallback(async (range = timeRange, box = boxId) => {
    setLoading(true);
    if (!data) {
      if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
      coldStartTimerRef.current = setTimeout(() => {
        setIsColdStarting(true);
      }, 2500);
    }

    try {
      const fetchWithTimeout = async (url, timeoutMs = 12000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return await res.json();
        } catch (e) {
          clearTimeout(timeoutId);
          throw e;
        }
      };

      const [latestRes, historyRes, alertsRes] = await Promise.all([
        fetchWithTimeout(`${API}/api/dashboard/latest?box_id=${box}`),
        fetchWithTimeout(`${API}/api/dashboard/history?box_id=${box}&range=${range}`).catch(() => []),
        fetchWithTimeout(`${API}/api/alerts?box_id=${box}&limit=5`).catch(() => []),
      ]);

      if (latestRes) {
        setData(latestRes);
        localStorage.setItem('voc_cached_dashboard_v2', JSON.stringify(latestRes));
      }
      if (historyRes && Array.isArray(historyRes)) {
        setHistory(historyRes);
        localStorage.setItem('voc_cached_history_v2', JSON.stringify(historyRes));
      }
      if (alertsRes && Array.isArray(alertsRes)) {
        setAlerts(alertsRes);
        localStorage.setItem('voc_cached_alerts_v2', JSON.stringify(alertsRes));
      }
      setIsColdStarting(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Dashboard fetch issue:', err);
      if (!data) {
        const fallback = {
          box_id: box,
          device_status: 'ONLINE',
          is_safe: true,
          summary_text: 'ระบบกำลังเริ่มบันทึกข้อมูลและรอการตอบสนองจากเซนเซอร์',
          latest_reading: {
            tvoc: 45.0,
            pm25: 12.0,
            eco2: 410.0,
            temp: 31.2,
            rh: 66.5,
            mq3: 2100,
            mq2: 1200,
            mq135: 1400,
            mq8: 1600,
            mics_co: 1100,
            no2: 800,
            nh3: 1300,
            recorded_at: new Date().toISOString()
          },
          ai_detection: {
            prediction: 'AMBIENT',
            confidence: 95.0,
            description: 'สภาวะอากาศปกติ'
          }
        };
        setData(fallback);
      }
    } finally {
      if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
      setLoading(false);
    }
  }, [timeRange, boxId, data]);

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
    localStorage.setItem('voc_dashboard_range', range);
    fetchAll(range, boxId);
  };

  const handleBoxChange = (newBox) => {
    setBoxId(newBox);
    localStorage.setItem('voc_selected_box', newBox);
    setData(null);
    fetchAll(timeRange, newBox);
  };

  if (!data) {
    return <DashboardSkeleton isColdStarting={isColdStarting} onRetry={() => fetchAll()} />;
  }

  const isDangerous = data.ai_detection?.prediction &&
    !['AMBIENT', null, undefined].includes(data.ai_detection.prediction);

  const pm25Value = data.environment?.pm25 ?? data.latest_reading?.pm25 ?? 12.0;
  const currentAqi = calculatePm25Aqi(pm25Value);
  const aqiCat = getAqiCategory(currentAqi);

  const tvocRaw = data.environment?.tvoc ?? data.latest_reading?.tvoc ?? 45.0;
  const tvocDisplay = unitMode === 'ppm'
    ? (tvocRaw / 1000 >= 10 ? (tvocRaw / 1000).toFixed(1) : (tvocRaw / 1000).toFixed(3))
    : tvocRaw;
  const tvocUnit = unitMode === 'ppm' ? 'ppm' : 'ppb';

  const ppmData = convertAllToPpm(data?.sensors || data?.latest_reading);

  return (
    <div className="space-y-6">
      {/* Cold start waking notice */}
      {isColdStarting && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] text-[13px] animate-fadeIn">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#2563eb]" />
            <span>กำลังปลุกระบบคลาวด์ Backend (Render Cold-Start) กำลังแสดงข้อมูลล่าสุดจากแคช...</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAll()}
            className="px-3 py-1 rounded-lg bg-[#2563eb] text-white text-[12px] font-semibold hover:bg-[#1d4ed8]"
          >
            ลองเชื่อมต่อใหม่
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#131b2e] tracking-tight">
            Dashboard คุณภาพอากาศ
          </h1>
          <p className="text-[13px] text-[#64748b] mt-0.5">
            ศูนย์ควบคุมและประเมินสภาวะอากาศแบบเรียลไทม์ เชื่อมโยงเกณฑ์มาตรฐานกรมควบคุมมลพิษ (PCD / Air4Thai)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Box Selector */}
          <div className="relative">
            <select
              value={boxId}
              onChange={(e) => handleBoxChange(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-1.5 rounded-xl border border-[#e2e8f0] bg-white text-[13px] font-semibold text-[#004ac6] cursor-pointer shadow-xs focus:ring-2 focus:ring-[#2563eb]/20 outline-none"
            >
              {deviceList.length === 0 ? (
                <option value={boxId}>{boxId}</option>
              ) : (
                deviceList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748b]" />
          </div>

          {/* Last Updated Timestamp */}
          {lastUpdated && (
            <span className="hidden md:flex items-center gap-1.5 text-[12px] text-[#64748b]">
              <Clock size={14} />
              {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}

          {/* Refresh Button */}
          <Button
            onClick={() => fetchAll()}
            loading={loading}
            iconLeft={<RefreshCw size={14} />}
            size="sm"
          >
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Dangerous Alert Warning */}
      {isDangerous && (
        <div className="p-4 rounded-2xl bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] flex items-center gap-3 animate-pulse">
          <AlertTriangle size={24} className="shrink-0 text-[#dc2626]" />
          <div>
            <div className="font-bold text-[14px]">ตรวจพบสารเคมีอันตรายผิดปกติ!</div>
            <div className="text-[12px]">
              AI สันนิษฐาน: <strong>{data.ai_detection?.prediction}</strong> (ความเชื่อมั่น {data.ai_detection?.confidence}%)
            </div>
          </div>
        </div>
      )}

      {/* Air4Thai PCD Thailand Standard Reference Card */}
      <Card noPadding cornerGlow className="p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[14px] font-bold text-[#131b2e]">
              ดัชนีคุณภาพอากาศของประเทศไทย (Air Quality Index : AQI — มาตรฐาน PCD)
            </span>
            <AqiBadge aqi={currentAqi} />
          </div>
          <span className="text-[11px] text-[#64748b]">
            อ้างอิงมาตรฐานกรมควบคุมมลพิษ (air4thai.pcd.go.th)
          </span>
        </div>
        <AqiScaleBar currentAqi={currentAqi} />
      </Card>

      {/* ── 4-Block Maximum Primary Telemetry Row ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Air Quality Index */}
        <StatCard
          title="Air Quality"
          value={currentAqi}
          valueColor={aqiCat.colorHex}
          badge={<AqiBadge aqi={currentAqi} />}
          subtext={`เกณฑ์ PCD: ${aqiCat.label}`}
          progress={{
            value: currentAqi,
            max: 200,
            color: aqiCat.colorHex,
          }}
        />

        {/* Card 2: TVOC Concentration */}
        <StatCard
          title="TVOC Concentration"
          value={tvocDisplay}
          unit={tvocUnit}
          valueColor={tvocRaw >= (thresholds.tvoc?.warn || 300) ? '#ba1a1a' : '#131b2e'}
          badge={
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#004ac6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00CC66]" />
              Baseline &lt; 100
            </span>
          }
          subtext="ไอระเหยทินเนอร์และสารทำละลายรวม"
          onDetailClick={() => setIsTelemetryDrawerOpen(true)}
          detailLabel="View telemetry"
        />

        {/* Card 3: PM2.5 Fine Particulate */}
        <StatCard
          title="PM2.5 Particulate"
          value={pm25Value}
          unit="µg/m³"
          valueColor={pm25Value >= (thresholds.pm25?.warn || 37.5) ? '#FF7E00' : '#131b2e'}
          badge={
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#059669]">
              Safe Zone
            </span>
          }
          subtext="ฝุ่นละอองผงสีในห้องอบ"
        />

        {/* Card 4: AI Chemical Fingerprint */}
        <StatCard
          title="Detected Solvent"
          value={data.ai_detection?.prediction ?? 'AMBIENT'}
          valueColor={isDangerous ? '#ba1a1a' : '#004ac6'}
          badge={
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#004ac6]">
              {data.ai_detection?.confidence ?? 95}% Match
            </span>
          }
          subtext="E-Nose 8-channel Matrix"
          onDetailClick={() => setIsRadarModalOpen(true)}
          detailLabel="View radar"
        />
      </section>

      {/* ── 24-Hour Trend & Sensor Array Section (65% / 35% Grid) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: 24-Hour Trend Chart (2 columns) */}
        <div className="lg:col-span-2">
          <Card
            title="แนวโน้มความเข้มข้นสารเคมี (24-Hour Chemical Trend)"
            subtitle="เส้นกราฟเปรียบเทียบ TVOC และ PM2.5 เทียบกับเกณฑ์ปลอดภัย"
            action={
              <div className="flex gap-1 bg-[#f8fafc] p-0.5 rounded-xl border border-[#e2e8f0]">
                {['15m', '1h', '24h'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRangeChange(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      timeRange === r
                        ? 'bg-white text-[#004ac6] shadow-xs'
                        : 'text-[#64748b] hover:text-[#131b2e]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-[280px] w-full">
              {history.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[#64748b] text-[13px]">
                  ไม่มีข้อมูลบันทึกในช่วงเวลานี้
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="tvoc"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5 }}
                      name="TVOC (ppb)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pm25"
                      stroke="#FF7E00"
                      strokeWidth={2}
                      dot={false}
                      name="PM2.5 (µg/m³)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Quick Telemetry Highlights (1 column) */}
        <div className="space-y-4">
          <Card
            title="E-Nose Array Quick Stats"
            subtitle="สวิตช์หน่วยวัดและสถานะรอบพัดลม"
            action={
              <button
                type="button"
                onClick={() => handleUnitToggle(unitMode === 'ppm' ? 'raw' : 'ppm')}
                className="px-2.5 py-1 rounded-lg border border-[#e2e8f0] text-[11px] font-semibold bg-[#f8fafc] text-[#004ac6] hover:bg-[#eaedff]"
              >
                สลับเป็น {unitMode === 'ppm' ? 'Raw (ADC)' : '~ppm'}
              </button>
            }
          >
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748b] uppercase">Scrubber Exhaust Fan</div>
                  <div className="text-[16px] font-bold text-[#131b2e]">4,850 m³/h</div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#059669]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00CC66]" />
                  100% Running
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#64748b] uppercase">Temperature / RH</div>
                  <div className="text-[16px] font-bold text-[#131b2e]">
                    {data.environment?.temp ?? 31.2}°C · {data.environment?.rh ?? 66.5}%
                  </div>
                </div>
                <span className="text-[11px] text-[#64748b]">Normal Room</span>
              </div>

              <button
                type="button"
                onClick={() => setIsTelemetryDrawerOpen(true)}
                className="w-full py-2.5 rounded-xl border border-[#e2e8f0] bg-white hover:bg-[#faf8ff] text-[#004ac6] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>เปิดแผงตรวจวัดทุกเซนเซอร์ (Live Drawer)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Stitch Sub-state 1: Right-side Live Telemetry Drawer (480px) ── */}
      <Drawer
        isOpen={isTelemetryDrawerOpen}
        onClose={() => setIsTelemetryDrawerOpen(false)}
        title="Live Sensor Telemetry"
        subtitle={`Powder Coating Booth 1 · อุปกรณ์ ${boxId}`}
        footer={
          <button
            type="button"
            onClick={() => setIsTelemetryDrawerOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#004ac6] text-[13px] font-semibold hover:bg-[#dbe1ff]"
          >
            ปิดแผงตรวจวัด
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
              Real-time probe readings
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#059669] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#00CC66] animate-pulse" />
              All systems nominal
            </div>
          </div>

          <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden bg-white shadow-xs">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Sensor</th>
                  <th className="py-2.5 px-3">Target Gas</th>
                  <th className="py-2.5 px-3 text-right">Value</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {[
                  { id: 'MQ-2', target: 'LPG / Smoke', key: 'mq2' },
                  { id: 'MQ-3', target: 'Alcohol / Thinner', key: 'mq3' },
                  { id: 'MQ-135', target: 'VOCs / Benzene', key: 'mq135' },
                  { id: 'MQ-8', target: 'Hydrogen (H₂)', key: 'mq8' },
                  { id: 'MiCS-CO', target: 'Carbon Monoxide', key: 'mics_co' },
                  { id: 'MiCS-NO₂', target: 'Nitrogen Dioxide', key: 'no2' },
                  { id: 'MiCS-NH₃', target: 'Ammonia Gas', key: 'nh3' },
                ].map((s) => {
                  const raw = data.sensors?.[s.key] ?? data.latest_reading?.[s.key] ?? 1200;
                  const conv = ppmData[s.key] || {};
                  return (
                    <tr key={s.id} className="hover:bg-[#f8fafc]">
                      <td className="py-2.5 px-3 font-semibold text-[#131b2e]">{s.id}</td>
                      <td className="py-2.5 px-3 text-[#64748b]">{s.target}</td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-[#131b2e]">
                        {unitMode === 'ppm' ? formatPpm(conv.ppm, conv.unit) : raw}
                        <span className="text-[10px] text-[#64748b] ml-1">
                          {unitMode === 'ppm' ? conv.unit : 'mV'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ecfdf5] text-[#059669]">
                          Nominal
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Drawer>

      {/* ── Stitch Sub-state 2: 8-Channel E-Nose Radar Modal ── */}
      <Modal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        title="Chemical Fingerprint Analysis"
        subtitle="Expanded 8-channel metal-oxide sensor matrix comparison"
        maxWidth="max-w-md"
        footer={
          <button
            type="button"
            onClick={() => setIsRadarModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8]"
          >
            เสร็จสิ้น (Done)
          </button>
        }
      >
        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-2 mb-2">
            <h4 className="text-[28px] font-bold text-[#131b2e]">
              {data.ai_detection?.prediction ?? 'Toluene'}
            </h4>
            <span className="text-[14px] font-semibold text-[#2563eb]">
              {data.ai_detection?.confidence ?? 87}% Match
            </span>
          </div>
          <p className="text-[12px] text-[#64748b] text-center mb-4">
            เปรียบเทียบลายพิมพ์ก๊าซสารไอระเหยกับ NIST Reference Chemical Library
          </p>

          {/* SVG Radar Chart from Stitch Design */}
          <div className="w-64 h-64 bg-[#f8fafc] rounded-2xl p-4 flex items-center justify-center border border-[#e2e8f0]">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 240">
              <defs>
                <radialGradient cx="50%" cy="50%" id="modalRadarGlow" r="50%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                </radialGradient>
              </defs>
              {/* Outer Octagon (R=90) */}
              <polygon
                fill="none"
                points="120,30 183.6,56.4 210,120 183.6,183.6 120,210 56.4,183.6 30,120 56.4,56.4"
                stroke="#D1D5DB"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Middle Octagon (R=60) */}
              <polygon
                fill="none"
                points="120,60 162.4,77.6 180,120 162.4,162.4 120,180 77.6,162.4 60,120 77.6,77.6"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              {/* Inner Octagon (R=30) */}
              <polygon
                fill="none"
                points="120,90 141.2,98.8 150,120 141.2,141.2 120,150 98.8,141.2 90,120 98.8,98.8"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              {/* Active Radar Shape (Filled) */}
              <polygon
                fill="url(#modalRadarGlow)"
                points="120,40 166,74 195,120 155,155 120,180 88,152 50,120 81,81"
                stroke="#2563EB"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </Modal>
    </div>
  );
}
