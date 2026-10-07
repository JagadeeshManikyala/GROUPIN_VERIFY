import React, { useState } from 'react';
import { 
  PhoneCall, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  RefreshCw, 
  Mail, 
  Phone, 
  Info, 
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../api';
import type { SingleCheckResponse } from '../types';

interface RecentCheckItem {
  id: number;
  mobile_number: string;
  account_exists: boolean;
  user_id?: string | null;
  name?: string | null;
  checked_at: string;
}

interface SingleCheckCardProps {
  onNavigateToHistory?: () => void;
  onNavigateToMessenger?: () => void;
}

export const SingleCheckCard: React.FC<SingleCheckCardProps> = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingNumber, setVerifyingNumber] = useState('');
  const [result, setResult] = useState<SingleCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setCheckedAtTime] = useState<string>('');

  // Pagination & Clear modal state
  const [currentPage, setCurrentPage] = useState(1);
  const [showClearModal, setShowClearModal] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  // Recent checks state - strictly records real API checks performed by the user
  const [recentChecks, setRecentChecks] = useState<RecentCheckItem[]>(() => {
    try {
      const saved = localStorage.getItem('groupin_recent_single_checks');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((item: any) => item.name !== 'Ravi Kumar' && item.name !== 'Anita Sharma');
      }
    } catch {}
    return [];
  });

  const saveRecentChecks = (items: RecentCheckItem[]) => {
    setRecentChecks(items);
    try {
      localStorage.setItem('groupin_recent_single_checks', JSON.stringify(items));
    } catch {}
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.trim().replace(/\s+/g, '');
    if (!cleanDigits) return;

    // Default to Indian numbers (+91)
    let fullNumber = cleanDigits;
    if (!cleanDigits.startsWith('+') && !cleanDigits.startsWith('91')) {
      fullNumber = `+91 ${cleanDigits}`;
    }

    setVerifyingNumber(fullNumber);
    setLoading(true);
    setError(null);
    setResult(null);

    const nowStr = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '');

    setCheckedAtTime(nowStr);

    try {
      const data = await api.checkSingleNumber(cleanDigits);
      setResult(data);

      // Add to recent checks
      const newItem: RecentCheckItem = {
        id: Date.now(),
        mobile_number: data.mobile_number || fullNumber,
        account_exists: data.account_exists,
        user_id: data.user_id || null,
        name: data.name || null,
        checked_at: nowStr
      };

      const updated = [newItem, ...recentChecks];
      saveRecentChecks(updated);
      setCurrentPage(1); // Jump to first page to see latest check
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Verification service temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(recentChecks.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, recentChecks.length);
  const currentItems = recentChecks.slice(startIndex, endIndex);

  // Extended profile data (if provided by API)
  const profileDetails = result
    ? [
        { label: 'Mobile Number',      value: result.mobile_number,   icon: <PhoneCall className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Groupin User ID',    value: result.user_id,          icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Name',               value: result.name,             icon: <User className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Email',              value: result.email,            icon: <Mail className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Date of Birth',      value: result.dob,              icon: <Calendar className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Alternate Phone',    value: result.alternate_phone,  icon: <Phone className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'About',              value: result.about,            icon: <Info className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Location',           value: result.location,         icon: <MapPin className="w-3.5 h-3.5 text-blue-500" /> },
        { label: 'Registered On',      value: result.registered_on,    icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" /> },
      ].filter(r => r.value)
    : [];

  const additionalRows: { label: string; value: string | boolean | null | undefined; icon: React.ReactNode }[] = result
    ? [
        { label: 'User Type',   value: result.user_type,   icon: <Star className="w-3 h-3 text-blue-500" /> },
        { label: 'Last Active', value: result.last_active, icon: <Calendar className="w-3 h-3 text-blue-500" /> },
        { label: 'Verified',    value: result.verified != null ? (result.verified ? 'Yes' : 'No') : null, icon: <ShieldCheck className="w-3 h-3 text-emerald-500" /> },
      ].filter(r => r.value != null && r.value !== '')
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Enter Mobile Number Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Enter Mobile Number</h2>
        </div>
        <p className="text-xs text-slate-500 mb-5 ml-9">
          Enter a mobile number to check if it has a Groupin account.
        </p>

        <form onSubmit={handleCheck} className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Fixed Indian Country Code Prefix (+91) */}
            <div className="flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm rounded-xl py-2.5 px-4 select-none shrink-0 shadow-2xs">
              +91
            </div>

            {/* Mobile number input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter 10-digit mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !phoneNumber.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check Account</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* While Checking state banner */}
        {loading && (
          <div className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center gap-3 animate-in fade-in">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
            <div>
              <span className="font-bold">Checking Groupin account...</span>
              <span className="text-blue-700 ml-2">⟳ Verifying {verifyingNumber}</span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Result: Account Found */}
        {result && result.account_exists && (
          <div className="mt-6 rounded-2xl border border-emerald-200/90 bg-emerald-50/40 p-6 shadow-xs animate-in fade-in">
            {/* Top Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-200/60 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-emerald-950">✓ Groupin Account Found</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    This mobile number is registered with a Groupin account.
                  </p>
                </div>
              </div>
              <div className="font-mono font-bold text-sm text-emerald-900 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 self-start sm:self-auto shadow-2xs">
                {result.mobile_number}
              </div>
            </div>

            {/* Extended Profile Fields (shown when API returns profile info) */}
            {profileDetails.length > 1 && (
              <div className="mt-5 pt-4 border-t border-emerald-200/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {profileDetails.map((field, idx) => (
                    <div key={idx} className="bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                      <div className="p-1.5 bg-emerald-50 rounded-lg shrink-0 mt-0.5">
                        {field.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-slate-400">{field.label}</div>
                        <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{field.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional meta attributes */}
            {additionalRows.length > 0 && (
              <div className="mt-4 pt-4 border-t border-emerald-200/50">
                <div className="flex flex-wrap gap-3">
                  {additionalRows.map((row, idx) => (
                    <div key={idx} className="bg-white/90 px-3.5 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2 text-xs">
                      {row.icon}
                      <span className="text-slate-500 font-medium">{row.label}:</span>
                      <span className="font-bold text-slate-800">{String(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result: Account Not Found */}
        {result && !result.account_exists && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base text-rose-950">✕ No Groupin Account Found</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  This mobile number is not registered with a Groupin account.
                </p>
              </div>
              <div className="font-mono font-bold text-sm text-rose-900 bg-white px-3 py-1.5 rounded-xl border border-rose-200">
                {result.mobile_number}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Recent Checks Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Recent Checks</h3>
            {recentChecks.length > 0 && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {recentChecks.length}
              </span>
            )}
          </div>

          {/* Clear All button with Warning Confirmation */}
          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            disabled={recentChecks.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-xs font-semibold text-slate-600 hover:text-rose-600 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 w-16">S.No</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Checked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentChecks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No recent checks recorded. Enter a mobile number above to verify real account status.
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {item.mobile_number}
                    </td>
                    <td className="py-3 px-4">
                      {item.account_exists ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Found
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Not Found
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {item.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.checked_at}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {recentChecks.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500 mt-4">
            <div className="flex items-center gap-3">
              <div>
                Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
                <span className="font-semibold text-slate-800">{recentChecks.length}</span> numbers
              </div>

              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
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
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                title="Next page"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear All Warning Confirmation Modal */}
      {showClearModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowClearModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowClearModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Clear All Recent Checks?
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to clear all recent checks? This will permanently remove {recentChecks.length} verification record{recentChecks.length === 1 ? '' : 's'} from your view.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  saveRecentChecks([]);
                  setCurrentPage(1);
                  setShowClearModal(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs hover:shadow transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear All</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
