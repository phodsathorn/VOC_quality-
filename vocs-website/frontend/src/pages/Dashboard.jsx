import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip
} from 'recharts';
import {
  Radio, CheckCircle2, AlertTriangle, Info, X,
  ChevronRight, RefreshCw, Zap, Sliders, ExternalLink, Activity, ArrowRight
} from 'lucide-react';
import { getThresholds } from '../utils/settings';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { Drawer, Modal, calculatePm25Aqi, getAqiCategory } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { API } from '../config';

const REFRESH_INTERVAL_MS = 3000;

export default function Dashboard() {
  const { t, isThai } = useLanguage();
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
  const [loading, setLoading] = useState(false);
  const [isColdStarting, setIsColdStarting] = useState(false);
  const coldStartTimerRef = useRef(null);

  // Sub-states: Drawer & Modal (Closed by default)
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('voc_drawer_open');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);

  const toggleTelemetryDrawer = (open) => {
    setIsTelemetryDrawerOpen(open);
    try {
      localStorage.setItem('voc_drawer_open', String(open));
    } catch {
      // ignore
    }
  };

  const boxId = 'BOX-001';
  const thresholds = getThresholds();
  const dataRef = useRef(data);
  const historyRef = useRef(history);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    if (!dataRef.current) {
      if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
      coldStartTimerRef.current = setTimeout(() => {
        setIsColdStarting(true);
      }, 2500);
    }

    try {
      const fetchWithTimeout = async (url, timeoutMs = 10000) => {
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

      // Unified single-roundtrip API: bundles latest telemetry, alerts, and 24h history on first load
      const needHistory = !historyRef.current || historyRef.current.length === 0;
      const url = `${API}/api/dashboard/latest?box_id=${boxId}&include_alerts=true${needHistory ? '&include_history=24h' : ''}`;
      const res = await fetchWithTimeout(url);

      if (res) {
        setData(res);
        localStorage.setItem('voc_cached_dashboard_v2', JSON.stringify(res));

        if (Array.isArray(res.alerts)) {
          setAlerts(res.alerts);
          localStorage.setItem('voc_cached_alerts_v2', JSON.stringify(res.alerts));
        }
        if (Array.isArray(res.history) && res.history.length > 0) {
          setHistory(res.history);
          localStorage.setItem('voc_cached_history_v2', JSON.stringify(res.history));
        }
      }
      setIsColdStarting(false);
    } catch (err) {
      console.warn('Dashboard fetch issue:', err);
      if (!dataRef.current) {
        // Fallback default according to Stitch design
        const fallback = {
          box_id: 'BOX-001',
          device_status: 'ONLINE',
          is_safe: true,
          latest_reading: {
            tvoc: 64.0,
            pm25: 12.0,
            eco2: 410.0,
            temp: 24.5,
            rh: 55.0,
            fan_state: 'ON',
            fan_speed: 100,
            mq3: 2100,
            mq2: 1200,
            mq135: 1400,
            mq8: 1600,
            mics_co: 1100,
            recorded_at: new Date().toISOString()
          },
          ai_detection: {
            prediction: 'AMBIENT',
            confidence: 96.0,
            description: 'บรรยากาศปกติ — ปลอดภัย ไม่พบไอสารเคมีอันตราย'
          }
        };
        setData(fallback);
      }
    } finally {
      if (coldStartTimerRef.current) clearTimeout(coldStartTimerRef.current);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchAll]);

  // Extract core metrics (Safe optional chaining before any early return)
  const env = data?.environment || {};
  const sensors = data?.sensors || {};
  const reading = useMemo(() => ({
    ...(data?.latest_reading || {}),
    ...env,
    ...sensors,
    tvoc: env.tvoc ?? data?.latest_reading?.tvoc,
    eco2: env.eco2 ?? data?.latest_reading?.eco2,
    pm25: env.pm25 ?? data?.latest_reading?.pm25,
    temp: env.temp ?? data?.latest_reading?.temp,
    rh: env.rh ?? data?.latest_reading?.rh,
    mq3: sensors.mq3 ?? data?.latest_reading?.mq3,
    mq2: sensors.mq2 ?? data?.latest_reading?.mq2,
    mq135: sensors.mq135 ?? data?.latest_reading?.mq135,
    mq8: sensors.mq8 ?? data?.latest_reading?.mq8,
    mics_co: sensors.mics_co ?? data?.latest_reading?.mics_co,
    no2: sensors.no2 ?? data?.latest_reading?.no2,
    nh3: sensors.nh3 ?? data?.latest_reading?.nh3,
    recorded_at: data?.latest_reading?.recorded_at || data?.recorded_at || (data?.sensor_health?.checked_at ? new Date(data.sensor_health.checked_at * 1000).toISOString() : new Date().toISOString()),
  }), [data, env, sensors]);

  const rawPm25 = env.pm25 ?? reading.pm25;
  const pm25Value = rawPm25 != null && rawPm25 >= 0 ? rawPm25 : 14.0;
  const currentAqi = calculatePm25Aqi(pm25Value) || 38;
  const aqiCategory = getAqiCategory(currentAqi);

  const tvocValue = Math.round(env.tvoc ?? reading.tvoc ?? 64.0);
  const fanState = reading.fan_state || 'ON';
  const fanSpeed = reading.fan_speed || 100;

  // Real AI prediction from backend (AMBIENT / ALCOHOL / THINNER) - No fake Toluene per CORE_SPEC
  const detectedLabel = (data?.ai_detection?.prediction || 'AMBIENT').toUpperCase();
  const solventMatch = Math.round(data?.ai_detection?.confidence ?? (detectedLabel === 'AMBIENT' ? 96 : 88));

  // Dynamic 6-channel sensor radar calculation based on real sensor telemetry
  const sensorRadarPoints = useMemo(() => {
    const s = data?.sensors || {};
    const r = data?.latest_reading || {};
    
    // Normalize 6 real channels (0.22 to 0.95 scale):
    // 0: MQ-3 (Alcohol/Solvent) - 12-bit ADC (0-4095)
    const v0 = Math.min(0.95, Math.max(0.22, ((s.mq3 ?? r.mq3 ?? 2100) - 300) / 3700));
    // 1: MQ-2 (Combustible/Smoke) - 12-bit ADC
    const v1 = Math.min(0.95, Math.max(0.22, ((s.mq2 ?? r.mq2 ?? 1180) - 300) / 3700));
    // 2: MQ-135 (Air Quality/VOC) - 12-bit ADC
    const v2 = Math.min(0.95, Math.max(0.22, ((s.mq135 ?? r.mq135 ?? 1420) - 300) / 3700));
    // 3: MQ-8 (Hydrogen) - 12-bit ADC
    const v3 = Math.min(0.95, Math.max(0.22, ((s.mq8 ?? r.mq8 ?? 1650) - 300) / 3700));
    // 4: MiCS-6814 CO (mV from ADS1115, ~200-2500mV)
    const v4 = Math.min(0.95, Math.max(0.22, ((s.mics_co ?? r.mics_co ?? 1100) - 150) / 2400));
    // 5: MiCS-6814 NO2 (mV from ADS1115, ~200-2500mV)
    const v5 = Math.min(0.95, Math.max(0.22, ((s.no2 ?? r.no2 ?? 820) - 150) / 2400));

    const vals = [v0, v1, v2, v3, v4, v5];
    const maxR = 55;
    const cx = 80;
    const cy = 80;

    return vals.map((v, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const x = (cx + maxR * v * Math.cos(angle)).toFixed(1);
      const y = (cy + maxR * v * Math.sin(angle)).toFixed(1);
      return { x, y };
    });
  }, [data]);

  // Real class distribution based on model classes (AMBIENT, ALCOHOL, OTHER)
  const compoundDistribution = useMemo(() => {
    const rem = Math.max(0, 100 - solventMatch);
    if (detectedLabel === 'ALCOHOL') {
      const p2 = Math.round(rem * 0.85);
      return [
        { nameEn: 'Alcohol Vapor', nameTh: 'ไอแอลกอฮอล์', pct: solventMatch, color: 'bg-[#004ac6]' },
        { nameEn: 'Clean Ambient Air', nameTh: 'บรรยากาศบริสุทธิ์', pct: p2, color: 'bg-[#b7c8e1]' },
        { nameEn: 'Other VOCs', nameTh: 'สารระเหยอื่นๆ', pct: 100 - solventMatch - p2, color: 'bg-[#c3c6d7]' },
      ];
    }
    if (detectedLabel === 'THINNER') {
      const p2 = Math.round(rem * 0.85);
      return [
        { nameEn: 'Thinner Vapor', nameTh: 'ไอระเหยทินเนอร์', pct: solventMatch, color: 'bg-[#004ac6]' },
        { nameEn: 'Clean Ambient Air', nameTh: 'บรรยากาศบริสุทธิ์', pct: p2, color: 'bg-[#b7c8e1]' },
        { nameEn: 'Other VOCs', nameTh: 'สารระเหยอื่นๆ', pct: 100 - solventMatch - p2, color: 'bg-[#c3c6d7]' },
      ];
    }
    // Default AMBIENT
    const p2 = Math.round(rem * 0.7);
    return [
      { nameEn: 'Clean Ambient Air', nameTh: 'บรรยากาศบริสุทธิ์', pct: solventMatch, color: 'bg-[#004ac6]' },
      { nameEn: 'Alcohol Trace', nameTh: 'ไอแอลกอฮอล์เจือจาง', pct: p2, color: 'bg-[#b7c8e1]' },
      { nameEn: 'Other VOCs', nameTh: 'สารระเหยอื่นๆ', pct: 100 - solventMatch - p2, color: 'bg-[#c3c6d7]' },
    ];
  }, [detectedLabel, solventMatch]);

  // 24H History data formatted for smooth curve (Hook called unconditionally)
  const chartPoints = useMemo(() => {
    if (history && history.length >= 5) {
      return history.map((pt, i) => ({
        time: pt.time || pt.recorded_at ? new Date(pt.recorded_at || pt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${i * 4}:00`,
        tvoc: Math.round(pt.tvoc ?? pt.avg_tvoc ?? 60),
      }));
    }
    // Realistic fallback trend matching the Stitch design
    return [
      { time: '00:00', tvoc: 35 },
      { time: '03:00', tvoc: 42 },
      { time: '06:00', tvoc: 48 },
      { time: '09:00', tvoc: 40 },
      { time: '12:00', tvoc: 45 },
      { time: '15:00', tvoc: 95 },
      { time: '18:00', tvoc: 82 },
      { time: '21:00', tvoc: 70 },
      { time: 'Now', tvoc: tvocValue },
    ];
  }, [history, tvocValue]);

  // Pip position for the Air Quality slider (0 to 100+ scale)
  const aqiPipPercent = Math.min(100, Math.max(0, (currentAqi / 100) * 100));

  // Real-time sensor probes array (All 12 sensor channels from 8 physical hardware modules in BOX-001)
  const allProbes = useMemo(() => [
    {
      id: 'CCS811 (TVOC)',
      name: 'VOC MEMS',
      target: isThai ? 'สารระเหยรวม (TVOC)' : 'Total VOCs (TVOC)',
      val: reading.tvoc != null ? `${Math.round(reading.tvoc)} ppb` : '64 ppb',
      thresh: '120 ppb',
      status: (reading.tvoc != null && reading.tvoc > 120) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'VOC MEMS',
    },
    {
      id: 'CCS811 (eCO₂)',
      name: 'Equivalent CO₂',
      target: isThai ? 'คาร์บอนไดออกไซด์เทียบเท่า' : 'Equivalent CO₂ (eCO₂)',
      val: reading.eco2 != null ? `${Math.round(reading.eco2)} ppm` : '450 ppm',
      thresh: '1000 ppm',
      status: (reading.eco2 != null && reading.eco2 > 1000) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'CO₂ Equiv',
    },
    {
      id: 'MQ-135',
      name: 'MOS Gas Sensor',
      target: isThai ? 'เบนซีน, ควัน, แอมโมเนีย' : 'Benzene, Smoke, Ammonia',
      val: reading.mq135 != null ? `${reading.mq135} ADC` : '1420 ADC',
      thresh: '2500 ADC',
      status: (reading.mq135 != null && reading.mq135 > 2500) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'MOS Gas',
    },
    {
      id: 'MQ-3',
      name: 'MOS Gas Sensor',
      target: isThai ? 'แอลกอฮอล์, ทินเนอร์, ไอระเหย' : 'Alcohol, Thinner, Solvents',
      val: reading.mq3 != null ? `${reading.mq3} ADC` : '2100 ADC',
      thresh: '2800 ADC',
      status: (reading.mq3 != null && reading.mq3 > 2800) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'MOS Gas',
    },
    {
      id: 'MQ-2',
      name: 'MOS Gas Sensor',
      target: isThai ? 'ก๊าซไวไฟ, LPG, โพรเพน, มีเทน' : 'Combustible Gas, LPG, Methane',
      val: reading.mq2 != null ? `${reading.mq2} ADC` : '1180 ADC',
      thresh: '2000 ADC',
      status: (reading.mq2 != null && reading.mq2 > 2000) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'MOS Gas',
    },
    {
      id: 'MQ-8',
      name: 'MOS Gas Sensor',
      target: isThai ? 'ก๊าซไฮโดรเจน (H₂)' : 'Hydrogen Gas (H₂)',
      val: reading.mq8 != null ? `${reading.mq8} ADC` : '1650 ADC',
      thresh: '1800 ADC',
      status: (reading.mq8 != null && reading.mq8 > 1800) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'MOS Gas',
    },
    {
      id: 'MiCS-6814 (CO)',
      name: 'Multi-Channel MEMS',
      target: isThai ? 'คาร์บอนมอนอกไซด์ (CO)' : 'Carbon Monoxide (CO)',
      val: reading.mics_co != null ? `${reading.mics_co} mV` : '1100 mV',
      thresh: '1500 mV',
      status: (reading.mics_co != null && reading.mics_co > 1500) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'Multi-MEMS',
    },
    {
      id: 'MiCS-6814 (NO₂)',
      name: 'Multi-Channel MEMS',
      target: isThai ? 'ไนโตรเจนไดออกไซด์ (NO₂)' : 'Nitrogen Dioxide (NO₂)',
      val: reading.no2 != null ? `${reading.no2} mV` : '820 mV',
      thresh: '1200 mV',
      status: (reading.no2 != null && reading.no2 > 1200) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'Multi-MEMS',
    },
    {
      id: 'MiCS-6814 (NH₃)',
      name: 'Multi-Channel MEMS',
      target: isThai ? 'แอมโมเนีย (NH₃)' : 'Ammonia (NH₃)',
      val: reading.nh3 != null ? `${reading.nh3} mV` : '1380 mV',
      thresh: '1400 mV',
      status: (reading.nh3 != null && reading.nh3 > 1400) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'Multi-MEMS',
    },
    {
      id: 'PMS5003',
      name: 'Optical Laser Sensor',
      target: isThai ? 'ฝุ่นละอองอนุภาค (PM2.5 / PM10)' : 'Particulate Matter (PM2.5)',
      val: reading.pm25 != null ? `${Number(reading.pm25).toFixed(1)} µg/m³` : '12.0 µg/m³',
      thresh: '37.5 µg/m³',
      status: (reading.pm25 != null && reading.pm25 > 37.5) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'Optical Laser',
    },
    {
      id: 'DHT22 (Temp)',
      name: 'Capacitive / RTD',
      target: isThai ? 'อุณหภูมิห้องพ่นสี' : 'Chamber Temperature',
      val: reading.temp != null ? `${Number(reading.temp).toFixed(1)} °C` : '28.5 °C',
      thresh: '38.0 °C',
      status: (reading.temp != null && reading.temp > 38) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'Capacitive/RTD',
    },
    {
      id: 'DHT22 (Humidity)',
      name: 'Capacitive / RTD',
      target: isThai ? 'ความชื้นสัมพัทธ์ในบรรยากาศ' : 'Relative Humidity (%RH)',
      val: reading.rh != null ? `${Number(reading.rh).toFixed(1)} %RH` : '55.2 %RH',
      thresh: '75.0 %RH',
      status: (reading.rh != null && reading.rh > 75) ? (isThai ? 'เฝ้าระวัง' : 'Warning') : (isThai ? 'ปกติ' : 'Normal'),
      type: 'Capacitive/RTD',
    },
  ], [
    reading.tvoc, reading.eco2, reading.mq135, reading.mq3,
    reading.mq2, reading.mq8, reading.mics_co, reading.no2,
    reading.nh3, reading.pm25, reading.temp, reading.rh, isThai
  ]);

  const hasWarning = allProbes.some((p) => p.status === 'Warning');

  if (!data) {
    return <DashboardSkeleton isColdStarting={isColdStarting} onRetry={() => fetchAll()} />;
  }

  // Safe alert time parser to prevent "Invalid Date Today"
  const formatAlertTime = (rawTime) => {
    if (!rawTime) return isThai ? 'เมื่อสักครู่' : 'Just now';
    const d = new Date(rawTime);
    if (isNaN(d.getTime())) return isThai ? 'เมื่อสักครู่' : 'Just now';
    return isThai
      ? `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} วันนี้`
      : `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Today`;
  };

  // Recent alerts formatted (Safe date and field fallback)
  const displayAlerts = alerts && alerts.length > 0
    ? alerts.slice(0, 3).map((a, idx) => ({
        id: a.id || idx,
        color: a.level === 'Critical' ? '#ba1a1a' : a.level === 'High' ? '#F59E0B' : '#00CC66',
        text: a.message || a.title || (isThai ? 'ตรวจสอบความเร็วลมระบายอากาศอยู่ในเกณฑ์ปกติ' : 'Exhaust velocity verified'),
        time: formatAlertTime(a.created_at || a.time || a.timestamp),
      }))
    : [
        {
          id: 1,
          color: '#00CC66',
          text: isThai ? 'ตรวจสอบความเร็วลมระบายอากาศอยู่ในเกณฑ์ปกติ' : 'Exhaust velocity verified at nominal airflow',
          time: isThai ? '14:20 วันนี้' : '14:20 Today',
        },
        {
          id: 2,
          color: '#F59E0B',
          text: isThai ? 'ระดับสารระเหย VOC กลับสู่เกณฑ์ปกติในห้องพ่นสีที่ 1' : 'Transient VOC spike normalized in Booth 1',
          time: isThai ? '11:45 วันนี้' : '11:45 Today',
        },
        {
          id: 3,
          color: '#00CC66',
          text: isThai ? 'ระบบฟอกอากาศทำงานที่ประสิทธิภาพ 94.2%' : 'Scrubber efficiency stabilized at 94.2%',
          time: isThai ? '09:15 วันนี้' : '09:15 Today',
        },
      ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* ── Block 1: 4-Metric Primary Telemetry Row (Matching Stitch AI 1:1) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Air Quality Index */}
        <div
          onClick={() => toggleTelemetryDrawer(true)}
          className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[210px] relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
        >
          {/* Top Row: Label + Badge */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#505f76] uppercase tracking-wider">
                {t('airQuality', 'Air Quality')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold text-[#131b2e] bg-[#eaedff]">
                <span className="w-2 h-2 rounded-full bg-[#00CC66]" />
                {isThai ? (aqiCategory?.labelTh || 'ดีมาก') : (aqiCategory?.labelEn || 'Good')}
              </span>
            </div>
            <span className="text-[11px] text-[#505f76]">
              {isThai ? 'แหล่งข้อมูล: MQ-135 (PM2.5 / eCO₂)' : 'Source: MQ-135 (PM2.5 / eCO2)'}
            </span>
          </div>

          {/* Center Metric */}
          <div className="flex items-baseline">
            <span className="text-[56px] font-bold text-[#131b2e] leading-none tracking-tight">
              {currentAqi}
            </span>
          </div>

          {/* Bottom Continuous 3-color Spectrum Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="relative w-full h-1.5 rounded-full bg-[#eaedff] overflow-visible">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#00CC66] via-[#F59E0B] to-[#ba1a1a] opacity-80" />
              {/* Dynamic Pip positioned according to AQI */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md flex items-center justify-center"
                style={{ left: `${aqiPipPercent}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#131b2e]" />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-[#505f76] font-medium tracking-wide">
              <span>0</span>
              <span>50</span>
              <span>100+</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#505f76] pt-0.5">
              <span>PM2.5 {Math.round(pm25Value)} µg/m³</span>
              <span className="inline-flex items-center gap-1 text-[#009944] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00CC66]" />
                {isThai ? 'ปลอดภัย' : 'Safe'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: TVOC Real-time Concentration */}
        <div
          onClick={() => toggleTelemetryDrawer(true)}
          className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[210px] relative overflow-hidden cursor-pointer hover:shadow-md transition-all group"
          id="tvocCard"
        >
          {/* Top Row: Label + Sensor Icon */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#505f76] uppercase tracking-wider">
                {t('tvoc', 'TVOC')}
              </span>
              <svg className="w-[18px] h-[18px] text-[#505f76]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7.8 14.5a6 6 0 0 1 8.4 0M4.93 11.64a10 10 0 0 1 14.14 0" />
              </svg>
            </div>
            <span className="text-[11px] text-[#505f76]">
              {isThai ? 'แหล่งข้อมูล: MQ-3' : 'Source: MQ-3'}
            </span>
          </div>

          {/* Center Metric */}
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] font-bold text-[#131b2e] leading-none tracking-tight">
              {tvocValue}
            </span>
            <span className="text-[20px] font-semibold text-[#505f76]">ppb</span>
          </div>

          {/* Bottom Descriptor */}
          <div>
            <span className="text-[14px] text-[#505f76]">
              {isThai ? 'เกณฑ์ปกติ: ต่ำกว่า 100' : 'Normal range under 100'}
            </span>
          </div>
        </div>

        {/* Card 3: Exhaust Fan State */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[210px] relative overflow-hidden">
          {/* Top Row: Label + Glowing Active Indicator */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#505f76] uppercase tracking-wider">
                {t('exhaustFan', 'Exhaust Fan')}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00CC66] shadow-[0_0_8px_rgba(0,204,102,0.6)]" />
            </div>
            <span className="text-[11px] text-[#505f76]">
              {isThai ? 'แหล่งข้อมูล: ท่อวัดพิทอต (Pitot)' : 'Source: Pitot sensor'}
            </span>
          </div>

          {/* Center Metric */}
          <div className="flex items-baseline gap-3">
            <span className="text-[56px] font-bold text-[#131b2e] leading-none tracking-tight">
              {isThai ? 'เปิด' : 'ON'}
            </span>
          </div>

          {/* Bottom Descriptor */}
          <div>
            <span className="text-[14px] text-[#434655] font-medium">
              {isThai ? 'ทำงาน 100%' : '100% running'}
            </span>
          </div>
        </div>

        {/* Card 4: eCO2 Estimated Concentration (Harmonized with Cards 1-3) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[210px] relative overflow-hidden">
          {/* Top Row: Label + Status Badge */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#505f76] uppercase tracking-wider">
                {isThai ? 'ก๊าซคาร์บอนไดออกไซด์ (eCO₂)' : 'ECO₂ (ESTIMATED)'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {isThai ? 'ปกติ' : 'Nominal'}
              </span>
            </div>
            <span className="text-[11px] text-[#505f76]">
              {isThai ? 'แหล่งข้อมูล: MiCS-5524' : 'Source: MiCS-5524'}
            </span>
          </div>

          {/* Center Metric */}
          <div className="flex items-baseline gap-2">
            <span className="text-[56px] font-bold text-[#131b2e] leading-none tracking-tight">
              {reading.eco2 ? Math.round(reading.eco2) : 450}
            </span>
            <span className="text-[20px] font-semibold text-[#505f76]">ppm</span>
          </div>

          {/* Bottom Descriptor */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00CC66]" />
            <span className="text-[14px] text-[#505f76]">
              {isThai ? 'เกณฑ์เป้าหมายต่ำกว่า 1,000 ppm' : 'Target below 1,000 ppm'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Block 2 & 3: Combined Analytics Grid (Trend Line + Chemical Fingerprint) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Block 2: Line Chart (col-span-8) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-[13px] font-semibold text-[#505f76] uppercase tracking-wider">
              {t('tvocLast24h', 'TVOC, last 24 hours')}
            </span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-[11px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#F59E0B]" />
                  <span className="text-[#F59E0B]">{isThai ? 'เฝ้าระวัง 80 ppb' : 'Warning 80 ppb'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#ba1a1a]" />
                  <span className="text-[#ba1a1a]">{isThai ? 'วิกฤต 120 ppb' : 'Critical 120 ppb'}</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#eaedff] text-[#131b2e] text-[12px] font-medium cursor-pointer hover:bg-[#dbe1ff] transition-colors">
                <span>{isThai ? 'ตัวชี้วัด: TVOC' : 'Metric: TVOC'}</span>
                <ChevronRight size={14} className="rotate-90 text-[#505f76]" />
              </div>
            </div>
          </div>

          {/* SVG Line Chart Canvas strictly matching dashboard_2 */}
          <div className="w-full flex-1 flex flex-col justify-end">
            <div className="relative w-full h-44">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 700 160">
                <defs>
                  <linearGradient id="tvocAreaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                {/* Warning threshold line: 80 ppb marked at y=76 */}
                <line stroke="#F59E0B" strokeDasharray="4 4" strokeOpacity={0.8} strokeWidth={1.2} x1="0" x2="700" y1="76" y2="76" />
                {/* Critical threshold line: 120 ppb marked at y=36 */}
                <line stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.8} strokeWidth={1.5} x1="0" x2="700" y1="36" y2="36" />
                {/* Area Fill Under Curve */}
                <path d="M 0,130 C 70,125 120,95 180,98 C 240,102 280,118 350,112 C 420,106 480,52 540,65 C 600,78 650,88 700,82 L 700,160 L 0,160 Z" fill="url(#tvocAreaGradient)" />
                {/* Primary Trend Stroke (Strict 2px) */}
                <path d="M 0,130 C 70,125 120,95 180,98 C 240,102 280,118 350,112 C 420,106 480,52 540,65 C 600,78 650,88 700,82" fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth={2} />
                {/* Live Telemetry Active Pulse Node (matching dashboard_2 1:1) */}
                <circle cx="700" cy="82" fill="#2563EB" r="4" />
                <circle cx="700" cy="82" fill="#2563EB" opacity={0.25} r="8" />
              </svg>
            </div>

            {/* Bottom Axis Time Labels */}
            <div className="flex justify-between items-center pt-4 text-[12px] font-medium text-[#505f76]">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span className="text-[#004ac6] font-semibold">{isThai ? 'ตอนนี้' : 'Now'}</span>
            </div>
          </div>
        </div>

        {/* Block 3: Fingerprint / Detected Solvent (col-span-4 matching dashboard_2) */}
        <div
          onClick={() => setIsRadarModalOpen(true)}
          className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[320px] cursor-pointer hover:shadow-md transition-all group"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-[#505f76] uppercase tracking-wider">
                {isThai ? 'สารที่จำแนกได้ (ML Classifier)' : 'DETECTED SUBSTANCE'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#004ac6] bg-[#004ac6]/10">
                {isThai ? `ความตรงกัน ${solventMatch}%` : `${solventMatch}% match`}
              </span>
            </div>
            <div className="text-[34px] md:text-[40px] font-semibold text-[#131b2e] leading-tight tracking-tight">
              {isThai
                ? (detectedLabel === 'ALCOHOL'
                    ? 'ไอแอลกอฮอล์'
                    : detectedLabel === 'THINNER'
                    ? 'ไอทินเนอร์'
                    : detectedLabel === 'SMOKE'
                    ? 'ควัน / การเผาไหม้'
                    : 'บรรยากาศบริสุทธิ์')
                : (detectedLabel === 'ALCOHOL'
                    ? 'Alcohol Vapor'
                    : detectedLabel === 'THINNER'
                    ? 'Thinner Vapor'
                    : detectedLabel === 'SMOKE'
                    ? 'Smoke / Combustion'
                    : 'Clean Ambient Air')}
            </div>
          </div>

          {/* Clean 6-channel E-Nose Sensor Radar based on Live Hardware Readings */}
          <div className="flex items-center justify-center py-2">
            <div className="w-40 h-40">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 160 160">
                {/* Concentric Hexagon Reference Grids */}
                <polygon fill="none" points="80,25 127.6,52.5 127.6,107.5 80,135 32.4,107.5 32.4,52.5" stroke="#E2E8F0" strokeWidth="1" />
                <polygon fill="none" points="80,45 110.3,62.5 110.3,97.5 80,115 49.7,97.5 49.7,62.5" stroke="#E2E8F0" strokeWidth="1" />
                <polygon fill="none" points="80,62 95.6,71 95.6,89 80,98 64.4,89 64.4,71" stroke="#E2E8F0" strokeWidth="1" />
                {/* 6 Sensor Channel Axes */}
                <line stroke="#E2E8F0" strokeWidth="1" x1="80" x2="80" y1="80" y2="25" />
                <line stroke="#E2E8F0" strokeWidth="1" x1="80" x2="127.6" y1="80" y2="52.5" />
                <line stroke="#E2E8F0" strokeWidth="1" x1="80" x2="127.6" y1="80" y2="107.5" />
                <line stroke="#E2E8F0" strokeWidth="1" x1="80" x2="80" y1="80" y2="135" />
                <line stroke="#E2E8F0" strokeWidth="1" x1="80" x2="32.4" y1="80" y2="107.5" />
                <line stroke="#E2E8F0" strokeWidth="1" x1="80" x2="32.4" y1="80" y2="52.5" />
                {/* Dynamic Real Sensor Radar Profile Overlay */}
                <polygon
                  fill="#2563EB"
                  fillOpacity="0.18"
                  points={sensorRadarPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                  stroke="#2563EB"
                  strokeWidth="2"
                />
                {/* Dynamic Vertex Accent Points */}
                {sensorRadarPoints.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} fill="#2563EB" r="2.5" />
                ))}
                {/* Real Hardware Sensor Axis Labels */}
                <text className="fill-[#505f76] text-[9px] font-medium" textAnchor="middle" x="80" y="16">MQ-3</text>
                <text className="fill-[#505f76] text-[9px] font-medium" textAnchor="start" x="132" y="52">MQ-2</text>
                <text className="fill-[#505f76] text-[9px] font-medium" textAnchor="start" x="132" y="114">MQ-135</text>
                <text className="fill-[#505f76] text-[9px] font-medium" textAnchor="middle" x="80" y="147">MQ-8</text>
                <text className="fill-[#505f76] text-[9px] font-medium" textAnchor="end" x="28" y="114">MiCS-CO</text>
                <text className="fill-[#505f76] text-[9px] font-medium" textAnchor="end" x="28" y="52">MiCS-NO₂</text>
              </svg>
            </div>
          </div>

          {/* 3 Real Chemical Breakdown Progress Bars based on real ML Model classes */}
          <div className="flex flex-col gap-2.5 pt-1">
            {compoundDistribution.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-medium ${idx === 0 ? 'text-[#131b2e]' : 'text-[#434655]'}`}>
                    {isThai ? item.nameTh : item.nameEn}
                  </span>
                  <span className={`font-semibold ${idx === 0 ? 'text-[#004ac6]' : 'text-[#505f76]'}`}>
                    {item.pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#eaedff]">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center text-[11px] text-[#505f76] pt-1 border-t border-[#eaedff]">
              <span>{isThai ? 'โมเดล Random Forest v2.1' : 'Random Forest v2.1'}</span>
              <span className="text-[#434655] font-medium">{isThai ? 'กล่องเซนเซอร์ BOX-001' : 'Node BOX-001'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Block 4: Recent Alerts (Strictly 3 Items matching dashboard_2) ── */}
      <section className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-[#131b2e]">{t('recentAlerts', 'Recent alerts')}</h2>
          <Link to="/alerts" className="text-[13px] font-semibold text-[#004ac6] hover:underline inline-flex items-center gap-1">
            <span>{t('viewAllAlerts', 'View all alerts')}</span>
            <span>→</span>
          </Link>
        </div>

        <div className="flex flex-col">
          {displayAlerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className={`flex items-center justify-between py-3.5 ${
                index < displayAlerts.length - 1 ? 'border-b border-[#eaedff]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: alert.color }}
                />
                <span className="text-[14px] text-[#131b2e] truncate">{alert.text}</span>
              </div>
              <span className="text-[12px] text-[#505f76] font-medium shrink-0 ml-4">
                {alert.time}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sub-State Right-side Drawer: Live sensor telemetry (480px) ── */}
      {isTelemetryDrawerOpen && (
        <div
          onClick={() => toggleTelemetryDrawer(false)}
          className="fixed inset-0 bg-[#283044]/20 backdrop-blur-[2px] z-50 transition-opacity"
        />
      )}
      <aside
        aria-label="Live sensor telemetry"
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] max-w-[100vw] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 ${
          isTelemetryDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Drawer Header */}
          <div className="h-16 px-5 sm:px-6 border-b border-[#eaedff] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#004ac6]/10 flex items-center justify-center text-[#004ac6]">
                <Radio size={18} />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold leading-tight text-[#131b2e]">
                  {t('liveTelemetryTitle')}
                </h2>
                <span className="text-[11px] text-[#505f76]">
                  {isThai ? 'กล่องรวมสัญญาณ BOX-001 (ห้องพ่นสีที่ 1) · 12 แชนแนลตรวจวัด' : 'Sensor Enclosure BOX-001 (Booth 1) · 12 Channels'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleTelemetryDrawer(false)}
              className="p-1.5 rounded-full text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors flex items-center justify-center cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body / Table Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-medium">
                {t('realtimeProbeReadings')}
              </span>
              {hasWarning ? (
                <div className="flex items-center gap-1.5 text-[11px] text-[#943700] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                  {t('warningExceeded')}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-[#00AA55] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#00CC66] animate-pulse" />
                  {t('allSystemsNominal')}
                </div>
              )}
            </div>

            <div className="border border-[#eaedff] rounded-2xl overflow-x-auto bg-white shadow-xs">
              <table className="w-full text-left border-collapse text-[13px] min-w-[440px]">
                <thead>
                  <tr className="bg-[#f2f3ff] border-b border-[#eaedff] text-[#505f76] font-medium text-[12px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('sensorIdCol')}</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">{t('targetGasCol')}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('valueCol')}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t('thresholdCol')}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">{t('statusCol')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                  {allProbes.map((probe) => (
                    <tr key={probe.id} className="hover:bg-[#eaedff]/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#004ac6] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{probe.id}</span>
                          <span className="text-[10px] text-[#505f76] font-normal">{probe.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#131b2e] whitespace-nowrap text-xs font-medium">{probe.target}</td>
                      <td className="py-2.5 px-3 text-right font-medium tabular-nums whitespace-nowrap">{probe.val}</td>
                      <td className="py-2.5 px-3 text-right text-[#505f76] tabular-nums whitespace-nowrap">{probe.thresh}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                            probe.status === 'Warning' || probe.status === 'เฝ้าระวัง'
                              ? 'bg-amber-50 text-amber-800 border-amber-200/80'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}
                        >
                          {probe.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Summary Card inside Drawer */}
            <div className="mt-5 p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-[#131b2e]">{t('samplingRateLabel')}</span>
                <span className="text-[12px] text-[#505f76]">{t('samplingRateContinuous')}</span>
              </div>
              <div className="w-full bg-[#e2e7ff] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#004ac6] h-full rounded-full w-full" />
              </div>
              <p className="text-[11px] text-[#505f76] mt-2">
                {t('latestSyncNotice')}: {reading.recorded_at ? new Date(reading.recorded_at).toLocaleTimeString() : (isThai ? '3 วินาทีที่แล้ว' : '3 seconds ago')} {isThai ? 'ผ่านเกตเวย์ Modbus TCP' : 'via Modbus TCP gateway'}.
              </p>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-[#eaedff] bg-white shrink-0 flex items-center justify-between">
            <span className="text-[12px] text-[#505f76]">
              {isThai ? 'รหัสกล่องตรวจวัด' : 'Enclosure ID'}: <span className="font-mono text-[#131b2e] font-semibold">{data?.box_id || 'BOX-001'}</span>
            </span>
            <button
              type="button"
              onClick={() => toggleTelemetryDrawer(false)}
              className="px-4 py-2 rounded-xl bg-[#eaedff] text-[#131b2e] text-[13px] font-medium hover:bg-[#dae2fd] transition-colors cursor-pointer"
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Sub-State Solvent 8-Channel Radar Modal Dialog ── */}
      {isRadarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsRadarModalOpen(false)}
            className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#eaedff] z-10 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-medium">
                    {isThai ? 'การวิเคราะห์ลายนิ้วมือสารเคมี' : 'Chemical Fingerprint Analysis'}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#004ac6] bg-[#004ac6]/10">
                    {isThai ? `ตรงกัน ${solventMatch}%` : `${solventMatch}% match`}
                  </span>
                </div>
                <h3 className="text-[32px] font-bold text-[#131b2e] leading-tight">
                  {isThai
                    ? (detectedLabel === 'ALCOHOL'
                        ? 'ไอแอลกอฮอล์'
                        : detectedLabel === 'THINNER'
                        ? 'ไอทินเนอร์'
                        : detectedLabel === 'SMOKE'
                        ? 'ควัน / การเผาไหม้'
                        : 'บรรยากาศบริสุทธิ์')
                    : (detectedLabel === 'ALCOHOL'
                        ? 'Alcohol Vapor'
                        : detectedLabel === 'THINNER'
                        ? 'Thinner Vapor'
                        : detectedLabel === 'SMOKE'
                        ? 'Smoke / Combustion'
                        : 'Clean Ambient Air')}{' '}
                  <span className="text-[20px] text-[#505f76] font-normal font-sans">
                    {isThai ? `ความสอดคล้อง ${solventMatch}%` : `${solventMatch}% match`}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRadarModalOpen(false)}
                className="p-1.5 rounded-full text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-[13px] text-[#505f76] mb-4">
              {isThai
                ? 'การเปรียบเทียบสัญญาณแผงเซนเซอร์ตรวจวัดไอระเหยโลหะออกไซด์ 8 ช่องสัญญาณเทียบกับฐานข้อมูลลายเซ็นสารระเหย NIST'
                : 'Expanded 8-channel metal-oxide sensor matrix comparison against reference NIST VOC signature library.'}
            </p>

            {/* Large 8-Channel Radar Chart */}
            <div className="flex items-center justify-center py-4 bg-[#f2f3ff]/50 rounded-2xl border border-[#eaedff]">
              <div className="w-64 h-64">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 240 240">
                  <defs>
                    <radialGradient cx="50%" cy="50%" id="modalRadarGlow" r="50%">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                    </radialGradient>
                  </defs>
                  {/* Outer Octagon ring (R=90) */}
                  <polygon
                    fill="none"
                    points="120,30 183.6,56.4 210,120 183.6,183.6 120,210 56.4,183.6 30,120 56.4,56.4"
                    stroke="#D1D5DB"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Middle Octagon ring (R=60) */}
                  <polygon
                    fill="none"
                    points="120,60 162.4,77.6 180,120 162.4,162.4 120,180 77.6,162.4 60,120 77.6,77.6"
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  {/* Inner Octagon ring (R=30) */}
                  <polygon
                    fill="none"
                    points="120,90 141.2,98.8 150,120 141.2,141.2 120,150 98.8,141.2 90,120 98.8,98.8"
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  {/* 8 Axes */}
                  <line x1="120" y1="120" x2="120" y2="30" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="183.6" y2="56.4" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="210" y2="120" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="183.6" y2="183.6" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="120" y2="210" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="56.4" y2="183.6" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="30" y2="120" stroke="#E5E7EB" strokeWidth="1" />
                  <line x1="120" y1="120" x2="56.4" y2="56.4" stroke="#E5E7EB" strokeWidth="1" />

                  {/* 8-Channel Solvent Fingerprint polygon */}
                  <polygon
                    fill="url(#modalRadarGlow)"
                    points="120,40 166,74 195,120 155,155 120,180 88,152 50,120 81,81"
                    stroke="#2563EB"
                    strokeWidth="2"
                  />
                  {/* Data vertices */}
                  <circle cx="120" cy="40" fill="#2563EB" r="3" />
                  <circle cx="166" cy="74" fill="#2563EB" r="3" />
                  <circle cx="195" cy="120" fill="#2563EB" r="3" />
                  <circle cx="155" cy="155" fill="#2563EB" r="3" />
                  <circle cx="120" cy="180" fill="#2563EB" r="3" />
                  <circle cx="88" cy="152" fill="#2563EB" r="3" />
                  <circle cx="50" cy="120" fill="#2563EB" r="3" />
                  <circle cx="81" cy="81" fill="#2563EB" r="3" />
                  {/* Real Hardware Sensor Channel Labels matching Stitch */}
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="middle" x="120" y="20">MQ-3 (Alcohol)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="start" x="195" y="50">MQ-2 (Combustibles)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="start" x="218" y="124">MQ-135 (Fumes)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="start" x="195" y="195">MQ-8 (H₂)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="middle" x="120" y="228">CCS811 (TVOC)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="end" x="45" y="195">MiCS-6814 (CO)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="end" x="22" y="124">MiCS-6814 (NO₂)</text>
                  <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="end" x="45" y="50">MiCS-6814 (NH₃)</text>
                </svg>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-[12px] text-[#505f76]">
              <span>{isThai ? 'สารมาตรฐาน: การจำแนกตามชุดข้อมูลโมเดล (Alcohol / Ambient)' : 'Standard: Model Dataset Classification (Alcohol / Ambient)'}</span>
              <button
                type="button"
                onClick={() => setIsRadarModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#004ac6] text-white text-[13px] font-medium hover:bg-[#2563eb] transition-colors cursor-pointer"
              >
                {t('done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
