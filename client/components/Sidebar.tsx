'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  History, 
  Briefcase, 
  Settings,
  Database,
  Zap,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/import-history', label: 'Import History', icon: History },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/sources', label: 'Sources', icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button - Visible only on mobile */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg text-white border border-slate-700 shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700/50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Close Button - Mobile Only */}
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Job Importer</h1>
              <p className="text-xs text-slate-400">Admin Dashboard</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-500/20 text-indigo-400 border-l-2 border-indigo-500' 
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}
