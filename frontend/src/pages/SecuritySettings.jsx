import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Shield,
  Smartphone,
  Laptop,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Calendar,
  Clock,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import Badge from '../components/ui/Badge';
import BiometricSetupModal from '../components/BiometricSetupModal';

const SecuritySettings = () => {
  const { user, listCredentials, renameCredential, removeCredential } = useAuth();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Rename inline state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCredentials = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listCredentials();
      setCredentials(list);
    } catch (err) {
      setError('Failed to load registered authenticators');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleStartRename = (cred) => {
    setEditingId(cred.id);
    setEditName(cred.deviceName);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveRename = async (id) => {
    if (!editName.trim()) return;
    try {
      await renameCredential(id, editName.trim());
      setSuccessMsg('Authenticator renamed successfully');
      setEditingId(null);
      await fetchCredentials();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rename authenticator');
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove the authenticator "${name}"?`)) {
      return;
    }

    try {
      await removeCredential(id);
      setSuccessMsg('Authenticator removed successfully');
      await fetchCredentials();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove authenticator');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="py-8 sm:py-12">
      <Container size="lg" className="max-w-4xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-indigo-950/60 border border-indigo-800/60 rounded-xl text-indigo-400">
                <Shield className="w-5 h-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Security & Biometrics
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Manage multi-factor passkeys, biometric devices, and security credentials.
            </p>
          </div>

          <Button
            onClick={() => setIsSetupOpen(true)}
            className="flex items-center gap-2 shadow-indigo-900/40 sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Add Biometric Device</span>
          </Button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="p-5 bg-slate-900/90 border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2-Step Auth Status
              </span>
              <Badge variant={credentials.length > 0 ? 'success' : 'warning'}>
                {credentials.length > 0 ? 'Active' : 'Action Needed'}
              </Badge>
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {credentials.length > 0 ? 'FIDO2 Enforced' : 'No Devices'}
            </div>
            <p className="text-xs text-slate-400">
              {credentials.length > 0
                ? 'Sign-in requires both password and biometric verification.'
                : 'Register an authenticator to enable 2-step protection.'}
            </p>
          </Card>

          <Card className="p-5 bg-slate-900/90 border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Registered Devices
              </span>
              <Fingerprint className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {credentials.length} {credentials.length === 1 ? 'Authenticator' : 'Authenticators'}
            </div>
            <p className="text-xs text-slate-400">
              Multiple devices supported (Touch ID, Face ID, USB Keys).
            </p>
          </Card>

          <Card className="p-5 bg-slate-900/90 border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Account Role
              </span>
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {user?.role === 'ADMIN' ? 'System Admin' : 'Voter'}
            </div>
            <p className="text-xs text-slate-400">
              {user?.role === 'ADMIN'
                ? 'High-privilege administrator access'
                : 'Ballot casting & election participation'}
            </p>
          </Card>
        </div>

        {/* Authenticators List */}
        <Card className="p-6 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Your Registered Authenticators</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {credentials.length} registered
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading authenticators...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <div className="mx-auto w-14 h-14 bg-indigo-950/50 border border-indigo-800/40 rounded-2xl flex items-center justify-center text-indigo-400 mb-4">
                <Fingerprint className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No authenticators registered yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                Protect your account with modern passwordless hardware security. Register your laptop Touch ID, mobile Face ID, or a FIDO2 security key.
              </p>
              <Button onClick={() => setIsSetupOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Register Your First Device</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-indigo-950/70 border border-indigo-800/50 rounded-xl text-indigo-400 flex-shrink-0 mt-0.5">
                      <Laptop className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      {editingId === cred.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-slate-900 border border-indigo-500 text-white text-sm rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Enter device nickname"
                          />
                          <button
                            onClick={() => handleSaveRename(cred.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1.5 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-base">
                            {cred.deviceName || 'My Authenticator'}
                          </span>
                          <button
                            onClick={() => handleStartRename(cred)}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          Added: {formatDate(cred.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Last Used: {formatDate(cred.lastUsedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleRemove(cred.id, cred.deviceName)}
                      className="px-3 py-1.5 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                      title="Remove authenticator"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Security Principles Architecture Card */}
        <Card className="p-6 bg-slate-900/60 border-slate-800">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Security & Biometric Architecture Guarantees
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
              <span className="font-semibold text-slate-200">Zero Raw Biometric Storage</span>
              <p className="text-slate-400">
                Your fingerprint or face scan is processed exclusively inside your device's Secure Enclave. The server receives only cryptographic signatures.
              </p>
            </div>
            <div className="space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
              <span className="font-semibold text-slate-200">Replay Attack Protection</span>
              <p className="text-slate-400">
                Every authentication uses a cryptographically random, short-lived, single-use server challenge.
              </p>
            </div>
            <div className="space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
              <span className="font-semibold text-slate-200">Phishing Resistant</span>
              <p className="text-slate-400">
                WebAuthn credentials are tied cryptographically to this application's domain origin.
              </p>
            </div>
            <div className="space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
              <span className="font-semibold text-slate-200">Immutable Audit Logging</span>
              <p className="text-slate-400">
                All passkey registration, authentication, and removal events are recorded in the security audit trail without exposing sensitive keys.
              </p>
            </div>
          </div>
        </Card>
      </Container>

      {/* Biometric Setup Modal */}
      <BiometricSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onSuccess={() => {
          setSuccessMsg('New biometric authenticator registered!');
          fetchCredentials();
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />
    </div>
  );
};

export default SecuritySettings;
