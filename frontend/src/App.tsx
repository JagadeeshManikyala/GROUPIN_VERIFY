import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SingleCheckCard } from './components/SingleCheckCard';
import { UploadCard } from './components/UploadCard';
import { ValidationCard } from './components/ValidationCard';
import { ProgressCard } from './components/ProgressCard';
import { ResultsTable } from './components/ResultsTable';
import { JobsHistoryView } from './components/JobsHistoryView';
import { GroupMessenger } from './components/GroupMessenger';
import { LoginPage } from './components/LoginPage';
import { api, groupsApi } from './api';
import type { UploadResponse, JobStatusResponse, AuthUser } from './types';
import { Settings as SettingsIcon, BarChart3, MessageSquare, PhoneCall, FileSpreadsheet } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return api.getStoredUser();
  });
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState('checker');
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [activeJob, setActiveJob] = useState<JobStatusResponse | null>(null);
  const [groupsApiUrl, setGroupsApiUrl] = useState<string>('https://stag-saas-messagebot.tech-v2.groupin.app');

  useEffect(() => {
    groupsApi.getBackendConfig().then(cfg => {
      if (cfg?.base_url) setGroupsApiUrl(cfg.base_url);
      if (cfg?.use_mock !== undefined) setIsMockMode(cfg.use_mock);
    }).catch(() => {});
  }, []);


  const pollIntervalRef = useRef<any>(null);

  // Stop polling helper
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Poll Job Status when running
  useEffect(() => {
    if (!activeJob?.job_id) {
      stopPolling();
      return;
    }

    const checkStatus = async () => {
      try {
        const latest = await api.getJobStatus(activeJob.job_id);
        setActiveJob(latest);

        if (latest.status === 'COMPLETED') {
          setCurrentStep(4);
          stopPolling();
        } else if (latest.status === 'FAILED' || latest.status === 'CANCELLED') {
          stopPolling();
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    };

    if (activeJob.status === 'PROCESSING' || activeJob.status === 'VALIDATING') {
      stopPolling();
      pollIntervalRef.current = setInterval(checkStatus, 2000);
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [activeJob?.job_id, activeJob?.status]);

  // Handle successful Excel upload
  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadData(data);
    setCurrentStep(2);

    // Initial job representation
    setActiveJob({
      job_id: data.job_id,
      filename: data.filename,
      status: 'VALIDATING',
      total_numbers: data.total_numbers,
      valid_numbers: data.valid_numbers,
      invalid_numbers: data.invalid_numbers,
      duplicate_numbers: data.duplicate_numbers,
      processed_numbers: 0,
      accounts_found: 0,
      not_registered: 0,
      failed: 0,
      progress_percentage: 0,
      created_at: new Date().toISOString(),
      has_download: false,
    });
  };

  // Start Background Job
  const handleStartJob = async () => {
    if (!uploadData?.job_id) return;
    setIsStarting(true);
    try {
      await api.startJob(uploadData.job_id);
      setCurrentStep(3);
      // Fetch immediate status
      const updated = await api.getJobStatus(uploadData.job_id);
      setActiveJob(updated);
    } catch (err) {
      console.error('Failed to start job:', err);
    } finally {
      setIsStarting(false);
    }
  };

  // Cancel Job
  const handleCancelJob = async () => {
    if (!activeJob?.job_id) return;
    setIsCancelling(true);
    try {
      await api.cancelJob(activeJob.job_id);
      const updated = await api.getJobStatus(activeJob.job_id);
      setActiveJob(updated);
    } catch (err) {
      console.error('Failed to cancel job:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  // Reset to Upload Step
  const handleReset = () => {
    stopPolling();
    setUploadData(null);
    setActiveJob(null);
    setCurrentStep(1);
  };

  // Select job from history table
  const handleSelectJobFromHistory = async (jobId: string) => {
    try {
      const job = await api.getJobStatus(jobId);
      setActiveJob(job);
      setCurrentView('checker');
      setCurrentStep(job.status === 'COMPLETED' ? 4 : 3);
    } catch (err) {
      console.error('Error opening job from history:', err);
    }
  };

  // Helper for dynamic header
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'groups':
        return {
          title: 'Group Messenger',
          subtitle: 'Target rooms, broadcast media & synchronize verified members via SaaS MessageBot'
        };
      case 'upload':
        return {
          title: 'Upload & Batch Check',
          subtitle: 'Ingest spreadsheets (.xlsx, .csv) and verify numbers at scale'
        };
      case 'jobs':
        return {
          title: 'Processing Jobs',
          subtitle: 'Monitor active and queued batch verification jobs'
        };
      case 'history':
        return {
          title: 'Results History',
          subtitle: 'Audit logs, verified records, and downloadable Excel reports'
        };
      case 'reports':
        return {
          title: 'Analytics & Reports',
          subtitle: 'Performance statistics, conversion rates, and verification metrics'
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'API endpoints, authentication keys, and rate limiter configuration'
        };
      default:
        return {
          title: 'Account Checker',
          subtitle: ''
        };
    }
  };

  const headerInfo = getHeaderInfo();

  // If not authenticated, render the Enterprise Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view === 'upload') {
      setActiveTab('bulk');
    } else if (view === 'checker') {
      setActiveTab('single');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Left Sidebar */}
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          currentUser={currentUser}
          onLogout={() => {
            api.logout();
            setCurrentUser(null);
          }}
          isMockActive={isMockMode}
        />

        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {/* View: Groups & Messaging */}
          {currentView === 'groups' && (
            <GroupMessenger onNavigateToChecker={() => { setCurrentView('checker'); setActiveTab('single'); }} />
          )}

          {/* View: Account Checker / Upload & Check */}
          {(currentView === 'checker' || currentView === 'upload') && (
            <div className="space-y-6">
              {/* Tab Switcher matching Image 2 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setActiveTab('single'); setCurrentView('checker'); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    activeTab === 'single'
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-600/70 shadow-blue-500/10'
                      : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <PhoneCall className={`w-4 h-4 ${activeTab === 'single' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Single Mobile Number Check</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('bulk'); setCurrentView('upload'); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    activeTab === 'bulk'
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-600/70 shadow-blue-500/10'
                      : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'bulk' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>Bulk Upload (Excel)</span>
                </button>
              </div>

              {/* Tab 1: Single Mobile Number Check */}
              {activeTab === 'single' && (
                <SingleCheckCard 
                  onNavigateToHistory={() => setCurrentView('history')}
                  onNavigateToMessenger={() => setCurrentView('groups')}
                />
              )}

              {/* Tab 2: Bulk Upload (Excel) */}
              {activeTab === 'bulk' && (
                <div className="space-y-6">
                  {/* Step 1: Upload Card */}
                  {currentStep === 1 && (
                    <UploadCard
                      onUploadSuccess={handleUploadSuccess}
                      isLoading={isUploading}
                      setIsLoading={setIsUploading}
                    />
                  )}

                  {/* Step 2: Validation Summary Card */}
                  {currentStep === 2 && uploadData && (
                    <ValidationCard
                      uploadData={uploadData}
                      onStartJob={handleStartJob}
                      onReset={handleReset}
                      isStarting={isStarting}
                    />
                  )}

                  {/* Step 3 or 4: Progress Card */}
                  {(currentStep === 3 || (currentStep === 4 && activeJob)) && activeJob && (
                    <ProgressCard
                      job={activeJob}
                      onCancelJob={handleCancelJob}
                      isCancelling={isCancelling}
                    />
                  )}

                  {/* Step 4: Results Table */}
                  {activeJob?.job_id && (currentStep === 4 || activeJob.processed_numbers > 0) && (
                    <ResultsTable
                      jobId={activeJob.job_id}
                      isJobCompleted={activeJob.status === 'COMPLETED'}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* View: Processing Jobs or Results History */}
          {(currentView === 'jobs' || currentView === 'history') && (
            <JobsHistoryView onSelectJob={handleSelectJobFromHistory} />
          )}

          {/* View: Reports */}
          {currentView === 'reports' && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center shadow-xs">
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">Analytics & Reports</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
                Aggregate metrics and conversion analysis for Groupin customer verification campaigns.
              </p>
              <JobsHistoryView onSelectJob={handleSelectJobFromHistory} />
            </div>
          )}

          {/* View: Settings */}
          {currentView === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              {/* Account Checker Backend Settings */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  <SettingsIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Account Checker Engine</h2>
                    <p className="text-xs text-slate-500">Configure batch limits, request delays, and connection keys.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Groupin API URL</label>
                    <input
                      type="text"
                      disabled
                      value="https://api.groupin.com/v1"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono"
                    />
                    <span className="text-[11px] text-slate-400">Configured in backend .env</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Batch Size</label>
                      <input
                        type="text"
                        disabled
                        value="50 numbers / batch"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Request Delay</label>
                      <input
                        type="text"
                        disabled
                        value="150 ms (auto-throttled)"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Adapter Mode:</span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                      High-Fidelity Mock Engine (Ready for Live Switch)
                    </span>
                  </div>
                </div>
              </div>

              {/* SaaS Groups API Integration Settings */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Groups SaaS MessageBot Integration</h2>
                    <p className="text-xs text-slate-500">API endpoint, x-api-key authentication, and broadcast proxy.</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Groups API Base URL</label>
                    <input
                      type="text"
                      disabled
                      value={groupsApiUrl}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono"
                    />
                    <span className="text-[11px] text-slate-400">Configured in backend .env (GROUPS_API_URL)</span>
                  </div>


                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Direct vs Proxy Architecture</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active & Protected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Frontend requests can route directly to the staging SaaS service using the <code>x-api-key</code> header or pass through <code>/api/groupin/groups/*</code> to eliminate CORS obstacles and provide resilient offline mock fallback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
