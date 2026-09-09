import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const fillDemoAdmin = () => {
    setFormData({
      identifier: 'admin@blockvote.local',
      password: 'Admin#BV2026!SecP@ss',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(formData.identifier, formData.password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-500/10 border border-red-500/30 rounded-2xl mb-4 shadow-inner shadow-red-500/20">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <div className="inline-block px-3 py-1 bg-red-950/60 border border-red-800/60 rounded-full text-xs font-semibold text-red-300 tracking-wider uppercase mb-2">
            Restricted Admin Portal
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            System Administrator
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with authorized administrator credentials to manage platform governance, elections, and audit logs.
          </p>
        </div>

        {/* Demo Fast-Fill Helper */}
        <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-medium">
            <span className="flex items-center gap-1.5 text-red-300 font-semibold">
              <KeyRound className="w-4 h-4" /> Root Admin Credentials
            </span>
            <span className="text-slate-400">Local Environment</span>
          </div>
          <div className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Email / ID:</span>
              <span className="text-emerald-400">admin@blockvote.local</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Role:</span>
              <span className="text-red-400 font-semibold">SYSTEM ADMIN</span>
            </div>
          </div>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="w-full mt-3 py-1.5 px-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Fill Admin Credentials
          </button>
        </div>

        {/* Login Form */}
        <Card className="p-8 border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Administrator Identifier (Email or Voter ID)
              </label>
              <div className="relative">
                <Input
                  name="identifier"
                  type="text"
                  required
                  placeholder="admin@blockvote.local"
                  value={formData.identifier}
                  onChange={handleChange}
                  className="bg-slate-950/60 border-slate-700 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Master Secret Key / Password
              </label>
              <div className="relative">
                <Input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-slate-950/60 border-slate-700 focus:border-red-500 focus:ring-red-500 font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-900/30 text-white font-semibold flex items-center justify-center gap-2 border-0"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate Administrator</span>
                </>
              )}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-500">
              🛡️ All administrative access is cryptographically audited and recorded in the permanent audit ledger.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs">
              <Link
                to="/login"
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Voter Login
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
