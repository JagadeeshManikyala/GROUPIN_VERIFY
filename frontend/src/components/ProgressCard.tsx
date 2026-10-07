import React from 'react';
import { 
  Users, 
  UserX, 
  AlertOctagon, 
  Clock, 
  Timer, 
  CheckCircle2, 
  Loader2, 
  StopCircle 
} from 'lucide-react';
import type { JobStatusResponse } from '../types';

interface ProgressCardProps {
  job: JobStatusResponse;
  onCancelJob: () => void;
  isCancelling: boolean;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  job,
  onCancelJob,
  isCancelling,
}) => {
  const isRunning = job.status === 'PROCESSING' || job.status === 'VALIDATING';
  const isDone = job.status === 'COMPLETED';
  const isFailed = job.status === 'FAILED';
  const isCancelled = job.status === 'CANCELLED';

  const formatSeconds = (sec?: number | null) => {
    if (sec === null || sec === undefined) return '--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs mb-8">
      {/* Top Header of Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200/60 font-mono">
              {job.job_id}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
              {job.filename}
            </span>
          </div>

          <h2 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
            {isRunning && (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Checking Accounts with Groupin API...</span>
              </>
            )}
            {isDone && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Complete!</span>
              </>
            )}
            {isFailed && <span className="text-rose-600">Verification Job Failed</span>}
            {isCancelled && <span className="text-slate-600">Job Cancelled by User</span>}
          </h2>
        </div>

        {/* Cancel Button */}
        {isRunning && (
          <button
            onClick={onCancelJob}
            disabled={isCancelling}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>{isCancelling ? 'Cancelling...' : 'Cancel Job'}</span>
          </button>
        )}
      </div>

      {/* Progress Bar & Numeric Percentage */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">
            {job.processed_numbers.toLocaleString()} / {job.valid_numbers.toLocaleString()} numbers processed
          </span>
          <span className="font-bold text-blue-600 text-sm font-mono">
            {job.progress_percentage.toFixed(1)}%
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isDone
                ? 'bg-emerald-500'
                : isFailed
                ? 'bg-rose-500'
                : isCancelled
                ? 'bg-slate-400'
                : 'bg-linear-to-r from-blue-600 to-indigo-600 animate-pulse'
            }`}
            style={{ width: `${Math.max(2, job.progress_percentage)}%` }}
          />
        </div>
      </div>

      {/* 4 Metric Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Accounts Found */}
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-semibold">Groupin Accounts</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-950 font-mono">
            {job.accounts_found.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Found & registered</div>
        </div>

        {/* Not Registered */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-semibold">Not Registered</span>
            <UserX className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            {job.not_registered.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">No existing user account</div>
        </div>

        {/* Failed / Retried */}
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">Failed</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-950 font-mono">
            {job.failed.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5">API timeouts or errors</div>
        </div>

        {/* Total Target */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold">Total Target</span>
            <span className="text-xs font-bold text-blue-600 font-mono">100%</span>
          </div>
          <div className="text-xl font-bold text-blue-950 font-mono">
            {job.valid_numbers.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-700 mt-0.5">Valid numbers to check</div>
        </div>
      </div>

      {/* Time Stats Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Elapsed Time:</span>
          <span className="font-semibold text-slate-700 font-mono">{formatSeconds(job.elapsed_time_seconds)}</span>
        </div>

        {isRunning && (
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-blue-600" />
            <span>Estimated Remaining:</span>
            <span className="font-semibold text-blue-700 font-mono">{formatSeconds(job.estimated_remaining_seconds)}</span>
          </div>
        )}

        <div className="text-[11px] text-slate-400">
          Auto-polling every 2 seconds
        </div>
      </div>
    </div>
  );
};
