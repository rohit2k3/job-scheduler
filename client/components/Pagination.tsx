import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = [];
  const showPages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  const endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage + 1 < showPages) {
    startPage = Math.max(1, endPage - showPages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${currentPage === 1 
            ? 'text-slate-600 cursor-not-allowed' 
            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          }
        `}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            1
          </button>
          {startPage > 2 && <span className="text-slate-600">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`
            px-3 py-2 rounded-lg font-medium transition-all duration-200
            ${page === currentPage 
              ? 'bg-indigo-500 text-white' 
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }
          `}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-600">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${currentPage === totalPages 
            ? 'text-slate-600 cursor-not-allowed' 
            : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          }
        `}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
