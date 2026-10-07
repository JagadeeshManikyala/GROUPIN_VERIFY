import React from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  ListChecks, 
  History, 
  MessageSquare,
  BarChart3, 
  Settings,
  HelpCircle,
  Headphones
} from 'lucide-react';

import logoImg from '../assets/image.png';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const menuItems = [
    { id: 'checker', label: 'Account Checker', icon: Users },
    { id: 'groups', label: 'Group Messenger', icon: MessageSquare },
    { id: 'upload', label: 'Upload & Check', icon: FileSpreadsheet },
    { id: 'jobs', label: 'Processing Jobs', icon: ListChecks },
    { id: 'history', label: 'Results History', icon: History },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-20">
      {/* Brand Logo Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl p-0.5 bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
          <img src={logoImg} alt="Groupin Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
            Groupin
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
              Verify
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-tight"></p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Main
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/70 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Need Help Card (from Image 2) */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Need Help?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            Contact support for any issues with file upload or processing.
          </p>
          <button 
            type="button"
            className="w-full py-1.5 px-3 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
