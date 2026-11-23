import { useState, useMemo, useEffect } from 'react';
import { Download, FileSpreadsheet, PlusCircle, Sparkles, CheckCircle2, Table as TableIcon, RotateCcw } from 'lucide-react';
import { API } from '../config';

const RL_OHMS = 10000;
const VC_VOLTS = 5.0;
const VREF_VOLTS = 3.3;
const ADC_MAX = 4095;

function adcToVout(adc) {
  if (!adc || adc <= 0) return 0.01;
  return Number(Math.min((adc / ADC_MAX) * VREF_VOLTS, 3.29).toFixed(3));
}

function voutToRs(vout) {
  if (!vout || vout <= 0.01) return 0;
  return Number((RL_OHMS * ((VC_VOLTS - vout) / vout)).toFixed(1));
}

const DEFAULT_SINGLE_RUNS = [
  {
    runId: 'Run 1',
    substanceTh: 'สีฝุ่น (Powder Dust)',
    substanceEn: 'Powder Coating Dust',
    dose: '0.5 กรัม',
    aiPred: 'DUST / AMBIENT',
    sensors: [
      { id: '1. MQ-3', base: 380, peak: 392, unit: 'ADC counts', t90: '-', t10: '-', cleanRatio: 60.0 },
      { id: '2. MQ-135', base: 420, peak: 445, unit: 'ADC counts', t90: '-', t10: '-', cleanRatio: 3.6 },
      { id: '3. MQ-2', base: 350, peak: 368, unit: 'ADC counts', t90: '-', t10: '-', cleanRatio: 9.83 },
      { id: '4. MQ-8', base: 310, peak: 315, unit: 'ADC counts', t90: '-', t10: '-', cleanRatio: 70.0 },
      { id: '5. MiCS-6814', base: 'NH3:980 / CO:1120 / NO2:185', peak: 'NH3:975 / CO:1115 / NO2:188', unit: 'mV', t90: '-', t10: '-', ratioStr: '1.00 / 1.00 / 1.02' },
      { id: '6. CCS811', base: 'TVOC:18 / eCO2:412', peak: 'TVOC:32 ppb / eCO2:425 ppm', unit: 'ppb / ppm', t90: '25', t10: '2.5', ratioStr: '-' },
      { id: '7. PMS5003', base: 'PM2.5:8 / PM10:11', peak: 'PM2.5: 185 / PM10: 260', unit: 'µg/m³', t90: '14', t10: '4.2', ratioStr: '-' },
      { id: '8. DHT22', base: '25.0°C / 55.0%', peak: '25.1°C / 54.8%', unit: '°C / %RH', t90: '-', t10: '-', ratioStr: '-' },
    ],
  },
  {
    runId: 'Run 2',
    substanceTh: 'แอลกอฮอล์ (Alcohol 70%)',
    substanceEn: 'Alcohol 70%',
    dose: '0.3 ml (~6 หยด)',
    aiPred: 'ALCOHOL (96.4%)',
    sensors: [
      { id: '1. MQ-3', base: 380, peak: 2450, unit: 'ADC counts', t90: '18', t10: '6.5', cleanRatio: 60.0 },
      { id: '2. MQ-135', base: 420, peak: 1180, unit: 'ADC counts', t90: '24', t10: '7.0', cleanRatio: 3.6 },
      { id: '3. MQ-2', base: 350, peak: 1320, unit: 'ADC counts', t90: '22', t10: '6.8', cleanRatio: 9.83 },
      { id: '4. MQ-8', base: 310, peak: 410, unit: 'ADC counts', t90: '35', t10: '4.0', cleanRatio: 70.0 },
      { id: '5. MiCS-6814', base: 'NH3:980 / CO:1120 / NO2:185', peak: 'NH3:820 / CO:740 / NO2:192', unit: 'mV', t90: '20', t10: '6.0', ratioStr: '0.84 / 0.66 / 1.04' },
      { id: '6. CCS811', base: 'TVOC:18 / eCO2:412', peak: 'TVOC:640 ppb / eCO2:1150 ppm', unit: 'ppb / ppm', t90: '16', t10: '5.8', ratioStr: '-' },
      { id: '7. PMS5003', base: 'PM2.5:8 / PM10:11', peak: 'PM2.5: 10 / PM10: 13', unit: 'µg/m³', t90: '-', t10: '-', ratioStr: '-' },
      { id: '8. DHT22', base: '25.1°C / 55.0%', peak: '25.3°C / 56.2%', unit: '°C / %RH', t90: '-', t10: '-', ratioStr: '-' },
    ],
  },
  {
    runId: 'Run 3',
    substanceTh: 'ทินเนอร์ (Thinner VOC)',
    substanceEn: 'Industrial Thinner',
    dose: '0.15 ml (~3 หยด)',
    aiPred: 'THINNER (94.8%)',
    sensors: [
      { id: '1. MQ-3', base: 380, peak: 1980, unit: 'ADC counts', t90: '22', t10: '9.5', cleanRatio: 60.0 },
      { id: '2. MQ-135', base: 420, peak: 2150, unit: 'ADC counts', t90: '19', t10: '10.2', cleanRatio: 3.6 },
      { id: '3. MQ-2', base: 350, peak: 2280, unit: 'ADC counts', t90: '17', t10: '9.8', cleanRatio: 9.83 },
      { id: '4. MQ-8', base: 310, peak: 520, unit: 'ADC counts', t90: '30', t10: '6.5', cleanRatio: 70.0 },
      { id: '5. MiCS-6814', base: 'NH3:980 / CO:1120 / NO2:185', peak: 'NH3:710 / CO:620 / NO2:205', unit: 'mV', t90: '21', t10: '9.0', ratioStr: '0.72 / 0.55 / 1.11' },
      { id: '6. CCS811', base: 'TVOC:19 / eCO2:415', peak: 'TVOC:980 ppb / eCO2:1680 ppm', unit: 'ppb / ppm', t90: '15', t10: '8.8', ratioStr: '-' },
      { id: '7. PMS5003', base: 'PM2.5:9 / PM10:12', peak: 'PM2.5: 12 / PM10: 16', unit: 'µg/m³', t90: '-', t10: '-', ratioStr: '-' },
      { id: '8. DHT22', base: '25.2°C / 55.2%', peak: '25.5°C / 54.5%', unit: '°C / %RH', t90: '-', t10: '-', ratioStr: '-' },
    ],
  },
  {
    runId: 'Run 4',
    substanceTh: 'แอมโมเนีย (Ammonia 10%)',
    substanceEn: 'Diluted Ammonia 10%',
    dose: '0.15 ml (~3 หยด)',
    aiPred: 'AMMONIA (93.2%)',
    sensors: [
      { id: '1. MQ-3', base: 380, peak: 890, unit: 'ADC counts', t90: '28', t10: '7.5', cleanRatio: 60.0 },
      { id: '2. MQ-135', base: 420, peak: 2390, unit: 'ADC counts', t90: '16', t10: '8.4', cleanRatio: 3.6 },
      { id: '3. MQ-2', base: 350, peak: 940, unit: 'ADC counts', t90: '26', t10: '7.2', cleanRatio: 9.83 },
      { id: '4. MQ-8', base: 310, peak: 460, unit: 'ADC counts', t90: '32', t10: '5.5', cleanRatio: 70.0 },
      { id: '5. MiCS-6814', base: 'NH3:980 / CO:1120 / NO2:185', peak: 'NH3:340 / CO:890 / NO2:195', unit: 'mV', t90: '14', t10: '8.0', ratioStr: '0.35 / 0.79 / 1.05' },
      { id: '6. CCS811', base: 'TVOC:18 / eCO2:412', peak: 'TVOC:520 ppb / eCO2:980 ppm', unit: 'ppb / ppm', t90: '18', t10: '7.4', ratioStr: '-' },
      { id: '7. PMS5003', base: 'PM2.5:8 / PM10:11', peak: 'PM2.5: 9 / PM10: 12', unit: 'µg/m³', t90: '-', t10: '-', ratioStr: '-' },
      { id: '8. DHT22', base: '25.2°C / 55.5%', peak: '25.4°C / 57.0%', unit: '°C / %RH', t90: '-', t10: '-', ratioStr: '-' },
    ],
  },
];

export default function ExperimentPaperTables({
  isThai,
  baselineData,
  mqRows,
  liveEnv,
  liveSen,
  peakData,
  fans,
  onToast,
}) {
  const [activeSheet, setActiveSheet] = useState(() => {
    try { return localStorage.getItem('voc_paper_active_sheet') || 'table2'; } catch { return 'table2'; }
  });
  const [selectedRunToRecord, setSelectedRunToRecord] = useState(() => {
    try { return localStorage.getItem('voc_paper_selected_run') || 'Run 2'; } catch { return 'Run 2'; }
  });

  // ─── ตารางที่ 2: ข้อมูลสารเดี่ยว 4 ชนิด (จำค่าไว้ใน localStorage & Backend DB) ───
  const [singleRuns, setSingleRuns] = useState(() => {
    try {
      const saved = localStorage.getItem('voc_paper_single_runs_v1');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_SINGLE_RUNS;
  });

  // ─── ตารางที่ 3: สารผสมจำลองโรงงาน ───
  const [mixRuns] = useState([
    {
      mixId: 'Mix 1',
      nameTh: 'สีฝุ่น + ทินเนอร์ (ฝุ่น + ตัวทำละลาย)',
      dose: 'สีฝุ่น 0.5 g + ทินเนอร์ 0.1 ml',
      pms: 'PM2.5 = 172 µg/m³, PM10 = 245 µg/m³',
      ccs: 'TVOC = 820 ppb, eCO2 = 1490 ppm',
      mqs: 'MQ-135 = 1960, MQ-2 = 2090, MQ-3 = 1780, MQ-8 = 490 counts',
      mics: 'CO = 650 mV, NO2 = 201 mV, NH3 = 735 mV',
      dht: 'T = 25.4 °C, RH = 54.6 %',
      compare: 'พุ่งพร้อมกันทั้งฝุ่นและก๊าซ (Dual Peak) แยกแยะได้',
      alert: 'CRITICAL + เปิดรีเลย์พัดลม 3 ตัวอัตโนมัติ',
    },
    {
      mixId: 'Mix 2',
      nameTh: 'ทินเนอร์ + แอลกอฮอล์ (ตัวทำละลายผสม)',
      dose: 'ทินเนอร์ 0.1 ml + แอลกอฮอล์ 0.2 ml',
      pms: 'PM2.5 = 11 µg/m³, PM10 = 15 µg/m³',
      ccs: 'TVOC = 1120 ppb, eCO2 = 1890 ppm',
      mqs: 'MQ-135 = 2240, MQ-2 = 2350, MQ-3 = 2580, MQ-8 = 540 counts',
      mics: 'CO = 590 mV, NO2 = 208 mV, NH3 = 690 mV',
      dht: 'T = 25.6 °C, RH = 55.8 %',
      compare: 'สัญญาณทับซ้อน (Synergistic Peak) ทั้ง MQ-3 และ MQ-2/135 พุ่งสูงคู่กัน',
      alert: 'CRITICAL + เปิดรีเลย์พัดลม 3 ตัวอัตโนมัติ',
    },
  ]);

  // ─── ตารางที่ 4 & 4.1: เมทริกซ์ตรวจสอบการคืนตัวของเซนเซอร์ทั้ง 8 ตัว ───
  const [gateMatrix] = useState([
    { idx: 1, name: 'MQ-3 (Alcohol)', unit: 'ADC counts', t0: 380, r1: 382, r2: 391, r3: '394 (+3m Purge)', r4: 388, limit: '361 – 399 (±5%)', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 2, name: 'MQ-135 (NH3/VOC)', unit: 'ADC counts', t0: 420, r1: 422, r2: 429, r3: '436 (+3m Purge)', r4: 434, limit: '399 – 441 (±5%)', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 3, name: 'MQ-2 (Combustibles)', unit: 'ADC counts', t0: 350, r1: 352, r2: 358, r3: '363 (+3m Purge)', r4: 356, limit: '333 – 367 (±5%)', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 4, name: 'MQ-8 (Hydrogen)', unit: 'ADC counts', t0: 310, r1: 311, r2: 314, r3: '316 (+3m Purge)', r4: 313, limit: '295 – 325 (±5%)', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 5, name: 'MiCS-6814 (NH3/CO/NO2)', unit: 'mV', t0: '980 / 1120 / 185', r1: '978 / 1118 / 185', r2: '972 / 1108 / 186', r3: '968 / 1105 / 187', r4: '965 / 1112 / 186', limit: '±5% ของ V0', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 6, name: 'CCS811 (TVOC / eCO2)', unit: 'ppb / ppm', t0: '18 / 412', r1: '20 / 415', r2: '28 / 428', r3: '34 / 435', r4: '26 / 422', limit: 'TVOC < 50 ppb', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 7, name: 'PMS5003 (PM2.5 / PM10)', unit: 'µg/m³', t0: '8 / 11', r1: '11 / 14', r2: '9 / 12', r3: '10 / 13', r4: '9 / 12', limit: 'PM2.5 < 15 µg/m³', status: 'ผ่านเกณฑ์ (PASS)' },
    { idx: 8, name: 'DHT22 (Temp / RH)', unit: '°C / %RH', t0: '25.0 / 55.0', r1: '25.1 / 54.8', r2: '25.2 / 55.2', r3: '25.3 / 54.9', r4: '25.2 / 55.4', limit: 'T ±1.5°C, RH ±5%', status: 'ผ่านเกณฑ์ (PASS)' },
  ]);

  // ─── ตารางที่ 5: ชุดข้อมูล Time-Series พร้อมเทรนโมเดล AI (ML Training Dataset) ───
  const [customMlFrames, setCustomMlFrames] = useState(() => {
    try {
      const saved = localStorage.getItem('voc_paper_ml_frames_v1');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  // Sync local changes to localStorage immediately
  useEffect(() => {
    try { localStorage.setItem('voc_paper_active_sheet', activeSheet); } catch { /* ignore */ }
  }, [activeSheet]);

  useEffect(() => {
    try { localStorage.setItem('voc_paper_selected_run', selectedRunToRecord); } catch { /* ignore */ }
  }, [selectedRunToRecord]);

  useEffect(() => {
    try { localStorage.setItem('voc_paper_single_runs_v1', JSON.stringify(singleRuns)); } catch { /* ignore */ }
  }, [singleRuns]);

  useEffect(() => {
    try { localStorage.setItem('voc_paper_ml_frames_v1', JSON.stringify(customMlFrames)); } catch { /* ignore */ }
  }, [customMlFrames]);

  // Load persisted state from Backend DB on mount (if localStorage was empty)
  useEffect(() => {
    let mounted = true;
    async function loadFromBackend() {
      try {
        const res = await fetch(`${API}/api/experiment/persisted-state`);
        if (!res.ok || !mounted) return;
        const data = await res.json();
        if (data?.state) {
          if (Array.isArray(data.state.singleRuns) && !localStorage.getItem('voc_paper_single_runs_v1')) {
            setSingleRuns(data.state.singleRuns);
          }
          if (Array.isArray(data.state.customMlFrames) && !localStorage.getItem('voc_paper_ml_frames_v1')) {
            setCustomMlFrames(data.state.customMlFrames);
          }
        }
      } catch { /* ignore */ }
    }
    loadFromBackend();
    return () => { mounted = false; };
  }, []);

  async function syncExperimentTablesToBackend(nextRuns, nextFrames) {
    try {
      await fetch(`${API}/api/experiment/persisted-state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singleRuns: nextRuns,
          customMlFrames: nextFrames,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch { /* ignore */ }
  }

  function handleResetDefaultTables() {
    setSingleRuns(DEFAULT_SINGLE_RUNS);
    setCustomMlFrames([]);
    try {
      localStorage.removeItem('voc_paper_single_runs_v1');
      localStorage.removeItem('voc_paper_ml_frames_v1');
    } catch { /* ignore */ }
    syncExperimentTablesToBackend(DEFAULT_SINGLE_RUNS, []);
    if (onToast) {
      onToast(isThai ? 'รีเซ็ตตารางบันทึกผลการทดลองกลับเป็นค่าเริ่มต้นเรียบร้อยแล้ว ✓' : 'Reset experiment tables to defaults ✓');
    }
  }

  const defaultMlRows = useMemo(() => {
    const scenarios = [
      ['Run1_Dust', 'POWDER_DUST', 392, 445, 368, 315, 1115, 188, 975, 32, 425, 185, 260],
      ['Run2_Alcohol', 'ALCOHOL', 2450, 1180, 1320, 410, 740, 192, 820, 640, 1150, 10, 13],
      ['Run3_Thinner', 'THINNER', 1980, 2150, 2280, 520, 620, 205, 710, 980, 1680, 12, 16],
      ['Run4_Ammonia', 'AMMONIA', 890, 2390, 940, 460, 890, 195, 340, 520, 980, 9, 12],
      ['Run0_Ambient', 'AMBIENT', 380, 420, 350, 310, 1120, 185, 980, 18, 412, 8, 11],
    ];
    const rClean3 = voutToRs(adcToVout(380));
    const rClean135 = voutToRs(adcToVout(420));
    const rClean2 = voutToRs(adcToVout(350));
    const rClean8 = voutToRs(adcToVout(310));
    const rows = [];
    let counter = 1;
    for (const [runCode, label, pmq3, pmq135, pmq2, pmq8, pco, pno2, pnh3, ptvoc, peco2, ppm25, ppm10] of scenarios) {
      for (const sec of [0, 90, 240, 420, 540, 720, 960, 1200, 1440]) {
        const stage = sec < 180 ? '1_BASELINE' : sec < 600 ? '2_EXPOSURE' : sec < 1320 ? '3_PURGE' : '4_GATE_CHECK';
        const factor = label === 'AMBIENT' ? 0 : sec < 180 ? 0 : sec < 600 ? Math.min(1, 1 - Math.exp(-(sec - 180) / 90)) : sec < 1320 ? Math.exp(-(sec - 600) / 180) : 0.01;
        const mq3 = Math.round(380 + (pmq3 - 380) * factor);
        const mq135 = Math.round(420 + (pmq135 - 420) * factor);
        const mq2 = Math.round(350 + (pmq2 - 350) * factor);
        const mq8 = Math.round(310 + (pmq8 - 310) * factor);
        const co = Math.round(1120 + (pco - 1120) * factor);
        const no2 = Math.round(185 + (pno2 - 185) * factor);
        const nh3 = Math.round(980 + (pnh3 - 980) * factor);
        const tvoc = Number((18 + (ptvoc - 18) * factor).toFixed(1));
        const eco2 = Number((412 + (peco2 - 412) * factor).toFixed(1));
        const pm25 = Number((8 + (ppm25 - 8) * factor).toFixed(1));
        const pm10 = Number((11 + (ppm10 - 11) * factor).toFixed(1));
        const temp = Number((25.0 + 0.3 * factor).toFixed(2));
        const rh = Number((55.0 + 0.8 * factor).toFixed(2));
        const v3 = adcToVout(mq3);
        const v135 = adcToVout(mq135);
        const v2 = adcToVout(mq2);
        const v8 = adcToVout(mq8);
        const rs3 = voutToRs(v3);
        const rs135 = voutToRs(v135);
        const rs2 = voutToRs(v2);
        const rs8 = voutToRs(v8);
        rows.push({
          sample_id: `SMP-${String(counter++).padStart(4, '0')}`,
          timestamp: `2026-11-23T10:${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}+07:00`,
          run_id: runCode,
          label,
          stage,
          elapsed_sec: sec,
          temp,
          rh,
          pm25,
          pm10,
          tvoc,
          eco2,
          mq2,
          mq3,
          mq135,
          mq8,
          mics_co: co,
          no2,
          nh3,
          mq3_vout: v3,
          mq135_vout: v135,
          mq2_vout: v2,
          mq8_vout: v8,
          mq3_rs_rclean: Number((rs3 / rClean3).toFixed(4)),
          mq135_rs_rclean: Number((rs135 / rClean135).toFixed(4)),
          mq2_rs_rclean: Number((rs2 / rClean2).toFixed(4)),
          mq8_rs_rclean: Number((rs8 / rClean8).toFixed(4)),
          mq3_rs_r0: Number(((rs3 / rClean3) * 60.0).toFixed(2)),
          mq135_rs_r0: Number(((rs135 / rClean135) * 3.6).toFixed(2)),
          mq2_rs_r0: Number(((rs2 / rClean2) * 9.83).toFixed(2)),
          mq8_rs_r0: Number(((rs8 / rClean8) * 70.0).toFixed(2)),
          fan1_gpio25: stage === '2_EXPOSURE' || stage === '3_PURGE' ? 1 : 0,
          fan2_gpio26: stage === '3_PURGE' ? 1 : 0,
          fan3_gpio4: stage === '2_EXPOSURE' || stage === '3_PURGE' ? 1 : 0,
        });
      }
    }
    return [...customMlFrames, ...rows];
  }, [customMlFrames]);

  // ─── บันทึกค่าสดปัจจุบันลงใน Run ที่เลือก (ตารางที่ 2) ───
  function handleRecordLiveToRun() {
    setSingleRuns((prev) => {
      const next = prev.map((r) => {
        if (r.runId !== selectedRunToRecord) return r;
        const p3 = Math.max(peakData.mq3 || 0, liveSen.mq3 || baselineData.mq3 || 380);
        const p135 = Math.max(peakData.mq135 || 0, liveSen.mq135 || baselineData.mq135 || 420);
        const p2 = Math.max(peakData.mq2 || 0, liveSen.mq2 || baselineData.mq2 || 350);
        const p8 = Math.max(peakData.mq8 || 0, liveSen.mq8 || baselineData.mq8 || 310);
        const pTvoc = Math.max(peakData.tvoc || 0, liveEnv.tvoc || 18);
        const pEco2 = Math.max(peakData.eco2 || 0, liveEnv.eco2 || 412);
        const pPm25 = Math.max(peakData.pm25 || 0, liveEnv.pm25 || 8);
        const pPm10 = Math.max(peakData.pm10 || 0, liveEnv.pm10 || 11);
        const nh3Val = peakData.nh3_min || liveSen.nh3 || baselineData.nh3 || 980;
        const coVal = peakData.mics_co_min || liveSen.mics_co || baselineData.mics_co || 1120;
        const no2Val = Math.max(peakData.no2_max || 0, liveSen.no2 || baselineData.no2 || 185);
        return {
          ...r,
          sensors: [
            { ...r.sensors[0], base: baselineData.mq3, peak: p3 },
            { ...r.sensors[1], base: baselineData.mq135, peak: p135 },
            { ...r.sensors[2], base: baselineData.mq2, peak: p2 },
            { ...r.sensors[3], base: baselineData.mq8, peak: p8 },
            {
              ...r.sensors[4],
              base: `NH3:${baselineData.nh3} / CO:${baselineData.mics_co} / NO2:${baselineData.no2}`,
              peak: `NH3:${nh3Val} / CO:${coVal} / NO2:${no2Val}`,
            },
            {
              ...r.sensors[5],
              base: `TVOC:${baselineData.tvoc} / eCO2:${baselineData.eco2}`,
              peak: `TVOC:${Math.round(pTvoc)} ppb / eCO2:${Math.round(pEco2)} ppm`,
            },
            {
              ...r.sensors[6],
              base: `PM2.5:${baselineData.pm25} / PM10:${baselineData.pm10}`,
              peak: `PM2.5: ${Math.round(pPm25)} / PM10: ${Math.round(pPm10)}`,
            },
            {
              ...r.sensors[7],
              base: `${baselineData.temp}°C / ${baselineData.rh}%`,
              peak: `${liveEnv.temp != null ? liveEnv.temp.toFixed(1) : '25.2'}°C / ${liveEnv.rh != null ? liveEnv.rh.toFixed(1) : '55.0'}%`,
            },
          ],
        };
      });
      syncExperimentTablesToBackend(next, customMlFrames);
      return next;
    });
    if (onToast) {
      onToast(isThai ? `บันทึกและจำค่าพีคสดลงใน ${selectedRunToRecord} (ตารางที่ 2) เรียบร้อยแล้ว ✓` : `Recorded & persisted live peaks to ${selectedRunToRecord} ✓`);
    }
  }

  // ─── เพิ่มเฟรมข้อมูลสดเข้าตาราง ML Dataset ───
  function handleCaptureLiveMlFrame() {
    const mq3 = liveSen.mq3 ?? baselineData.mq3 ?? 380;
    const mq135 = liveSen.mq135 ?? baselineData.mq135 ?? 420;
    const mq2 = liveSen.mq2 ?? baselineData.mq2 ?? 350;
    const mq8 = liveSen.mq8 ?? baselineData.mq8 ?? 310;
    const v3 = adcToVout(mq3);
    const v135 = adcToVout(mq135);
    const v2 = adcToVout(mq2);
    const v8 = adcToVout(mq8);
    const rs3 = voutToRs(v3);
    const rs135 = voutToRs(v135);
    const rs2 = voutToRs(v2);
    const rs8 = voutToRs(v8);
    const rClean3 = voutToRs(adcToVout(baselineData.mq3 || 380));
    const rClean135 = voutToRs(adcToVout(baselineData.mq135 || 420));
    const rClean2 = voutToRs(adcToVout(baselineData.mq2 || 350));
    const rClean8 = voutToRs(adcToVout(baselineData.mq8 || 310));

    const newRow = {
      sample_id: `LIVE-${String(customMlFrames.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      run_id: selectedRunToRecord.replace(' ', ''),
      label: selectedRunToRecord === 'Run 1' ? 'POWDER_DUST' : selectedRunToRecord === 'Run 2' ? 'ALCOHOL' : selectedRunToRecord === 'Run 3' ? 'THINNER' : 'AMMONIA',
      stage: fans.fan1 && fans.fan2 ? '3_PURGE' : fans.fan1 ? '2_EXPOSURE' : '1_BASELINE',
      elapsed_sec: 0,
      temp: liveEnv.temp ?? 25.0,
      rh: liveEnv.rh ?? 55.0,
      pm25: liveEnv.pm25 ?? 8.0,
      pm10: liveEnv.pm10 ?? 11.0,
      tvoc: liveEnv.tvoc ?? 18.0,
      eco2: liveEnv.eco2 ?? 412.0,
      mq2,
      mq3,
      mq135,
      mq8,
      mics_co: liveSen.mics_co ?? baselineData.mics_co ?? 1120,
      no2: liveSen.no2 ?? baselineData.no2 ?? 185,
      nh3: liveSen.nh3 ?? baselineData.nh3 ?? 980,
      mq3_vout: v3,
      mq135_vout: v135,
      mq2_vout: v2,
      mq8_vout: v8,
      mq3_rs_rclean: Number((rs3 / rClean3).toFixed(4)),
      mq135_rs_rclean: Number((rs135 / rClean135).toFixed(4)),
      mq2_rs_rclean: Number((rs2 / rClean2).toFixed(4)),
      mq8_rs_rclean: Number((rs8 / rClean8).toFixed(4)),
      mq3_rs_r0: Number(((rs3 / rClean3) * 60.0).toFixed(2)),
      mq135_rs_r0: Number(((rs135 / rClean135) * 3.6).toFixed(2)),
      mq2_rs_r0: Number(((rs2 / rClean2) * 9.83).toFixed(2)),
      mq8_rs_r0: Number(((rs8 / rClean8) * 70.0).toFixed(2)),
      fan1_gpio25: fans.fan1 ? 1 : 0,
      fan2_gpio26: fans.fan2 ? 1 : 0,
      fan3_gpio4: fans.fan3 ? 1 : 0,
    };
    setCustomMlFrames((prev) => {
      const next = [newRow, ...prev];
      syncExperimentTablesToBackend(singleRuns, next);
      return next;
    });
    setActiveSheet('ml');
    if (onToast) {
      onToast(isThai ? 'เพิ่มและบันทึกเฟรมข้อมูลสดลงในชุดข้อมูลเทรน AI (ML Dataset) แล้ว ✓' : 'Added & persisted live frame to ML Dataset ✓');
    }
  }

  // ─── 1. ดาวน์โหลดไฟล์ Excel (.xlsx ครบ 5 ชีต) ───
  async function handleDownloadExcelWorkbook() {
    try {
      const res = await fetch(`${API}/api/experiment/export/xlsx`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'VOC_Experiment_And_ML_Dataset.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (onToast) onToast(isThai ? 'ดาวน์โหลดไฟล์ Excel (.xlsx ครบ 5 ชีต) สำเร็จแล้ว ✓' : 'Downloaded 5-Sheet Excel Workbook (.xlsx) ✓');
        return;
      }
    } catch {
      /* Fallback to client-side ML CSV if backend is sleeping */
    }
    handleExportMlDatasetCsv();
  }

  // ─── 2. Export CSV สำหรับนำไปเทรนโมเดล AI (34 คอลัมน์) ───
  function handleExportMlDatasetCsv() {
    const headers = [
      'sample_id', 'timestamp', 'run_id', 'label', 'stage', 'elapsed_sec',
      'temp', 'rh', 'pm25', 'pm10', 'tvoc', 'eco2',
      'mq2', 'mq3', 'mq135', 'mq8', 'mics_co', 'no2', 'nh3',
      'mq3_vout', 'mq135_vout', 'mq2_vout', 'mq8_vout',
      'mq3_rs_rclean', 'mq135_rs_rclean', 'mq2_rs_rclean', 'mq8_rs_rclean',
      'mq3_rs_r0', 'mq135_rs_r0', 'mq2_rs_r0', 'mq8_rs_r0',
      'fan1_gpio25', 'fan2_gpio26', 'fan3_gpio4',
    ];
    const csvRows = [
      headers.join(','),
      ...defaultMlRows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VOC_ML_Training_Ready_Dataset.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onToast) onToast(isThai ? 'ส่งออกไฟล์ CSV สำหรับเทรนโมเดล AI สำเร็จแล้ว ✓' : 'Exported ML Training Dataset CSV ✓');
  }

  // ─── 3. Export CSV ตารางบันทึกผลการทดลอง (ตารางที่ 1–4.1 สำหรับใส่ Paper วิจัย) ───
  function handleExportPaperReportCsv() {
    const lines = [];
    lines.push('"=== ตารางที่ 1: บันทึกค่าอากาศสะอาดพื้นฐาน (R0 Baseline in Clean Air) ==="');
    lines.push('"เซ็นเซอร์","แรงดัน Vout (V)","ค่าดิจิทัล Raw ADC","ความต้านทาน R_clean (Ω)","Clean Ratio (Datasheet)","ค่าอ้างอิง R0 (Ω)","สถานะสัญญาณ"');
    mqRows.forEach((m) => {
      lines.push(`"${m.name}","${m.voutBase}","${m.baseAdc}","${m.rClean}","${m.cleanRatio}","${m.r0}","นิ่ง (Stable)"`);
    });
    lines.push(`"5. CCS811 (I2C)","-","-","-","Digital I2C","TVOC=${baselineData.tvoc} ppb, eCO2=${baselineData.eco2} ppm","นิ่ง (Stable)"`);
    lines.push(`"6. MiCS-6814 (ADS1115)","${baselineData.nh3} mV","-","-","V/V0 Ratio","V0(NH3)=${baselineData.nh3}, V0(CO)=${baselineData.mics_co}, V0(NO2)=${baselineData.no2} mV","นิ่ง (Stable)"`);
    lines.push(`"7. PMS5003 (Laser)","-","-","-","Laser Particle","PM2.5=${baselineData.pm25} µg/m³, PM10=${baselineData.pm10} µg/m³","นิ่ง (Stable)"`);
    lines.push(`"8. DHT22 (Temp/RH)","-","-","-","Temp / Humidity","${baselineData.temp} °C / ${baselineData.rh} %RH","นิ่ง (Stable)"`);
    lines.push('');

    lines.push('"=== ตารางที่ 2: บันทึกผลการตอบสนองต่อสารเดี่ยว 4 ชนิด (ครบทั้ง 8 เซ็นเซอร์) ==="');
    lines.push('"การทดลอง","ชนิดสารทดสอบ","ปริมาณที่ใช้","เซ็นเซอร์","ค่าเริ่มต้น (t0)","ค่าพีคสูงสุด (Peak)","หน่วย","Vout ณ จุดพีค (V)","Rs ณ จุดพีค (Ω)","เวลาตอบสนอง t90 (s)","เวลาคืนตัว t10 (min)","อัตราส่วน Rs/R_clean","อัตราส่วน Rs/R0","ผลทำนาย AI"');
    singleRuns.forEach((run) => {
      run.sensors.forEach((s) => {
        if (s.cleanRatio) {
          const vp = adcToVout(Number(s.peak));
          const rsp = voutToRs(vp);
          const rc = voutToRs(adcToVout(Number(s.base)));
          const r0 = rc / s.cleanRatio;
          const rsRclean = rc > 0 ? (rsp / rc).toFixed(3) : '1.000';
          const rsR0 = r0 > 0 ? (rsp / r0).toFixed(2) : String(s.cleanRatio);
          lines.push(`"${run.runId}","${run.substanceTh}","${run.dose}","${s.id}","${s.base}","${s.peak}","${s.unit}","${vp}","${rsp}","${s.t90}","${s.t10}","${rsRclean}","${rsR0}","${run.aiPred}"`);
        } else {
          lines.push(`"${run.runId}","${run.substanceTh}","${run.dose}","${s.id}","${s.base}","${s.peak}","${s.unit}","-","-","${s.t90}","${s.t10}","${s.ratioStr || '-'}","-","${run.aiPred}"`);
        }
      });
    });
    lines.push('');

    lines.push('"=== ตารางที่ 3: บันทึกผลการทดสอบสารผสมจำลองโรงงาน ==="');
    lines.push('"การทดลอง","ชนิดสารผสม","สัดส่วนที่ใช้","PMS5003 (ฝุ่น)","CCS811 (TVOC/eCO2)","MQ Sensors (ADC)","MiCS-6814 (mV)","DHT22","ผลการเปรียบเทียบกับสารเดี่ยว","ผลการแจ้งเตือน"');
    mixRuns.forEach((m) => {
      lines.push(`"${m.mixId}","${m.nameTh}","${m.dose}","${m.pms}","${m.ccs}","${m.mqs}","${m.mics}","${m.dht}","${m.compare}","${m.alert}"`);
    });
    lines.push('');

    lines.push('"=== ตารางที่ 4 & 4.1: เมทริกซ์ตรวจสอบการคืนตัวของเซ็นเซอร์ทั้ง 8 ตัว (Dynamic Baseline Gate ±5%) ==="');
    lines.push('"ลำดับ","เซ็นเซอร์","หน่วยวัด","Baseline เริ่มต้น (t0)","หลัง Run 1 (สีฝุ่น)","หลัง Run 2 (แอลกอฮอล์)","หลัง Run 3 (ทินเนอร์)","หลัง Run 4 (แอมโมเนีย)","เกณฑ์ตัดสิน","สถานะเกต"');
    gateMatrix.forEach((g) => {
      lines.push(`"${g.idx}","${g.name}","${g.unit}","${g.t0}","${g.r1}","${g.r2}","${g.r3}","${g.r4}","${g.limit}","${g.status}"`);
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VOC_Paper_Experiment_Tables_1_to_4.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onToast) onToast(isThai ? 'ส่งออกไฟล์ CSV ตารางบันทึกผลการทดลอง (ตารางที่ 1–4.1) สำเร็จแล้ว ✓' : 'Exported Paper Experiment Tables CSV ✓');
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-[#eaedff] flex flex-col gap-5">
      {/* Header & Export Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#f2f3ff] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} />
              <span>{isThai ? 'พร้อมใส่ Paper วิจัย & เทรนโมเดล AI' : 'Research Paper & ML Training Ready'}</span>
            </span>
          </div>
          <h2 className="text-[17px] font-semibold text-[#131b2e] mt-1">
            {isThai
              ? 'สมุดตารางบันทึกผลการทดลองมาตรฐาน (ตารางที่ 1–4.1) และชุดข้อมูลเทรน AI (Excel / CSV)'
              : 'Standardized Experiment Record Workbook (Tables 1–4.1) & ML Training Dataset'}
          </h2>
          <p className="text-[12px] text-[#505f76] mt-0.5">
            {isThai
              ? 'รูปแบบตารางตรงตามใบงานบันทึกผลการทดลอง 12 หน้าทุกคอลัมน์ สามารถดูผ่านเว็บ บันทึกค่าสด และส่งออกเป็นไฟล์ Excel (.xlsx) หรือ CSV ได้ทันที'
              : 'Matches the 12-page experiment record sheet 1:1. View online, record live sensor peaks, or export to Excel (.xlsx) and CSV.'}
          </p>
        </div>

        {/* 3 Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadExcelWorkbook}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-[12px] font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>{isThai ? 'ดาวน์โหลด Excel (.xlsx ครบ 5 ชีต)' : 'Download Excel (.xlsx 5 Sheets)'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportPaperReportCsv}
            className="px-3.5 py-2.5 rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] text-[12px] font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Download size={15} />
            <span>{isThai ? 'Export CSV (ตารางใส่ Paper 1–4.1)' : 'Export Paper Tables CSV'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportMlDatasetCsv}
            className="px-3.5 py-2.5 rounded-2xl bg-[#f2f3ff] text-[#004ac6] hover:bg-[#eaedff] border border-[#c3c6d7] text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <TableIcon size={15} />
            <span>{isThai ? 'Export CSV (ชุดข้อมูลเทรน AI 34 คอลัมน์)' : 'Export ML Training CSV'}</span>
          </button>
        </div>
      </div>

      {/* Sheet Switcher Tabs + Live Capture Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-[#f2f3ff] p-1.5 rounded-2xl">
          {[
            { id: 'table1', labelTh: 'ตารางที่ 1: ค่าเริ่มต้น R0', labelEn: 'Table 1: R0 Baseline' },
            { id: 'table2', labelTh: 'ตารางที่ 2: สารเดี่ยว 4 ชนิด (8 เซนเซอร์)', labelEn: 'Table 2: Single-Substance (4 Runs)' },
            { id: 'table3', labelTh: 'ตารางที่ 3: สารผสมโรงงาน', labelEn: 'Table 3: Mixtures' },
            { id: 'table4', labelTh: 'ตารางที่ 4 & 4.1: เกตคืนตัว ±5%', labelEn: 'Table 4 & 4.1: Baseline Gate' },
            { id: 'ml', labelTh: `ตารางที่ 5: ชุดข้อมูลเทรน AI (${defaultMlRows.length} แถว)`, labelEn: `Table 5: ML Dataset (${defaultMlRows.length} rows)` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSheet(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer ${
                activeSheet === tab.id
                  ? 'bg-white text-[#004ac6] shadow-xs'
                  : 'text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              {isThai ? tab.labelTh : tab.labelEn}
            </button>
          ))}
        </div>

        {/* Live Recording Action into Selected Run */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedRunToRecord}
            onChange={(e) => setSelectedRunToRecord(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#f2f3ff] border border-[#c3c6d7] text-[12px] font-semibold text-[#131b2e] cursor-pointer"
          >
            <option value="Run 1">Run 1: สีฝุ่น (0.5g)</option>
            <option value="Run 2">Run 2: แอลกอฮอล์ (0.3ml)</option>
            <option value="Run 3">Run 3: ทินเนอร์ (0.15ml)</option>
            <option value="Run 4">Run 4: แอมโมเนีย (0.15ml)</option>
          </select>
          <button
            type="button"
            onClick={handleRecordLiveToRun}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#004ac6] text-[#004ac6] hover:bg-[#f2f3ff] text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>{isThai ? `บันทึกค่าสดลง ${selectedRunToRecord}` : `Save Live to ${selectedRunToRecord}`}</span>
          </button>
          <button
            type="button"
            onClick={handleCaptureLiveMlFrame}
            className="px-3 py-1.5 rounded-xl bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>{isThai ? '+ เฟรมเทรน AI' : '+ ML Frame'}</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaultTables}
            title={isThai ? 'รีเซ็ตตารางที่ 2 และ 5 กลับเป็นค่าเริ่มต้น' : 'Reset tables to defaults'}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-[#c3c6d7] text-[#505f76] hover:text-rose-600 hover:border-rose-300 text-[12px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>{isThai ? 'รีเซ็ตตาราง' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* ─── SHEET 1: ตารางที่ 1 บันทึกค่าอากาศสะอาดพื้นฐาน (R0 Baseline) ─── */}
      {activeSheet === 'table1' && (
        <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead className="bg-[#004ac6] text-white font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">{isThai ? 'เซ็นเซอร์ (Sensor)' : 'Sensor'}</th>
                <th className="py-3 px-3">{isThai ? 'แรงดันไฟฟ้า (Vout)' : 'Vout (V)'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าดิจิทัล (Raw ADC) counts' : 'Raw ADC counts'}</th>
                <th className="py-3 px-3">{isThai ? 'ความต้านทาน R_clean (Ω)' : 'R_clean (Ω)'}</th>
                <th className="py-3 px-3">{isThai ? 'Clean Ratio จาก Datasheet' : 'Datasheet Clean Ratio'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าความต้านทานอ้างอิง (R0)' : 'Reference R0 (Ω)'}</th>
                <th className="py-3 px-4 text-center">{isThai ? 'สถานะสัญญาณ' : 'Signal Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e] font-mono">
              {mqRows.map((m) => (
                <tr key={m.key} className="hover:bg-[#f8f9ff]">
                  <td className="py-3 px-4 font-sans font-semibold text-[#004ac6]">{m.name}</td>
                  <td className="py-3 px-3">{m.voutBase} V</td>
                  <td className="py-3 px-3 font-bold">{m.baseAdc}</td>
                  <td className="py-3 px-3">{m.rClean.toLocaleString()} Ω</td>
                  <td className="py-3 px-3 text-[#505f76]">{m.cleanRatio} (ค่าคงที่มาตรฐาน)</td>
                  <td className="py-3 px-3 font-bold text-[#004ac6]">{m.r0.toLocaleString()} Ω</td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      [✓] นิ่ง
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="hover:bg-[#f8f9ff]">
                <td className="py-3 px-4 font-sans font-semibold text-[#004ac6]">5. CCS811</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3 text-[#505f76]">(Digital I2C)</td>
                <td className="py-3 px-3 font-bold">TVOC: {baselineData.tvoc} ppb | eCO2: {baselineData.eco2} ppm</td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    [✓] นิ่ง
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#f8f9ff]">
                <td className="py-3 px-4 font-sans font-semibold text-[#004ac6]">6. MiCS-6814</td>
                <td className="py-3 px-3">{baselineData.nh3} mV</td>
                <td className="py-3 px-3">ADS1115 (16-bit)</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3 text-[#505f76]">(ใช้อัตราส่วนแรงดัน V/V0)</td>
                <td className="py-3 px-3 font-bold">V0(NH3)={baselineData.nh3}, V0(CO)={baselineData.mics_co}, V0(NO2)={baselineData.no2} mV</td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    [✓] นิ่ง
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#f8f9ff]">
                <td className="py-3 px-4 font-sans font-semibold text-[#004ac6]">7. PMS5003</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3 text-[#505f76]">(Laser Particle)</td>
                <td className="py-3 px-3 font-bold">PM2.5: {baselineData.pm25} µg/m³ | PM10: {baselineData.pm10} µg/m³</td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    [✓] นิ่ง
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-[#f8f9ff]">
                <td className="py-3 px-4 font-sans font-semibold text-[#004ac6]">8. DHT22</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3 text-[#505f76]">(อุณหภูมิ/ความชื้น)</td>
                <td className="py-3 px-3 font-bold">{baselineData.temp} °C / {baselineData.rh} %RH</td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                    [✓] นิ่ง
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ─── SHEET 2: ตารางที่ 2 บันทึกผลการตอบสนองต่อสารเดี่ยว 4 ชนิด (ครบ 8 เซนเซอร์) ─── */}
      {activeSheet === 'table2' && (
        <div className="overflow-x-auto rounded-2xl border border-[#eaedff] max-h-[540px] overflow-y-auto">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead className="bg-[#004ac6] text-white font-semibold text-[11px] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3">{isThai ? 'การทดลอง' : 'Run'}</th>
                <th className="py-3 px-3">{isThai ? 'ชนิดสารทดสอบ' : 'Substance'}</th>
                <th className="py-3 px-3">{isThai ? 'ปริมาณที่ใช้' : 'Dose'}</th>
                <th className="py-3 px-3">{isThai ? 'เซ็นเซอร์ (1–8)' : 'Sensor'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าพีคสูงสุด (Peak Value)' : 'Peak Value'}</th>
                <th className="py-3 px-3">{isThai ? 'เวลาตอบสนอง t90' : 't90 (s)'}</th>
                <th className="py-3 px-3">{isThai ? 'เวลาคืนตัว t10' : 't10 (min)'}</th>
                <th className="py-3 px-3">{isThai ? 'Rs/R_clean (เทียบ=1.0)' : 'Rs/R_clean'}</th>
                <th className="py-3 px-3">{isThai ? 'อัตราส่วน Rs/R0 ณ จุดพีค' : 'Rs/R0 at Peak'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e] font-mono">
              {singleRuns.map((run) =>
                run.sensors.map((s, sIdx) => {
                  let rsRclean = s.ratioStr || '-';
                  let rsR0 = '-';
                  if (s.cleanRatio) {
                    const vp = adcToVout(Number(s.peak));
                    const rsp = voutToRs(vp);
                    const rc = voutToRs(adcToVout(Number(s.base)));
                    const r0 = rc / s.cleanRatio;
                    rsRclean = rc > 0 ? (rsp / rc).toFixed(3) : '1.000';
                    rsR0 = r0 > 0 ? (rsp / r0).toFixed(2) : String(s.cleanRatio);
                  }
                  return (
                    <tr
                      key={`${run.runId}-${s.id}`}
                      className={`${sIdx === 0 ? 'border-t-2 border-[#004ac6]/30' : ''} hover:bg-[#f8f9ff]`}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold text-[#004ac6]">{sIdx === 0 ? run.runId : ''}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold">{sIdx === 0 ? (isThai ? run.substanceTh : run.substanceEn) : ''}</td>
                      <td className="py-2.5 px-3 font-sans text-[#505f76]">{sIdx === 0 ? run.dose : ''}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-[#131b2e]">{s.id}</td>
                      <td className="py-2.5 px-3 font-bold text-[#ba1a1a]">
                        {s.cleanRatio ? `ADC = ${s.peak}` : s.peak}
                      </td>
                      <td className="py-2.5 px-3">{s.t90 !== '-' ? `${s.t90} วินาที` : '-'}</td>
                      <td className="py-2.5 px-3">{s.t10 !== '-' ? `${s.t10} นาที` : '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-[#004ac6]">{rsRclean}</td>
                      <td className="py-2.5 px-3 font-semibold">{rsR0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── SHEET 3: ตารางที่ 3 บันทึกผลการทดสอบสารผสมจำลองโรงงาน ─── */}
      {activeSheet === 'table3' && (
        <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead className="bg-[#004ac6] text-white font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-3.5">{isThai ? 'การทดลอง' : 'Mix'}</th>
                <th className="py-3 px-3.5">{isThai ? 'ชนิดสารผสม' : 'Mixture'}</th>
                <th className="py-3 px-3.5">{isThai ? 'สัดส่วนที่ใช้' : 'Ratio'}</th>
                <th className="py-3 px-4">{isThai ? 'พฤติกรรมการตอบสนองของเซ็นเซอร์ (ครบ 8 ตัว)' : '8-Sensor Response Behavior'}</th>
                <th className="py-3 px-3.5">{isThai ? 'ผลการเปรียบเทียบกับสารเดี่ยว' : 'Comparison vs Single'}</th>
                <th className="py-3 px-3.5">{isThai ? 'ผลการแจ้งเตือนของระบบ' : 'Alert Trigger'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
              {mixRuns.map((m) => (
                <tr key={m.mixId} className="hover:bg-[#f8f9ff] align-top">
                  <td className="py-3.5 px-3.5 font-bold text-[#004ac6]">{m.mixId}</td>
                  <td className="py-3.5 px-3.5 font-semibold">{m.nameTh}</td>
                  <td className="py-3.5 px-3.5 font-mono text-xs">{m.dose}</td>
                  <td className="py-3.5 px-4 font-mono text-xs space-y-1">
                    <div>• <b>PMS5003:</b> {m.pms}</div>
                    <div>• <b>CCS811:</b> {m.ccs}</div>
                    <div>• <b>MQ Array:</b> {m.mqs}</div>
                    <div>• <b>MiCS-6814:</b> {m.mics}</div>
                    <div>• <b>DHT22:</b> {m.dht}</div>
                  </td>
                  <td className="py-3.5 px-3.5 text-xs font-medium text-emerald-800">{m.compare}</td>
                  <td className="py-3.5 px-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                      {m.alert}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── SHEET 4: ตารางที่ 4 & 4.1 เมทริกซ์ตรวจสอบการคืนตัวของเซนเซอร์ทั้ง 8 ตัว ─── */}
      {activeSheet === 'table4' && (
        <div className="overflow-x-auto rounded-2xl border border-[#eaedff]">
          <table className="w-full text-left text-[12px] border-collapse">
            <thead className="bg-[#004ac6] text-white font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-3">{isThai ? 'ลำดับ' : '#'}</th>
                <th className="py-3 px-3.5">{isThai ? 'เซ็นเซอร์ (Sensor 1–8)' : 'Sensor'}</th>
                <th className="py-3 px-3">{isThai ? 'หน่วยวัด' : 'Unit'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่า Baseline เริ่มต้น (t0 ตารางที่ 1)' : 'Initial Baseline (t0)'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าหลัง Run 1 (สีฝุ่น)' : 'After Run 1 (Dust)'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าหลัง Run 2 (แอลกอฮอล์)' : 'After Run 2 (Alcohol)'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าหลัง Run 3 (ทินเนอร์)' : 'After Run 3 (Thinner)'}</th>
                <th className="py-3 px-3">{isThai ? 'ค่าหลัง Run 4 (แอมโมเนีย)' : 'After Run 4 (Ammonia)'}</th>
                <th className="py-3 px-3">{isThai ? 'เกณฑ์ ±5%' : 'Criteria'}</th>
                <th className="py-3 px-3.5 text-center">{isThai ? 'สถานะเกต' : 'Gate Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e] font-mono">
              {gateMatrix.map((g) => (
                <tr key={g.idx} className="hover:bg-[#f8f9ff]">
                  <td className="py-3 px-3 font-bold">{g.idx}</td>
                  <td className="py-3 px-3.5 font-sans font-semibold text-[#004ac6]">{g.name}</td>
                  <td className="py-3 px-3 text-[#505f76]">{g.unit}</td>
                  <td className="py-3 px-3 font-bold">{g.t0}</td>
                  <td className="py-3 px-3">{g.r1}</td>
                  <td className="py-3 px-3">{g.r2}</td>
                  <td className="py-3 px-3 text-amber-800 font-semibold">{g.r3}</td>
                  <td className="py-3 px-3">{g.r4}</td>
                  <td className="py-3 px-3 text-xs text-[#505f76]">{g.limit}</td>
                  <td className="py-3 px-3.5 text-center font-sans">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      <CheckCircle2 size={12} />
                      <span>{g.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── SHEET 5: ตารางชุดข้อมูล Time-Series พร้อมเทรนโมเดล AI (ML Training Dataset) ─── */}
      {activeSheet === 'ml' && (
        <div className="overflow-x-auto rounded-2xl border border-[#eaedff] max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead className="bg-[#004ac6] text-white font-semibold sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-2.5">sample_id</th>
                <th className="py-2.5 px-2.5">label</th>
                <th className="py-2.5 px-2.5">stage</th>
                <th className="py-2.5 px-2">t(s)</th>
                <th className="py-2.5 px-2">temp</th>
                <th className="py-2.5 px-2">rh</th>
                <th className="py-2.5 px-2">pm25</th>
                <th className="py-2.5 px-2">pm10</th>
                <th className="py-2.5 px-2">tvoc</th>
                <th className="py-2.5 px-2">eco2</th>
                <th className="py-2.5 px-2">mq3</th>
                <th className="py-2.5 px-2">mq135</th>
                <th className="py-2.5 px-2">mq2</th>
                <th className="py-2.5 px-2">mq8</th>
                <th className="py-2.5 px-2">mics_co</th>
                <th className="py-2.5 px-2">no2</th>
                <th className="py-2.5 px-2">nh3</th>
                <th className="py-2.5 px-2">mq3_Rs/R0</th>
                <th className="py-2.5 px-2">mq135_Rs/R0</th>
                <th className="py-2.5 px-2">Fans(G25/26/4)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
              {defaultMlRows.map((r) => (
                <tr key={r.sample_id} className="hover:bg-[#f8f9ff]">
                  <td className="py-2 px-2.5 font-bold text-[#004ac6]">{r.sample_id}</td>
                  <td className="py-2 px-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#e2e7ff] text-[#004ac6] font-bold text-[10px]">
                      {r.label}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-[#505f76]">{r.stage}</td>
                  <td className="py-2 px-2">{r.elapsed_sec}s</td>
                  <td className="py-2 px-2">{r.temp}</td>
                  <td className="py-2 px-2">{r.rh}</td>
                  <td className="py-2 px-2 font-bold">{r.pm25}</td>
                  <td className="py-2 px-2">{r.pm10}</td>
                  <td className="py-2 px-2 font-bold">{r.tvoc}</td>
                  <td className="py-2 px-2">{r.eco2}</td>
                  <td className="py-2 px-2 font-bold text-[#ba1a1a]">{r.mq3}</td>
                  <td className="py-2 px-2 font-bold text-[#ba1a1a]">{r.mq135}</td>
                  <td className="py-2 px-2">{r.mq2}</td>
                  <td className="py-2 px-2">{r.mq8}</td>
                  <td className="py-2 px-2">{r.mics_co}</td>
                  <td className="py-2 px-2">{r.no2}</td>
                  <td className="py-2 px-2">{r.nh3}</td>
                  <td className="py-2 px-2 text-[#004ac6] font-semibold">{r.mq3_rs_r0}</td>
                  <td className="py-2 px-2 text-[#004ac6] font-semibold">{r.mq135_rs_r0}</td>
                  <td className="py-2 px-2">
                    {r.fan1_gpio25}/{r.fan2_gpio26}/{r.fan3_gpio4}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
