import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { login, signup, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect based on role
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') {
        navigate('/risk-queue', { replace: true });
      } else {
        navigate('/submit-request', { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  // Fetch departments for signup dropdown
  useEffect(() => {
    async function loadDepartments() {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      if (data && data.length > 0) {
        setDepartments(data);
        setSelectedDeptId(data[0].id);
      }
    }
    loadDepartments();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const result = await login({ email: email.trim(), password });
      if (result.error) {
        setErrorMsg(result.error.message || 'Invalid login credentials');
        setLoading(false);
        return;
      }

      // Role is determined entirely by users_profile.role from DB query in AuthContext
      const userRole = result.profile?.role || 'user';
      if (userRole === 'admin') {
        navigate('/risk-queue', { replace: true });
      } else {
        navigate('/submit-request', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const selectedDept = departments.find((d) => d.id === selectedDeptId);
      const result = await signup({
        email: email.trim(),
        password,
        departmentId: selectedDeptId,
        departmentName: selectedDept?.name || 'Engineering',
      });

      if (result.error) {
        console.error('[SignUp Error]:', result.error);
        setErrorMsg(result.error.message || 'Signup failed. Please try again.');
        setLoading(false);
        return;
      }

      // Successful signup with default role 'user'
      const userRole = result.profile?.role || 'user';
      if (userRole === 'admin') {
        navigate('/risk-queue', { replace: true });
      } else {
        navigate('/submit-request', { replace: true });
      }
    } catch (err) {
      console.error('[SignUp Exception]:', err);
      setErrorMsg(err.message || 'Registration error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col relative overflow-hidden selection:bg-blue-200 selection:text-blue-900">
      {/* High-Performance Clean Dark Railway Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-slate-50"></div>
        <div className="absolute inset-0 bg-transparent"></div>
        <div className="absolute inset-0 opacity-5 pointer-events-none"></div>
      </div>

      {/* Floating Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-lg">
          <div className="w-8 h-8 rounded-full border-2 border-blue-600 flex items-center justify-center bg-blue-50 shadow-sm">
            <span
              className="material-symbols-outlined text-blue-600 text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              train
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-black text-slate-800 tracking-wide leading-tight flex items-center gap-1.5">
              RailOpt <span className="text-blue-600">AI</span>
            </h1>
            <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">Central Rail Operations</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-blue-600 shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Content - Ultra-Translucent Glass Card */}
      <main className="flex-grow flex items-center justify-center p-4 z-10 relative">
        <div className="w-full max-w-md">
          {/* Glassmorphic Auth Card */}
          <div className="bg-white rounded-3xl p-7 sm:p-8 relative overflow-hidden transition-all duration-300 shadow-xl border border-slate-200">
            {/* Top Cyan Neon Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent "></div>

            {/* Header Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-600/30 text-[10px] font-mono text-blue-600 tracking-widest uppercase mb-2">
                <span className="material-symbols-outlined text-[12px]">security</span>
                Authorized Personnel Only
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Rail Operations Command</h2>
              <p className="text-xs text-slate-800/70 font-mono mt-0.5">Automated Traffic & Maintenance Coordination</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-center font-bold text-sm transition-all focus:outline-none cursor-pointer ${
                  activeTab === 'signin'
                    ? 'text-blue-600 border-b-2 border-blue-600 '
                    : 'text-slate-800/60 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 pb-3 text-center font-medium text-sm transition-all focus:outline-none cursor-pointer ${
                  activeTab === 'signup'
                    ? 'text-blue-600 border-b-2 border-blue-600 '
                    : 'text-slate-800/60 hover:text-slate-800'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 text-red-400">error</span>
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] shrink-0 text-emerald-400">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs font-medium text-slate-800/90 mb-1.5" htmlFor="login-email">
                    Official Email
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/80 text-[18px]">
                      badge
                    </span>
                    <input
                      className="bg-white border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-800/40 font-mono text-sm outline-none transition-all duration-200"
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., officer@railways.gov.in"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-mono text-xs font-medium text-slate-800/90" htmlFor="login-password">
                      Password
                    </label>
                  </div>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/80 text-[18px]">
                      lock
                    </span>
                    <input
                      className="bg-white border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-800/40 font-mono text-sm outline-none transition-all duration-200"
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 text-sm uppercase tracking-wider"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 font-mono">
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        Verifying Clearance...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">login</span>
                        <span>Enter Control Center</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs font-medium text-slate-800/90 mb-1.5" htmlFor="signup-email">
                    Official Email
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/80 text-[18px]">
                      mail
                    </span>
                    <input
                      className="bg-white border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-800/40 font-mono text-sm outline-none transition-all duration-200"
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g., engineer@railways.gov.in"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-medium text-slate-800/90 mb-1.5" htmlFor="signup-password">
                    Password
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600/80 text-[18px]">
                      lock
                    </span>
                    <input
                      className="bg-white border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full rounded-xl py-3 pl-11 pr-4 text-slate-800 placeholder:text-slate-800/40 font-mono text-sm outline-none transition-all duration-200"
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-medium text-slate-800/90 mb-1.5" htmlFor="signup-department">
                    Assigned Department
                  </label>
                  <div className="relative group">
                    <select
                      id="signup-department"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="bg-white border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full rounded-xl py-3 px-3 text-slate-800 font-mono text-xs outline-none cursor-pointer"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="bg-white text-slate-800">
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="block font-mono text-[10px] text-slate-800/60 mt-1">
                    Default clearance: Department Submitter (Role: user)
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 text-sm uppercase tracking-wider"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 font-mono">
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        Creating Account...
                      </span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        <span>Register Operational Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center px-8 py-3 w-full z-10 relative text-xs gap-2">
        <p className="text-slate-800/60 font-mono text-[10px] uppercase tracking-widest text-center sm:text-left">
          © 2026 RailOpt AI Operations. Indian Railways Section Command.
        </p>
        <div className="flex gap-4">
          <span className="text-slate-800/60 hover:text-blue-600 transition-colors font-mono text-[10px] uppercase tracking-widest cursor-pointer">
            Protocol Security
          </span>
          <span className="text-slate-800/60 hover:text-blue-600 transition-colors font-mono text-[10px] uppercase tracking-widest cursor-pointer">
            Audit Policy
          </span>
        </div>
      </footer>
    </div>
  );
}
