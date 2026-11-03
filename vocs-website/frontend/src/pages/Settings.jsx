import { useState } from 'react';
import {
  Check, Save, Sliders, Bell, Users, ShieldAlert, Wind, Filter
} from 'lucide-react';
import { getThresholds, saveThresholds } from '../utils/settings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('thresholds');
  const [saved, setSaved] = useState(false);

  const [zone1, setZone1] = useState({ warning: 450, critical: 850 });
  const [zone2, setZone2] = useState({ warning: 500, critical: 950 });
  const [zone3, setZone3] = useState({ warning: 300, critical: 650 });

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-8">
      {/* ── Header & Tabs Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase text-[#004ac6] tracking-widest block mb-1">
            Configuration
          </span>
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#131b2e] tracking-tight">
            Settings
          </h1>
        </div>

        {/* Tab Pills */}
        <nav aria-label="Settings Tabs" className="inline-flex p-1.5 rounded-full bg-[#f2f3ff] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('thresholds')}
            className={`px-6 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
              activeTab === 'thresholds'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            Thresholds
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-6 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            Notifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-6 py-1.5 rounded-full text-[14px] font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-[#004ac6] shadow-xs'
                : 'text-[#434655] hover:text-[#131b2e]'
            }`}
          >
            Users
          </button>
        </nav>
      </div>

      {/* ── Settings Content Card ── */}
      <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#004ac6]/5 via-[#dbe1ff]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {activeTab === 'thresholds' && (
          <div className="relative z-10 flex flex-col gap-6">
            {/* Zone 1 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] transition-all hover:bg-[#f2f3ff]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eaedff] flex items-center justify-center text-[#004ac6] shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <span className="text-[18px] font-bold text-[#131b2e] block">Zone 1</span>
                  <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
                    Spray Booth Primary
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col gap-1 w-36">
                  <label className="text-[11px] font-semibold text-[#434655]">Warning ppb</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={zone1.warning}
                      onChange={(e) => setZone1({ ...zone1, warning: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-white text-[#131b2e] font-semibold text-[14px] border border-[#e2e8f0] text-right pr-10 outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-[#737686] pointer-events-none">ppb</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-36">
                  <label className="text-[11px] font-semibold text-[#434655]">Critical ppb</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={zone1.critical}
                      onChange={(e) => setZone1({ ...zone1, critical: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-white text-[#131b2e] font-semibold text-[14px] border border-[#e2e8f0] text-right pr-10 outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-[#737686] pointer-events-none">ppb</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone 2 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] transition-all hover:bg-[#f2f3ff]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eaedff] flex items-center justify-center text-[#004ac6] shrink-0">
                  <Wind size={20} />
                </div>
                <div>
                  <span className="text-[18px] font-bold text-[#131b2e] block">Zone 2</span>
                  <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
                    Curing Line Tunnel
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col gap-1 w-36">
                  <label className="text-[11px] font-semibold text-[#434655]">Warning ppb</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={zone2.warning}
                      onChange={(e) => setZone2({ ...zone2, warning: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-white text-[#131b2e] font-semibold text-[14px] border border-[#e2e8f0] text-right pr-10 outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-[#737686] pointer-events-none">ppb</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-36">
                  <label className="text-[11px] font-semibold text-[#434655]">Critical ppb</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={zone2.critical}
                      onChange={(e) => setZone2({ ...zone2, critical: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-white text-[#131b2e] font-semibold text-[14px] border border-[#e2e8f0] text-right pr-10 outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-[#737686] pointer-events-none">ppb</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone 3 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-[#f8fafc] rounded-2xl border border-[#f1f5f9] transition-all hover:bg-[#f2f3ff]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#eaedff] flex items-center justify-center text-[#004ac6] shrink-0">
                  <Filter size={20} />
                </div>
                <div>
                  <span className="text-[18px] font-bold text-[#131b2e] block">Zone 3</span>
                  <span className="text-[11px] font-bold text-[#434655] uppercase tracking-wider">
                    Exhaust Stack Recirculation
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col gap-1 w-36">
                  <label className="text-[11px] font-semibold text-[#434655]">Warning ppb</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={zone3.warning}
                      onChange={(e) => setZone3({ ...zone3, warning: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-white text-[#131b2e] font-semibold text-[14px] border border-[#e2e8f0] text-right pr-10 outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-[#737686] pointer-events-none">ppb</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-36">
                  <label className="text-[11px] font-semibold text-[#434655]">Critical ppb</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      value={zone3.critical}
                      onChange={(e) => setZone3({ ...zone3, critical: e.target.value })}
                      className="w-full h-11 px-3 rounded-xl bg-white text-[#131b2e] font-semibold text-[14px] border border-[#e2e8f0] text-right pr-10 outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-[#737686] pointer-events-none">ppb</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end pt-4">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#2563eb] text-white font-bold text-[14px] hover:bg-[#1d4ed8] shadow-md transition-all active:scale-[0.98]"
              >
                <Check size={18} />
                <span>{saved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-[18px] font-bold text-[#131b2e]">Notification Channels</h3>
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#131b2e] text-[14px]">LINE OA Emergency Alerts</div>
                  <div className="text-[12px] text-[#64748b]">ส่งข้อความเตือนภัยสารเคมีเข้ากลุ่มโรงงานทันทีเมื่อพบระดับ Critical</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#ecfdf5] text-[#059669] text-[12px] font-bold">Connected</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-[18px] font-bold text-[#131b2e]">User Roles &amp; Permissions</h3>
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-[13px] text-[#434655]">
                ระบบจัดสิทธิ์ตามมาตรฐาน Industrial RBAC (Admin, Engineer, Operator, Viewer)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
