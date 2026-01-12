'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import type { ImportLog } from '@/types';
import StatusBadge from './StatusBadge';

interface ImportLogRowProps {
  log: ImportLog;
}

export default function ImportLogRow({ log }: ImportLogRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      {/* Main Row */}
      <div 
        className="flex items-center px-6 py-4 hover:bg-slate-800/50 cursor-pointer transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand Icon */}
        <div className="w-8">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {/* Feed URL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-200 font-medium truncate" title={log.fileName}>
              {truncateUrl(log.fileName)}
            </span>
            <a 
              href={log.fileName} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-500 hover:text-indigo-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {log.sourceId}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-lg font-semibold text-white">{log.totalFetched}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-400">{log.newJobs}</p>
            <p className="text-xs text-slate-500">New</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-amber-400">{log.updatedJobs}</p>
            <p className="text-xs text-slate-500">Updated</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-rose-400">{log.failedCount}</p>
            <p className="text-xs text-slate-500">Failed</p>
          </div>
        </div>

        {/* Status */}
        <div className="w-32 text-center">
          <StatusBadge status={log.status} size="sm" />
        </div>

        {/* Time */}
        <div className="w-40 text-right">
          <p className="text-sm text-slate-300">
            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
          </p>
          <p className="text-xs text-slate-500">
            {formatDuration(log.duration)}
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Details</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Full URL:</dt>
                  <dd className="text-slate-300 truncate max-w-xs" title={log.fileName}>{log.fileName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Timestamp:</dt>
                  <dd className="text-slate-300">{format(new Date(log.timestamp), 'PPpp')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Duration:</dt>
                  <dd className="text-slate-300">{formatDuration(log.duration)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Total Imported:</dt>
                  <dd className="text-slate-300">{log.totalImported}</dd>
                </div>
              </dl>
            </div>

            {log.failedJobs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">
                  Failed Jobs ({log.failedJobs.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {log.failedJobs.slice(0, 10).map((failed, idx) => (
                    <div key={idx} className="text-sm p-2 bg-rose-500/5 rounded border border-rose-500/10">
                      <p className="text-rose-400 font-medium">{failed.title || failed.externalId}</p>
                      <p className="text-slate-500 text-xs">
                        {failed.reason}: {failed.message}
                      </p>
                    </div>
                  ))}
                  {log.failedJobs.length > 10 && (
                    <p className="text-xs text-slate-500">
                      ... and {log.failedJobs.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {log.error && (
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-rose-400 mb-2">Error</h4>
                <p className="text-sm text-rose-300 bg-rose-500/5 p-3 rounded border border-rose-500/10">
                  {log.error}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
