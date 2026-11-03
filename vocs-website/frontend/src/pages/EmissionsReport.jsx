import { useState, useEffect, useCallback } from 'react';
import {
  Factory, AlertTriangle, CheckCircle2, ShieldAlert,
  FileText, Clock, RefreshCw, BarChart2, PlusCircle, Check
} from 'lucide-react';
import { API } from '../config';
import { useAuth } from '../context/AuthContext';

export default function EmissionsReport() {
  const { authHeaders, hasPermission } = useAuth();
  const [stacks, setStacks] = useState([]);
  const [selectedStackId, setSelectedStackId] = useState('STACK-01');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    concentration_mg_m3: 42.5,
    verified_flow_m3_h: 12500,
    operating_hours_annual: 2400,
    lab_cert_id: 'LAB-ISO17025-2026-0982',
    is_accredited_lab: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sRes = await fetch(`${API}/api/emissions/stacks`);
      if (sRes.ok) {
        const sList = await sRes.json();
        setStacks(sList);
      }
      const rRes = await fetch(`${API}/api/reports/yearly-emissions?year=2026&stack_id=${selectedStackId}`);
      if (rRes.ok) {
        const rData = await rRes.json();
        setReport(rData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedStackId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRecordMeasurement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/emissions/stack-measurement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({
          stack_id: selectedStackId,
          pollutant: 'Total VOCs (as Carbon)',
          concentration_mg_m3: parseFloat(formData.concentration_mg_m3),
          verified_flow_m3_h: parseFloat(formData.verified_flow_m3_h),
          operating_hours_annual: parseFloat(formData.operating_hours_annual),
          lab_cert_id: formData.lab_cert_id,
          is_accredited_lab: formData.is_accredited_lab,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        loadData();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกผลการตรวจวัด');
      }
    } catch {
      alert('เครือข่ายขัดข้อง');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLIANT') {
      return { bg: '#dcfce7', text: '#166534', border: '#86efac', icon: <CheckCircle2 size={16} /> };
    }
    if (status === 'EXCEEDANCE') {
      return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', icon: <AlertTriangle size={16} /> };
    }
    return { bg: '#fef3c7', text: '#92400e', border: '#fde68a', icon: <ShieldAlert size={16} /> };
  };

  const badge = getStatusBadge(report?.compliance_status);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: 8, borderRadius: 10 }}>
              <Factory size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0f172a' }}>
                รายงานมวลการปล่อยมลพิษรายปี (Annual Emission Report)
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                DIW & IEAT Statutory Compliance — การคำนวณมวลสารอินทรีย์ระเหยง่าย (VOCs) ที่ปล่อยออกนอกโรงงาน
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1',
              background: 'white', color: '#334155', cursor: 'pointer', fontSize: 13, fontWeight: 600
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {hasPermission('record_measurement', 'engineer') && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
              }}
            >
              <PlusCircle size={15} /> บันทึกผลแล็บปล่องไอเสีย
            </button>
          )}
        </div>
      </div>

      {/* Statutory Caveat Banner (Phase W5 Compliance Requirement) */}
      <div style={{
        background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 12,
        padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12
      }}>
        <ShieldAlert size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
          <b>ข้อกำหนดความปลอดภัยและการรับรองตามกฎหมาย (Phase W5 Rule):</b><br />
          {report?.statutory_caveat || 'ประกาศกรมโรงงานอุตสาหกรรม: ระบบเซนเซอร์ตรวจวัดไอระเหยสารอินทรีย์ภายในโรงงาน (Indoor E-Nose) มีวัตถุประสงค์เพื่อการเฝ้าระวังความปลอดภัยเท่านั้น ห้ามนำมาใช้อ้างอิงแทนการตรวจวัดมวลมลพิษที่ปากปล่องระบายไอเสียจริง (Certified Stack CEMS / US-EPA Reference Methods)'}
        </div>
      </div>

      {/* Stack Selector Pills */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {stacks.map(st => (
          <button
            key={st.stack_id}
            onClick={() => setSelectedStackId(st.stack_id)}
            style={{
              padding: '12px 18px', borderRadius: 12, border: `1.5px solid ${selectedStackId === st.stack_id ? '#2563eb' : '#e2e8f0'}`,
              background: selectedStackId === st.stack_id ? '#eff6ff' : 'white',
              cursor: 'pointer', textAlign: 'left', minWidth: 260, transition: 'all 0.15s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{st.stack_id}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                background: st.is_verified_cems ? '#dcfce7' : '#fee2e2',
                color: st.is_verified_cems ? '#15803d' : '#b91c1c'
              }}>
                {st.is_verified_cems ? 'CEMS Verified' : 'Unverified Flow'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>{st.name}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              อัตราไหล: {Number(st.flow_rate_m3_h).toLocaleString()} m³/h
            </div>
          </button>
        ))}
      </div>

      {/* Main Compliance Evaluation Grid */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 24 }}>
          
          {/* Card: Compliance Status & Formula Breakdown */}
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                ผลการประเมินความสอดคล้องตามกฎหมาย (Statutory Evaluation)
              </h3>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`,
                fontWeight: 800, fontSize: 13
              }}>
                {badge.icon}
                <span>{report.compliance_status}</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              {report.evaluation_summary}
            </p>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                สูตรคำนวณมวลตามประกาศกรมโรงงานอุตสาหกรรม (Mass Emission Law):
              </div>
              <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: '#1e293b' }}>
                Mass (kg/yr) = [ความเข้มข้น (mg/m³) × อัตราไหล (m³/h) × ชม.ทำงาน (h)] ÷ 1,000,000
              </div>
            </div>

            {/* Step-by-step numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#64748b' }}>ความเข้มข้นสาร</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{report.calculation.concentration_mg_m3} <span style={{ fontSize: 10 }}>mg/m³</span></div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#64748b' }}>อัตราไหลไอเสีย</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{Number(report.calculation.flow_rate_m3_h).toLocaleString()} <span style={{ fontSize: 10 }}>m³/h</span></div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#64748b' }}>ชั่วโมงทำงานต่อปี</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{Number(report.calculation.operating_hours).toLocaleString()} <span style={{ fontSize: 10 }}>ชม.</span></div>
              </div>
            </div>

            {/* Quota Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  มวลปล่อยจริง: <b>{report.calculation.calculated_annual_mass_kg} kg/ปี</b>
                </span>
                <span style={{ color: '#64748b' }}>
                  โควตาสูงสุด: <b>{report.calculation.statutory_limit_kg} kg/ปี</b> ({report.calculation.quota_utilization_pct}%)
                </span>
              </div>
              <div style={{ height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, report.calculation.quota_utilization_pct)}%`,
                  background: report.calculation.quota_utilization_pct > 100 ? '#ef4444' : (report.calculation.quota_utilization_pct > 80 ? '#f59e0b' : '#10b981')
                }} />
              </div>
            </div>
          </div>

          {/* Card: Permit & Lab Certification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
                ข้อกำหนดใบอนุญาต (Statutory Permit)
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                {report.permit.permit_no}
              </div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                ผู้ออกใบอนุญาต: {report.permit.authority}
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>สารมลพิษ:</span>
                <span style={{ fontWeight: 700 }}>{report.permit.pollutant}</span>
              </div>
              <div style={{ paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>ความเข้มข้นจำกัด:</span>
                <span style={{ fontWeight: 700 }}>{report.permit.concentration_limit_mg_m3} mg/m³</span>
              </div>
              <div style={{ paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>วันหมดอายุ:</span>
                <span style={{ fontWeight: 700 }}>{report.permit.valid_until}</span>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: '20px', border: '1.5px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>
                ใบรับรองห้องปฏิบัติการ (Accredited Lab Evidence)
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                เลขที่ผลตรวจ: {report.measurement.lab_cert_id}
              </div>
              <div style={{ fontSize: 12, color: report.measurement.is_accredited_lab ? '#16a34a' : '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                {report.measurement.is_accredited_lab ? '✓ ISO/IEC 17025 Accredited Laboratory' : '⚠️ Uncertified / Internal Estimations Only'}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal Add Stack Measurement */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '24px 28px',
            maxWidth: 520, width: '92%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>
              บันทึกผลการตรวจวัดปล่องระบายมลพิษ (Stack Test Result)
            </h3>
            <form onSubmit={handleRecordMeasurement}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>ปล่องที่ตรวจวัด</label>
                <input type="text" value={selectedStackId} disabled style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f1f5f9' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>ความเข้มข้น VOCs (mg/m³)</label>
                  <input
                    type="number" step="0.01" value={formData.concentration_mg_m3}
                    onChange={e => setFormData({ ...formData, concentration_mg_m3: e.target.value })}
                    required style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>อัตราไหลไอเสีย (m³/h)</label>
                  <input
                    type="number" step="10" value={formData.verified_flow_m3_h}
                    onChange={e => setFormData({ ...formData, verified_flow_m3_h: e.target.value })}
                    required style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>ชั่วโมงทำงานต่อปี (ชม.)</label>
                  <input
                    type="number" step="10" value={formData.operating_hours_annual}
                    onChange={e => setFormData({ ...formData, operating_hours_annual: e.target.value })}
                    required style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>เลขที่ใบรับรองห้องแล็บ</label>
                  <input
                    type="text" value={formData.lab_cert_id}
                    onChange={e => setFormData({ ...formData, lab_cert_id: e.target.value })}
                    required style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={formData.is_accredited_lab}
                    onChange={e => setFormData({ ...formData, is_accredited_lab: e.target.checked })}
                    style={{ accentColor: '#10b981' }}
                  />
                  <span>เป็นห้องปฏิบัติการที่ได้รับการรับรอง ISO/IEC 17025 ขึ้นทะเบียนกับกรมโรงงาน</span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>ยกเลิก</button>
                <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', fontWeight: 700, cursor: 'pointer' }}>บันทึกผลการตรวจวัด</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

