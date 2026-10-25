import { useEffect, useState, useCallback } from 'react';
import {
  Pencil, Trash2, X, Save, Upload, Cloud, CheckCircle, RefreshCw,
  AlertTriangle, ShieldAlert, RotateCcw, Clock, ArrowDownCircle,
  FileCode, CheckCircle2, XCircle, Activity, History, Server, Eye
} from 'lucide-react';

import { API } from '../config';

// ─── Shared button styles ────────────────────────────────────
const btnIcon = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  padding: '0.35rem 0.7rem', borderRadius: '0.4rem',
  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: 'none',
  backgroundColor: `${color}18`, color,
  transition: 'all 0.15s ease',
});

// ─── Shared modal overlay ─────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#ffffff', borderRadius: '1rem', padding: '1.75rem',
        width: 460, maxWidth: '92vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: '1px solid #e2e8f0',
        animation: 'fadeUp 0.18s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }`}</style>
    </div>
  );
}

export default function Devices() {
  const [devices,     setDevices]     = useState([]);
  const [editTarget,  setEditTarget]  = useState(null); // {id, firmware, model_ver, status}
  const [delTarget,   setDelTarget]   = useState(null); // box_id string
  const [saving,      setSaving]      = useState(false);

  // ─── Cloud OTA & Rollback State ────────────────────────────
  const [otaStatus,    setOtaStatus]    = useState(null);
  const [otaHistory,   setOtaHistory]   = useState([]);
  const [otaFile,      setOtaFile]      = useState(null);
  const [otaVer,       setOtaVer]       = useState('1.0.3');
  const [otaNotes,     setOtaNotes]     = useState('');
  const [otaUploading, setOtaUploading] = useState(false);
  const [otaMsg,       setOtaMsg]       = useState(null);
  const [rollbackModal,setRollbackModal]= useState(null); // version string to rollback
  const [rollingBack,  setRollingBack]  = useState(false);

  // ─── System Audit Logs State ───────────────────────────────
  const [logs,         setLogs]         = useState([]);
  const [logFilter,    setLogFilter]    = useState(() => localStorage.getItem('voc_log_filter') || 'ALL');
  const [logsLoading,  setLogsLoading]  = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // ─── Fetch All Data & Auto Sync ────────────────────────────
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/devices`);
      if (res.ok) setDevices(await res.json());
    } catch {}
  }, []);

  const fetchOtaStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ota/status`);
      if (res.ok) setOtaStatus(await res.json());
    } catch {}
  }, []);

  const fetchOtaHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/ota/history`);
      if (res.ok) setOtaHistory(await res.json());
    } catch {}
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/logs?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
        setLastSyncTime(new Date());
      }
    } catch {}
  }, []);

  const refreshAll = useCallback(async () => {
    setLogsLoading(true);
    await Promise.all([fetchDevices(), fetchOtaStatus(), fetchOtaHistory(), fetchLogs()]);
    setLogsLoading(false);
  }, [fetchDevices, fetchOtaStatus, fetchOtaHistory, fetchLogs]);

  useEffect(() => {
    refreshAll();
    // Auto-sync every 4 seconds to guarantee live status across instances
    const interval = setInterval(refreshAll, 4000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // Save filter choice in localStorage so refresh never loses selection
  const handleFilterChange = (f) => {
    setLogFilter(f);
    localStorage.setItem('voc_log_filter', f);
  };

  // ─── OTA Upload Handler ────────────────────────────────────
  async function handleOtaUpload(e) {
    e.preventDefault();
    if (!otaFile) return;
    setOtaUploading(true);
    setOtaMsg(null);
    try {
      const fd = new FormData();
      fd.append('file', otaFile);
      const url = `${API}/api/ota/upload?version=${encodeURIComponent(otaVer)}${otaNotes ? `&notes=${encodeURIComponent(otaNotes)}` : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setOtaMsg({
          type: 'success',
          text: `✅ ปล่อยเฟิร์มแวร์เวอร์ชัน ${otaVer} สำเร็จเรียบร้อย! กล่อง ESP32 จะดึงไปแฟลชตัวเองและรีสตาร์ตอัตโนมัติ`
        });
        setOtaFile(null);
        setOtaNotes('');
        refreshAll();
      } else {
        setOtaMsg({ type: 'error', text: `❌ ${data.detail || 'อัปโหลดล้มเหลว'}` });
      }
    } catch (err) {
      setOtaMsg({ type: 'error', text: `❌ เชื่อมต่อ Backend ล้มเหลว: ${err.message}` });
    } finally {
      setOtaUploading(false);
    }
  }

  // ─── Rollback Handler ──────────────────────────────────────
  async function handleRollback(version) {
    setRollingBack(true);
    try {
      const res = await fetch(`${API}/api/ota/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtaMsg({
          type: 'success',
          text: `⏪ สั่งถอยกลับ (Rollback) สู่เวอร์ชัน ${version} สำเร็จ! กล่องจะย้อนกลับไปใช้เวอร์ชันนี้ทันที`
        });
        setRollbackModal(null);
        refreshAll();
      } else {
        setOtaMsg({ type: 'error', text: `❌ Rollback ล้มเหลว: ${data.detail}` });
      }
    } catch (err) {
      setOtaMsg({ type: 'error', text: `❌ เกิดข้อผิดพลาดในการ Rollback: ${err.message}` });
    } finally {
      setRollingBack(false);
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

  // Check for any Safety OTA failure on any device
  const failedDevice = devices.find(d => d.last_ota_status === 'FAILED');

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'ALL') return true;
    if (logFilter === 'OTA') return l.category === 'OTA';
    if (logFilter === 'ALERT') return l.category === 'ALERT' || l.category === 'AI_ALERT';
    if (logFilter === 'SETTINGS') return l.category === 'SETTINGS' || l.category === 'THRESHOLD';
    if (logFilter === 'MAINTENANCE') return l.category === 'MAINTENANCE';
    return true;
  });

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.8rem',
    borderRadius: '0.5rem', border: '1px solid #cbd5e1',
    fontFamily: 'inherit', fontSize: '0.875rem', marginTop: '0.3rem',
    outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ── Page Header & Live Sync Status ─────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Device Management & Safety Hub</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            จัดการอุปกรณ์, อัปเดตเฟิร์มแวร์ผ่านเว็บ (OTA), ระบบตรวจจับข้อผิดพลาด และ Rollback ใน 1-Click
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.75rem', borderRadius: '9999px',
            backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0',
            fontSize: '0.75rem', color: '#64748b', fontWeight: 500,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            Auto Sync (3s) • {lastSyncTime.toLocaleTimeString('th-TH')}
          </div>
          <button
            onClick={refreshAll}
            disabled={logsLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.85rem', borderRadius: '0.5rem',
              backgroundColor: '#ffffff', border: '1px solid #cbd5e1',
              color: '#334155', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={14} style={{ animation: logsLoading ? 'spin 1s linear infinite' : 'none' }} />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* ── SAFETY DIAGNOSTIC ALERT BANNER ──────────────────── */}
      {failedDevice && (
        <div style={{
          marginBottom: '1.75rem', padding: '1.25rem 1.5rem', borderRadius: '0.875rem',
          backgroundColor: '#fef2f2', border: '2px solid #ef4444',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.2)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '1rem', flexWrap: 'wrap',
          animation: 'pulseBorder 2s infinite',
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.6rem', borderRadius: '0.6rem', backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', margin: '0 0 0.25rem 0' }}>
                ⚠️ ตรวจพบข้อผิดพลาดในการอัปเดตเฟิร์มแวร์ (Firmware Safety Alert)
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>
                อุปกรณ์ <strong>{failedDevice.id}</strong> รายงานปัญหาขณะแฟลชโค้ด:
              </p>
              <div style={{
                backgroundColor: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '0.5rem',
                border: '1px solid #fecaca', fontFamily: 'monospace', fontSize: '0.85rem', color: '#b91c1c'
              }}>
                {failedDevice.last_ota_error || 'HTTP_UPDATE_FAILED (-1): การเชื่อมต่อล้มเหลว หรือ Checksum ไม่ตรง'}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#991b1b', marginTop: '0.5rem', margin: 0 }}>
                💡 คำแนะนำ: กดปุ่มด้านขวาเพื่อ <strong>Rollback ถอยกลับสู่เวอร์ชันเสถียรก่อนหน้า</strong> ทันที เพื่อให้อุปกรณ์กลับมาทำงานได้ตามปกติ
              </p>
            </div>
          </div>

          <div style={{ alignSelf: 'center' }}>
            <button
              onClick={() => {
                const prev = otaHistory.find(h => h.status === 'ARCHIVED');
                if (prev) setRollbackModal(prev.version);
                else setRollbackModal('1.0.2');
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.25rem', borderRadius: '0.6rem',
                backgroundColor: '#dc2626', color: '#ffffff',
                border: 'none', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
              }}
            >
              <RotateCcw size={16} /> ⏪ ถอยกลับเวอร์ชันก่อนหน้าทันที (1-Click Rollback)
            </button>
          </div>
        </div>
      )}

      {/* ── Main Devices Inventory Table ───────────────────── */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>กล่องตรวจวัดในระบบ (Registered Devices)</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            ทั้งหมด <strong>{devices.length}</strong> กล่อง
          </span>
        </div>

        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' }}>
                <th style={{ padding: '0.65rem 0.75rem' }}>Box ID</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Status</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Firmware</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Model Version</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>OTA Safety Status</th>
                <th style={{ padding: '0.65rem 0.75rem' }}>Last Seen</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>ไม่มีอุปกรณ์</td></tr>
              )}
              {devices.map(dev => (
                <tr key={dev.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{dev.id}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className={`badge ${dev.status.toLowerCase()}`}>{dev.status}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 600, color: '#2563eb' }}>
                    v{dev.firmware || '1.0.2'}
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>{dev.model || 'rf-v1.2'}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {dev.last_ota_status === 'FAILED' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: 999, backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700 }}>
                        <XCircle size={12} /> อัปเดตล้มเหลว
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: 999, backgroundColor: '#dcfce7', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                        <CheckCircle2 size={12} /> ปลอดภัย (Normal)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.85rem' }}>{dev.last_seen}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
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
      </div>

      {/* ── Web OTA Direct Upload & Releases Hub ────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Card 1: Web OTA Binary Uploader */}
        <div style={{
          padding: '1.5rem', borderRadius: '0.875rem',
          backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <Cloud size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>อัปโหลดเฟิร์มแวร์ใหม่ (Web OTA Upload)</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  ปล่อยไฟล์ <strong>.bin</strong> ขึ้นระบบ — กล่องที่แล็บจะดึงไปแฟลชเอง
                </p>
              </div>
            </div>
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

          <form onSubmit={handleOtaUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                เวอร์ชันใหม่ (Target Version Tag)
              </label>
              <input
                type="text"
                value={otaVer}
                onChange={e => setOtaVer(e.target.value)}
                placeholder="เช่น 1.0.3"
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                บันทึกการเปลี่ยนแปลง (Release Notes)
              </label>
              <input
                type="text"
                value={otaNotes}
                onChange={e => setOtaNotes(e.target.value)}
                placeholder="เช่น แก้ไข I2C filter, เพิ่ม MQ-2 channel"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                เลือกไฟล์ Firmware (.bin จาก Arduino IDE)
              </label>
              <input
                type="file"
                accept=".bin"
                onChange={e => setOtaFile(e.target.files[0])}
                required
                style={{ ...inputStyle, padding: '0.4rem 0.5rem', cursor: 'pointer' }}
              />
              {otaFile && (
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  📦 ขนาดไฟล์: {(otaFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={otaUploading || !otaFile}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.7rem 1.25rem', borderRadius: '0.5rem',
                backgroundColor: otaFile ? '#0284c7' : '#94a3b8',
                color: 'white', fontWeight: 600, fontSize: '0.875rem',
                border: 'none', cursor: otaFile ? 'pointer' : 'not-allowed',
                marginTop: '0.5rem',
                transition: 'background-color 0.15s',
              }}
            >
              <Upload size={16} />
              {otaUploading ? 'กำลังอัปโหลด...' : '🚀 ปล่อย OTA สู่กล่องที่แล็บ'}
            </button>
          </form>
        </div>

        {/* Card 2: Version Control & 1-Click Rollback */}
        <div style={{
          padding: '1.5rem', borderRadius: '0.875rem',
          backgroundColor: '#ffffff', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#fef3c7', color: '#d97706' }}>
                <History size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>ประวัติเวอร์ชัน & ถอยกลับ (1-Click Rollback)</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  เลือกถอยกลับสู่เวอร์ชันเสถียรที่เคยปล่อยไว้ได้ทันที
                </p>
              </div>
            </div>
          </div>

          <div style={{ maxHeight: 270, overflowY: 'auto' }}>
            {otaHistory.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.875rem' }}>
                ยังไม่มีประวัติการปล่อยเฟิร์มแวร์
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {otaHistory.map((item) => (
                  <div
                    key={item.id || item.version}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem', borderRadius: '0.5rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: item.status === 'ACTIVE' ? '#f0fdf4' : '#fafafa',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>v{item.version}</span>
                        {item.status === 'ACTIVE' ? (
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 999, backgroundColor: '#bbf7d0', color: '#166534', fontWeight: 700 }}>
                            ACTIVE (ปัจจุบัน)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: 999, backgroundColor: '#e2e8f0', color: '#64748b', fontWeight: 600 }}>
                            ARCHIVED
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {item.released_at || 'บันทึกในระบบ'} • {(item.size_bytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    <div>
                      {item.status === 'ACTIVE' ? (
                        <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>● ใช้งานอยู่</span>
                      ) : (
                        <button
                          onClick={() => setRollbackModal(item.version)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.65rem', borderRadius: '0.375rem',
                            backgroundColor: '#fffbeb', color: '#b45309',
                            border: '1px solid #fde68a', fontWeight: 600, fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={12} /> Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Persistent System Audit & Activity Logs Stream ── */}
      <div className="card" style={{ padding: '1.5rem', borderRadius: '0.875rem', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#059669" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>บันทึกประวัติการทำงานของระบบ (System & Audit Logs)</h3>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'OTA', label: 'OTA & เฟิร์มแวร์' },
              { id: 'ALERT', label: 'การแจ้งเตือน' },
              { id: 'SETTINGS', label: 'ตั้งค่า & เกณฑ์' },
              { id: 'MAINTENANCE', label: 'การบำรุงรักษา' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id)}
                style={{
                  padding: '0.3rem 0.65rem', borderRadius: '9999px',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: logFilter === f.id ? '#059669' : '#e2e8f0',
                  backgroundColor: logFilter === f.id ? '#ecfdf5' : '#ffffff',
                  color: logFilter === f.id ? '#065f46' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.78rem' }}>
                <th style={{ padding: '0.5rem 0.75rem', width: 170 }}>เวลา</th>
                <th style={{ padding: '0.5rem 0.75rem', width: 110 }}>หมวดหมู่</th>
                <th style={{ padding: '0.5rem 0.75rem', width: 120 }}>การกระทำ</th>
                <th style={{ padding: '0.5rem 0.75rem', width: 100 }}>สถานะ</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    ไม่มีรายการบันทึกในหมวดนี้
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  let statusBg = '#f1f5f9';
                  let statusColor = '#475569';
                  if (log.status === 'SUCCESS') { statusBg = '#dcfce7'; statusColor = '#166534'; }
                  else if (log.status === 'WARNING') { statusBg = '#fef3c7'; statusColor = '#92400e'; }
                  else if (log.status === 'ERROR') { statusBg = '#fee2e2'; statusColor = '#991b1b'; }

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f8fafc', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {log.timestamp}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: '0.25rem', backgroundColor: '#f1f5f9', color: '#334155' }}>
                          {log.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#1e293b' }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.25rem', backgroundColor: statusBg, color: statusColor }}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#334155' }}>
                        {log.detail}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`แก้ไขอุปกรณ์ — ${editTarget.id}`} onClose={() => setEditTarget(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Status</label>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Firmware Version</label>
              <input
                value={editTarget.firmware}
                onChange={e => setEditTarget(t => ({ ...t, firmware: e.target.value }))}
                placeholder="เช่น v1.0.2"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Model Version</label>
              <input
                value={editTarget.model_ver}
                onChange={e => setEditTarget(t => ({ ...t, model_ver: e.target.value }))}
                placeholder="เช่น rf-v1.2"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setEditTarget(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
                ยกเลิก
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Rollback Confirm Modal ──────────────────────────── */}
      {rollbackModal && (
        <Modal title={`ยืนยันการถอยกลับเวอร์ชัน (Rollback)`} onClose={() => setRollbackModal(null)}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: '#334155', lineHeight: 1.6, marginBottom: '1rem', fontSize: '0.9rem' }}>
              คุณต้องการสั่งให้อุปกรณ์ถอยกลับ (Rollback) สู่เวอร์ชัน <strong>v{rollbackModal}</strong> หรือไม่?<br />
              ระบบจะสลับไฟล์เฟิร์มแวร์ที่ให้บริการ และกล่องที่แล็บจะดึงไปแฟลชตัวเองกลับสู่เวอร์ชันเดิมโดยอัตโนมัติ
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setRollbackModal(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
                ยกเลิก
              </button>
              <button
                onClick={() => handleRollback(rollbackModal)}
                disabled={rollingBack}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1.25rem', border: 'none', borderRadius: '0.5rem',
                  backgroundColor: '#d97706', color: 'white', cursor: 'pointer', fontWeight: 700
                }}
              >
                <RotateCcw size={14} /> {rollingBack ? 'กำลัง Rollback...' : 'ยืนยัน Rollback'}
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
            <button onClick={() => setDelTarget(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '0.5rem', background: 'white', cursor: 'pointer', fontWeight: 500 }}>
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
