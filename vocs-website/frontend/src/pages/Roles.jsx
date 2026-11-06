import { ShieldCheck, User, ShieldAlert, Key, Check, X, Sliders } from 'lucide-react';

export default function Roles() {
  const rolesData = [
    {
      code: 'AD',
      name: 'Admin',
      desc: 'Full system configuration & tenant management',
      bg: 'bg-[#dbe1ff] text-[#004ac6]',
      perms: {
        dashboard: 'Full',
        kiosk: 'Full',
        alerts: 'Full',
        settings: 'Full',
        devices: 'Full',
      },
    },
    {
      code: 'EN',
      name: 'Engineer',
      desc: 'Calibration and telemetry sensor operations',
      bg: 'bg-[#d0e1fb] text-[#505f76]',
      perms: {
        dashboard: 'Full',
        kiosk: 'Full',
        alerts: 'Full',
        settings: 'View',
        devices: 'Full',
      },
    },
    {
      code: 'OP',
      name: 'Operator',
      desc: 'Line monitoring and local kiosk execution',
      bg: 'bg-[#e2e7ff] text-[#434655]',
      perms: {
        dashboard: 'View',
        kiosk: 'Full',
        alerts: 'View',
        settings: 'None',
        devices: 'None',
      },
    },
    {
      code: 'SO',
      name: 'Safety Officer',
      desc: 'Health & safety audit trail and incident signoff',
      bg: 'bg-[#ffdbcd] text-[#943700]',
      perms: {
        dashboard: 'Full',
        kiosk: 'View',
        alerts: 'Full',
        settings: 'View',
        devices: 'View',
      },
    },
    {
      code: 'AU',
      name: 'Auditor (PCD / ISO)',
      desc: 'Read-only compliance and calibration export',
      bg: 'bg-[#f2f3ff] text-[#131b2e]',
      perms: {
        dashboard: 'View',
        kiosk: 'View',
        alerts: 'View',
        settings: 'None',
        devices: 'View',
      },
    },
  ];

  const getPermBadge = (val) => {
    if (val === 'Full') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#004ac6]/10 text-[#004ac6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
          Full
        </span>
      );
    }
    if (val === 'View') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#eaedff] text-[#505f76]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#505f76]" />
          View
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f2f3ff] text-[#737686]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d7]" />
        None
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header matching Stitch */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#737686]">Access Control</span>
          <span className="w-1 h-1 rounded-full bg-[#c3c6d7]" />
          <span className="text-xs font-medium text-[#737686]">Industrial Policy Matrix</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#131b2e]">Roles &amp; Permissions</h1>
        <p className="text-sm text-[#434655]">Access permissions matrix across operational interfaces</p>
      </div>

      {/* Main Table Card matching Stitch */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#737686] text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 rounded-l-2xl">Role Name</th>
                <th className="py-3.5 px-4">Dashboard</th>
                <th className="py-3.5 px-4">Kiosk</th>
                <th className="py-3.5 px-4">Alerts</th>
                <th className="py-3.5 px-4">Settings</th>
                <th className="py-3.5 px-4 rounded-r-2xl">Devices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
              {rolesData.map((r) => (
                <tr key={r.code} className="hover:bg-[#f2f3ff]/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${r.bg}`}>
                        {r.code}
                      </div>
                      <div>
                        <div className="font-semibold text-[#131b2e]">{r.name}</div>
                        <div className="text-[11px] text-[#737686]">{r.desc}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{getPermBadge(r.perms.dashboard)}</td>
                  <td className="py-4 px-4">{getPermBadge(r.perms.kiosk)}</td>
                  <td className="py-4 px-4">{getPermBadge(r.perms.alerts)}</td>
                  <td className="py-4 px-4">{getPermBadge(r.perms.settings)}</td>
                  <td className="py-4 px-4">{getPermBadge(r.perms.devices)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

