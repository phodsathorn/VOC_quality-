import React from 'react';
import { ChevronRight, Info, FileText, Wrench, History } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SensorsTab({
  sensors,
  expandedRow,
  setExpandedRow,
  handleDownloadCertificate,
  setCalibModalSensor,
  setIsHistoryDrawerOpen,
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff]">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="bg-[#f2f3ff] text-[#434655] text-[12px] uppercase tracking-wider font-medium">
              <th className="py-3 px-4 rounded-l-2xl">{t('sensor', 'Sensor')}</th>
              <th className="py-3 px-4">{t('serialNo', 'Serial No.')}</th>
              <th className="py-3 px-4">{t('lastCalibrated', 'Last calibrated')}</th>
              <th className="py-3 px-4">{t('calibratedBy', 'Calibrated by')}</th>
              <th className="py-3 px-4">
                <div className="inline-flex items-center gap-1">
                  <span>{t('drift', 'Drift %')}</span>
                  <span title="Change from first baseline" className="text-[#505f76] hover:text-[#131b2e] cursor-pointer">
                    <Info size={14} />
                  </span>
                </div>
              </th>
              <th className="py-3 px-4">{t('nextDue', 'Next due')}</th>
              <th className="py-3 px-4 text-center">{t('certificate', 'Certificate')}</th>
              <th className="py-3 px-4 text-right rounded-r-2xl">{t('status', 'Status')}</th>
            </tr>
          </thead>
          <tbody className="text-[#131b2e] divide-y-0">
            {sensors.map((s) => {
              const isExpanded = expandedRow === s.id;
              return (
                <tr
                  key={s.id}
                  onClick={() => setExpandedRow(isExpanded ? null : s.id)}
                  className={`group cursor-pointer transition-colors ${
                    isExpanded ? 'bg-[#f2f3ff]/80' : 'hover:bg-[#f2f3ff]/40'
                  }`}
                >
                  <td className="py-4 px-4 font-medium text-[#131b2e] rounded-l-2xl whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[#505f76] group-hover:text-[#004ac6] transition-colors">
                        <ChevronRight
                          size={16}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-[#004ac6]' : ''}`}
                        />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-[11px] text-[#505f76]">{s.gasType}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-[#505f76] whitespace-nowrap">
                    {s.serial}
                  </td>
                  <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">
                    {s.last}
                  </td>
                  <td className="py-4 px-4 text-[#131b2e] whitespace-nowrap">
                    {s.technician}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        s.isDueSoon ? 'text-[#943700] font-bold' : 'text-[#004ac6]'
                      }`}
                    >
                      {s.drift}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">
                    {s.next}
                  </td>
                  <td className="py-4 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDownloadCertificate(s.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#004ac6] text-xs font-medium transition-colors cursor-pointer"
                      title="Download calibration certificate PDF"
                    >
                      <FileText size={14} />
                      <span>PDF</span>
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right rounded-r-2xl whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setCalibModalSensor(s)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border transition-all cursor-pointer ${
                        s.isDueSoon
                          ? 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.isDueSoon ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span>{s.isDueSoon ? t('dueSoon', 'Due soon') : t('calibrated', 'Calibrated')}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expandable row detail card when a row is active */}
      {expandedRow && (() => {
        const rowItem = sensors.find((s) => s.id === expandedRow);
        if (!rowItem) return null;
        return (
          <div className="mt-4 p-4 rounded-2xl bg-[#f2f3ff] border border-[#eaedff] flex flex-wrap items-center justify-between gap-4 animate-fade-in">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-bold">
                  Calibrated by
                </span>
                <span className="text-[#131b2e] font-medium text-[13px] mt-0.5">
                  {rowItem.technician} (H&amp;S Officer)
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-bold">
                    Baseline Drift
                  </span>
                  <span title="Change from first factory baseline" className="text-[#505f76]">
                    <Info size={12} />
                  </span>
                </div>
                <span className={`font-semibold text-[13px] mt-0.5 ${rowItem.isDueSoon ? 'text-[#943700]' : 'text-[#004ac6]'}`}>
                  {rowItem.drift}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#505f76] font-bold">
                  Span Gas Conc.
                </span>
                <span className="text-[#131b2e] font-medium text-[13px] mt-0.5">
                  {rowItem.spanGas}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalibModalSensor(rowItem)}
                className="px-3 py-1.5 rounded-xl bg-[#004ac6] text-white hover:bg-[#003ea8] text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Wrench size={14} />
                <span>Calibrate now</span>
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryDrawerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white text-[#505f76] hover:text-[#131b2e] border border-[#eaedff] text-xs font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <History size={14} />
                <span>History</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

