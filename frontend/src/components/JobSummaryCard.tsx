import React from 'react';
import { Download } from 'lucide-react';
import type { JobStatusResponse } from '../types';
import { api } from '../api';

interface JobSummaryCardProps {
  job: JobStatusResponse | null;
}

export const JobSummaryCard: React.FC<JobSummaryCardProps> = ({ job }) => {
  if (!job) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Job Summary</h3>
        <p className="text-xs text-slate-400">
          Upload an Excel file to see live metrics and status summary.
        </p>
      </div>
    );
  }

  const isCompleted = job.status === 'COMPLETED';

  const formatSeconds = (sec?: number | null) => {
    if (sec === null || sec === undefined) return '--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const statusBadge = () => {
    switch (job.status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">COMPLETED</span>;
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">PROCESSING</span>;
      case 'VALIDATING':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">VALIDATING</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">FAILED</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">PENDING</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs sticky top-24 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Job Summary</h3>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{job.job_id}</p>
        </div>
        {statusBadge()}
      </div>

      {/* Number Breakdown */}
      <div className="space-y-2 text-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Input Metrics
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Total Numbers:</span>
          <span className="font-semibold text-slate-900 font-mono">{job.total_numbers.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Valid Numbers:</span>
          <span className="font-semibold text-emerald-700 font-mono">{job.valid_numbers.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Invalid Numbers:</span>
          <span className="font-semibold text-rose-700 font-mono">{job.invalid_numbers.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Duplicate Numbers:</span>
          <span className="font-semibold text-amber-700 font-mono">{job.duplicate_numbers.toLocaleString()}</span>
        </div>
      </div>

      {/* Verification Results Breakdown */}
      <div className="space-y-2 text-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Verification Outcome
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Groupin Accounts:</span>
          <span className="font-bold text-emerald-700 font-mono">{job.accounts_found.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Not Registered:</span>
          <span className="font-bold text-slate-800 font-mono">{job.not_registered.toLocaleString()}</span>
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Failed / Retried:</span>
          <span className="font-bold text-rose-700 font-mono">{job.failed.toLocaleString()}</span>
        </div>
      </div>

      {/* Time Breakdown */}
      <div className="space-y-2 text-xs">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Timing Details
        </div>

        <div className="flex justify-between py-1 border-b border-slate-50">
          <span className="text-slate-600">Elapsed Time:</span>
          <span className="font-medium text-slate-800 font-mono">{formatSeconds(job.elapsed_time_seconds)}</span>
        </div>

        {job.status === 'PROCESSING' && (
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-600">Estimated Left:</span>
            <span className="font-medium text-blue-700 font-mono">{formatSeconds(job.estimated_remaining_seconds)}</span>
          </div>
        )}
      </div>

      {/* Download Action Button */}
      <div className="pt-2">
        {isCompleted ? (
          <a
            href={api.getDownloadResultUrl(job.job_id)}
            download
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Results (.xlsx)</span>
          </a>
        ) : (
          <button
            disabled
            title="Download will become active once job completes"
            className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 font-semibold text-xs rounded-lg border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span>Download Results</span>
          </button>
        )}
        <p className="text-[10px] text-center text-slate-400 mt-2">
          {isCompleted 
            ? 'Official Excel report ready for export' 
            : 'Download activates automatically upon completion'}
        </p>
      </div>
    </div>
  );
};
