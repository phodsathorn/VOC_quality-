import { useState } from 'react';
import {
  Wrench, Plus, CheckCircle2, ArrowRight, X, Clock
} from 'lucide-react';
import { Drawer } from '../components/ui';

export default function Maintenance() {
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filters = [
    { name: 'HEPA filter', percent: 78, status: 'Normal', desc: 'Pre-filtration stage for particulate matter' },
    { name: 'Carbon filter', percent: 42, status: 'Attention', desc: 'Activated Carbon adsorption bed for solvent VOCs' },
    { name: 'UV lamp', percent: 65, status: 'Normal', desc: 'Photocatalytic oxidation stage 3' },
  ];

  const sensors = [
    { name: 'PID VOC Sensor 01', last: 'Oct 12, 2025', next: 'Nov 12, 2025', status: 'Calibrated', badge: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { name: 'Electrochemical MOS 02', last: 'Sep 28, 2025', next: 'Oct 28, 2025', status: 'Due soon', badge: 'bg-[#ffdbcd] text-[#943700]', dot: 'bg-[#943700]' },
    { name: 'Particulate PM2.5 Optical', last: 'Oct 05, 2025', next: 'Nov 05, 2025', status: 'Calibrated', badge: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
    { name: 'Airflow Differential Pitot', last: 'Aug 15, 2025', next: 'Nov 15, 2025', status: 'Calibrated', badge: 'bg-[#eaedff] text-[#004ac6]', dot: 'bg-[#004ac6]' },
  ];

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto gap-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-[28px] md:text-[36px] font-bold text-[#131b2e] tracking-tight">
            Maintenance
          </h1>
          <span className="text-[14px] text-[#434655]">
            Filter life &amp; sensor calibration
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddLogOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#004ac6] text-white text-[14px] font-bold shadow-xs hover:bg-[#2563eb] transition-all"
        >
          <Plus size={18} />
          <span>Add log</span>
        </button>
      </div>

      {/* ── 3 Filter Life Progress Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filters.map((f) => (
          <div
            key={f.name}
            className="bg-white rounded-3xl p-8 shadow-sm flex flex-col justify-between"
          >
            <div className="flex flex-col gap-4">
              <span className="text-[13px] font-semibold text-[#434655] uppercase tracking-wider">
                {f.name}
              </span>
              <span className="text-[56px] font-bold text-[#131b2e] leading-none tabular-nums tracking-tight">
                {f.percent}%
              </span>
              <div className="w-full bg-[#f2f3ff] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#004ac6] h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${f.percent}%` }}
                />
              </div>
            </div>

            <span
              onClick={() => setSelectedFilter(f)}
              className="mt-6 text-[13px] font-bold text-[#004ac6] hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 cursor-pointer"
            >
              View details →
            </span>
          </div>
        ))}
      </div>

      {/* ── Sensor Calibration Schedule Table ── */}
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#434655] text-[11px] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 rounded-l-xl">Sensor</th>
                <th className="py-3 px-4">Last calibrated</th>
                <th className="py-3 px-4">Next due</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#131b2e] divide-y divide-[#f1f5f9]">
              {sensors.map((s) => (
                <tr key={s.name} className="hover:bg-[#f2f3ff]/40 transition-colors">
                  <td className="py-4 px-4 font-semibold text-[#131b2e]">{s.name}</td>
                  <td className="py-4 px-4 text-[#434655]">{s.last}</td>
                  <td className="py-4 px-4 text-[#434655]">{s.next}</td>
                  <td className="py-4 px-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold ${s.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sub-State Add Log Drawer ── */}
      <Drawer
        isOpen={isAddLogOpen}
        onClose={() => setIsAddLogOpen(false)}
        title="Add Maintenance Log"
        subtitle="Log service or calibration record"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('บันทึกประวัติการบำรุงรักษาเรียบร้อย');
            setIsAddLogOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-1.5">
              Service Type
            </label>
            <select className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-[13px] font-medium outline-none">
              <option>Filter Pack Replacement (Carbon Scrubber)</option>
              <option>HEPA Filter Backwash &amp; Inspection</option>
              <option>PID Sensor Calibration with Isobutylene</option>
              <option>VFD Exhaust Fan Bearing Lubrication</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-1.5">
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#e2e8f0] text-[13px] font-medium outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-1.5">
              Technician Name
            </label>
            <input
              type="text"
              defaultValue="E. Mitchell"
              className="w-full px-3.5 py-2 rounded-xl border border-[#e2e8f0] text-[13px] font-medium outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-1.5">
              Service Notes
            </label>
            <textarea
              rows={3}
              placeholder="บันทึกรายละเอียดงานบำรุงรักษาและชิ้นส่วนที่เปลี่ยน..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#e2e8f0] text-[13px] font-medium outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#004ac6] text-white text-[14px] font-bold hover:bg-[#2563eb] transition-colors"
          >
            Save Log
          </button>
        </form>
      </Drawer>

      {/* ── Sub-State Filter Details Drawer ── */}
      {selectedFilter && (
        <Drawer
          isOpen={Boolean(selectedFilter)}
          onClose={() => setSelectedFilter(null)}
          title={selectedFilter.name}
          subtitle={`Remaining Life: ${selectedFilter.percent}%`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="text-[11px] font-bold uppercase text-[#64748b]">Efficiency Rating</div>
              <div className="text-[32px] font-bold text-[#131b2e]">{selectedFilter.percent}%</div>
              <div className="text-[12px] text-[#004ac6] font-semibold">{selectedFilter.status} Status</div>
            </div>
            <p className="text-[14px] text-[#434655] leading-relaxed">
              {selectedFilter.desc}
            </p>
          </div>
        </Drawer>
      )}
    </div>
  );
}
