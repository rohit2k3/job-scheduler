'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Search, RefreshCw, ExternalLink, MapPin, Building2 } from 'lucide-react';
import { Pagination } from '@/components';
import { getJobs } from '@/lib/api';
import type { Job, Pagination as PaginationType } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getJobs({
        page,
        limit,
        search: search || undefined,
      });
      setJobs(response.data);
      setPagination(response.pagination || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchJobs();
    }, search ? 300 : 0);

    return () => clearTimeout(debounce);
  }, [page, search]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Imported Jobs</h1>
            <p className="text-slate-400 text-sm">Browse all imported job listings</p>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search jobs by title, company, or description..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          {error}
        </div>
      )}

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Briefcase className="w-12 h-12 mb-4" />
          <p>No jobs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div 
              key={job._id}
              className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate pr-4">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    {job.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {job.company}
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                    )}
                  </div>
                </div>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              
              {job.description && (
                <p className="mt-3 text-sm text-slate-400 line-clamp-2">
                  {job.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  {job.category && (
                    <span className="px-2 py-1 text-xs bg-indigo-500/10 text-indigo-400 rounded">
                      {job.category}
                    </span>
                  )}
                  {job.jobType && (
                    <span className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                      {job.jobType}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
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
          Showing {jobs.length} of {pagination.total.toLocaleString()} jobs
        </div>
      )}
    </div>
  );
}
