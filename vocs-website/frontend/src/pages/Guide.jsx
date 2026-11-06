import { useState } from 'react';
import {
  BookOpen, ShieldAlert, AlertTriangle, Phone, CheckCircle2,
  Cpu, Wrench, HardDrive, Terminal, ArrowRight, Zap, Copy, Check
} from 'lucide-react';

export default function Guide() {
  const [copiedPayload, setCopiedPayload] = useState(false);

  const jsonPayload = `{
  "box_id": "BOX-001",
  "recorded_at": "2026-11-07T01:30:00Z",
  "readings": {
    "tvoc": 64.0,
    "eco2": 450.0,
    "mq135": 1420,
    "mq3": 2100,
    "mq2": 1180,
    "mq8": 1650,
    "mics_co": 1100,
    "no2": 820,
    "nh3": 1380,
    "pm25": 12.0,
    "temp": 28.5,
    "rh": 55.2
  },
  "status": "ONLINE"
}`;

  function handleCopyPayload() {
    navigator.clipboard.writeText(jsonPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-8 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#004ac6]">
              Documentation &amp; SOP
            </span>
          </div>
          <h1 className="text-[28px] md:text-[34px] font-bold text-[#131b2e] tracking-tight">
            User Guide
          </h1>
          <p className="text-[14px] text-[#505f76] mt-0.5">
            Hardware wiring schematics, emergency containment protocols, and platform telemetry specifications.
          </p>
        </div>
      </div>

      {/* ── Section 1: Sensor Wiring & Pinout ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#eaedff]">
          <div className="w-10 h-10 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center font-bold">
            <Cpu size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#131b2e]">Sensor Wiring &amp; Pinout</h2>
            <p className="text-[13px] text-[#505f76]">ESP32-S3 microcontroller pin assignment and bus mapping</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#eaedff] text-[11px] uppercase tracking-wider text-[#505f76] font-semibold bg-[#faf8ff]">
                <th className="py-3 px-4 rounded-l-xl">Sensor Module</th>
                <th className="py-3 px-4">Interface Type</th>
                <th className="py-3 px-4">ESP32 Pinout</th>
                <th className="py-3 px-4 rounded-r-xl">I2C / Bus Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
              {[
                { name: 'CCS811 (TVOC/eCO2)', desc: 'I2C Gas Sensor', type: 'I2C Bus 1', pin: 'GPIO 21 (SDA) / 22 (SCL)', addr: '0x5B' },
                { name: 'ADS1115 (16-bit ADC)', desc: 'MiCS-6814 Interface', type: 'I2C Bus 2', pin: 'GPIO 32 (SDA) / 13 (SCL)', addr: '0x48' },
                { name: 'MQ-135', desc: 'Air Quality / Benzene', type: 'Analog ADC', pin: 'GPIO 39 (ADC1_CH3)', addr: '—' },
                { name: 'MQ-3', desc: 'Alcohol / Thinner / Solvents', type: 'Analog ADC', pin: 'GPIO 36 (ADC1_CH0)', addr: '—' },
                { name: 'MQ-2', desc: 'Combustible Gas / LPG / Smoke', type: 'Analog ADC', pin: 'GPIO 33 (ADC1_CH5)', addr: '—' },
                { name: 'MQ-8', desc: 'Hydrogen / Flammable Gas', type: 'Analog ADC', pin: 'GPIO 34 (ADC1_CH6)', addr: '—' },
                { name: 'PMS5003', desc: 'Laser PM2.5 Counter', type: 'UART 2', pin: 'GPIO 16 (RX2) / 17 (TX2)', addr: '—' },
                { name: 'DHT22', desc: 'Temperature & Humidity', type: '1-Wire Digital', pin: 'GPIO 27', addr: '—' },
              ].map((s) => (
                <tr key={s.name} className="hover:bg-[#faf8ff] transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-[#131b2e] block">{s.name}</span>
                    <span className="text-[11px] text-[#505f76]">{s.desc}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eaedff] text-[#004ac6]">
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[12px] text-[#505f76]">{s.pin}</td>
                  <td className="py-3 px-4 font-mono text-[12px] font-semibold text-[#131b2e]">{s.addr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 2: Chemical Leak Containment Protocol ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#eaedff]">
          <div className="w-10 h-10 rounded-2xl bg-[#fee2e2] text-[#ba1a1a] flex items-center justify-center font-bold">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#131b2e]">
              Protocol: Chemical Solvent Leak Response
            </h2>
            <p className="text-[13px] text-[#505f76]">
              Standard Operating Procedure (SOP) triggered during Level 4 (Orange) and Level 5 (Red) VOC alarms
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              step: '01',
              title: 'Evacuate Booth',
              desc: 'Direct all non-essential personnel to immediately exit Powder Coating Booth 1 through designated safety airlocks. Verify muster zone roll-call.',
              badge: 'Immediate',
              color: 'text-[#ba1a1a] bg-[#fee2e2]',
            },
            {
              step: '02',
              title: 'Engage Emergency Ventilation',
              desc: 'Press the Booster Fan 100% button on the Kiosk terminal or main control panel. Confirm damper actuator moves to full exhaust discharge.',
              badge: 'Within 60s',
              color: 'text-[#004ac6] bg-[#eaedff]',
            },
            {
              step: '03',
              title: 'Isolate Solvents',
              desc: 'Shut main solvent feed lines to the powder application guns. Inspect line couplings and pressure relief valves for liquid or vapor leaks.',
              badge: 'Within 3 min',
              color: 'text-[#943700] bg-[#ffdbcd]',
            },
            {
              step: '04',
              title: 'Notify Incident Commander',
              desc: 'Confirm automated LINE escalation has paged the shift EHS officer. Report VOC concentration trend and scrubber bed differential pressure.',
              badge: 'Within 5 min',
              color: 'text-[#059669] bg-[#ecfdf5]',
            },
          ].map((item) => (
            <div key={item.step} className="p-5 rounded-2xl bg-[#faf8ff] border border-[#eaedff] flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold text-[#505f76]">STEP {item.step}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.color}`}>
                  {item.badge}
                </span>
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#131b2e] mb-1">{item.title}</h3>
                <p className="text-[13px] text-[#505f76] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Emergency Contacts & Provisioning ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency Contacts */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#eaedff]">
            <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
              <Phone size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#131b2e]">Emergency Contacts</h2>
              <p className="text-[12px] text-[#505f76]">Direct on-call dispatch contacts</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { name: 'Somchai Jaidee', title: 'Plant Safety Manager', phone: '+66 81 234 5678' },
              { name: 'E. Mitchell', title: 'Head of Health & Safety', phone: '+66 89 987 6543' },
              { name: 'Maintenance Dispatch', title: '24/7 Facility Response', phone: 'Ext. 1044 / Radio Ch. 3' },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf8ff] border border-[#eaedff]">
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-[#131b2e]">{c.name}</span>
                  <span className="text-[11px] text-[#505f76]">{c.title}</span>
                </div>
                <span className="font-mono text-[12px] font-bold text-[#004ac6] bg-[#eaedff] px-2.5 py-1 rounded-lg">
                  {c.phone}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Provisioning Steps */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#eaedff]">
            <div className="w-9 h-9 rounded-xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#131b2e]">Node Provisioning</h2>
              <p className="text-[12px] text-[#505f76]">Installation and calibration sequence</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { n: '1', title: 'Mount Enclosure', desc: 'Secure IP65 box 1.5m above floor near exhaust duct entrance.' },
              { n: '2', title: 'Power 12VDC Line', desc: 'Connect regulated industrial power rail and verify steady 3.3V bus.' },
              { n: '3', title: 'Sensor Burn-in', desc: 'Run 48-hour continuous pre-heat before zero-air baseline calibration.' },
            ].map((st) => (
              <div key={st.n} className="flex items-start gap-3 p-3 rounded-xl bg-[#faf8ff] border border-[#eaedff]">
                <div className="w-6 h-6 rounded-full bg-[#004ac6] text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {st.n}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-[#131b2e]">{st.title}</span>
                  <span className="text-[12px] text-[#505f76]">{st.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: Telemetry Payload Reference ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-[#eaedff] flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#eaedff]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#131b2e]">Telemetry Payload Reference</h2>
              <p className="text-[12px] text-[#505f76]">Standard JSON format sent to POST /api/ingest</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPayload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#eaedff] hover:bg-[#f2f3ff] text-[#505f76] text-[12px] font-semibold transition-colors cursor-pointer"
          >
            {copiedPayload ? <Check size={14} className="text-[#059669]" /> : <Copy size={14} />}
            <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-[#131b2e] text-[#b4c5ff] font-mono text-[12px] leading-relaxed overflow-x-auto shadow-inner">
          <code>{jsonPayload}</code>
        </pre>
      </div>
    </div>
  );
}
