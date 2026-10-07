import React, { useState, useEffect } from 'react';
import { RotateCw, Download, X, FileSpreadsheet } from 'lucide-react';
import { api } from '../api';
import { ResultsTable } from './ResultsTable';
import { formatDateTime } from '../utils/date';

interface JobsHistoryViewProps {
  onSelectJob?: (jobId: string) => void;
}

export const JobsHistoryView: React.FC<JobsHistoryViewProps> = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getRecentJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Audit Log</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              History of all uploaded spreadsheets and bulk verification jobs.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            disabled={loading}
            title="Refresh Audit Log"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Accounts Found</th>
                <th className="py-3 px-4">Not Registered</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No jobs recorded yet.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {j.job_id}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 truncate max-w-xs">
                      {j.filename}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          j.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : j.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : j.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{j.total_numbers.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                      {j.accounts_found.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {j.not_registered.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {formatDateTime(j.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(j)}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                        {j.status === 'COMPLETED' && (
                          <a
                            href={api.getDownloadResultUrl(j.job_id)}
                            download
                            title="Download Excel Report"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Popup Modal when user clicks Open */}
      {selectedJob && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setSelectedJob(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-5xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 truncate max-w-sm">
                      {selectedJob.filename}
                    </h3>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70">
                      {selectedJob.job_id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedJob.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : selectedJob.status === 'PROCESSING'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : selectedJob.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {selectedJob.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Total: <strong className="text-slate-800 font-semibold">{selectedJob.total_numbers}</strong></span>
                    <span>•</span>
                    <span>Found: <strong className="text-emerald-700 font-semibold">{selectedJob.accounts_found}</strong></span>
                    <span>•</span>
                    <span>Not Registered: <strong className="text-slate-700 font-semibold">{selectedJob.not_registered}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedJob.status === 'COMPLETED' && (
                  <a
                    href={api.getDownloadResultUrl(selectedJob.job_id)}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded ResultsTable with its search, filter tabs & pagination */}
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/40">
              <ResultsTable 
                jobId={selectedJob.job_id} 
                isJobCompleted={selectedJob.status === 'COMPLETED'} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
