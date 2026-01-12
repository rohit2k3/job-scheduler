'use client';

import { useEffect, useState } from 'react';
import { History, Filter, RefreshCw, Calendar } from 'lucide-react';
import { ImportLogRow, Pagination } from '@/components';
import { getImportLogs } from '@/lib/api';
import type { ImportLog, Pagination as PaginationType } from '@/types';

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await getImportLogs({
        page,
        limit,
        status: status || undefined,
      });
      setLogs(response.data);
      setPagination(response.pagination || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch import logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, status]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <History className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Import History</h1>
            <p className="text-slate-400 text-sm">View all import runs and their results</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-400">Filter by status:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['', 'completed', 'processing', 'failed', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`
                px-3 py-1.5 text-sm rounded-lg transition-all
                ${status === s
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }
              `}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="flex items-center px-6 py-4 bg-slate-800 border-b border-slate-700/50 text-sm font-medium text-slate-400">
              <div className="w-8"></div>
              <div className="flex-1">Feed URL / Source</div>
              <div className="grid grid-cols-4 gap-8 text-center w-[280px]">
                <span>Total</span>
                <span>New</span>
                <span>Updated</span>
                <span>Failed</span>
              </div>
              <div className="w-32 text-center">Status</div>
              <div className="w-40 text-right">Time</div>
            </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Calendar className="w-12 h-12 mb-4" />
            <p>No import logs found</p>
          </div>
        ) : (
          logs.map((log) => (
            <ImportLogRow key={log._id} log={log} />
          ))
        )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Info */}
      {pagination && (
        <div className="text-center mt-4 text-sm text-slate-500">
          Showing {logs.length} of {pagination.total} import logs
        </div>
      )}
    </div>
  );
}
