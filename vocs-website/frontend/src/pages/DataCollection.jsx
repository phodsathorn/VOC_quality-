import { useState, useEffect, useMemo } from 'react';
import { Pencil, Trash2, X, Save, Square, Play, Calculator, FlaskConical } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const SUBSTANCE_DATA = {
  ALCOHOL:  { name: 'Ethanol / Alcohol', mw: 46.07, density: 0.789, desc: 'เอทานอล / แอลกอฮอล์ C₂H₅OH' },
  ETHANOL:  { name: 'Ethanol / Alcohol', mw: 46.07, density: 0.789, desc: 'เอทานอล / แอลกอฮอล์ C₂H₅OH' },
  IPA:      { name: 'Isopropanol (IPA)', mw: 60.10, density: 0.786, desc: 'ไอโซโพรพิลแอลกอฮอล์ C₃H₈O' },
  ACETONE:  { name: 'Acetone',           mw: 58.08, density: 0.784, desc: 'อะซีโตน C₃H₆O' },
  THINNER:  { name: 'Thinner (Toluene)', mw: 92.14, density: 0.867, desc: 'ทินเนอร์ / โทลูอีน C₇H₈' },
  AMMONIA:  { name: 'Ammonia',           mw: 17.03, density: 0.730, desc: 'แอมโมเนีย NH₃' },
  AMBIENT:  { name: 'Clean Air Baseline',mw: 28.97, density: 1.000, desc: 'อากาศสะอาดพื้นฐาน (0 ppm)' },
};

const LABEL_OPTIONS = [
  'ALCOHOL', 'ETHANOL', 'IPA', 'ACETONE',
  'THINNER', 'AMMONIA', 'AMBIENT', 'OTHER'
];

export default function DataCollection() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [newLabel, setNewLabel] = useState('ALCOHOL');
  const [customLabel, setCustomLabel] = useState('');
  const [note, setNote] = useState('');
  const [boxId, setBoxId] = useState('BOX-001');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [delTarget,  setDelTarget]  = useState(null);

  // Volume & PPM Calculator State
  const [showCalc, setShowCalc] = useState(true);
  const [chamberVol, setChamberVol] = useState('12'); // Liters
  const [amount, setAmount] = useState('2'); // default 2
  const [amountUnit, setAmountUnit] = useState('g'); // 'g', 'ml', 'ul', 'ppm'

  // Label ที่ส่งจริง
  const effectiveLabel = newLabel === 'OTHER'
    ? (customLabel.trim().toUpperCase() || 'OTHER')
    : newLabel;

  // คำนวณความเข้มข้น Theoretical PPM ตามกฎของแก๊สอุดมคติ (Ideal Gas Law at 25°C, 1 atm)
  const calculatedPpm = useMemo(() => {
    if (effectiveLabel === 'AMBIENT') return 0;
    const numAmount = parseFloat(amount);
    const numChamber = parseFloat(chamberVol);
    if (isNaN(numAmount) || numAmount <= 0 || isNaN(numChamber) || numChamber <= 0) return null;

    if (amountUnit === 'ppm') return Math.round(numAmount * 10) / 10;

    const sub = SUBSTANCE_DATA[effectiveLabel] || { mw: 46.07, density: 0.789 };
    let massG = 0;
    if (amountUnit === 'g') {
      massG = numAmount;
    } else if (amountUnit === 'ml') {
      massG = numAmount * sub.density;
    } else if (amountUnit === 'ul') {
      massG = (numAmount / 1000) * sub.density;
    }

    // Moles n = mass / MW
    // V_vapor = n * 24.45 Liters
    // PPM = (V_vapor / V_chamber) * 1,000,000
    const moles = massG / sub.mw;
    const vaporLiters = moles * 24.45;
    const ppm = (vaporLiters / numChamber) * 1_000_000;
    return Math.round(ppm * 10) / 10;
  }, [effectiveLabel, amount, amountUnit, chamberVol]);

  async function fetchSessions() {
    try {
      const res = await fetch(`${API}/api/training/sessions`);
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data);

      // กู้คืน Active Session อัตโนมัติหากยังมี Session ที่ยังไม่จบ (ended_at == null)
      const active = data.find(s => !s.ended_at);
      if (active) {
        setActiveSession({
          session_id: active.id,
          label: active.label,
          box_id: active.box_id,
          note: active.note,
          target_ppm: active.target_ppm,
          liquid_volume: active.liquid_volume,
          volume_unit: active.volume_unit,
          chamber_volume_l: active.chamber_volume_l,
          started_at: active.started_at,
          reading_count: active.reading_count,
        });
      } else {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('fetchSessions error:', err);
    }
  }

  // ดึงข้อมูลครั้งแรกและ Poll ทุก 2.5 วินาที เพื่ออัปเดตจำนวน Reading สดๆ
  useEffect(() => {
    fetchSessions();
    const timer = setInterval(fetchSessions, 2500);
    return () => clearInterval(timer);
  }, []);

  async function startSession() {
    if (!effectiveLabel) {
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อสารก่อนเริ่มบันทึก' });
      return;
    }
    setLoading(true);

    const payload = {
      box_id: boxId,
      label: effectiveLabel,
      note: note.trim() || (calculatedPpm ? `${amount} ${amountUnit} (~${calculatedPpm.toLocaleString()} ppm)` : null),
      target_ppm: calculatedPpm,
      liquid_volume: parseFloat(amount) || null,
      volume_unit: amountUnit,
      chamber_volume_l: parseFloat(chamberVol) || null,
    };

    try {
      const res = await fetch(`${API}/api/training/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setActiveSession({
        session_id: data.session_id,
        label: data.label,
        ...payload,
        reading_count: 0
      });
      setMessage({
        type: 'success',
        text: `Session #${data.session_id} เริ่มบันทึกแล้ว — Label: ${data.label} ${calculatedPpm ? `(${calculatedPpm.toLocaleString()} ppm)` : ''}`
      });
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถสร้าง Session ได้' });
    } finally {
      setLoading(false);
      fetchSessions();
    }
  }

  async function stopSession(targetId) {
    const id = targetId || activeSession?.session_id;
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/training/sessions/${id}/end`, {
        method: 'PATCH'
      });
      const data = await res.json();
      setMessage({
        type: 'info',
        text: `Session #${id} บันทึกเสร็จสมบูรณ์ รวม ${data.total_readings} readings`
      });
      setActiveSession(null);
    } catch {
      setMessage({ type: 'error', text: 'ไม่สามารถหยุด Session ได้' });
    } finally {
      setLoading(false);
      fetchSessions();
    }
  }

  async function downloadCSV(sessionId) {
    try {
      const url = sessionId
        ? `${API}/api/export/csv?session_id=${sessionId}`
        : `${API}/api/export/csv`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const filename = sessionId
        ? `voc_session_${sessionId}_data.csv`
        : 'voc_training_data_all.csv';

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('ไม่สามารถดาวน์โหลดไฟล์ CSV ได้ โปรดตรวจสอบสถานะ Backend');
    }
  }

  async function saveEdit() {
    const label = editTarget.label.trim().toUpperCase();
    if (!label) return;
    try {
      await fetch(`${API}/api/training/sessions/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          note: editTarget.note,
          target_ppm: parseFloat(editTarget.target_ppm) || null,
        }),
      });
      setEditTarget(null);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  }

  async function confirmDelete() {
    try {
      await fetch(`${API}/api/training/sessions/${delTarget}`, { method: 'DELETE' });
      setDelTarget(null);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  }

  function openEdit(s) {
    setEditTarget({
      id: s.id,
      label: s.label,
      note: s.note ?? '',
      target_ppm: s.target_ppm ?? '',
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Data Collection & Calibration</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            เก็บข้อมูลเซนเซอร์พร้อมกำหนดปริมาตรสารและคำนวณค่าความเข้มข้นก๊าซ (ppm) สำหรับเทรน AI
          </p>
        </div>
        <button
          onClick={() => setShowCalc(!showCalc)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
            backgroundColor: showCalc ? '#eff6ff' : '#f1f5f9',
            color: showCalc ? 'var(--primary-color)' : 'var(--text-main)',
            border: `1px solid ${showCalc ? '#bfdbfe' : 'var(--border-color)'}`,
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <Calculator size={15} />
          {showCalc ? 'ซ่อนเครื่องคำนวณ PPM' : 'เปิดเครื่องคำนวณ PPM'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          backgroundColor: message.type === 'success' ? '#d1fae5' : message.type === 'error' ? '#fee2e2' : '#dbeafe',
          color: message.type === 'success' ? '#065f46' : message.type === 'error' ? '#991b1b' : '#1e40af',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : message.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}

      {/* ── Active Session Banner (แสดงตลอดเวลาเมื่อมี Session ทำงานอยู่) ── */}
      {activeSession && (
        <div style={{
          padding: '1.1rem 1.4rem',
          borderRadius: '0.875rem',
          marginBottom: '1.5rem',
          backgroundColor: '#fef3c7',
          border: '2px solid #f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)',
          animation: 'pulse 2.5s infinite',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                backgroundColor: '#ef4444', animation: 'blink 1s infinite'
              }} />
              <span style={{ fontWeight: 700, color: '#92400e', fontSize: '1.05rem' }}>
                กำลังบันทึกข้อมูล... Session #{activeSession.session_id}
              </span>
              <span className="badge" style={{ backgroundColor: '#fed7aa', color: '#9a3412', fontWeight: 700 }}>
                {activeSession.label}
              </span>
              {activeSession.target_ppm != null && (
                <span className="badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                  ~{Number(activeSession.target_ppm).toLocaleString()} ppm
                </span>
              )}
            </div>
            <div style={{ color: '#b45309', fontSize: '0.875rem', marginTop: '0.35rem' }}>
              กล่อง: <strong>{activeSession.box_id || boxId}</strong> | ข้อมูลที่บันทึกแล้ว: <strong style={{ fontSize: '1rem', color: '#78350f' }}>{activeSession.reading_count ?? 0} Readings</strong> | หมายเหตุ: {activeSession.note || '—'}
            </div>
          </div>
          <button
            onClick={() => stopSession(activeSession.session_id)}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.65rem 1.4rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
              transition: 'transform 0.1s',
            }}
          >
            <Square size={16} fill="white" /> หยุดบันทึก (Stop Calibration)
          </button>
        </div>
      )}

      {/* ── PPM & Chamber Volume Calculator ── */}
      {showCalc && !activeSession && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FlaskConical size={18} style={{ color: 'var(--primary-color)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                เครื่องคำนวณปริมาตร & ค่าความเข้มข้นก๊าซ (Theoretical PPM Calculator)
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              สูตร Ideal Gas Law (25°C, 1 atm, Vₘ = 24.45 L/mol)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                สารตัวอย่าง
              </label>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', padding: '0.5rem 0' }}>
                {SUBSTANCE_DATA[effectiveLabel]?.name || effectiveLabel}
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  MW: {SUBSTANCE_DATA[effectiveLabel]?.mw ?? 46.07} g/mol | ρ: {SUBSTANCE_DATA[effectiveLabel]?.density ?? 0.8} g/mL
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                ปริมาตรห้อง Chamber (ลิตร)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={chamberVol}
                onChange={e => setChamberVol(e.target.value)}
                style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
                placeholder="เช่น 12 (กล่อง 30x20x20cm)"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                ปริมาณสารที่ใส่ (Dosage)
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <input
                  type="number"
                  min="0.001"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ width: '65%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontWeight: 600 }}
                  placeholder="เช่น 2 หรือ 20"
                />
                <select
                  value={amountUnit}
                  onChange={e => setAmountUnit(e.target.value)}
                  style={{ width: '35%', padding: '0.55rem 0.4rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', backgroundColor: 'white', fontWeight: 600 }}
                >
                  <option value="g">กรัม (g)</option>
                  <option value="ml">มิลลิลิตร (mL)</option>
                  <option value="ul">ไมโครลิตร (µL)</option>
                  <option value="ppm">ppm ตรง</option>
                </select>
              </div>
            </div>

            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>ความเข้มข้นที่คำนวณได้:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>
                {calculatedPpm != null ? `~ ${calculatedPpm.toLocaleString()} ppm` : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Session Form ── */}
      {!activeSession && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Play size={18} style={{ color: 'var(--primary-color)' }} />
            เริ่มบันทึก Session ใหม่
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 3fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>กล่อง E-Nose</label>
              <input
                value={boxId}
                onChange={e => setBoxId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Label (ชนิดสาร)</label>
              <select
                value={newLabel}
                onChange={e => { setNewLabel(e.target.value); setCustomLabel(''); }}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', backgroundColor: 'white', fontWeight: 600 }}
              >
                {LABEL_OPTIONS.map(l => (
                  <option key={l} value={l}>
                    {l === 'OTHER' ? 'OTHER (พิมพ์ชื่อเอง)' : `${l} (${SUBSTANCE_DATA[l]?.name || l})`}
                  </option>
                ))}
              </select>
              {newLabel === 'OTHER' && (
                <input
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  placeholder="พิมพ์ชื่อสาร เช่น BENZENE..."
                  autoFocus
                  style={{
                    width: '100%', marginTop: '0.5rem',
                    padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
                    border: '1px solid var(--primary-color)',
                    fontFamily: 'inherit', fontWeight: 600, outline: 'none',
                  }}
                />
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>หมายเหตุการทดลอง</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={calculatedPpm ? `เช่น ใส่ ${amount} ${amountUnit} ใน chamber ${chamberVol}L (~${calculatedPpm} ppm)` : 'เช่น ตัวอย่างแอลกอฮอล์ 70%'}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
              />
            </div>
            <button
              onClick={startSession}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.5rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Play size={16} fill="white" /> เริ่มบันทึก (Start)
            </button>
          </div>
        </div>
      )}

      {/* ── Session List Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>ประวัติ Session ทั้งหมด</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ข้อมูลที่มี Label และค่า PPM พร้อมส่งออกเป็น CSV สำหรับเทรนโมเดล AI
          </span>
        </div>
        <button
          onClick={() => downloadCSV(null)}
          style={{
            padding: '0.55rem 1.2rem',
            backgroundColor: 'var(--success-color)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
          }}
        >
          Export CSV ทั้งหมด
        </button>
      </div>

      {/* ── Sessions Table ── */}
      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>กล่อง</th>
              <th>Label</th>
              <th>ความเข้มข้น (PPM)</th>
              <th>หมายเหตุ</th>
              <th>เริ่มเมื่อ</th>
              <th>สิ้นสุด</th>
              <th>Readings</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                  ยังไม่มี Session — กรอกข้อมูลด้านบนแล้วกด "เริ่มบันทึก" เพื่อเริ่มการทดลอง
                </td>
              </tr>
            )}
            {sessions.map(s => {
              const isOngoing = !s.ended_at;
              return (
                <tr key={s.id} style={{ backgroundColor: isOngoing ? '#fffbeb' : 'inherit' }}>
                  <td style={{ fontWeight: 700 }}>#{s.id}</td>
                  <td>{s.box_id}</td>
                  <td>
                    <span className="badge online" style={{ fontWeight: 700 }}>
                      {s.label}
                    </span>
                  </td>
                  <td>
                    {s.target_ppm != null ? (
                      <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 700 }}>
                        {Number(s.target_ppm).toLocaleString()} ppm
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.note || '—'}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(s.started_at).toLocaleString('th-TH')}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {s.ended_at ? (
                      new Date(s.ended_at).toLocaleString('th-TH')
                    ) : (
                      <span style={{ color: '#d97706', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', animation: 'blink 1s infinite' }} />
                        กำลังบันทึก...
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {Number(s.reading_count).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                      {/* ปุ่มหยุดบันทึก มีในแถวทันทีถ้า Session ยังไม่จบ */}
                      {isOngoing && (
                        <button
                          onClick={() => stopSession(s.id)}
                          disabled={loading}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                            padding: '0.3rem 0.75rem', border: 'none', borderRadius: '0.375rem',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                            backgroundColor: '#ef4444', color: 'white',
                            boxShadow: '0 1px 4px rgba(239, 68, 68, 0.35)'
                          }}
                        >
                          <Square size={12} fill="white" /> หยุดบันทึก
                        </button>
                      )}
                      <button
                        onClick={() => downloadCSV(s.id)}
                        style={{ padding: '0.3rem 0.65rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.65rem', border: 'none', borderRadius: '0.375rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#2563eb18', color: '#2563eb' }}
                      >
                        <Pencil size={12} /> แก้ไข
                      </button>
                      <button
                        onClick={() => setDelTarget(s.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.65rem', border: 'none', borderRadius: '0.375rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#ef444418', color: '#ef4444' }}
                      >
                        <Trash2 size={12} /> ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Edit Session Modal ── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditTarget(null)}>
          <div style={{ background: 'white', borderRadius: '0.875rem', padding: '1.75rem', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>แก้ไข Session #{editTarget.id}</h3>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Label (ชนิดสาร)</label>
                <input
                  value={editTarget.label}
                  onChange={e => setEditTarget(t => ({ ...t, label: e.target.value.toUpperCase() }))}
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>ความเข้มข้นเป้าหมาย (PPM)</label>
                <input
                  type="number"
                  value={editTarget.target_ppm}
                  onChange={e => setEditTarget(t => ({ ...t, target_ppm: e.target.value }))}
                  placeholder="เช่น 100 หรือ 88400"
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>หมายเหตุ</label>
                <input
                  value={editTarget.note}
                  onChange={e => setEditTarget(t => ({ ...t, note: e.target.value }))}
                  placeholder="หมายเหตุเพิ่มเติม"
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button onClick={() => setEditTarget(null)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>ยกเลิก</button>
                <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  <Save size={14} /> บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Session Confirm ── */}
      {delTarget !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDelTarget(null)}>
          <div style={{ background: 'white', borderRadius: '0.875rem', padding: '1.75rem', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>ยืนยันการลบ</h3>
              <button onClick={() => setDelTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              ลบ Session <strong style={{ color: '#ef4444' }}>#{delTarget}</strong> ออกจากระบบ?<br />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ข้อมูล readings ใน session นี้จะถูกลบออกจากการเทรน</span>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDelTarget(null)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>ยกเลิก</button>
              <button onClick={confirmDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                <Trash2 size={14} /> ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
      `}</style>
    </div>
  );
}
