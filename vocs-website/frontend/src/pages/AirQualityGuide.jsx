import { useState } from 'react';
import {
  Info, Calculator, X, Users, ShieldAlert,
  HardHat, ArrowRight, Activity, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AirQualityGuide() {
  const { t, lang } = useLanguage();

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // Quick Calculator state
  const [calcPollutant, setCalcPollutant] = useState('PM2.5');
  const [calcVal, setCalcVal] = useState('38');

  // 5 Air Quality Levels matching Stitch AI & PCD standards
  const levels = [
    {
      range: '0–25',
      nameEn: 'Very Good',
      nameTh: 'ดีมาก',
      color: '#00C0FF',
      bgLight: 'bg-[#00C0FF]/10 text-[#0088cc]',
      descEn: 'Safe, ideal for all operations',
      descTh: 'ปลอดภัย ทำงานได้ปกติ',
      generalEn: 'Air quality is pristine. Normal industrial operations proceed without ventilation adjustment.',
      generalTh: 'คุณภาพอากาศดีมาก ไม่มีผลกระทบต่อสุขภาพ สามารถปฏิบัติงานในโรงงานได้ตามรอบปกติ',
      sensitiveEn: 'No precautions needed. Ideal air baseline for all personnel.',
      sensitiveTh: 'ไม่มีข้อจำกัด สามารถปฏิบัติงานได้ตามปกติ ไม่พบความเสี่ยงต่อระบบทางเดินหายใจ',
      ppeEn: 'Standard factory PPE (hearing protection & basic safety goggles).',
      ppeTh: 'อุปกรณ์คุ้มครองความปลอดภัยส่วนบุคคลพื้นฐานตามข้อกำหนดทั่วไป',
    },
    {
      range: '26–50',
      nameEn: 'Good',
      nameTh: 'ดี',
      color: '#00CC66',
      bgLight: 'bg-[#00CC66]/15 text-[#00994d]',
      descEn: 'Normal work activities acceptable',
      descTh: 'ทำงานได้ปกติ',
      isActiveNow: true,
      generalEn: 'Air quality is satisfactory. Routine spray booth and curing oven tasks operate normally.',
      generalTh: 'คุณภาพอากาศดี สามารถทำกิจกรรมและการทำงานในโรงงานได้ตามปกติ',
      sensitiveEn: 'Sensitive workers may continue tasks; ensure regular baseline air change rate is active.',
      sensitiveTh: 'กลุ่มเสี่ยงสามารถทำงานได้ตามปกติ ควรรักษาระดับการระบายอากาศพื้นฐาน',
      ppeEn: 'Standard spray booth particulate respirator (N95) recommended.',
      ppeTh: 'แนะนำให้สวมหน้ากากกรองอนุภาคมาตรฐาน (N95) ขณะปฏิบัติงานในไลน์',
    },
    {
      range: '51–100',
      nameEn: 'Moderate',
      nameTh: 'ปานกลาง',
      color: '#FFD100',
      bgLight: 'bg-[#FFD100]/20 text-[#b38600]',
      descEn: 'Monitor sensitive individuals',
      descTh: 'เฝ้าระวังผู้ที่ไวต่อสาร',
      generalEn: 'Acceptable air quality; consider increasing fresh air intake if odor persists.',
      generalTh: 'คุณภาพอากาศยอมรับได้ เฝ้าระวังผู้ปฏิบัติงานที่มีความไวต่อกลิ่นสารเคมี',
      sensitiveEn: 'Workers with asthma or solvent sensitivity should limit continuous spray exposure.',
      sensitiveTh: 'ผู้ที่มีความไวต่อสารเคมีหรือมีโรคระบบทางเดินหายใจ ควรลดระยะเวลาการทำงานหนัก',
      ppeEn: 'Chemical half-mask with organic vapor cartridge advised.',
      ppeTh: 'สวมหน้ากากกรองไอสารอินทรีย์ระเหยง่าย (Organic Vapor Cartridge) ในพื้นที่พ่นสี',
    },
    {
      range: '101–200',
      nameEn: 'Unhealthy for Sensitive',
      nameTh: 'เริ่มมีผลกระทบ',
      color: '#FF7E00',
      bgLight: 'bg-[#FF7E00]/15 text-[#cc6600]',
      descEn: 'Increase ventilation and wear PPE',
      descTh: 'เพิ่มการระบายอากาศและสวมใส่ PPE',
      generalEn: 'Elevated VOC or particulate levels. Increase exhaust fan duty cycle to 80%.',
      generalTh: 'ความเข้มข้นสารเกินเกณฑ์มาตรฐานชั่วคราว เร่งพัดลมดูดอากาศ (Exhaust Boost 80%)',
      sensitiveEn: 'Reassign sensitive personnel away from active coating booths until levels normalize.',
      sensitiveTh: 'กลุ่มเสี่ยงควรหยุดพักหรือสลับไปปฏิบัติหน้าที่นอกพื้นที่ห้องพ่นสี',
      ppeEn: 'Mandatory organic vapor cartridge respirator (OV/P100).',
      ppeTh: 'บังคับสวมหน้ากากกรองก๊าซพิษและอนุภาคมาตรฐานสูง (OV/P100)',
    },
    {
      range: '201+',
      nameEn: 'Very Unhealthy',
      nameTh: 'มีผลกระทบ',
      color: '#FF0000',
      bgLight: 'bg-[#FF0000]/15 text-[#cc0000]',
      descEn: 'Execute emergency protocol & evacuate',
      descTh: 'ใช้ขั้นตอนฉุกเฉินและอพยพ',
      generalEn: 'Hazardous air contamination! Emergency ventilation override and halt spray lines immediately.',
      generalTh: 'มลพิษทางอากาศระดับอันตราย สั่งหยุดสายการผลิตและตัดจ่ายสารทำละลายทันที',
      sensitiveEn: 'Immediate evacuation of enclosure required.',
      sensitiveTh: 'อพยพเจ้าหน้าที่ออกจากห้องพ่นสีโดยทันที',
      ppeEn: 'Supplied air respirator (SAR) or full-face escape SCBA required for entry.',
      ppeTh: 'ต้องใช้ชุดช่วยหายใจชนิดมีถังอากาศ (SCBA) เท่านั้นหากจำเป็นต้องเข้าพื้นที่',
    },
  ];

  // Quick Calculator logic
  const calcResult = (() => {
    const val = Number(calcVal) || 0;
    if (val <= 25) {
      return { score: val, title: lang === 'TH' ? 'ดีมาก' : 'Very Good', color: '#00C0FF', desc: lang === 'TH' ? 'ปลอดภัย ทำงานได้ปกติ' : 'Safe, ideal for all operations', bg: 'bg-[#00C0FF]/10 text-[#0088cc]' };
    }
    if (val <= 50) {
      return { score: val, title: lang === 'TH' ? 'ดี' : 'Good', color: '#00CC66', desc: lang === 'TH' ? 'ทำงานได้ปกติ' : 'Normal work activities acceptable', bg: 'bg-[#00CC66]/10 text-[#00994d]' };
    }
    if (val <= 100) {
      return { score: val, title: lang === 'TH' ? 'ปานกลาง' : 'Moderate', color: '#FFD100', desc: lang === 'TH' ? 'เฝ้าระวังผู้ที่ไวต่อสาร' : 'Monitor sensitive individuals', bg: 'bg-[#FFD100]/20 text-[#b38600]' };
    }
    if (val <= 200) {
      return { score: val, title: lang === 'TH' ? 'เริ่มมีผลกระทบ' : 'Unhealthy for Sensitive', color: '#FF7E00', desc: lang === 'TH' ? 'เพิ่มการระบายอากาศและสวมใส่ PPE' : 'Increase ventilation and wear PPE', bg: 'bg-[#FF7E00]/15 text-[#cc6600]' };
    }
    return { score: val, title: lang === 'TH' ? 'มีผลกระทบ' : 'Very Unhealthy', color: '#FF0000', desc: lang === 'TH' ? 'ใช้ขั้นตอนฉุกเฉินและอพยพ' : 'Execute emergency protocol & evacuate', bg: 'bg-[#FF0000]/15 text-[#cc0000]' };
  })();

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
      {/* ── Block 1: Top Card matching Stitch AI (Air Quality Scale & Status) ── */}
      <section className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-[24px] font-bold tracking-tight text-[#131b2e] leading-tight">
              {t('airQualityIndex', 'Air Quality Index')}
            </h1>
            <p className="text-[13px] text-[#505f76] mt-0.5">
              {t('pcdStandardsDesc', 'Pollution Control Department (PCD) standards for industrial workplace safety')}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#f2f3ff] px-4 py-2 rounded-2xl self-start sm:self-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#505f76]">
                {t('currentValue', 'Current Value')}
              </span>
              <span className="text-[32px] font-bold text-[#131b2e] leading-none tabular-nums">
                38
              </span>
            </div>
            <div className="h-8 w-px bg-[#eaedff]" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00CC66]/15 border border-[#00CC66]/30 text-[#00994d]">
              <span className="w-2 h-2 rounded-full bg-[#00CC66]" />
              <span className="text-[13px] font-semibold leading-none">
                {t('aqiLevelGood', 'Good')}
              </span>
            </div>
          </div>
        </div>

        {/* 5-Color Horizontal Scale with Indicator Pin matching Stitch */}
        <div className="mt-8 mb-2 relative w-full">
          {/* Floating Pin / Pointer at 38: 20% + ((38-25)/25 * 20%) = 30.4% */}
          <div
            className="absolute -top-7 left-[30.4%] -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10"
          >
            <span className="text-[11px] font-bold text-[#131b2e] px-1.5 py-0.5 rounded-md bg-white shadow-xs border border-[#eaedff] leading-none mb-0.5">
              38
            </span>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[#131b2e]" />
          </div>

          {/* Segmented Bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex shadow-inner bg-[#f2f3ff]">
            <div className="h-full transition-all" style={{ width: '20%', backgroundColor: '#00C0FF' }} title="0–25: ดีมาก" />
            <div className="h-full transition-all" style={{ width: '20%', backgroundColor: '#00CC66' }} title="26–50: ดี" />
            <div className="h-full transition-all" style={{ width: '20%', backgroundColor: '#FFD100' }} title="51–100: ปานกลาง" />
            <div className="h-full transition-all" style={{ width: '20%', backgroundColor: '#FF7E00' }} title="101–200: เริ่มมีผลกระทบ" />
            <div className="h-full transition-all" style={{ width: '20%', backgroundColor: '#FF0000' }} title="201+: มีผลกระทบ" />
          </div>

          {/* Interval Labels */}
          <div className="relative w-full text-[11px] text-[#505f76] font-medium mt-2.5 h-4 select-none">
            <span className="absolute left-0 text-left whitespace-nowrap">0</span>
            <span className="absolute left-[20%] -translate-x-1/2 whitespace-nowrap">25</span>
            <span className="absolute left-[40%] -translate-x-1/2 whitespace-nowrap">50</span>
            <span className="absolute left-[60%] -translate-x-1/2 whitespace-nowrap">100</span>
            <span className="absolute left-[80%] -translate-x-1/2 whitespace-nowrap">200</span>
            <span className="absolute right-0 text-right whitespace-nowrap font-semibold">201+</span>
          </div>
        </div>
      </section>

      {/* ── Block 2: Five Equal Level Cards (Clickable for Detail Modal) ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full">
        {levels.map((lvl, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedLevel(lvl)}
            className={`bg-white rounded-3xl p-5 border shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer min-h-[170px] ${
              lvl.isActiveNow
                ? 'border-[#00CC66] ring-2 ring-[#00CC66]/30'
                : 'border-[#eaedff]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="w-3.5 h-3.5 rounded-full shadow-xs"
                  style={{ backgroundColor: lvl.color }}
                />
                <span className="text-[11px] font-semibold text-[#505f76] bg-[#f2f3ff] px-2 py-0.5 rounded-full font-mono">
                  {lvl.range}
                </span>
              </div>
              <h3 className="text-[18px] font-bold text-[#131b2e] leading-tight">
                {lang === 'TH' ? lvl.nameTh : lvl.nameEn}
              </h3>
            </div>
            <p className="text-[12px] text-[#505f76] mt-4 leading-relaxed font-normal">
              {lang === 'TH' ? lvl.descTh : lvl.descEn}
            </p>
          </div>
        ))}
      </section>

      {/* ── Block 3: Bottom Slim Utility Row matching Stitch ── */}
      <section className="w-full flex items-center justify-start gap-3 pt-1">
        <button
          type="button"
          onClick={() => setIsMethodModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[13px] font-medium text-[#131b2e] hover:text-[#004ac6] bg-white hover:bg-[#eaedff] border border-[#eaedff] shadow-2xs transition-all cursor-pointer"
        >
          <Info size={16} className="text-[#004ac6]" />
          <span>{t('howCalculated', 'How it is calculated')}</span>
        </button>
        <button
          type="button"
          onClick={() => setIsCalcModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[13px] font-medium text-[#131b2e] hover:text-[#004ac6] bg-white hover:bg-[#eaedff] border border-[#eaedff] shadow-2xs transition-all cursor-pointer"
        >
          <Calculator size={16} className="text-[#004ac6]" />
          <span>{t('calculator', 'Calculator')}</span>
        </button>
      </section>

      {/* ── Modal 1: Level Detail Modal matching Stitch AI ── */}
      {selectedLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#eaedff] p-6 sm:p-8 flex flex-col gap-5 z-10 animate-fade-in">
            <div className="flex items-start justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex flex-col gap-1.5">
                <div>
                  <span
                    className="text-[12px] font-bold tracking-wider px-3 py-1 rounded-full font-mono"
                    style={{ backgroundColor: `${selectedLevel.color}20`, color: selectedLevel.color }}
                  >
                    AQI {selectedLevel.range}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-[20px] text-[#131b2e] font-bold">
                    {lang === 'TH' ? selectedLevel.nameTh : selectedLevel.nameEn}
                  </h2>
                  <span className="text-[14px] text-[#505f76] font-normal">
                    ({lang === 'TH' ? selectedLevel.nameEn : selectedLevel.nameTh})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLevel(null)}
                className="p-1.5 rounded-full hover:bg-[#eaedff] text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-1">
              <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e2e7ff] flex items-center justify-center shrink-0 text-[#004ac6]">
                  <Users size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-[#131b2e] uppercase tracking-wider">
                    {t('generalPersonnel', 'General Personnel')}
                  </span>
                  <p className="text-[13px] text-[#505f76] leading-snug mt-1">
                    {lang === 'TH' ? selectedLevel.generalTh : selectedLevel.generalEn}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF7E00]/15 flex items-center justify-center shrink-0 text-[#c45a00]">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-[#c45a00] uppercase tracking-wider">
                    {t('sensitiveGroups', 'Sensitive & Vulnerable Groups')}
                  </span>
                  <p className="text-[13px] text-[#505f76] leading-snug mt-1">
                    {lang === 'TH' ? selectedLevel.sensitiveTh : selectedLevel.sensitiveEn}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f2f3ff] flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#dbe1ff] flex items-center justify-center shrink-0 text-[#004ac6]">
                  <HardHat size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-semibold text-[#004ac6] uppercase tracking-wider">
                    {t('ppeGuideline', 'PPE Protocol & Guidelines')}
                  </span>
                  <p className="text-[13px] text-[#505f76] leading-snug mt-1">
                    {lang === 'TH' ? selectedLevel.ppeTh : selectedLevel.ppeEn}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-[#eaedff]">
              <button
                type="button"
                onClick={() => setSelectedLevel(null)}
                className="px-5 py-2 rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] text-[13px] font-medium transition-colors cursor-pointer shadow-xs"
              >
                {t('close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Calculation Methodology Modal matching Stitch ── */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#eaedff] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2 text-[#004ac6] font-semibold text-[15px]">
                <Calculator size={20} />
                <span>{t('calculationMethodTitle', 'Calculation Methodology')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMethodModalOpen(false)}
                className="text-[#505f76] hover:text-[#131b2e] p-1 rounded-full hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-2 text-[13px] text-[#131b2e] flex flex-col gap-3">
              <p className="text-[#505f76] leading-relaxed">
                {t('calculationMethodDesc', 'AQI is computed by standard piecewise linear interpolation between defined pollutant concentration breakpoints:')}
              </p>
              <div className="bg-[#f2f3ff] p-3.5 rounded-2xl font-mono text-[12px] text-[#004ac6] overflow-x-auto border border-[#eaedff]">
                AQI = [(I_high - I_low) / (C_high - C_low)] × (C - C_low) + I_low
              </div>
              <div className="space-y-1.5 text-[#505f76] pt-1 text-[12px]">
                <div>• <strong>C:</strong> {lang === 'TH' ? 'ค่าความเข้มข้นของสารมลพิษที่ตรวจวัดได้' : 'Pollutant concentration value'}</div>
                <div>• <strong>[C_low, C_high]:</strong> {lang === 'TH' ? 'ช่วงความเข้มข้นอ้างอิงของระดับนั้นๆ' : 'Concentration breakpoint bracket'}</div>
                <div>• <strong>[I_low, I_high]:</strong> {lang === 'TH' ? 'ช่วงค่าดัชนี AQI ที่ตรงกับระดับความเข้มข้น' : 'Corresponding AQI index bracket'}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#eaedff] flex justify-end">
              <button
                type="button"
                onClick={() => setIsMethodModalOpen(false)}
                className="px-5 py-2 text-[13px] font-medium rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors cursor-pointer shadow-xs"
              >
                {t('close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Quick Calculator Modal matching Stitch ── */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#eaedff] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
              <div className="flex items-center gap-2 text-[#004ac6] font-semibold text-[15px]">
                <Activity size={20} />
                <span>{t('aqiQuickCalc', 'AQI Quick Calculator')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCalcModalOpen(false)}
                className="text-[#505f76] hover:text-[#131b2e] p-1 rounded-full hover:bg-[#eaedff] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-2 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('pollutant', 'Pollutant')}
                </label>
                <select
                  value={calcPollutant}
                  onChange={(e) => setCalcPollutant(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] text-[13px] text-[#131b2e] focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
                >
                  <option>PM2.5</option>
                  <option>TVOC</option>
                  <option>Ammonia MQ-137</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#505f76]">
                  {t('concentrationInput', 'Concentration Input')}
                </label>
                <div className="flex items-center rounded-2xl bg-[#f2f3ff] border border-[#eaedff] overflow-hidden">
                  <input
                    type="number"
                    value={calcVal}
                    onChange={(e) => setCalcVal(e.target.value)}
                    className="w-full px-3 py-2.5 bg-transparent text-[13px] font-semibold text-[#131b2e] focus:outline-none font-mono"
                  />
                  <span className="px-3 py-2.5 bg-[#eaedff] text-[11px] text-[#505f76] font-medium font-mono">
                    {calcPollutant === 'PM2.5' ? 'µg/m³' : 'ppb'}
                  </span>
                </div>
              </div>

              {/* Live Calculated Result Card */}
              <div
                className="p-4 rounded-2xl border flex items-center justify-between"
                style={{ backgroundColor: `${calcResult.color}15`, borderColor: `${calcResult.color}40` }}
              >
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold" style={{ color: calcResult.color }}>
                    {calcResult.title} (AQI {calcResult.score})
                  </span>
                  <span className="text-[11px] font-medium text-[#505f76] mt-0.5">
                    {calcResult.desc}
                  </span>
                </div>
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: calcResult.color }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#eaedff] flex justify-end">
              <button
                type="button"
                onClick={() => setIsCalcModalOpen(false)}
                className="px-5 py-2 text-[13px] font-medium rounded-2xl bg-[#004ac6] text-white hover:bg-[#003ea8] transition-colors cursor-pointer shadow-xs"
              >
                {t('done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
