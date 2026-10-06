/**
 * ppmConverter.js — แปลงค่า ADC / mV ของเซนเซอร์ MQ และ MiCS-6814
 *                   เป็นค่าความเข้มข้นก๊าซโดยประมาณ (~ppm)
 *
 * ⚠️  ข้อเท็จจริงทางเทคนิค (Sensor Physics & Limitations):
 *     1. Cross-sensitivity: เซนเซอร์แบบ Metal Oxide Semiconductor (MOS) ไวต่อก๊าซหลายชนิดพร้อมกัน
 *        เช่น MQ-2 ตอบสนองทั้ง Smoke, LPG, Butane, Alcohol
 *     2. ค่าที่แปลงได้เป็น "ค่าประมาณการตามก๊าซอ้างอิง" (Approximate Ref-Gas ppm) เพื่อดูแนวโน้ม
 *        ไม่ใช่การวัดเชิงวิเคราะห์ระดับห้องแล็บ
 *     3. สำหรับงาน AI / E-Nose: โมเดลจำแนกสารจะเรียนรู้จากสัญญาณดิบ (ADC/mV Pattern) ได้แม่นยำที่สุด
 *     4. ผลกระทบของอุณหภูมิและความชื้น (T/H drift) อาจทำให้ค่าเบี่ยงเบนได้ในระดับหนึ่ง
 *
 * หลักการคำนวณ (Datasheet Power Law Calibration):
 *   1. MQ sensors — วงจรแบ่งแรงดัน: Vc → Rs → AOUT → RL → GND
 *      Vout = Vc × RL / (Rs + RL)
 *      Rs/RL = (Vc / Vout) - 1
 *      เมื่อ Calibrate ในอากาศบริสุทธิ์ จะได้ค่า R_clean
 *      R0 (ค่าความต้านทานอ้างอิงบน Datasheet) = R_clean / cleanAirRatio
 *      Rs/R0 = (Rs / R_clean) × cleanAirRatio
 *      ppm = A × (Rs/R0)^B
 *
 *   2. MiCS-6814 — อ่านค่า mV ผ่าน ADS1115 (16-bit ADC)
 *      เปรียบเทียบกับค่า mV ตอนอากาศบริสุทธิ์ (V0)
 */

// ═══════════════════════════════════════════════════════════
// localStorage keys
// ═══════════════════════════════════════════════════════════
const BASELINE_KEY  = 'voc_r0_baseline';
const UNIT_MODE_KEY = 'voc_enose_unit';

// ═══════════════════════════════════════════════════════════
// ค่าคงที่ของวงจร
// ═══════════════════════════════════════════════════════════
const VC = 5.0;         // แรงดันเลี้ยงโมดูล MQ (5V)
const VREF = 3.3;       // แรงดันอ้างอิง ADC ของ ESP32
const ADC_MAX = 4095;   // 12-bit ADC

// ═══════════════════════════════════════════════════════════
// Datasheet Power Law Curve Parameters
// สูตร: ppm = A × (Rs/R0)^B
// ═══════════════════════════════════════════════════════════
export const MQ_CURVES = {
  mq2: {
    name: 'MQ-2',
    refGas: 'LPG/Smoke',
    gasLabelTh: 'ก๊าซหุงต้ม / ควัน',
    a: 574.25,
    b: -2.222,
    cleanRatio: 9.83, // Rs/R0 ในอากาศบริสุทธิ์จาก Datasheet
    minRatio: 0.1,
    maxPpm: 10000,
    unit: 'ppm',
  },
  mq3: {
    name: 'MQ-3',
    refGas: 'Alcohol',
    gasLabelTh: 'ไอแอลกอฮอล์ / ทินเนอร์',
    // แปลง 0.3934 mg/L เป็น ppm โดยคูณ 530.7 (MW EtOH = 46.07 g/mol ที่ 25°C 1 atm)
    // a = 0.3934 * 530.7 ≈ 208.78
    a: 208.78,
    b: -1.504,
    cleanRatio: 60.0, // Rs/R0 ในอากาศบริสุทธิ์
    minRatio: 0.01,
    maxPpm: 5000,
    unit: 'ppm',
  },
  mq8: {
    name: 'MQ-8',
    refGas: 'H₂',
    gasLabelTh: 'ก๊าซไฮโดรเจน',
    a: 976.97,
    b: -0.688,
    cleanRatio: 70.0, // Rs/R0 ในอากาศบริสุทธิ์
    minRatio: 0.01,
    maxPpm: 10000,
    unit: 'ppm',
  },
  mq135: {
    name: 'MQ-135',
    refGas: 'NH₃/Benzene',
    gasLabelTh: 'เบนซีน / แอมโมเนีย',
    a: 102.2,
    b: -2.473,
    cleanRatio: 3.6,  // Rs/R0 ในอากาศบริสุทธิ์
    minRatio: 0.1,
    maxPpm: 200,
    unit: 'ppm',
  },
};

export const MICS_CURVES = {
  mics_co: {
    name: 'MiCS-6814',
    channel: 'CO',
    refGas: 'CO',
    gasLabelTh: 'คาร์บอนมอนอกไซด์',
    a: 4.4638,
    b: -1.177,
    maxPpm: 1000,
    unit: 'ppm',
  },
  no2: {
    name: 'MiCS-6814',
    channel: 'NO₂',
    refGas: 'NO₂',
    gasLabelTh: 'ไนโตรเจนไดออกไซด์',
    a: 0.1516,
    b: 1.0827,
    maxPpm: 10,
    unit: 'ppm',
  },
  nh3: {
    name: 'MiCS-6814',
    channel: 'NH₃',
    refGas: 'NH₃',
    gasLabelTh: 'แอมโมเนีย',
    a: 0.6151,
    b: -1.903,
    maxPpm: 300,
    unit: 'ppm',
  },
};

// ═══════════════════════════════════════════════════════════
// ค่า Baseline อากาศบริสุทธิ์เริ่มต้น (Clean Air Baseline)
// ═══════════════════════════════════════════════════════════
// ค่าเหล่านี้มาจากค่าเฉลี่ยตอนเครื่องทำงานในอากาศบริสุทธิ์
export const DEFAULT_R0 = {
  mq2:     550,     // ADC (0–4095)
  mq3:     570,     // ADC (0–4095)
  mq8:     1080,    // ADC (0–4095)
  mq135:   670,     // ADC (0–4095)
  mics_co: 280,     // mV  (0–3300)
  no2:     190,     // mV  (0–3300)
  nh3:     280,     // mV  (0–3300)
};

// ═══════════════════════════════════════════════════════════
// R0 Baseline Storage Management
// ═══════════════════════════════════════════════════════════
export function getBaseline() {
  try {
    const s = localStorage.getItem(BASELINE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      return { ...DEFAULT_R0, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_R0 };
}

export function saveBaseline(r0) {
  try {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(r0));
  } catch { /* ignore */ }
}

export function resetBaseline() {
  try {
    localStorage.removeItem(BASELINE_KEY);
  } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════
// Unit Mode ('raw' | 'ppm')
// ═══════════════════════════════════════════════════════════
export function getUnitMode() {
  try {
    return localStorage.getItem(UNIT_MODE_KEY) || 'raw';
  } catch {
    return 'raw';
  }
}

export function setUnitMode(mode) {
  try {
    localStorage.setItem(UNIT_MODE_KEY, mode);
  } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════
// การคำนวณความเข้มข้น (Calculations)
// ═══════════════════════════════════════════════════════════

/**
 * คำนวณอัตราส่วน Rs/R0 ของเซนเซอร์ MQ
 *
 * @param {number} adc - ค่า ADC ปัจจุบัน (0–4095)
 * @param {number} r0Adc - ค่า ADC ตอน Clean Air
 * @param {number} cleanRatio - Rs/R0 ตาม Datasheet ใน Clean Air
 * @returns {number|null}
 */
function mqAdcToRsR0(adc, r0Adc, cleanRatio) {
  if (!adc || adc <= 0 || !r0Adc || r0Adc <= 0) return null;

  // แปลง ADC เป็น Vout (0–3.3V)
  const vout = Math.min((adc / ADC_MAX) * VREF, 3.29);
  const voutR0 = Math.min((r0Adc / ADC_MAX) * VREF, 3.29);

  if (vout <= 0.05 || voutR0 <= 0.05) return null;

  // Rs / RL = (VC / Vout) - 1
  const rsOverRl = (VC / vout) - 1;
  const r0OverRl = (VC / voutR0) - 1;

  if (r0OverRl <= 0) return null;

  // Rs / R_clean
  const ratioClean = rsOverRl / r0OverRl;

  // Rs / R0 (R0 ตามนิยาม Datasheet)
  const rsR0 = ratioClean * cleanRatio;
  return rsR0;
}

/**
 * คำนวณ ppm ของเซนเซอร์ MQ
 */
function mqRsR0ToPpm(ratio, curve) {
  if (ratio == null || ratio <= 0) return 0;

  // ถ้าความต้านทานสูงกว่าหรือเท่ากับ Clean Air แสดงว่าไม่มีก๊าซเจือปน
  if (ratio >= curve.cleanRatio) return 0;

  let r = ratio;
  if (r < curve.minRatio) r = curve.minRatio;

  let ppm = curve.a * Math.pow(r, curve.b);

  if (ppm < 0) ppm = 0;
  if (ppm > curve.maxPpm) ppm = curve.maxPpm;

  return ppm;
}

/**
 * คำนวณ ppm ของ MiCS-6814
 *
 * @param {number} mv - ค่า mV ปัจจุบัน
 * @param {number} r0Mv - ค่า mV ตอน Clean Air
 * @param {Object} curve - พารามิเตอร์ของแต่ละ Channel
 */
function micsMvToPpm(mv, r0Mv, curve) {
  if (!mv || mv <= 0 || !r0Mv || r0Mv <= 0) return 0;

  if (curve.channel === 'NO₂') {
    // NO2 เป็นก๊าซออกซิไดซ์: ความต้านทานเพิ่ม -> แรงดันเพิ่มเมื่อตรวจพบก๊าซ
    if (mv <= r0Mv) return 0; // อากาศสะอาด (หรือไม่มีก๊าซ NO2)
    const ratio = mv / r0Mv;
    let ppm = curve.a * Math.pow(ratio, curve.b);
    return Math.min(Math.max(ppm, 0), curve.maxPpm);
  } else {
    // CO และ NH3 เป็นก๊าซรีดิวซ์: ความต้านทานลด -> แรงดันขาออกลดลงเมื่อตรวจพบก๊าซ
    if (mv >= r0Mv) return 0; // อากาศสะอาด
    const ratio = mv / r0Mv;
    let ppm = curve.a * Math.pow(ratio, curve.b);
    return Math.min(Math.max(ppm, 0), curve.maxPpm);
  }
}

/**
 * แปลง TVOC จาก ppb เป็น ppm (1 ppm = 1,000 ppb)
 * @param {number} ppb
 * @returns {number|null}
 */
export function convertTvocToPpm(ppb) {
  if (ppb == null || isNaN(ppb)) return null;
  return ppb / 1000;
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

/**
 * แปลงค่าเซนเซอร์ทั้งหมดเป็น ppm
 *
 * @param {Object} sensors - { mq2, mq3, mq8, mq135, mics_co, no2, nh3 }
 * @param {Object} [r0Override] - Optional baseline override
 * @returns {Object} ผลลัพธ์พร้อมทั้งค่า ppm, ratio, refGas, unit
 */
export function convertAllToPpm(sensors, r0Override) {
  if (!sensors) return {};

  const r0 = r0Override || getBaseline();
  const result = {};

  // MQ Sensors
  for (const key of ['mq2', 'mq3', 'mq8', 'mq135']) {
    const adc = sensors[key];
    const curve = MQ_CURVES[key];
    const r0Val = r0[key] || DEFAULT_R0[key];

    const ratio = mqAdcToRsR0(adc, r0Val, curve.cleanRatio);
    const ppm = mqRsR0ToPpm(ratio, curve);

    result[key] = {
      raw: adc,
      ppm: ppm != null ? Math.round(ppm * 100) / 100 : 0,
      ratio: ratio != null ? Math.round(ratio * 100) / 100 : null,
      refGas: curve.refGas,
      gasLabelTh: curve.gasLabelTh,
      unit: curve.unit,
      rawUnit: 'ADC',
      r0: r0Val,
    };
  }

  // MiCS-6814
  for (const key of ['mics_co', 'no2', 'nh3']) {
    const mv = sensors[key];
    const curve = MICS_CURVES[key];
    const r0Val = r0[key] || DEFAULT_R0[key];

    const ppm = micsMvToPpm(mv, r0Val, curve);

    result[key] = {
      raw: mv,
      ppm: ppm != null ? Math.round(ppm * 100) / 100 : 0,
      refGas: curve.refGas,
      gasLabelTh: curve.gasLabelTh,
      unit: curve.unit,
      rawUnit: 'mV',
      r0: r0Val,
    };
  }

  return result;
}

/**
 * จัดรูปแบบการแสดงผล ppm
 * @param {number|null} ppm
 * @param {string} [unit='ppm']
 */
export function formatPpm(ppm, unit = 'ppm') {
  if (ppm == null || isNaN(ppm)) return '—';
  if (ppm === 0) return '0.00';
  if (ppm < 0.01) return '< 0.01';
  if (ppm >= 1000) return Math.round(ppm).toLocaleString();
  if (ppm >= 100) return ppm.toFixed(1);
  return ppm.toFixed(2);
}
