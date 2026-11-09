import React from 'react';
import { X, Wrench } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WorkOrderDrawer({
  isOpen,
  onClose,
  woTitle,
  setWoTitle,
  woAssignee,
  setWoAssignee,
  woDueDate,
  setWoDueDate,
  woPriority,
  setWoPriority,
  woNote,
  setWoNote,
  onSubmit,
}) {
  const { t, lang } = useLanguage();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[#131b2e]/25 backdrop-blur-[2px] z-50 transition-opacity"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-[#eaedff] transition-transform duration-300 ease-out">
        <div className="p-6 border-b border-[#eaedff] flex items-center justify-between bg-[#f2f3ff]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e2e7ff] flex items-center justify-center text-[#004ac6]">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold text-[#131b2e] leading-tight">
                {t('addWorkOrderTitle', 'Add work order')}
              </h2>
              <span className="text-[12px] text-[#505f76]">
                {t('assignTask', 'Schedule maintenance task')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#eaedff] flex items-center justify-center text-[#505f76] hover:text-[#131b2e] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 flex-1 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-title">
              {t('title', 'Title')}
            </label>
            <input
              id="wo-title"
              type="text"
              required
              placeholder={lang === 'TH' ? 'เช่น ทำความสะอาดแผ่นกรองขั้นต้น' : 'e.g. Clean intake pre-filters'}
              value={woTitle}
              onChange={(e) => setWoTitle(e.target.value)}
              className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-assignee">
              {t('assignee', 'Assignee')}
            </label>
            <input
              id="wo-assignee"
              type="text"
              required
              value={woAssignee}
              onChange={(e) => setWoAssignee(e.target.value)}
              className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-due">
                {t('dueDate', 'Due date')}
              </label>
              <input
                id="wo-due"
                type="date"
                value={woDueDate}
                onChange={(e) => setWoDueDate(e.target.value)}
                className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-priority">
                {t('priority', 'Priority')}
              </label>
              <select
                id="wo-priority"
                value={woPriority}
                onChange={(e) => setWoPriority(e.target.value)}
                className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl py-3 px-4 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] uppercase tracking-wider text-[#505f76] font-semibold" htmlFor="wo-note">
              {t('instructions', 'Instructions / Notes')}
            </label>
            <textarea
              id="wo-note"
              rows={3}
              value={woNote}
              onChange={(e) => setWoNote(e.target.value)}
              placeholder={lang === 'TH' ? 'คำแนะนำโดยละเอียดหรือข้อควรระวังความปลอดภัย...' : 'Detailed instructions or safety precautions...'}
              className="w-full bg-[#f2f3ff] text-[#131b2e] rounded-2xl p-4 text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-[#004ac6]/20 resize-none"
            />
          </div>

          <div className="mt-auto pt-6 border-t border-[#eaedff] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-[#eaedff] text-[#131b2e] text-[14px] font-medium hover:bg-[#dbe1ff] transition-colors cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#004ac6] text-white text-[14px] font-medium shadow-xs hover:bg-[#003ea8] transition-colors cursor-pointer"
            >
              {t('save', 'Save')}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

