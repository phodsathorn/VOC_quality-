import React from 'react';
import { Clock, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function SlaTab({ sla, setSla, setHasChanges }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-[#eaedff] flex flex-col gap-6">
      <div className="pb-4 border-b border-[#eaedff]">
        <h3 className="text-[18px] text-[#131b2e] font-semibold">
          {t('responseSlaTitle', 'Response Service Level Agreement (SLA)')}
        </h3>
        <p className="text-[13px] text-[#505f76] mt-1">
          {t('responseSlaDesc', 'Specify response SLA target times before alarms escalate to plant supervisory management and emergency ventilation triggers.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#f2f3ff]/60 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d0e1fb] text-[#004ac6] flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div>
              <h4 className="text-[15px] text-[#131b2e] font-semibold">
                {t('warningSlaTarget', 'Warning SLA Target')}
              </h4>
              <span className="text-[12px] text-[#505f76]">
                {t('warningSlaDesc', 'Acknowledge time window for amber alerts')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="number"
              value={sla.warningMinutes}
              onChange={(e) => {
                setSla({ ...sla, warningMinutes: Number(e.target.value) });
                setHasChanges(true);
              }}
              className="w-28 h-11 px-3 rounded-xl bg-white text-[#131b2e] font-bold text-[16px] shadow-inner border border-[#c3c6d7] text-right pr-4"
            />
            <span className="text-[14px] text-[#505f76] font-medium">
              {t('minutes', 'minutes')}
            </span>
          </div>
          <p className="text-[12px] text-[#505f76]">
            {t('warningEscalateNote', 'If unresolved after 10 minutes, warnings dispatch reminders to the shift engineer.')}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#f2f3ff]/60 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h4 className="text-[15px] text-[#131b2e] font-semibold">
                {t('criticalSlaTarget', 'Critical SLA Target')}
              </h4>
              <span className="text-[12px] text-[#505f76]">
                {t('criticalSlaDesc', 'Hard limit for evacuation, supervisor call & fan boost')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="number"
              value={sla.criticalMinutes}
              onChange={(e) => {
                setSla({ ...sla, criticalMinutes: Number(e.target.value) });
                setHasChanges(true);
              }}
              className="w-28 h-11 px-3 rounded-xl bg-white text-[#131b2e] font-bold text-[16px] shadow-inner border border-[#c3c6d7] text-right pr-4"
            />
            <span className="text-[14px] text-[#505f76] font-medium">
              {t('minutes', 'minutes')}
            </span>
          </div>
          <p className="text-[12px] text-[#505f76]">
            {t('criticalEscalateNote', 'If unacknowledged after 5 minutes, audible alarms trip and factory management is escalated.')}
          </p>
        </div>
      </div>
    </div>
  );
}

