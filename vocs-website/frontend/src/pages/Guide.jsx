import { useState } from 'react';
import {
  Rocket, Network, Flame, Terminal, FileDown, Info,
  Phone, AlertTriangle, Check, Copy, ArrowRight, ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Guide() {
  const { t, isThai } = useLanguage();
  const [activeTab, setActiveTab] = useState('wiring'); // 'quickstart' | 'wiring' | 'safety' | 'api'
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }

  const jsonPayload = `{
  "device_id": "ENOSE-NODE-B1",
  "timestamp": "${new Date().toISOString()}",
  "sensors": {
    "mq3_analog_mv": 842.1,
    "mq2_combustible_mv": 312.4,
    "mini_pid_ppb": 18.2,
    "sgp40_voc_index": 114,
    "tgs2602_odor_mv": 965.8
  },
  "diagnostics": {
    "chamber_fan_rpm": 3450,
    "internal_temp_c": 24.8,
    "status": "HEALTHY"
  }
}`;

  function handleCopyPayload() {
    navigator.clipboard.writeText(jsonPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
    showToast(isThai ? 'คัดลอกโครงสร้าง JSON เรียบร้อยแล้ว ✓' : 'Copied JSON payload to clipboard ✓');
  }

  const handleDownloadManual = () => {
    const manualContent =
      'VOC / E-Nose Telemetry System - Technical User Guide & SOP Manual\n' +
      'Version: Revision 2.4 - Node Rev-D (IP65 / NEMA 4X)\n' +
      'Date: 2026-11-07\n\n' +
      '1. HARDWARE PIN MAPPING (ESP32-S3)\n' +
      '===================================\n' +
      '- MQ-3 (Alcohol/Vapor): Analog ADC -> GPIO 34 (ADC1_CH6)\n' +
      '- MQ-2 (Combustibles/Smoke): Analog ADC -> GPIO 35 (ADC1_CH7)\n' +
      '- Mini PID (High-Sensitivity VOCs): UART / 0-5V -> GPIO 32 / RX2\n' +
      '- SGP40 (MOx VOC Index): I2C (0x59) -> GPIO 21 (SDA) / GPIO 22 (SCL)\n' +
      '- TGS2602 (Odors & Solvents): Analog ADC -> GPIO 33 (ADC1_CH5)\n\n' +
      '2. EMERGENCY SOP (Level 2 Hazard - Chemical Solvent Leak)\n' +
      '========================================================\n' +
      'Step 1: Evacuate Booth 1 to designated muster point.\n' +
      'Step 2: Engage Emergency Ventilation (100% stack damper purge).\n' +
      'Step 3: Isolate Solvents - shut manual valves on bulk supply.\n' +
      'Step 4: Notify Incident Commander & safety response team.\n\n' +
      '3. EMERGENCY CONTACTS\n' +
      '=====================\n' +
      '- Somchai Jaidee (Chief Safety Officer): +66 81 234 5678 (Radio Ch 4)\n' +
      '- E. Mitchell (Industrial Hygiene & H&S): +66 82 345 6789 (Radio Ch 2)\n' +
      '- Maintenance Dispatch (24/7 Facility Response): +66 2 987 6543 (Ext 1999)\n';

    const encodedUri = encodeURI('data:text/plain;charset=utf-8,' + manualContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ENose_User_Guide_Technical_Handbook_Rev2.4.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isThai ? 'ดาวน์โหลดคู่มือทางเทคนิคเรียบร้อยแล้ว ✓' : 'Downloaded Technical Manual ✓');
  };

  const handleDownloadSop = () => {
    const sopContent =
      'STANDARD OPERATING PROCEDURE (SOP) - LEVEL 2 HAZARD\n' +
      'Protocol: Chemical Solvent Leak Response\n' +
      'Powder Coating Booth 1 - VOC / E-Nose Platform\n\n' +
      '1. Evacuate Booth: Immediately halt spray operations and evacuate personnel.\n' +
      '2. Engage Emergency Ventilation: Switch exhaust damper to purge mode (100% extraction).\n' +
      '3. Isolate Solvents: Close manual shutoff valves on bulk solvent supply lines.\n' +
      '4. Notify Incident Commander: Verify LINE alert delivery and notify EHS.\n' +
      'Automated interlocks activate when total VOC > 350 ppm for 30s.\n';

    const encodedUri = encodeURI('data:text/plain;charset=utf-8,' + sopContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SOP_Chemical_Solvent_Leak_Response.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isThai ? 'ดาวน์โหลดเอกสารขั้นตอนปฏิบัติการ SOP เรียบร้อยแล้ว ✓' : 'Downloaded SOP Document ✓');
  };

  const wiringRows = [
    {
      sensor: 'MQ-3',
      sub: isThai ? 'ไอระเหยแอลกอฮอล์ / สารอินทรีย์' : 'Alcohol / Vapor',
      dotColor: 'bg-[#505f76]',
      interface: 'Analog ADC',
      pin: 'GPIO 34 (ADC1_CH6)',
      addr: '—',
    },
    {
      sensor: 'MQ-2',
      sub: isThai ? 'ก๊าซติดไฟ / ควัน' : 'Combustibles / Smoke',
      dotColor: 'bg-[#505f76]',
      interface: 'Analog ADC',
      pin: 'GPIO 35 (ADC1_CH7)',
      addr: '—',
    },
    {
      sensor: 'Mini PID',
      sub: isThai ? 'ไอระเหยความไวสูง (โฟโตไอออไนเซชัน)' : 'High-Sensitivity VOCs',
      dotColor: 'bg-[#004ac6]',
      interface: 'UART / 0-5V',
      pin: 'GPIO 32 / RX2',
      addr: '—',
    },
    {
      sensor: 'SGP40',
      sub: isThai ? 'ดัชนีสารอินทรีย์ระเหย MOx' : 'MOx VOC Index',
      dotColor: 'bg-[#004ac6]',
      interface: 'I2C',
      pin: 'GPIO 21 (SDA) / 22 (SCL)',
      addr: '0x59',
      isBadge: true,
    },
    {
      sensor: 'TGS2602',
      sub: isThai ? 'กลิ่นและตัวทำละลายอินทรีย์' : 'Odors & Solvents',
      dotColor: 'bg-[#505f76]',
      interface: 'Analog ADC',
      pin: 'GPIO 33 (ADC1_CH5)',
      addr: '—',
    },
  ];

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-6 pb-20">
      {/* ── Header & Page Meta matching Stitch ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
            <span className="text-[12px] uppercase tracking-widest text-[#737686] font-semibold">
              {t('docProtocol')}
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#131b2e] tracking-tight">
            {t('userGuideTitle')}
          </h1>
          <p className="text-[14px] text-[#505f76] mt-1">
            {t('userGuideSubtitle')}
          </p>
        </div>

        {/* Quick Status Badge & Actions */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[#eaedff] border border-[#dbe1ff] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#004ac6]" />
            <span className="text-[12px] font-medium text-[#131b2e]">
              {t('revisionBadge')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadManual}
            className="px-3.5 py-1.5 rounded-full bg-white text-[#004ac6] text-[12px] font-medium border border-[#dbe1ff] hover:bg-[#f2f3ff] transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileDown size={16} />
            <span>{t('pdfManualBtn')}</span>
          </button>
        </div>
      </div>

      {/* ── 4 Pill Tabs Bar matching Stitch ── */}
      <div>
        <div className="inline-flex p-1 rounded-full bg-[#eaedff] border border-[#dbe1ff] shadow-inner flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`px-5 py-2 text-[12px] font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quickstart'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            <Rocket size={16} />
            <span>{t('quickstartTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wiring')}
            className={`px-5 py-2 text-[12px] font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'wiring'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            <Network size={16} />
            <span>{t('wiringTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-5 py-2 text-[12px] font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            <Flame size={16} />
            <span>{t('safetyTab')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`px-5 py-2 text-[12px] font-semibold rounded-full transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'api'
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            <Terminal size={16} />
            <span>{t('apiTab')}</span>
          </button>
        </div>
      </div>

      {/* ── TAB PANEL 1: WIRING & ENCLOSURE ── */}
      {activeTab === 'wiring' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Sensor Wiring Table (7 Cols) */}
          <div
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] relative overflow-hidden"
            style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)' }}
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#004ac6]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-6 mb-2 border-b border-[#eaedff]">
              <div>
                <span className="text-[12px] uppercase tracking-widest text-[#505f76] font-semibold">
                  {t('pinMappingTag')}
                </span>
                <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
                  {t('sensorWiringTitle')}
                </h2>
              </div>
              <span className="text-[12px] font-mono text-[#737686] bg-[#eaedff] px-2.5 py-1 rounded-full border border-[#dbe1ff]">
                {t('logicLevelBadge')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="text-[12px] uppercase tracking-wider text-[#505f76] border-b border-[#eaedff]">
                    <th className="py-3.5 pr-4 font-semibold">{t('sensorColGuide')}</th>
                    <th className="py-3.5 px-4 font-semibold">{t('interfaceColGuide')}</th>
                    <th className="py-3.5 px-4 font-semibold">{t('pinColGuide')}</th>
                    <th className="py-3.5 pl-4 font-semibold text-right">{t('i2cColGuide')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eaedff]">
                  {wiringRows.map((r) => (
                    <tr key={r.sensor} className="hover:bg-[#f2f3ff]/40 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full ${r.dotColor}`} />
                          <div>
                            <span className="font-medium text-[#131b2e] block leading-tight">{r.sensor}</span>
                            <span className="text-[11px] text-[#737686]">{r.sub}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#434655] font-medium">{r.interface}</td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-[#eaedff] text-[#131b2e] font-mono text-[12px] border border-[#dbe1ff]">
                          {r.pin}
                        </span>
                      </td>
                      <td className="py-4 pl-4 text-right font-mono text-[12px]">
                        {r.isBadge ? (
                          <span className="px-2 py-0.5 rounded bg-[#dbe1ff] text-[#004ac6] font-semibold">
                            {r.addr}
                          </span>
                        ) : (
                          <span className="text-[#737686]">{r.addr}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between text-[12px] text-[#505f76] gap-2">
              <span className="inline-flex items-center gap-1.5">
                <Info size={16} className="text-[#004ac6] shrink-0" />
                <span>{t('analogNote')}</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadManual}
                className="text-[#004ac6] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                {t('schematicPdfLink')}
              </button>
            </div>
          </div>

          {/* Right: Technical Vector Graphic of Sensor Node Box (5 Cols) */}
          <div
            className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col justify-between"
            style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)' }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#eaedff]">
                <div>
                  <span className="text-[12px] uppercase tracking-widest text-[#505f76] font-semibold">
                    {t('physicalArchTag')}
                  </span>
                  <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
                    {t('enclosureTitle')}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#131b2e] border border-[#dbe1ff]">
                  {t('ip65Badge')}
                </span>
              </div>

              {/* Technical SVG Enclosure Graphic matching Stitch */}
              <div className="mt-5 p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] relative">
                <svg className="w-full h-auto text-[#131b2e]" fill="none" viewBox="0 0 460 330" xmlns="http://www.w3.org/2000/svg">
                  {/* DIN Rail mount */}
                  <rect fill="#e2e7ff" height="40" opacity="0.6" rx="4" stroke="#c3c6d7" strokeDasharray="4 4" strokeWidth="1.5" width="420" x="20" y="145" />
                  <text fill="#737686" fontFamily="Inter" fontSize="10" letterSpacing="1" x="28" y="170">DIN RAIL MOUNT (35mm TS-35)</text>

                  {/* Outer Enclosure Housing */}
                  <rect fill="#ffffff" height="270" rx="20" stroke="#c3c6d7" strokeWidth="2" width="320" x="70" y="30" />
                  <rect fill="#faf8ff" height="254" rx="14" stroke="#e2e7ff" strokeWidth="1.5" width="304" x="78" y="38" />

                  {/* Intake Snorkel Tube (Left) */}
                  <path d="M 40 100 L 78 100 L 78 125 L 40 125 Z" fill="#eaedff" stroke="#004ac6" strokeWidth="1.5" />
                  <path d="M 35 96 L 40 100 L 40 125 L 35 129 Z" fill="#dae2fd" stroke="#004ac6" strokeWidth="1.5" />
                  <path d="M 15 112 L 32 112" stroke="#004ac6" strokeLinecap="round" strokeWidth="2" />
                  <path d="M 27 107 L 33 112 L 27 117" fill="none" stroke="#004ac6" strokeLinecap="round" strokeWidth="2" />

                  {/* Sensor Chamber */}
                  <rect fill="#ffffff" height="110" rx="10" stroke="#737686" strokeWidth="1.5" width="130" x="95" y="65" />
                  <text fill="#434655" fontFamily="Inter" fontSize="10" fontWeight="600" x="105" y="83">
                    {isThai ? 'ห้องตรวจวัดเซนเซอร์' : 'SENSOR CHAMBER'}
                  </text>

                  {/* Sensor Sockets */}
                  <circle cx="120" cy="110" fill="#eaedff" r="14" stroke="#004ac6" strokeWidth="1.2" />
                  <circle cx="120" cy="110" fill="#004ac6" r="6" />
                  <circle cx="160" cy="110" fill="#eaedff" r="14" stroke="#004ac6" strokeWidth="1.2" />
                  <circle cx="160" cy="110" fill="#004ac6" r="6" />
                  <circle cx="200" cy="110" fill="#eaedff" r="14" stroke="#004ac6" strokeWidth="1.2" />
                  <circle cx="200" cy="110" fill="#004ac6" r="6" />
                  <circle cx="140" cy="148" fill="#eaedff" r="12" stroke="#505f76" strokeWidth="1.2" />
                  <circle cx="180" cy="148" fill="#eaedff" r="12" stroke="#505f76" strokeWidth="1.2" />

                  {/* Micro Purge Fan */}
                  <rect fill="#eaedff" height="24" rx="4" stroke="#737686" strokeWidth="1.2" width="130" x="95" y="180" />
                  <line stroke="#737686" strokeDasharray="2 3" strokeWidth="1.2" x1="105" x2="215" y1="192" y2="192" />
                  <text fill="#434655" fontFamily="Inter" fontSize="8" x="105" y="196">
                    {isThai ? 'พัดลมระบายตัวอย่าง (5V)' : 'SAMPLE PURGE FAN (5V)'}
                  </text>

                  {/* ESP32 Core MCU PCB */}
                  <rect fill="#131b2e" height="150" rx="8" stroke="#004ac6" strokeWidth="1.5" width="118" x="250" y="65" />
                  <rect fill="#283044" height="50" rx="4" stroke="#c3c6d7" strokeWidth="1" width="88" x="265" y="80" />
                  <text fill="#eeefff" fontFamily="Inter" fontSize="11" fontWeight="700" x="274" y="108">ESP32-S3</text>
                  <text fill="#b4c5ff" fontFamily="Inter" fontSize="8" x="274" y="122">DUAL-CORE LX7</text>

                  <line stroke="#d3e4fe" strokeDasharray="3 4" strokeWidth="2.5" x1="256" x2="256" y1="75" y2="205" />
                  <line stroke="#d3e4fe" strokeDasharray="3 4" strokeWidth="2.5" x1="362" x2="362" y1="75" y2="205" />

                  {/* DC Stepdown */}
                  <rect fill="#eaedff" height="46" rx="6" stroke="#737686" strokeWidth="1.2" width="118" x="250" y="228" />
                  <text fill="#131b2e" fontFamily="Inter" fontSize="9" fontWeight="600" x="260" y="246">DC BUCK STEPDOWN</text>
                  <text fill="#505f76" fontFamily="Inter" fontSize="8" x="260" y="260">IN: 12VDC • OUT: 5V / 3.3V</text>

                  {/* Status RGB LED */}
                  <circle cx="340" cy="50" fill="#00CC66" r="5" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="340" cy="50" fill="#00CC66" opacity="0.3" r="8" />

                  {/* PG7 Cable Glands */}
                  <rect fill="#737686" height="24" rx="2" stroke="#434655" strokeWidth="1" width="28" x="110" y="292" />
                  <rect fill="#737686" height="24" rx="2" stroke="#434655" strokeWidth="1" width="28" x="170" y="292" />

                  {/* Callouts */}
                  <line stroke="#004ac6" strokeWidth="1" x1="58" x2="58" y1="100" y2="20" />
                  <line stroke="#004ac6" strokeWidth="1" x1="58" x2="10" y1="20" y2="20" />
                  <circle cx="58" cy="100" fill="#004ac6" r="2.5" />
                  <text fill="#004ac6" fontFamily="Inter" fontSize="10" fontWeight="600" x="10" y="14">Intake Snorkel</text>

                  <line stroke="#434655" strokeWidth="1" x1="160" x2="160" y1="65" y2="40" />
                  <circle cx="160" cy="65" fill="#434655" r="2.5" />
                  <text fill="#434655" fontFamily="Inter" fontSize="10" fontWeight="600" x="140" y="32">Sensor Chamber</text>

                  <line stroke="#434655" strokeWidth="1" x1="340" x2="340" y1="42" y2="18" />
                  <line stroke="#434655" strokeWidth="1" x1="340" x2="385" y1="18" y2="18" />
                  <circle cx="340" cy="45" fill="#434655" r="2.5" />
                  <text fill="#434655" fontFamily="Inter" fontSize="10" fontWeight="600" x="320" y="12">Status LED (RGB)</text>

                  <line stroke="#004ac6" strokeWidth="1" x1="368" x2="410" y1="120" y2="120" />
                  <circle cx="368" cy="120" fill="#004ac6" r="2.5" />
                  <text fill="#004ac6" fontFamily="Inter" fontSize="10" fontWeight="600" x="415" y="124">ESP32 Core</text>

                  <line stroke="#434655" strokeWidth="1" x1="184" x2="230" y1="316" y2="316" />
                  <circle cx="184" cy="316" fill="#434655" r="2.5" />
                  <text fill="#434655" fontFamily="Inter" fontSize="10" fontWeight="600" x="236" y="320">PG7 Cable Gland</text>
                </svg>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#eaedff]">
              <p className="text-[12px] text-[#505f76] leading-relaxed">
                <strong className="font-semibold text-[#131b2e]">{isThai ? 'ตู้มาตรฐาน NEMA 4X / IP65 พร้อมพอร์ตดึงตัวอย่างอากาศแบบมีตัวกรอง' : 'NEMA 4X / IP65 enclosure with filtered sample intake port.'} </strong>
                {t('enclosureDesc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB PANEL 2: SAFETY & EMERGENCY ── */}
      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Chemical Solvent Leak Response Protocol (7 Cols) */}
          <div
            className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#ffdad6] relative overflow-hidden"
            style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#ba1a1a] via-[#bc4800] to-[#ba1a1a]" />

            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#eaedff]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <span className="text-[12px] uppercase tracking-widest text-[#ba1a1a] font-bold">
                    {t('sopTag')}
                  </span>
                  <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
                    {t('chemicalLeakTitle')}
                  </h2>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#93000a] uppercase tracking-wider shrink-0">
                {t('level2Hazard')}
              </span>
            </div>

            {/* 4 Numbered Steps */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-sm">
                  1
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('step1Title')}</h3>
                  <p className="text-[14px] text-[#505f76] mt-1 leading-normal">{t('step1Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-sm">
                  2
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('step2Title')}</h3>
                  <p className="text-[14px] text-[#505f76] mt-1 leading-normal">{t('step2Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-sm">
                  3
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('step3Title')}</h3>
                  <p className="text-[14px] text-[#505f76] mt-1 leading-normal">{t('step3Desc')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center font-bold text-[14px] shrink-0 shadow-sm">
                  4
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('step4Title')}</h3>
                  <p className="text-[14px] text-[#505f76] mt-1 leading-normal">{t('step4Desc')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between text-[12px] text-[#131b2e] gap-3">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#ba1a1a] shrink-0" />
                <span>{t('interlockNote')}</span>
              </span>
              <button
                type="button"
                onClick={handleDownloadSop}
                className="px-3 py-1 bg-white border border-[#dbe1ff] rounded-lg text-[#004ac6] font-semibold hover:bg-[#dbe1ff] transition-colors cursor-pointer shrink-0"
              >
                {t('downloadPdfSop')}
              </button>
            </div>
          </div>

          {/* Right: Emergency Contacts (5 Cols) */}
          <div
            className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col justify-between"
            style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)' }}
          >
            <div>
              <div className="flex items-center justify-between pb-6 mb-4 border-b border-[#eaedff]">
                <div>
                  <span className="text-[12px] uppercase tracking-widest text-[#505f76] font-semibold">
                    {t('immediateDispatchTag')}
                  </span>
                  <h2 className="text-[20px] font-bold text-[#131b2e] mt-0.5">
                    {t('emergencyContactsTitle')}
                  </h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#eaedff] flex items-center justify-center text-[#004ac6]">
                  <Phone size={18} />
                </div>
              </div>

              {/* 3 Specific Contacts */}
              <div className="space-y-4">
                {/* Contact 1 */}
                <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#131b2e]">Somchai Jaidee</h3>
                      <span className="text-[12px] text-[#505f76] font-medium">{t('contact1Title')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe1ff] text-[#004ac6]">
                      PRIORITY 1
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#eaedff] text-[12px]">
                    <a href="tel:+66812345678" className="font-mono text-[#131b2e] font-semibold flex items-center gap-1.5 hover:text-[#004ac6]">
                      <Phone size={14} className="text-[#505f76]" />
                      <span>+66 81 234 5678</span>
                    </a>
                    <span className="px-2 py-0.5 rounded bg-[#eaedff] text-[#737686] text-[11px] font-mono font-medium">
                      Radio: Ch 4
                    </span>
                  </div>
                </div>

                {/* Contact 2 */}
                <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#131b2e]">E. Mitchell</h3>
                      <span className="text-[12px] text-[#505f76] font-medium">{t('contact2Title')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaedff] text-[#505f76]">
                      PRIORITY 2
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#eaedff] text-[12px]">
                    <a href="tel:+66823456789" className="font-mono text-[#131b2e] font-semibold flex items-center gap-1.5 hover:text-[#004ac6]">
                      <Phone size={14} className="text-[#505f76]" />
                      <span>+66 82 345 6789</span>
                    </a>
                    <span className="px-2 py-0.5 rounded bg-[#eaedff] text-[#737686] text-[11px] font-mono font-medium">
                      Radio: Ch 2
                    </span>
                  </div>
                </div>

                {/* Contact 3 */}
                <div className="p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold text-[#131b2e]">Maintenance Dispatch</h3>
                      <span className="text-[12px] text-[#505f76] font-medium">{t('contact3Title')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbe1ff] text-[#004ac6]">
                      EXT 1999
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#eaedff] text-[12px]">
                    <a href="tel:+6629876543" className="font-mono text-[#131b2e] font-semibold flex items-center gap-1.5 hover:text-[#004ac6]">
                      <Phone size={14} className="text-[#505f76]" />
                      <span>+66 2 987 6543</span>
                    </a>
                    <span className="px-2 py-0.5 rounded bg-[#eaedff] text-[#737686] text-[11px] font-mono font-medium">
                      Desk: Station B
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#eaedff]">
              <a
                href="tel:+6629876543"
                className="w-full py-2.5 rounded-xl bg-[#ba1a1a] text-white font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-[#93000a] transition-colors shadow-sm cursor-pointer"
              >
                <Phone size={16} />
                <span>{t('triggerHotlineBtn')}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB PANEL 3: QUICK START ── */}
      {activeTab === 'quickstart' && (
        <div
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff]"
          style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)' }}
        >
          <div className="max-w-3xl">
            <span className="text-[12px] uppercase tracking-widest text-[#004ac6] font-semibold">
              {t('deploymentChecklistTag')}
            </span>
            <h2 className="text-[24px] font-bold text-[#131b2e] mt-1 mb-2">
              {t('poweringTitle')}
            </h2>
            <p className="text-[14px] text-[#505f76] leading-relaxed mb-6">
              {t('deploymentDesc')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                <span className="w-6 h-6 rounded-full bg-[#004ac6] text-white text-[12px] font-bold inline-flex items-center justify-center mb-3">
                  1
                </span>
                <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('mountTitle')}</h3>
                <p className="text-[12px] text-[#505f76] mt-1 leading-normal">{t('mountDesc')}</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                <span className="w-6 h-6 rounded-full bg-[#004ac6] text-white text-[12px] font-bold inline-flex items-center justify-center mb-3">
                  2
                </span>
                <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('power12vTitle')}</h3>
                <p className="text-[12px] text-[#505f76] mt-1 leading-normal">{t('power12vDesc')}</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#f2f3ff] border border-[#eaedff]">
                <span className="w-6 h-6 rounded-full bg-[#004ac6] text-white text-[12px] font-bold inline-flex items-center justify-center mb-3">
                  3
                </span>
                <h3 className="text-[14px] font-semibold text-[#131b2e]">{t('burninTitle')}</h3>
                <p className="text-[12px] text-[#505f76] mt-1 leading-normal">{t('burninDesc')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('wiring')}
              className="px-5 py-2.5 rounded-xl bg-[#004ac6] text-white text-[13px] font-semibold hover:bg-[#003ea8] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>{t('proceedWiringBtn')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── TAB PANEL 4: API & MQTT INGESTION ── */}
      {activeTab === 'api' && (
        <div
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff]"
          style={{ boxShadow: '0 4px 20px -2px rgba(15,23,42,0.03)' }}
        >
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#eaedff] flex-wrap gap-2">
            <div>
              <span className="text-[12px] uppercase tracking-widest text-[#004ac6] font-semibold">
                {t('mqttIngestTag')}
              </span>
              <h2 className="text-[24px] font-bold text-[#131b2e] mt-1">
                {t('payloadRefTitle')}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#eaedff] text-[12px] font-mono font-medium text-[#505f76]">
              {t('jsonSchemaBadge')}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 text-[14px] text-[#505f76] space-y-4">
              <p>{t('mqttDesc')}</p>
              <div className="p-3 bg-[#f2f3ff] rounded-xl font-mono text-[12px] text-[#004ac6] border border-[#eaedff]">
                booth1/enose/telemetry/live
              </div>
              <p className="text-[12px] leading-relaxed">
                {isThai
                  ? 'ข้อมูลในเพย์โหลดประกอบด้วยค่าความต่างศักย์แอนะล็อกดิบ (mV) ดัชนีสารอินทรีย์ระเหยรวม (VOC Index) และปัจจัยชดเชยตามอุณหภูมิและความชื้นสัมพัทธ์ในห้องพ่น'
                  : 'Payloads contain raw ADC resistance readings, calculated VOC index ratings, and environmental temperature / relative humidity compensation factors.'}
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="relative">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  {copiedPayload ? <Check size={14} className="text-[#00CC66]" /> : <Copy size={14} />}
                  <span>{copiedPayload ? (isThai ? 'คัดลอกแล้ว' : 'Copied') : (isThai ? 'คัดลอก JSON' : 'Copy JSON')}</span>
                </button>
                <div className="p-5 rounded-2xl bg-[#131b2e] text-[#eeefff] font-mono text-[12px] overflow-x-auto leading-relaxed border border-[#737686]/30 shadow-inner">
                  <pre>{jsonPayload}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Micro-links matching Stitch ── */}
      <div className="mt-12 pt-6 border-t border-[#eaedff] flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#505f76] gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#004ac6]" />
          <span>{t('handbookFooter')}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('wiring')}
            className="hover:text-[#004ac6] transition-colors cursor-pointer"
          >
            {t('calibMatrixLink')}
          </button>
          <span className="text-[#c3c6d7]">•</span>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className="hover:text-[#004ac6] transition-colors cursor-pointer"
          >
            {t('firmwareOtaLink')}
          </button>
          <span className="text-[#c3c6d7]">•</span>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className="hover:text-[#004ac6] transition-colors cursor-pointer"
          >
            {t('oshaPelLink')}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-[#131b2e] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-[14px] z-50 animate-fade-in">
          <Check size={18} className="text-[#00CC66]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
