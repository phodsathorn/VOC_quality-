import React from 'react';
import { getAqiCategory } from '../../utils/aqiHelper';

/**
 * ป้ายสถานะคุณภาพอากาศตามระดับ Air4Thai PCD
 */
export default function AqiBadge({ aqi, pm25 = null, showRange = false, style = {} }) {
  const value = aqi != null ? aqi : (pm25 != null ? pm25 : 0);
  const cat = getAqiCategory(value);

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: '0.75rem',
      fontWeight: 700,
      backgroundColor: cat.bg,
      color: cat.text,
      border: `1px solid ${cat.border}`,
      lineHeight: 1.3,
      ...style,
    }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        backgroundColor: cat.colorHex,
        display: 'inline-block',
      }} />
      <span>{cat.label}</span>
      {showRange && <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({cat.rangeStr})</span>}
    </span>
  );
}
