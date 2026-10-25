import { useEffect, useState } from 'react';
import { Pencil, Trash2, X, Save, Upload, Cloud, CheckCircle, RefreshCw, Radio } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Shared button styles ────────────────────────────────────
const btnIcon = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  padding: '0.3rem 0.65rem', borderRadius: '0.375rem',
  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', border: 'none',
  backgroundColor: `${color}18`, color,
  transition: 'background-color 0.15s',
});

// ─── Shared modal overlay ─────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '0.875rem', padding: '1.75rem',
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeUp 0.18s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}

export default function Devices() {
  const [devices,    setDevices]    = useState([]);
  const [editTarget, setEditTarget] = useState(null); // {id, firmware, model_ver, status}
  const [delTarget,  setDelTarget]  = useState(null); // box_id string
  const [saving,     setSaving]     = useState(false);

  // ─── Cloud OTA State ───────────────────────────────────────
  const [otaStatus,   setOtaStatus]   = useState(null);
  const [otaFile,     setOtaFile]     = useState(null);
  const [otaVer,      setOtaVer]      = useState('1.0.1');
  const [otaUploading,setOtaUploading]= useState(false);
  const [otaMsg,      setOtaMsg]      = useState(null);

  useEffect(() => { 
    fetchDevices(); 
    fetchOtaStatus();
  }, []);

  async function fetchDevices() {
    try {
      const res = await fetch(`${API}/api/devices`);
      const data = await res.json();
      setDevices(data);
    } catch {}
  }

  async function fetchOtaStatus() {
    try {
      const res = await fetch(`${API}/api/ota/status`);
      if (res.ok) setOtaStatus(await res.json());
    } catch {}
  }

  async function handleOtaUpload(e) {
    e.preventDefault();
    if (!otaFile) return;
    setOtaUploading(true);
    setOtaMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', otaFile);
      const res = await fetch(`${API}/api/ota/upload?version=${encodeURIComponent(otaVer)}`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setOtaMsg({ type: 'success', text: `✅ ปล่อยเฟิร์มแวร์เวอร์ชัน ${otaVer} สำเร็จ! กล่องที่แล็บจะดึงไปแฟลชตัวเองอัตโนมัติ` });
        fetchOtaStatus();
        setOtaFile(null);
      } else {
        setOtaMsg({ type: 'error', text: `❌ ${data.detail || 'อัปโหลดล้มเหลว'}` });
      }
    } catch (err) {
      setOtaMsg({ type: 'error', text: `❌ เชื่อมต่อ Backend ล้มเหลว: ${err.message}` });
    } finally {
      setOtaUploading(false);
    }
  }

  // ─── Save edit ──────────────────────────────────────────────
  async function saveEdit() {
    setSaving(true);
    await fetch(`${API}/api/devices/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firmware:  editTarget.firmware,
        model_ver: editTarget.model_ver,
        status:    editTarget.status,
      }),
    });
    setSaving(false);
    setEditTarget(null);
    fetchDevices();
  }

  // ─── Confirm delete ─────────────────────────────────────────
  async function confirmDelete() {
    await fetch(`${API}/api/devices/${delTarget}`, { method: 'DELETE' });
    setDelTarget(null);
    fetchDevices();
  }

  const inputStyle = {
    width: '100%', padding: '0.55rem 0.7rem',
    borderRadius: '0.4rem', border: '1px solid var(--border-color)',
    fontFamily: 'inherit', fontSize: '0.875rem', marginTop: '0.3rem',
  };

  return (
    <div>
      <h1 className="page-title">Devices Management</h1>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>Box ID</th>
              <th>Status</th>
              <th>Firmware</th>
              <th>Model Version</th>
              <th>Last Seen</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>ไม่มีอุปกรณ์</td></tr>
            )}
            {devices.map(dev => (
              <tr key={dev.id}>
                <td style={{ fontWeight: 600 }}>{dev.id}</td>
                <td><span className={`badge ${dev.status.toLowerCase()}`}>{dev.status}</span></td>
                <td style={{ fontFamily: 'monospace' }}>{dev.firmware}</td>
                <td style={{ fontFamily: 'monospace' }}>{dev.model}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{dev.last_seen}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button
                      style={btnIcon('#2563eb')}
                      onClick={() => setEditTarget({ id: dev.id, firmware: dev.firmware, model_ver: dev.model, status: dev.status })}
                    >
                      <Pencil size={13} /> แก้ไข
                    </button>
                    <button
                      style={btnIcon('#ef4444')}
                      onClick={() => setDelTarget(dev.id)}
                    >
                      <Trash2 size={13} /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cloud Pull OTA Card ──────────────────────────────── */}
      <div style={{
        marginTop: '2rem', padding: '1.5rem', borderRadius: '0.875rem',
        backgroundColor: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Cloud size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Cloud Remote OTA (อัปเดตเฟิร์มแวร์ข้ามเน็ตจากหอพัก)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
                ปล่อยไฟล์เฟิร์มแวร์ <strong>.bin</strong> ขึ้น Cloud — กล่อง ESP32 ที่ห้องแล็บจะดึงไปแฟลชตัวเองและรีสตาร์ทอัตโนมัติ
              </p>
            </div>
          </div>
          {otaStatus && (
            <span style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', backgroundColor: otaStatus.available ? '#dcfce7' : '#f1f5f9', color: otaStatus.available ? '#16a34a' : '#64748b', fontWeight: 600 }}>
              {otaStatus.available ? `ปล่อย OTA ver: ${otaStatus.version}` : 'ยังไม่มีไฟล์ OTA ในคลาวด์'}
            </span>
          )}
        </div>

        {otaMsg && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem',
            backgroundColor: otaMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: otaMsg.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${otaMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.875rem', fontWeight: 500
          }}>
            {otaMsg.text}
          </div>
        )}

        <form onSubmit={handleOtaUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>
              เวอร์ชันใหม่ (Target Version)
            </label>
            <input
              type="text"
              value={otaVer}
              onChange={e => setOtaVer(e.target.value)}
              placeholder="เช่น 1.0.1"
              required
              style={{ ...inputStyle, width: 140 }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', marginBottom: '0.25rem' }}>
              เลือกไฟล์ Firmware (.bin จาก Arduino IDE)
            </label>
            <input
              type="file"
              accept=".bin"
              onChange={e => setOtaFile(e.target.files[0])}
              required
              style={{ ...inputStyle, padding: '0.35rem 0.5rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={otaUploading || !otaFile}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.25rem', borderRadius: '0.5rem',
              backgroundColor: otaFile ? '#0284c7' : '#94a3b8',
              color: 'white', fontWeight: 600, fontSize: '0.875rem',
              border: 'none', cursor: otaFile ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s',
            }}
          >
            <Upload size={16} />
            {otaUploading ? 'กำลังอัปโหลด...' : '🚀 ปล่อย OTA สู่กล่องที่แล็บ'}
          </button>
        </form>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`แก้ไขอุปกรณ์ — ${editTarget.id}`} onClose={() => setEditTarget(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status</label>
              <select
                value={editTarget.status}
                onChange={e => setEditTarget(t => ({ ...t, status: e.target.value }))}
                style={{ ...inputStyle, backgroundColor: 'white' }}
              >
                <option value="ONLINE">ONLINE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Firmware Version</label>
              <input
                value={editTarget.firmware}
                onChange={e => setEditTarget(t => ({ ...t, firmware: e.target.value }))}
                placeholder="เช่น v2.3.1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Model Version</label>
              <input
                value={editTarget.model_ver}
                onChange={e => setEditTarget(t => ({ ...t, model_ver: e.target.value }))}
                placeholder="เช่น rf-v1.2"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setEditTarget(null)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
                ยกเลิก
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────── */}
      {delTarget && (
        <Modal title="ยืนยันการลบ" onClose={() => setDelTarget(null)}>
          <p style={{ color: '#334155', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            คุณต้องการลบอุปกรณ์ <strong style={{ color: '#ef4444' }}>{delTarget}</strong> ออกจากระบบ?<br />
            ข้อมูล sensor readings ที่เก็บไว้จะยังคงอยู่
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setDelTarget(null)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
              ยกเลิก
            </button>
            <button onClick={confirmDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
              <Trash2 size={14} /> ยืนยันลบ
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
