import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Cpu, Database, Activity, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Terminal, Wifi, BarChart2,
} from 'lucide-react';

// ─── ส่วนช่วยสำหรับ Code block ────────────────────────────────
function CodeBlock({ children, lang = '' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(children.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div style={{ position: 'relative', margin: '0.75rem 0' }}>
      <pre style={{
        background: '#1e293b', color: '#e2e8f0', borderRadius: '0.5rem',
        padding: '1rem 1.25rem', fontSize: '0.8rem', lineHeight: 1.7,
        overflowX: 'auto', margin: 0, fontFamily: '"Fira Code", "Consolas", monospace',
      }}>
        <code>{children.trim()}</code>
      </pre>
      {lang && (
        <span style={{ position: 'absolute', top: '0.5rem', right: '4rem', fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{lang}</span>
      )}
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          background: copied ? '#10b981' : '#334155', color: 'white',
          border: 'none', borderRadius: '0.25rem', padding: '0.2rem 0.5rem',
          fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s',
        }}
      >
        {copied ? '✓ copied' : 'copy'}
      </button>
    </div>
  );
}

// ─── Step circle ─────────────────────────────────────────────
function Step({ n, title, children }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem' }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          color: 'white', fontWeight: 700, fontSize: '1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px #2563eb44',
        }}>{n}</div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{title}</div>
        <div style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.875rem' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Callout box ─────────────────────────────────────────────
function Callout({ type = 'info', children }) {
  const styles = {
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: 'ℹ️' },
    tip:     { bg: '#f0fdf4', border: '#86efac', color: '#166534', icon: '💡' },
    warning: { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⚠️' },
    danger:  { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '🔴' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '0.5rem', padding: '0.75rem 1rem', margin: '0.75rem 0', display: 'flex', gap: '0.5rem' }}>
      <span style={{ flexShrink: 0 }}>{s.icon}</span>
      <div style={{ fontSize: '0.85rem', color: s.color, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────
function FaqItem({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.25rem 0' }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{q}</span>
        {open ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </button>
      {open && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#334155', lineHeight: 1.8 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────
function Section({ id, icon, title, children, accent = '#2563eb' }) {
  return (
    <div id={id} className="card" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${accent}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
        <div style={{ color: accent }}>{icon}</div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Main Guide page ──────────────────────────────────────────
export default function Guide() {
  const sections = [
    { id: 's1', label: '📋 ภาพรวม' },
    { id: 's2', label: '📦 ข้อกำหนด' },
    { id: 's3', label: '🚀 Quick Start' },
    { id: 's4', label: '🗂 เก็บข้อมูล' },
    { id: 's5', label: '🤖 เทรน AI' },
    { id: 's6', label: '📡 ESP32' },
    { id: 's7', label: '📊 อ่าน Dashboard' },
    { id: 's8', label: '❓ FAQ' },
  ];

  return (
    <div style={{ maxWidth: 860 }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
        borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem', color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <BookOpen size={28} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>คู่มือการใช้งาน VOC / E-Nose</h1>
        </div>
        <p style={{ opacity: 0.9, lineHeight: 1.8, fontSize: '0.9rem', maxWidth: 600 }}>
          ระบบตรวจสอบสารอินทรีย์ระเหยง่าย (VOC) และคุณภาพอากาศ
          ด้วย E-Nose (กล่องเซนเซอร์ ESP32-S3) + AI Classification
        </p>

        {/* Quick jump */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.25rem' }}>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '0.3rem 0.75rem', borderRadius: '999px',
              backgroundColor: 'rgba(255,255,255,0.18)', color: 'white',
              textDecoration: 'none', backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>{s.label}</a>
          ))}
        </div>
      </div>

      {/* ── S1: ภาพรวมระบบ ── */}
      <Section id="s1" icon={<Activity size={20} />} title="ภาพรวมระบบ" accent="#2563eb">
        <p style={{ lineHeight: 1.8, fontSize: '0.875rem', color: '#334155', marginBottom: '1rem' }}>
          ระบบประกอบด้วย 3 ส่วนหลักที่ทำงานร่วมกัน:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { icon: <Cpu size={20} />, title: 'ESP32-S3 (Hardware)', color: '#0ea5e9', items: ['เซนเซอร์ SGP30/SGP40 (TVOC, eCO₂)', 'SPS30 (PM2.5)', 'DHT22 (Temp, Humidity)', 'MQ3/MQ135/MQ8, MICS-4514 (Gas)'] },
            { icon: <Terminal size={20} />, title: 'Backend (FastAPI)', color: '#8b5cf6', items: ['รับข้อมูลจาก ESP32 ทุก 3–5 วิ', 'บันทึกลง PostgreSQL', 'เรียก AI Model ทำนาย', 'สร้าง Alert อัตโนมัติ'] },
            { icon: <BarChart2 size={20} />, title: 'Frontend (React)', color: '#10b981', items: ['Dashboard real-time', 'ระบบ Alert แจ้งเตือน', 'เก็บข้อมูลเทรน AI', 'Airflow Diagram'] },
          ].map(card => (
            <div key={card.title} style={{ borderRadius: '0.625rem', border: `1.5px solid ${card.color}30`, background: `${card.color}08`, padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: card.color, fontWeight: 700, marginBottom: '0.75rem' }}>
                {card.icon} {card.title}
              </div>
              <ul style={{ paddingLeft: '1.1rem', margin: 0, lineHeight: 2 }}>
                {card.items.map(i => <li key={i} style={{ fontSize: '0.78rem', color: '#334155' }}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontFamily: 'monospace' }}>
          ESP32-S3 → POST /api/ingest → FastAPI → PostgreSQL → React Dashboard
        </div>
      </Section>

      {/* ── S2: Requirements ── */}
      <Section id="s2" icon={<CheckCircle size={20} />} title="ข้อกำหนด (Requirements)" accent="#10b981">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#0ea5e9' }}>🔌 Hardware</h3>
            <ul style={{ paddingLeft: '1.1rem', lineHeight: 2.2, fontSize: '0.85rem', color: '#334155' }}>
              <li>ESP32-S3 DevKit</li>
              <li>SGP30 หรือ SGP40 (TVOC + eCO₂)</li>
              <li>SPS30 หรือ PMS5003 (PM2.5)</li>
              <li>DHT22 (อุณหภูมิ + ความชื้น)</li>
              <li>MQ-3, MQ-135, MQ-8 (Gas Sensors)</li>
              <li>MICS-4514 (CO + NO₂)</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', color: '#8b5cf6' }}>💻 Software</h3>
            <ul style={{ paddingLeft: '1.1rem', lineHeight: 2.2, fontSize: '0.85rem', color: '#334155' }}>
              <li>Docker Desktop (สำหรับ PostgreSQL)</li>
              <li>Python 3.10+ + pip</li>
              <li>Node.js 18+ + npm</li>
              <li>Arduino IDE หรือ PlatformIO</li>
              <li>scikit-learn, pandas, matplotlib</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ── S3: Quick Start ── */}
      <Section id="s3" icon={<Terminal size={20} />} title="เริ่มต้นใช้งาน (Quick Start)" accent="#8b5cf6">
        <Step n="1" title="เปิด Database (PostgreSQL)">
          รันจาก root ของ project:
          <CodeBlock lang="bash">{`
docker-compose up -d
# รอ ~10 วิ ให้ DB พร้อม แล้วตรวจสอบ:
docker logs voc_postgres --tail 5
          `}</CodeBlock>
        </Step>

        <Step n="2" title="รัน Backend (FastAPI)">
          <CodeBlock lang="bash">{`
cd backend
pip install fastapi uvicorn asyncpg pandas scikit-learn
python main.py
# Backend พร้อมที่ http://localhost:8000
# ดู API docs: http://localhost:8000/docs
          `}</CodeBlock>
        </Step>

        <Step n="3" title="รัน Frontend (React)">
          <CodeBlock lang="bash">{`
cd frontend
npm install
npm run dev
# Frontend พร้อมที่ http://localhost:5173
          `}</CodeBlock>
          <Callout type="tip">
            ถ้าต้องการดูระบบโดยไม่ต้องมี Backend จริง ไฟล์ <code>mockApi.js</code> จะ intercept fetch() ให้อัตโนมัติ
            ค่าเซนเซอร์จะ simulate แบบ real-time ทุก 3 วินาที
          </Callout>
        </Step>

        <Step n="4" title="(ถ้ามี ESP32) อัปโหลด Firmware และเชื่อมต่อ WiFi">
          ตั้งค่า <code>SERVER_IP</code> ใน firmware ให้ตรงกับ IP ของเครื่องที่รัน Backend
          แล้ว flash ไปยัง ESP32-S3 — ดูรายละเอียดใน <a href="#s6" style={{ color: '#2563eb', fontWeight: 600 }}>หัวข้อ ESP32 Setup</a>
        </Step>
      </Section>

      {/* ── S4: Data Collection ── */}
      <Section id="s4" icon={<Database size={20} />} title="การเก็บข้อมูลเทรน AI" accent="#f59e0b">
        <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.8, marginBottom: '1rem' }}>
          ก่อนเทรน AI Model ต้องเก็บข้อมูล sensor จากสารจริงๆ ไว้ใน Database อย่างน้อย <strong>5 ชนิดสาร ชนิดละ 200 readings</strong>
        </p>
        <Step n="1" title='ไปที่หน้า "Data Collection"'>
          คลิก <Link to="/data-collection" style={{ color: '#f59e0b', fontWeight: 700 }}>Data Collection →</Link> ในแถบเมนูซ้าย
        </Step>
        <Step n="2" title="เลือก Label และเริ่มบันทึก">
          เลือกชนิดสาร เช่น <code>THINNER</code> แล้วกด <strong>"เริ่มบันทึก"</strong>
          ระบบจะสร้าง Session ID และรอรับข้อมูลจาก ESP32
        </Step>
        <Step n="3" title="วางสารใกล้กล่องเซนเซอร์">
          วางสารห่างจากกล่องประมาณ 5–15 ซม. ทิ้งไว้ <strong>5–10 นาที</strong>
          จนได้ readings เพียงพอ (ดูตัวเลขในหน้า Data Collection)
        </Step>
        <Step n="4" title="กดหยุดและทำซ้ำ">
          กด <strong>"หยุดบันทึก"</strong> จากนั้นเปลี่ยนสารและทำซ้ำตั้งแต่ข้อ 1–3
        </Step>
        <Callout type="tip">
          <strong>สารที่แนะนำ:</strong> AMBIENT (อากาศปกติ), THINNER, ALCOHOL, ACETONE, BENZENE, TOLUENE, GASOLINE, BLEACH
          — ยิ่งหลายชนิด Model ยิ่งแม่นยำ
        </Callout>
        <Callout type="warning">
          ควรเก็บข้อมูล AMBIENT ด้วยทุกครั้ง เพื่อให้ Model รู้จัก "สภาวะปกติ" และไม่แจ้งเตือนผิดพลาด
        </Callout>
      </Section>

      {/* ── S5: Train Model ── */}
      <Section id="s5" icon={<Cpu size={20} />} title="การเทรน AI Model" accent="#ef4444">
        <Step n="1" title="Export CSV จากระบบ">
          ไปที่ <Link to="/data-collection" style={{ color: '#ef4444', fontWeight: 700 }}>Data Collection →</Link> แล้วกด <strong>"Export CSV ทั้งหมด"</strong>
          บันทึกไฟล์ <code>voc_training_data.csv</code> ไว้ใน folder <code>ml/</code>
        </Step>
        <Step n="2" title="รัน Training Script">
          <CodeBlock lang="bash">{`
cd ml
pip install scikit-learn pandas matplotlib seaborn
python train_model.py
# จะได้ไฟล์: voc_model.pkl, model_meta.json
# และรูป: confusion_matrix.png, feature_importance.png
          `}</CodeBlock>
        </Step>
        <Step n="3" title="Copy Model ไปที่ Backend แล้ว Restart">
          <CodeBlock lang="bash">{`
copy ml\\voc_model.pkl backend\\voc_model.pkl
# หรือ Linux/Mac:
# cp ml/voc_model.pkl backend/voc_model.pkl

# Restart backend:
# กด Ctrl+C แล้วรัน python main.py ใหม่
          `}</CodeBlock>
          Dashboard จะแสดง <strong>"AI Model Loaded"</strong> และหยุดแสดง Mock badge
        </Step>
        <Callout type="info">
          Model ใช้ <strong>Random Forest Classifier</strong> + StandardScaler ผ่าน sklearn Pipeline
          — เวลาเทรนปกติ 30–120 วิ ขึ้นกับจำนวน readings
        </Callout>
      </Section>

      {/* ── S6: ESP32 ── */}
      <Section id="s6" icon={<Wifi size={20} />} title="การตั้งค่า ESP32 (Firmware)" accent="#0ea5e9">
        <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.8, marginBottom: '1rem' }}>
          ESP32-S3 ต้อง POST ข้อมูลเซนเซอร์ไปยัง Backend ทุก 3–5 วินาที รูปแบบ JSON ดังนี้:
        </p>
        <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Endpoint</h3>
        <CodeBlock lang="">{`POST http://<SERVER_IP>:8000/api/ingest`}</CodeBlock>

        <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '1rem 0 0.5rem' }}>JSON Payload</h3>
        <CodeBlock lang="json">{`
{
  "box_id":   "BOX-001",
  "temp":     28.5,
  "rh":       62.0,
  "pm25":     12.0,
  "tvoc":     120,
  "eco2":     580,
  "mq3":      210,
  "mq135":    340,
  "mq8":      95,
  "mics_co":  180,
  "no2":      45,
  "nh3":      60,
  "session_id": null
}
        `}</CodeBlock>

        <h3 style={{ fontWeight: 600, fontSize: '0.875rem', margin: '1rem 0 0.5rem' }}>ตัวอย่าง Arduino (ESP32)</h3>
        <CodeBlock lang="C++">{`
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* SERVER = "http://192.168.1.100:8000/api/ingest";

void sendReading(float temp, float rh, float pm25,
                 float tvoc, float eco2,
                 int mq3, int mq135, int mq8,
                 int mics_co, int no2, int nh3) {
  if (WiFi.status() != WL_CONNECTED) return;

  StaticJsonDocument<512> doc;
  doc["box_id"]  = "BOX-001";
  doc["temp"]    = temp;
  doc["rh"]      = rh;
  doc["pm25"]    = pm25;
  doc["tvoc"]    = tvoc;
  doc["eco2"]    = eco2;
  doc["mq3"]     = mq3;
  doc["mq135"]   = mq135;
  doc["mq8"]     = mq8;
  doc["mics_co"] = mics_co;
  doc["no2"]     = no2;
  doc["nh3"]     = nh3;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(SERVER);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  http.end();
}

void loop() {
  // อ่านค่าเซนเซอร์ ...
  sendReading(temp, rh, pm25, tvoc, eco2,
              mq3, mq135, mq8, mics_co, no2, nh3);
  delay(3000); // ส่งทุก 3 วิ
}
        `}</CodeBlock>
        <Callout type="tip">
          เมื่อกำลังเก็บข้อมูลเทรน ให้ใส่ <code>"session_id": &lt;id&gt;</code> ที่ได้จากการกด "เริ่มบันทึก" ในหน้า Data Collection
        </Callout>
      </Section>

      {/* ── S7: อ่าน Dashboard ── */}
      <Section id="s7" icon={<BarChart2 size={20} />} title="การอ่านค่า Dashboard" accent="#10b981">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          {[
            { title: 'AI Detection Card', color: '#2563eb', content: 'แสดงผลทำนายจาก AI Model เช่น AMBIENT / THINNER / ALCOHOL พร้อม Confidence % ยิ่งสูงยิ่งมั่นใจ' },
            { title: 'Alert Levels', color: '#ef4444', content: '🟡 Warning = ค่าเกินปกติ ควรระวัง\n🟠 High = AI ตรวจพบสารอันตราย\n🔴 Critical = ค่าวิกฤต ต้องดำเนินการ' },
            { title: 'TVOC (ppb)', color: '#8b5cf6', content: '< 200 ppb = ปกติ\n200–400 ppb = ระวัง\n> 400 ppb = อันตราย ควรระบายอากาศทันที' },
            { title: 'PM2.5 (µg/m³)', color: '#f59e0b', content: '< 35 µg/m³ = ปกติ\n35–75 µg/m³ = ระวัง\n> 75 µg/m³ = อันตราย ใส่หน้ากาก N95' },
            { title: 'eCO₂ (ppm)', color: '#0ea5e9', content: '< 1000 ppm = อากาศดี\n1000–2000 ppm = ระบายอากาศเพิ่ม\n> 2000 ppm = อากาศเสีย ต้องระบายโดยทันที' },
            { title: 'E-Nose Sensors', color: '#64748b', content: 'MQ3, MQ135, MQ8 เป็น raw ADC ยิ่งสูงยิ่งมีความเข้มข้นของก๊าซมาก ค่าปกติขึ้นกับแต่ละสภาพแวดล้อม' },
          ].map(card => (
            <div key={card.title} style={{ borderRadius: '0.625rem', padding: '0.875rem', border: `1.5px solid ${card.color}30`, background: `${card.color}06` }}>
              <div style={{ fontWeight: 700, color: card.color, marginBottom: '0.5rem', fontSize: '0.875rem' }}>{card.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{card.content}</div>
            </div>
          ))}
        </div>
        <Callout type="danger">
          ถ้า AI Detection แสดงชนิดสารและ Confidence &gt; 80% ควรหยุดกิจกรรม ระบายอากาศ และตรวจสอบแหล่งที่มาของสารทันที
        </Callout>
      </Section>

      {/* ── S8: FAQ ── */}
      <Section id="s8" icon={<AlertTriangle size={20} />} title="คำถามที่พบบ่อย (FAQ)" accent="#64748b">
        <FaqItem q="Dashboard แสดง '🟡 MOCK MODE' หมายความว่าอะไร?">
          หมายความว่าระบบกำลังแสดงข้อมูลจำลอง (simulate) ยังไม่ได้เชื่อมต่อกับ Backend จริงหรือ ESP32 จริง
          ให้รัน <code>docker-compose up -d</code> และ <code>python main.py</code> ตามขั้นตอน Quick Start ก่อน
          แล้วลบ <code>import './mockApi.js'</code> ออกจาก <code>frontend/src/main.jsx</code>
        </FaqItem>
        <FaqItem q="Backend เปิดแล้วแต่ Dashboard ยังไม่แสดงข้อมูล?">
          ตรวจสอบ CORS — Backend ต้องอนุญาต <code>http://localhost:5173</code>
          และตรวจสอบว่า <code>BOX-001</code> มีอยู่ใน table <code>devices</code> แล้ว (มี seed data ใน init.sql)
        </FaqItem>
        <FaqItem q="AI ทำนายผิดบ่อยหรือ Confidence ต่ำ?">
          <ul style={{ paddingLeft: '1rem' }}>
            <li>เก็บข้อมูล AMBIENT ไม่เพียงพอ — ควรเก็บอย่างน้อย 300 readings</li>
            <li>ข้อมูลไม่สมดุล — แต่ละชนิดสารควรมี readings ใกล้เคียงกัน</li>
            <li>เงื่อนไขแวดล้อม (อุณหภูมิ, ความชื้น) แตกต่างจากตอนเก็บข้อมูล</li>
            <li>เซนเซอร์ยังไม่ warm-up — ให้เปิดอุปกรณ์ทิ้งไว้ 5–10 นาทีก่อน</li>
          </ul>
        </FaqItem>
        <FaqItem q="เพิ่ม Box ID ใหม่ได้อย่างไร?">
          ส่ง POST /api/ingest โดยใส่ <code>box_id</code> ใหม่ — ระบบจะสร้าง device record ให้อัตโนมัติ
          หรือ insert โดยตรงใน PostgreSQL ก็ได้
        </FaqItem>
        <FaqItem q="ส่งออก CSV เพื่อเทรน Model ได้จากที่ไหน?">
          หน้า <Link to="/data-collection" style={{ color: '#2563eb', fontWeight: 600 }}>Data Collection</Link> มีปุ่ม <strong>"Export CSV ทั้งหมด"</strong>
          หรือเรียก <code>GET /api/export/csv</code> โดยตรงก็ได้
        </FaqItem>
        <FaqItem q="ปรับ threshold การแจ้งเตือนได้ที่ไหน?">
          ปรับสีบน Dashboard ได้ที่หน้า <Link to="/settings" style={{ color: '#2563eb', fontWeight: 600 }}>Settings</Link>
          — สำหรับ Alert ใน Backend จริง ต้องแก้ <code>THRESHOLDS</code> ใน <code>backend/main.py</code> บรรทัด 15–18
        </FaqItem>
      </Section>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
        VOC / E-Nose System — คู่มือฉบับย่อ | ปัญหาเพิ่มเติม ติดต่อทีมพัฒนา
      </div>
    </div>
  );
}
