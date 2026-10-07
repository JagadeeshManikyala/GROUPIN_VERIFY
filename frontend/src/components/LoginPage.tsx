import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import type { AuthUser } from '../types';
import logoImg from '../assets/image.png';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.login(identifier.trim(), password.trim());
      if (data?.access_token) {
        onLoginSuccess(data.user || {
          email: identifier.trim(),
          name: 'Admin User',
          role: 'admin'
        });
      } else {
        setError('Invalid login response from server.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Authentication failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden select-none py-10 px-4"
      style={{
        background: 'radial-gradient(circle at 50% 15%, #7e22ce 0%, #581c87 40%, #3b0764 75%, #2e1065 100%)'
      }}
    >
      {/* Decorative glowing ambient purple/violet orbs */}
      <div className="absolute top-[-8%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-400/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-fuchsia-500/20 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[350px] h-[350px] rounded-full bg-violet-400/15 blur-[100px] pointer-events-none" />

      {/* Subtle Dot Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }} 
      />

      <div className="relative z-10 max-w-md w-full mx-auto">
        {/* Logo without background rectangle */}
        <div className="flex justify-center mb-6">
          <img 
            src={logoImg} 
            alt="Logo" 
            className="w-24 h-24 object-contain filter drop-shadow-xl" 
          />
        </div>

        {/* Crisp White Login Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-9 shadow-2xl shadow-purple-950/60 border border-purple-100/80 text-slate-900 transition-all">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign in to Dashboard
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-600 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold cursor-pointer">
                  
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-purple-600" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-600 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-lg shadow-purple-600/35 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
