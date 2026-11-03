import React from 'react';
import { AQI_LEVELS, getAqiCategory } from '../../utils/aqiHelper';

/**
 * แถบระดับดัชนีคุณภาพอากาศ 5 ระดับตามมาตรฐาน Air4Thai (กรมควบคุมมลพิษ)
 * Reference: air4thai.pcd.go.th
 * 
 * Props:
 * - currentAqi: ตัวเลข AQI ปัจจุบัน เพื่อแสดงหมุดมาร์กเกอร์บนแถบ (optional)
 * - showLabels: แสดงข้อความกำกับระดับหรือไม่ (default: true)
 * - compact: แสดงผลแบบกะทัดรัดสำหรับ widget ย่อย (default: false)
 */
export default function AqiScaleBar({ currentAqi = null, showLabels = true, compact = false, style = {} }) {
  const currentCategory = currentAqi != null ? getAqiCategory(currentAqi) : null;

  return (
    <div style={{ width: '100%', ...style }}>
      {/* 5-Level Horizontal Scale */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: compact ? 2 : 4,
        position: 'relative',
        borderRadius: compact ? 6 : 8,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        {AQI_LEVELS.map(lvl => {
          const isCurrent = currentCategory?.level === lvl.level;

          return (
            <div
              key={lvl.level}
              style={{
                backgroundColor: lvl.colorHex,
                color: lvl.level === 3 ? '#1e293b' : '#ffffff',
                padding: compact ? '6px 4px' : '10px 8px',
                textAlign: 'center',
                position: 'relative',
                transition: 'all 0.2s ease',
                outline: isCurrent ? '2px solid #0f172a' : 'none',
                zIndex: isCurrent ? 2 : 1,
              }}
            >
              {showLabels && (
                <div style={{
                  fontSize: compact ? '0.7rem' : '0.8rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                }}>
                  {lvl.label}
                </div>
              )}
              <div style={{
                fontSize: compact ? '0.65rem' : '0.75rem',
                fontWeight: 600,
                opacity: 0.95,
                marginTop: showLabels ? (compact ? 2 : 4) : 0,
                fontFamily: 'Inter, monospace',
              }}>
                {lvl.rangeStr}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current AQI Pointer Note (If provided) */}
      {currentAqi != null && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          fontSize: '0.8rem',
          color: '#475569',
        }}>
          <span>
            ดัชนีคุณภาพอากาศปัจจุบัน (AQI): <strong style={{ color: currentCategory?.colorHex, fontSize: '0.95rem' }}>{Math.round(currentAqi)}</strong>
          </span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 999,
            backgroundColor: currentCategory?.bg,
            color: currentCategory?.text,
            border: `1px solid ${currentCategory?.border}`,
          }}>
            {currentCategory?.label} ({currentCategory?.labelEn})
          </span>
        </div>
      )}
    </div>
  );
}
