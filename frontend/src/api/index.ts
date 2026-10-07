import axios from 'axios';
import type {
  UploadResponse,
  JobStatusResponse,
  ResultsPageResponse,
  SingleCheckResponse
} from '../types';

const API_BASE = '/api/groupin';

export const api = {
  // Download Sample Template
  getSampleTemplateUrl: () => `${API_BASE}/sample-template`,

  // Check Single Number
  checkSingleNumber: async (mobile_number: string): Promise<SingleCheckResponse> => {
    const res = await axios.post<SingleCheckResponse>(`${API_BASE}/check`, { mobile_number });
    return res.data;
  },

  // Upload Excel File
  uploadExcel: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post<UploadResponse>(`${API_BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  // Start Background Job
  startJob: async (jobId: string) => {
    const res = await axios.post(`${API_BASE}/jobs/${jobId}/start`);
    return res.data;
  },

  // Get Live Job Status
  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const res = await axios.get<JobStatusResponse>(`${API_BASE}/jobs/${jobId}`);
    return res.data;
  },

  // Get Results with Pagination & Filtering
  getJobResults: async (
    jobId: string,
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    status?: string
  ): Promise<ResultsPageResponse> => {
    const params: any = { page, page_size: pageSize };
    if (search && search.trim()) params.search = search.trim();
    if (status && status !== 'ALL') params.status = status;

    const res = await axios.get<ResultsPageResponse>(`${API_BASE}/jobs/${jobId}/results`, { params });
    return res.data;
  },

  // Download Job Result Excel URL
  getDownloadResultUrl: (jobId: string) => `${API_BASE}/jobs/${jobId}/download`,

  // Cancel Job
  cancelJob: async (jobId: string) => {
    const res = await axios.post(`${API_BASE}/jobs/${jobId}/cancel`);
    return res.data;
  },

  // List recent jobs
  getRecentJobs: async () => {
    const res = await axios.get(`${API_BASE}/jobs`);
    return res.data;
  },

  // Authentication
  login: async (username: string, password: string): Promise<any> => {
    const res = await axios.post('/api/auth/login', { username, password });
    if (res.data?.access_token) {
      localStorage.setItem('groupin_auth_token', res.data.access_token);
      localStorage.setItem('groupin_auth_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('groupin_auth_token');
    localStorage.removeItem('groupin_auth_user');
  },

  getStoredUser: () => {
    try {
      const u = localStorage.getItem('groupin_auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  getStoredToken: () => {
    return localStorage.getItem('groupin_auth_token');
  }
};

export * from './groupsClient';


