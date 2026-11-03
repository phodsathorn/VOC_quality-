import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Lock, User, Eye, EyeOff, ArrowRight, Loader2, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [coldStartNotice, setColdStartNotice] = useState(false);

  // ตรวจจับ Render cold-start (ฟรีเซิร์ฟเวอร์ปลุกตัวนาน)
  useEffect(() => {
    let t;
    if (loading) {
      t = setTimeout(() => setColdStartNotice(true), 3500);
    } else {
      setColdStartNotice(false);
    }
    return () => clearTimeout(t);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !password.trim()) {
      setFormError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    const res = await login(username.trim(), password.trim());
    if (res.success) {
      const role = res.user?.role || 'operator';
      const landing = { admin: '/', engineer: '/', operator: '/kiosk', viewer: '/emissions' };
      navigate(landing[role] || '/');
    } else {
      setFormError(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <Activity size={28} color="#fff" />
          </div>
          <h1>VOC / E-Nose Platform</h1>
          <p>ระบบเฝ้าระวังความปลอดภัยสารไอระเหยอุตสาหกรรม</p>
        </div>

        {/* Form */}
        <div className="login-body">
          {(formError || error) && (
            <div className="login-error">
              <AlertTriangle size={16} />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-user">ชื่อผู้ใช้งาน</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  id="login-user"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="กรอก Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-pass">รหัสผ่าน</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  กำลังตรวจสอบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {coldStartNotice && (
            <div className="cold-start-notice">
              <Activity size={14} className="spin" />
              <span>กำลังปลุกเซิร์ฟเวอร์ — อาจใช้เวลาประมาณ 15-30 วินาที...</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at 50% 0%, #1e293b 0%, #0f172a 50%, #020617 100%);
          padding: 1.25rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 1.15rem;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.45);
          overflow: hidden;
          animation: cardIn 0.35s cubic-bezier(0.16,1,0.3,1);
        }

        .login-header {
          background: linear-gradient(135deg, #0f172a, #1e293b);
          padding: 2.25rem 2rem 1.75rem;
          text-align: center;
          color: #fff;
        }

        .login-logo {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: 0 8px 20px rgba(37,99,235,0.4);
        }

        .login-header h1 {
          font-size: 1.35rem;
          font-weight: 750;
          margin: 0 0 0.35rem;
          letter-spacing: -0.02em;
        }

        .login-header p {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0;
        }

        .login-body {
          padding: 1.75rem 2rem 2rem;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 0.9rem;
          border-radius: 0.55rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 0.8rem;
          font-weight: 500;
          margin-bottom: 1.1rem;
        }

        .form-group {
          margin-bottom: 1.1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.35rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.85rem;
          color: #94a3b8;
          pointer-events: none;
          flex-shrink: 0;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.7rem 2.5rem 0.7rem 2.5rem;
          border-radius: 0.6rem;
          border: 1.5px solid #e2e8f0;
          font-size: 0.875rem;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .input-wrapper input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
        }

        .toggle-password {
          position: absolute;
          right: 0.75rem;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0.2rem;
          border-radius: 0.25rem;
          transition: color 0.15s;
        }

        .toggle-password:hover {
          color: #475569;
        }

        .login-submit {
          width: 100%;
          margin-top: 0.4rem;
          padding: 0.8rem;
          border-radius: 0.6rem;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          color: #fff;
          border: none;
          font-size: 0.925rem;
          font-weight: 650;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(15,23,42,0.25);
          transition: opacity 0.15s, transform 0.1s;
        }

        .login-submit:hover:not(:disabled) {
          opacity: 0.92;
        }

        .login-submit:active:not(:disabled) {
          transform: scale(0.985);
        }

        .login-submit:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        .cold-start-notice {
          margin-top: 0.9rem;
          padding: 0.6rem 0.8rem;
          border-radius: 0.5rem;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .spin {
          animation: spin360 0.9s linear infinite;
        }

        @keyframes spin360 {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
