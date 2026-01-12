interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'success';
  size?: 'sm' | 'md';
}

const statusStyles = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  return (
    <span className={`
      inline-flex items-center rounded-full font-medium border
      ${statusStyles[status]}
      ${sizeClasses}
    `}>
      <span className={`
        w-1.5 h-1.5 rounded-full mr-1.5
        ${status === 'pending' ? 'bg-amber-400' : ''}
        ${status === 'processing' ? 'bg-blue-400' : ''}
        ${status === 'completed' || status === 'success' ? 'bg-emerald-400' : ''}
        ${status === 'failed' ? 'bg-rose-400' : ''}
      `} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
