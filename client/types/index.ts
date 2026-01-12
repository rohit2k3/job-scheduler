// Import Log types
export interface FailedJob {
  externalId: string;
  title?: string;
  reason: 'validation_error' | 'db_error' | 'duplicate' | 'parse_error' | 'unknown';
  message: string;
}

export interface ImportLog {
  _id: string;
  timestamp: string;
  fileName: string;
  sourceId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: FailedJob[];
  failedCount: number;
  duration?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// Job types
export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
  period?: string;
}

export interface Job {
  _id: string;
  externalId: string;
  sourceId: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  jobType?: string;
  category?: string;
  region?: string;
  salary?: JobSalary;
  url?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Job Source types
export interface JobSource {
  _id: string;
  name: string;
  url: string;
  type: 'xml' | 'json' | 'rss';
  sourceId: string;
  category?: string;
  enabled: boolean;
  lastFetchedAt?: string;
  lastFetchStatus?: 'success' | 'failed' | 'pending';
  lastFetchError?: string;
  createdAt: string;
  updatedAt: string;
}

// Statistics types
export interface SourceStats {
  _id: string;
  count: number;
}

export interface DailyStats {
  _id: string;
  count: number;
}

export interface ImportStats {
  totalJobs: number;
  totalImports: number;
  successRate: number;
  recentJobCount: number;
  jobsBySource: SourceStats[];
  recentImports: ImportLog[];
}

export interface JobStats {
  totalJobs: number;
  jobsByCategory: SourceStats[];
  jobsBySource: SourceStats[];
  jobsByType: SourceStats[];
  recentJobsByDay: DailyStats[];
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

export interface CronStatus {
  enabled: boolean;
  schedule: string;
  isRunning: boolean;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: {
    message: string;
    stack?: string;
  };
}
