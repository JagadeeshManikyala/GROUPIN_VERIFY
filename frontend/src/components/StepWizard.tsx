import React from 'react';
import { Upload, CheckSquare, RefreshCw, FileText, Check } from 'lucide-react';

interface StepWizardProps {
  currentStep: number; // 1, 2, 3, 4
}

export const StepWizard: React.FC<StepWizardProps> = ({ currentStep }) => {
  const steps = [
    {
      number: 1,
      title: 'Step 1 — Upload Excel File',
      desc: 'Drag & drop .xlsx or .xls file',
      icon: Upload,
    },
    {
      number: 2,
      title: 'Step 2 — Validate & Process',
      desc: 'Normalize +91 & deduplicate',
      icon: CheckSquare,
    },
    {
      number: 3,
      title: 'Step 3 — Check with Groupin API',
      desc: 'Batched requests with backoff',
      icon: RefreshCw,
    },
    {
      number: 4,
      title: 'Step 4 — Get Results',
      desc: 'Live table & export Excel report',
      icon: FileText,
    },
  ];

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = currentStep > s.number;
          const isCurrent = currentStep === s.number;

          return (
            <div
              key={s.number}
              className={`relative flex items-center gap-3.5 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'border-blue-500 bg-blue-50/60 shadow-xs ring-2 ring-blue-500/10'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-100 bg-slate-50/50 opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className={`w-4 h-4 ${isCurrent ? 'animate-pulse' : ''}`} />}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? 'text-blue-900' : isDone ? 'text-emerald-900' : 'text-slate-600'
                  }`}
                >
                  {s.title}
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
