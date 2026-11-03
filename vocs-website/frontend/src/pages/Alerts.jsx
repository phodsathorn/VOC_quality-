import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, CheckCircle, RefreshCw, Bell, ShieldAlert, Info, Volume2, VolumeX,
  Clock, ArrowRight, X, User, Check, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { isSoundEnabled, toggleSoundEnabled, triggerAlertSound } from '../utils/soundAlert';
import { useAuth } from '../context/AuthContext';
import { Card, StatCard, Button, Drawer } from '../components/ui';
import { API } from '../config';

const REFRESH_INTERVAL_MS = 10000;

export default function Alerts() {
  const { user, authHeaders } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filter, setFilter] = useState('All');
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [errorMsg, setErrorMsg] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Selected Incident for Stitch Sub-state Side Drawer
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    const handleToggle = (e) => setSoundOn(e.detail.enabled);
    window.addEventListener('voc_sound_toggle', handleToggle);
    return () => window.removeEventListener('voc_sound_toggle', handleToggle);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, summaryRes] = await Promise.all([
        fetch(`${API}/api/alerts?limit=100`).then((r) => r.json()),
        fetch(`${API}/api/alerts/summary`).then((r) => r.json()),
      ]);
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      setSummary(summaryRes || {});
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    const t = setInterval(fetchAlerts, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchAlerts]);

  async function handleWorkflow(id, step) {
    if (user && user.role === 'viewer') {
      setErrorMsg('🔒 สิทธิ์ไม่เพียงพอ: บทบาท Viewer ดูข้อมูลได้อย่างเดียว');
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }
    try {
      const res = await fetch(`${API}/api/alerts/${id}/${step}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ note: `Updated by ${user?.username || 'operator'}` }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed');
      }
      setActionSuccess(`ดำเนินการ ${step.toUpperCase()} เรียบร้อยแล้ว`);
      setTimeout(() => setActionSuccess(null), 4000);
      if (selectedIncident?.id === id) {
        setSelectedIncident(null);
      }
      fetchAlerts();
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  }

  const filtered = filter === 'All' ? alerts : alerts.filter((a) => a.status === filter);
  const activeCount = alerts.filter((a) => a.status === 'Active').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'Acknowledged' || a.status === 'In progress').length;
  const resolvedCount = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[#131b2e] tracking-tight flex items-center gap-2">
            <Bell size={26} className="text-[#004ac6]" />
            ศูนย์จัดการเหตุการณ์และการแจ้งเตือน (Alerts & Incident Response)
          </h1>
          <p className="text-[13px] text-[#64748b] mt-0.5">
            บันทึกการแจ้งเตือนสภาวะฉุกเฉิน การตอบสนองตามกรอบเวลา SLA และประวัติการแก้ไขเหตุการณ์
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden md:flex items-center gap-1.5 text-[12px] text-[#64748b]">
              <Clock size={14} />
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
          <Button
            onClick={fetchAlerts}
            loading={loading}
            iconLeft={<RefreshCw size={14} />}
            size="sm"
          >
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Action Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#ffdad6]/40 border border-[#ffdad6] text-[#ba1a1a] text-[13px] flex items-center gap-2 animate-fadeIn">
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] text-[13px] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Active Emergencies"
          value={activeCount}
          valueColor={activeCount > 0 ? '#ba1a1a' : '#059669'}
          badge={
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${activeCount > 0 ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#ecfdf5] text-[#059669]'}`}>
              {activeCount > 0 ? 'Immediate Action' : 'Safe Normal'}
            </span>
          }
          subtext="เหตุการณ์ที่รอดำเนินการ (SLA: Critical 5 นาที)"
        />

        <StatCard
          title="In Progress (Ack)"
          value={acknowledgedCount}
          valueColor="#2563eb"
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#004ac6]">
              Investigating
            </span>
          }
          subtext="ช่างหน้างานรับทราบและกำลังเข้าตรวจสอบ"
        />

        <StatCard
          title="Resolved Today"
          value={resolvedCount}
          valueColor="#059669"
          badge={
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ecfdf5] text-[#059669]">
              Closed
            </span>
          }
          subtext="เหตุการณ์ที่ควบคุมและปิดงานสำเร็จ"
        />
      </section>

      {/* Incidents Table Card */}
      <Card
        title="ตารางรายการเหตุการณ์ (Incident Audit Log)"
        subtitle="คลิกที่แถวรายการเพื่อเปิดดูรายละเอียดผู้รับผิดชอบและบันทึกการแก้ไข (SLA Detail Drawer)"
        action={
          <div className="flex gap-1 bg-[#f8fafc] p-0.5 rounded-xl border border-[#e2e8f0]">
            {['All', 'Active', 'Acknowledged', 'Resolved'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition-all ${
                  filter === st
                    ? 'bg-white text-[#004ac6] shadow-xs'
                    : 'text-[#64748b] hover:text-[#131b2e]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">เวลา (Time)</th>
                <th className="py-3 px-4">ระดับ (Level)</th>
                <th className="py-3 px-4">เหตุการณ์ (Condition)</th>
                <th className="py-3 px-4">สถานะ (Status)</th>
                <th className="py-3 px-4 text-right">คำสั่ง (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-[#64748b]">
                    ไม่พบรายการแจ้งเตือนในสถานะที่เลือก
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const isCrit = a.level === 'Critical';
                  const isWarn = a.level === 'High' || a.level === 'Warning';
                  return (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedIncident(a)}
                      className="hover:bg-[#f8fafc] cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-medium text-[#64748b] tabular-nums whitespace-nowrap">
                        {a.time || a.created_at || 'เมื่อสักครู่'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isCrit
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : isWarn
                              ? 'bg-[#ffede6] text-[#943700]'
                              : 'bg-[#eaedff] text-[#004ac6]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCrit ? 'bg-[#ba1a1a]' : isWarn ? 'bg-[#FF7E00]' : '#2563eb'
                            }`}
                          />
                          {a.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#131b2e]">
                        {a.message}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            a.status === 'Active'
                              ? 'bg-[#fee2e2] text-[#991b1b]'
                              : a.status === 'Acknowledged'
                              ? 'bg-[#eff6ff] text-[#1d4ed8]'
                              : 'bg-[#f1f5f9] text-[#64748b]'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {a.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => handleWorkflow(a.id, 'ack')}
                              className="px-2.5 py-1 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[11px] font-semibold"
                            >
                              รับเรื่อง (Ack)
                            </button>
                          )}
                          {(a.status === 'Active' || a.status === 'Acknowledged') && (
                            <button
                              type="button"
                              onClick={() => handleWorkflow(a.id, 'resolve')}
                              className="px-2.5 py-1 rounded-lg bg-[#00CC66] hover:bg-[#00b359] text-white text-[11px] font-semibold"
                            >
                              ปิดงาน (Resolve)
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Stitch Sub-state: Incident Detail & SLA Owner Drawer (480px) ── */}
      <Drawer
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident ? `Incident #${selectedIncident.id}: ${selectedIncident.level}` : 'รายละเอียดเหตุการณ์'}
        subtitle="กรอบเวลา SLA และบันทึกการแก้ไขปัญหา"
        footer={
          selectedIncident && (
            <div className="flex items-center gap-2">
              {selectedIncident.status === 'Active' && (
                <button
                  type="button"
                  onClick={() => handleWorkflow(selectedIncident.id, 'ack')}
                  className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[13px] font-semibold"
                >
                  รับเรื่องเข้าตรวจสอบ (Ack)
                </button>
              )}
              {selectedIncident.status !== 'Resolved' && (
                <button
                  type="button"
                  onClick={() => handleWorkflow(selectedIncident.id, 'resolve')}
                  className="px-4 py-2 rounded-xl bg-[#00CC66] hover:bg-[#00b359] text-white text-[13px] font-semibold"
                >
                  บันทึกปิดงาน (Resolve)
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-[#f1f5f9] text-[#64748b] text-[13px] font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          )
        }
      >
        {selectedIncident && (
          <div className="space-y-5">
            {/* Incident Alert Callout */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#64748b]">
                  {selectedIncident.time || 'เมื่อสักครู่'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#004ac6]">
                  Status: {selectedIncident.status}
                </span>
              </div>
              <p className="text-[15px] font-bold text-[#131b2e] leading-snug">
                {selectedIncident.message}
              </p>
            </div>

            {/* SLA Timer Info */}
            <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fef3c7] space-y-1.5">
              <div className="flex items-center gap-2 text-[#92400e] text-[13px] font-bold">
                <Clock size={16} />
                <span>ข้อกำหนด SLA การตอบสนอง</span>
              </div>
              <p className="text-[12px] text-[#92400e]">
                {selectedIncident.level === 'Critical'
                  ? 'ระดับ Critical: ต้องรับเรื่องภายใน 5 นาที และแก้ไขเสร็จสิ้นใน 15 นาที'
                  : 'ระดับ Warning: ต้องรับเรื่องภายใน 10 นาที และแก้ไขเสร็จสิ้นใน 30 นาที'}
              </p>
            </div>

            {/* Incident Owner Card */}
            <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-white space-y-2">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                ผู้รับผิดชอบปัจจุบัน (Incident Owner)
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#004ac6] text-white flex items-center justify-center font-bold text-[14px]">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'OP'}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-[#131b2e]">
                    {user?.full_name || user?.username || 'Operator On-duty'}
                  </div>
                  <div className="text-[12px] text-[#64748b]">
                    {user?.role ? `${user.role.toUpperCase()} · ${user.site || 'Main Plant'}` : 'Site Safety Team'}
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Mitigation Timeline */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                บันทึกขั้นตอนการแก้ไข (Mitigation Steps)
              </span>
              <div className="space-y-2 text-[12px]">
                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong>เซนเซอร์ตรวจพบสารเคมีเกินเกณฑ์:</strong> ระบบส่งสัญญาณเตือนผ่าน LINE Notify และเริ่มนับเวลา SLA
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong>ตรวจสอบตู้ดูดระบายอากาศ Scrubber:</strong> ตรวจสอบกำลังพัดลมและไส้กรองถ่านกัมมันต์
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong>บันทึกรายงานการแก้ไข:</strong> บันทึกสาเหตุและกด Resolve เพื่อยุติการนับเวลา SLA
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
