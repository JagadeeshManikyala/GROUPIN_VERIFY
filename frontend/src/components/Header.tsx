import React from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentUser?: any;
  onLogout?: () => void;
  isMockActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>
    </header>
  );
};
