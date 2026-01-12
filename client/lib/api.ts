import axios from 'axios';
import type { 
  ApiResponse, 
  ImportLog, 
  ImportStats, 
  Job, 
  JobSource, 
  JobStats,
  QueueStats,
  CronStatus,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Import Logs
export const getImportLogs = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  sourceId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<ImportLog[]>> => {
  const response = await api.get('/import-logs', { params });
  return response.data;
};

export const getImportLogById = async (id: string): Promise<ApiResponse<ImportLog>> => {
  const response = await api.get(`/import-logs/${id}`);
  return response.data;
};

// Import Actions
export const triggerImport = async (sourceId?: string): Promise<ApiResponse<any>> => {
  const response = await api.post('/import/trigger', { sourceId });
  return response.data;
};

export const getImportStats = async (): Promise<ApiResponse<ImportStats>> => {
  const response = await api.get('/import/stats');
  return response.data;
};

export const getQueueStatus = async (): Promise<ApiResponse<{ queue: QueueStats; cron: CronStatus }>> => {
  const response = await api.get('/import/queue');
  return response.data;
};

// Job Sources
export const getJobSources = async (): Promise<ApiResponse<JobSource[]>> => {
  const response = await api.get('/sources');
  return response.data;
};

export const toggleJobSource = async (id: string): Promise<ApiResponse<JobSource>> => {
  const response = await api.patch(`/sources/${id}/toggle`);
  return response.data;
};

// Jobs
export const getJobs = async (params?: {
  page?: number;
  limit?: number;
  sourceId?: string;
  category?: string;
  jobType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ApiResponse<Job[]>> => {
  const response = await api.get('/jobs', { params });
  return response.data;
};

export const getJobById = async (id: string): Promise<ApiResponse<Job>> => {
  const response = await api.get(`/jobs/${id}`);
  return response.data;
};

export const getJobStats = async (): Promise<ApiResponse<JobStats>> => {
  const response = await api.get('/jobs/stats');
  return response.data;
};

export default api;
