import React from 'react';

/**
 * Standard Tabs Switcher Component
 * Supports 'pills' (rounded pill style) and 'underline' (border bottom style)
 */
export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pills',
  className = '',
}) {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-[#c4c6d0]/40 gap-6 overflow-x-auto ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-3 text-[14px] font-semibold transition-all relative inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive ? 'text-[#004ac6]' : 'text-[#505f76] hover:text-[#131b2e]'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#004ac6] text-white' : 'bg-[#eaedff] text-[#004ac6]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004ac6] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: pills
  return (
    <div
      className={`inline-flex flex-wrap items-center bg-[#f1f3fd] p-1.5 rounded-2xl gap-1 border border-[#e1e3ed] ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all inline-flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'bg-white text-[#004ac6] shadow-sm'
                : 'text-[#505f76] hover:text-[#131b2e]'
            }`}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-[#004ac6] text-white' : 'bg-white text-[#505f76]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

