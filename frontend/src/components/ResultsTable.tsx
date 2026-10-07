import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { api } from '../api';
import type { ResultsPageResponse, AccountResultItem } from '../types';

interface ResultsTableProps {
  jobId: string;
  isJobCompleted: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ jobId, isJobCompleted }) => {
  const [data, setData] = useState<ResultsPageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchResults = async (newPage: number = page, term: string = search, status: string = statusFilter) => {
    setLoading(true);
    try {
      const res = await api.getJobResults(jobId, newPage, pageSize, term, status);
      setData(res);
      setPage(newPage);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchResults(1, search, statusFilter);
    }
  }, [jobId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(1, search, statusFilter);
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchResults(1, search, status);
  };

  const items: AccountResultItem[] = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Verification Results</h2>
          <p className="text-xs text-slate-500">
            Showing {items.length} of {total.toLocaleString()} records • Search and filter verified numbers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search phone, name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 placeholder-slate-400"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          </form>

          {/* Refresh Button */}
          <button
            onClick={() => fetchResults(page, search, statusFilter)}
            disabled={loading}
            title="Refresh Results"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Download Button */}
          {isJobCompleted && (
            <a
              href={api.getDownloadResultUrl(jobId)}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </a>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-5 border-b border-slate-100 flex gap-2 overflow-x-auto bg-slate-50/50 py-2">
        {[
          { id: 'ALL', label: 'All Results' },
          { id: 'EXISTS', label: 'Groupin Account (YES)' },
          { id: 'NOT_EXISTS', label: 'Not Registered (NO)' },
          { id: 'Failed', label: 'Failed / Retried' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleFilterChange(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-white text-blue-700 font-semibold shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Mobile Number</th>
              <th className="py-3 px-4">Groupin Account</th>
              <th className="py-3 px-4">Groupin User ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4">Checked At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Loading verification records...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No records match your query.
                </td>
              </tr>
            ) : (
              items.map((row, idx) => {
                const rowNum = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                      {rowNum}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                      {row.mobile_number}
                    </td>
                    <td className="py-2.5 px-4">
                      {row.groupin_account_exists ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          NO
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {row.groupin_user_id || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {row.name || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      {row.status === 'Active' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : row.status === 'Suspended' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Suspended
                        </span>
                      ) : row.status === 'Failed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200" title={row.error || 'API Error'}>
                          Failed
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(row.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing page <span className="font-semibold text-slate-900">{page}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span> ({total.toLocaleString()} total rows)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchResults(page - 1, search, statusFilter)}
            disabled={page <= 1 || loading}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <button
            onClick={() => fetchResults(page + 1, search, statusFilter)}
            disabled={page >= totalPages || loading}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
