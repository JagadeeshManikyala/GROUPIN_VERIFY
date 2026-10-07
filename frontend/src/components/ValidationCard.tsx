import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Copy, 
  FileText, 
  ArrowRight, 
  AlertTriangle, 
  Play,
  RotateCcw
} from 'lucide-react';
import type { UploadResponse } from '../types';

interface ValidationCardProps {
  uploadData: UploadResponse;
  onStartJob: () => void;
  onReset: () => void;
  isStarting: boolean;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  uploadData,
  onStartJob,
  onReset,
  isStarting,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              Job ID: {uploadData.job_id}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
              {uploadData.filename}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">Validation Summary</h2>
          <p className="text-xs text-slate-500">
            Numbers have been parsed, checked for Indian phone format (+91), and deduplicated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            disabled={isStarting}
            className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload New File</span>
          </button>
          <button
            onClick={onStartJob}
            disabled={isStarting || uploadData.valid_numbers === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Checking Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Numbers */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Numbers</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {uploadData.total_numbers.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rows read from spreadsheet</div>
        </div>

        {/* Valid Numbers */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-semibold">Valid Numbers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">
            {uploadData.valid_numbers.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Ready for Groupin API check</div>
        </div>

        {/* Invalid Numbers */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">Invalid Numbers</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">
            {uploadData.invalid_numbers.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">Bad digits or invalid format</div>
        </div>

        {/* Duplicate Numbers */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">Duplicate Numbers</span>
            <Copy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950">
            {uploadData.duplicate_numbers.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Automatically deduplicated</div>
        </div>
      </div>

      {/* Invalid Details Table if present */}
      {uploadData.sample_invalid && uploadData.sample_invalid.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-2 text-rose-700 font-semibold text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sample Invalid Numbers ({uploadData.invalid_numbers} total invalid):</span>
          </div>
          <div className="bg-rose-50/50 rounded-lg border border-rose-100 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-rose-100/60 text-rose-900 font-semibold">
                <tr>
                  <th className="py-2 px-3 w-16">Row</th>
                  <th className="py-2 px-3">Excel Value</th>
                  <th className="py-2 px-3">Validation Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 text-rose-950">
                {uploadData.sample_invalid.map((item, idx) => (
                  <tr key={idx} className="hover:bg-rose-100/30">
                    <td className="py-1.5 px-3 font-mono font-medium">#{item.row}</td>
                    <td className="py-1.5 px-3 font-mono">{item.value || '<empty>'}</td>
                    <td className="py-1.5 px-3 text-rose-800">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
