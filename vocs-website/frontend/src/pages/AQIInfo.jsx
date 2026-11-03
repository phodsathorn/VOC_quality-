import { useState, useEffect } from 'react';
import {
  ShieldAlert, Activity, Info, CheckCircle2, Wind,
  AlertTriangle, RefreshCw, Flame, ExternalLink, ArrowRight,
  Gauge, HelpCircle, Check, Eye
} from 'lucide-react';
import { API } from '../config';
import {
  AqiScaleBar, AqiBadge, Button, Card, StatCard, PageHeader,
  AQI_LEVELS, calculatePm25Aqi, getAqiCategory
} from '../components/ui';

export default function AQIInfo() {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testValue, setTestValue] = useState(15);
  const [testMode, setTestMode] = useState('pm25'); // 'pm25' | 'tvoc'

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
  const tvocVal = telemetry?.environment?.tvoc ?? telemetry?.latest_reading?.tvoc ?? 45.0;
  const currentAqi = calculatePm25Aqi(pm25Val);
  const currentCat = getAqiCategory(currentAqi);

  // Calculated category for interactive tester
  const testAqi = testMode === 'pm25'
    ? calculatePm25Aqi(Number(testValue) || 0)
    : Math.min(500, Math.round((Number(testValue) || 0) / 4.4));
  const testCat = getAqiCategory(testAqi);

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── Page Header ── */}
      <PageHeader
        title="ข้อมูลดัชนีคุณภาพอากาศ (Air Quality Index : AQI)"
        subtitle="เกณฑ์มาตรฐานการประเมินคุณภาพอากาศและแนวทางปฏิบัติด้านสุขภาพอนามัย (อ้างอิงมาตรฐานกรมควบคุมมลพิษ PCD Thailand)"
        icon={<ShieldAlert size={24} />}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
              style={{ textDecoration: 'none' }}
            >
              <Button
                variant="outline"
                size="sm"
                iconRight={<ExternalLink size={14} />}
              >
                ต้นแบบ Air4Thai ทางการ
              </Button>
            </a>
          </div>
        }
      />

      {/* ── Section 1: Overview & Official Definition (ถอดแบบจาก Air4Thai PCD) ── */}
      <Card style={{ marginBottom: 24, padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
          ดัชนีคุณภาพอากาศ (Air Quality Index : AQI) คืออะไร?
        </h2>
        <p style={{ fontSize: '0.925rem', lineHeight: 1.75, color: '#334155', margin: '0 0 16px' }}>
          <strong>ดัชนีคุณภาพอากาศ (Air Quality Index : AQI)</strong> เป็นการรายงานข้อมูลคุณภาพอากาศในรูปแบบที่เข้าใจง่ายสำหรับประชาชนและบุคลากรในโรงงาน เพื่อเผยแพร่ประชาสัมพันธ์ให้ทราบถึงสถานการณ์มลพิษทางอากาศในแต่ละพื้นที่ว่าอยู่ในระดับใด มีผลกระทบต่อสุขภาพอนามัยหรือไม่ โดยแบ่งออกเป็น <strong>5 ระดับมาตรฐานสากล</strong>
        </p>

        {/* Air4Thai 5-Level Reference Bar */}
        <div style={{ margin: '20px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              แถบสีสัญลักษณ์ดัชนีคุณภาพอากาศของประเทศไทย (PCD Thailand AQI Scale)
            </span>
            <AqiBadge aqi={currentAqi} />
          </div>
          <AqiScaleBar currentAqi={currentAqi} showLabels={true} />
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          * ค่าดัชนีคุณภาพอากาศ 100 เทียบเท่ากับค่ามาตรฐานคุณภาพอากาศในบรรยากาศโดยทั่วไป หากค่าดัชนีสูงกว่า 100 แสดงว่าความเข้มข้นของมลพิษเริ่มส่งผลกระทบต่อสุขภาพอนามัย
        </p>
      </Card>

      {/* ── Section 2: Pollutants Monitored by VOC / E-Nose Platform ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            สารมลพิษและก๊าซอันตรายที่ระบบ VOC / E-Nose ตรวจวัด
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            ระบบใช้เซนเซอร์ Semiconductor Gas Array และเซนเซอร์วัดอนุภาคความแม่นยำสูงในการเฝ้าระวัง 6 สารสำคัญ
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {[
            {
              title: 'สารอินทรีย์ระเหยง่ายรวม (Total VOCs)',
              formula: 'TVOC (Thinner / Acetone / Toluene)',
              sensor: 'CCS811 & MOX Array (MQ-3, MQ-135)',
              color: '#8b5cf6',
              desc: 'ไอระเหยจากตัวทำละลาย สีสเปรย์ และสารเคมีล้างชิ้นงาน สามารถดูดซึมผ่านทางเดินหายใจ ก่อให้เกิดอาการเวียนศีรษะ คลื่นไส้ ระคายเคืองเยื่อบุ และส่งผลต่อตับไตในระยะยาว',
              unit: 'ppb / ppm'
            },
            {
              title: 'ฝุ่นละอองขนาดไม่เกิน 2.5 ไมครอน (PM₂.₅)',
              formula: 'Particulate Matter ≤ 2.5 µm',
              sensor: 'Laser Scattering (PMS7003 / SDS011)',
              color: '#f97316',
              desc: 'ละอองผงสีฝุ่น (Powder Coating Dust) อนุภาคละเอียดมาก สามารถเข้าลึกถึงถุงลมปอดและกระแสเลือด ทำให้หลอดลมอักเสบ หอบหืด และสมรรถภาพปอดลดลง',
              unit: 'µg/m³'
            },
            {
              title: 'ก๊าซคาร์บอนไดออกไซด์เทียบเท่า (eCO₂)',
              formula: 'Equivalent Carbon Dioxide',
              sensor: 'CCS811 Algorithm',
              color: '#0284c7',
              desc: 'ตัวชี้วัดประสิทธิภาพการระบายอากาศในห้องพ่นสี หากมีค่าสูงแสดงว่าอากาศถ่ายเทไม่เพียงพอ ทำให้เกิดความอึดอัด อ่อนเพลีย และสารพิษสะสมตัว',
              unit: 'ppm'
            },
            {
              title: 'ก๊าซคาร์บอนมอนอกไซด์ (CO)',
              formula: 'Carbon Monoxide',
              sensor: 'MiCS-5524 / MQ-7 Electrochemical',
              color: '#dc2626',
              desc: 'ก๊าซไม่มีสี ไม่มีกลิ่น เกิดจากการเผาไหม้ที่ไม่สมบูรณ์ของเตาอบ (Oven) แย่งจับฮีโมโกลบินในเม็ดเลือดแดง ทำให้ร่างกายขาดออกซิเจน',
              unit: 'ppm'
            },
            {
              title: 'ก๊าซไนโตรเจนไดออกไซด์ (NO₂)',
              formula: 'Nitrogen Dioxide',
              sensor: 'MiCS-6814 Reducing Channel',
              color: '#d97706',
              desc: 'ก๊าซสีน้ำตาลส้ม มีกลิ่นฉุน เกิดจากหัวพ่นความร้อนในเตาอบ ก่อให้เกิดการระคายเคืองต่อระบบทางเดินหายใจส่วนล่างอย่างรุนแรง',
              unit: 'ppm'
            },
            {
              title: 'ก๊าซแอมโมเนียและไอสารเคมี (NH₃ / Fumes)',
              formula: 'Ammonia & Volatile Amines',
              sensor: 'MQ-135 Hazardous Gas Sensor',
              color: '#10b981',
              desc: 'ไอระเหยจากสารเคมีปรับสภาพผิวโลหะ มีฤทธิ์กัดกร่อนและระคายเคืองตา จมูก คอ',
              unit: 'ADC / ppm'
            },
          ].map(p => (
            <div
              key={p.title}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '18px 20px',
                borderLeft: `4px solid ${p.color}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {p.title}
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, backgroundColor: '#f1f5f9', color: '#475569' }}>
                  {p.unit}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: p.color, fontWeight: 700, marginBottom: 8, fontFamily: 'monospace' }}>
                {p.formula} • {p.sensor}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Comprehensive 5-Level Threshold & Health Advice Table (ตาราง 5 ระดับ) ── */}
      <Card style={{ marginBottom: 24, padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            ตารางเกณฑ์เปรียบเทียบระดับคุณภาพอากาศและแนวทางปฏิบัติตน (5-Level Action Matrix)
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
            การแปลงค่าความเข้มข้นจากเซนเซอร์เป็นระดับ Air4Thai และขั้นตอนความปลอดภัยของฝ่ายปฏิบัติการ
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 18px' }}>ระดับคุณภาพอากาศ</th>
                <th style={{ padding: '12px 14px' }}>ดัชนี AQI</th>
                <th style={{ padding: '12px 14px' }}>PM2.5 (µg/m³)</th>
                <th style={{ padding: '12px 14px' }}>TVOC (ppb)</th>
                <th style={{ padding: '12px 18px' }}>ผลกระทบต่อสุขภาพ</th>
                <th style={{ padding: '12px 18px' }}>แนวทางปฏิบัติการในโรงงาน</th>
              </tr>
            </thead>
            <tbody>
              {AQI_LEVELS.map(lvl => {
                // Corresponding thresholds for our factory
                const limits = {
                  1: { pm: '0 – 25', tvoc: '< 65', health: 'คุณภาพอากาศดีมาก ไม่มีผลกระทบต่อสุขภาพ', action: 'ปฏิบัติงานได้ตามปกติในห้องพ่นสี' },
                  2: { pm: '26 – 37.5', tvoc: '66 – 220', health: 'คุณภาพอากาศดี อยู่ในเกณฑ์มาตรฐานปลอดภัย', action: 'ปฏิบัติงานตามกะปกติ ตรวจเช็คการทำงานของพัดลม Auto' },
                  3: { pm: '37.6 – 50', tvoc: '221 – 660', health: 'เริ่มได้กลิ่นสารเคมีสะสม อาจระคายเคืองตา/จมูก', action: 'เร่งพัดลมระบายอากาศ 60% สวมหน้ากากกรองฝุ่นและไอระเหย' },
                  4: { pm: '50.1 – 90', tvoc: '661 – 2,200', health: 'สารเคมีเกินค่าควบคุม อาจเวียนศีรษะ แน่นหน้าอก', action: 'กดปุ่มเร่ง Exhaust Boost 100% สวมหน้ากาก N95/Chemical Respirator เริ่มจับเวลา SLA 5 นาที' },
                  5: { pm: '> 90', tvoc: '> 2,200', health: 'ระดับวิกฤต เป็นอันตรายต่อระบบประสาทและปอด', action: 'อพยพผู้ปฏิบัติงานทันที กดแจ้งเหตุฉุกเฉินสารเคมีรั่วไหล ห้ามเข้าใกล้จนกว่าจะตรวจสอบเสร็จ' },
                }[lvl.level];

                return (
                  <tr key={lvl.level} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 999, fontWeight: 800, fontSize: '0.78rem',
                        backgroundColor: lvl.bg, color: lvl.text, border: `1px solid ${lvl.border}`
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: lvl.colorHex }} />
                        {lvl.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 14px', fontWeight: 700, fontFamily: 'monospace' }}>
                      {lvl.rangeStr}
                    </td>
                    <td style={{ padding: '14px 14px', fontFamily: 'monospace', color: '#0f172a' }}>
                      {limits.pm}
                    </td>
                    <td style={{ padding: '14px 14px', fontFamily: 'monospace', color: '#0f172a' }}>
                      {limits.tvoc}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#334155', maxWidth: 240, lineHeight: 1.45 }}>
                      {limits.health}
                    </td>
                    <td style={{ padding: '14px 18px', color: lvl.level >= 4 ? '#b91c1c' : '#15803d', fontWeight: lvl.level >= 4 ? 700 : 500, maxWidth: 260, lineHeight: 1.45 }}>
                      {limits.action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Section 4: Interactive Live Sensor Assessment & Simulator ── */}
      <Card style={{ marginBottom: 28, padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
          เครื่องมือประเมินระดับคุณภาพอากาศแบบโต้ตอบ (Interactive AQI Evaluator)
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px' }}>
          ทดลองระบุค่าความเข้มข้นหรือกดดึงค่าจริงจากเซนเซอร์ BOX-001 เพื่อดูระดับผลกระทบและคำแนะนำทันที
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
          {/* Controls */}
          <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => { setTestMode('pm25'); setTestValue(pm25Val); }}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${testMode === 'pm25' ? '#2563eb' : '#cbd5e1'}`,
                  backgroundColor: testMode === 'pm25' ? '#eff6ff' : '#ffffff',
                  color: testMode === 'pm25' ? '#1d4ed8' : '#475569',
                  fontWeight: 700, fontSize: '0.825rem'
                }}
              >
                ประเมินจาก PM2.5 (µg/m³)
              </button>
              <button
                onClick={() => { setTestMode('tvoc'); setTestValue(tvocVal); }}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${testMode === 'tvoc' ? '#2563eb' : '#cbd5e1'}`,
                  backgroundColor: testMode === 'tvoc' ? '#eff6ff' : '#ffffff',
                  color: testMode === 'tvoc' ? '#1d4ed8' : '#475569',
                  fontWeight: 700, fontSize: '0.825rem'
                }}
              >
                ประเมินจาก TVOC (ppb)
              </button>
            </div>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              {testMode === 'pm25' ? 'ระบุค่าความเข้มข้น PM2.5 (µg/m³)' : 'ระบุค่าสารระเหย TVOC (ppb)'}
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                step="0.1"
                min="0"
                value={testValue}
                onChange={e => setTestValue(e.target.value)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1',
                  fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace'
                }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={() => setTestValue(testMode === 'pm25' ? pm25Val : tvocVal)}
              >
                ใช้ค่าเซนเซอร์จริง
              </Button>
            </div>
          </div>

          {/* Result Card */}
          <div style={{
            backgroundColor: testCat.bg,
            border: `2px solid ${testCat.border}`,
            borderRadius: 12,
            padding: 22,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: testCat.text, textTransform: 'uppercase' }}>
                ผลการคำนวณดัชนี AQI
              </span>
              <span style={{
                fontSize: '0.75rem', fontWeight: 800, padding: '2px 10px', borderRadius: 999,
                backgroundColor: testCat.colorHex, color: '#ffffff'
              }}>
                {testCat.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: testCat.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {testAqi}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: testCat.text }}>
                AQI ({testCat.labelEn})
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: testCat.text, lineHeight: 1.5, margin: 0 }}>
              {testCat.description}
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
}
