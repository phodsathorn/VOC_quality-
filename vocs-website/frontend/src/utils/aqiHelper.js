/**
 * Factory VOC & Air Quality Standards (OSHA / ISO 16000 Calibration)
 * For Industrial Spray Booth & Coating Line 1
 * 
 * 5 Operational Levels:
 * 1. 0 - 50: Good (Emerald Green #10B981)
 * 2. 51 - 100: Moderate (Amber #F59E0B)
 * 3. 101 - 150: Sensitive Alert (Orange #F97316)
 * 4. 151 - 200: Unhealthy (Red #EF4444)
 * 5. 201+: Hazardous (Purple #8B5CF6)
 */

export const AQI_LEVELS = [
  {
    level: 1,
    min: 0,
    max: 50,
    rangeStr: '0 - 50',
    label: 'Good (ดีมาก)',
    labelEn: 'Good',
    color: '#10B981',
    colorHex: '#10B981',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    description: 'Baseline manufacturing condition. Air quality is ideal for all normal factory operations.',
  },
  {
    level: 2,
    min: 51,
    max: 100,
    rangeStr: '51 - 100',
    label: 'Moderate (ปานกลาง)',
    labelEn: 'Moderate',
    color: '#F59E0B',
    colorHex: '#F59E0B',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#b45309',
    description: 'Acceptable VOC dispersal; maintain standard ventilation and monitor lines.',
  },
  {
    level: 3,
    min: 101,
    max: 150,
    rangeStr: '101 - 150',
    label: 'Sensitive Alert (เริ่มมีผลกระทบ)',
    labelEn: 'Sensitive Alert',
    color: '#F97316',
    colorHex: '#F97316',
    bg: '#fff7ed',
    border: '#fed7aa',
    text: '#c2410c',
    description: 'Elevated organic vapors; increase booth exhaust fan rate and restrict entry.',
  },
  {
    level: 4,
    min: 151,
    max: 200,
    rangeStr: '151 - 200',
    label: 'Unhealthy (มีผลกระทบต่อสุขภาพ)',
    labelEn: 'Unhealthy',
    color: '#EF4444',
    colorHex: '#EF4444',
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#b91c1c',
    description: 'Exceeds standard ceiling; activate secondary scrubbers immediately.',
  },
  {
    level: 5,
    min: 201,
    max: 9999,
    rangeStr: '201+',
    label: 'Hazardous (อันตรายวิกฤต)',
    labelEn: 'Hazardous',
    color: '#8B5CF6',
    colorHex: '#8B5CF6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    text: '#6d28d9',
    description: 'Halt spray application, emergency cut-off, and evacuate booth enclosure now.',
  },
];

export function calculatePm25Aqi(pm25) {
  const p = Number(pm25) || 0;
  if (p <= 0) return 0;
  if (p <= 15) return Math.round((p / 15) * 50);
  if (p <= 35) return Math.round(50 + ((p - 15) / 20) * 50);
  if (p <= 75) return Math.round(100 + ((p - 35) / 40) * 50);
  if (p <= 150) return Math.round(150 + ((p - 75) / 75) * 50);
  return Math.min(300, Math.round(200 + ((p - 150) / 100) * 100));
}

export function getAqiCategory(aqiValue) {
  const val = Number(aqiValue) || 0;
  if (val <= 50) return AQI_LEVELS[0];
  if (val <= 100) return AQI_LEVELS[1];
  if (val <= 150) return AQI_LEVELS[2];
  if (val <= 200) return AQI_LEVELS[3];
  return AQI_LEVELS[4];
}
