'use client';

import { useEffect, useState } from 'react';
import { Database, RefreshCw, ExternalLink, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { getJobSources, toggleJobSource } from '@/lib/api';
import type { JobSource } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components';

export default function SourcesPage() {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      setIsLoading(true);
      const response = await getJobSources();
      setSources(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sources');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      setTogglingId(id);
      const response = await toggleJobSource(id);
      setSources(sources.map(s => s._id === id ? response.data : s));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to toggle source');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Database className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Job Sources</h1>
            <p className="text-slate-400 text-sm">Manage your job feed sources</p>
          </div>
        </div>
        <button
          onClick={fetchSources}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          {error}
        </div>
      )}

      {/* Sources Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Database className="w-12 h-12 mb-4" />
          <p>No sources configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => (
            <div 
              key={source._id}
              className={`
                p-5 bg-slate-800/50 border rounded-xl transition-all
                ${source.enabled 
                  ? 'border-slate-700/50 hover:bg-slate-800' 
                  : 'border-slate-700/30 opacity-60'
                }
              `}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">
                      {source.name}
                    </h3>
                    {source.lastFetchStatus && (
                      <StatusBadge status={source.lastFetchStatus} size="sm" />
                    )}
                  </div>
                  <a 
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-slate-400 hover:text-indigo-400 flex items-center gap-1 truncate max-w-full break-all"
                  >
                    <span className="truncate">{source.url}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>

                <button
                  onClick={() => handleToggle(source._id)}
                  disabled={togglingId === source._id}
                  className={`
                    p-2 rounded-lg transition-all self-end md:self-start
                    ${source.enabled 
                      ? 'text-emerald-400 hover:bg-emerald-500/10' 
                      : 'text-slate-500 hover:bg-slate-700'
                    }
                  `}
                >
                  {togglingId === source._id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : source.enabled ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 pt-4 border-t border-slate-700/50 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Source ID:</span>
                  <code className="px-2 py-1 bg-slate-900 rounded text-slate-300">
                    {source.sourceId}
                  </code>
                </div>
                {source.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Category:</span>
                    <span className="text-slate-300">{source.category}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-slate-300 uppercase">{source.type}</span>
                </div>
                {source.lastFetchedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Last fetched:</span>
                    <span className="text-slate-300">
                      {formatDistanceToNow(new Date(source.lastFetchedAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>

              {source.lastFetchError && (
                <div className="mt-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                  <p className="text-sm text-rose-400">{source.lastFetchError}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 text-sm text-slate-500 text-center">
        {sources.filter(s => s.enabled).length} of {sources.length} sources enabled
      </div>
    </div>
  );
}
