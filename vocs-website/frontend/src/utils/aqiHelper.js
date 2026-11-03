/**
 * Air4Thai (Pollution Control Department - PCD Thailand) AQI Standards
 * Reference: air4thai.pcd.go.th
 * 
 * 5 ระดับคุณภาพอากาศของประเทศไทย:
 * 1. 0 - 25: ดีมาก (ฟ้า #00b0f0)
 * 2. 26 - 50: ดี (เขียว #92d050 / #84cc16)
 * 3. 51 - 100: ปานกลาง (เหลือง #ffea00 / #eab308)
 * 4. 101 - 200: เริ่มมีผลกระทบต่อสุขภาพ (ส้ม #ff7c00 / #f97316)
 * 5. 201 ขึ้นไป: มีผลกระทบต่อสุขภาพ (แดง #e02424 / #ef4444)
 */

export const AQI_LEVELS = [
  {
    level: 1,
    min: 0,
    max: 25,
    rangeStr: '0 - 25',
    label: 'ดีมาก',
    labelEn: 'Very Good',
    color: '#00b0f0',
    colorHex: '#00b0f0',
    bg: '#e0f2fe',
    border: '#bae6fd',
    text: '#0369a1',
    description: 'คุณภาพอากาศดีมาก เหมาะสำหรับกิจกรรมกลางแจ้งและการท่องเที่ยว',
  },
  {
    level: 2,
    min: 26,
    max: 50,
    rangeStr: '26 - 50',
    label: 'ดี',
    labelEn: 'Good',
    color: '#84cc16',
    colorHex: '#84cc16',
    bg: '#ecfccb',
    border: '#d9f99d',
    text: '#3f6212',
    description: 'คุณภาพอากาศดี สามารถทำกิจกรรมกลางแจ้งได้ตามปกติ',
  },
  {
    level: 3,
    min: 51,
    max: 100,
    rangeStr: '51 - 100',
    label: 'ปานกลาง',
    labelEn: 'Moderate',
    color: '#eab308',
    colorHex: '#eab308',
    bg: '#fef9c3',
    border: '#fef08a',
    text: '#854d0e',
    description: 'ประชาชนทั่วไปทำกิจกรรมได้ ผู้ที่ต้องดูแลสุขภาพเป็นพิเศษควรลดเวลาทำกิจกรรมกลางแจ้ง',
  },
  {
    level: 4,
    min: 101,
    max: 200,
    rangeStr: '101 - 200',
    label: 'เริ่มมีผลกระทบต่อสุขภาพ',
    labelEn: 'Unhealthy for Sensitive Groups',
    color: '#f97316',
    colorHex: '#f97316',
    bg: '#ffedd5',
    border: '#fed7aa',
    text: '#9a3412',
    description: 'ควรเฝ้าระวังสุขภาพ หากมีอาการไอ จาม หายใจลำบาก ควรลดกิจกรรมกลางแจ้ง',
  },
  {
    level: 5,
    min: 201,
    max: 500,
    rangeStr: '201 ขึ้นไป',
    label: 'มีผลกระทบต่อสุขภาพ',
    labelEn: 'Hazardous',
    color: '#ef4444',
    colorHex: '#ef4444',
    bg: '#fee2e2',
    border: '#fca5a5',
    text: '#991b1b',
    description: 'ทุกคนควรหลีกเลี่ยงกิจกรรมกลางแจ้ง สวมหน้ากากป้องกันมลพิษตลอดเวลา',
  },
];

/**
 * คำนวณ AQI ตามค่า PM2.5 ตามเกณฑ์มาตรฐานกรมควบคุมมลพิษ (PCD)
 * @param {number} pm25 ค่าความเข้มข้น PM2.5 (µg/m³)
 * @returns {number} ค่าดัชนี AQI (0 - 500)
 */
export function calculatePm25Aqi(pm25) {
  if (pm25 == null || isNaN(pm25)) return 0;
  const val = Number(pm25);

  if (val <= 25) {
    // 0 - 25 µg/m³ -> AQI 0 - 25
    return Math.round(val);
  }
  if (val <= 37.5) {
    // 26 - 37.5 µg/m³ -> AQI 26 - 50
    return Math.round(26 + ((val - 25) / (37.5 - 25)) * (50 - 26));
  }
  if (val <= 50) {
    // 37.6 - 50 µg/m³ -> AQI 51 - 100
    return Math.round(51 + ((val - 37.5) / (50 - 37.5)) * (100 - 51));
  }
  if (val <= 90) {
    // 50.1 - 90 µg/m³ -> AQI 101 - 200
    return Math.round(101 + ((val - 50) / (90 - 50)) * (200 - 101));
  }
  // > 90 µg/m³ -> AQI > 200
  return Math.min(500, Math.round(201 + ((val - 90) / 100) * 100));
}

/**
 * ดึงหมวดหมู่ AQI ของ Air4Thai จากตัวเลข AQI หรือค่า PM2.5
 */
export function getAqiCategory(aqiValue) {
  const val = Math.max(0, Number(aqiValue) || 0);
  if (val <= 25) return AQI_LEVELS[0];
  if (val <= 50) return AQI_LEVELS[1];
  if (val <= 100) return AQI_LEVELS[2];
  if (val <= 200) return AQI_LEVELS[3];
  return AQI_LEVELS[4];
}
