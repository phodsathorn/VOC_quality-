/**
 * settings.js — ตัวช่วยอ่าน/เขียน Settings จาก localStorage
 */

const THRESHOLD_KEY = 'voc_thresholds';
const GENERAL_KEY   = 'voc_general';

// ─── Default values ───────────────────────────────────────────
export const DEFAULT_THRESHOLDS = {
  tvoc: { warn: 200,  critical: 400,  unit: 'ppb',    label: 'TVOC'  },
  pm25: { warn: 35,   critical: 75,   unit: 'µg/m³',  label: 'PM2.5' },
  eco2: { warn: 1000, critical: 2000, unit: 'ppm',    label: 'eCO₂'  },
};

export const DEFAULT_GENERAL = {
  boxId:           'BOX-001',
  refreshInterval: 5,          // วินาที
};

// ─── Threshold helpers ────────────────────────────────────────
export function getThresholds() {
  try {
    const s = localStorage.getItem(THRESHOLD_KEY);
    if (s) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(s) };
  } catch { /* ignore */ }
  return { ...DEFAULT_THRESHOLDS };
}

export function saveThresholds(t) {
  localStorage.setItem(THRESHOLD_KEY, JSON.stringify(t));
}

export function resetThresholds() {
  localStorage.removeItem(THRESHOLD_KEY);
}

// ─── General helpers ──────────────────────────────────────────
export function getGeneral() {
  try {
    const s = localStorage.getItem(GENERAL_KEY);
    if (s) return { ...DEFAULT_GENERAL, ...JSON.parse(s) };
  } catch { /* ignore */ }
  return { ...DEFAULT_GENERAL };
}

export function saveGeneral(g) {
  localStorage.setItem(GENERAL_KEY, JSON.stringify(g));
}

export function resetGeneral() {
  localStorage.removeItem(GENERAL_KEY);
}
