import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
    { to: '/submit-request', label: 'Submit Request', icon: 'edit_document', roles: ['department_user'] },
    { to: '/risk-queue', label: 'Risk Queue', icon: 'query_stats', roles: ['admin'] },
    { to: '/block-optimization', label: 'Optimization', icon: 'alt_route', roles: ['admin'] },
    { to: '/admin-approval', label: 'Approvals', icon: 'pending_actions', roles: ['admin'] },
    { to: '/calendar', label: 'Block Calendar', icon: 'calendar_month', roles: ['admin', 'department_user'] },
    { to: '/reports', label: 'Impact Reports', icon: 'monitoring', roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-[#060e10] text-[#dce4e5] flex flex-col font-sans relative overflow-x-hidden">
      {/* Top Header */}
      <header className="bg-[#0a1417] border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full border border-[#00e5ff] flex items-center justify-center bg-[#0d1516] shadow-[0_0_8px_rgba(0,229,255,0.3)]">
              <span className="material-symbols-outlined text-[#00e5ff] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                train
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-[#00e5ff] tracking-tight leading-none">RailOpt AI</span>
              <span className="font-mono text-[9px] text-[#98d0da] tracking-widest uppercase">Ops Command</span>
            </div>
          </Link>

          <nav className="hidden md:flex space-x-1">
            {navLinks
              .filter((link) => link.roles.includes(role))
              .map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#00626e]/50 text-[#00e5ff] border border-[#00e5ff]/50 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                        : 'text-[#bac9cc] hover:bg-[#242b2d] hover:text-[#dce4e5]'
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
          <div className="hidden sm:block text-right">
            <div className="text-xs font-mono text-[#dce4e5]">{user?.email}</div>
            <div className="text-[11px] font-mono text-[#00e5ff]">
              {role === 'admin' ? 'Section Controller' : `${user?.department || 'Department'} User`}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-mono bg-[#242b2d] hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-[#3b494c] px-3 py-1.5 rounded-lg text-[#bac9cc] transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
