import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Shield } from 'lucide-react';
import type { AuthUser } from '../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  isMockActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  currentUser, 
  onLogout,
  isMockActive = false 
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* API Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className={isMockActive ? "text-amber-600 font-semibold" : "text-emerald-700 font-bold"}>
            {isMockActive ? "Mock Mode" : ""}
          </span>
        </div>

        {/* User Profile with Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 border-l border-slate-200 hover:opacity-80 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser?.name || 'Admin User'}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {currentUser?.email || 'admin@groupin.com'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser?.name || 'Admin User'}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'admin@groupin.com'}</p>
                <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {currentUser?.role || 'Admin'}
                </span>
              </div>

              <div className="py-1">
                <div className="px-3.5 py-1.5 flex items-center gap-2 text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Session Authenticated</span>
                </div>
              </div>

              {onLogout && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-medium transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
