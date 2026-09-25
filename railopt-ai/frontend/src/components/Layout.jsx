import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/submit-request', label: 'Submit Request', icon: 'edit_document', roles: ['department_user', 'user'] },
    { to: '/risk-queue', label: 'Risk Queue', icon: 'query_stats', roles: ['admin'] },
    { to: '/block-optimization', label: 'Optimization', icon: 'alt_route', roles: ['admin'] },
    { to: '/admin-approval', label: 'Approvals', icon: 'pending_actions', roles: ['admin'] },
    { to: '/calendar', label: 'Block Calendar', icon: 'calendar_month', roles: ['admin', 'department_user', 'user'] },
    { to: '/live-map', label: 'Live GIS Map', icon: 'map', roles: ['admin', 'department_user', 'user'] },
    { to: '/reports', label: 'Impact Reports', icon: 'monitoring', roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-blue-200">
      {/* Top Header - Indian Railways / SIH Enterprise Theme */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-900 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                train
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900 tracking-tight leading-none">RailOpt AI</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Smart Railway Traffic & Block Operations</span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-1.5 ml-4">
            {navLinks
              .filter((link) => link.roles.includes(role))
              .map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="text-[10px] font-medium text-blue-700 uppercase tracking-wide">
                {role === 'admin' ? 'Section Controller (Admin)' : `${user?.department || 'Engineering'} Dept`}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Government Enterprise Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>RailOpt AI &mdash; Intelligent Decision Support System for Indian Railways</span>
          <span className="font-mono text-[11px] text-slate-400">Smart India Hackathon &bull; Ministry of Railways</span>
        </div>
      </footer>
    </div>
  );
}
