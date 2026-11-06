import { useLanguage } from '../context/LanguageContext';

export default function Roles() {
  const { t } = useLanguage();

  const rolesData = [
    {
      code: 'AD',
      nameKey: 'roleAdminName',
      descKey: 'roleAdminDesc',
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
      nameKey: 'roleEngineerName',
      descKey: 'roleEngineerDesc',
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
      nameKey: 'roleOperatorName',
      descKey: 'roleOperatorDesc',
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
      nameKey: 'roleSafetyOfficerName',
      descKey: 'roleSafetyOfficerDesc',
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
      nameKey: 'roleAuditorName',
      descKey: 'roleAuditorDesc',
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#2563eb]/10 text-[#004ac6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#004ac6]" />
          {t('permFull')}
        </span>
      );
    }
    if (val === 'View') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#eaedff] text-[#505f76]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#505f76]" />
          {t('permView')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#f2f3ff] text-[#737686]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c3c6d7]" />
        {t('permNone')}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header matching Stitch */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#737686]">
            {t('accessControlTag')}
          </span>
          <span className="w-1 h-1 rounded-full bg-[#c3c6d7]" />
          <span className="text-[12px] font-medium text-[#737686]">
            {t('policyMatrixTag')}
          </span>
        </div>
        <h1 className="text-[24px] font-bold tracking-tight text-[#131b2e]">
          {t('rolesTitle')}
        </h1>
        <p className="text-[14px] text-[#434655]">
          {t('rolesSubtitle')}
        </p>
      </div>

      {/* Main Table Card matching Stitch */}
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#eaedff] overflow-hidden"
        style={{ boxShadow: 'rgba(15, 23, 42, 0.03) 0px 4px 20px -2px, rgba(15, 23, 42, 0.02) 0px 2px 6px -1px' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#f2f3ff] text-[#737686] text-[12px] font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4 rounded-l-2xl">{t('roleNameCol')}</th>
                <th className="py-3.5 px-4">{t('dashboard')}</th>
                <th className="py-3.5 px-4">{t('kiosk')}</th>
                <th className="py-3.5 px-4">{t('alerts')}</th>
                <th className="py-3.5 px-4">{t('settings')}</th>
                <th className="py-3.5 px-4 rounded-r-2xl">{t('devices')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff] text-[#131b2e]">
              {rolesData.map((r) => (
                <tr key={r.code} className="hover:bg-[#f2f3ff]/40 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${r.bg}`}>
                        {r.code}
                      </div>
                      <div>
                        <div className="font-semibold text-[#131b2e]">{t(r.nameKey)}</div>
                        <div className="text-[11px] text-[#737686]">{t(r.descKey)}</div>
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
