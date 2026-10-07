import React, { useState, useEffect } from 'react';
import { RotateCw, Download } from 'lucide-react';
import { api } from '../api';

interface JobsHistoryViewProps {
  onSelectJob: (jobId: string) => void;
}

export const JobsHistoryView: React.FC<JobsHistoryViewProps> = ({ onSelectJob }) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Job History & Audit Log</h2>
          <p className="text-xs text-slate-500">
            View all uploaded batches, past verification jobs, and download archived results.
          </p>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4">Job ID</th>
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
                    {new Date(j.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectJob(j.job_id)}
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
  );
};
