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
import { formatTime, formatDateTime } from '../utils/date';

interface ResultsTableProps {
  jobId: string;
  isJobCompleted: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ jobId, isJobCompleted }) => {
  const [data, setData] = useState<ResultsPageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchResults = async (
    newPage: number = page, 
    term: string = search, 
    status: string = statusFilter,
    currentPageSize: number = pageSize
  ) => {
    setLoading(true);
    try {
      const res = await api.getJobResults(jobId, newPage, currentPageSize, term, status);
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
      fetchResults(1, search, statusFilter, pageSize);
    }
  }, [jobId, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResults(1, search, statusFilter, pageSize);
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchResults(1, search, status, pageSize);
  };

  const items: AccountResultItem[] = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || Math.ceil(total / pageSize) || 1;

  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(total, (page - 1) * pageSize + items.length);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Verification Results</h2>
          <p className="text-xs text-slate-500">
            Showing {startIdx} to {endIdx} of {total.toLocaleString()} records • Search and filter verified numbers
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
            type="button"
            onClick={() => fetchResults(page, search, statusFilter, pageSize)}
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
            type="button"
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
              <th className="py-3 px-4 w-12 text-center">S.No</th>
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
                    <td 
                      className="py-2.5 px-4 text-slate-500 font-mono text-[11px]"
                      title={formatDateTime(row.checked_at)}
                    >
                      {formatTime(row.checked_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div>
            Showing <span className="font-semibold text-slate-900">{startIdx}</span> to{' '}
            <span className="font-semibold text-slate-900">{endIdx}</span> of{' '}
            <span className="font-semibold text-slate-900">{total.toLocaleString()}</span> records
            {totalPages > 1 && (
              <span className="text-slate-400 ml-1">
                (Page {page} of {totalPages})
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setPageSize(newSize);
                setPage(1);
                fetchResults(1, search, statusFilter, newSize);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchResults(Math.max(1, page - 1), search, statusFilter, pageSize)}
            disabled={page <= 1 || loading}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
            title="Previous page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => fetchResults(pg, search, statusFilter, pageSize)}
                disabled={loading}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                  page === pg
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchResults(Math.min(totalPages, page + 1), search, statusFilter, pageSize)}
            disabled={page >= totalPages || loading}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
            title="Next page"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
