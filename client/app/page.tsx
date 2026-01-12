'use client';

import { useEffect, useState } from 'react';
import { 
  Briefcase, 
  Download, 
  TrendingUp, 
  Clock, 
  Play,
  RefreshCw,
  Database,
  Zap
} from 'lucide-react';
import { StatsCard } from '@/components';
import { getImportStats, getQueueStatus, triggerImport } from '@/lib/api';
import type { ImportStats, QueueStats, CronStatus } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [queueStatus, setQueueStatus] = useState<{ queue: QueueStats; cron: CronStatus } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, queueRes] = await Promise.all([
        getImportStats(),
        getQueueStatus(),
      ]);
      setStats(statsRes.data);
      setQueueStatus(queueRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerImport = async () => {
    try {
      setIsTriggering(true);
      await triggerImport();
      // Refresh data after triggering
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to trigger import');
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Monitor your job import system</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleTriggerImport}
            disabled={isTriggering || queueStatus?.cron.isRunning}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
              ${isTriggering || queueStatus?.cron.isRunning
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
              }
            `}
          >
            {isTriggering ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isTriggering ? 'Triggering...' : 'Trigger Import'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Jobs"
          value={stats?.totalJobs || 0}
          icon={Briefcase}
          color="indigo"
        />
        <StatsCard
          title="Total Imports"
          value={stats?.totalImports || 0}
          icon={Download}
          color="emerald"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats?.successRate || 0}%`}
          icon={TrendingUp}
          color="amber"
        />
        <StatsCard
          title="Jobs (Last 24h)"
          value={stats?.recentJobCount || 0}
          icon={Clock}
          color="rose"
        />
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Queue Stats */}
        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Queue Status</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-amber-400">{queueStatus?.queue.waiting || 0}</p>
              <p className="text-sm text-slate-500">Waiting</p>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">{queueStatus?.queue.active || 0}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg">
              <p className="text-2xl font-bold text-rose-400">{queueStatus?.queue.failed || 0}</p>
              <p className="text-sm text-slate-500">Failed</p>
            </div>
          </div>
        </div>

        {/* Cron Status */}
        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Cron Job</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${queueStatus?.cron.enabled ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                <span className={queueStatus?.cron.enabled ? 'text-emerald-400' : 'text-slate-500'}>
                  {queueStatus?.cron.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Schedule</span>
              <span className="text-white font-mono">{queueStatus?.cron.schedule || '-'}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
              <span className="text-slate-400">Running</span>
              <span className={queueStatus?.cron.isRunning ? 'text-amber-400' : 'text-slate-500'}>
                {queueStatus?.cron.isRunning ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs by Source */}
      {stats?.jobsBySource && stats.jobsBySource.length > 0 && (
        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Jobs by Source</h2>
          <div className="space-y-3">
            {stats.jobsBySource.map((source) => {
              const percentage = stats.totalJobs > 0 
                ? (source.count / stats.totalJobs) * 100 
                : 0;
              
              return (
                <div key={source._id} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-slate-400 truncate">{source._id}</div>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm text-slate-300">
                    {source.count.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
