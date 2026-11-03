import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldCheck, Wrench, HardHat, FileSearch, CheckCircle2,
  AlertTriangle, KeyRound, Lock, User, Eye, EyeOff, ArrowRight, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_PRESETS = [
  {
    role: 'admin',
    name: 'Admin',
    icon: ShieldCheck,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    badge: 'ผู้ดูแลระบบ',
    desc: 'สิทธิ์เต็ม: จัดการผู้ใช้งาน, ตั้งค่าระบบ, จัดการอุปกรณ์, เผยแพร่ OTA Firmware',
    targetPath: '/',
    defaultPass: 'Admin@Voc2026!'
  },
  {
    role: 'engineer',
    name: 'Engineer',
    icon: Wrench,
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    badge: 'วิศวกรสอบเทียบ / ซ่อมบำรุง',
    desc: 'Dashboard, สอบเทียบเซนเซอร์ Clean-Air, สร้างใบงาน Work Order, ตรวจสอบอุปกรณ์ & บันทึกข้อมูล',
    targetPath: '/',
    defaultPass: 'Engineer@Voc2026!'
  },
  {
    role: 'operator',
    name: 'Operator',
    icon: HardHat,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    badge: 'ผู้ควบคุมหน้างาน',
    desc: 'หน้า Kiosk จอสัมผัส, ตรวจสอบความปลอดภัยสารไอระเหย, รับทราบและบันทึกแก้ Alert',
    targetPath: '/kiosk',
    defaultPass: 'Operator@Voc2026!'
  },
  {
    role: 'viewer',
    name: 'Viewer',
    icon: FileSearch,
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
    badge: 'ผู้ตรวจสอบความปลอดภัย',
    desc: 'ดูรายงานมลพิษ (Emissions Report), ประวัติย้อนหลัง, Airflow Diagram และดาวน์โหลดเอกสาร',
    targetPath: '/emissions',
    defaultPass: 'Viewer@Voc2026!'
  }
];

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@Voc2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [formError, setFormError] = useState('');
  const [coldStartNotice, setColdStartNotice] = useState(false);

  // ตรวจจับหากเซิร์ฟเวอร์ Render ใช้เวลาตื่นนานเกิน 3.5 วินาที
  useEffect(() => {
    let t;
    if (loading) {
      t = setTimeout(() => setColdStartNotice(true), 3500);
    } else {
      setColdStartNotice(false);
    }
    return () => clearTimeout(t);
  }, [loading]);

  const handleSelectRole = (preset) => {
    setSelectedRole(preset.role);
    setUsername(preset.role);
    setPassword(preset.defaultPass);
    setFormError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !password.trim()) {
      setFormError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      // นำทางไปยังหน้าเริ่มต้นเฉพาะของแต่ละบทบาท (Role-based Navigation Routing)
      const currentPreset = ROLE_PRESETS.find(p => p.role === res.user.role);
      const destination = currentPreset ? currentPreset.targetPath : '/';
      navigate(destination);
    } else {
      setFormError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  const activePreset = ROLE_PRESETS.find(p => p.role === selectedRole);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 60%, #020617 100%)',
      padding: '1.5rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative ambient light */}
      <div style={{
        position: 'absolute',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '650px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(124, 58, 237, 0.1) 50%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '490px',
        backgroundColor: '#ffffff',
        borderRadius: '1.25rem',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Brand Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '2rem 2rem 1.75rem',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)'
          }}>
            <Activity size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 750, margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
            VOC / E-Nose Platform
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            ระบบเฝ้าระวังความปลอดภัยสารไอระเหยอุตสาหกรรม
          </p>
        </div>

        {/* Form Container */}
        <div style={{ padding: '1.75rem 2rem' }}>
          {/* Role Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.65rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                เลือกบทบาทเพื่อเข้าใช้งาน
              </span>
              <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>1-Click Fast Login</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {ROLE_PRESETS.map((p) => {
                const IconComp = p.icon;
                const isSelected = selectedRole === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectRole(p)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.65rem 0.25rem',
                      borderRadius: '0.65rem',
                      border: isSelected ? `2px solid ${p.color}` : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? p.bg : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <IconComp size={20} color={p.color} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: isSelected ? 750 : 600,
                      color: isSelected ? p.color : '#334155'
                    }}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Role Capability Preview Banner */}
            {activePreset && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '0.6rem',
                backgroundColor: activePreset.bg,
                border: `1px solid ${activePreset.border}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.55rem',
                fontSize: '0.75rem',
                color: '#1e293b'
              }}>
                <CheckCircle2 size={16} color={activePreset.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: activePreset.color }}>{activePreset.badge}: </strong>
                  <span>{activePreset.desc}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {(formError || error) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.6rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.825rem',
              fontWeight: 500,
              marginBottom: '1rem'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{formError || error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '0.35rem'
              }}>
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex'
                }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอก Username ของคุณ"
                  style={{
                    width: '100%',
                    padding: '0.68rem 0.85rem 0.68rem 2.4rem',
                    borderRadius: '0.6rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.35rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '0.35rem'
              }}>
                รหัสผ่าน (Password)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex'
                }}>
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน"
                  style={{
                    width: '100%',
                    padding: '0.68rem 2.5rem 0.68rem 2.4rem',
                    borderRadius: '0.6rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.825rem',
                borderRadius: '0.65rem',
                background: loading
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 650,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin-animate" />
                  กำลังตรวจสอบสิทธิ์...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Cold start alert if Render is waking from sleep */}
          {coldStartNotice && (
            <div style={{
              marginTop: '0.85rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '0.5rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              color: '#92400e',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Activity size={14} className="spin-animate" style={{ flexShrink: 0 }} />
              <span>กำลังปลุกเซิร์ฟเวอร์ Render (อาจใช้เวลาประมาณ 15-30 วินาทีในครั้งแรกหลังไม่มีการใช้งาน)...</span>
            </div>
          )}

          {/* Footer Notice */}
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            color: '#64748b',
            fontSize: '0.725rem'
          }}>
            <KeyRound size={13} color="#10b981" />
            <span>ระบบแยกการเข้าถึงและสิทธิ์ความปลอดภัยตามบทบาท (RBAC Phase W1)</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-animate { animation: spin 0.9s linear infinite; }
      `}</style>
    </div>
  );
}
