import { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Save } from 'lucide-react';

const API = 'http://localhost:8000';

const LABEL_OPTIONS = [
  'AMBIENT', 'ETHANOL', 'IPA', 'ACETONE',
  'AMMONIA', 'WATER', 'NACL', 'OTHER'
];

export default function DataCollection() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [newLabel, setNewLabel] = useState('AMBIENT');
  const [customLabel, setCustomLabel] = useState('');
  const [note, setNote] = useState('');
  const [boxId, setBoxId] = useState('BOX-001');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // { id, label, note }
  const [delTarget,  setDelTarget]  = useState(null); // session id

  // Label ที่ส่งจริง: ถ้าเลือก OTHER ใช้ customLabel แทน
  const effectiveLabel = newLabel === 'OTHER'
    ? customLabel.trim().toUpperCase()
    : newLabel;

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    const res = await fetch(`${API}/api/training/sessions`);
    const data = await res.json();
    setSessions(data);
  }

  async function startSession() {
    if (!effectiveLabel) {
      setMessage({ type: 'error', text: 'กรุณาระบุชื่อสารก่อนเริ่มบันทึก' });
      return;
    }
    setLoading(true);
    const res = await fetch(`${API}/api/training/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ box_id: boxId, label: effectiveLabel, note })
    });
    const data = await res.json();
    setActiveSession(data);
    setMessage({ type: 'success', text: `Session #${data.session_id} เริ่มแล้ว — Label: ${data.label}` });
    setLoading(false);
    fetchSessions();
  }

  async function stopSession() {
    if (!activeSession) return;
    setLoading(true);
    const res = await fetch(`${API}/api/training/sessions/${activeSession.session_id}/end`, {
      method: 'PATCH'
    });
    const data = await res.json();
    setMessage({ type: 'info', text: `Session หยุดแล้ว รวม ${data.total_readings} readings` });
    setActiveSession(null);
    setLoading(false);
    fetchSessions();
  }

  function downloadCSV(sessionId) {
    const url = sessionId
      ? `${API}/api/export/csv?session_id=${sessionId}`
      : `${API}/api/export/csv`;
    window.open(url, '_blank');
  }

  // แก้ไข session (label + note)
  async function saveEdit() {
    const label = editTarget.label.trim().toUpperCase();
    if (!label) return;
    await fetch(`${API}/api/training/sessions/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, note: editTarget.note }),
    });
    setEditTarget(null);
    fetchSessions();
  }

  // ลบ session
  async function confirmDelete() {
    await fetch(`${API}/api/training/sessions/${delTarget}`, { method: 'DELETE' });
    setDelTarget(null);
    fetchSessions();
  }

  // เปิด edit modal
  function openEdit(s) {
    setEditTarget({ id: s.id, label: s.label, note: s.note ?? '' });
  }

  return (
    <div>
      <h1 className="page-title">Data Collection & Labeling</h1>

      {message && (
        <div className={`alert-banner alert-${message.type}`} style={{
          padding: '0.75rem 1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          backgroundColor: message.type === 'success' ? '#d1fae5' : message.type === 'error' ? '#fee2e2' : '#dbeafe',
          color: message.type === 'success' ? '#065f46' : message.type === 'error' ? '#991b1b' : '#1e40af',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : message.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
        }}>
          {message.text}
          <button onClick={() => setMessage(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
      )}


      {/* Active session banner */}
      {activeSession && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#92400e' }}>
              Recording... Session #{activeSession.session_id}
            </div>
            <div style={{ color: '#b45309', fontSize: '0.875rem' }}>
              Label: <strong>{activeSession.label}</strong> — กล่อง {boxId} กำลังส่งข้อมูลเข้า session นี้
            </div>
          </div>
          <button
            onClick={stopSession}
            disabled={loading}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Stop Calibration
          </button>
        </div>
      )}

      {/* Create session form */}
      {!activeSession && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            เริ่ม Session เก็บข้อมูล Calibration
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 3fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>กล่อง</label>
              <input
                value={boxId}
                onChange={e => setBoxId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Label (ชนิดสาร)</label>
              <select
                value={newLabel}
                onChange={e => { setNewLabel(e.target.value); setCustomLabel(''); }}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', backgroundColor: 'white' }}
              >
                {LABEL_OPTIONS.map(l => <option key={l} value={l}>{l === 'OTHER' ? 'OTHER (กรอกชื่อเอง)' : l}</option>)}
              </select>
              {newLabel === 'OTHER' && (
                <input
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                  placeholder="เช่น XYLENE, FORMALDEHYDE..."
                  autoFocus
                  style={{
                    width: '100%', marginTop: '0.5rem',
                    padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
                    border: `1px solid ${customLabel.trim() ? 'var(--success-color)' : 'var(--warning-color)'}`,
                    fontFamily: 'inherit', fontWeight: 600,
                    outline: 'none',
                  }}
                />
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>หมายเหตุ (ไม่บังคับ)</label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="เช่น ทดสอบทินเนอร์ขวดที่ 1"
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
              />
            </div>
            <button
              onClick={startSession}
              disabled={loading}
              style={{
                padding: '0.6rem 1.5rem',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Start Calibration
            </button>
          </div>
        </div>
      )}

      {/* Export all */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Session ทั้งหมด</h2>
        <button
          onClick={() => downloadCSV(null)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--success-color)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Export CSV ทั้งหมด
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>กล่อง</th>
              <th>Label</th>
              <th>หมายเหตุ</th>
              <th>เริ่มเมื่อ</th>
              <th>สิ้นสุด</th>
              <th>Readings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  ยังไม่มี Session — กด Start Calibration ด้านบนเพื่อเริ่มเก็บข้อมูล
                </td>
              </tr>
            )}
            {sessions.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500 }}>#{s.id}</td>
                <td>{s.box_id}</td>
                <td><span className="badge online">{s.label}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{s.note || '—'}</td>
                <td style={{ fontSize: '0.85rem' }}>{new Date(s.started_at).toLocaleString('th-TH')}</td>
                <td style={{ fontSize: '0.85rem' }}>{s.ended_at ? new Date(s.ended_at).toLocaleString('th-TH') : <span style={{ color: 'var(--warning-color)' }}>กำลังบันทึก...</span>}</td>
                <td style={{ fontWeight: 600 }}>{Number(s.reading_count)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      onClick={() => downloadCSV(s.id)}
                      style={{ padding: '0.25rem 0.65rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', border: 'none', borderRadius: '0.375rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#2563eb18', color: '#2563eb' }}
                    >
                      <Pencil size={12} /> แก้ไข
                    </button>
                    <button
                      onClick={() => setDelTarget(s.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', border: 'none', borderRadius: '0.375rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', backgroundColor: '#ef444418', color: '#ef4444' }}
                    >
                      <Trash2 size={12} /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '2rem', backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>ขั้นตอนการเก็บข้อมูลเทรน</h3>
        <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: '2' }}>
          <li>เลือก Label ชนิดสาร เช่น <strong>THINNER</strong></li>
          <li>กด <strong>เริ่มบันทึก</strong> — ระบบจะสร้าง Session และให้ Session ID</li>
          <li>ใส่สารนั้นใกล้กล่องเซนเซอร์ แล้วให้ ESP32-S3 ส่งข้อมูลพร้อม <code>session_id</code> นี้ไปที่ <code>POST /api/ingest</code></li>
          <li>กด <strong>หยุดบันทึก</strong> เมื่อเก็บข้อมูลครบ</li>
          <li>ทำซ้ำกับสารชนิดอื่น อย่างน้อย 5 ชนิด ชนิดละ 200+ readings</li>
          <li>กด <strong>Export CSV ทั้งหมด</strong> นำไปใช้ใน Jupyter Notebook เพื่อเทรนโมเดล</li>
        </ol>
      </div>

      {/* ── Edit Session Modal ──────────────────────────────── */}
      {editTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditTarget(null)}>
          <div style={{ background: 'white', borderRadius: '0.875rem', padding: '1.75rem', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'fadeUp 0.18s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>แก้ไข Session #{editTarget.id}</h3>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Label (ชนิดสาร)</label>
                <select
                  value={LABEL_OPTIONS.includes(editTarget.label) ? editTarget.label : 'OTHER'}
                  onChange={e => setEditTarget(t => ({ ...t, label: e.target.value === 'OTHER' ? '' : e.target.value }))}
                  style={{ width: '100%', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid var(--border-color)', fontFamily: 'inherit', backgroundColor: 'white' }}
                >
                  {LABEL_OPTIONS.map(l => <option key={l} value={l}>{l === 'OTHER' ? 'OTHER (กรอกชื่อเอง)' : l}</option>)}
                </select>
                {(!LABEL_OPTIONS.slice(0,-1).includes(editTarget.label)) && (
                  <input
                    value={editTarget.label}
                    onChange={e => setEditTarget(t => ({ ...t, label: e.target.value.toUpperCase() }))}
                    placeholder="พิมพ์ชื่อสารที่ต้องการ..."
                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.55rem 0.7rem', borderRadius: '0.4rem', border: '1px solid #f59e0b', fontFamily: 'inherit', fontWeight: 700, outline: 'none' }}
                  />
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>หมายเหตุ</label>
                <input
                  value={editTarget.note}
                  onChange={e => setEditTarget(t => ({ ...t, note: e.target.value }))}
                  placeholder="หมายเหตุ (ไม่บังคับ)"
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
          <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }`}</style>
        </div>
      )}

      {/* ── Delete Session Confirm ──────────────────────────── */}
      {delTarget !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setDelTarget(null)}>
          <div style={{ background: 'white', borderRadius: '0.875rem', padding: '1.75rem', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'fadeUp 0.18s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>ยืนยันการลบ</h3>
              <button onClick={() => setDelTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              ลบ Session <strong style={{ color: '#ef4444' }}>#{delTarget}</strong> ออกจากระบบ?<br />
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>ข้อมูล readings ที่บันทึกไว้ใน session นี้จะถูกลบด้วย</span>
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
    </div>
  );
}
