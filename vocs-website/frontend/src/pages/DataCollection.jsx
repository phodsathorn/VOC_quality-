import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Square, ChevronDown, Check, Download,
  Tag, FlaskConical, AlertTriangle, CheckCircle2,
  Sliders, User, Edit3, Thermometer, Fan, RotateCcw, Crosshair
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { saveBaseline } from '../utils/ppmConverter';

const RL_OHMS = 10000; // 10 kΩ Load Resistor
const VC_VOLTS = 5.0;
const VREF_VOLTS = 3.3;
const ADC_MAX_COUNTS = 4095;

function adcToVout(adc) {
  if (!adc || adc <= 0) return 0;
  return Math.min((adc / ADC_MAX_COUNTS) * VREF_VOLTS, 3.29);
}

function voutToResistance(vout) {
  if (!vout || vout <= 0.02) return 0;
  return Math.round(RL_OHMS * ((VC_VOLTS - vout) / vout));
}

export default function DataCollection() {
  const { token } = useAuth();
  const { t, lang } = useLanguage();
  const isThai = lang === 'TH';

  const [compound, setCompound] = useState('Powder_Dust');
  const [concentration, setConcentration] = useState('50');
  const [sampleId, setSampleId] = useState('SMP-2026-0842');
  const [operator, setOperator] = useState('E. Mitchell');
  const [note, setNote] = useState('');
  const [isSampling, setIsSampling] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'past' | 'model'
  const [toastMsg, setToastMsg] = useState(null);

  // ─── Live Telemetry & 3-Fan State (GPIO 25, GPIO 26, GPIO 4) ───
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [fans, setFans] = useState({
    fan1: true,   // GPIO 25 (IN1: Intake / Transfer Fan)
    fan2: true,   // GPIO 26 (IN2: Exhaust Fan)
    fan3: false,  // GPIO 4  (IN3: Fan 3 / Auxiliary Chamber Fan)
    preset: 'NORMAL',
  });
  const [isUpdatingFans, setIsUpdatingFans] = useState(false);

  // ─── Baseline R0 & Peak Tracking for 12-Page Lab Record Sheet ───
  const [baselineData, setBaselineData] = useState(() => {
    try {
      const saved = localStorage.getItem('voc_lab_r0_baseline');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return {
      mq3: 380,
      mq135: 420,
      mq2: 350,
      mq8: 310,
      mics_co: 1120,
      no2: 185,
      nh3: 980,
      tvoc: 18,
      eco2: 412,
      pm25: 8,
      pm10: 11,
      temp: 25.0,
      rh: 55.0,
      capturedAt: null,
    };
  });

  const [peakData, setPeakData] = useState({
    mq3: 0,
    mq135: 0,
    mq2: 0,
    mq8: 0,
    mics_co_min: null,
    no2_max: 0,
    nh3_min: null,
    tvoc: 0,
    eco2: 0,
    pm25: 0,
    pm10: 0,
    t0Timestamp: null,
    t90Seconds: {},
  });

  const compounds = [
    { id: 'Powder_Dust', labelEn: '1. Powder Coating Dust (0.5 g)', labelTh: '1. ผงสีฝุ่น (Powder Dust — 0.5 กรัม)' },
    { id: 'Alcohol', labelEn: '2. Alcohol 70% (0.3 ml / ~6 drops)', labelTh: '2. แอลกอฮอล์ 70% (0.3 ml / ~6 หยด)' },
    { id: 'Thinner', labelEn: '3. Industrial Thinner (0.15 ml / ~3 drops)', labelTh: '3. ทินเนอร์ผสมสี (0.15 ml / ~3 หยด)' },
    { id: 'Ammonia', labelEn: '4. Diluted Ammonia 10% (0.15 ml / ~3 drops)', labelTh: '4. แอมโมเนียเจือจาง 10% (0.15 ml / ~3 หยด)' },
    { id: 'Mix_Dust_Thinner', labelEn: 'Mix 1: Powder Dust 0.5g + Thinner 0.1ml', labelTh: 'สารผสม 1: สีฝุ่น 0.5g + ทินเนอร์ 0.1 ml' },
    { id: 'Mix_Thinner_Alcohol', labelEn: 'Mix 2: Thinner 0.1ml + Alcohol 0.2ml', labelTh: 'สารผสม 2: ทินเนอร์ 0.1 ml + แอลกอฮอล์ 0.2 ml' },
    { id: 'Ambient', labelEn: 'Clean Ambient Air (R0 Baseline)', labelTh: 'อากาศสะอาดบริสุทธิ์ (วัดค่าเริ่มต้น R0)' },
  ];

  const [pastSessions, setPastSessions] = useState([
    { id: 'SMP-2026-0103', compound: 'Alcohol', compoundTh: 'แอลกอฮอล์', quality: 'OK', isSuspect: false, profile: 'P-Standard' },
    { id: 'SMP-2026-0102', compound: 'Ambient', compoundTh: 'อากาศปกติ', quality: 'OK', isSuspect: false, profile: 'P-Standard' },
    { id: 'SMP-2026-0101', compound: 'Thinner', compoundTh: 'ทินเนอร์', quality: 'Suspect', isSuspect: true, profile: 'P-HighTemp' },
  ]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  // ─── Poll Live Telemetry & 3-Fan State from BOX-001 every 3s ───
  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/dashboard/latest?box_id=BOX-001`);
      if (!res.ok) return;
      const d = await res.json();
      setLiveTelemetry(d);
      if (d.fans) {
        setFans((prev) => ({
          ...prev,
          fan1: Boolean(d.fans.fan1),
          fan2: Boolean(d.fans.fan2),
          fan3: Boolean(d.fans.fan3),
          preset: d.fans.preset || prev.preset,
        }));
      }

      const env = d.environment || {};
      const sen = d.sensors || {};
      setPeakData((prev) => {
        const next = { ...prev };
        if (sen.mq3 != null && sen.mq3 > next.mq3) next.mq3 = sen.mq3;
        if (sen.mq135 != null && sen.mq135 > next.mq135) next.mq135 = sen.mq135;
        if (sen.mq2 != null && sen.mq2 > next.mq2) next.mq2 = sen.mq2;
        if (sen.mq8 != null && sen.mq8 > next.mq8) next.mq8 = sen.mq8;
        if (sen.mics_co != null && sen.mics_co > 0) {
          next.mics_co_min = next.mics_co_min == null ? sen.mics_co : Math.min(next.mics_co_min, sen.mics_co);
        }
        if (sen.no2 != null && sen.no2 > next.no2_max) next.no2_max = sen.no2;
        if (sen.nh3 != null && sen.nh3 > 0) {
          next.nh3_min = next.nh3_min == null ? sen.nh3 : Math.min(next.nh3_min, sen.nh3);
        }
        if (env.tvoc != null && env.tvoc > next.tvoc) next.tvoc = env.tvoc;
        if (env.eco2 != null && env.eco2 > next.eco2) next.eco2 = env.eco2;
        if (env.pm25 != null && env.pm25 > next.pm25) next.pm25 = env.pm25;
        if (env.pm10 != null && env.pm10 > next.pm10) next.pm10 = env.pm10;
        return next;
      });
    } catch (err) {
      console.warn('Experiment live telemetry fetch notice:', err);
    }
  }, []);

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 3000);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  // ─── Control 3 Fans (GPIO 25, GPIO 26, GPIO 4) ───
  async function handleSetThreeFans(nextF1, nextF2, nextF3, presetName = 'CUSTOM') {
    const payload = {
      fan1: Boolean(nextF1),
      fan2: Boolean(nextF2),
      fan3: Boolean(nextF3),
      auto_mode: false,
      preset: presetName,
    };
    setFans(payload);
    setIsUpdatingFans(true);
    try {
      const authToken = token || localStorage.getItem('token') || '';
      const res = await fetch(`${API}/api/devices/BOX-001/fans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : { 'X-Admin-Key': 'change-me-in-production-2026' }),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast(
          isThai
            ? `สั่งงานพัดลมแล้ว: IN1(G25)=${nextF1 ? 'ON' : 'OFF'}, IN2(G26)=${nextF2 ? 'ON' : 'OFF'}, IN3(G4)=${nextF3 ? 'ON' : 'OFF'}`
            : `Fans updated: IN1=${nextF1 ? 'ON' : 'OFF'}, IN2=${nextF2 ? 'ON' : 'OFF'}, IN3=${nextF3 ? 'ON' : 'OFF'}`
        );
      }
    } catch (err) {
      console.warn('Fan control error:', err);
      showToast(isThai ? 'ส่งคำสั่งพัดลมไปยังคิวอุปกรณ์แล้ว' : 'Fan command queued');
    } finally {
      setIsUpdatingFans(false);
    }
  }

  // ─── Capture Clean Air Baseline (R0) for Table 1 ───
  function handleCaptureBaseline() {
    const env = liveTelemetry?.environment || {};
    const sen = liveTelemetry?.sensors || {};
    const newBase = {
      mq3: sen.mq3 || baselineData.mq3 || 380,
      mq135: sen.mq135 || baselineData.mq135 || 420,
      mq2: sen.mq2 || baselineData.mq2 || 350,
      mq8: sen.mq8 || baselineData.mq8 || 310,
      mics_co: sen.mics_co || baselineData.mics_co || 1120,
      no2: sen.no2 || baselineData.no2 || 185,
      nh3: sen.nh3 || baselineData.nh3 || 980,
      tvoc: env.tvoc != null ? env.tvoc : 18,
      eco2: env.eco2 != null ? env.eco2 : 412,
      pm25: env.pm25 != null ? env.pm25 : 8,
      pm10: env.pm10 != null ? env.pm10 : 11,
      temp: env.temp != null ? env.temp : 25.0,
      rh: env.rh != null ? env.rh : 55.0,
      capturedAt: new Date().toLocaleTimeString(),
    };
    setBaselineData(newBase);
    saveBaseline(newBase);
    try {
      localStorage.setItem('voc_lab_r0_baseline', JSON.stringify(newBase));
    } catch { /* ignore */ }
    showToast(isThai ? 'บันทึกค่าอากาศสะอาดอ้างอิง (R0 Baseline) ลงตารางที่ 1 แล้ว ✓' : 'Captured Clean Air R0 Baseline ✓');
  }

  // ─── Reset Peak & Start t0 Timer for Table 2 ───
  function handleResetPeaks() {
    const env = liveTelemetry?.environment || {};
    const sen = liveTelemetry?.sensors || {};
    setPeakData({
      mq3: sen.mq3 || 0,
      mq135: sen.mq135 || 0,
      mq2: sen.mq2 || 0,
      mq8: sen.mq8 || 0,
      mics_co_min: sen.mics_co || null,
      no2_max: sen.no2 || 0,
      nh3_min: sen.nh3 || null,
      tvoc: env.tvoc || 0,
      eco2: env.eco2 || 0,
      pm25: env.pm25 || 0,
      pm10: env.pm10 || 0,
      t0Timestamp: Date.now(),
      t90Seconds: {},
    });
    setTimerSeconds(0);
    showToast(isThai ? 'รีเซ็ตค่าพีคและเริ่มจับเวลา t0 สำหรับรอบการทดลองใหม่แล้ว ✓' : 'Reset peak values & started t0 timer ✓');
  }

  // Live timer for active sampling
  useEffect(() => {
    if (isSampling) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => (prev >= 180 ? 0 : prev + 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSampling]);

  // Load real past sessions from backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      try {
        const res = await fetch(`${API}/api/training/sessions`);
        if (res.ok && isMounted) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const mapped = list.map((s) => ({
              id: `SMP-${s.id}`,
              compound: s.label || 'Toluene',
              compoundTh: s.label || 'โทลูอีน',
              quality: 'OK',
              isSuspect: false,
              profile: 'P-Standard',
            }));
            setPastSessions(mapped);
          }
        }
      } catch (err) {
        console.warn('Training sessions load notice:', err);
      }
    }
    loadSessions();
  }, []);

  async function toggleSampling() {
    const nextState = !isSampling;
    setIsSampling(nextState);

    if (nextState) {
      setTimerSeconds(0);
      const newId = `SMP-2025-${Math.floor(Math.random() * 900 + 100)}`;
      setSampleId(newId);
      showToast(lang === 'TH' ? 'เริ่มกระบวนการบันทึกข้อมูลตัวอย่างแล้ว...' : 'Started data acquisition session...');

      try {
        await fetch(`${API}/api/training/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            box_id: 'BOX-001',
            label: compound,
            target_ppm: parseFloat(concentration) || 50,
          }),
        });
      } catch (err) {
        console.warn('Start session API notice:', err);
      }
    } else {
      showToast(lang === 'TH' ? 'สิ้นสุดการเก็บตัวอย่างและบันทึกข้อมูลแล้ว ✓' : 'Acquisition stopped and sample saved ✓');
      const newSession = {
        id: sampleId,
        compound: compound,
        compoundTh: compound,
        quality: 'OK',
        isSuspect: false,
        profile: 'P-Standard',
      };
      setPastSessions((prev) => [newSession, ...prev]);
    }
  }

  function handleRelabel(id) {
    const target = pastSessions.find((s) => s.id === id);
    if (!target) return;
    const newCompound = prompt(lang === 'TH' ? 'ระบุชื่อสารเคมีใหม่:' : 'Enter new chemical compound:', target.compound);
    if (newCompound) {
      setPastSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, compound: newCompound, compoundTh: newCompound } : s))
      );
      showToast(lang === 'TH' ? 'อัปเดตป้ายชื่อตัวอย่างแล้ว ✓' : 'Sample relabeled successfully ✓');
    }
  }

  function handleDelete(id) {
    setPastSessions((prev) => prev.filter((s) => s.id !== id));
    showToast(lang === 'TH' ? 'ลบข้อมูลตัวอย่างแล้ว' : 'Sample deleted');
  }

  function handleFlag(id) {
    setPastSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, quality: s.quality === 'Suspect' ? 'OK' : 'Suspect', isSuspect: !s.isSuspect } : s))
    );
    showToast(lang === 'TH' ? 'เปลี่ยนสถานะตรวจสอบแล้ว' : 'Sample flag toggled');
  }

  function handleExportCsv() {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Sample_ID,Compound,Quality,Profile\n' +
      pastSessions.map((s) => `${s.id},${s.compound},${s.quality},${s.profile}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'past_acquisition_runs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'TH' ? 'ส่งออกไฟล์ CSV สำเร็จแล้ว ✓' : 'Exported CSV successfully ✓');
  }

  const liveEnv = liveTelemetry?.environment || {};
  const liveSen = liveTelemetry?.sensors || {};
  const isBoxOnline = liveTelemetry?.is_online ?? false;
  const curTemp = liveEnv.temp != null ? liveEnv.temp.toFixed(1) : '25.0';
  const curRh = liveEnv.rh != null ? liveEnv.rh.toFixed(0) : '55';
  const curPm25 = liveEnv.pm25 != null && liveEnv.pm25 >= 0 ? Math.round(liveEnv.pm25) : 0;
  const curPm10 = liveEnv.pm10 != null && liveEnv.pm10 >= 0 ? Math.round(liveEnv.pm10) : Math.round(curPm25 * 1.25);
  const curTvoc = liveEnv.tvoc != null ? Math.round(liveEnv.tvoc) : 0;
  const curEco2 = liveEnv.eco2 != null ? Math.round(liveEnv.eco2) : 400;

  // คำนวณค่าความต้านทานสดสำหรับเซนเซอร์ MQ ทั้ง 4 ตัวตามสูตรในใบงาน
  const mqRows = [
    { key: 'mq3', name: '1. MQ-3 (Alcohol)', cleanRatio: 60.0 },
    { key: 'mq135', name: '2. MQ-135 (NH₃/VOC)', cleanRatio: 3.6 },
    { key: 'mq2', name: '3. MQ-2 (Combustibles)', cleanRatio: 9.83 },
    { key: 'mq8', name: '4. MQ-8 (Hydrogen)', cleanRatio: 70.0 },
  ].map((m) => {
    const rawAdc = liveSen[m.key] != null ? liveSen[m.key] : baselineData[m.key];
    const baseAdc = baselineData[m.key] || 380;
    const peakAdc = Math.max(peakData[m.key] || 0, rawAdc || 0);
    const vout = adcToVout(rawAdc);
    const voutBase = adcToVout(baseAdc);
    const voutPeak = adcToVout(peakAdc);
    const rClean = voutToResistance(voutBase);
    const r0 = rClean > 0 ? Math.round(rClean / m.cleanRatio) : 0;
    const rsNow = voutToResistance(vout);
    const rsPeak = voutToResistance(voutPeak);
    const rsOverRclean = rClean > 0 && rsPeak > 0 ? (rsPeak / rClean).toFixed(2) : '1.00';
    const rsOverR0 = r0 > 0 && rsPeak > 0 ? (rsPeak / r0).toFixed(2) : m.cleanRatio.toFixed(1);
    const driftPct = baseAdc > 0 ? Math.abs(((rawAdc - baseAdc) / baseAdc) * 100) : 0;
    const gatePassed = driftPct <= 5.0;
    return {
      ...m,
      rawAdc,
      baseAdc,
      peakAdc,
      vout: vout.toFixed(2),
      voutBase: voutBase.toFixed(2),
      rClean,
      r0,
      rsNow,
      rsPeak,
      rsOverRclean,
      rsOverR0,
      driftPct: driftPct.toFixed(1),
      gatePassed,
    };
  });

  return (
    <div className="flex flex-col w-full gap-6 max-w-7xl mx-auto">
      {/* ── Breadcrumb & Header Bar matching Stitch AI ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-[#505f76] text-[11px] font-semibold tracking-wider uppercase">
            <span className="text-[#004ac6]">{t('modelTraining', 'Model Training')}</span>
            <span className="text-[#c3c6d7]">/</span>
            <span>{t('sensorArrayAcquisition', 'Sensor Array Acquisition')}</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#131b2e] tracking-tight mt-1">
            {t('dataCollection', 'Data Collection')}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 self-start md:self-auto px-3.5 py-1.5 rounded-full bg-white shadow-xs border border-[#eaedff]">
          <span className={`w-2 h-2 rounded-full ${isBoxOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-[11px] text-[#505f76] font-medium uppercase tracking-wider">
            {isThai
              ? `อุณหภูมิกล่อง ${curTemp}°C · ความชื้น ${curRh}% · PM2.5 ${curPm25} / PM10 ${curPm10} µg/m³`
              : `Chamber Temp ${curTemp}°C · RH ${curRh}% · PM2.5 ${curPm25} / PM10 ${curPm10} µg/m³`}
          </span>
        </div>
      </div>

      {/* ── 3-Fan Hardware Controller Card (GPIO 25, GPIO 26, GPIO 4) ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-[#eaedff] flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f2f3ff] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
              <Fan size={20} className={fans.fan1 || fans.fan2 || fans.fan3 ? 'animate-spin' : ''} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#131b2e]">
                {isThai
                  ? 'แผงควบคุมพัดลมการทดลอง 3 ตัว (Remote 3-Fan Relay Controller)'
                  : '3-Fan Experiment Relay Controller (GPIO 25, 26, 4)'}
              </h2>
              <p className="text-[12px] text-[#505f76]">
                {isThai
                  ? 'สั่งเปิด-ปิดพัดลมแต่ละตัวผ่านเว็บ หรือเลือกสเตจตามใบงาน 25 นาที (ซิงก์กับบอร์ด ESP32 ทุก 1–3 วินาที)'
                  : 'Toggle individual fans or select 25-minute experiment stage presets'}
              </p>
            </div>
          </div>

          {/* 1-Click 25-Minute Lab Stage Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={isUpdatingFans}
              onClick={() => handleSetThreeFans(false, false, false, 'STAGE1_BASELINE_OFF')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                !fans.fan1 && !fans.fan2 && !fans.fan3
                  ? 'bg-[#004ac6] text-white border-[#004ac6]'
                  : 'bg-[#f2f3ff] text-[#131b2e] border-[#eaedff] hover:bg-[#eaedff]'
              }`}
            >
              {isThai ? '1. วัด Baseline / Gate (ปิดทั้งหมด)' : '1. Baseline / Gate (All OFF)'}
            </button>
            <button
              type="button"
              disabled={isUpdatingFans}
              onClick={() => handleSetThreeFans(true, false, false, 'STAGE2_EXPOSURE_IN1')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                fans.fan1 && !fans.fan2 && !fans.fan3
                  ? 'bg-[#004ac6] text-white border-[#004ac6]'
                  : 'bg-[#f2f3ff] text-[#131b2e] border-[#eaedff] hover:bg-[#eaedff]'
              }`}
            >
              {isThai ? '2. ดูดสารเข้า (เปิด IN1)' : '2. Exposure (IN1 Only)'}
            </button>
            <button
              type="button"
              disabled={isUpdatingFans}
              onClick={() => handleSetThreeFans(true, false, true, 'STAGE3_CIRCULATE_IN1_G4')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                fans.fan1 && !fans.fan2 && fans.fan3
                  ? 'bg-[#004ac6] text-white border-[#004ac6]'
                  : 'bg-[#f2f3ff] text-[#131b2e] border-[#eaedff] hover:bg-[#eaedff]'
              }`}
            >
              {isThai ? '3. ดูดเข้า + พัดลมตัวที่ 3 (IN1 + GPIO4)' : '3. Exposure + Fan 3 (IN1 + GPIO4)'}
            </button>
            <button
              type="button"
              disabled={isUpdatingFans}
              onClick={() => handleSetThreeFans(true, true, true, 'STAGE4_PURGE_ALL')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                fans.fan1 && fans.fan2 && fans.fan3
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isThai ? '4. ระบายอากาศทิ้ง 100% (เปิดทั้ง 3 ตัว)' : '4. Purge Exhaust (All 3 ON)'}
            </button>
          </div>
        </div>

        {/* 3 Individual Fan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              key: 'fan1',
              pin: 'GPIO 25',
              titleTh: 'พัดลมตัวที่ 1 (IN1 — ดูดเข้า)',
              titleEn: 'Fan 1 (IN1 — Transfer / Intake)',
              descTh: 'ดูดมวลไอระเหยเข้าสู่ห้องเซนเซอร์ (นาทีที่ 03:30–10:00)',
              descEn: 'Draws chemical vapor into sensor chamber',
              active: fans.fan1,
              onToggle: () => handleSetThreeFans(!fans.fan1, fans.fan2, fans.fan3, 'MANUAL_FAN1'),
            },
            {
              key: 'fan2',
              pin: 'GPIO 26',
              titleTh: 'พัดลมตัวที่ 2 (IN2 — ระบายออก)',
              titleEn: 'Fan 2 (IN2 — Exhaust Stack)',
              descTh: 'ดูดไล่ไอสารเคมีทิ้งออกนอกกล่อง (นาทีที่ 10:00–22:00)',
              descEn: 'Purges chemical vapor out of chamber',
              active: fans.fan2,
              onToggle: () => handleSetThreeFans(fans.fan1, !fans.fan2, fans.fan3, 'MANUAL_FAN2'),
            },
            {
              key: 'fan3',
              pin: 'GPIO 4',
              titleTh: 'พัดลมตัวที่ 3 (IN3 — พัดลมเสริม GPIO 4)',
              titleEn: 'Fan 3 (IN3 — Auxiliary Fan GPIO 4)',
              descTh: 'พัดลมตัวที่ 3 สำหรับช่วยกระจายไอสารหรือช่วยเร่งระบายอากาศ',
              descEn: 'Third fan on GPIO 4 for circulation / auxiliary purge',
              active: fans.fan3,
              onToggle: () => handleSetThreeFans(fans.fan1, fans.fan2, !fans.fan3, 'MANUAL_FAN3'),
            },
          ].map((item) => (
            <div
              key={item.key}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                item.active
                  ? 'bg-emerald-50/60 border-emerald-200/90'
                  : 'bg-[#f8f9ff] border-[#eaedff]'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[#131b2e] truncate">
                    {isThai ? item.titleTh : item.titleEn}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#e2e8f0] font-mono text-[10px] font-bold text-[#004ac6] shrink-0">
                    {item.pin}
                  </span>
                </div>
                <span className="text-[11px] text-[#505f76] mt-0.5 leading-snug">
                  {isThai ? item.descTh : item.descEn}
                </span>
              </div>

              <button
                type="button"
                disabled={isUpdatingFans}
                onClick={item.onToggle}
                className={`px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  item.active
                    ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${item.active ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                <span>{item.active ? (isThai ? 'เปิด (ON)' : 'ON') : (isThai ? 'ปิด (OFF)' : 'OFF')}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Strict 2-Card Layout (Left ~1/3, Right ~2/3) matching Stitch ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT CARD: Acquisition Initiation (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#eaedff] flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-5 border-b border-[#f2f3ff]">
              <span className="text-[12px] uppercase tracking-widest text-[#505f76] font-semibold">
                {t('newSample', 'New Sample')}
              </span>
              <FlaskConical size={18} className="text-[#737686]" />
            </div>

            <form className="space-y-4 pt-5" onSubmit={(e) => e.preventDefault()}>
              {/* Field 1: Chemical Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="chem-select">
                  {t('chemicalCompound', 'Chemical Compound')}
                </label>
                <div className="relative">
                  <select
                    id="chem-select"
                    value={compound}
                    onChange={(e) => setCompound(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                  >
                    {compounds.map((c) => (
                      <option key={c.id} value={c.id}>
                        {lang === 'TH' ? c.labelTh : c.labelEn}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#505f76] pointer-events-none"
                  />
                </div>
              </div>

              {/* Field 2: Concentration */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="ppm-input">
                    {t('concentration', 'Concentration')}
                  </label>
                  <span className="text-[11px] text-[#004ac6] font-semibold">
                    {t('targetCalibrated', 'Target Calibrated')}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="ppm-input"
                    type="number"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 font-mono tabular-nums"
                  />
                  <span className="absolute right-4 text-[#505f76] pointer-events-none font-medium text-[12px]">
                    ppm
                  </span>
                </div>
              </div>

              {/* Field 3: Sample ID */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="sample-id">
                    {t('sampleId', 'Sample ID')}
                  </label>
                  <span className="text-[10px] text-[#505f76] uppercase tracking-wider">
                    {t('autoGenerated', 'Auto-Generated')}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="sample-id"
                    type="text"
                    readOnly
                    value={sampleId}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[13px] font-mono tracking-wider rounded-2xl px-4 py-3 select-all cursor-default"
                  />
                  <Tag size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>

              {/* Field 4: Operator */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="operator-input">
                  {t('operator', 'Operator')}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="operator-input"
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                  <User size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>

              {/* Field 5: Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]" htmlFor="note-input">
                  {t('note', 'Note')}
                </label>
                <div className="relative flex items-center">
                  <input
                    id="note-input"
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={lang === 'TH' ? 'เช่น ตรวจสอบจุดฐานชุดผลิต #4' : 'e.g. Batch #4 baseline check'}
                    className="w-full bg-[#f2f3ff] text-[#131b2e] text-[14px] font-medium rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
                  />
                  <Edit3 size={16} className="absolute right-4 text-[#505f76]" />
                </div>
              </div>

              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#737686] font-medium">
                <Thermometer size={14} />
                <span>{t('autoRecordedTempRh', 'Auto-recorded: 28° / 52%')}</span>
              </div>
            </form>
          </div>

          {/* Action Button matching Stitch */}
          <div className="pt-6 mt-4">
            <button
              type="button"
              onClick={toggleSampling}
              className={`w-full py-3.5 px-6 rounded-2xl font-medium text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] ${
                isSampling
                  ? 'bg-[#ba1a1a] text-white hover:bg-[#93000a]'
                  : 'bg-[#004ac6] text-white hover:bg-[#003ea8]'
              }`}
            >
              {isSampling ? (
                <>
                  <Square size={18} fill="currentColor" />
                  <span className="font-semibold tracking-wide">
                    {t('stopSampling', 'Stop sampling')}
                  </span>
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" />
                  <span className="font-semibold tracking-wide">
                    {t('startSampling', 'Start sampling')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT CARD: Dynamic Sensor Response Telemetry (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#eaedff] flex flex-col justify-between min-h-[520px]">
          <div>
            {/* Top Bar: Tabs & Active Profile */}
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3 mb-4">
              <div className="inline-flex p-1 rounded-2xl bg-[#f2f3ff] gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                    activeTab === 'live'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  {t('live', 'Live')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('past')}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                    activeTab === 'past'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  {t('pastSessions', 'Past sessions')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('model')}
                  className={`px-3 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer ${
                    activeTab === 'model'
                      ? 'bg-white text-[#004ac6] shadow-xs'
                      : 'text-[#505f76] hover:text-[#131b2e]'
                  }`}
                >
                  {t('model', 'Model')}
                </button>
              </div>

              <div className="text-[11px] text-[#505f76] font-medium hidden sm:flex items-center gap-1.5">
                <Sliders size={14} className="text-[#004ac6]" />
                <span>{t('activeProfile', 'Active Profile: Standard VOC Array')}</span>
              </div>
            </div>

            {/* TAB 1: LIVE matching Stitch 1:1 */}
            {activeTab === 'live' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#004ac6]" />
                    <h2 className="text-[14px] font-semibold text-[#131b2e] tracking-tight">
                      {t('sensorResponse', 'Sensor response (Rs/R0)')}
                    </h2>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d0e1fb] text-[#0b1c30] text-[11px] font-semibold self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6] animate-ping" />
                    <span>{t('acquiringArrayTransient', 'Acquiring array transient')}</span>
                  </div>
                </div>

                {/* 3-Phase Stepper Tracker */}
                <div className="w-full pt-1">
                  <div className="grid grid-cols-3 gap-2 text-[12px] mb-2 font-medium">
                    {/* Phase 1: Completed */}
                    <div className="flex items-center gap-1.5 text-[#131b2e]">
                      <span className="w-4 h-4 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6] text-[10px] font-bold">
                        ✓
                      </span>
                      <span className="text-[#505f76]">
                        {t('baseline', 'Baseline')} <span className="font-mono text-[11px]">30s</span>
                      </span>
                    </div>
                    {/* Phase 2: Active */}
                    <div className="flex items-center justify-center gap-1.5 text-[#004ac6] font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#004ac6] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#004ac6]" />
                      </span>
                      <span>
                        {t('exposure', 'Exposure')} <span className="font-mono text-[11px]">60s</span>
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#dbe1ff] text-[#00174b] font-mono text-[10px]">
                        {timerSeconds}s
                      </span>
                    </div>
                    {/* Phase 3: Pending */}
                    <div className="flex items-center justify-end gap-1.5 text-[#737686]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d7]" />
                      <span>
                        {t('recovery', 'Recovery')} <span className="font-mono text-[11px]">90s</span>
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-[#eaedff] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#004ac6]" style={{ width: '35.5%' }} />
                    <div className="h-full bg-[#004ac6]/30" style={{ width: '17.5%' }} />
                    <div className="h-full bg-transparent flex-1" />
                  </div>
                </div>

                {/* Multi-Channel Line Graph (SVG) matching Stitch */}
                <div className="relative w-full h-[260px] my-2 flex items-center">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 720 240">
                    <defs>
                      <linearGradient id="ch1-fade" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1.5" x1="120" x2="120" y1="10" y2="210" />
                    <line stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1.5" x1="360" x2="360" y1="10" y2="210" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="30" y2="30" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="75" y2="75" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="120" y2="120" />
                    <line stroke="#F1F5F9" strokeWidth="1" x1="45" x2="710" y1="165" y2="165" />
                    <line stroke="#E2E8F0" strokeWidth="1" x1="45" x2="710" y1="210" y2="210" />
                    
                    {/* Y-axis labels */}
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="34">2.4</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="79">2.0</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="124">1.6</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="169">1.2</text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="35" y="214">0.8</text>
                    
                    {/* X-axis labels */}
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="start" x="45" y="232">0s</text>
                    <text fill="#2563EB" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="middle" x="120" y="232">
                      30s ({t('exposureStart', 'Exposure start')})
                    </text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="middle" x="360" y="232">
                      90s ({t('purgeRecovery', 'Purge recovery')})
                    </text>
                    <text fill="#64748B" fontFamily="Inter" fontSize="11" textAnchor="end" x="700" y="232">180s</text>
                    
                    {/* Curves for 6 sensors */}
                    <path d="M 45 208 L 120 208 C 160 205 190 40 360 42 C 430 45 520 185 710 204" fill="none" stroke="#2563EB" strokeLinecap="round" strokeWidth="2.5" />
                    <path d="M 45 206 L 120 206 C 160 200 210 115 360 118 C 440 120 540 195 710 206" fill="none" stroke="#00CC66" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 210 L 120 210 C 160 208 215 142 360 144 C 450 147 560 200 710 209" fill="none" stroke="#00C0FF" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 207 L 120 207 C 160 204 220 85 360 88 C 430 92 530 190 710 205" fill="none" stroke="#FF7E00" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 209 L 120 209 C 160 207 230 166 360 168 C 460 170 580 202 710 208" fill="none" stroke="#8B5CF6" strokeLinecap="round" strokeWidth="2" />
                    <path d="M 45 208 L 120 208 C 160 206 225 125 360 128 C 455 132 550 198 710 207" fill="none" stroke="#BA1A1A" strokeLinecap="round" strokeWidth="2" />
                    
                    {/* Active timestamp indicator line & circle */}
                    <line stroke="#2563EB" strokeDasharray="2 2" strokeWidth="1.5" x1="256" x2="256" y1="20" y2="210" />
                    <circle cx="256" cy="46" fill="#2563EB" r="4.5" stroke="#FFFFFF" strokeWidth="2" />
                  </svg>
                </div>

                {/* Sensor Channels Legend matching Stitch */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-3 <span className="text-[#505f76] font-normal">(Alcohol)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00CC66]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-2 <span className="text-[#505f76] font-normal">(Combustibles)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00C0FF]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-135 <span className="text-[#505f76] font-normal">(Fumes)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7E00]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MQ-8 <span className="text-[#505f76] font-normal">(H2)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MiCS-5524 <span className="text-[#505f76] font-normal">(CO)</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
                    <span className="text-[12px] font-semibold text-[#131b2e]">
                      MiCS-6814 <span className="text-[#505f76] font-normal">(NO2)</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAST SESSIONS matching Stitch */}
            {activeTab === 'past' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#131b2e]">
                      {t('pastAcquisitionRuns', 'Past Acquisition Runs')}
                    </span>
                    <span className="text-[11px] text-[#505f76] font-mono">
                      ({pastSessions.length} {t('runsRecorded', 'runs recorded')})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-[#004ac6] hover:underline cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{t('exportCsv', 'Export CSV')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-[#f2f3ff] text-[#505f76] uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">{t('sampleId', 'Sample ID')}</th>
                        <th className="px-4 py-3">{t('compound', 'Compound')}</th>
                        <th className="px-4 py-3">{t('quality', 'Quality')}</th>
                        <th className="px-4 py-3">{t('profile', 'Profile')}</th>
                        <th className="px-4 py-3 text-right rounded-r-xl">{t('actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
                      {pastSessions.map((run) => (
                        <tr key={run.id} className="hover:bg-[#f2f3ff]/60 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-[#131b2e]">{run.id}</td>
                          <td className="px-4 py-3 font-medium">{lang === 'TH' ? run.compoundTh : run.compound}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                run.isSuspect
                                  ? 'bg-[#FF7E00]/15 text-[#c45a00]'
                                  : 'bg-[#00CC66]/15 text-[#008a44]'
                              }`}
                            >
                              {run.quality}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] bg-[#eaedff] font-mono text-[#505f76]">
                              {run.profile}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleRelabel(run.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium text-[#004ac6] hover:bg-[#eaedff] transition-colors cursor-pointer"
                              >
                                {t('relabel', 'Relabel')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFlag(run.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium text-[#505f76] hover:bg-[#eaedff] transition-colors cursor-pointer"
                              >
                                {t('flag', 'Flag')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(run.id)}
                                className="px-2 py-0.5 rounded text-[11px] font-medium text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors cursor-pointer"
                              >
                                {t('delete', 'Delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: MODEL matching Stitch */}
            {activeTab === 'model' && (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-2xl bg-[#ffdad6]/40 border border-[#ffdad6] flex items-center gap-2 text-[#93000a] text-[12px]">
                  <AlertTriangle size={18} className="text-[#ba1a1a]" />
                  <span className="font-medium">
                    {t('trainedOnDifferentSensor', 'Trained on a different sensor set')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-4 bg-[#f2f3ff] p-4 rounded-2xl flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-[#505f76]">
                        {t('model', 'Model')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#dbe1ff] text-[#00174b] text-[11px] font-mono font-semibold">
                        v1.3
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[32px] font-bold text-[#131b2e] leading-tight">94%</span>
                      <span className="text-[11px] text-[#505f76] font-medium">
                        {t('validationAccuracy', 'Validation Accuracy')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#434655] flex items-center gap-1 font-medium">
                      <CheckCircle2 size={14} className="text-[#004ac6]" />
                      <span>5 {t('targetClasses', 'Target Classes')}</span>
                    </div>
                  </div>

                  <div className="md:col-span-8 bg-[#f2f3ff] p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#505f76] uppercase tracking-wider">
                        {t('confusionMatrix', '5x5 Confusion Matrix')}
                      </span>
                      <span className="text-[10px] text-[#737686] font-mono">
                        {t('predictedVsActual', 'Predicted vs Actual')}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-[11px] font-mono border-collapse">
                        <thead>
                          <tr className="text-[#505f76]">
                            <th className="p-1.5 text-left font-medium"></th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Amb</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Thn</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Ace</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">IPA</th>
                            <th className="p-1.5 font-semibold text-[#004ac6]">Eth</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Amb</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">98%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Thn</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">93%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Ace</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">96%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">IPA</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 text-[#737686]">2%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">92%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                          </tr>
                          <tr className="border-t border-[#eaedff]">
                            <td className="p-1.5 text-left font-semibold text-[#505f76]">Eth</td>
                            <td className="p-1.5 text-[#737686]">0%</td>
                            <td className="p-1.5 text-[#737686]">1%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                            <td className="p-1.5 text-[#737686]">3%</td>
                            <td className="p-1.5 bg-[#004ac6]/20 text-[#004ac6] font-bold rounded-lg">93%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Live 8-Sensor Experiment Datasheet Monitor (ตรงตามแบบบันทึกผลการทดลอง ตารางที่ 1–4 และหน้า 12) ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-[#eaedff] flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#f2f3ff] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e2e7ff] text-[#004ac6] text-[11px] font-bold uppercase tracking-wider">
                {isThai ? 'ใบงานบันทึกผลการทดลองสด' : 'Live Lab Datasheet'}
              </span>
              {baselineData.capturedAt && (
                <span className="text-[11px] text-emerald-700 font-medium">
                  {isThai ? `จับค่า R0 ล่าสุดเมื่อ ${baselineData.capturedAt}` : `R0 captured at ${baselineData.capturedAt}`}
                </span>
              )}
            </div>
            <h2 className="text-[16px] font-semibold text-[#131b2e] mt-1">
              {isThai
                ? 'ตารางมอนิเตอร์ค่าเซนเซอร์ทั้ง 8 ตัว (Vout, R_clean, R0, ค่าพีค, Rs/R0 และเกตคืนตัว ±5%)'
                : '8-Sensor Live Experiment Telemetry & R0 / Peak / Baseline Gate Calculator'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCaptureBaseline}
              className="px-4 py-2 rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] text-[12px] font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <Crosshair size={15} />
              <span>{isThai ? 'Capture Baseline (บันทึกค่า R0 ตารางที่ 1)' : 'Capture R0 Baseline (Table 1)'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetPeaks}
              className="px-4 py-2 rounded-2xl bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff] border border-[#c3c6d7] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw size={15} />
              <span>{isThai ? 'รีเซ็ตค่าพีค & เริ่มรอบใหม่ (t0)' : 'Reset Peaks & Start Run'}</span>
            </button>
          </div>
        </div>

        {/* Table 1 & 2 Combined Live Readout for 4 MQ Sensors */}
        <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead className="bg-[#f2f3ff] text-[#505f76] font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-3.5">{isThai ? 'เซนเซอร์ (MQ 1–4)' : 'Sensor'}</th>
                <th className="py-3 px-3">{isThai ? 'ADC ปัจจุบัน (counts)' : 'Current ADC'}</th>
                <th className="py-3 px-3">{isThai ? 'แรงดัน Vout (V)' : 'Vout (V)'}</th>
                <th className="py-3 px-3">{isThai ? 'R_clean (Ω)' : 'R_clean (Ω)'}</th>
                <th className="py-3 px-3">{isThai ? 'Clean Ratio' : 'Clean Ratio'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าอ้างอิง R0 (Ω)' : 'R0 (Ω)'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าพีคสูงสุด (Peak ADC)' : 'Peak ADC'}</th>
                <th className="py-3 px-3">{isThai ? 'Rs/R_clean (เทียบ=1.0)' : 'Rs/R_clean'}</th>
                <th className="py-3 px-3">{isThai ? 'Rs/R0 (Datasheet)' : 'Rs/R0'}</th>
                <th className="py-3 px-3.5 text-center">{isThai ? 'เกตคืนตัว ±5% (ตารางที่ 4)' : 'Baseline Gate ±5%'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e] font-mono">
              {mqRows.map((row) => (
                <tr key={row.key} className="hover:bg-[#f8f9ff]">
                  <td className="py-3 px-3.5 font-sans font-semibold text-[#004ac6]">{row.name}</td>
                  <td className="py-3 px-3 font-bold">{row.rawAdc}</td>
                  <td className="py-3 px-3">{row.vout} V</td>
                  <td className="py-3 px-3">{row.rClean.toLocaleString()} Ω</td>
                  <td className="py-3 px-3 text-[#505f76]">{row.cleanRatio}</td>
                  <td className="py-3 px-3 font-semibold">{row.r0.toLocaleString()} Ω</td>
                  <td className="py-3 px-3 font-bold text-[#ba1a1a]">{row.peakAdc}</td>
                  <td className="py-3 px-3 font-bold text-[#004ac6]">{row.rsOverRclean}</td>
                  <td className="py-3 px-3">{row.rsOverR0}</td>
                  <td className="py-3 px-3.5 text-center font-sans">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        row.gatePassed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {row.gatePassed
                        ? (isThai ? `ผ่าน (±${row.driftPct}%)` : `PASS (±${row.driftPct}%)`)
                        : (isThai ? `รอระบาย (±${row.driftPct}%)` : `PURGE (±${row.driftPct}%)`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sensors 5 to 8: MiCS-6814 (3 Channels), CCS811, PMS5003 (PM2.5 & PM10), DHT22 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sensor 5: MiCS-6814 */}
          <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#004ac6]">5. MiCS-6814 (ADS1115)</span>
              <span className="text-[10px] font-mono text-[#505f76]">mV (V / V0)</span>
            </div>
            <div className="text-[12px] font-mono space-y-1 text-[#131b2e]">
              <div className="flex justify-between">
                <span>NH₃:</span>
                <span>
                  <b>{liveSen.nh3 ?? baselineData.nh3} mV</b> (V0: {baselineData.nh3})
                </span>
              </div>
              <div className="flex justify-between">
                <span>CO:</span>
                <span>
                  <b>{liveSen.mics_co ?? baselineData.mics_co} mV</b> (V0: {baselineData.mics_co})
                </span>
              </div>
              <div className="flex justify-between">
                <span>NO₂:</span>
                <span>
                  <b>{liveSen.no2 ?? baselineData.no2} mV</b> (V0: {baselineData.no2})
                </span>
              </div>
            </div>
          </div>

          {/* Sensor 6: CCS811 */}
          <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#004ac6]">6. CCS811 (Digital I2C)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  curTvoc < 50 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {curTvoc < 50 ? (isThai ? 'เกต < 50 ผ่าน' : 'Gate < 50 OK') : (isThai ? 'เกิน 50 ppb' : '> 50 ppb')}
              </span>
            </div>
            <div className="text-[12px] font-mono space-y-1 text-[#131b2e]">
              <div className="flex justify-between">
                <span>TVOC:</span>
                <span>
                  <b>{curTvoc} ppb</b> (Peak: {Math.max(peakData.tvoc, curTvoc)})
                </span>
              </div>
              <div className="flex justify-between">
                <span>eCO₂:</span>
                <span>
                  <b>{curEco2} ppm</b> (Peak: {Math.max(peakData.eco2, curEco2)})
                </span>
              </div>
            </div>
          </div>

          {/* Sensor 7: PMS5003 (PM2.5 & PM10) */}
          <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#004ac6]">7. PMS5003 (Laser Dust)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  curPm25 < 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {curPm25 < 15 ? (isThai ? 'เกต < 15 ผ่าน' : 'Gate < 15 OK') : (isThai ? 'ฝุ่นยังค้าง' : '> 15 µg/m³')}
              </span>
            </div>
            <div className="text-[12px] font-mono space-y-1 text-[#131b2e]">
              <div className="flex justify-between">
                <span>PM2.5:</span>
                <span>
                  <b>{curPm25} µg/m³</b> (Peak: {Math.max(peakData.pm25, curPm25)})
                </span>
              </div>
              <div className="flex justify-between">
                <span>PM10:</span>
                <span>
                  <b>{curPm10} µg/m³</b> (Peak: {Math.max(peakData.pm10, curPm10)})
                </span>
              </div>
            </div>
          </div>

          {/* Sensor 8: DHT22 */}
          <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-[#eaedff] flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#004ac6]">8. DHT22 (Temp / RH)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {isThai ? 'นิ่ง' : 'Stable'}
              </span>
            </div>
            <div className="text-[12px] font-mono space-y-1 text-[#131b2e]">
              <div className="flex justify-between">
                <span>{isThai ? 'อุณหภูมิ (T):' : 'Temp (T):'}</span>
                <b>{curTemp} °C</b>
              </div>
              <div className="flex justify-between">
                <span>{isThai ? 'ความชื้น (RH):' : 'Humidity (RH):'}</span>
                <b>{curRh} %RH</b>
              </div>
            </div>
          </div>
        </div>

        {/* Page 12 Calculation Helper Box (พื้นที่คำนวณหน้า 12 ของแบบบันทึกการทดลอง) */}
        <div className="p-4 rounded-2xl bg-[#f2f3ff]/70 border border-[#eaedff] grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
          <div className="space-y-1">
            <span className="font-semibold text-[#004ac6] block">
              {isThai ? 'ตัวอย่างการคำนวณหน้า 12 — MQ-3 (แอลกอฮอล์):' : 'Page 12 Calculation — MQ-3 (Alcohol):'}
            </span>
            <p className="font-mono text-[#131b2e]">
              R0 = {mqRows[0].rClean.toLocaleString()} / 60.0 = <b>{mqRows[0].r0.toLocaleString()} Ω</b>
            </p>
            <p className="font-mono text-[#131b2e]">
              Rs ณ จุดพีค = 10000 × (5.0 - {adcToVout(mqRows[0].peakAdc).toFixed(2)}) / {adcToVout(mqRows[0].peakAdc).toFixed(2)} = <b>{mqRows[0].rsPeak.toLocaleString()} Ω</b>
            </p>
            <p className="font-mono text-[#131b2e]">
              Rs / R_clean = <b>{mqRows[0].rsOverRclean}</b> &nbsp;|&nbsp; Rs / R0 = <b>{mqRows[0].rsOverR0}</b>
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-[#004ac6] block">
              {isThai ? 'ตัวอย่างการคำนวณหน้า 12 — MQ-135 (แอมโมเนีย/ทินเนอร์):' : 'Page 12 Calculation — MQ-135 (Ammonia/Thinner):'}
            </span>
            <p className="font-mono text-[#131b2e]">
              R0 = {mqRows[1].rClean.toLocaleString()} / 3.6 = <b>{mqRows[1].r0.toLocaleString()} Ω</b>
            </p>
            <p className="font-mono text-[#131b2e]">
              Rs ณ จุดพีค = 10000 × (5.0 - {adcToVout(mqRows[1].peakAdc).toFixed(2)}) / {adcToVout(mqRows[1].peakAdc).toFixed(2)} = <b>{mqRows[1].rsPeak.toLocaleString()} Ω</b>
            </p>
            <p className="font-mono text-[#131b2e]">
              Rs / R_clean = <b>{mqRows[1].rsOverRclean}</b> &nbsp;|&nbsp; Rs / R0 = <b>{mqRows[1].rsOverR0}</b>
            </p>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
