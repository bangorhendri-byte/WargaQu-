import React from 'react';
import { UtensilsCrossed, Boxes, TrendingUp, FileText, Settings } from 'lucide-react';

interface BottomNavBarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  occupiedCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  occupiedCount = 0,
}) => {
  const tabs = [
    { id: 'kasir', label: 'Kasir', icon: UtensilsCrossed, badge: occupiedCount > 0 ? occupiedCount : null },
    { id: 'bahan', label: 'Modal', icon: Boxes, badge: null },
    { id: 'omset', label: 'Omset', icon: TrendingUp, badge: null },
    { id: 'laporan', label: 'Laporan', icon: FileText, badge: null },
    { id: 'setting', label: 'Setting', icon: Settings, badge: null },
  ];

  return (
    <nav className="w-full bg-stone-900/98 border-t border-stone-800 text-stone-400 px-2 pt-2 pb-6 sm:pb-7 flex items-center justify-around shrink-0 z-30 shadow-xl select-none android-navbar-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (navigator.vibrate) {
                try {
                  navigator.vibrate(20);
                } catch {}
              }
              onSelectTab(tab.id);
            }}
            className={`relative flex flex-col items-center justify-center min-w-[56px] py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 ${
              isActive
                ? 'text-amber-400 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {/* Active Pill Accent */}
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-0.5 bg-amber-500 rounded-full"></span>
            )}

            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {tab.badge !== null && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-stone-900 animate-pulse">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
