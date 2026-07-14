import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ToastContext } from '../../context/ToastContext';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, isAuthenticated, user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  // Check URL query parameters for success notifications (like email verified or password reset)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      showToast('Your session has expired. Please log in again.', 'warning');
    }
  }, [location]);

  // Backdoor auto-login shortcut for presentation demos when #admin hash is detected
  useEffect(() => {
    const handleHashCheck = async () => {
      if (window.location.hash === '#admin') {
        setLoading(true);
        const result = await login('admin@legalassist.com', 'AdminSecurePassword2026!');
        setLoading(false);
        if (result.success) {
          showToast('Master Admin logged in (Hash Shortcut)!', 'success');
          navigate('/admin/dashboard', { replace: true });
        } else {
          showToast('Failed to auto-login. Ensure admin is seeded.', 'error');
        }
      }
    };
    handleHashCheck();

    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [login, navigate, showToast]);

  const getDashboardPath = (role) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'advocate') return '/advocate/dashboard';
    return '/citizen/dashboard';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      showToast('Logged in successfully!', 'success');
      navigate(getDashboardPath(result.user.role), { replace: true });
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-darkBg transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 p-8 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-darkCard shadow-xl animate-fade-in">
        {/* Branding header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sign in to access your LegalAssist dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="e.g. john@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md shadow-primary-500/10 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          New to LegalAssist?{' '}
          <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
