import { useState, useEffect } from 'react';
import {
  ShieldAlert, Activity, Info, CheckCircle2, Wind,
  AlertTriangle, RefreshCw, Flame, ExternalLink, ArrowRight,
  Gauge, HelpCircle, Check, Eye, Users, HeartPulse, HardHat, X
} from 'lucide-react';
import { API } from '../config';
import {
  AqiScaleBar, AqiBadge, Button, Card, StatCard, PageHeader, Modal,
  AQI_LEVELS, calculatePm25Aqi, getAqiCategory
} from '../components/ui';

export default function AQIInfo() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testValue, setTestValue] = useState(15);
  const [testMode, setTestMode] = useState('pm25'); // 'pm25' | 'tvoc'

  // Stitch Sub-state: Level Detail Modal
  const [selectedLevelModal, setSelectedLevelModal] = useState(null);

  // Fetch current live readings from BOX-001
  async function fetchLiveTelemetry() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/latest?box_id=BOX-001`);
      if (res.ok) {
        const d = await res.json();
        setTelemetry(d);
        if (d.environment?.pm25 != null) {
          setTestValue(d.environment.pm25);
        }
      }
    } catch (e) {
      console.warn('AQI Info fetch warning:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLiveTelemetry();
  }, []);

  const pm25Val = telemetry?.environment?.pm25 ?? telemetry?.latest_reading?.pm25 ?? 12.4;
  const currentAqi = calculatePm25Aqi(pm25Val);
  const currentCat = getAqiCategory(currentAqi);

  const testAqi = testMode === 'pm25'
    ? calculatePm25Aqi(Number(testValue) || 0)
    : Math.min(500, Math.round((Number(testValue) || 0) / 4.4));
  const testCat = getAqiCategory(testAqi);

  // Level Details for Stitch Modal
  const LEVEL_DETAILS = {
    1: {
      title: 'Very Good / คุณภาพดีมาก',
      range: 'AQI 0–25',
      color: '#00C0FF',
      badgeBg: '#e0f7ff',
      badgeText: '#0077aa',
      general: 'คุณภาพอากาศสะอาดบริสุทธิ์ เหมาะสำหรับการทำกิจกรรมทุกประเภท ทั้งกลางแจ้งและภายในอาคารโรงงาน',
      sensitive: 'บุคคลทั่วไปและกลุ่มเสี่ยงสามารถปฏิบัติงานได้ตามปกติ ไม่พบความเสี่ยงด้านสุขภาพ',
      factory: 'ปฏิบัติงานตามปกติในห้องพ่นสี ระบบระบายอากาศทำงานในโหมดมาตรฐาน (Exhaust Standard 40%) ไม่จำเป็นต้องใช้อุปกรณ์ PPE พิเศษนอกเหนือจากแว่นตานิรภัย',
    },
    2: {
      title: 'Good / คุณภาพดี',
      range: 'AQI 26–50',
      color: '#00CC66',
      badgeBg: '#ecfdf5',
      badgeText: '#047857',
      general: 'คุณภาพอากาศอยู่ในเกณฑ์มาตรฐานความปลอดภัย ไม่ส่งผลกระทบต่อสุขภาพ',
      sensitive: 'ผู้ที่มีโรคประจำตัวเกี่ยวกับทางเดินหายใจสามารถทำงานได้ตามปกติ สังเกตอาการหากเริ่มมีกลิ่นสารทำละลาย',
      factory: 'เดินระบบพัดลมดูดอากาศตามกะการทำงานตามปกติ ตรวจสอบความดันตกคร่อมไส้กรอง HEPA และแผ่นกรองคาร์บอนให้อยู่ในเกณฑ์',
    },
    3: {
      title: 'Moderate / ปานกลาง',
      range: 'AQI 51–100',
      color: '#FFD100',
      badgeBg: '#fef9c3',
      badgeText: '#a16207',
      general: 'เริ่มพบความเข้มข้นของฝุ่นหรือสารเคมีสะสม อาจรู้สึกระคายเคืองตาหรือจมูกเล็กน้อยเมื่ออยู่ในห้องอบเวลานาน',
      sensitive: 'ผู้มีอาการภูมิแพ้หรือทางเดินหายใจไวเกินควรลดระยะเวลาสัมผัสไอระเหยต่อเนื่อง',
      factory: 'ปรับเพิ่มกำลังพัดลมระบายอากาศ Scrubber เป็น 60–80% สวมหน้ากากกรองอนุภาคและไอสารเคมีขณะทำการพ่นสี',
    },
    4: {
      title: 'Unhealthy / เริ่มมีผลกระทบต่อสุขภาพ',
      range: 'AQI 101–200',
      color: '#FF7E00',
      badgeBg: '#ffede6',
      badgeText: '#c2410c',
      general: 'มลพิษทางอากาศเกินมาตรฐาน อาจก่อให้เกิดอาการไอ จาม ระคายเคืองตา แน่นหน้าอก หรือเวียนศีรษะ',
      sensitive: 'กลุ่มเสี่ยงควรหลีกเลี่ยงการเข้าไปในพื้นที่ไลน์พ่นสีโดยเด็ดขาด',
      factory: 'กดปุ่มเร่งพัดลม Exhaust Boost 100% สวมหน้ากาก Half-face Chemical Respirator (N95 + Organic Vapor Cartridge) เริ่มนับเวลา SLA 5 นาที เพื่อตรวจหาจุดรั่วไหลของสารทำละลาย',
    },
    5: {
      title: 'Hazardous / มีผลกระทบต่อสุขภาพมาก',
      range: 'AQI 201+',
      color: '#FF0000',
      badgeBg: '#fee2e2',
      badgeText: '#b91c1c',
      general: 'ระดับอันตรายวิกฤต เป็นอันตรายต่อระบบประสาทและปอดอย่างรุนแรงหากสูดดม',
      sensitive: 'อพยพทุกคนออกจากพื้นที่ทันที',
      factory: 'กดปุ่มแจ้งเหตุฉุกเฉินสารเคมีรั่วไหล (LINE OA Emergency Trigger) ตัดการจ่ายสารละลาย หยุดไลน์พ่นสี และอพยพผู้ปฏิบัติงานออกนอกอาคาร ห้ามเข้าใกล้จนกว่าเจ้าหน้าที่ความปลอดภัยจะอนุญาต',
    },
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#131b2e] tracking-tight flex items-center gap-2">
            <ShieldAlert size={28} className="text-[#004ac6]" />
            ข้อมูลดัชนีคุณภาพอากาศ (Air Quality Index : AQI)
          </h1>
          <p className="text-[13px] text-[#64748b] mt-0.5">
            เกณฑ์มาตรฐานการประเมินคุณภาพอากาศและแนวทางปฏิบัติด้านสุขภาพอนามัย (อ้างอิงมาตรฐานกรมควบคุมมลพิษ PCD Thailand)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<RefreshCw size={14} />}
            loading={loading}
            onClick={fetchLiveTelemetry}
          >
            ดึงข้อมูลสด
          </Button>
          <a
            href="https://air4thai.pcd.go.th/webV3/#/AQIInfo"
            target="_blank"
            rel="noreferrer"
            className="no-underline"
          >
            <Button variant="outline" size="sm" iconRight={<ExternalLink size={14} />}>
              ต้นแบบ Air4Thai PCD
            </Button>
          </a>
        </div>
      </div>

      {/* ── Section 1: Overview & PCD Standard Card ── */}
      <Card cornerGlow className="p-6">
        <h2 className="text-[18px] font-bold text-[#131b2e] mb-2">
          ดัชนีคุณภาพอากาศ (Air Quality Index : AQI) คืออะไร?
        </h2>
        <p className="text-[14px] leading-relaxed text-[#334155] mb-5">
          <strong>ดัชนีคุณภาพอากาศ (Air Quality Index : AQI)</strong> เป็นการรายงานข้อมูลคุณภาพอากาศในรูปแบบที่เข้าใจง่ายสำหรับประชาชนและบุคลากรในโรงงาน เพื่อให้ทราบถึงสถานการณ์มลพิษทางอากาศว่าอยู่ในระดับใด มีผลกระทบต่อสุขภาพอนามัยหรือไม่ โดยแบ่งออกเป็น <strong>5 ระดับมาตรฐานของประเทศไทย</strong>
        </p>

        {/* 5-Color Horizontal Gauge Bar */}
        <div className="my-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-[#131b2e]">
              แถบสีสัญลักษณ์ดัชนีคุณภาพอากาศของประเทศไทย (PCD Thailand AQI Scale)
            </span>
            <AqiBadge aqi={currentAqi} />
          </div>
          <AqiScaleBar currentAqi={currentAqi} showLabels={true} />
        </div>
        <p className="text-[12px] text-[#64748b] mt-3">
          * ค่าดัชนี 100 เทียบเท่ากับค่ามาตรฐานคุณภาพอากาศในบรรยากาศโดยทั่วไป หากค่าดัชนีสูงกว่า 100 แสดงว่าความเข้มข้นของมลพิษเริ่มส่งผลกระทบต่อสุขภาพอนามัย
        </p>
      </Card>

      {/* ── Section 2: Stitch 5-Level Clickable Cards (Touch Matrix) ── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#131b2e]">
            เกณฑ์ 5 ระดับและการปฏิบัติตน (แตะการ์ดเพื่อดูข้อกำหนด PPE และแผนรับมือ)
          </h2>
          <p className="text-[12px] text-[#64748b]">
            คลิกเลือกการ์ดแต่ละระดับสีเพื่อเปิดดูรายละเอียดประชากรทั่วไป กลุ่มเสี่ยง และข้อปฏิบัติโรงงาน
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { lvl: 1, name: 'Very Good', th: 'ดีมาก', aqi: '0–25', color: '#00C0FF', bg: '#e0f7ff', text: '#0077aa', desc: 'คุณภาพอากาศดีมาก ไม่มีผลกระทบ เหมาะกับทุกกิจกรรม' },
            { lvl: 2, name: 'Good', th: 'ดี', aqi: '26–50', color: '#00CC66', bg: '#ecfdf5', text: '#047857', desc: 'คุณภาพอากาศดี ปลอดภัยตามเกณฑ์มาตรฐานสากล' },
            { lvl: 3, name: 'Moderate', th: 'ปานกลาง', aqi: '51–100', color: '#FFD100', bg: '#fef9c3', text: '#a16207', desc: 'เริ่มมีสารเคมีสะสม ผู้มีอาการภูมิแพ้ควรลดการสัมผัส' },
            { lvl: 4, name: 'Unhealthy', th: 'เริ่มมีผลกระทบ', aqi: '101–200', color: '#FF7E00', bg: '#ffede6', text: '#c2410c', desc: 'เกินมาตรฐานความปลอดภัย เร่งพัดลม 100% สวม N95' },
            { lvl: 5, name: 'Hazardous', th: 'มีผลกระทบมาก', aqi: '201+', color: '#FF0000', bg: '#fee2e2', text: '#b91c1c', desc: 'อันตรายวิกฤต อพยพทันที แจ้งเตือนสารเคมีรั่วไหล' },
          ].map((item) => (
            <button
              key={item.lvl}
              type="button"
              onClick={() => setSelectedLevelModal(LEVEL_DETAILS[item.lvl])}
              className="text-left bg-white rounded-3xl p-5 border border-[#e2e8f0] shadow-card hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-3.5 h-3.5 rounded-full ring-4 ring-black/5" style={{ backgroundColor: item.color }} />
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: item.bg, color: item.text }}
                  >
                    AQI {item.aqi}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-[#131b2e] group-hover:text-[#004ac6] transition-colors">
                  {item.name}
                </h3>
                <span className="text-[12px] text-[#64748b] block mb-2">{item.th}</span>
              </div>
              <div>
                <p className="text-[12px] text-[#475569] leading-snug line-clamp-2">
                  {item.desc}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#004ac6] group-hover:underline">
                  ดูข้อกำหนด PPE →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 3: 6 Monitored Pollutants ── */}
      <div className="space-y-3">
        <h2 className="text-[18px] font-bold text-[#131b2e]">
          สารมลพิษและก๊าซอันตรายที่ระบบ VOC / E-Nose ตรวจวัด
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'สารอินทรีย์ระเหยง่ายรวม (Total VOCs)',
              formula: 'TVOC (Thinner / Acetone / Toluene)',
              color: '#8b5cf6',
              desc: 'ไอระเหยจากตัวทำละลาย สีสเปรย์ สามารถดูดซึมผ่านทางเดินหายใจ ก่อให้เกิดอาการเวียนศีรษะ ระคายเคืองเยื่อบุ',
              unit: 'ppb / ppm',
            },
            {
              title: 'ฝุ่นละอองขนาดเล็ก (PM₂.₅)',
              formula: 'Particulate Matter ≤ 2.5 µm',
              color: '#f97316',
              desc: 'ละอองผงสีฝุ่น (Powder Coating Dust) อนุภาคละเอียดมาก สามารถเข้าลึกถึงถุงลมปอดและกระแสเลือด',
              unit: 'µg/m³',
            },
            {
              title: 'คาร์บอนไดออกไซด์เทียบเท่า (eCO₂)',
              formula: 'Equivalent CO₂',
              color: '#0284c7',
              desc: 'ตัวชี้วัดประสิทธิภาพการระบายอากาศในห้องพ่นสี หากมีค่าสูงแสดงว่าอากาศถ่ายเทไม่เพียงพอ',
              unit: 'ppm',
            },
            {
              title: 'ก๊าซคาร์บอนมอนอกไซด์ (CO)',
              formula: 'Carbon Monoxide',
              color: '#dc2626',
              desc: 'ก๊าซไม่มีกลิ่นจากการเผาไหม้เตาอบ แย่งจับฮีโมโกลบินทำให้ร่างกายขาดออกซิเจน',
              unit: 'ppm',
            },
            {
              title: 'ก๊าซไนโตรเจนไดออกไซด์ (NO₂)',
              formula: 'Nitrogen Dioxide',
              color: '#d97706',
              desc: 'เกิดจากหัวพ่นความร้อนเตาอบ ก่อให้เกิดการระคายเคืองต่อระบบทางเดินหายใจ',
              unit: 'ppm',
            },
            {
              title: 'ก๊าซแอมโมเนียและกลิ่นฉุน (NH₃)',
              formula: 'Ammonia & Volatile Amines',
              color: '#10b981',
              desc: 'ไอระเหยจากสารเคมีปรับสภาพผิวโลหะ มีฤทธิ์กัดกร่อนและระคายเคืองตา จมูก คอ',
              unit: 'ppm',
            },
          ].map((p) => (
            <div
              key={p.title}
              className="bg-white rounded-3xl p-5 border border-[#e2e8f0] shadow-card flex flex-col justify-between"
              style={{ borderLeft: `4px solid ${p.color}` }}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[14px] font-bold text-[#131b2e]">{p.title}</h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#f1f5f9] text-[#475569]">
                    {p.unit}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-[#64748b] mb-2">{p.formula}</div>
                <p className="text-[12px] text-[#475569] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stitch Sub-state: Level Detail & PPE Guidance Modal ── */}
      <Modal
        isOpen={Boolean(selectedLevelModal)}
        onClose={() => setSelectedLevelModal(null)}
        title={selectedLevelModal?.title}
        subtitle={selectedLevelModal?.range}
        footer={
          <button
            type="button"
            onClick={() => setSelectedLevelModal(null)}
            className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-[13px] font-semibold hover:bg-[#1d4ed8]"
          >
            ปิดหน้าต่าง
          </button>
        }
      >
        {selectedLevelModal && (
          <div className="space-y-4">
            {/* General Public */}
            <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#eaedff] flex items-center justify-center shrink-0 text-[#004ac6]">
                <Users size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                  ประชาชนและผู้ปฏิบัติงานทั่วไป (General Public)
                </span>
                <p className="text-[13px] text-[#131b2e] leading-snug mt-1">
                  {selectedLevelModal.general}
                </p>
              </div>
            </div>

            {/* Sensitive Groups */}
            <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffede6] flex items-center justify-center shrink-0 text-[#c2410c]">
                <HeartPulse size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                  กลุ่มเสี่ยงและผู้มีโรคประจำตัว (Sensitive Groups)
                </span>
                <p className="text-[13px] text-[#131b2e] leading-snug mt-1">
                  {selectedLevelModal.sensitive}
                </p>
              </div>
            </div>

            {/* Factory Protocol & PPE */}
            <div className="p-3.5 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center shrink-0 text-white">
                <HardHat size={18} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#1e40af] uppercase tracking-wider">
                  แนวทางปฏิบัติการในโรงงานและอุปกรณ์ PPE (Factory Protocol)
                </span>
                <p className="text-[13px] text-[#1e40af] leading-snug mt-1 font-medium">
                  {selectedLevelModal.factory}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
