import { getAqiCategory } from '../../utils/aqiHelper';

/**
 * Operational Air Quality Status Badge (OSHA / ISO 16000)
 */
export default function AqiBadge({ aqi, pm25 = null, showRange = false, style = {} }) {
  const category = getAqiCategory(aqi);

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold tracking-wide"
      style={{
        backgroundColor: category.bg,
        color: category.text,
        border: `1px solid ${category.border}`,
        ...style,
      }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: category.color }}
      />
      <span>{category.labelEn}</span>
      {showRange && (
        <span className="opacity-75 text-[10px]">({category.rangeStr})</span>
      )}
    </span>
  );
}
