import React, { useState } from 'react';
import { 
  Users, 
  History, 
  Settings,
  LogOut,
  X
} from 'lucide-react';
import type { AuthUser } from '../types';
import logoImg from '../assets/image.png';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate,
  currentUser,
  onLogout 
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { id: 'checker', label: 'Account Checker', icon: Users },
    { id: 'history', label: 'Results History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 select-none z-20">
        {/* Brand Logo Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl p-0.5 bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
            <img src={logoImg} alt="Groupin Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              Groupin
              <span className="font-bold text-base tracking-tight text-blue-600">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
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

        {/* Admin Profile at Sidebar Bottom */}
        {currentUser && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 mt-auto">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition group">
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer flex-1"
                title="Open Account Settings"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0 overflow-hidden ring-1 ring-slate-200">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1 pr-1">
                  <div className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                    {currentUser?.name || 'Srikant'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                    {currentUser?.email || 'admin@groupin.com'}
                  </div>
                </div>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close icon */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Warning / Logout Icon */}
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Sign Out Confirmation
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to sign out from <span className="font-semibold text-slate-700">{currentUser?.email || 'your account'}</span>? You will need to enter your credentials to log in again.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs hover:shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
