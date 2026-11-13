import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, LOGIN_STATES } from '../context/AuthContext';
import { LogIn, AlertCircle, User, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import BiometricPrompt from '../components/BiometricPrompt';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  const { login, loginState, cancelBiometric } = useAuth();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userRes = await login({ identifier, password });
      if (userRes?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricSuccess = (authenticatedUser) => {
    if (authenticatedUser.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleCancelBiometric = () => {
    cancelBiometric();
    setPendingUser(null);
  };

  return (
    <div className="py-12 sm:py-16">
      <Container size="sm" className="max-w-md">
        <Card className="bg-slate-900/95 border-slate-800 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-indigo-950/60 text-indigo-400 flex items-center justify-center rounded-xl mb-4 border border-indigo-800/50 shadow-inner">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Enter your Voter ID or Email and password to access the voting platform
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start space-x-3 text-red-300 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
            <Input
              label="Email or Voter ID"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. voter@example.com or VOTER123"
              leftIcon={User}
            />

            <Input
              label="Password"
              type="password"
              required
              showPasswordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full shadow-indigo-900/40 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </Button>
            </div>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              ⚡ Instant Demo Access (1-Click Login)
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={async () => {
                  setIdentifier('voter1@blockvote.local');
                  setPassword('Voter1#Pass2026!bv');
                  setLoading(true);
                  setError('');
                  try {
                    const u = await login({ identifier: 'voter1@blockvote.local', password: 'Voter1#Pass2026!bv' });
                    navigate('/dashboard');
                  } catch (e) {
                    setError('Demo login failed: ' + (e.response?.data?.error || e.message));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/60 text-xs text-left flex items-center justify-between text-slate-300 hover:text-white transition-all group"
              >
                <div>
                  <div className="font-semibold text-indigo-300">Voter Dashboard</div>
                  <div className="text-[10px] text-slate-500 font-mono">voter1@blockvote.local</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Sign In</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIdentifier('host@blockvote.local');
                  setPassword('Host#Pass2026!bv');
                  setLoading(true);
                  setError('');
                  try {
                    const u = await login({ identifier: 'host@blockvote.local', password: 'Host#Pass2026!bv' });
                    navigate('/dashboard');
                  } catch (e) {
                    setError('Demo login failed: ' + (e.response?.data?.error || e.message));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/60 text-xs text-left flex items-center justify-between text-slate-300 hover:text-white transition-all group"
              >
                <div>
                  <div className="font-semibold text-purple-300">Election Host Dashboard</div>
                  <div className="text-[10px] text-slate-500 font-mono">host@blockvote.local</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">Sign In</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIdentifier('admin@blockvote.local');
                  setPassword('Admin#BV2026!SecP@ss');
                  setLoading(true);
                  setError('');
                  try {
                    const u = await login({ identifier: 'admin@blockvote.local', password: 'Admin#BV2026!SecP@ss' });
                    navigate('/admin');
                  } catch (e) {
                    setError('Demo login failed: ' + (e.response?.data?.error || e.message));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-red-950/50 border border-slate-800 hover:border-red-500/60 text-xs text-left flex items-center justify-between text-slate-300 hover:text-white transition-all group"
              >
                <div>
                  <div className="font-semibold text-red-300">Admin Control Portal</div>
                  <div className="text-[10px] text-slate-500 font-mono">admin@blockvote.local</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">Sign In</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Register as a Voter
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Login;
