import React, { useState } from 'react';
import { 
  PhoneCall, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  ExternalLink, 
  MessageSquare, 
  ChevronDown,
  User,
  MapPin,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Mail,
  Phone,
  Info,
  Star
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

export const SingleCheckCard: React.FC<SingleCheckCardProps> = ({ 
  onNavigateToHistory,
  onNavigateToMessenger
}) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingNumber, setVerifyingNumber] = useState('');
  const [result, setResult] = useState<SingleCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkedAtTime, setCheckedAtTime] = useState<string>('');

  // Recent checks state - strictly records real API checks performed by the user
  const [recentChecks, setRecentChecks] = useState<RecentCheckItem[]>(() => {
    try {
      const saved = localStorage.getItem('groupin_recent_single_checks');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out any prior dummy sample records so only real user checks are displayed
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

    // Combine country code if user didn't type it
    let fullNumber = cleanDigits;
    if (!cleanDigits.startsWith('+') && !cleanDigits.startsWith('91')) {
      fullNumber = `${countryCode} ${cleanDigits}`;
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
      saveRecentChecks([newItem, ...recentChecks.slice(0, 9)]);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to verify mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const hasExtraDetails = Boolean(
    result?.name || result?.user_id || result?.email || result?.dob ||
    result?.alternate_phone || result?.about || result?.location
  );
  const initials = result?.name
    ? result.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'GP';

  // Build a profile row helper
  const profileRows: { label: string; value: string | null | undefined; icon: React.ReactNode }[] = result
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
            {/* Country code selector */}
            <div className="relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-sm rounded-xl py-2.5 pl-3.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition cursor-pointer"
              >
                <option value="+91">+91 (IN)</option>
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+971">+971 (AE)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Mobile number input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="7659955053"
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

          <p className="text-xs text-slate-400 pl-1">
            Enter 10 digit mobile number or with country code (e.g. 9876543210 or +919876543210)
          </p>
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

              <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {result.status || 'Active'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Checked at {checkedAtTime || 'Just now'}
                </span>
              </div>
            </div>

            {/* Conditional: if only exists:true returned with no profile info */}
            {!hasExtraDetails ? (
              <div className="pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Registered Mobile Number:</span>
                <span className="font-mono font-bold text-sm text-slate-900 bg-white px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-xs">
                  {result.mobile_number}
                </span>
              </div>
            ) : (
              /* Rich profile section */
              <div className="pt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile key-value table */}
                <div className="lg:col-span-2 bg-white/80 rounded-xl border border-emerald-200/70 p-4 shadow-xs">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {profileRows.map((row) => (
                        <tr key={row.label}>
                          <td className="py-2.5 w-40">
                            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                              {row.icon}
                              {row.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-900 font-semibold">
                            {row.label === 'Account Status' ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {row.value}
                              </span>
                            ) : (
                              <span className={row.label === 'Mobile Number' || row.label === 'Alternate Phone' || row.label === 'Groupin User ID' ? 'font-mono' : ''}>
                                {row.value}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {/* Always show account status */}
                      <tr>
                        <td className="py-2.5">
                          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            Account Status
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {result.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Right: Avatar + actions */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-emerald-200/70 p-4 shadow-xs flex flex-col justify-between text-center">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-xs">
                      {initials}
                    </div>
                    <div className="font-bold text-sm text-slate-900">{result.name || 'Groupin Member'}</div>
                    <div className="text-[11px] text-slate-400">
                      {result.user_type ? result.user_type + ' User' : 'Groupin User'}
                    </div>
                    {result.verified != null && (
                      <div className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${result.verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                        <ShieldCheck className="w-3 h-3" />
                        {result.verified ? 'Verified' : 'Unverified'}
                      </div>
                    )}
                    {result.location && (
                      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {result.location}
                      </div>
                    )}
                    {result.about && (
                      <p className="mt-2 text-[11px] text-slate-500 italic leading-relaxed px-1">
                        "{result.about}"
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>View in Groupin</span>
                    </button>
                    <button
                      type="button"
                      onClick={onNavigateToMessenger}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-600/20 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information row (user_type, last_active, verified) */}
            {additionalRows.length > 0 && hasExtraDetails && (
              <div className="mt-5 pt-4 border-t border-emerald-200/60">
                <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Additional Information</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {additionalRows.map((row) => (
                    <div key={row.label} className="p-3 rounded-xl bg-white/90 border border-slate-100">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                        {row.icon}
                        <span>{row.label}</span>
                      </div>
                      <div className={`font-bold ${row.label === 'Verified' && row.value === 'Yes' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {String(row.value)}
                      </div>
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

      {/* 2. Recent Checks Table Card (From Image 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">Recent Checks</h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>View All History</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Checked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentChecks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No recent checks recorded. Enter a mobile number above to verify real account status.
                  </td>
                </tr>
              ) : (
                recentChecks.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">{index + 1}</td>
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
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.user_id || '-'}
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
      </div>
    </div>
  );
};
