import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkOrdersTab({ workOrders }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff]">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="bg-[#f2f3ff] text-[#434655] text-[12px] uppercase tracking-wider font-medium">
              <th className="py-3 px-4 rounded-l-2xl">{t('title', 'Title')}</th>
              <th className="py-3 px-4">{t('assignee', 'Assignee')}</th>
              <th className="py-3 px-4">{t('dueDate', 'Due Date')}</th>
              <th className="py-3 px-4">{t('status', 'Status')}</th>
              <th className="py-3 px-4 text-right rounded-r-2xl">{t('signedOffBy', 'Signed off by')}</th>
            </tr>
          </thead>
          <tbody className="divide-y-0 text-[#131b2e]">
            {workOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-[#505f76]">
                  {t('noData', 'No work orders')}
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-[#f2f3ff]/40 transition-colors">
                  <td className="py-4 px-4 font-medium text-[#131b2e] rounded-l-2xl whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold">{wo.title}</span>
                      <span className="text-[11px] font-mono text-[#505f76]">{wo.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">{wo.assignee}</td>
                  <td className="py-4 px-4 text-[#505f76] whitespace-nowrap">{wo.dueDate}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${wo.statusColor}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {wo.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right rounded-r-2xl text-[#505f76] font-medium whitespace-nowrap">
                    {wo.signedOffBy}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

