import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SolventRadarModal({
  isOpen,
  onClose,
  solventMatch = 94,
  detectedLabel = 'ALCOHOL',
}) {
  const { t, isThai } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#283044]/40 backdrop-blur-xs transition-opacity"
      />
      <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#eaedff] z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-medium">
                {isThai ? 'การวิเคราะห์ลายนิ้วมือสารเคมี' : 'Chemical Fingerprint Analysis'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-semibold text-[#004ac6] bg-[#004ac6]/10">
                {isThai ? `ตรงกัน ${solventMatch}%` : `${solventMatch}% match`}
              </span>
            </div>
            <h3 className="text-[32px] font-bold text-[#131b2e] leading-tight">
              {isThai
                ? (detectedLabel === 'ALCOHOL'
                    ? 'ไอแอลกอฮอล์'
                    : detectedLabel === 'THINNER'
                    ? 'ไอทินเนอร์'
                    : detectedLabel === 'SMOKE'
                    ? 'ควัน / การเผาไหม้'
                    : 'บรรยากาศบริสุทธิ์')
                : (detectedLabel === 'ALCOHOL'
                    ? 'Alcohol Vapor'
                    : detectedLabel === 'THINNER'
                    ? 'Thinner Vapor'
                    : detectedLabel === 'SMOKE'
                    ? 'Smoke / Combustion'
                    : 'Clean Ambient Air')}{' '}
              <span className="text-[20px] text-[#505f76] font-normal font-sans">
                {isThai ? `ความสอดคล้อง ${solventMatch}%` : `${solventMatch}% match`}
              </span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#505f76] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-[13px] text-[#505f76] mb-4">
          {isThai
            ? 'การเปรียบเทียบสัญญาณแผงเซนเซอร์ตรวจวัดไอระเหยโลหะออกไซด์ 8 ช่องสัญญาณเทียบกับฐานข้อมูลลายเซ็นสารระเหย NIST'
            : 'Expanded 8-channel metal-oxide sensor matrix comparison against reference NIST VOC signature library.'}
        </p>

        {/* Large 8-Channel Radar Chart */}
        <div className="flex items-center justify-center py-4 bg-[#f2f3ff]/50 rounded-2xl border border-[#eaedff]">
          <div className="w-64 h-64">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 240 240">
              <defs>
                <radialGradient cx="50%" cy="50%" id="modalRadarGlow" r="50%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.02" />
                </radialGradient>
              </defs>
              {/* Outer Octagon ring (R=90) */}
              <polygon
                fill="none"
                points="120,30 183.6,56.4 210,120 183.6,183.6 120,210 56.4,183.6 30,120 56.4,56.4"
                stroke="#D1D5DB"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Middle Octagon ring (R=60) */}
              <polygon
                fill="none"
                points="120,60 162.4,77.6 180,120 162.4,162.4 120,180 77.6,162.4 60,120 77.6,77.6"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              {/* Inner Octagon ring (R=30) */}
              <polygon
                fill="none"
                points="120,90 141.2,98.8 150,120 141.2,141.2 120,150 98.8,141.2 90,120 98.8,98.8"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              {/* 8 Axes */}
              <line x1="120" y1="120" x2="120" y2="30" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="183.6" y2="56.4" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="210" y2="120" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="183.6" y2="183.6" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="120" y2="210" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="56.4" y2="183.6" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="30" y2="120" stroke="#E5E7EB" strokeWidth="1" />
              <line x1="120" y1="120" x2="56.4" y2="56.4" stroke="#E5E7EB" strokeWidth="1" />

              {/* 8-Channel Solvent Fingerprint polygon */}
              <polygon
                fill="url(#modalRadarGlow)"
                points="120,40 166,74 195,120 155,155 120,180 88,152 50,120 81,81"
                stroke="#2563EB"
                strokeWidth="2"
              />
              {/* Data vertices */}
              <circle cx="120" cy="40" fill="#2563EB" r="3" />
              <circle cx="166" cy="74" fill="#2563EB" r="3" />
              <circle cx="195" cy="120" fill="#2563EB" r="3" />
              <circle cx="155" cy="155" fill="#2563EB" r="3" />
              <circle cx="120" cy="180" fill="#2563EB" r="3" />
              <circle cx="88" cy="152" fill="#2563EB" r="3" />
              <circle cx="50" cy="120" fill="#2563EB" r="3" />
              <circle cx="81" cy="81" fill="#2563EB" r="3" />
              {/* Real Hardware Sensor Channel Labels matching Stitch */}
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="middle" x="120" y="20">MQ-3 (Alcohol)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="start" x="195" y="50">MQ-2 (Combustibles)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="start" x="218" y="124">MQ-135 (Fumes)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="start" x="195" y="195">MQ-8 (H₂)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="middle" x="120" y="228">CCS811 (TVOC)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="end" x="45" y="195">MiCS-6814 (CO)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="end" x="22" y="124">MiCS-6814 (NO₂)</text>
              <text className="fill-[#505f76] text-[10px] font-semibold" textAnchor="end" x="45" y="50">MiCS-6814 (NH₃)</text>
            </svg>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[12px] text-[#505f76]">
          <span>{isThai ? 'สารมาตรฐาน: การจำแนกตามชุดข้อมูลโมเดล (Alcohol / Ambient)' : 'Standard: Model Dataset Classification (Alcohol / Ambient)'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#004ac6] text-white text-[13px] font-medium hover:bg-[#2563eb] transition-colors cursor-pointer"
          >
            {t('done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
}

