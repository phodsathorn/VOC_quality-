import { AQI_LEVELS, getAqiCategory } from '../../utils/aqiHelper';

/**
 * Operational VOC & Air Quality Spectrum Bar (OSHA / ISO 16000 Calibration)
 */
export default function AqiScaleBar({ currentAqi = null, showLabels = true, compact = false, style = {} }) {
  const currentCat = currentAqi !== null ? getAqiCategory(currentAqi) : null;

  return (
    <div className="w-full flex flex-col gap-2" style={style}>
      <div className="relative w-full h-3 rounded-full bg-[#f2f3ff] p-0.5 flex gap-1 shadow-inner overflow-hidden">
        {AQI_LEVELS.map((level) => {
          const isSelected = currentCat && currentCat.level === level.level;
          return (
            <div
              key={level.level}
              className={`h-full rounded-full transition-all duration-300 relative group flex-1 ${
                isSelected ? 'ring-2 ring-white shadow-md' : 'opacity-85 hover:opacity-100'
              }`}
              style={{ backgroundColor: level.color }}
              title={`${level.rangeStr}: ${level.labelEn}`}
            />
          );
        })}
      </div>

      {showLabels && (
        <div className="flex justify-between items-center text-[11px] text-[#737686] font-medium pt-1">
          {AQI_LEVELS.map((level) => (
            <span key={level.level} className="text-center">
              {level.rangeStr}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
